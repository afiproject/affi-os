import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import { createPostingAdapter } from "@/lib/adapters/posting";
import {
  getDuePosts,
  updateScheduledPostStatus,
  createPostedLog,
  startWorkflow,
  completeWorkflow,
  logError,
} from "@/lib/db";

export const maxDuration = 120;
// 東京リージョンで実行（FANZA CDNの動画ダウンロードに必要）
export const preferredRegion = ["hnd1"];

const MAX_RETRIES = 3;

// GET /api/cron/post — 投稿実行ジョブ
// Vercel Cron: 15分ごとに実行
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      workflow: "post",
      posted: 0,
      failed: 0,
      checked_at: now.toISOString(),
    });
  }

  const workflowId = await startWorkflow("post");

  try {
    // 「現在時刻を過ぎた scheduled ステータスの投稿」を取得
    const duePosts = await getDuePosts();

    console.log(`[cron/post] Found ${duePosts.length} due posts at ${now.toISOString()}`);
    for (const p of duePosts) {
      console.log(`[cron/post] Due: id=${p.id}, scheduled_at=${p.scheduled_at}, candidate=${p.candidate_id}, variant=${p.variant_id}`);
    }

    let postedCount = 0;
    let failedCount = 0;

    // 投稿先はXアカウント
    const adapter = createPostingAdapter("x");

    for (const post of duePosts) {
      // カスタムテキストまたはバリアントのテキストが必要
      const bodyText = post.custom_body_text || post.variant?.body_text || "";
      if (!bodyText) {
        console.log(`[cron/post] Skipping ${post.id}: no body text`);
        failedCount++;
        continue;
      }

      const hashtags = post.variant?.hashtags?.length
        ? "\n" + post.variant.hashtags.join(" ")
        : "";
      const affiliateUrl = post.candidate?.item?.affiliate_url || "";
      const sampleVideoUrl = post.candidate?.item?.sample_video_url || "";
      const cachedVideoUrl = post.candidate?.item?.cached_video_url || "";
      const postMode = post.post_mode || "A";

      // モードに応じてテキスト構成を変える
      let fullText: string;
      if (postMode === "B") {
        // モードB: メインツイートにはリンクを含めない
        fullText = `${bodyText}${hashtags}`;
      } else {
        // モードA: すべてを1ツイートに
        fullText = `${bodyText}${hashtags}${affiliateUrl ? "\n" + affiliateUrl : ""}`;
      }

      const thumbnailUrl = post.candidate?.item?.thumbnail_url || "";

      const result = await adapter.post(fullText, {
        post_mode: postMode as "A" | "B",
        video_url: sampleVideoUrl || undefined,
        cached_video_url: cachedVideoUrl || undefined,
        affiliate_url: affiliateUrl || undefined,
        thumbnail_url: thumbnailUrl || undefined,
      });

      // メディアデバッグ情報をログ
      if (result.media_debug) {
        console.log(`[cron/post] Media debug for ${post.id}: ${JSON.stringify(result.media_debug)}`);
      }

      if (result.success && result.external_post_id) {
        postedCount++;

        // スケジュール投稿ステータスを更新
        await updateScheduledPostStatus(post.id, {
          status: "posted",
          posted_at: result.posted_at,
          external_post_id: result.external_post_id,
          reply_post_id: result.reply_post_id,
        });

        // 投稿ログを記録
        await createPostedLog({
          scheduled_post_id: post.id,
          external_post_id: result.external_post_id,
          posted_at: result.posted_at,
          body_text: fullText,
          affiliate_url: affiliateUrl,
          category: post.candidate?.item?.category || "",
          tags: post.candidate?.item?.tags || [],
          tone: post.variant?.tone || "",
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

        await logError("cron/post", `Post failed: ${result.error_message}`, undefined, {
          scheduled_post_id: post.id,
          retry_count: newRetryCount,
        });
      }
    }

    await completeWorkflow(workflowId, postedCount);

    return NextResponse.json({
      success: true,
      workflow: "post",
      due_count: duePosts.length,
      posted: postedCount,
      failed: failedCount,
      checked_at: now.toISOString(),
    });
  } catch (error) {
    await completeWorkflow(workflowId, 0, String(error));
    await logError("cron/post", String(error));
    return NextResponse.json(
      { error: "Post execution failed", details: String(error) },
      { status: 500 }
    );
  }
}
