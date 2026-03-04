"use client";

import { useParams, useRouter } from "next/navigation";
import { DEMO_FRIENDS, getDemoCalendarEvents } from "@/lib/demo-data";

const HOUR_START = 8;
const HOUR_END = 22;

export default function FriendCalendarPage() {
  const { friendId } = useParams();
  const router = useRouter();
  const friend = DEMO_FRIENDS.find((f) => f.id === friendId);
  const events = getDemoCalendarEvents(friendId as string);

  if (!friend) {
    return (
      <div className="p-4 text-center">
        <p className="mt-12 text-[var(--color-text-secondary)]">フレンドが見つかりません</p>
        <button className="btn-primary mt-4 text-sm" onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() + i * 86400_000);
    return d;
  });

  const permLabel =
    friend.permissionLevel === "title"
      ? "タイトル表示"
      : friend.permissionLevel === "busy_only"
        ? "Free/Busyのみ"
        : "非公開";

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm text-[var(--color-text-secondary)]">
        ← 戻る
      </button>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
          {friend.displayName[0]}
        </div>
        <div>
          <h1 className="text-lg font-bold">{friend.displayName}のカレンダー</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">公開範囲: {permLabel}</p>
        </div>
      </div>

      {/* Week grid */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Day headers */}
          <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-px">
            <div />
            {days.map((d, i) => {
              const isToday = i === 0;
              return (
                <div
                  key={i}
                  className={`text-center text-xs py-1 ${isToday ? "font-bold text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}
                >
                  <div>{d.toLocaleDateString("ja-JP", { weekday: "short" })}</div>
                  <div className={`text-sm ${isToday ? "rounded-full bg-[var(--color-accent)] text-white w-6 h-6 flex items-center justify-center mx-auto" : ""}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hour rows */}
          <div className="mt-1 grid grid-cols-[40px_repeat(7,1fr)] gap-px bg-[var(--color-border)]">
            {Array.from({ length: HOUR_END - HOUR_START }, (_, hi) => {
              const hour = HOUR_START + hi;
              return (
                <div key={hour} className="contents">
                  <div className="bg-[var(--color-bg)] py-2 pr-1 text-right text-[10px] text-[var(--color-text-secondary)]">
                    {hour}:00
                  </div>
                  {days.map((d, di) => {
                    const cellStart = new Date(d);
                    cellStart.setHours(hour, 0, 0, 0);
                    const cellEnd = new Date(d);
                    cellEnd.setHours(hour + 1, 0, 0, 0);

                    const overlapping = events.filter((ev) => {
                      const evStart = new Date(ev.startAt);
                      const evEnd = new Date(ev.endAt);
                      return evStart < cellEnd && evEnd > cellStart;
                    });

                    const isBusy = overlapping.length > 0;
                    const title = overlapping.find((e) => e.title)?.title;

                    return (
                      <div
                        key={di}
                        className={`min-h-[28px] flex items-center justify-center text-[10px] ${
                          isBusy
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-[var(--color-bg)]"
                        }`}
                      >
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

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-100 dark:bg-red-900/30" />
          <span>Busy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-[var(--color-bg)] border border-[var(--color-border)]" />
          <span>Free</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
        ※ {friend.displayName}さんが公開している予定のみ表示されます
      </p>
    </div>
  );
}
