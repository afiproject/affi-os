"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "@/lib/demo-store";

export default function ForgotPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleReset() {
    setError("");
    if (!email.trim()) { setError("メールアドレスを入力してください"); return; }
    sendPasswordResetEmail(email);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card p-6 text-center w-full">
          <p className="text-3xl">📧</p>
          <h2 className="mt-2 text-lg font-bold">送信完了</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            ご入力のメールアドレスにリセット用リンクを送信しました。
          </p>
          <button onClick={() => router.push("/login")} className="btn-primary w-full mt-4 text-sm">
            ログイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full">
        <h1
          className="text-center text-4xl font-extrabold tracking-wide"
          style={{
            background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 45%, #F3A7C6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SLOTY
        </h1>

        <div className="card mt-8 p-5">
          <h2 className="text-lg font-bold text-center">パスワードリセット</h2>
          <p className="mt-1 text-xs text-center" style={{ color: "var(--muted)" }}>
            登録済みのメールアドレスを入力してください
          </p>

          <div className="mt-4">
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>メールアドレス</label>
            <input
              type="email"
              className="input mt-1"
              placeholder="example@sloty.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
            />
          </div>

          {error && <p className="mt-2 text-xs text-center" style={{ color: "var(--danger)" }}>{error}</p>}

          <button onClick={handleReset} className="btn-primary w-full mt-4 text-sm">
            リセットメールを送信
          </button>

          <p className="mt-4 text-center text-xs">
            <button onClick={() => router.push("/login")} style={{ color: "var(--accent)" }}>
              ← ログイン画面に戻る
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
