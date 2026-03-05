"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPrivateEvents, addPrivateEvent, removePrivateEvent, checkConflict, getSlots } from "@/lib/demo-store";
import type { DemoEvent, DemoSlot } from "@/lib/demo-store";

const VISIBILITY_OPTIONS = [
  { value: "busy_only", label: "Busyのみ" },
  { value: "title", label: "タイトル表示" },
  { value: "detail", label: "詳細も表示" },
  { value: "hidden", label: "非公開" },
];

export default function PrivateEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [visibility, setVisibility] = useState("busy_only");
  const [memo, setMemo] = useState("");
  const [conflictWarning, setConflictWarning] = useState<DemoSlot | null>(null);

  useEffect(() => { setEvents(getPrivateEvents()); }, []);

  function handleAdd() {
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

    // Check for slot conflicts
    const slots = getSlots();
    const conflicting = slots.find((s) => {
      if (s.status !== "listed") return false;
      const ss = new Date(s.startAt).getTime();
      const se = new Date(s.endAt).getTime();
      const ns = new Date(startAt).getTime();
      const ne = new Date(endAt).getTime();
      return ns < se && ne > ss;
    });
    if (conflicting) {
      setConflictWarning(conflicting);
    }

    setEvents(getPrivateEvents());
    setShowForm(false);
    setTitle(""); setMemo("");
  }

  function handleDelete(id: string) {
    removePrivateEvent(id);
    setEvents(getPrivateEvents());
  }

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
      <h1 className="mt-3 text-lg font-bold">非公開予定</h1>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>登録した予定は空き時間の計算に反映されます</p>

      <button onClick={() => setShowForm(!showForm)} className="btn-primary mt-4 w-full text-sm">
        {showForm ? "閉じる" : "+ 予定を追加"}
      </button>

      {showForm && (
        <div className="mt-4 card p-4 space-y-3">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>タイトル</label>
            <input className="input mt-1" placeholder="例: 仕事" value={title} onChange={(e) => setTitle(e.target.value)} />
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
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>公開範囲</label>
            <select className="input mt-1" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              {VISIBILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>メモ（任意）</label>
            <input className="input mt-1" placeholder="メモ" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full text-sm">追加</button>
        </div>
      )}

      {conflictWarning && (
        <div className="mt-4 rounded-xl p-3 text-xs font-medium" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "var(--danger)" }}>
          ⚠️ 出品中のスロット「{conflictWarning.category}」と時間が衝突しています。販売停止を検討してください。
          <button onClick={() => setConflictWarning(null)} className="ml-2 underline">閉じる</button>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {events.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-3xl">📅</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>非公開予定はまだありません</p>
          </div>
        )}
        {events.map((ev) => {
          const start = new Date(ev.startAt);
          const end = new Date(ev.endAt);
          return (
            <div key={ev.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{ev.title}</span>
                <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                  {VISIBILITY_OPTIONS.find((o) => o.value === ev.visibility)?.label}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {start.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })} {start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} - {end.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </p>
              {ev.memo && <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{ev.memo}</p>}
              <button onClick={() => handleDelete(ev.id)} className="mt-2 text-xs" style={{ color: "var(--danger)" }}>削除</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
