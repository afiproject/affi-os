"use client";

import SquareCard from "@/components/square/SquareCard";
import Link from "next/link";

export default function SquarePage() {
  return (
    <div className="p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">広場</h1>
        <button className="text-xl">🔔</button>
      </div>

      {/* 投稿ボタン */}
      <Link
        href="/square/new"
        className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-sm"
      >
        + 投稿する
        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
          2🎫
        </span>
      </Link>

      {/* フィード（プレースホルダー） */}
      <div className="mt-4 space-y-3">
        <SquareCard
          id="demo-1"
          text="今日の午後暇だ〜 誰か雑談しない？"
          tags={["chat"]}
          preferredMode="call"
          likeCount={12}
          createdAt={new Date(Date.now() - 3 * 60 * 1000).toISOString()}
          user={{
            id: "user-1",
            displayName: "ユーザーA",
          }}
          onLike={(id) => console.log("like", id)}
          onRequest={(id) => console.log("request", id)}
        />
        <SquareCard
          id="demo-2"
          text="カフェで勉強してるけど、一緒にやる人いない？仙台駅周辺です"
          tags={["study", "work"]}
          preferredMode="in_person"
          likeCount={5}
          createdAt={new Date(Date.now() - 45 * 60 * 1000).toISOString()}
          user={{
            id: "user-2",
            displayName: "ユーザーB",
          }}
          onLike={(id) => console.log("like", id)}
          onRequest={(id) => console.log("request", id)}
        />
      </div>
    </div>
  );
}
