"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_SLOTS, CATEGORY_LABELS } from "@/lib/demo-data";

export default function SlotDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const slot = DEMO_SLOTS.find((s) => s.id === id);
  const [booked, setBooked] = useState(false);

  if (!slot) {
    return (
      <div className="p-4 text-center">
        <p className="mt-12 text-[var(--color-text-secondary)]">スロットが見つかりません</p>
        <button className="btn-primary mt-4 text-sm" onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  const dateStr = start.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric", weekday: "short" });
  const timeStr = `${start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm text-[var(--color-text-secondary)]">← 戻る</button>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{slot.mode === "call" ? "📞" : "🚶"}</span>
          <h1 className="text-xl font-bold">{CATEGORY_LABELS[slot.category] ?? slot.category}</h1>
        </div>

        <div className="mt-4 space-y-3">
          <div className="card space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm">📅 {dateStr}</div>
            <div className="flex items-center gap-2 text-sm">⏰ {timeStr}（{slot.durationMinutes}分）</div>
            <div className="flex items-center gap-2 text-sm">
              {slot.mode === "call" ? "📞 通話" : "🚶 対面"}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">💰 ¥{slot.priceYen.toLocaleString()}</div>
          </div>

          <div className="card p-4">
            <h2 className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">出品者</h2>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {slot.seller.displayName[0]}
              </div>
              <div>
                <p className="font-medium">{slot.seller.displayName}</p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  {slot.seller.verificationStatus === "verified" && <span className="text-green-600">✓ 本人確認済み</span>}
                  <span>★ {Number(slot.seller.ratingAvg).toFixed(1)}（{slot.seller.ratingCount}件）</span>
                </div>
              </div>
            </div>
          </div>

          {slot.areaValue && (
            <div className="card p-4">
              <h2 className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">場所</h2>
              <p className="mt-1 text-sm">📍 {slot.areaValue}</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">※詳細は予約成立後に表示されます</p>
            </div>
          )}

          <div className="rounded-xl bg-primary-50 p-3 text-xs text-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
            {slot.bookingType === "instant" ? "⚡ 即確定：予約するとすぐに確定します" : "🔒 承認制：出品者の承認後に確定します"}
          </div>
        </div>

        {booked ? (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
            <p className="text-lg">✓</p>
            <p className="mt-1 font-semibold text-green-700 dark:text-green-300">
              {slot.bookingType === "instant" ? "予約が確定しました！" : "承認リクエストを送信しました！"}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">（デモモード）</p>
            <button onClick={() => router.push("/market")} className="btn-primary mt-3 text-sm">マーケットに戻る</button>
          </div>
        ) : (
          <button className="btn-primary mt-6 w-full text-base" onClick={() => setBooked(true)}>
            予約する ¥{slot.priceYen.toLocaleString()}
          </button>
        )}

        <button className="mt-4 w-full text-center text-xs text-red-400">⚠️ 通報する</button>
      </div>
    </div>
  );
}
