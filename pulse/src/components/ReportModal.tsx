'use client'

import { useState } from 'react'
import { CROWDEDNESS_LABELS, ATMOSPHERE_LABELS, GENDER_RATIO_LABELS, CATEGORY_LABELS } from '@/lib/constants'
import type { Crowdedness, Atmosphere, GenderRatio, SpotCategory } from '@/types/database'

interface ReportModalProps {
  spotName?: string
  isNewSpot: boolean
  lngLat?: { lng: number; lat: number }
  onSubmit: (data: {
    spotName?: string
    category?: SpotCategory
    crowdedness: Crowdedness
    atmosphere: Atmosphere
    gender_ratio: GenderRatio
    comment: string
    lngLat?: { lng: number; lat: number }
  }) => void
  onClose: () => void
  isSubmitting: boolean
}

type SelectionKey = 'crowdedness' | 'atmosphere' | 'gender_ratio'

function OptionButton<T extends string>({
  value,
  selected,
  label,
  emoji,
  onSelect,
}: {
  value: T
  selected: boolean
  label: string
  emoji: string
  onSelect: (v: T) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 py-3 px-2 rounded-2xl text-center transition-all duration-200 ${
        selected
          ? 'bg-white/20 ring-2 ring-white/50 scale-105'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-xs font-medium">{label}</div>
    </button>
  )
}

export default function ReportModal({
  spotName,
  isNewSpot,
  lngLat,
  onSubmit,
  onClose,
  isSubmitting,
}: ReportModalProps) {
  const [name, setName] = useState(spotName || '')
  const [category, setCategory] = useState<SpotCategory>('bar')
  const [crowdedness, setCrowdedness] = useState<Crowdedness | null>(null)
  const [atmosphere, setAtmosphere] = useState<Atmosphere | null>(null)
  const [genderRatio, setGenderRatio] = useState<GenderRatio | null>(null)
  const [comment, setComment] = useState('')

  const canSubmit = crowdedness && atmosphere && genderRatio && (!isNewSpot || name.trim())

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      spotName: isNewSpot ? name.trim() : undefined,
      category: isNewSpot ? category : undefined,
      crowdedness: crowdedness!,
      atmosphere: atmosphere!,
      gender_ratio: genderRatio!,
      comment: comment.trim(),
      lngLat: isNewSpot ? lngLat : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-gray-900 to-gray-950 rounded-t-3xl p-6 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-5" />

        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-1">
          {isNewSpot ? '📍 新しいスポット' : `📡 ${spotName}`}
        </h2>
        <p className="text-sm text-white/50 mb-5">
          {isNewSpot ? 'スポットを追加してレポートする' : '今の状況をレポートする'}
        </p>

        {/* New spot fields */}
        {isNewSpot && (
          <div className="mb-5 space-y-3">
            <input
              type="text"
              placeholder="スポット名（例：渋谷 WOMB）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(CATEGORY_LABELS) as [SpotCategory, { label: string; emoji: string }][]).map(
                ([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      category === key
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                    }`}
                  >
                    {val.emoji} {val.label}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Crowdedness */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-white/70 mb-2 block">混み具合</label>
          <div className="flex gap-2">
            {(Object.entries(CROWDEDNESS_LABELS) as [Crowdedness, { label: string; emoji: string }][]).map(
              ([key, val]) => (
                <OptionButton
                  key={key}
                  value={key}
                  selected={crowdedness === key}
                  label={val.label}
                  emoji={val.emoji}
                  onSelect={(v: Crowdedness) => setCrowdedness(v)}
                />
              )
            )}
          </div>
        </div>

        {/* Atmosphere */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-white/70 mb-2 block">雰囲気</label>
          <div className="flex gap-2">
            {(Object.entries(ATMOSPHERE_LABELS) as [Atmosphere, { label: string; emoji: string }][]).map(
              ([key, val]) => (
                <OptionButton
                  key={key}
                  value={key}
                  selected={atmosphere === key}
                  label={val.label}
                  emoji={val.emoji}
                  onSelect={(v: Atmosphere) => setAtmosphere(v)}
                />
              )
            )}
          </div>
        </div>

        {/* Gender Ratio */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-white/70 mb-2 block">男女比</label>
          <div className="flex gap-2">
            {(Object.entries(GENDER_RATIO_LABELS) as [GenderRatio, { label: string; emoji: string }][]).map(
              ([key, val]) => (
                <OptionButton
                  key={key}
                  value={key}
                  selected={genderRatio === key}
                  label={val.label}
                  emoji={val.emoji}
                  onSelect={(v: GenderRatio) => setGenderRatio(v)}
                />
              )
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-white/70 mb-2 block">コメント（任意）</label>
          <textarea
            placeholder="今の雰囲気を一言で..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={140}
            rows={2}
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          />
          <div className="text-right text-xs text-white/30 mt-1">{comment.length}/140</div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`w-full py-4 rounded-2xl text-base font-bold transition-all duration-200 ${
            canSubmit && !isSubmitting
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white active:scale-[0.98]'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '送信中...' : '📡 レポートする'}
        </button>
      </div>
    </div>
  )
}
