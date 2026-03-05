"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOutbox } from "@/lib/demo-store";
import type { OutboxMail } from "@/lib/demo-store";

export default function MailboxPage() {
  const router = useRouter();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  const [mails, setMails] = useState<OutboxMail[]>([]);
  const [selected, setSelected] = useState<OutboxMail | null>(null);

  useEffect(() => {
    setMails(getOutbox());
    const iv = setInterval(() => setMails(getOutbox()), 2000);
    return () => clearInterval(iv);
  }, []);

  if (!isDemo) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm" style={{ color: "var(--danger)" }}>この画面はDEMO_MODE=1のときのみ利用できます</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg min-h-screen p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dev Mailbox</h1>
        <span className="rounded px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
          DEV
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
        疑似メールボックス — SLOTYが送信したメールをここで確認できます
      </p>

      {selected ? (
        <div className="mt-4">
          <button onClick={() => setSelected(null)} className="text-xs" style={{ color: "var(--accent)" }}>← 受信箱に戻る</button>
          <div className="mt-3 card p-4">
            <p className="text-xs" style={{ color: "var(--muted)" }}>To: {selected.to}</p>
            <h2 className="mt-1 text-sm font-bold">{selected.subject}</h2>
            <p className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>{new Date(selected.createdAt).toLocaleString("ja-JP")}</p>
            <div className="mt-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {selected.body}
            </div>
            {selected.links.length > 0 && (
              <div className="mt-4 space-y-2">
                {selected.links.map((link, i) => (
                  <a key={i} href={link.url}
                    className="btn-primary block w-full text-center text-sm !py-3">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {mails.length === 0 && (
            <div className="card p-6 text-center">
              <p className="text-2xl">📭</p>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>メールはありません</p>
              <p className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>新規登録すると確認メールが届きます</p>
            </div>
          )}
          {mails.map(mail => (
            <button key={mail.id} onClick={() => setSelected(mail)} className="card w-full text-left p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate flex-1">{mail.subject}</p>
                <span className="ml-2 shrink-0 text-[10px]" style={{ color: "var(--muted)" }}>
                  {new Date(mail.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>To: {mail.to}</p>
              <p className="text-xs mt-1 truncate" style={{ color: "var(--muted)" }}>{mail.body}</p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-[10px]" style={{ color: "var(--muted)" }}>
          テスト手順: /signup で登録 → ここで確認リンクをタップ → /login でログイン
        </p>
      </div>
    </div>
  );
}
