"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BUBBLE_TEMPLATES } from "@/lib/demo-data";

/**
 * BubblePage — Set your speech bubble for the plaza.
 * Pick from templates or write custom (max 15 chars).
 */
export default function BubblePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(true);
  const MAX_LEN = 15;

  const save = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sloty_bubble", JSON.stringify({ text, enabled }));
    }
    router.back();
  };

  return (
    <div className="px-5 pt-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">吹き出し設定</h1>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div>
          <p className="text-sm font-medium">吹き出しを表示</p>
          <p className="text-[10px]" style={{ color: "var(--muted)" }}>広場で他のユーザーに表示されます</p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          style={{ backgroundColor: enabled ? "var(--accent)" : "#d1d5db" }}
        >
          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: enabled ? "translateX(1.375rem)" : "translateX(0.25rem)" }} />
        </button>
      </div>

      {/* Custom input */}
      <div className="mt-4">
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          カスタム吹き出し（{text.length}/{MAX_LEN}文字）
        </label>
        <input
          type="text"
          className="input mt-1"
          placeholder="今の気分を一言…"
          maxLength={MAX_LEN}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
        />
      </div>

      {/* Templates */}
      <div className="mt-5">
        <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>テンプレートから選ぶ</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {BUBBLE_TEMPLATES.map((t) => (
            <button
              key={t}
              onClick={() => setText(t.slice(0, MAX_LEN))}
              className="rounded-full px-3 py-1.5 text-xs transition-all active:scale-95"
              style={{
                backgroundColor: text === t ? "var(--accent-soft)" : "var(--card)",
                border: text === t ? "2px solid var(--accent)" : "1px solid var(--border)",
                fontWeight: text === t ? 600 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {text && (
        <div className="mt-5">
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>プレビュー</p>
          <div className="mt-2 flex justify-center">
            <div className="relative inline-block rounded-full px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "rgba(255,255,255,0.92)", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", color: "#333" }}>
              {text}
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-1.5" style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid rgba(255,255,255,0.92)" }} />
            </div>
          </div>
        </div>
      )}

      {/* Save */}
      <button onClick={save} className="btn-primary mt-6 w-full">
        保存する
      </button>
    </div>
  );
}
