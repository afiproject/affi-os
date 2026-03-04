"use client";

import Link from "next/link";

export default function FriendsPage() {
  return (
    <div className="p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">フレンド</h1>
        <button className="text-xl">🔔</button>
      </div>

      {/* 招待ボタン */}
      <Link
        href="/friends/invite"
        className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-sm"
      >
        + フレンドを招待
      </Link>

      {/* フレンド一覧（プレースホルダー） */}
      <div className="mt-6">
        <div className="text-center text-sm text-[var(--color-text-secondary)]">
          <p>まだフレンドがいません</p>
          <p className="mt-1">QRコードまたは招待リンクでフレンドを追加しましょう</p>
        </div>
      </div>
    </div>
  );
}
