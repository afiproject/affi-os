import { NextResponse } from "next/server";
import { downloadVideo, uploadVideo } from "@/lib/x-api";
import { getAdminClient } from "@/lib/supabase/admin";

// GET /api/test-video — 動画ダウンロード＆アップロード診断
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // DBから動画URLを1件取得
  const db = getAdminClient();
  const { data: items } = await db
    .from("affiliate_items")
    .select("title, sample_video_url")
    .not("sample_video_url", "is", null)
    .neq("sample_video_url", "")
    .limit(1);

  const item = items?.[0];
  if (!item?.sample_video_url) {
    return NextResponse.json({ error: "No items with video URL found" });
  }

  results.video_url = item.sample_video_url;
  results.title = item.title;

  // Step 1: 動画ダウンロードテスト
  try {
    const startDl = Date.now();
    const buffer = await downloadVideo(item.sample_video_url);
    const dlTime = Date.now() - startDl;

    if (buffer) {
      results.download = {
        success: true,
        size_bytes: buffer.length,
        size_mb: (buffer.length / 1024 / 1024).toFixed(2),
        duration_ms: dlTime,
      };

      // Step 2: X APIへの動画アップロードテスト
      try {
        const startUp = Date.now();
        const uploadResult = await uploadVideo(buffer);
        const upTime = Date.now() - startUp;

        results.upload = {
          success: uploadResult.success,
          media_id: uploadResult.media_id,
          error: uploadResult.error,
          duration_ms: upTime,
        };
      } catch (e) {
        results.upload = { success: false, error: String(e) };
      }
    } else {
      results.download = {
        success: false,
        error: "downloadVideo returned null",
        duration_ms: dlTime,
      };
    }
  } catch (e) {
    results.download = { success: false, error: String(e) };
  }

  return NextResponse.json(results);
}
