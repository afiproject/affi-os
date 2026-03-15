import { NextResponse } from "next/server";

export const preferredRegion = ["hnd1"];
export const maxDuration = 30;

/**
 * GET /api/test-dmm-video
 * DMM APIのsampleMovieURL形式を確認し、動画ダウンロードをテスト
 * サンプル動画がある非VR作品で検証
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
    // DMM APIから5件取得（サンプル動画がある作品を探す）
    const url = `https://api.dmm.com/affiliate/v3/ItemList?api_id=${apiId}&affiliate_id=${affiliateId}&site=FANZA&service=digital&floor=videoa&hits=5&sort=date&output=json`;
    const res = await fetch(url);
    const data = await res.json();

    // サンプル動画があるアイテムを優先
    const items = data.result?.items || [];
    const itemWithSample = items.find(
      (i: Record<string, unknown>) => {
        const sm = i.sampleMovieURL as Record<string, string> | undefined;
        return sm && (sm.size_720_480 || sm.size_476_306);
      }
    ) || items[0];

    if (!itemWithSample) {
      return NextResponse.json({ error: "No items found" }, { status: 404 });
    }

    const item = itemWithSample;
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
    const results: Record<string, { status: number; contentType: string; contentLength?: string }> = {};

    // APIのURLをテスト
    for (const [key, value] of Object.entries(sampleMovieURL)) {
      if (typeof value === "string" && value.startsWith("http")) {
        try {
          const r = await fetch(value, { method: "HEAD" });
          results[`api_${key}`] = {
            status: r.status,
            contentType: r.headers.get("content-type") || "",
            contentLength: r.headers.get("content-length") || "",
          };
        } catch (e) {
          results[`api_${key}`] = { status: 0, contentType: String(e) };
        }
      }
    }

    // CDN URLをテスト（Refererヘッダー付き）
    for (const cdnUrl of cdnUrls) {
      try {
        const r = await fetch(cdnUrl, {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.dmm.co.jp/",
          },
        });
        const quality = cdnUrl.match(/_(\w+)_w\.mp4/)?.[1] || "unknown";
        results[`cdn_${quality}`] = {
          status: r.status,
          contentType: r.headers.get("content-type") || "",
          contentLength: r.headers.get("content-length") || "",
        };
      } catch (e) {
        const quality = cdnUrl.match(/_(\w+)_w\.mp4/)?.[1] || "unknown";
        results[`cdn_${quality}`] = { status: 0, contentType: String(e) };
      }
    }

    // 全アイテムのsampleMovieURL有無を記録
    const allItems = items.map((i: Record<string, unknown>) => ({
      content_id: i.content_id || i.product_id,
      title: (i.title as string || "").substring(0, 30),
      hasSampleMovie: !!(
        (i.sampleMovieURL as Record<string, string> | undefined)?.size_720_480 ||
        (i.sampleMovieURL as Record<string, string> | undefined)?.size_476_306
      ),
      sampleMovieURL: i.sampleMovieURL || {},
    }));

    return NextResponse.json({
      tested_item: {
        content_id: contentId,
        title: item.title,
        sampleMovieURL,
      },
      cdn_urls: cdnUrls,
      test_results: results,
      all_items: allItems,
      region: process.env.VERCEL_REGION || "unknown",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
