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

    // 動画がある場合はアップロード（キャッシュURLを優先）
    let mediaId: string | undefined;
    const effectiveVideoUrl = cachedVideoUrl || videoUrl;
    if (effectiveVideoUrl) {
      console.log(`[XPostingAdapter] Downloading video: ${effectiveVideoUrl}${cachedVideoUrl ? " (cached)" : ""}`);
      const videoBuffer = await downloadVideo(effectiveVideoUrl);
      if (videoBuffer) {
        console.log(`[XPostingAdapter] Uploading video (${videoBuffer.length} bytes)`);
        const uploadResult = await uploadVideo(videoBuffer);
        if (uploadResult.success && uploadResult.media_id) {
          mediaId = uploadResult.media_id;
          console.log(`[XPostingAdapter] Video uploaded: media_id=${mediaId}`);
        } else {
          console.error(`[XPostingAdapter] Video upload failed: ${uploadResult.error}`);
        }
      }
    }

    // 動画が使えなかった場合、サムネ画像をフォールバックで添付
    if (!mediaId && thumbnailUrl) {
      console.log(`[XPostingAdapter] Video unavailable, using thumbnail: ${thumbnailUrl}`);
      const imgResult = await uploadImageFromUrl(thumbnailUrl);
      if (imgResult.success && imgResult.media_id) {
        mediaId = imgResult.media_id;
        console.log(`[XPostingAdapter] Thumbnail uploaded: media_id=${mediaId}`);
      } else {
        console.error(`[XPostingAdapter] Thumbnail upload failed: ${imgResult.error}`);
      }
    }

    if (postMode === "B" && affiliateUrl) {
      // モードB: 動画+テキスト → リプライにリンク
      const mainResult = await postTweet(text, { media_id: mediaId });

      if (!mainResult.success || !mainResult.tweet_id) {
        return {
          success: false,
          error_message: mainResult.error,
          posted_at: new Date().toISOString(),
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
      };
    } else {
      // モードA: 動画+テキスト+リンクを1ツイート
      const result = await postTweet(text, { media_id: mediaId });

      if (result.success) {
        return {
          success: true,
          external_post_id: result.tweet_id,
          posted_at: new Date().toISOString(),
        };
      }

      return {
        success: false,
        error_message: result.error,
        posted_at: new Date().toISOString(),
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
