// ========================================
// Posting Adapter
// 投稿先プラットフォームの抽象インターフェース
// ========================================

import { postTweet, deleteTweet, isXApiConfigured, uploadVideo, downloadVideo, uploadImageFromUrl } from "@/lib/x-api";

export interface PostResult {
  success: boolean;
  external_post_id?: string;
  reply_post_id?: string;
  error_message?: string;
  posted_at: string;
  media_debug?: {
    video_url_used?: string;
    video_download_ok?: boolean;
    video_download_bytes?: number;
    video_upload_ok?: boolean;
    video_upload_error?: string;
    thumbnail_fallback?: boolean;
    thumbnail_upload_ok?: boolean;
    thumbnail_upload_error?: string;
    final_media_id?: string;
  };
}

export interface PostingAdapter {
  readonly platform: string;
  post(text: string, options?: PostOptions): Promise<PostResult>;
  deletePost(externalId: string): Promise<boolean>;
}

export interface PostOptions {
  post_mode?: "A" | "B";
  video_url?: string;
  cached_video_url?: string;
  affiliate_url?: string;
  thumbnail_url?: string;
}

// ---------- Demo Adapter ----------
export class DemoPostingAdapter implements PostingAdapter {
  readonly platform = "demo";

  async post(text: string): Promise<PostResult> {
    await new Promise((r) => setTimeout(r, 500));
    console.log("[DEMO] Would post:", text.slice(0, 80));
    return {
      success: true,
      external_post_id: `demo-${Date.now()}`,
      posted_at: new Date().toISOString(),
    };
  }

  async deletePost(): Promise<boolean> {
    return true;
  }
}

// ---------- X (Twitter) Adapter ----------
export class XPostingAdapter implements PostingAdapter {
  readonly platform = "x";

