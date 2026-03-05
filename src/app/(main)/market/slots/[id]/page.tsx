"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CATEGORY_LABELS } from "@/lib/demo-data";
import { getSlots, addBooking, getTicketBalance, addBookingCalendarEvent } from "@/lib/demo-store";
import type { DemoSlot } from "@/lib/demo-store";

export default function SlotDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [slot, setSlot] = useState<DemoSlot | null>(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const found = getSlots().find((s) => s.id === id);
    setSlot(found ?? null);
  }, [id]);

  if (!slot) {
    return (
      <div className="p-4 text-center">
        <p className="mt-12" style={{ color: "var(--muted)" }}>スロットが見つかりません</p>
        <button className="btn-primary mt-4 text-sm" onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  const dateStr = start.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric", weekday: "short" });
  const timeStr = `${start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;
  const ticketCost = slot.priceYen; // priceYen is reused as ticket count in demo

  function handleBook() {
    const status = slot!.bookingType === "instant" ? "confirmed" as const : "pending" as const;
    const booking = {
      id: `bk-${Date.now()}`,
      slotId: slot!.id,
      slot: slot!,
      status,
      createdAt: new Date().toISOString(),
    };
    addBooking(booking);
    // Auto-add to calendar for instant bookings (confirmed immediately)
    if (status === "confirmed") {
      addBookingCalendarEvent(booking);
    }
    setBooked(true);
  }

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{slot.mode === "call" ? "📞" : "🚶"}</span>
          <h1 className="text-xl font-bold">{CATEGORY_LABELS[slot.category] ?? slot.category}</h1>
        </div>

        <div className="mt-4 space-y-3">
          <div className="card space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm">📅 {dateStr}</div>
            <div className="flex items-center gap-2 text-sm">⏰ {timeStr}（{slot.durationMinutes}分）</div>
            <div className="flex items-center gap-2 text-sm">{slot.mode === "call" ? "📞 通話" : "🚶 対面"}</div>
            {slot.areaValue && <div className="flex items-center gap-2 text-sm">📍 {slot.areaValue}</div>}
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--muted)" }}>消費チケット</span>
              <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>{ticketCost}🎫</span>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>出品者</h2>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                {slot.seller.displayName[0]}
              </div>
              <div>
                <p className="font-medium">{slot.seller.displayName}</p>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                  {slot.seller.verificationStatus === "verified" && <span style={{ color: "var(--success)" }}>✓ 本人確認済み</span>}
                  <span>★ {Number(slot.seller.ratingAvg).toFixed(1)}（{slot.seller.ratingCount}件）</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
            {slot.bookingType === "instant" ? "⚡ 即確定：予約するとすぐに確定します" : "🔒 承認制：出品者の承認後に確定します"}
          </div>
        </div>

        {booked ? (
          <div className="mt-6 rounded-xl p-4 text-center" style={{ backgroundColor: "var(--accent-soft)" }}>
            <p className="text-lg">✓</p>
            <p className="mt-1 font-semibold" style={{ color: "var(--accent-soft-text)" }}>
              {slot.bookingType === "instant" ? "予約が確定しました！" : "承認リクエストを送信しました！"}
            </p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => router.push("/bookings")} className="btn-primary flex-1 text-sm">予約一覧へ</button>
              <button onClick={() => router.push("/market")} className="btn-outline flex-1">マーケットに戻る</button>
            </div>
          </div>
        ) : (
          <button className="btn-primary mt-6 w-full text-base" onClick={handleBook}>
            予約する {ticketCost}🎫
          </button>
        )}
      </div>
    </div>
  );
}
