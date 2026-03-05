"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InvitePage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const inviteLink = "https://sloty.app/invite/demo-abc123";

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm text-[var(--color-text-secondary)]">
        ← 戻る
      </button>

      <h1 className="mt-4 text-xl font-bold">フレンドを招待</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        QRコードまたはリンクを共有して、フレンドを追加できます
      </p>

      {/* QR Code */}
      <div className="mt-6 card p-6 text-center">
        <h2 className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">QRコード</h2>
        <div className="mt-4 mx-auto flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
          <div className="space-y-1 text-center">
            <p className="text-4xl">📱</p>
            <p className="text-xs text-[var(--color-text-secondary)]">QRコード</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">（デモ表示）</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
          相手にこのQRコードを読み取ってもらってください
        </p>
      </div>

      {/* Invite Link */}
      <div className="mt-4 card p-4">
        <h2 className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">招待リンク</h2>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 truncate rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-2 text-xs font-mono">
            {inviteLink}
          </div>
          <button
            onClick={handleCopy}
            className="btn-primary shrink-0 text-xs"
          >
            {copied ? "✓ コピー済み" : "コピー"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          リンクは24時間有効です。期限が切れたら再発行してください。
        </p>
      </div>

      {/* Share button */}
      <button
        className="btn-primary mt-4 w-full text-sm"
        onClick={() => {
          if (navigator.share) {
            navigator.share({ title: "SLOTY フレンド招待", url: inviteLink }).catch(() => {});
          } else {
            handleCopy();
          }
        }}
      >
        共有する
      </button>

      {/* Info */}
      <div className="mt-4 rounded-xl p-3 text-xs"
        style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
        <p className="font-semibold">フレンドになると：</p>
        <ul className="mt-1 space-y-0.5 list-disc pl-4">
          <li>お互いのFree/Busyカレンダーを閲覧可能</li>
          <li>公開範囲はフレンドごとに設定できます</li>
          <li>いつでもフレンド解除可能です</li>
        </ul>
      </div>
    </div>
  );
}
