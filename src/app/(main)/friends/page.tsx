"use client";

import Link from "next/link";
import { useState } from "react";
import { DEMO_FRIENDS } from "@/lib/demo-data";

const PERMISSION_OPTIONS = [
  { value: "busy_only", label: "Free/Busyのみ" },
  { value: "title", label: "タイトルも表示" },
  { value: "none", label: "非公開" },
] as const;

type Friend = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  permissionLevel: string;
  status: string;
};

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>(
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
        <Link href="/friends/events" className="text-xs font-medium" style={{ color: "var(--accent)" }}>📅 非公開予定</Link>
      </div>

      <div className="mt-4 flex gap-2">
        <Link href="/friends/invite" className="btn-primary flex-1 text-center text-sm !py-2">+ 招待</Link>
        <Link href="/friends/events" className="btn-outline flex-1 text-center text-sm">非公開予定管理</Link>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-xs" style={{ color: "var(--muted)" }}>{friends.length}人のフレンド</p>

        {friends.map((friend) => (
          <div key={friend.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full font-semibold"
                style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                {friend.displayName[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium">{friend.displayName}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {friend.status === "accepted" ? "✓ フレンド" : "申請中"}
                </p>
              </div>
              <Link
                href={`/friends/calendar/${friend.id}`}
                className="btn-outline !px-3 !py-1.5 text-xs"
              >
                📅 カレンダー
              </Link>
            </div>

            <div className="mt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <span className="text-xs" style={{ color: "var(--muted)" }}>公開範囲</span>
              <select className="input !w-auto !p-1 text-xs"
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
          <div className="mt-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            <p>まだフレンドがいません</p>
            <p className="mt-1">QRコードまたは招待リンクでフレンドを追加しましょう</p>
          </div>
        )}
      </div>
    </div>
  );
}
