"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPrivateEvents,
  addPrivateEvent,
  removePrivateEvent,
  getBookings,
} from "@/lib/demo-store";
import type { DemoEvent, DemoBooking } from "@/lib/demo-store";
import { CATEGORY_LABELS } from "@/lib/demo-data";

/* ── helpers ── */
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmt(d: Date) {
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
}
function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type CalendarItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  kind: "event" | "booking";
  visibility?: string;
  memo?: string;
};

const VISIBILITY_OPTIONS = [
  { value: "busy_only", label: "Busyのみ" },
  { value: "title", label: "タイトル表示" },
  { value: "detail", label: "詳細も表示" },
  { value: "hidden", label: "非公開" },
];

export default function CalendarPage() {
  const [current, setCurrent] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [selected, setSelected] = useState<Date | null>(null);
  const [detail, setDetail] = useState<CalendarItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  /* form state */
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [visibility, setVisibility] = useState("busy_only");
  const [memo, setMemo] = useState("");

  const reload = useCallback(() => {
    setEvents(getPrivateEvents());
    setBookings(getBookings());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /* merge events + bookings into CalendarItems */
  const items: CalendarItem[] = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      endAt: e.endAt,
      kind: "event" as const,
      visibility: e.visibility,
      memo: e.memo,
    })),
    ...bookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => ({
        id: b.id,
        title: CATEGORY_LABELS[b.slot.category] ?? b.slot.category,
        startAt: b.slot.startAt,
        endAt: b.slot.endAt,
        kind: "booking" as const,
      })),
  ];

  function itemsForDay(d: Date) {
    return items.filter((it) => isSameDay(new Date(it.startAt), d));
  }

  /* calendar grid */
  const firstDay = startOfMonth(current);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const total = daysInMonth(current);
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();

  function prevMonth() {
    setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    setSelected(null);
  }
  function nextMonth() {
    setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    setSelected(null);
  }

  function handleAdd() {
    if (!date) return;
    const startAt = new Date(`${date}T${startTime}:00`).toISOString();
    const endAt = new Date(`${date}T${endTime}:00`).toISOString();
    addPrivateEvent({
      id: `ev-${Date.now()}`,
      title: title || "予定",
      startAt,
      endAt,
      visibility: visibility as DemoEvent["visibility"],
      memo: memo || undefined,
    });
    reload();
    setShowAdd(false);
    setTitle("");
    setMemo("");
  }

  function handleDelete(id: string) {
    removePrivateEvent(id);
    reload();
    setDetail(null);
  }

  const selectedItems = selected ? itemsForDay(selected) : [];

  return (
    <div className="p-4 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">カレンダー</h1>
        <button
          onClick={() => {
            setDate(
              selected
                ? `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`
                : new Date().toISOString().slice(0, 10)
            );
            setShowAdd(true);
          }}
          className="btn-primary !px-4 !py-2 text-sm"
        >
          + 予定追加
        </button>
      </div>

      {/* Month nav */}
      <div className="mt-4 flex items-center justify-between">
        <button onClick={prevMonth} className="px-3 py-1 text-lg" style={{ color: "var(--accent)" }}>
          ‹
        </button>
        <span className="text-base font-semibold">{fmt(current)}</span>
        <button onClick={nextMonth} className="px-3 py-1 text-lg" style={{ color: "var(--accent)" }}>
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium" style={{ color: "var(--muted)" }}>
        {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[72px]" style={{ backgroundColor: "var(--bg)" }} />;
          }
          const cellDate = new Date(current.getFullYear(), current.getMonth(), day);
          const dayItems = itemsForDay(cellDate);
          const isToday = isSameDay(cellDate, today);
          const isSelected = selected && isSameDay(cellDate, selected);
          const hasItems = dayItems.length > 0;

          return (
            <button
              key={day}
              onClick={() => setSelected(cellDate)}
              className="relative flex min-h-[72px] flex-col items-start p-1 text-left transition-colors"
              style={{
                backgroundColor: isSelected
                  ? "var(--accent-soft)"
                  : hasItems
                    ? "color-mix(in srgb, var(--accent-soft) 40%, var(--bg))"
                    : "var(--bg)",
              }}
            >
              <span
                className="mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                style={
                  isToday
                    ? { backgroundColor: "var(--accent)", color: "var(--accent-fg)" }
                    : { color: "var(--text)" }
                }
              >
                {day}
              </span>
              {/* Show up to 2 events */}
              {dayItems.slice(0, 2).map((it) => (
                <div
                  key={it.id}
                  className="w-full truncate rounded px-1 text-[10px] leading-tight mb-px"
                  style={{
                    backgroundColor: it.kind === "booking" ? "var(--accent)" : "var(--accent-soft)",
                    color: it.kind === "booking" ? "var(--accent-fg)" : "var(--accent-soft-text)",
                  }}
                >
                  {it.title}
                </div>
              ))}
              {dayItems.length > 2 && (
                <span className="text-[9px] font-medium" style={{ color: "var(--accent)" }}>
                  +{dayItems.length - 2}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold">
            {selected.toLocaleDateString("ja-JP", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
            の予定
          </h2>
          {selectedItems.length === 0 ? (
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
              予定はありません
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {selectedItems.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setDetail(it)}
                  className="card w-full p-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: it.kind === "booking" ? "var(--accent)" : "var(--accent-soft-text)",
                      }}
                    />
                    <span className="font-medium text-sm">{it.title}</span>
                    <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>
                      {timeStr(it.startAt)} - {timeStr(it.endAt)}
                    </span>
                  </div>
                  {it.kind === "booking" && (
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px]"
                      style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}
                    >
                      予約
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div
            className="relative w-full max-w-lg rounded-t-2xl p-5 pb-8"
            style={{ backgroundColor: "var(--card)" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />
            <h3 className="text-lg font-bold">{detail.title}</h3>
            <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--muted)" }}>
              <p>
                🕐 {timeStr(detail.startAt)} - {timeStr(detail.endAt)}
              </p>
              <p>
                📅{" "}
                {new Date(detail.startAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {detail.visibility && (
                <p>
                  🔒{" "}
                  {VISIBILITY_OPTIONS.find((o) => o.value === detail.visibility)?.label ?? detail.visibility}
                </p>
              )}
              {detail.memo && <p>📝 {detail.memo}</p>}
              <p>
                種別：{detail.kind === "booking" ? "予約" : "非公開予定"}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              {detail.kind === "event" && (
                <button
                  onClick={() => handleDelete(detail.id)}
                  className="btn-outline flex-1 text-sm"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                >
                  削除
                </button>
              )}
              <button onClick={() => setDetail(null)} className="btn-primary flex-1 text-sm">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add event modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div
            className="relative w-full max-w-lg rounded-t-2xl p-5 pb-8"
            style={{ backgroundColor: "var(--card)" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />
            <h3 className="text-lg font-bold">予定を追加</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                  タイトル
                </label>
                <input
                  className="input mt-1"
                  placeholder="例: 仕事、ランチ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                  日付
                </label>
                <input
                  type="date"
                  className="input mt-1"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                    開始
                  </label>
                  <input
                    type="time"
                    className="input mt-1"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                    終了
                  </label>
                  <input
                    type="time"
                    className="input mt-1"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                  公開範囲
                </label>
                <select
                  className="input mt-1"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  {VISIBILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                  メモ（任意）
                </label>
                <input
                  className="input mt-1"
                  placeholder="メモ"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
              <button onClick={handleAdd} className="btn-primary w-full text-sm">
                追加する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
