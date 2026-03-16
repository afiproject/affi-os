import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30;

/**
 * POST /api/clear-video-cache
 * 既存の低画質キャッシュをクリアし、sample_video_urlを中画質(_mhb_w)に更新
 * Authorization: Bearer yut000
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== "Bearer yut000") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminClient();

  // 1. cached_video_urlをクリア
  const { data: items, error: fetchError } = await db
    .from("affiliate_items")
    .select("id, external_id, cached_video_url, sample_video_url")
    .not("cached_video_url", "is", null);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let clearedCount = 0;
  let urlUpdatedCount = 0;

  for (const item of items || []) {
    // cached_video_urlをクリア
    await db
      .from("affiliate_items")
      .update({ cached_video_url: null })
      .eq("id", item.id);
    clearedCount++;

    // Supabase Storageの古いファイルを削除
    if (item.external_id) {
      await db.storage
        .from("video-cache")
        .remove([`videos/${item.external_id}.mp4`]);
    }
  }

  // 2. sample_video_urlの_sm_wを_mhb_wに更新
  const { data: smItems, error: smError } = await db
    .from("affiliate_items")
    .select("id, sample_video_url")
    .like("sample_video_url", "%_sm_w.mp4%");

  if (!smError && smItems) {
    for (const item of smItems) {
      const newUrl = item.sample_video_url.replace("_sm_w.mp4", "_mhb_w.mp4");
      await db
        .from("affiliate_items")
        .update({ sample_video_url: newUrl })
        .eq("id", item.id);
      urlUpdatedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    cleared_cache: clearedCount,
    updated_urls: urlUpdatedCount,
    message: "キャッシュクリア完了。次回アクセス時に中画質で再キャッシュされます。",
  });
}
