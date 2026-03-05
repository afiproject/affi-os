"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { DEMO_FRIENDS, getDemoCalendarEvents } from "@/lib/demo-data";
import { getPrivateEvents } from "@/lib/demo-store";

const HOUR_START = 8;
const HOUR_END = 22;

export default function FriendCalendarPage() {
  const { friendId } = useParams();
  const router = useRouter();
  const [view, setView] = useState<"week" | "month">("week");
  const friend = DEMO_FRIENDS.find((f) => f.id === friendId);

  // For "my calendar" view
  const isSelf = friendId === "me";
  const events = isSelf
    ? getPrivateEvents().map((e) => ({ startAt: e.startAt, endAt: e.endAt, type: "busy" as const, title: e.title }))
    : getDemoCalendarEvents(friendId as string);

  const displayName = isSelf ? "あなた" : friend?.displayName;

  if (!isSelf && !friend) {
    return (
      <div className="p-4 text-center">
        <p className="mt-12" style={{ color: "var(--muted)" }}>フレンドが見つかりません</p>
        <button className="btn-primary mt-4 text-sm" onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  const permLabel = isSelf ? "自分" : friend!.permissionLevel === "title" ? "タイトル表示" : friend!.permissionLevel === "busy_only" ? "Free/Busyのみ" : "非公開";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * 86400_000));

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full font-semibold"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
          {displayName?.[0]}
        </div>
        <div>
          <h1 className="text-lg font-bold">{displayName}のカレンダー</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>公開範囲: {permLabel}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {(["week", "month"] as const).map((v) => (
          <button key={v} className={`chip ${view === v ? "chip-active" : "chip-inactive"}`} onClick={() => setView(v)}>
            {v === "week" ? "週表示" : "月表示"}
          </button>
        ))}
      </div>

      {view === "week" ? (
        <WeekView days={days} events={events} showTitle={isSelf || friend?.permissionLevel === "title"} />
      ) : (
        <MonthView events={events} showTitle={isSelf || friend?.permissionLevel === "title"} />
      )}

      <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "rgba(220,38,38,0.15)" }} />
          <span>Busy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }} />
          <span>Free</span>
        </div>
      </div>
    </div>
  );
}

function WeekView({ days, events, showTitle }: { days: Date[]; events: { startAt: string; endAt: string; title?: string }[]; showTitle: boolean }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-px">
          <div />
          {days.map((d, i) => (
            <div key={i} className="text-center text-xs py-1" style={{ color: i === 0 ? "var(--accent)" : "var(--muted)", fontWeight: i === 0 ? 700 : 400 }}>
              <div>{d.toLocaleDateString("ja-JP", { weekday: "short" })}</div>
              <div className="text-sm" style={i === 0 ? { backgroundColor: "var(--accent)", color: "var(--accent-fg)", borderRadius: "9999px", width: "1.5rem", height: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" } : {}}>
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-[40px_repeat(7,1fr)] gap-px" style={{ backgroundColor: "var(--border)" }}>
          {Array.from({ length: HOUR_END - HOUR_START }, (_, hi) => {
            const hour = HOUR_START + hi;
            return (
              <div key={hour} className="contents">
                <div className="py-2 pr-1 text-right text-[10px]" style={{ backgroundColor: "var(--bg)", color: "var(--muted)" }}>{hour}:00</div>
                {days.map((d, di) => {
                  const cellStart = new Date(d); cellStart.setHours(hour, 0, 0, 0);
                  const cellEnd = new Date(d); cellEnd.setHours(hour + 1, 0, 0, 0);
                  const overlapping = events.filter((ev) => new Date(ev.startAt) < cellEnd && new Date(ev.endAt) > cellStart);
                  const isBusy = overlapping.length > 0;
                  const title = showTitle ? overlapping.find((e) => e.title)?.title : undefined;
                  return (
                    <div key={di} className="min-h-[28px] flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: isBusy ? "rgba(220,38,38,0.1)" : "var(--bg)", color: isBusy ? "var(--danger)" : undefined }}>
                      {isBusy && (title || "Busy")}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthView({ events, showTitle }: { events: { startAt: string; endAt: string; title?: string }[]; showTitle: boolean }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const busyDays = new Set<number>();
  events.forEach((ev) => {
    const d = new Date(ev.startAt);
    if (d.getFullYear() === year && d.getMonth() === month) busyDays.add(d.getDate());
  });

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-center mb-2">{year}年{month + 1}月</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div key={d} style={{ color: "var(--muted)" }}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="py-1.5 rounded" style={{
            backgroundColor: day && busyDays.has(day) ? "rgba(220,38,38,0.1)" : "transparent",
            color: day === now.getDate() ? "var(--accent)" : day ? "var(--text)" : "transparent",
            fontWeight: day === now.getDate() ? 700 : 400,
          }}>
            {day ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}