  async post(text: string, options?: PostOptions): Promise<PostResult> {
    if (!isXApiConfigured()) {
      console.warn("X API key not configured, using demo mode");
      return new DemoPostingAdapter().post(text);
    }

    const postMode = options?.post_mode || "A";
    const cachedVideoUrl = options?.cached_video_url;
    const videoUrl = options?.video_url;
    const affiliateUrl = options?.affiliate_url;
    const thumbnailUrl = options?.thumbnail_url;

    console.log(`[XPostingAdapter] Starting post: mode=${postMode}, videoUrl=${videoUrl || "(none)"}, cachedVideoUrl=${cachedVideoUrl || "(none)"}, thumbnailUrl=${thumbnailUrl || "(none)"}, textLength=${text.length}`);

    // 診断情報を収集
    const debug: PostResult["media_debug"] = {};

    // 動画がある場合はアップロード（キャッシュURLを優先）
    let mediaId: string | undefined;
    const effectiveVideoUrl = cachedVideoUrl || videoUrl;
    if (effectiveVideoUrl) {
      debug.video_url_used = effectiveVideoUrl;
      console.log(`[XPostingAdapter] Downloading video: ${effectiveVideoUrl}${cachedVideoUrl ? " (cached)" : ""}`);
      const videoBuffer = await downloadVideo(effectiveVideoUrl);
      debug.video_download_ok = !!videoBuffer;
      debug.video_download_bytes = videoBuffer?.length || 0;
      if (videoBuffer) {
        console.log(`[XPostingAdapter] Uploading video (${videoBuffer.length} bytes)`);
        const uploadResult = await uploadVideo(videoBuffer);
        debug.video_upload_ok = uploadResult.success;
        if (uploadResult.success && uploadResult.media_id) {
          mediaId = uploadResult.media_id;
          console.log(`[XPostingAdapter] Video uploaded: media_id=${mediaId}`);
        } else {
          debug.video_upload_error = uploadResult.error;
          console.error(`[XPostingAdapter] Video upload failed: ${uploadResult.error}`);
        }
      }
    }

    // 動画が使えなかった場合、サムネ画像をフォールバックで添付
    if (!mediaId && thumbnailUrl) {
      debug.thumbnail_fallback = true;
      console.log(`[XPostingAdapter] Video unavailable, using thumbnail: ${thumbnailUrl}`);
      const imgResult = await uploadImageFromUrl(thumbnailUrl);
      debug.thumbnail_upload_ok = imgResult.success;
      if (imgResult.success && imgResult.media_id) {
        mediaId = imgResult.media_id;
        console.log(`[XPostingAdapter] Thumbnail uploaded: media_id=${mediaId}`);
      } else {
        debug.thumbnail_upload_error = imgResult.error;
        console.error(`[XPostingAdapter] Thumbnail upload failed: ${imgResult.error}`);
      }
    }

    debug.final_media_id = mediaId;

    if (postMode === "B" && affiliateUrl) {
      // モードB: 動画+テキスト → リプライにリンク
      let mainResult = await postTweet(text, { media_id: mediaId });

      // 動画関連の403エラー → サムネイルにフォールバックしてリトライ
      if (!mainResult.success && mediaId && mainResult.error?.includes("403") && thumbnailUrl) {
        console.log(`[XPostingAdapter] Video post failed (mode B), retrying with thumbnail`);
        debug.thumbnail_fallback = true;
        const imgResult = await uploadImageFromUrl(thumbnailUrl);
        debug.thumbnail_upload_ok = imgResult.success;
        if (imgResult.success && imgResult.media_id) {
          debug.final_media_id = imgResult.media_id;
          mainResult = await postTweet(text, { media_id: imgResult.media_id });
        }
      }

      if (!mainResult.success || !mainResult.tweet_id) {
        return {
          success: false,
          error_message: mainResult.error,
          posted_at: new Date().toISOString(),
          media_debug: debug,
        };
      }

      // リプライにアフィリエイトリンクを投稿
      const replyResult = await postTweet(affiliateUrl, {
        reply_to_tweet_id: mainResult.tweet_id,
      });

      return {
        success: true,
        external_post_id: mainResult.tweet_id,
        reply_post_id: replyResult.success ? replyResult.tweet_id : undefined,
        posted_at: new Date().toISOString(),
        media_debug: debug,
      };
    } else {
      // モードA: 動画+テキスト+リンクを1ツイート
      const result = await postTweet(text, { media_id: mediaId });

      // 動画関連の403エラー（2分超過等）→ サムネイルにフォールバックしてリトライ
      if (!result.success && mediaId && result.error?.includes("403") && thumbnailUrl) {
        console.log(`[XPostingAdapter] Video post failed (${result.error}), retrying with thumbnail`);
        debug.thumbnail_fallback = true;
        const imgResult = await uploadImageFromUrl(thumbnailUrl);
        debug.thumbnail_upload_ok = imgResult.success;
        if (imgResult.success && imgResult.media_id) {
          debug.final_media_id = imgResult.media_id;
          const retryResult = await postTweet(text, { media_id: imgResult.media_id });
          if (retryResult.success) {
            return {
              success: true,
              external_post_id: retryResult.tweet_id,
              posted_at: new Date().toISOString(),
              media_debug: debug,
            };
          }
        }
      }

      if (result.success) {
        return {
          success: true,
          external_post_id: result.tweet_id,
          posted_at: new Date().toISOString(),
          media_debug: debug,
        };
      }

      return {
        success: false,
        error_message: result.error,
        posted_at: new Date().toISOString(),
        media_debug: debug,
      };
    }
  }

  async deletePost(externalId: string): Promise<boolean> {
    if (!isXApiConfigured()) return true;
    return deleteTweet(externalId);
  }
}

// ---------- Factory ----------
export function createPostingAdapter(platform?: string): PostingAdapter {
  switch (platform) {
    case "x":
      return new XPostingAdapter();
    default:
      return new DemoPostingAdapter();
  }
}
