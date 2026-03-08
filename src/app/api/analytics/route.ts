import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/supabase/admin";
import {
  getDailyAnalytics,
  getCategoryAnalytics,
  getHourlyAnalytics,
  getToneAnalytics,
} from "@/lib/db";
import {
  demoDailyAnalytics,
  demoCategoryAnalytics,
  demoHourlyAnalytics,
  demoToneAnalytics,
} from "@/lib/demo-data";

// GET /api/analytics — 分析データ取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";

  if (isDemoMode()) {
    switch (type) {
      case "daily":
        return NextResponse.json({ daily: demoDailyAnalytics });
      case "category":
        return NextResponse.json({ categories: demoCategoryAnalytics });
      case "hourly":
        return NextResponse.json({ hourly: demoHourlyAnalytics });
      case "tone":
        return NextResponse.json({ tones: demoToneAnalytics });
      default:
        return NextResponse.json({
          daily: demoDailyAnalytics,
          categories: demoCategoryAnalytics,
          hourly: demoHourlyAnalytics,
          tones: demoToneAnalytics,
        });
    }
  }

  try {
    switch (type) {
      case "daily": {
        const daily = await getDailyAnalytics();
        return NextResponse.json({ daily });
      }
      case "category": {
        const categories = await getCategoryAnalytics();
        return NextResponse.json({ categories });
      }
      case "hourly": {
        const hourly = await getHourlyAnalytics();
        return NextResponse.json({ hourly });
      }
      case "tone": {
        const tones = await getToneAnalytics();
        return NextResponse.json({ tones });
      }
      default: {
        const [daily, categories, hourly, tones] = await Promise.all([
          getDailyAnalytics(),
          getCategoryAnalytics(),
          getHourlyAnalytics(),
          getToneAnalytics(),
        ]);
        return NextResponse.json({ daily, categories, hourly, tones });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: String(error) },
      { status: 500 }
    );
  }
}
