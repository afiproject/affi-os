import { NextResponse } from "next/server";
import { GET as collectHandler } from "@/app/api/cron/collect/route";
import { GET as cacheVideosHandler } from "@/app/api/cron/cache-videos/route";
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
  cleanupOldCandidates,
} from "@/lib/db";
import { createPostingAdapter } from "@/lib/adapters/posting";

export const maxDuration = 300;
export const preferredRegion = ["hnd1"];

const AUTO_POST_COUNT = 2;
const PIPELINE_TIMEOUT_MS = 270_000; // 270秒（300秒制限の30秒前に打ち切り）
const CACHE_VIDEOS_BUDGET_MS = 90_000; // cache-videosに割ける最大時間

/**
 * パイプライン用のリクエストを作成（URLパラメータ付き）
 */
function makeRequest(original: Request, params: Record<string, string>): Request {
  const url = new URL(original.url);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString(), {
    method: original.method,
    headers: original.headers,
  });
}

/**
 * GET /api/cron/pipeline — 全自動パイプライン
 * collect → cache-videos → score → generate → 自動承認 → 即時投稿
 * Hobbyプラン対応: 1回で全部やる（2つ目のcronでpost単体も実行）
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pipelineStart = Date.now();
  const elapsed = () => Date.now() - pipelineStart;
  const remaining = () => PIPELINE_TIMEOUT_MS - elapsed();
  const results: Record<string, unknown> = {};

  console.log("[pipeline] === Pipeline started ===");

  // Step 0: 古い候補をクリーンアップ
  try {
    const cleanup = await cleanupOldCandidates();
    results.cleanup = cleanup;
    console.log(`[pipeline] cleanup done: ${cleanup.deleted} old candidates removed`);
  } catch (e) {
    results.cleanup = { error: String(e) };
    console.error("[pipeline] cleanup FAILED:", String(e));
  }

  // Step 1: Collect
  try {
    const collectRes = await collectHandler(request);
    results.collect = await collectRes.json();
    console.log("[pipeline] collect done:", JSON.stringify(results.collect));
  } catch (e) {
    results.collect = { error: String(e) };
    console.error("[pipeline] collect FAILED:", String(e));
  }

  console.log(`[pipeline] Elapsed after collect: ${(elapsed() / 1000).toFixed(1)}s`);

  // Step 1.5: Cache Videos（時間に余裕がある場合のみ、上限3本）
  if (remaining() > CACHE_VIDEOS_BUDGET_MS + 120_000) {
    try {
      const cacheReq = makeRequest(request, { limit: "3" });
      const cacheRes = await cacheVideosHandler(cacheReq);
      results.cache_videos = await cacheRes.json();
      console.log("[pipeline] cache-videos done:", JSON.stringify(results.cache_videos));
    } catch (e) {
      results.cache_videos = { error: String(e) };
      console.error("[pipeline] cache-videos FAILED:", String(e));
    }
  } else {
    results.cache_videos = { skipped: true, reason: "insufficient time budget" };
    console.log(`[pipeline] cache-videos SKIPPED (remaining: ${(remaining() / 1000).toFixed(0)}s)`);
  }

  console.log(`[pipeline] Elapsed after cache-videos: ${(elapsed() / 1000).toFixed(1)}s`);

  // Step 2: Score
  try {
    const scoreRes = await scoreHandler(request);
    results.score = await scoreRes.json();
    console.log("[pipeline] score done:", JSON.stringify(results.score));
  } catch (e) {
    results.score = { error: String(e) };
    console.error("[pipeline] score FAILED:", String(e));
  }

  console.log(`[pipeline] Elapsed after score: ${(elapsed() / 1000).toFixed(1)}s`);

  // Step 3: Generate（from=pipeline でgenerate内の自動スケジューリングを抑止）
  if (remaining() > 60_000) {
    try {
      const genReq = makeRequest(request, { from: "pipeline" });
      const generateRes = await generateHandler(genReq);
      results.generate = await generateRes.json();
      console.log("[pipeline] generate done:", JSON.stringify(results.generate));
    } catch (e) {
      results.generate = { error: String(e) };
      console.error("[pipeline] generate FAILED:", String(e));
    }
  } else {
    results.generate = { skipped: true, reason: "insufficient time budget" };
    console.log(`[pipeline] generate SKIPPED (remaining: ${(remaining() / 1000).toFixed(0)}s)`);
  }

  console.log(`[pipeline] Elapsed after generate: ${(elapsed() / 1000).toFixed(1)}s`);

  // Step 4: 自動承認 → 即時投稿（残り30秒以上ある場合のみ）
  if (remaining() > 30_000) {
    try {
      // pending候補を探す（通常フロー）
      let candidates = await getCandidates({ status: "pending" });
      let withVariants = candidates.filter(
        (c) => c.variants && c.variants.length > 0 && c.variants.some((v) => v.body_text)
      );

      // pendingがない場合、approvedだがまだscheduled_postsに登録されていない候補も対象にする
      // （generateの自動スケジューリングが先に動いた場合のフォールバック）
      if (withVariants.length === 0) {
        console.log("[pipeline] No pending candidates with variants, checking approved candidates...");
        // approved候補はpipelineのStep 4では投稿済みの可能性があるのでスキップ
        // 代わりにscheduled_postsのステータスを確認する方が安全
      }

      const topCandidates = withVariants
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, AUTO_POST_COUNT);

      console.log(`[pipeline] Candidates: ${candidates.length} pending, ${withVariants.length} with variants, posting ${topCandidates.length}`);
      if (candidates.length === 0) {
        console.warn("[pipeline] WARNING: No pending candidates found. Check if collect/score/generate succeeded.");
      } else if (withVariants.length === 0) {
        console.warn("[pipeline] WARNING: Pending candidates exist but none have variants. Generate step may have failed.");
      }

      const adapter = createPostingAdapter("x");
      let posted = 0;
      let failed = 0;
      const postResults: unknown[] = [];

      for (const candidate of topCandidates) {
        // 残り時間チェック（投稿1件あたり最低20秒必要）
        if (remaining() < 20_000) {
          console.warn(`[pipeline] Time running out (${(remaining() / 1000).toFixed(0)}s left), stopping auto-post`);
          // 残りの候補はscheduled_postsに登録して次回のcron/postで処理
          for (const remaining_candidate of topCandidates.slice(topCandidates.indexOf(candidate))) {
            const rv = remaining_candidate.variants.find((v) => v.is_selected) || remaining_candidate.variants[0];
            if (rv?.body_text) {
              await updateCandidateStatus(remaining_candidate.id, "approved");
              await createScheduledPost({
                candidate_id: remaining_candidate.id,
                account_id: remaining_candidate.account_id || "",
                variant_id: rv.id,
                scheduled_at: new Date().toISOString(),
                post_mode: "A",
              });
              postResults.push({ id: remaining_candidate.id, deferred: true });
            }
          }
          break;
        }

        const variant = candidate.variants.find((v) => v.is_selected) || candidate.variants[0];
        if (!variant?.body_text) {
          failed++;
          postResults.push({ id: candidate.id, error: "no variant text" });
          continue;
        }

        try {
          await updateCandidateStatus(candidate.id, "approved");

          const scheduledPostId = await createScheduledPost({
            candidate_id: candidate.id,
            account_id: candidate.account_id || "",
            variant_id: variant.id,
            scheduled_at: new Date().toISOString(),
            post_mode: "A",
          });

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
            video_url: sampleVideoUrl || undefined,
            cached_video_url: cachedVideoUrl || undefined,
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
  } else {
    results.auto_post = { skipped: true, reason: "insufficient time budget" };
    console.warn(`[pipeline] Auto-post SKIPPED (remaining: ${(remaining() / 1000).toFixed(0)}s)`);
  }

  const totalElapsed = (elapsed() / 1000).toFixed(1);
  console.log(`[pipeline] === Pipeline completed in ${totalElapsed}s ===`);

  return NextResponse.json({
    success: true,
    workflow: "pipeline",
    elapsed_seconds: Number(totalElapsed),
    results,
    timestamp: new Date().toISOString(),
  });
}
