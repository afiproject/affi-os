// ========================================
// Posting Adapter
// 投稿先プラットフォームの抽象インターフェース
// ========================================

import { postTweet, deleteTweet, isXApiConfigured, uploadVideo, downloadVideo, uploadImageFromUrl, trimVideoToMiddle } from "@/lib/x-api";

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
    video_trimmed?: boolean;
    video_trimmed_bytes?: number;
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
    const isCached = !!cachedVideoUrl;
    const effectiveVideoUrl = cachedVideoUrl || videoUrl;

    // === 動画アップロードフロー ===
    if (effectiveVideoUrl) {
      debug.video_url_used = effectiveVideoUrl;
      console.log(`[XPostingAdapter] === VIDEO UPLOAD START ===`);
      console.log(`[XPostingAdapter] URL: ${effectiveVideoUrl}${isCached ? " (cached)" : " (CDN direct)"}`);

      // Step 1: 動画ダウンロード
      const videoBuffer = await downloadVideo(effectiveVideoUrl);
      debug.video_download_ok = !!videoBuffer;
      debug.video_download_bytes = videoBuffer?.length || 0;

      if (!videoBuffer) {
        console.error(`[XPostingAdapter] VIDEO DOWNLOAD FAILED: ${effectiveVideoUrl}`);

        // キャッシュURLが失敗した場合、元のCDN URLでもリトライ
        if (isCached && videoUrl) {
          console.log(`[XPostingAdapter] Retrying with original CDN URL: ${videoUrl}`);
          const retryBuffer = await downloadVideo(videoUrl);
          if (retryBuffer) {
            debug.video_download_ok = true;
            debug.video_download_bytes = retryBuffer.length;
            debug.video_url_used = videoUrl;
            console.log(`[XPostingAdapter] CDN retry SUCCESS: ${retryBuffer.length} bytes`);
            // retryBufferで続行（下のロジックで処理）
            const trimmed = await trimVideoToMiddle(retryBuffer);
            debug.video_trimmed = trimmed.length !== retryBuffer.length;
            debug.video_trimmed_bytes = trimmed.length;
            const uploadResult = await uploadVideo(trimmed);
            debug.video_upload_ok = uploadResult.success;
            if (uploadResult.success && uploadResult.media_id) {
              mediaId = uploadResult.media_id;
              console.log(`[XPostingAdapter] Video uploaded via CDN retry: media_id=${mediaId}`);
            } else {
              debug.video_upload_error = uploadResult.error;
              console.error(`[XPostingAdapter] Video upload failed on CDN retry: ${uploadResult.error}`);
            }
          } else {
            console.error(`[XPostingAdapter] CDN retry also FAILED`);
          }
        }
      } else {
        // Step 2: トリミング
        let uploadBuffer: Buffer;
        if (isCached) {
          console.log(`[XPostingAdapter] Using cached video as-is (${videoBuffer.length} bytes)`);
          uploadBuffer = videoBuffer;
          debug.video_trimmed = false;
        } else {
          console.log(`[XPostingAdapter] Trimming video...`);
          uploadBuffer = await trimVideoToMiddle(videoBuffer);
          debug.video_trimmed = uploadBuffer.length !== videoBuffer.length;
        }
        debug.video_trimmed_bytes = uploadBuffer.length;

        // Step 3: X APIにアップロード
        console.log(`[XPostingAdapter] Uploading to X API: ${(uploadBuffer.length / 1024 / 1024).toFixed(1)}MB`);
        const uploadResult = await uploadVideo(uploadBuffer);
        debug.video_upload_ok = uploadResult.success;
        if (uploadResult.success && uploadResult.media_id) {
          mediaId = uploadResult.media_id;
          console.log(`[XPostingAdapter] VIDEO UPLOAD SUCCESS: media_id=${mediaId}`);
        } else {
          debug.video_upload_error = uploadResult.error;
          console.error(`[XPostingAdapter] VIDEO UPLOAD FAILED: ${uploadResult.error}`);
        }
      }
      console.log(`[XPostingAdapter] === VIDEO UPLOAD END (mediaId=${mediaId || "NONE"}) ===`);
    } else {
      console.log(`[XPostingAdapter] No video URL available`);
    }

    // サムネフォールバック: 動画が完全に失敗した場合のみ
    if (!mediaId && thumbnailUrl) {
      debug.thumbnail_fallback = true;
      const reason = debug.video_upload_error || (!debug.video_download_ok ? "動画ダウンロード失敗" : "動画URLなし");
      console.warn(`[XPostingAdapter] THUMBNAIL FALLBACK: ${reason}`);
      console.warn(`[XPostingAdapter] video_url=${videoUrl}, cached_video_url=${cachedVideoUrl}, download_ok=${debug.video_download_ok}, upload_error=${debug.video_upload_error}`);
      const imgResult = await uploadImageFromUrl(thumbnailUrl);
      debug.thumbnail_upload_ok = imgResult.success;
      if (imgResult.success && imgResult.media_id) {
        mediaId = imgResult.media_id;
        console.log(`[XPostingAdapter] Thumbnail uploaded: media_id=${mediaId}`);
      } else {
        debug.thumbnail_upload_error = imgResult.error;
        console.error(`[XPostingAdapter] Thumbnail upload also failed: ${imgResult.error}`);
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
