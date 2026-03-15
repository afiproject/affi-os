import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import { createPostingAdapter } from "@/lib/adapters/posting";
import {
  getDuePosts,
  updateScheduledPostStatus,
  createPostedLog,
  logError,
} from "@/lib/db";

const MAX_RETRIES = 3;

// POST /api/post-now — ブラウザから即時投稿をトリガー
// CRON_SECRET不要（ブラウザから直接呼べる）
export async function POST() {
  if (isDemoMode()) {
    return NextResponse.json({ success: true, posted: 0, failed: 0 });
  }

  try {
    const duePosts = await getDuePosts();

    let postedCount = 0;
    let failedCount = 0;

    const adapter = createPostingAdapter("x");

    for (const post of duePosts) {
      if (!post.variant?.body_text) {
        failedCount++;
        continue;
      }

      const bodyText = post.custom_body_text || post.variant.body_text;
      const hashtags = post.variant.hashtags?.length
        ? "\n" + post.variant.hashtags.join(" ")
        : "";
      const affiliateUrl = post.candidate?.item?.affiliate_url || "";
      const sampleVideoUrl = post.candidate?.item?.sample_video_url || "";
      const cachedVideoUrl = post.candidate?.item?.cached_video_url || "";
      const postMode = post.post_mode || "A";

      let fullText: string;
      if (postMode === "B") {
        fullText = `${bodyText}${hashtags}`;
      } else {
        fullText = `${bodyText}${hashtags}${affiliateUrl ? "\n" + affiliateUrl : ""}`;
      }

      const result = await adapter.post(fullText, {
        post_mode: postMode as "A" | "B",
        video_url: sampleVideoUrl || undefined,
        cached_video_url: cachedVideoUrl || undefined,
        affiliate_url: affiliateUrl || undefined,
      });

      if (result.success && result.external_post_id) {
        postedCount++;

        await updateScheduledPostStatus(post.id, {
          status: "posted",
          posted_at: result.posted_at,
          external_post_id: result.external_post_id,
          reply_post_id: result.reply_post_id,
        });

        await createPostedLog({
          scheduled_post_id: post.id,
          external_post_id: result.external_post_id,
          posted_at: result.posted_at,
          body_text: fullText,
          affiliate_url: affiliateUrl,
          category: post.candidate?.item?.category || "",
          tags: post.candidate?.item?.tags || [],
          tone: post.variant.tone || "",
          account_id: post.account_id,
        });
      } else {
        failedCount++;
        const newRetryCount = (post.retry_count || 0) + 1;

        await updateScheduledPostStatus(post.id, {
          status: newRetryCount >= MAX_RETRIES ? "failed" : "scheduled",
          error_message: result.error_message,
          retry_count: newRetryCount,
        });

        await logError("post-now", `Post failed: ${result.error_message}`, undefined, {
          scheduled_post_id: post.id,
          retry_count: newRetryCount,
        });
      }
    }

    return NextResponse.json({
      success: true,
      due_count: duePosts.length,
      posted: postedCount,
      failed: failedCount,
    });
  } catch (error) {
    await logError("post-now", String(error));
    return NextResponse.json(
      { error: "Post execution failed", details: String(error) },
      { status: 500 }
    );
  }
}
