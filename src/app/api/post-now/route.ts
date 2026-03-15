import { NextResponse } from "next/server";
import { isDemoMode, getAdminClient } from "@/lib/supabase/admin";
import { createPostingAdapter } from "@/lib/adapters/posting";
import {
  updateScheduledPostStatus,
  createPostedLog,
  logError,
} from "@/lib/db";

const MAX_RETRIES = 3;

// POST /api/post-now — 特定のスケジュール投稿を即時実行
// body: { scheduled_post_id: string }
export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ success: true, posted: 0, failed: 0 });
  }

  try {
    const body = await request.json();
    const { scheduled_post_id } = body;

    if (!scheduled_post_id) {
      return NextResponse.json(
        { error: "scheduled_post_id required" },
        { status: 400 }
      );
    }

    // 指定されたスケジュール投稿を直接取得（getDuePostsの時刻チェックをスキップ）
    const db = getAdminClient();
    const { data: postData, error: fetchError } = await db
      .from("scheduled_posts")
      .select(`
        *,
        candidate:candidate_posts(
          *,
          item:affiliate_items(*),
          variants:candidate_post_variants(*)
        ),
        variant:candidate_post_variants(*)
      `)
      .eq("id", scheduled_post_id)
      .eq("status", "scheduled")
      .single();

    if (fetchError || !postData) {
      return NextResponse.json({
        success: false,
        error: "Scheduled post not found or not in scheduled status",
        details: fetchError?.message || "not found",
        scheduled_post_id,
      }, { status: 404 });
    }

    const post = postData as Record<string, unknown>;
    const variant = post.variant as Record<string, unknown> | null;
    const candidate = post.candidate as Record<string, unknown> | null;
    const item = candidate?.item as Record<string, unknown> | null;

    const bodyText = (post.custom_body_text as string) ||
      (variant?.body_text as string) || "";

    if (!bodyText) {
      return NextResponse.json({
        success: false,
        error: "No body text available",
        scheduled_post_id,
      }, { status: 400 });
    }

    const hashtags = Array.isArray(variant?.hashtags) && (variant.hashtags as string[]).length
      ? "\n" + (variant.hashtags as string[]).join(" ")
      : "";
    const affiliateUrl = (item?.affiliate_url as string) || "";
    const sampleVideoUrl = (item?.sample_video_url as string) || "";
    const cachedVideoUrl = (item?.cached_video_url as string) || "";
    const postMode = (post.post_mode as string) || "A";

    let fullText: string;
    if (postMode === "B") {
      fullText = `${bodyText}${hashtags}`;
    } else {
      fullText = `${bodyText}${hashtags}${affiliateUrl ? "\n" + affiliateUrl : ""}`;
    }

    console.log("[post-now] Posting:", {
      scheduled_post_id,
      postMode,
      textLength: fullText.length,
      hasVideo: !!cachedVideoUrl || !!sampleVideoUrl,
    });

    const adapter = createPostingAdapter("x");
    const result = await adapter.post(fullText, {
      post_mode: postMode as "A" | "B",
      video_url: sampleVideoUrl || undefined,
      cached_video_url: cachedVideoUrl || undefined,
      affiliate_url: affiliateUrl || undefined,
    });

    if (result.success && result.external_post_id) {
      await updateScheduledPostStatus(scheduled_post_id, {
        status: "posted",
        posted_at: result.posted_at,
        external_post_id: result.external_post_id,
        reply_post_id: result.reply_post_id,
      });

      await createPostedLog({
        scheduled_post_id,
        external_post_id: result.external_post_id,
        posted_at: result.posted_at,
        body_text: fullText,
        affiliate_url: affiliateUrl,
        category: (item?.category as string) || "",
        tags: (item?.tags as string[]) || [],
        tone: (variant?.tone as string) || "",
        account_id: (post.account_id as string) || "",
      });

      return NextResponse.json({
        success: true,
        posted: 1,
        failed: 0,
        external_post_id: result.external_post_id,
      });
    } else {
      const newRetryCount = ((post.retry_count as number) || 0) + 1;

      await updateScheduledPostStatus(scheduled_post_id, {
        status: newRetryCount >= MAX_RETRIES ? "failed" : "scheduled",
        error_message: result.error_message,
        retry_count: newRetryCount,
      });

      await logError("post-now", `Post failed: ${result.error_message}`, undefined, {
        scheduled_post_id,
        retry_count: newRetryCount,
      });

      return NextResponse.json({
        success: false,
        posted: 0,
        failed: 1,
        error: result.error_message,
      });
    }
  } catch (error) {
    await logError("post-now", String(error));
    return NextResponse.json(
      { error: "Post execution failed", details: String(error) },
      { status: 500 }
    );
  }
}
