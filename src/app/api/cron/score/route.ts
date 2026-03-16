import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import { calculateScore, rankCandidates } from "@/lib/services/scoring";
import {
  getUnscoredItems,
  getFirstActiveAccount,
  createCandidate,
  getCategoryAvgCtr,
  getTagPerformance,
  getRecentPostedCategories,
  startWorkflow,
  completeWorkflow,
  logError,
} from "@/lib/db";
import { demoItems } from "@/lib/demo-data";
import { findOptimalTimeSlots, formatTimeSlot } from "@/lib/services/scheduler";

// GET /api/cron/score — スコアリングジョブ
// Vercel Cron: 毎日7時に実行
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    const scored = demoItems.map((item) => {
      const scores = calculateScore(item, { peakHours: [10, 12, 15, 19, 21] });
      return { item, ...scores };
    });
    const ranked = rankCandidates(scored);
    return NextResponse.json({
      success: true,
      workflow: "score",
      items_scored: ranked.length,
      top_score: ranked[0]?.total_score,
      timestamp: new Date().toISOString(),
    });
  }

  const workflowId = await startWorkflow("score");

  try {
    const items = await getUnscoredItems();
    const account = await getFirstActiveAccount();

    if (!account || items.length === 0) {
      await completeWorkflow(workflowId, 0);
      return NextResponse.json({
        success: true,
        workflow: "score",
        items_scored: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const categoryAvgCtr = await getCategoryAvgCtr();
    const tagPerformance = await getTagPerformance();
    const recentCategories = await getRecentPostedCategories();

    const scored = items.map((item) => {
      const scores = calculateScore(item, {
        peakHours: [10, 12, 15, 19, 20, 21, 23],
        categoryAvgCtr,
        tagPerformance,
        recentCategories,
      });
      return { item, ...scores };
    });

    const ranked = rankCandidates(scored);

    // 上位候補をDBに登録
    const timeSlots = findOptimalTimeSlots([], ranked.length);
    let createdCount = 0;

    for (let i = 0; i < ranked.length; i++) {
      const r = ranked[i];
      const timeSlot = timeSlots[i] || timeSlots[timeSlots.length - 1];

      await createCandidate({
        item_id: r.item.id,
        account_id: account.id,
        status: "pending",
        ai_score: 0,
        freshness_score: r.freshness_score,
        popularity_score: r.popularity_score,
        free_trial_score: r.free_trial_score,
        historical_ctr_score: r.historical_ctr_score,
        time_fitness_score: r.time_fitness_score,
        duplicate_risk_score: r.duplicate_risk_score,
        safety_score: r.safety_score,
        total_score: r.total_score,
        estimated_ctr: r.estimated_ctr,
        recommended_time: timeSlot ? formatTimeSlot(timeSlot) : "12:00",
        recommendation_reason: "",
        risk_flags: [],
        has_alternative: false,
      });
      createdCount++;
    }

    await completeWorkflow(workflowId, createdCount);

    return NextResponse.json({
      success: true,
      workflow: "score",
      items_scored: ranked.length,
      candidates_created: createdCount,
      top_score: ranked[0]?.total_score,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await completeWorkflow(workflowId, 0, String(error));
    await logError("cron/score", String(error));
    return NextResponse.json(
      { error: "Scoring failed", details: String(error) },
      { status: 500 }
    );
  }
}
