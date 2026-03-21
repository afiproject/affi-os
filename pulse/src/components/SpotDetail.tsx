'use client'

import { CROWDEDNESS_LABELS, ATMOSPHERE_LABELS, GENDER_RATIO_LABELS, CATEGORY_LABELS } from '@/lib/constants'
import type { SpotWithReports } from '@/types/database'

interface SpotDetailProps {
  spot: SpotWithReports
  onReport: () => void
  onClose: () => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'たった今'
  if (mins < 60) return `${mins}分前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}時間前`
  return '1日以上前'
}

export default function SpotDetail({ spot, onReport, onClose }: SpotDetailProps) {
  const latest = spot.latest_report
  const categoryInfo = CATEGORY_LABELS[spot.category] || CATEGORY_LABELS.other

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-gradient-to-b from-gray-900 to-gray-950 rounded-t-3xl p-6 pb-8 animate-slide-up">
        <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-5" />

        {/* Spot header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">{categoryInfo.emoji}</div>
          <div>
            <h2 className="text-xl font-bold text-white">{spot.name}</h2>
            <p className="text-sm text-white/50">{categoryInfo.label} · レポート {spot.report_count}件</p>
          </div>
        </div>

        {latest ? (
          <div className="space-y-3 mb-6">
            {/* Crowdedness */}
            <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
              <span className="text-sm text-white/60">混み具合</span>
              <span className="text-base font-semibold" style={{ color: CROWDEDNESS_LABELS[latest.crowdedness].color }}>
                {CROWDEDNESS_LABELS[latest.crowdedness].emoji} {CROWDEDNESS_LABELS[latest.crowdedness].label}
              </span>
            </div>

            {/* Atmosphere */}
            <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
              <span className="text-sm text-white/60">雰囲気</span>
              <span className="text-base font-semibold text-white">
                {ATMOSPHERE_LABELS[latest.atmosphere].emoji} {ATMOSPHERE_LABELS[latest.atmosphere].label}
              </span>
            </div>

            {/* Gender ratio */}
            <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
              <span className="text-sm text-white/60">男女比</span>
              <span className="text-base font-semibold text-white">
                {GENDER_RATIO_LABELS[latest.gender_ratio].emoji} {GENDER_RATIO_LABELS[latest.gender_ratio].label}
              </span>
            </div>

            {/* Comment */}
            {latest.comment && (
              <div className="bg-white/5 rounded-2xl px-4 py-3">
                <p className="text-sm text-white/80">💬 {latest.comment}</p>
              </div>
            )}

            <p className="text-xs text-white/30 text-center">{timeAgo(latest.created_at)} にレポート</p>
          </div>
        ) : (
          <div className="text-center py-8 mb-6">
            <div className="text-4xl mb-2">🔇</div>
            <p className="text-white/40 text-sm">まだレポートがありません</p>
          </div>
        )}

        {/* Report button */}
        <button
          onClick={onReport}
          className="w-full py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white active:scale-[0.98] transition-transform"
        >
          📡 今の状況をレポート
        </button>
      </div>
    </div>
  )
}
