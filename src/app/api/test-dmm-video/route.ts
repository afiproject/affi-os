import { NextResponse } from "next/server";

export const preferredRegion = ["hnd1"];
export const maxDuration = 30;

/**
 * GET /api/test-dmm-video
 * プレイヤーページ → html5_player iframe → 動画URLを段階的に抽出
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
    // DMM APIからサンプル動画がある作品を取得
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
    const playerUrl = sampleMovieURL.size_720_480 || sampleMovieURL.size_476_306;

    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    const steps: Record<string, unknown> = {};

    // Step 1: プレイヤーページを取得 → iframe URLを抽出
    let iframeUrl = "";
    let realCid = "";
    if (playerUrl) {
      const playerRes = await fetch(playerUrl, { headers: { "User-Agent": ua } });
      const playerHtml = await playerRes.text();

      // iframe src を抽出
      const iframeMatch = playerHtml.match(/iframe\s+src="([^"]+html5_player[^"]+)"/);
      iframeUrl = iframeMatch?.[1] || "";

      // CIDを抽出
      const cidMatch = iframeUrl.match(/cid=([^/]+)/);
      realCid = cidMatch?.[1] || "";

      steps.step1_player = {
        url: playerUrl,
        html_length: playerHtml.length,
        iframe_url: iframeUrl,
        real_cid: realCid,
      };
    }

    // Step 2: html5_player iframe を取得 → 動画URLを抽出
    let videoUrls: string[] = [];
    if (iframeUrl) {
      const iframeRes = await fetch(iframeUrl, {
        headers: { "User-Agent": ua, "Referer": "https://www.dmm.co.jp/" },
      });
      const iframeHtml = await iframeRes.text();

      // .mp4 URLを抽出
      const mp4Matches = iframeHtml.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/g) || [];
      videoUrls = [...new Set(mp4Matches)];

      // srcやsource タグからも抽出
      const srcMatches = iframeHtml.match(/src["\s]*[:=]["\s]*["']?(https?:\/\/[^"'\s<>]+)['"]/g) || [];

      steps.step2_iframe = {
        url: iframeUrl,
        html_length: iframeHtml.length,
        html_preview: iframeHtml.substring(0, 3000),
        found_mp4_urls: videoUrls,
        found_src_urls: srcMatches,
      };
    }

    // Step 3: 正しいCIDでCDN URLを構築してテスト
    const testResults: Record<string, { status: number; contentType: string; contentLength: string }> = {};

    if (realCid) {
      const cid = realCid.toLowerCase();
      const firstChar = cid[0];
      const threeChars = cid.substring(0, 3);
      const cdnPatterns = [
        `https://cc3001.dmm.co.jp/litevideo/freepv/${firstChar}/${threeChars}/${cid}/${cid}_mhb_w.mp4`,
        `https://cc3001.dmm.co.jp/litevideo/freepv/${firstChar}/${threeChars}/${cid}/${cid}_dmb_w.mp4`,
        `https://cc3001.dmm.co.jp/litevideo/freepv/${firstChar}/${threeChars}/${cid}/${cid}_sm_w.mp4`,
      ];

      for (const cdnUrl of cdnPatterns) {
        try {
          const r = await fetch(cdnUrl, {
            method: "HEAD",
            headers: { "User-Agent": ua, "Referer": "https://www.dmm.co.jp/" },
          });
          const quality = cdnUrl.match(/_(\w+)_w\.mp4/)?.[1] || "unknown";
          testResults[`cdn_realcid_${quality}`] = {
            status: r.status,
            contentType: r.headers.get("content-type") || "",
            contentLength: r.headers.get("content-length") || "",
          };
        } catch (e) {
          const quality = cdnUrl.match(/_(\w+)_w\.mp4/)?.[1] || "unknown";
          testResults[`cdn_realcid_${quality}`] = { status: 0, contentType: String(e), contentLength: "" };
        }
      }
    }

    // iframe内やプレイヤーから見つけたURLもテスト
    for (const vUrl of videoUrls) {
      try {
        const r = await fetch(vUrl, {
          method: "HEAD",
          headers: { "User-Agent": ua, "Referer": "https://www.dmm.co.jp/" },
        });
        testResults[`extracted: ${vUrl.substring(0, 80)}`] = {
          status: r.status,
          contentType: r.headers.get("content-type") || "",
          contentLength: r.headers.get("content-length") || "",
        };
      } catch (e) {
        testResults[`extracted: ${vUrl.substring(0, 80)}`] = { status: 0, contentType: String(e), contentLength: "" };
      }
    }

    return NextResponse.json({
      content_id: contentId,
      real_cid: realCid,
      title: item.title,
      steps,
      test_results: testResults,
      region: process.env.VERCEL_REGION || "unknown",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
