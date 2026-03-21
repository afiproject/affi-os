import { NextResponse } from "next/server";
import { isDemoMode, getAdminClient } from "@/lib/supabase/admin";
import { downloadVideo, trimVideoToMiddle } from "@/lib/x-api";
import {
  getItemsNeedingVideoCache,
  updateCachedVideoUrl,
  startWorkflow,
  completeWorkflow,
  logError,
} from "@/lib/db";

const BUCKET_NAME = "video-cache";
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB制限

/**
 * Supabase Storageバケットが存在するか確認し、なければ作成
 */
async function ensureBucket(): Promise<void> {
  const db = getAdminClient();
  const { data } = await db.storage.getBucket(BUCKET_NAME);
  if (!data) {
    await db.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_VIDEO_SIZE,
    });
  }
}

/**
 * 動画をSupabase Storageにアップロードし、公開URLを返す
 */
async function uploadToStorage(
  videoBuffer: Buffer,
  fileName: string
): Promise<string | null> {
  const db = getAdminClient();
  const path = `videos/${fileName}`;

  const { error } = await db.storage
    .from(BUCKET_NAME)
    .upload(path, videoBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) {
    console.error(`[cache-videos] Storage upload error: ${error.message}`);
    return null;
  }

  const { data: urlData } = db.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// GET /api/cron/cache-videos — 動画キャッシュジョブ
// collect後に実行: FANZA CDNから動画をダウンロードしSupabase Storageに保存
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      workflow: "cache-videos",
      cached: 0,
      timestamp: new Date().toISOString(),
    });
  }

  const workflowId = await startWorkflow("cache-videos");

  try {
    await ensureBucket();

    // URLパラメータでlimit指定可能（pipeline経由は少なめにしてタイムアウト防止）
    const url = new URL(request.url, "http://localhost");
    const cacheLimit = parseInt(url.searchParams.get("limit") || "10", 10);
    const items = await getItemsNeedingVideoCache(cacheLimit);
    let cachedCount = 0;
    let failedCount = 0;

    for (const item of items) {
      if (!item.sample_video_url) continue;

      try {
        console.log(`[cache-videos] Downloading: ${item.title} (${item.external_id})`);
        const videoBuffer = await downloadVideo(item.sample_video_url);

        if (!videoBuffer) {
          console.log(`[cache-videos] Download failed for ${item.external_id}`);
          failedCount++;
          continue;
        }

        if (videoBuffer.length > MAX_VIDEO_SIZE) {
          console.log(`[cache-videos] Video too large (${videoBuffer.length} bytes): ${item.external_id}`);
          failedCount++;
          continue;
        }

        // キャッシュ時にトリミング（冒頭タイトル除去）
        console.log(`[cache-videos] Trimming video: ${item.external_id} (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB)`);
        const trimmedBuffer = await trimVideoToMiddle(videoBuffer);
        const wasTrimmed = trimmedBuffer.length !== videoBuffer.length;
        console.log(`[cache-videos] Trim result: ${wasTrimmed ? "trimmed" : "unchanged"} (${(trimmedBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

        const fileName = `${item.external_id}.mp4`;
        const publicUrl = await uploadToStorage(trimmedBuffer, fileName);

        if (publicUrl) {
          await updateCachedVideoUrl(item.id, publicUrl);
          cachedCount++;
          console.log(`[cache-videos] Cached: ${item.external_id} → ${publicUrl}`);
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`[cache-videos] Error for ${item.external_id}: ${String(error)}`);
        failedCount++;
      }
    }

    await completeWorkflow(workflowId, cachedCount);

    return NextResponse.json({
      success: true,
      workflow: "cache-videos",
      items_found: items.length,
      cached: cachedCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
    await completeWorkflow(workflowId, 0, errMsg).catch(() => {});
    await logError("cron/cache-videos", errMsg).catch(() => {});
    return NextResponse.json(
      { error: "Video caching failed", details: errMsg },
      { status: 500 }
    );
  }
}
