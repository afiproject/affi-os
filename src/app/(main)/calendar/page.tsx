"use client";

import { useState, useEffect, useCallback } from "react";
import SwipeSheet from "@/components/shared/SwipeSheet";
import {
  getPrivateEvents,
  addPrivateEvent,
  removePrivateEvent,
  getBookings,
  getCalendarVisibility,
  setCalendarVisibility,
  calcCommonFree,
} from "@/lib/demo-store";
import type { DemoEvent, DemoBooking, EventKind, FriendEvent } from "@/lib/demo-store";
import { CATEGORY_LABELS, getDemoFriendCalendarEvents, DEMO_FRIENDS } from "@/lib/demo-data";

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

const KIND_LABELS: Record<EventKind, string> = {
  busy: "🔴 予定あり",
  free: "🟢 話しかけOK",
  private: "🔒 非公開",
  buffer: "⏸️ バッファ",
};
const KIND_COLORS: Record<EventKind, string> = {
  busy: "var(--danger)",
  free: "var(--success)",
  private: "var(--muted)",
  buffer: "#f59e0b",
};

type CalendarItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  itemKind: "event" | "booking" | "friend";
  eventKind?: EventKind;
  visibility?: string;
  memo?: string;
  nearbyExclude?: boolean;
  bufferBefore?: number;
  bufferAfter?: number;
  friendName?: string;
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
  const [dayModal, setDayModal] = useState<Date | null>(null);

  /* friend overlay */
  const [calVis, setCalVis] = useState({ showFriends: false, selectedFriends: [] as string[] });
  const [friendEvents, setFriendEvents] = useState<(FriendEvent & { friendId: string; friendName: string })[]>([]);
  const [showCommonFree, setShowCommonFree] = useState(false);
  const [commonFreeTarget, setCommonFreeTarget] = useState("");
  const [commonFreeSlots, setCommonFreeSlots] = useState<{ start: string; end: string; minutes: number }[]>([]);

  /* form state */
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [visibility, setVisibility] = useState("busy_only");
  const [memo, setMemo] = useState("");
  const [kind, setKind] = useState<EventKind>("busy");
  const [nearbyExclude, setNearbyExclude] = useState(true);
  const [bufferBefore, setBufferBefore] = useState(10);
  const [bufferAfter, setBufferAfter] = useState(10);

  const reload = useCallback(() => {
    setEvents(getPrivateEvents());
    setBookings(getBookings());
    const cv = getCalendarVisibility();
    setCalVis(cv);
    // Load friend events
    if (cv.showFriends && cv.selectedFriends.length > 0) {
      const fEvents: (FriendEvent & { friendId: string; friendName: string })[] = [];
      for (const fid of cv.selectedFriends) {
        const friend = DEMO_FRIENDS.find(f => f.id === fid);
        const evts = getDemoFriendCalendarEvents(fid);
        for (const ev of evts) {
          fEvents.push({ ...ev, friendId: fid, friendName: friend?.displayName ?? fid });
        }
      }
      setFriendEvents(fEvents);
    } else {
      setFriendEvents([]);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /* merge events + bookings + friend events into CalendarItems */
  const items: CalendarItem[] = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      endAt: e.endAt,
      itemKind: "event" as const,
      eventKind: e.kind ?? ("busy" as EventKind),
      visibility: e.visibility,
      memo: e.memo,
      nearbyExclude: e.nearbyExclude ?? true,
      bufferBefore: e.bufferBefore ?? 10,
      bufferAfter: e.bufferAfter ?? 10,
    })),
    ...bookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => ({
        id: b.id,
        title: CATEGORY_LABELS[b.slot.category] ?? b.slot.category,
        startAt: b.slot.startAt,
        endAt: b.slot.endAt,
        itemKind: "booking" as const,
      })),
    ...friendEvents.map((fe, i) => ({
      id: `friend-${fe.friendId}-${i}`,
      title: fe.title ?? (fe.type === "busy" ? "予定あり" : "空き"),
      startAt: fe.startAt,
      endAt: fe.endAt,
      itemKind: "friend" as const,
      eventKind: (fe.type === "busy" ? "busy" : "free") as EventKind,
      friendName: fe.friendName,
    })),
  ];

  function itemsForDay(d: Date) {
    return items.filter((it) => isSameDay(new Date(it.startAt), d));
  }

  /* calendar grid */
  const firstDay = startOfMonth(current);
  const startWeekday = firstDay.getDay();
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

  function resetForm() {
    setTitle("");
    setMemo("");
    setKind("busy");
    setNearbyExclude(true);
    setBufferBefore(10);
    setBufferAfter(10);
    setVisibility("busy_only");
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
      kind,
      nearbyExclude,
      bufferBefore,
      bufferAfter,
    });
    reload();
    setShowAdd(false);
    setDayModal(null);
    resetForm();
  }

  function handleDelete(id: string) {
    removePrivateEvent(id);
    reload();
    setDetail(null);
  }

  function toggleFriendOverlay() {
    const next = { ...calVis, showFriends: !calVis.showFriends };
    if (!calVis.showFriends && calVis.selectedFriends.length === 0) {
      next.selectedFriends = DEMO_FRIENDS.map(f => f.id);
    }
    setCalVis(next);
    setCalendarVisibility(next);
    setTimeout(reload, 50);
  }

  function toggleFriendSelection(fid: string) {
    const sel = calVis.selectedFriends.includes(fid)
      ? calVis.selectedFriends.filter(f => f !== fid)
      : [...calVis.selectedFriends, fid];
    const next = { ...calVis, selectedFriends: sel };
    setCalVis(next);
    setCalendarVisibility(next);
    setTimeout(reload, 50);
  }

  function handleShowCommonFree(fid: string) {
    setCommonFreeTarget(fid);
    setCommonFreeSlots(calcCommonFree(fid));
    setShowCommonFree(true);
  }

  function handleDayTap(cellDate: Date) {
    if (selected && isSameDay(cellDate, selected)) {
      // Double tap → open day modal
      setDayModal(cellDate);
    } else {
      setSelected(cellDate);
    }
  }

  const selectedItems = selected ? itemsForDay(selected) : [];
  const dayModalItems = dayModal ? itemsForDay(dayModal) : [];

  return (
    <div className="p-4 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">カレンダー</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleFriendOverlay}
            className={`!px-3 !py-2 text-xs rounded-lg ${calVis.showFriends ? "btn-primary" : "btn-outline"}`}
          >
            👥 フレンド
          </button>
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
            + 追加
          </button>
        </div>
      </div>

      {/* Friend overlay controls */}
      {calVis.showFriends && (
        <div className="mt-3 card p-3">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>フレンド予定を表示</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEMO_FRIENDS.map(f => (
              <button key={f.id} onClick={() => toggleFriendSelection(f.id)}
                className={`chip text-[11px] ${calVis.selectedFriends.includes(f.id) ? "chip-active" : "chip-inactive"}`}>
                {f.displayName}
              </button>
            ))}
          </div>
          {calVis.selectedFriends.length > 0 && (
            <div className="mt-2 flex gap-1">
              {calVis.selectedFriends.map(fid => {
                const friend = DEMO_FRIENDS.find(f => f.id === fid);
                return (
                  <button key={fid} onClick={() => handleShowCommonFree(fid)}
                    className="rounded-lg px-2 py-1 text-[10px]"
                    style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                    🕐 {friend?.displayName}との空き
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Month nav */}
      <div className="mt-4 flex items-center justify-between">
        <button onClick={prevMonth} className="px-3 py-1 text-lg" style={{ color: "var(--accent)" }}>‹</button>
        <span className="text-base font-semibold">{fmt(current)}</span>
        <button onClick={nextMonth} className="px-3 py-1 text-lg" style={{ color: "var(--accent)" }}>›</button>
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
          const hasFriend = dayItems.some(it => it.itemKind === "friend");

          return (
            <button
              key={day}
              onClick={() => handleDayTap(cellDate)}
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
              {dayItems.filter(it => it.itemKind !== "friend").slice(0, 2).map((it) => (
                <div
                  key={it.id}
                  className="w-full truncate rounded px-1 text-[10px] leading-tight mb-px flex items-center gap-0.5"
                  style={{
                    backgroundColor: it.itemKind === "booking" ? "var(--accent)" : "var(--accent-soft)",
                    color: it.itemKind === "booking" ? "var(--accent-fg)" : "var(--accent-soft-text)",
                  }}
                >
                  {it.eventKind && (
                    <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: KIND_COLORS[it.eventKind] }} />
                  )}
                  <span className="truncate">{it.title}</span>
                </div>
              ))}
              {hasFriend && (
                <div className="w-full truncate rounded px-1 text-[10px] leading-tight mb-px"
                  style={{ backgroundColor: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
                  👥 フレンド
                </div>
              )}
              {dayItems.length > 3 && (
                <span className="text-[9px] font-medium" style={{ color: "var(--accent)" }}>
                  +{dayItems.length - 3}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && !dayModal && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {selected.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}の予定
            </h2>
            <button onClick={() => {
              setDate(`${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`);
              setShowAdd(true);
            }} className="text-xs" style={{ color: "var(--accent)" }}>+ この日に追加</button>
          </div>
          {selectedItems.length === 0 ? (
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>予定はありません</p>
          ) : (
            <div className="mt-2 space-y-2">
              {selectedItems.map((it) => (
                <button
                  key={it.id}
                  onClick={() => it.itemKind !== "friend" && setDetail(it)}
                  className="card w-full p-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: it.itemKind === "booking"
                          ? "var(--accent)"
                          : it.itemKind === "friend"
                            ? "#3b82f6"
                            : KIND_COLORS[it.eventKind ?? "busy"],
                      }}
                    />
                    <span className="font-medium text-sm">{it.title}</span>
                    {it.friendName && <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>{it.friendName}</span>}
                    <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>
                      {timeStr(it.startAt)} - {timeStr(it.endAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {it.eventKind && it.itemKind !== "friend" && (
                      <span className="text-[10px]" style={{ color: KIND_COLORS[it.eventKind] }}>
                        {KIND_LABELS[it.eventKind]}
                      </span>
                    )}
                    {it.itemKind === "booking" && (
                      <span className="rounded-full px-2 py-0.5 text-[10px]"
                        style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                        予約
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Day tap modal */}
      {dayModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDayModal(null)} />
          <div className="relative w-full max-w-lg rounded-t-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: "var(--card)" }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {dayModal.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
              </h3>
              <button onClick={() => {
                setDayModal(null);
                setDate(`${dayModal.getFullYear()}-${String(dayModal.getMonth() + 1).padStart(2, "0")}-${String(dayModal.getDate()).padStart(2, "0")}`);
                setShowAdd(true);
              }} className="btn-primary !px-3 !py-1.5 text-xs">+ 追加</button>
            </div>
            {dayModalItems.length === 0 ? (
              <p className="mt-4 text-sm text-center" style={{ color: "var(--muted)" }}>予定はありません</p>
            ) : (
              <div className="mt-3 space-y-2">
                {dayModalItems.map(it => (
                  <div key={it.id} className="card p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: it.itemKind === "friend" ? "#3b82f6" : it.itemKind === "booking" ? "var(--accent)" : KIND_COLORS[it.eventKind ?? "busy"] }} />
                      <span className="font-medium text-sm flex-1">{it.title}</span>
                      {it.friendName && <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>{it.friendName}</span>}
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{timeStr(it.startAt)} - {timeStr(it.endAt)}</p>
                    {it.itemKind === "event" && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: KIND_COLORS[it.eventKind ?? "busy"] }}>{KIND_LABELS[it.eventKind ?? "busy"]}</span>
                        <button onClick={() => handleDelete(it.id)} className="ml-auto text-[10px]" style={{ color: "var(--danger)" }}>削除</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-lg rounded-t-2xl p-5 pb-8" style={{ backgroundColor: "var(--card)" }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />
            <h3 className="text-lg font-bold">{detail.title}</h3>
            <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--muted)" }}>
              <p>🕐 {timeStr(detail.startAt)} - {timeStr(detail.endAt)}</p>
              <p>📅 {new Date(detail.startAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}</p>
              {detail.eventKind && (
                <p style={{ color: KIND_COLORS[detail.eventKind] }}>{KIND_LABELS[detail.eventKind]}</p>
              )}
              {detail.visibility && (
                <p>🔒 {VISIBILITY_OPTIONS.find((o) => o.value === detail.visibility)?.label ?? detail.visibility}</p>
              )}
              {detail.nearbyExclude !== undefined && (
                <p>{detail.nearbyExclude ? "📡 すれ違い対象外" : "📡 すれ違い自動提案OK"}</p>
              )}
              {(detail.bufferBefore !== undefined || detail.bufferAfter !== undefined) && (
                <p>⏱️ バッファ: 前{detail.bufferBefore ?? 10}分 / 後{detail.bufferAfter ?? 10}分</p>
              )}
              {detail.memo && <p>📝 {detail.memo}</p>}
              <p>種別：{detail.itemKind === "booking" ? "予約" : "非公開予定"}</p>
            </div>
            <div className="mt-4 flex gap-2">
              {detail.itemKind === "event" && (
                <button onClick={() => handleDelete(detail.id)}
                  className="btn-outline flex-1 text-sm"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
                  削除
                </button>
              )}
              <button onClick={() => setDetail(null)} className="btn-primary flex-1 text-sm">閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* Common free time modal */}
      {showCommonFree && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCommonFree(false)} />
          <div className="relative w-full max-w-lg rounded-t-2xl p-5 pb-8" style={{ backgroundColor: "var(--card)" }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />
            <h3 className="text-lg font-bold">
              🕐 {DEMO_FRIENDS.find(f => f.id === commonFreeTarget)?.displayName}との共通空き時間
            </h3>
            {commonFreeSlots.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>今日の共通空き時間が見つかりませんでした</p>
            ) : (
              <div className="mt-3 space-y-2">
                {commonFreeSlots.map((slot, i) => (
                  <div key={i} className="card p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{timeStr(slot.start)} - {timeStr(slot.end)}</p>
                      <p className="text-xs" style={{ color: "var(--success)" }}>{slot.minutes}分の空き</p>
                    </div>
                    <span className="text-xl">🟢</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowCommonFree(false)} className="btn-primary w-full mt-4 text-sm">閉じる</button>
          </div>
        </div>
      )}

      {/* Add event modal (SwipeSheet) */}
      <SwipeSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="予定を追加"
        footer={
          <div className="flex gap-2">
            <button onClick={() => { setShowAdd(false); resetForm(); }} className="btn-outline flex-1 text-sm">キャンセル</button>
            <button onClick={handleAdd} className="btn-primary flex-1 text-sm">追加する</button>
          </div>
        }
      >
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>タイトル</label>
            <input className="input mt-1" placeholder="例: 仕事、ランチ" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>種別</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(["busy", "free", "private", "buffer"] as EventKind[]).map((k) => (
                <button key={k} onClick={() => setKind(k)}
                  className={`chip text-[11px] ${k === kind ? "chip-active" : "chip-inactive"}`}>
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>日付</label>
            <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>開始</label>
              <input type="time" className="input mt-1" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>終了</label>
              <input type="time" className="input mt-1" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>バッファ（移動時間等）</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>前</span>
                <select className="input mt-0.5 text-sm" value={bufferBefore} onChange={(e) => setBufferBefore(Number(e.target.value))}>
                  {[0, 5, 10, 15, 30].map((m) => <option key={m} value={m}>{m}分</option>)}
                </select>
              </div>
              <div>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>後</span>
                <select className="input mt-0.5 text-sm" value={bufferAfter} onChange={(e) => setBufferAfter(Number(e.target.value))}>
                  {[0, 5, 10, 15, 30].map((m) => <option key={m} value={m}>{m}分</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl p-3 text-sm"
            style={{ backgroundColor: "var(--accent-soft)" }}>
            <span style={{ color: "var(--accent-soft-text)" }}>すれ違い対象外</span>
            <button
              onClick={() => setNearbyExclude(!nearbyExclude)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ backgroundColor: nearbyExclude ? "var(--accent)" : "#d1d5db" }}
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                style={{ transform: nearbyExclude ? "translateX(1.375rem)" : "translateX(0.25rem)" }} />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>公開範囲</label>
            <select className="input mt-1" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              {VISIBILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>メモ（任意）</label>
            <input className="input mt-1" placeholder="メモ" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
        </div>
      </SwipeSheet>
    </div>
  );
}
