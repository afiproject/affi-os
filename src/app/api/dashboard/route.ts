import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import { demoDashboardStats } from "@/lib/demo-data";
import {
  getCandidates,
  getScheduledPosts,
  getRecentPostedLogs,
  getDailyAnalytics,
  getRecentWorkflows,
} from "@/lib/db";
import { getAdminClient } from "@/lib/supabase/admin";
import type { DashboardStats } from "@/types";

// GET /api/dashboard — ダッシュボード統計
export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(demoDashboardStats);
  }

  try {
    const [candidates, scheduled, recentPosts, dailyStats, workflows] = await Promise.all([
      getCandidates(),
      getScheduledPosts(),
      getRecentPostedLogs(20),
      getDailyAnalytics(7),
      getRecentWorkflows(5),
    ]);

    const pendingCount = candidates.filter((c) => c.status === "pending").length;
    const todayScheduled = scheduled.filter((s) => {
      const d = new Date(s.scheduled_at);
      const today = new Date();
      return d.toDateString() === today.toDateString() &&
        (s.status === "scheduled" || s.status === "posted");
    });

    // 最近7日のクリック・CTR合計
    const recentClicks = dailyStats.reduce((sum, d) => sum + d.clicks, 0);
    const recentImpressions = dailyStats.reduce((sum, d) => sum + d.impressions, 0);
    const recentCtr = recentImpressions > 0
      ? parseFloat(((recentClicks / recentImpressions) * 100).toFixed(2))
      : 0;

    // カテゴリ別スコア
    const categoryMap = new Map<string, number>();
    for (const c of candidates) {
      if (c.item?.category) {
        const existing = categoryMap.get(c.item.category) || 0;
        categoryMap.set(c.item.category, existing + c.total_score);
      }
    }
    const topCategories = Array.from(categoryMap.entries())
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 最近のエラー
    const db = getAdminClient();
    const { data: recentErrors } = await db
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    // 最近の承認ログ
    const { data: recentApprovals } = await db
      .from("approval_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    // システム状態判定
    const hasRecentErrors = (recentErrors?.length || 0) > 0;
    const hasFailedWorkflows = workflows.some((w) => w.status === "failed");
    const systemStatus = hasRecentErrors || hasFailedWorkflows ? "warning" : "healthy";

    const stats: DashboardStats = {
      recommended_post_count: candidates.length,
      pending_approval_count: pendingCount,
      scheduled_today_count: todayScheduled.length,
      recent_clicks: recentClicks,
      recent_ctr: recentCtr,
      top_categories: topCategories,
      recommended_hours: [10, 12, 15, 19, 21],
      system_status: systemStatus,
      recent_errors: recentErrors || [],
      recent_approvals: recentApprovals || [],
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard", details: String(error) },
      { status: 500 }
    );
  }
}
