"use client";

import Link from "next/link";
import { useState } from "react";
import { DEMO_FRIENDS } from "@/lib/demo-data";

const PERMISSION_OPTIONS = [
  { value: "busy_only", label: "Free/Busyのみ" },
  { value: "title", label: "タイトルも表示" },
  { value: "none", label: "非公開" },
] as const;

export default function FriendsPage() {
  const [friends, setFriends] = useState(
    DEMO_FRIENDS.map((f) => ({ ...f }))
  );

  function updatePermission(id: string, level: string) {
    setFriends((prev) =>
      prev.map((f) => (f.id === id ? { ...f, permissionLevel: level } : f))
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">フレンド</h1>
        <button className="text-xl">🔔</button>
      </div>

      <Link
        href="/friends/invite"
        className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-sm"
      >
        + フレンドを招待
      </Link>

      <div className="mt-6 space-y-3">
        <p className="text-xs text-[var(--color-text-secondary)]">{friends.length}人のフレンド</p>

        {friends.map((friend) => (
          <div key={friend.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {friend.displayName[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium">{friend.displayName}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {friend.status === "accepted" ? "✓ フレンド" : "申請中"}
                </p>
              </div>
              <Link
                href={`/friends/calendar/${friend.id}`}
                className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
              >
                📅 カレンダー
              </Link>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
              <span className="text-xs text-[var(--color-text-secondary)]">公開範囲</span>
              <select
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs"
                value={friend.permissionLevel}
                onChange={(e) => updatePermission(friend.id, e.target.value)}
              >
                {PERMISSION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {friends.length === 0 && (
          <div className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
            <p>まだフレンドがいません</p>
            <p className="mt-1">QRコードまたは招待リンクでフレンドを追加しましょう</p>
          </div>
        )}
      </div>
    </div>
  );
}
