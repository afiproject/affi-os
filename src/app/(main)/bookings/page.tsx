"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getBookings, updateBookingStatus, createRoom, getPrivateEvents,
  addBookingCalendarEvent, removeBookingCalendarEvent,
} from "@/lib/demo-store";
import type { DemoBooking } from "@/lib/demo-store";
import { CATEGORY_LABELS, DEMO_USER } from "@/lib/demo-data";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: "確定", color: "var(--success)" },
  pending: { label: "承認待ち", color: "var(--accent)" },
  completed: { label: "完了", color: "var(--muted)" },
  cancelled: { label: "キャンセル", color: "var(--danger)" },
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [tab, setTab] = useState<"active" | "past">("active");
  const [calendarIds, setCalendarIds] = useState<Set<string>>(new Set());

  function refreshCalendarIds() {
    const events = getPrivateEvents();
    const ids = new Set(events.filter(e => e.id.startsWith("booking:")).map(e => e.id.replace("booking:", "")));
    setCalendarIds(ids);
  }

  useEffect(() => {
    setBookings(getBookings());
    refreshCalendarIds();
  }, []);

  const active = bookings.filter((b) => b.status === "confirmed" || b.status === "pending");
  const past = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");
  const shown = tab === "active" ? active : past;

  function handleConfirm(id: string) {
    updateBookingStatus(id, "confirmed");
    const updated = getBookings();
    setBookings(updated);
    // Auto-add calendar event on confirm
    const booking = updated.find(b => b.id === id);
    if (booking) addBookingCalendarEvent(booking);
    refreshCalendarIds();
  }

  function handleComplete(id: string) {
    updateBookingStatus(id, "completed");
    setBookings(getBookings());
  }

  function handleCancel(id: string) {
    updateBookingStatus(id, "cancelled");
    // Remove calendar event on cancel
    removeBookingCalendarEvent(id);
    setBookings(getBookings());
    refreshCalendarIds();
  }

  function handleOpenRoom(b: DemoBooking) {
    const room = createRoom(
      b.id,
      [
        { id: DEMO_USER.id, displayName: DEMO_USER.displayName },
        { id: b.slot.seller.id, displayName: b.slot.seller.displayName },
      ],
      b.slot.startAt,
      b.slot.endAt
    );
    router.push(`/rooms/${room.id}`);
  }

  function canOpenRoom(b: DemoBooking): boolean {
    if (b.status !== "confirmed") return false;
    const now = Date.now();
    const start = new Date(b.slot.startAt).getTime() - 5 * 60_000;
    const end = new Date(b.slot.endAt).getTime() + 24 * 3600_000;
    return now >= start && now <= end;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">予約</h1>

      <div className="mt-4 flex" style={{ borderBottom: "1px solid var(--border)" }}>
        {(["active", "past"] as const).map((t) => (
          <button key={t}
            className={`flex-1 pb-2 text-center text-sm ${tab === t ? "tab-active" : "tab-inactive"}`}
            onClick={() => setTab(t)}>
            {t === "active" ? `進行中 (${active.length})` : `過去 (${past.length})`}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {shown.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-3xl">📋</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {tab === "active" ? "進行中の予約はありません" : "過去の予約はありません"}
            </p>
            {tab === "active" && <button onClick={() => router.push("/market")} className="btn-primary mt-3 text-sm">マーケットで探す</button>}
          </div>
        )}
        {shown.map((b) => {
          const st = STATUS_LABELS[b.status];
          const start = new Date(b.slot.startAt);
          const roomReady = canOpenRoom(b);
          const onCalendar = calendarIds.has(b.id);
          return (
            <div key={b.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{b.slot.mode === "call" ? "📞" : "🚶"}</span>
                  <span className="font-medium">{CATEGORY_LABELS[b.slot.category] ?? b.slot.category}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {onCalendar && (
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                      style={{ backgroundColor: "rgba(52,199,123,0.12)", color: "var(--success)" }}>
                      📅 カレンダー済
                    </span>
                  )}
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--accent-soft)", color: st.color }}>{st.label}</span>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-sm" style={{ color: "var(--muted)" }}>
                <p>📅 {start.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })} {start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</p>
                <p>👤 {b.slot.seller.displayName}</p>
                <p>🎫 {b.slot.priceYen}枚</p>
              </div>

              {roomReady && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleOpenRoom(b)} className="btn-primary flex-1 text-xs !py-2">💬 チャット</button>
                  <button onClick={() => { const room = createRoom(b.id, [{ id: DEMO_USER.id, displayName: DEMO_USER.displayName }, { id: b.slot.seller.id, displayName: b.slot.seller.displayName }], b.slot.startAt, b.slot.endAt); router.push(`/rooms/${room.id}/call`); }}
                    className="btn-outline flex-1 text-xs !py-2">📞 音声</button>
                  <button onClick={() => { const room = createRoom(b.id, [{ id: DEMO_USER.id, displayName: DEMO_USER.displayName }, { id: b.slot.seller.id, displayName: b.slot.seller.displayName }], b.slot.startAt, b.slot.endAt); router.push(`/rooms/${room.id}/video`); }}
                    className="btn-outline flex-1 text-xs !py-2">📹 ビデオ</button>
                </div>
              )}

              {b.status === "confirmed" && !roomReady && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleComplete(b.id)} className="btn-primary flex-1 text-xs !py-2">完了にする</button>
                  <button onClick={() => handleCancel(b.id)} className="btn-outline flex-1 text-xs" style={{ color: "var(--danger)" }}>キャンセル</button>
                </div>
              )}
              {b.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleConfirm(b.id)} className="btn-primary flex-1 text-xs !py-2">承認（デモ）</button>
                  <button onClick={() => handleCancel(b.id)} className="btn-outline flex-1 text-xs" style={{ color: "var(--danger)" }}>拒否</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
