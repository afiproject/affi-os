import { isDemoMode } from "@/lib/supabase/admin";
import {
  demoDailyAnalytics,
  demoCategoryAnalytics,
  demoHourlyAnalytics,
  demoToneAnalytics,
} from "@/lib/demo-data";
import {
  getDailyAnalytics,
  getCategoryAnalytics,
  getHourlyAnalytics,
  getToneAnalytics,
} from "@/lib/db";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  let daily, categories, hourly, tones;

  if (isDemoMode()) {
    daily = demoDailyAnalytics;
    categories = demoCategoryAnalytics;
    hourly = demoHourlyAnalytics;
    tones = demoToneAnalytics;
  } else {
    [daily, categories, hourly, tones] = await Promise.all([
      getDailyAnalytics(14),
      getCategoryAnalytics(),
      getHourlyAnalytics(),
      getToneAnalytics(),
    ]);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">投稿の成績を分析します</p>
      <AnalyticsDashboard
        daily={daily}
        categories={categories}
        hourly={hourly}
        tones={tones}
      />
    </div>
  );
}
