import { Slot } from "@prisma/client";

interface ScoringParams {
  targetLat?: number;
  targetLng?: number;
  targetStartAt?: Date;
  targetEndAt?: Date;
  targetCategory?: string;
  targetMaxPrice?: number;
}

// スコアリングウェイト（初期値、チューニング対象）
const WEIGHTS = {
  distance: 0.25,
  timeMatch: 0.25,
  categoryMatch: 0.15,
  priceMatch: 0.1,
  trust: 0.1,
  boost: 0.1,
  newbieBonus: 0.05,
};

/**
 * スロットのスコアを計算する
 */
export function calculateSlotScore(
  slot: Slot & {
    seller: {
      verificationStatus: string;
      ratingAvg: number | { toNumber(): number };
      cancelRate: number | { toNumber(): number };
      createdAt: Date;
    };
  },
  params: ScoringParams
): number {
  let score = 0;

  // 1. 距離スコア（対面のみ）
  if (
    params.targetLat &&
    params.targetLng &&
    slot.areaLat &&
    slot.areaLng
  ) {
    const lat = typeof slot.areaLat === "object" && "toNumber" in slot.areaLat
      ? (slot.areaLat as { toNumber(): number }).toNumber()
      : Number(slot.areaLat);
    const lng = typeof slot.areaLng === "object" && "toNumber" in slot.areaLng
      ? (slot.areaLng as { toNumber(): number }).toNumber()
      : Number(slot.areaLng);
    const distance = haversineDistance(
      params.targetLat,
      params.targetLng,
      lat,
      lng
    );
    // 近いほど高スコア（10km以内で正規化）
    score += WEIGHTS.distance * Math.max(0, 1 - distance / 10);
  }

  // 2. 時間一致スコア
  if (params.targetStartAt && params.targetEndAt) {
    const slotStart = slot.startAt.getTime();
    const targetStart = params.targetStartAt.getTime();
    const timeDiffHours =
      Math.abs(slotStart - targetStart) / (1000 * 60 * 60);
    score += WEIGHTS.timeMatch * Math.max(0, 1 - timeDiffHours / 4);
  }

  // 3. カテゴリ一致スコア
  if (params.targetCategory && slot.category === params.targetCategory) {
    score += WEIGHTS.categoryMatch;
  }

  // 4. 価格スコア
  if (params.targetMaxPrice) {
    if (slot.priceYen <= params.targetMaxPrice) {
      score +=
        WEIGHTS.priceMatch * (1 - slot.priceYen / params.targetMaxPrice);
    }
  }

  // 5. 信頼スコア
  const ratingAvg = typeof slot.seller.ratingAvg === "object" && "toNumber" in slot.seller.ratingAvg
    ? (slot.seller.ratingAvg as { toNumber(): number }).toNumber()
    : Number(slot.seller.ratingAvg);
  const cancelRate = typeof slot.seller.cancelRate === "object" && "toNumber" in slot.seller.cancelRate
    ? (slot.seller.cancelRate as { toNumber(): number }).toNumber()
    : Number(slot.seller.cancelRate);

  let trustScore = 0;
  if (slot.seller.verificationStatus === "verified") trustScore += 0.4;
  trustScore += (ratingAvg / 5) * 0.4;
  trustScore += Math.max(0, 1 - cancelRate / 100) * 0.2;
  score += WEIGHTS.trust * trustScore;

  // 6. ブーストスコア
  if (slot.boostUntil && slot.boostUntil > new Date()) {
    score += WEIGHTS.boost;
  }

  // 7. 新規優遇スコア（登録7日以内）
  const daysSinceCreated =
    (Date.now() - slot.seller.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 7) {
    score += WEIGHTS.newbieBonus * (1 - daysSinceCreated / 7);
  }

  return score;
}

/**
 * Haversine公式で2点間の距離(km)を計算
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
