import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { updateCachedVideoUrl } from "@/lib/db";
import { trimVideoToMiddle } from "@/lib/x-api";

export const maxDuration = 60;
// 東京リージョンで実行（FANZA CDNの地域制限を回避）
export const preferredRegion = ["hnd1"];

const BUCKET_NAME = "video-cache";
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/proxy-video
 * サーバーサイドで動画をダウンロードしてSupabase Storageにキャッシュ
 * ブラウザのCORS制限を回避するためのプロキシ
 * Body: { item_id, external_id, video_url }
 */
export async function POST(request: Request) {
  try {
    const { item_id, external_id, video_url } = await request.json();

    if (!item_id || !external_id || !video_url) {
      return NextResponse.json(
        { error: "item_id, external_id, video_url are required" },
        { status: 400 }
      );
    }

    // サーバーサイドで動画をダウンロード（CORS制限なし）
    console.log(`[proxy-video] Downloading: ${video_url}`);

    // FANZA CDN URLの場合、軽量版を最優先でフォールバック
    const urls: string[] = [];
    if (video_url.includes("cc3001.dmm.co.jp")) {
      // _mhb_w（中画質〜15MB）を最優先、次に_sm_w（軽量〜6MB）
      const base = video_url.replace(/_(?:sm|mhb|dmb)_w\.mp4$/, "");
      urls.push(`${base}_mhb_w.mp4`, `${base}_sm_w.mp4`);
    } else {
      urls.push(video_url);
    }

    let videoBuffer: Buffer | null = null;
    for (const url of urls) {
      try {
        console.log(`[proxy-video] Trying: ${url}`);
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!res.ok) {
          console.log(`[proxy-video] ${res.status} for ${url}`);
          continue;
        }
        // Content-Lengthで事前にサイズチェック（巨大ファイルのDLを回避）
        const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
        if (contentLength > MAX_VIDEO_SIZE) {
          console.log(`[proxy-video] Too large (${contentLength} bytes), skipping: ${url}`);
          continue;
        }
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer.byteLength > 0) {
          videoBuffer = Buffer.from(arrayBuffer);
          console.log(`[proxy-video] Downloaded ${videoBuffer.length} bytes from ${url}`);
          break;
        }
      } catch (err) {
        console.log(`[proxy-video] Error for ${url}: ${String(err)}`);
      }
    }

    if (!videoBuffer) {
      return NextResponse.json(
        { error: "Failed to download video from all URLs", urls },
        { status: 502 }
      );
    }

    if (videoBuffer.length > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `Video too large: ${videoBuffer.length} bytes` },
        { status: 400 }
      );
    }

    // キャッシュ前にトリミング（冒頭タイトル除去）
    console.log(`[proxy-video] Trimming video (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB)...`);
    const trimmedBuffer = await trimVideoToMiddle(videoBuffer);
    const wasTrimmed = trimmedBuffer.length !== videoBuffer.length;
    console.log(`[proxy-video] Trim: ${wasTrimmed ? "trimmed" : "unchanged"} → ${(trimmedBuffer.length / 1024 / 1024).toFixed(1)}MB`);
    videoBuffer = trimmedBuffer;

    // Supabase Storageにアップロード
    const db = getAdminClient();

    const { data: bucket } = await db.storage.getBucket(BUCKET_NAME);
    if (!bucket) {
      await db.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_VIDEO_SIZE,
      });
    }

    const path = `videos/${external_id}.mp4`;
    const { error: uploadError } = await db.storage
      .from(BUCKET_NAME)
      .upload(path, videoBuffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload to storage failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = db.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    // DBのcached_video_urlを更新
    await updateCachedVideoUrl(item_id, publicUrl);

    console.log(`[proxy-video] Cached: ${publicUrl} (${videoBuffer.length} bytes)`);

    return NextResponse.json({
      success: true,
      cached_video_url: publicUrl,
      size: videoBuffer.length,
    });
  } catch (error) {
    console.error(`[proxy-video] Error: ${String(error)}`);
    return NextResponse.json(
      { error: `Proxy video failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
