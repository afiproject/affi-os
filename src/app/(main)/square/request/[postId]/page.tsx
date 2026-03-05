"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPosts, consumeTickets, addRequest, getTicketBalance, hasPhotos } from "@/lib/demo-store";
import { DEMO_USER } from "@/lib/demo-data";
import type { DemoPost } from "@/lib/demo-store";

export default function RequestFormPage() {
  const { postId } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<DemoPost | null>(null);
  const [timing, setTiming] = useState<"now" | "today" | "specified">("today");
  const [mode, setMode] = useState<"call" | "in_person">("call");
  const [duration, setDuration] = useState(60);
  const [budget, setBudget] = useState("1000");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState(18);

  useEffect(() => {
    setPost(getPosts().find((p) => p.id === postId) ?? null);
    setTickets(getTicketBalance());
  }, [postId]);

  if (!post) {
    return (
      <div className="p-4 text-center">
        <p className="mt-12" style={{ color: "var(--muted)" }}>投稿が見つかりません</p>
        <button className="btn-primary mt-4 text-sm" onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  function handleSend() {
    setError("");
    if (!hasPhotos()) {
      setError("写真を1枚以上登録してから依頼してください（設定→プロフィール写真）");
      return;
    }
    if (!consumeTickets(5, "時間共有依頼")) {
      setError("チケットが不足しています（5🎫必要）");
      return;
    }
    addRequest({
      id: `req-${Date.now()}`,
      fromUser: { id: DEMO_USER.id, displayName: DEMO_USER.displayName },
      toUser: { id: post!.user.id, displayName: post!.user.displayName },
      postId: post!.id,
      postText: post!.text,
      timing: timing === "now" ? "今から" : timing === "today" ? "今日中" : "日時指定",
      mode,
      durationMinutes: duration,
      budgetYen: parseInt(budget) || 1000,
      note,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl" style={{ color: "var(--accent)" }}>✓</div>
        <p className="mt-3 text-lg font-semibold">依頼を送信しました！</p>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{post.user.displayName}さんの承認を待っています</p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>5🎫 消費 / 拒否時は2🎫返金</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => router.push("/requests/inbox")} className="btn-primary text-sm">受信箱へ</button>
          <button onClick={() => router.push("/square")} className="btn-outline text-sm">広場に戻る</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>

      <h1 className="mt-3 text-lg font-bold">時間共有を依頼</h1>

      <div className="mt-3 card p-3">
        <p className="text-xs" style={{ color: "var(--muted)" }}>元の投稿</p>
        <p className="mt-1 text-sm">「{post.text}」</p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>by {post.user.displayName}</p>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>希望日時</label>
          <div className="mt-1 flex gap-2">
            {([["now", "今から"], ["today", "今日中"], ["specified", "日時指定"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setTiming(v as typeof timing)} className={`chip ${v === timing ? "chip-active" : "chip-inactive"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>形式</label>
          <div className="mt-1 flex gap-2">
            {([["call", "📞 通話"], ["in_person", "🚶 対面"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setMode(v as typeof mode)} className={`chip ${v === mode ? "chip-active" : "chip-inactive"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>時間</label>
          <div className="mt-1 flex gap-2">
            {[30, 60, 90].map((d) => (
              <button key={d} onClick={() => setDuration(d)} className={`chip ${d === duration ? "chip-active" : "chip-inactive"}`}>{d}分</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>消費チケット上限</label>
          <div className="mt-1 flex items-center gap-1">
            <input type="number" className="input" value={budget} onChange={(e) => setBudget(e.target.value)} />
            <span className="text-sm">🎫</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>ひとこと（任意）</label>
          <input type="text" maxLength={80} className="input mt-1" placeholder="よかったら雑談しましょう！" value={note} onChange={(e) => setNote(e.target.value)} />
          <p className="mt-1 text-right text-xs" style={{ color: "var(--muted)" }}>{note.length}/80</p>
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl p-3 text-xs font-medium" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "var(--danger)" }}>{error}</div>}

      <button className="btn-primary mt-6 w-full" onClick={handleSend}>依頼を送信 5🎫</button>
      <p className="mt-2 text-center text-xs" style={{ color: "var(--muted)" }}>残り {tickets}🎫 / 拒否時は2🎫返金</p>
    </div>
  );
}
