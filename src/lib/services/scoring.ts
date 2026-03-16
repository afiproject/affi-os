// ========================================
// スコアリングサービス
// 候補のスコア算出ロジック
// ========================================

import type { AffiliateItem } from "@/types";

export interface ScoreWeights {
  freshness: number;
  popularity: number;
  free_trial: number;
  historical_ctr: number;
  time_fitness: number;
  duplicate_risk: number; // 低い方が良いので反転
  safety: number;
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  freshness: 0.15,
  popularity: 0.2,
  free_trial: 0.15,
  historical_ctr: 0.2,
  time_fitness: 0.1,
  duplicate_risk: 0.1,
  safety: 0.1,
};

export interface ScoreBreakdown {
  freshness_score: number;
  popularity_score: number;
  free_trial_score: number;
  historical_ctr_score: number;
  time_fitness_score: number;
  duplicate_risk_score: number;
  safety_score: number;
  total_score: number;
  estimated_ctr: number;
}

export function calculateScore(
  item: AffiliateItem,
  context: {
    recentCategories?: string[];
    recentTitles?: string[];
    categoryAvgCtr?: Record<string, number>;
    tagPerformance?: Record<string, number>;
    currentHour?: number;
    peakHours?: number[];
  },
  weights: ScoreWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  const freshness = item.freshness_score;
  const popularity = item.popularity_score;
  const freeTrial = item.is_free_trial ? 90 : 30;

  // 過去の同カテゴリCTR
  const historicalCtr = context.categoryAvgCtr?.[item.category]
    ? Math.min(100, (context.categoryAvgCtr[item.category] / 5) * 100)
    : 50;

  // 時間帯適性
  const currentHour = context.currentHour ?? new Date().getHours();
  const peakHours = context.peakHours ?? [10, 12, 15, 19, 21];
  const timeFitness = peakHours.includes(currentHour) ? 90 : 50;

  // 重複リスク（最近同じカテゴリが多いとリスク上昇）
  const recentSameCategory = context.recentCategories?.filter((c) => c === item.category).length ?? 0;
  const duplicateRisk = Math.min(100, recentSameCategory * 25);

  // 安全性（除外フラグがあれば低い）
  const safety = item.is_excluded ? 10 : 90;

  // タグブースト: 過去に反応が良かったタグを持つアイテムにボーナス
  let tagBoost = 0;
  if (context.tagPerformance && item.tags?.length) {
    const tagScores = item.tags
      .map((tag) => context.tagPerformance![tag] || 0)
      .filter((s) => s > 0);
    if (tagScores.length > 0) {
      // 上位タグスコアの平均を0-15のボーナスに正規化
      const avgTagScore = tagScores.reduce((a, b) => a + b, 0) / tagScores.length;
      tagBoost = Math.min(15, Math.round(avgTagScore * 3));
    }
  }

  const total = Math.round(
    freshness * weights.freshness +
    popularity * weights.popularity +
    freeTrial * weights.free_trial +
    historicalCtr * weights.historical_ctr +
    timeFitness * weights.time_fitness +
    (100 - duplicateRisk) * weights.duplicate_risk +
    safety * weights.safety +
    tagBoost
  );

  // CTR推定（簡易的）
  const estimatedCtr = parseFloat(((total / 100) * 5).toFixed(2));

  return {
    freshness_score: freshness,
    popularity_score: popularity,
    free_trial_score: freeTrial,
    historical_ctr_score: Math.round(historicalCtr),
    time_fitness_score: timeFitness,
    duplicate_risk_score: duplicateRisk,
    safety_score: safety,
    total_score: total,
    estimated_ctr: estimatedCtr,
  };
}

export function rankCandidates<T extends { total_score: number }>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => b.total_score - a.total_score);
}
