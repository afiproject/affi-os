import { NextResponse } from "next/server";

export const preferredRegion = ["hnd1"];
export const maxDuration = 30;

/**
 * GET /api/test-dmm-video
 * DMM APIのプレイヤーページHTMLから実際の動画URLを抽出してテスト
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

    const items = data.result?.items || [];
    const itemWithSample = items.find(
      (i: Record<string, unknown>) => {
        const sm = i.sampleMovieURL as Record<string, string> | undefined;
        return sm && (sm.size_720_480 || sm.size_476_306);
      }
    );

    if (!itemWithSample) {
      return NextResponse.json({ error: "No items with sample video found" }, { status: 404 });
    }

    const item = itemWithSample;
    const contentId = item.content_id || item.product_id || "";
    const sampleMovieURL = item.sampleMovieURL || {};

    // プレイヤーページのHTMLを取得して動画URLを抽出
    const playerUrl = sampleMovieURL.size_720_480 || sampleMovieURL.size_476_306;
    let playerHtml = "";
    let extractedVideoUrls: string[] = [];

    if (playerUrl) {
      const playerRes = await fetch(playerUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      playerHtml = await playerRes.text();

      // HTMLから.mp4 URLを抽出（src="...mp4", URL直接記載など）
      const mp4Matches = playerHtml.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/g) || [];
      extractedVideoUrls = [...new Set(mp4Matches)];
    }

    // 抽出したURLをテスト
    const videoTestResults: Record<string, { status: number; contentType: string; contentLength: string }> = {};

    for (const videoUrl of extractedVideoUrls) {
      try {
        const r = await fetch(videoUrl, {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.dmm.co.jp/",
          },
        });
        videoTestResults[videoUrl] = {
          status: r.status,
          contentType: r.headers.get("content-type") || "",
          contentLength: r.headers.get("content-length") || "",
        };
      } catch (e) {
        videoTestResults[videoUrl] = { status: 0, contentType: String(e), contentLength: "" };
      }
    }

    // CDN URLも構築してテスト
    const cid = contentId.toLowerCase();
    const firstChar = cid[0];
    const threeChars = cid.substring(0, 3);
    const cdnUrl = `https://cc3001.dmm.co.jp/litevideo/freepv/${firstChar}/${threeChars}/${cid}/${cid}_sm_w.mp4`;

    try {
      const r = await fetch(cdnUrl, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://www.dmm.co.jp/",
        },
      });
      videoTestResults[`cdn_constructed: ${cdnUrl}`] = {
        status: r.status,
        contentType: r.headers.get("content-type") || "",
        contentLength: r.headers.get("content-length") || "",
      };
    } catch (e) {
      videoTestResults[`cdn_constructed: ${cdnUrl}`] = { status: 0, contentType: String(e), contentLength: "" };
    }

    return NextResponse.json({
      content_id: contentId,
      title: item.title,
      player_url: playerUrl,
      player_html_length: playerHtml.length,
      player_html_preview: playerHtml.substring(0, 2000),
      extracted_video_urls: extractedVideoUrls,
      video_test_results: videoTestResults,
      region: process.env.VERCEL_REGION || "unknown",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
