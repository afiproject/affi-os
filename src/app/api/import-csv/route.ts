import { NextResponse } from "next/server";
import {
  createNoimosImport,
  updateNoimosImport,
  createNoimosImportRow,
  updateNoimosImportRow,
  getFirstActiveAccount,
  createScheduledPost,
  logError,
  getNoimosImports,
  getNoimosImportRows,
} from "@/lib/db";
import { getAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 120;

// ========================================
// Noimos AI CSV Import API
// ========================================
// CSVフォーマット（ヘッダー必須）:
//   scheduled_time, body_text, hashtags, video_url, thumbnail_url, affiliate_url, category, tags, post_mode
//
// scheduled_time: "10:00" or "2026-03-17T10:00:00" (HH:MM = 今日 or 翌日)
// hashtags: "#tag1 #tag2" (スペース区切り)
// tags: "tag1,tag2" (カンマ区切り)
// post_mode: "A" or "B" (省略時 A)
// ========================================

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // ヘッダー解析
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"/, "").replace(/"$/, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSVパース（ダブルクォート対応）
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && (j === 0 || line[j - 1] !== "\\")) {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || "";
    }
    rows.push(row);
  }

  return rows;
}

function parseScheduledTime(timeStr: string): Date {
  const now = new Date();

  // ISO形式 (2026-03-17T10:00:00)
  if (timeStr.includes("T") || timeStr.includes("-")) {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // HH:MM形式
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const scheduled = new Date(now);
    scheduled.setHours(hour, minute, 0, 0);
    // 既に過ぎていたら翌日
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    return scheduled;
  }

  // パースできなかった場合、1時間後
  return new Date(now.getTime() + 60 * 60 * 1000);
}

