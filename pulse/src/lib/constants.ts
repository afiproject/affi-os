import type { Crowdedness, Atmosphere, GenderRatio, SpotCategory } from '@/types/database'

export const CROWDEDNESS_LABELS: Record<Crowdedness, { label: string; emoji: string; color: string }> = {
  empty: { label: 'すいてる', emoji: '🟢', color: '#22c55e' },
  normal: { label: 'ふつう', emoji: '🟡', color: '#eab308' },
  crowded: { label: '混んでる', emoji: '🔴', color: '#ef4444' },
}

export const ATMOSPHERE_LABELS: Record<Atmosphere, { label: string; emoji: string }> = {
  quiet: { label: '静か', emoji: '🤫' },
  normal: { label: 'ふつう', emoji: '😊' },
  lively: { label: 'にぎやか', emoji: '🎉' },
}

export const GENDER_RATIO_LABELS: Record<GenderRatio, { label: string; emoji: string }> = {
  male_heavy: { label: '男性多め', emoji: '♂️' },
  balanced: { label: '同じくらい', emoji: '⚖️' },
  female_heavy: { label: '女性多め', emoji: '♀️' },
}

export const CATEGORY_LABELS: Record<SpotCategory, { label: string; emoji: string }> = {
  bar: { label: 'バー', emoji: '🍸' },
  cafe: { label: 'カフェ', emoji: '☕' },
  restaurant: { label: 'レストラン', emoji: '🍽️' },
  club: { label: 'クラブ', emoji: '🪩' },
  other: { label: 'その他', emoji: '📍' },
}

// Tokyo default center
export const DEFAULT_CENTER: [number, number] = [139.7671, 35.6812]
export const DEFAULT_ZOOM = 14
