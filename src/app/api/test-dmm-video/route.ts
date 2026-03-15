import { NextResponse } from "next/server";

export const preferredRegion = "hnd1";
export const maxDuration = 30;

/**
 * GET /api/test-dmm-video
 * DMM APIのsampleMovieURL形式を確認し、動画ダウンロードをテスト
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiId = process.env.DMM_API_ID;
  const affiliateId = process.env.DMM_AFFILIATE_ID;

  if (!apiId || !affiliateId) {
    return NextResponse.json({ error: "DMM API credentials not configured" }, { status: 500 });
  }

  try {
    // DMM APIから1件取得
    const url = `https://api.dmm.com/affiliate/v3/ItemList?api_id=${apiId}&affiliate_id=${affiliateId}&site=FANZA&service=digital&floor=videoa&hits=1&sort=date&output=json`;
    const res = await fetch(url);
    const data = await res.json();
    const item = data.result?.items?.[0];

    if (!item) {
      return NextResponse.json({ error: "No items found" }, { status: 404 });
    }

    const contentId = item.content_id || item.product_id || "";
    const cid = contentId.toLowerCase();

    // DMM APIが返すsampleMovieURL全体を記録
    const sampleMovieURL = item.sampleMovieURL || {};

    // CDN URLの構築
    const firstChar = cid[0];
    const threeChars = cid.substring(0, 3);
    const cdnUrls = [
      `https://cc3001.dmm.co.jp/litevideo/freepv/${firstChar}/${threeChars}/${cid}/${cid}_mhb_w.mp4`,
      `https://cc3001.dmm.co.jp/litevideo/freepv/${firstChar}/${threeChars}/${cid}/${cid}_dmb_w.mp4`,
      `https://cc3001.dmm.co.jp/litevideo/freepv/${firstChar}/${threeChars}/${cid}/${cid}_sm_w.mp4`,
    ];

    // 全URLをテスト
    const results: Record<string, { status: number; contentType: string; size?: number }> = {};

    // APIのURLをテスト
    for (const [key, value] of Object.entries(sampleMovieURL)) {
      if (typeof value === "string" && value.startsWith("http")) {
        try {
          const r = await fetch(value, { method: "HEAD" });
          results[`api_${key}`] = {
            status: r.status,
            contentType: r.headers.get("content-type") || "",
          };
        } catch (e) {
          results[`api_${key}`] = { status: 0, contentType: String(e) };
        }
      }
    }

    // CDN URLをテスト
    for (const cdnUrl of cdnUrls) {
      try {
        const r = await fetch(cdnUrl, {
          method: "HEAD",
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        const quality = cdnUrl.match(/_(\w+)_w\.mp4/)?.[1] || "unknown";
        results[`cdn_${quality}`] = {
          status: r.status,
          contentType: r.headers.get("content-type") || "",
        };
      } catch (e) {
        const quality = cdnUrl.match(/_(\w+)_w\.mp4/)?.[1] || "unknown";
        results[`cdn_${quality}`] = { status: 0, contentType: String(e) };
      }
    }

    return NextResponse.json({
      content_id: contentId,
      title: item.title,
      sampleMovieURL,
      cdn_urls: cdnUrls,
      test_results: results,
      region: process.env.VERCEL_REGION || "unknown",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
