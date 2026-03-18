import { NextResponse } from "next/server";
import { GET as collectHandler } from "@/app/api/cron/collect/route";
import { GET as scoreHandler } from "@/app/api/cron/score/route";
import { GET as generateHandler } from "@/app/api/cron/generate/route";
import {
  getCandidates,
  updateCandidateStatus,
  createScheduledPost,
  createPostedLog,
  updateScheduledPostStatus,
  startWorkflow,
  completeWorkflow,
  logError,
} from "@/lib/db";
import { createPostingAdapter } from "@/lib/adapters/posting";

export const maxDuration = 300;
export const preferredRegion = ["hnd1"];

const AUTO_POST_COUNT = 2; // 1回のpipelineで自動投稿する最大件数（動画アップロードに時間がかかるため控えめに）

/**
 * GET /api/cron/pipeline — 全自動パイプライン
 * collect → score → generate → 自動承認 → 即時投稿
 * Hobbyプランの1日1cron制限に対応: 1回で全部やる
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pipelineStart = Date.now();
  const results: Record<string, unknown> = {};

  console.log("[pipeline] === Pipeline started ===");

  // Step 1: Collect
  try {
    const collectRes = await collectHandler(request);
    results.collect = await collectRes.json();
    console.log("[pipeline] collect done:", JSON.stringify(results.collect));
  } catch (e) {
    results.collect = { error: String(e) };
    console.error("[pipeline] collect FAILED:", String(e));
  }

  console.log(`[pipeline] Elapsed after collect: ${((Date.now() - pipelineStart) / 1000).toFixed(1)}s`);

  // Step 2: Score
  try {
    const scoreRes = await scoreHandler(request);
    results.score = await scoreRes.json();
    console.log("[pipeline] score done:", JSON.stringify(results.score));
  } catch (e) {
    results.score = { error: String(e) };
    console.error("[pipeline] score FAILED:", String(e));
  }

  console.log(`[pipeline] Elapsed after score: ${((Date.now() - pipelineStart) / 1000).toFixed(1)}s`);

  // Step 3: Generate
  try {
    const generateRes = await generateHandler(request);
    results.generate = await generateRes.json();
    console.log("[pipeline] generate done:", JSON.stringify(results.generate));
  } catch (e) {
    results.generate = { error: String(e) };
    console.error("[pipeline] generate FAILED:", String(e));
  }

  const elapsedAfterGenerate = (Date.now() - pipelineStart) / 1000;
  console.log(`[pipeline] Elapsed after generate: ${elapsedAfterGenerate.toFixed(1)}s`);

  // 残り時間が少ない場合（180秒以上経過）、動画スキップモードにする
  const skipVideo = elapsedAfterGenerate > 180;
  if (skipVideo) {
    console.log("[pipeline] WARNING: Running low on time, will skip video upload and use thumbnails only");
  }

  // Step 4: 自動承認 → 即時投稿
  try {
    const candidates = await getCandidates({ status: "pending" });
    // スコア上位N件を自動承認して投稿
    const topCandidates = candidates
      .filter((c) => c.variants && c.variants.length > 0 && c.variants.some((v) => v.body_text))
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, AUTO_POST_COUNT);

    console.log(`[pipeline] Auto-posting ${topCandidates.length} candidates`);

    const adapter = createPostingAdapter("x");
    let posted = 0;
    let failed = 0;
    const postResults: unknown[] = [];

    for (const candidate of topCandidates) {
      const variant = candidate.variants.find((v) => v.is_selected) || candidate.variants[0];
      if (!variant?.body_text) {
        failed++;
        postResults.push({ id: candidate.id, error: "no variant text" });
        continue;
      }

      try {
        // 1. ステータスをapprovedに更新
        await updateCandidateStatus(candidate.id, "approved");

        // 2. スケジュール投稿を作成（現在時刻=即時）
        const scheduledPostId = await createScheduledPost({
          candidate_id: candidate.id,
          account_id: candidate.account_id || "",
          variant_id: variant.id,
          scheduled_at: new Date().toISOString(),
          post_mode: "A",
        });

        // 3. 即時投稿
        const bodyText = variant.body_text;
        const hashtags = variant.hashtags?.length
          ? "\n" + variant.hashtags.join(" ")
          : "";
        const affiliateUrl = candidate.item?.affiliate_url || "";
        const sampleVideoUrl = candidate.item?.sample_video_url || "";
        const cachedVideoUrl = candidate.item?.cached_video_url || "";
        const thumbnailUrl = candidate.item?.thumbnail_url || "";

        const fullText = `${bodyText}${hashtags}${affiliateUrl ? "\n" + affiliateUrl : ""}`;

        console.log(`[pipeline] Posting: ${candidate.item?.title || candidate.id}`);

        const result = await adapter.post(fullText, {
          post_mode: "A",
          // 時間不足の場合は動画をスキップしてサムネのみ
          video_url: skipVideo ? undefined : (sampleVideoUrl || undefined),
          cached_video_url: skipVideo ? undefined : (cachedVideoUrl || undefined),
          affiliate_url: affiliateUrl || undefined,
          thumbnail_url: thumbnailUrl || undefined,
        });

        if (result.success && result.external_post_id) {
          posted++;
          await updateScheduledPostStatus(scheduledPostId, {
            status: "posted",
            posted_at: result.posted_at,
            external_post_id: result.external_post_id,
            reply_post_id: result.reply_post_id,
          });
          await createPostedLog({
            scheduled_post_id: scheduledPostId,
            external_post_id: result.external_post_id,
            posted_at: result.posted_at,
            body_text: fullText,
            affiliate_url: affiliateUrl,
            category: candidate.item?.category || "",
            tags: candidate.item?.tags || [],
            tone: variant.tone || "",
            account_id: candidate.account_id || "",
          });
          postResults.push({
            id: candidate.id,
            title: candidate.item?.title,
            external_post_id: result.external_post_id,
            success: true,
          });
        } else {
          failed++;
          await updateScheduledPostStatus(scheduledPostId, {
            status: "failed",
            error_message: result.error_message,
          });
          postResults.push({
            id: candidate.id,
            error: result.error_message,
          });
        }
      } catch (e) {
        failed++;
        postResults.push({ id: candidate.id, error: String(e) });
        await logError("pipeline/auto-post", String(e));
      }
    }

    results.auto_post = {
      candidates_found: candidates.length,
      attempted: topCandidates.length,
      posted,
      failed,
      details: postResults,
    };
    console.log(`[pipeline] Auto-post done: ${posted} posted, ${failed} failed`);
  } catch (e) {
    results.auto_post = { error: String(e) };
    console.error("[pipeline] Auto-post error:", e);
  }

  const totalElapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);
  console.log(`[pipeline] === Pipeline completed in ${totalElapsed}s ===`);

  return NextResponse.json({
    success: true,
    workflow: "pipeline",
    elapsed_seconds: Number(totalElapsed),
    results,
    timestamp: new Date().toISOString(),
  });
}
