import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { updateCachedVideoUrl } from "@/lib/db";

const BUCKET_NAME = "video-cache";
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/cache-video
 * ブラウザから動画をアップロードしてSupabase Storageにキャッシュ
 * Body: FormData with fields: item_id, external_id, video (File)
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const itemId = formData.get("item_id") as string;
    const externalId = formData.get("external_id") as string;
    const videoFile = formData.get("video") as File | null;

    if (!itemId || !externalId || !videoFile) {
      return NextResponse.json(
        { error: "item_id, external_id, video are required" },
        { status: 400 }
      );
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `Video too large: ${videoFile.size} bytes (max ${MAX_VIDEO_SIZE})` },
        { status: 400 }
      );
    }

    const db = getAdminClient();

    // バケット確認・作成
    const { data: bucket } = await db.storage.getBucket(BUCKET_NAME);
    if (!bucket) {
      await db.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_VIDEO_SIZE,
      });
    }

    // アップロード
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const path = `videos/${externalId}.mp4`;

    const { error: uploadError } = await db.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = db.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    // DBのcached_video_urlを更新
    await updateCachedVideoUrl(itemId, publicUrl);

    return NextResponse.json({
      success: true,
      cached_video_url: publicUrl,
      size: buffer.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Cache video failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
