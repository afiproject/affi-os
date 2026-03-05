"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordWithToken } from "@/lib/demo-store";
import { Suspense } from "react";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleReset() {
    setError("");
    if (password.length < 6) { setError("パスワードは6文字以上で設定してください"); return; }
    if (password !== confirm) { setError("パスワードが一致しません"); return; }
    const result = resetPasswordWithToken(token, password);
    if (result.ok) {
      setDone(true);
    } else {
      setError(result.error ?? "リセットに失敗しました");
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card p-6 text-center w-full">
          <p className="text-3xl">❌</p>
          <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>トークンがありません</p>
          <button onClick={() => router.push("/login")} className="btn-primary w-full mt-4 text-sm">ログインへ</button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card p-6 text-center w-full">
          <p className="text-3xl">✅</p>
          <h2 className="mt-2 text-lg font-bold">パスワードを変更しました</h2>
          <button onClick={() => router.push("/login")} className="btn-primary w-full mt-4 text-sm">ログインへ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full">
        <h1 className="text-center text-4xl font-extrabold tracking-wide"
          style={{ background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 45%, #F3A7C6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          SLOTY
        </h1>
        <div className="card mt-8 p-5">
          <h2 className="text-lg font-bold text-center">パスワード再設定</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>新しいパスワード（6文字以上）</label>
              <input type="password" className="input mt-1" placeholder="新しいパスワード" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>パスワード確認</label>
              <input type="password" className="input mt-1" placeholder="もう一度入力" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleReset()} />
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-center" style={{ color: "var(--danger)" }}>{error}</p>}
          <button onClick={handleReset} className="btn-primary w-full mt-4 text-sm">パスワードを変更</button>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>読み込み中...</p></div>}><ResetPasswordInner /></Suspense>;
}
