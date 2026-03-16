import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

// GET /api/test-video — 動画ダウンロード詳細診断
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

  const videoUrl = item.sample_video_url;
  results.video_url = videoUrl;
  results.title = item.title;

  // URLバリエーションを生成
  const urls = [videoUrl];
  if (videoUrl.includes("_mhb_w.mp4")) {
    urls.push(
      videoUrl.replace("_mhb_w.mp4", "_dmb_w.mp4"),
      videoUrl.replace("_mhb_w.mp4", "_sm_w.mp4")
    );
  }

  // 各URLを直接fetchして詳細情報を返す
  const fetchResults = [];
  for (const url of urls) {
    try {
      const start = Date.now();
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        redirect: "follow",
      });
      const elapsed = Date.now() - start;

      const contentType = res.headers.get("content-type") || "";
      const contentLength = res.headers.get("content-length") || "";
      const allHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { allHeaders[k] = v; });

      // ボディの最初の数バイトだけ読む
      let bodyPreview = "";
      let bodySize = 0;
      try {
        const arrayBuffer = await res.arrayBuffer();
        bodySize = arrayBuffer.byteLength;
        // テキストっぽいレスポンスの場合は内容表示
        if (!contentType.includes("video") && !contentType.includes("octet-stream")) {
          const text = new TextDecoder().decode(new Uint8Array(arrayBuffer).slice(0, 500));
          bodyPreview = text;
        }
      } catch (e) {
        bodyPreview = `Error reading body: ${String(e)}`;
      }

      fetchResults.push({
        url: url.slice(-40),
        status: res.status,
        statusText: res.statusText,
        contentType,
        contentLength,
        bodySize,
        bodyPreview: bodyPreview || undefined,
        elapsed_ms: elapsed,
        headers: allHeaders,
      });
    } catch (e) {
      fetchResults.push({
        url: url.slice(-40),
        error: String(e),
      });
    }
  }

  results.fetch_results = fetchResults;

  return NextResponse.json(results);
}
