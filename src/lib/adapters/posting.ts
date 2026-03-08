// ========================================
// Posting Adapter
// 投稿先プラットフォームの抽象インターフェース
// ========================================

import { postTweet, deleteTweet, isXApiConfigured } from "@/lib/x-api";

export interface PostResult {
  success: boolean;
  external_post_id?: string;
  error_message?: string;
  posted_at: string;
}

export interface PostingAdapter {
  readonly platform: string;
  post(text: string, options?: PostOptions): Promise<PostResult>;
  deletePost(externalId: string): Promise<boolean>;
}

export interface PostOptions {
  media_urls?: string[];
  scheduled_at?: string;
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

  async post(text: string): Promise<PostResult> {
    if (!isXApiConfigured()) {
      console.warn("X API key not configured, using demo mode");
      return new DemoPostingAdapter().post(text);
    }

    const result = await postTweet(text);

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
