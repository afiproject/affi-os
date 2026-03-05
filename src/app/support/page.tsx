"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSupportMessage } from "@/lib/demo-store";

export default function SupportPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("お名前を入力してください"); return; }
    if (!email.trim()) { setError("メールアドレスを入力してください"); return; }
    if (!message.trim()) { setError("お問い合わせ内容を入力してください"); return; }
    addSupportMessage(name, email, message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card p-6 text-center w-full">
          <p className="text-3xl">✅</p>
          <h2 className="mt-2 text-lg font-bold">送信完了</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            お問い合わせありがとうございます。内容を確認の上、ご返信いたします。
          </p>
          <button onClick={() => router.back()} className="btn-primary w-full mt-4 text-sm">戻る</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg min-h-screen p-6">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
      <h1 className="mt-4 text-xl font-bold">お問い合わせ</h1>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>ご質問・ご要望・不具合報告などお気軽にどうぞ</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>お名前</label>
          <input type="text" className="input mt-1" placeholder="お名前" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>メールアドレス</label>
          <input type="email" className="input mt-1" placeholder="example@sloty.app" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>お問い合わせ内容</label>
          <textarea
            className="input mt-1"
            rows={5}
            placeholder="お問い合わせ内容をご記入ください"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

        <button onClick={handleSubmit} className="btn-primary w-full text-sm">送信する</button>
      </div>
    </div>
  );
}
