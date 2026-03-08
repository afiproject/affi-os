// ========================================
// Analytics Adapter
// 分析データ取得の抽象インターフェース
// ========================================

import type { PerformanceMetric } from "@/types";
import { getTweetMetrics, isXApiConfigured } from "@/lib/x-api";

export interface AnalyticsAdapter {
  readonly source: string;
  fetchMetrics(postId: string): Promise<PerformanceMetric | null>;
  fetchBulkMetrics(postIds: string[]): Promise<Map<string, PerformanceMetric>>;
}

// ---------- Demo Adapter ----------
export class DemoAnalyticsAdapter implements AnalyticsAdapter {
  readonly source = "demo";

  async fetchMetrics(postId: string): Promise<PerformanceMetric | null> {
    return {
      id: `metric-${postId}`,
      posted_log_id: postId,
      date: new Date().toISOString().split("T")[0],
      impressions: 500 + Math.floor(Math.random() * 2000),
      clicks: 10 + Math.floor(Math.random() * 50),
      ctr: parseFloat((1 + Math.random() * 5).toFixed(2)),
      engagements: 5 + Math.floor(Math.random() * 30),
      retweets: Math.floor(Math.random() * 10),
      likes: Math.floor(Math.random() * 20),
      replies: Math.floor(Math.random() * 5),
      conversions: Math.floor(Math.random() * 3),
      revenue: parseFloat((Math.random() * 1000).toFixed(0)),
      collected_at: new Date().toISOString(),
    };
  }

  async fetchBulkMetrics(postIds: string[]): Promise<Map<string, PerformanceMetric>> {
    const map = new Map<string, PerformanceMetric>();
    for (const id of postIds) {
      const metric = await this.fetchMetrics(id);
      if (metric) map.set(id, metric);
    }
    return map;
  }
}

// ---------- X (Twitter) Adapter ----------
export class XAnalyticsAdapter implements AnalyticsAdapter {
  readonly source = "x";

  async fetchMetrics(postId: string): Promise<PerformanceMetric | null> {
    const results = await this.fetchBulkMetrics([postId]);
    return results.get(postId) || null;
  }

  async fetchBulkMetrics(postIds: string[]): Promise<Map<string, PerformanceMetric>> {
    const map = new Map<string, PerformanceMetric>();
    const metrics = await getTweetMetrics(postIds);

    for (const [tweetId, m] of metrics) {
      const clicks = m.url_clicks;
      const impressions = m.impressions;
      map.set(tweetId, {
        id: "",
        posted_log_id: tweetId,
        date: new Date().toISOString().split("T")[0],
        impressions,
        clicks,
        ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
        engagements: m.likes + m.retweets + m.replies,
        retweets: m.retweets,
        likes: m.likes,
        replies: m.replies,
        conversions: 0,
        revenue: 0,
        collected_at: new Date().toISOString(),
      });
    }

    return map;
  }
}

// ---------- Factory ----------
export function createAnalyticsAdapter(source?: string): AnalyticsAdapter {
  switch (source) {
    case "x":
      if (isXApiConfigured()) return new XAnalyticsAdapter();
      return new DemoAnalyticsAdapter();
    default:
      return new DemoAnalyticsAdapter();
  }
}