// POST /api/import-csv — CSVインポート
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let csvText: string;
    let filename = "import.csv";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      csvText = await file.text();
      filename = file.name;
    } else {
      // JSON body with csv_text field, or raw CSV
      const body = await request.text();
      try {
        const json = JSON.parse(body);
        csvText = json.csv_text || json.data || "";
        filename = json.filename || "api-import.csv";
      } catch {
        csvText = body;
      }
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });
    }

    // アカウント取得
    const account = await getFirstActiveAccount();
    if (!account) {
      return NextResponse.json({ error: "No active account found" }, { status: 500 });
    }

    // インポートレコード作成
    const importId = await createNoimosImport({
      filename,
      rows_total: rows.length,
    });

    let processed = 0;
    let failed = 0;
    const results: { row: number; status: string; scheduled_at?: string; error?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const bodyText = row.body_text || row.text || row.content || "";
        if (!bodyText.trim()) {
          failed++;
          results.push({ row: i + 1, status: "skipped", error: "Empty body_text" });
          continue;
        }

        const scheduledTime = row.scheduled_time || row.time || row.schedule || "";
        const hashtags = (row.hashtags || "")
          .split(/[\s,]+/)
          .filter((h: string) => h.startsWith("#"));
        const videoUrl = row.video_url || row.video || "";
        const thumbnailUrl = row.thumbnail_url || row.thumbnail || row.image || "";
        const affiliateUrl = row.affiliate_url || row.url || row.link || "";
        const category = row.category || "";
        const tags = (row.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean);
        const postMode = row.post_mode || "A";
        const metadata = {
          engagement_prediction: row.engagement_prediction || row.engagement || "",
          best_time_reason: row.best_time_reason || row.reason || "",
          noimos_score: row.score || "",
        };

        // Import rowを保存
        const rowId = await createNoimosImportRow({
          import_id: importId,
          row_number: i + 1,
          scheduled_time: scheduledTime,
          body_text: bodyText,
          hashtags,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          affiliate_url: affiliateUrl,
          category,
          tags,
          post_mode: postMode,
          metadata,
        });

        // ダミーの candidate + variant を作成してスケジュール登録
        const scheduledAt = parseScheduledTime(scheduledTime);
        const db = getAdminClient();

        // affiliate_itemsにダミーアイテムを作成（外部データ用）
        const { data: sourceData } = await db
          .from("affiliate_sources")
          .select("id")
          .eq("is_active", true)
          .limit(1)
          .single();

        let sourceId = sourceData?.id;
        if (!sourceId) {
          // ソースがなければ作成
          const { data: newSource } = await db
            .from("affiliate_sources")
            .insert({ name: "Noimos AI", type: "noimos", base_url: "" })
            .select("id")
            .single();
          sourceId = newSource?.id;
        }

        // アイテム作成
        const externalId = `noimos-${importId}-${i + 1}`;
        const { data: item } = await db
          .from("affiliate_items")
          .insert({
            source_id: sourceId,
            external_id: externalId,
            title: bodyText.slice(0, 60),
            description: bodyText,
            category,
            tags,
            thumbnail_url: thumbnailUrl,
            sample_video_url: videoUrl,
            affiliate_url: affiliateUrl,
            popularity_score: 80,
            freshness_score: 100,
          })
          .select("id")
          .single();

        if (!item) throw new Error("Failed to create affiliate_item");

        // 候補作成
        const { data: candidate } = await db
          .from("candidate_posts")
          .insert({
            item_id: item.id,
            account_id: account.id,
            status: "approved",
            ai_score: 90,
            total_score: 90,
            estimated_ctr: 5.0,
            recommended_time: scheduledTime,
            recommendation_reason: "Noimos AI recommendation",
          })
          .select("id")
          .single();

        if (!candidate) throw new Error("Failed to create candidate_post");

        // バリアント作成
        const fullHashtags = hashtags.length > 0 ? hashtags : [];
        const { data: variant } = await db
          .from("candidate_post_variants")
          .insert({
            candidate_id: candidate.id,
            variant_label: "N",
            body_text: bodyText,
            tone: "noimos",
            length: "medium",
            hashtags: fullHashtags,
            is_selected: true,
          })
          .select("id")
          .single();

        if (!variant) throw new Error("Failed to create variant");

        // スケジュール登録
        // custom_body_textを使ってNoimosの原文をそのまま投稿
        const fullText = [
          bodyText,
          fullHashtags.length > 0 ? "\n" + fullHashtags.join(" ") : "",
          affiliateUrl ? "\n" + affiliateUrl : "",
        ].join("");

        const scheduledPostId = await createScheduledPost({
          candidate_id: candidate.id,
          account_id: account.id,
          variant_id: variant.id,
          scheduled_at: scheduledAt.toISOString(),
          post_mode: postMode,
          custom_body_text: fullText,
        });

        // Import row更新
        await updateNoimosImportRow(rowId, {
          status: "scheduled",
          scheduled_post_id: scheduledPostId,
        });

        processed++;
        results.push({
          row: i + 1,
          status: "scheduled",
          scheduled_at: scheduledAt.toISOString(),
        });

        console.log(`[import-csv] Row ${i + 1}: scheduled at ${scheduledAt.toISOString()}`);
      } catch (err) {
        failed++;
        results.push({ row: i + 1, status: "failed", error: String(err) });
        console.error(`[import-csv] Row ${i + 1} failed:`, err);
      }
    }

    // インポートレコード更新
    await updateNoimosImport(importId, {
      rows_processed: processed,
      rows_failed: failed,
      status: failed === rows.length ? "failed" : "completed",
    });

    return NextResponse.json({
      success: true,
      import_id: importId,
      total: rows.length,
      processed,
      failed,
      results,
    });
  } catch (error) {
    await logError("import-csv", String(error));
    return NextResponse.json(
      { error: "Import failed", details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/import-csv — インポート履歴
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const importId = url.searchParams.get("import_id");

    if (importId) {
      const rows = await getNoimosImportRows(importId);
      return NextResponse.json({ success: true, rows });
    }

    const imports = await getNoimosImports();
    return NextResponse.json({ success: true, imports });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch imports", details: String(error) },
      { status: 500 }
    );
  }
}
