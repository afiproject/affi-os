"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getBookings, updateBookingStatus, createRoom, getPrivateEvents,
  addBookingCalendarEvent, removeBookingCalendarEvent,
  getRooms, getMessages,
} from "@/lib/demo-store";
import type { DemoBooking } from "@/lib/demo-store";
import { CATEGORY_LABELS, DEMO_USER } from "@/lib/demo-data";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: "確定", color: "var(--success)" },
  pending: { label: "承認待ち", color: "var(--accent)" },
  completed: { label: "完了", color: "var(--muted)" },
  cancelled: { label: "キャンセル", color: "var(--danger)" },
};

type TabKey = "active" | "pending" | "past" | "messages";

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [tab, setTab] = useState<TabKey>("active");
  const [calendarIds, setCalendarIds] = useState<Set<string>>(new Set());
  const [rooms, setRooms] = useState<ReturnType<typeof getRooms>>([]);

  function refreshCalendarIds() {
    const events = getPrivateEvents();
    const ids = new Set(events.filter(e => e.id.startsWith("booking:")).map(e => e.id.replace("booking:", "")));
    setCalendarIds(ids);
  }

  useEffect(() => {
    setBookings(getBookings());
    refreshCalendarIds();
    setRooms(getRooms());
  }, []);

  const confirmed = bookings.filter(b => b.status === "confirmed");
  const pending = bookings.filter(b => b.status === "pending");
  const past = bookings.filter(b => b.status === "completed" || b.status === "cancelled");

  function handleConfirm(id: string) {
    updateBookingStatus(id, "confirmed");
    const updated = getBookings();
    setBookings(updated);
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

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "active", label: "進行中", count: confirmed.length },
    { key: "pending", label: "承認待ち", count: pending.length },
    { key: "past", label: "過去", count: past.length },
    { key: "messages", label: "メッセージ", count: rooms.length },
  ];

  const shownBookings = tab === "active" ? confirmed : tab === "pending" ? pending : tab === "past" ? past : [];

  return (
    <div className="px-5 pt-3 pb-4">
      <h1 className="text-xl font-bold">予約</h1>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`chip whitespace-nowrap ${tab === t.key ? "chip-active" : "chip-inactive"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1 opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {tab === "messages" ? (
        <div className="mt-4 space-y-3">
          {rooms.length === 0 ? (
            <EmptyState icon="💬" text="メッセージはまだありません" />
          ) : (
            rooms.map((room) => {
              const partner = room.participants.find(p => p.id !== DEMO_USER.id);
              const msgs = getMessages(room.id);
              const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
              const isEnded = room.endAt && new Date(room.endAt).getTime() < Date.now();
              return (
                <Link
                  key={room.id}
                  href={`/rooms/${room.id}`}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", opacity: isEnded ? 0.5 : 1 }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                    {partner?.displayName?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate">{partner?.displayName ?? "不明"}</span>
                      {isEnded && <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ color: "var(--muted)", backgroundColor: "var(--accent-soft)" }}>終了</span>}
                    </div>
                    {lastMsg && <p className="mt-0.5 text-xs truncate" style={{ color: "var(--muted)" }}>{lastMsg.text}</p>}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {shownBookings.length === 0 && (
            <EmptyState
              icon="📋"
              text={tab === "active" ? "進行中の予約はありません" : tab === "pending" ? "承認待ちはありません" : "過去の予約はありません"}
              action={tab === "active" ? { label: "スロットを探す", href: "/market" } : undefined}
            />
          )}
          {shownBookings.map((b) => {
            const st = STATUS_LABELS[b.status];
            const start = new Date(b.slot.startAt);
            const roomReady = canOpenRoom(b);
            return (
              <div key={b.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{b.slot.mode === "call" ? "📞" : "🚶"}</span>
                      <span className="text-sm font-semibold">{CATEGORY_LABELS[b.slot.category] ?? b.slot.category}</span>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "var(--accent-soft)", color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm" style={{ color: "var(--muted)" }}>
                    <p>{start.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })} {start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</p>
                    <div className="flex items-center justify-between">
                      <span>{b.slot.seller.displayName}</span>
                      <span className="font-semibold" style={{ color: "var(--accent)" }}>{b.slot.priceYen}🎫</span>
                    </div>
                  </div>
                </div>
                {(roomReady || b.status === "confirmed" || b.status === "pending") && (
                  <div className="px-4 pb-4 flex gap-2">
                    {roomReady && (
                      <>
                        <button onClick={() => handleOpenRoom(b)} className="btn-primary flex-1 !py-2.5 text-xs">💬 チャット</button>
                        <button onClick={() => { const room = createRoom(b.id, [{ id: DEMO_USER.id, displayName: DEMO_USER.displayName }, { id: b.slot.seller.id, displayName: b.slot.seller.displayName }], b.slot.startAt, b.slot.endAt); router.push(`/rooms/${room.id}/call`); }}
                          className="btn-outline flex-1 !py-2.5 text-xs">📞</button>
                        <button onClick={() => { const room = createRoom(b.id, [{ id: DEMO_USER.id, displayName: DEMO_USER.displayName }, { id: b.slot.seller.id, displayName: b.slot.seller.displayName }], b.slot.startAt, b.slot.endAt); router.push(`/rooms/${room.id}/video`); }}
                          className="btn-outline flex-1 !py-2.5 text-xs">📹</button>
                      </>
                    )}
                    {b.status === "confirmed" && !roomReady && (
                      <>
                        <button onClick={() => handleComplete(b.id)} className="btn-primary flex-1 !py-2.5 text-xs">完了にする</button>
                        <button onClick={() => handleCancel(b.id)} className="btn-outline flex-1 !py-2.5 text-xs" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>キャンセル</button>
                      </>
                    )}
                    {b.status === "pending" && (
                      <>
                        <button onClick={() => handleConfirm(b.id)} className="btn-primary flex-1 !py-2.5 text-xs">承認</button>
                        <button onClick={() => handleCancel(b.id)} className="btn-outline flex-1 !py-2.5 text-xs" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>拒否</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, text, action }: { icon: string; text: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{text}</p>
      {action && <Link href={action.href} className="btn-primary mt-2 text-sm">{action.label}</Link>}
    </div>
  );
}
