"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DEMO_POSTS } from "@/lib/demo-data";

export default function RequestFormPage() {
  const { postId } = useParams();
  const router = useRouter();
  const post = DEMO_POSTS.find((p) => p.id === postId);

  const [timing, setTiming] = useState<"now" | "today" | "specified">("today");
  const [mode, setMode] = useState<"call" | "in_person">("call");
  const [duration, setDuration] = useState(60);
  const [budget, setBudget] = useState("1000");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  if (!post) {
    return (
      <div className="p-4 text-center">
        <p className="mt-12 text-[var(--color-text-secondary)]">投稿が見つかりません</p>
        <button className="btn-primary mt-4 text-sm" onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl">🎉</div>
        <p className="mt-3 text-lg font-semibold">依頼を送信しました！</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {post.user.displayName}さんの承認を待っています
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">5🎫 消費（デモ） / 拒否時は2🎫返金</p>
        <button onClick={() => router.push("/square")} className="btn-primary mt-6 text-sm">広場に戻る</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm text-[var(--color-text-secondary)]">← 戻る</button>

      <h1 className="mt-3 text-lg font-bold">時間共有を依頼</h1>

      <div className="mt-3 card p-3">
        <p className="text-xs text-[var(--color-text-secondary)]">元の投稿</p>
        <p className="mt-1 text-sm">「{post.text}」</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">by {post.user.displayName}</p>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">希望日時</label>
          <div className="mt-1 flex gap-2">
            {([["now", "今から"], ["today", "今日中"], ["specified", "日時指定"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setTiming(v)} className={v === timing ? "btn-primary text-xs" : "rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs"}>{l}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">形式</label>
          <div className="mt-1 flex gap-2">
            {([["call", "📞 通話"], ["in_person", "🚶 対面"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setMode(v)} className={v === mode ? "btn-primary text-xs" : "rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs"}>{l}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">時間</label>
          <div className="mt-1 flex gap-2">
            {[30, 60, 90].map((d) => (
              <button key={d} onClick={() => setDuration(d)} className={d === duration ? "btn-primary text-xs" : "rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs"}>{d}分</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">予算上限</label>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-sm">¥</span>
            <input type="number" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">ひとこと（任意）</label>
          <input type="text" maxLength={80} className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm" placeholder="よかったら雑談しましょう！" value={note} onChange={(e) => setNote(e.target.value)} />
          <p className="mt-1 text-right text-xs text-[var(--color-text-secondary)]">{note.length}/80</p>
        </div>
      </div>

      <button className="btn-primary mt-6 w-full" onClick={() => setSent(true)}>依頼を送信 5🎫</button>
      <p className="mt-2 text-center text-xs text-[var(--color-text-secondary)]">※拒否時は2🎫返金・タイムアウト時は全額返金</p>
    </div>
  );
}
