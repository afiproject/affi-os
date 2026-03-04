"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { consumeTickets, addPost, getTicketBalance, hasPhotos } from "@/lib/demo-store";
import { DEMO_USER } from "@/lib/demo-data";

const TAG_OPTIONS = [
  { id: "chat", label: "雑談" },
  { id: "work", label: "作業" },
  { id: "study", label: "勉強" },
  { id: "consult", label: "相談" },
  { id: "game", label: "ゲーム" },
  { id: "walk", label: "散歩" },
];

export default function NewPostPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [mode, setMode] = useState<"call" | "in_person" | "either">("call");
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState(18);

  useEffect(() => { setTickets(getTicketBalance()); }, []);

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handlePost = () => {
    setError("");
    if (!hasPhotos()) {
      setError("写真を1枚以上登録してから投稿してください（設定→プロフィール写真）");
      return;
    }
    if (!text.trim() || tags.length === 0) return;
    if (!consumeTickets(2, "広場投稿")) {
      setError("チケットが不足しています（2🎫必要）");
      return;
    }
    addPost({
      id: `post-${Date.now()}`,
      text: text.trim(),
      tags,
      preferredMode: mode,
      likeCount: 0,
      createdAt: new Date().toISOString(),
      user: { id: DEMO_USER.id, displayName: DEMO_USER.displayName, avatarUrl: null },
    });
    setPosted(true);
  };

  if (posted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl">✓</div>
        <p className="mt-3 text-lg font-semibold">投稿しました！</p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>2🎫 消費</p>
        <button onClick={() => router.push("/square")} className="btn-primary mt-6 text-sm">広場に戻る</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
        <button onClick={handlePost} disabled={!text.trim() || tags.length === 0} className="btn-primary text-xs !px-4 !py-2">投稿 2🎫</button>
      </div>

      <div className="mt-4">
        <textarea className="input" rows={4} maxLength={280} placeholder="何を考えてる？" value={text} onChange={(e) => setText(e.target.value)} />
        <p className="mt-1 text-right text-xs" style={{ color: "var(--muted)" }}>{text.length}/280</p>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>タグ（1つ以上選択）</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAG_OPTIONS.map((t) => (
            <button key={t.id} onClick={() => toggleTag(t.id)} className={`chip ${tags.includes(t.id) ? "chip-active" : "chip-inactive"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>希望形式</label>
        <div className="mt-2 flex gap-2">
          {([["call", "📞 通話"], ["in_person", "🚶 対面"], ["either", "どちらでも"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setMode(v as typeof mode)} className={`chip ${v === mode ? "chip-active" : "chip-inactive"}`}>{l}</button>
          ))}
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl p-3 text-xs font-medium" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "var(--danger)" }}>{error}</div>}

      <div className="mt-6 rounded-xl p-3 text-center text-xs" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
        残りチケット: {tickets}🎫
      </div>
    </div>
  );
}
