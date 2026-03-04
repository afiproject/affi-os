"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handlePost = () => {
    if (text.trim() && tags.length > 0) setPosted(true);
  };

  if (posted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl">✓</div>
        <p className="mt-3 text-lg font-semibold">投稿しました！</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">2🎫 消費（デモ）</p>
        <button onClick={() => router.push("/square")} className="btn-primary mt-6 text-sm">広場に戻る</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-[var(--color-text-secondary)]">← 戻る</button>
        <button
          onClick={handlePost}
          disabled={!text.trim() || tags.length === 0}
          className="btn-primary text-xs disabled:opacity-40"
        >
          投稿 2🎫
        </button>
      </div>

      <div className="mt-4">
        <textarea
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm"
          rows={4}
          maxLength={280}
          placeholder="何を考えてる？"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-[var(--color-text-secondary)]">{text.length}/280</p>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">タグ（1つ以上選択）</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAG_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTag(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                tags.includes(t.id)
                  ? "bg-[var(--color-accent)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-text-secondary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">希望形式</label>
        <div className="mt-2 flex gap-2">
          {([["call", "📞 通話"], ["in_person", "🚶 対面"], ["either", "どちらでも"]] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={v === mode ? "btn-primary text-xs" : "rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs"}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-primary-50 p-3 text-center text-xs text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
        残りチケット: 18🎫
      </div>
    </div>
  );
}
