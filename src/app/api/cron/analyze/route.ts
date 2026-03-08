import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import { createAnalyticsAdapter } from "@/lib/adapters/analytics";
import {
  getRecentPostedLogs,
  upsertPerformanceMetric,
  startWorkflow,
  completeWorkflow,
  logError,
} from "@/lib/db";

// GET /api/cron/analyze — 分析データ収集ジョブ
// Vercel Cron: 6時間ごとに実行
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      workflow: "analyze",
      metrics_collected: 0,
      timestamp: new Date().toISOString(),
    });
  }

  const workflowId = await startWorkflow("analyze");

  try {
    // 過去7日間の投稿ログを取得
    const postedLogs = await getRecentPostedLogs(100);

    if (postedLogs.length === 0) {
      await completeWorkflow(workflowId, 0);
      return NextResponse.json({
        success: true,
        workflow: "analyze",
        metrics_collected: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // X APIからメトリクスを取得
    const adapter = createAnalyticsAdapter("x");
    const tweetIds = postedLogs
      .filter((l) => l.external_post_id)
      .map((l) => l.external_post_id);

    const metrics = await adapter.fetchBulkMetrics(tweetIds);

    let savedCount = 0;
    for (const log of postedLogs) {
      const metric = metrics.get(log.external_post_id);
      if (metric) {
        await upsertPerformanceMetric({
          posted_log_id: log.id,
          date: new Date().toISOString().split("T")[0],
          impressions: metric.impressions,
          clicks: metric.clicks,
          ctr: metric.ctr,
          engagements: metric.engagements,
          retweets: metric.retweets,
          likes: metric.likes,
          replies: metric.replies,
          conversions: metric.conversions,
          revenue: metric.revenue,
        });
        savedCount++;
      }
    }

    await completeWorkflow(workflowId, savedCount);

    return NextResponse.json({
      success: true,
      workflow: "analyze",
      posts_checked: postedLogs.length,
      metrics_collected: savedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await completeWorkflow(workflowId, 0, String(error));
    await logError("cron/analyze", String(error));
    return NextResponse.json(
      { error: "Analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}
