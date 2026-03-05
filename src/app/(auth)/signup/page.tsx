"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupUser, isProfileComplete } from "@/lib/demo-store";
import { setSessionCookie } from "@/lib/session";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");
    if (!displayName.trim()) { setError("表示名を入力してください"); return; }
    if (!email.trim()) { setError("メールアドレスを入力してください"); return; }
    if (password.length < 6) { setError("パスワードは6文字以上で設定してください"); return; }
    if (password !== confirm) { setError("パスワードが一致しません"); return; }
    if (!agreed) { setError("利用規約への同意が必要です"); return; }

    setLoading(true);
    const result = signupUser(email, password, displayName);
    if (result.ok) {
      // メール確認スキップ：そのままログイン状態にしてリダイレクト
      const profileDone = isProfileComplete();
      setSessionCookie({
        userId: email,
        email,
        role: "USER",
        profileComplete: profileDone,
      });
      if (profileDone) {
        router.replace("/home");
      } else {
        router.replace("/onboarding/profile");
      }
    } else {
      setError(result.error ?? "登録に失敗しました");
    }
    setLoading(false);
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
        <p className="mt-1 text-center text-xs" style={{ color: "var(--muted)" }}>新規アカウント作成</p>

        <div className="card mt-6 p-5">
          <h2 className="text-lg font-bold text-center">新規登録</h2>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>表示名</label>
              <input type="text" className="input mt-1" placeholder="田中 太郎" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>メールアドレス</label>
              <input type="email" className="input mt-1" placeholder="example@sloty.app" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>パスワード（6文字以上）</label>
              <input type="password" className="input mt-1" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>パスワード確認</label>
              <input type="password" className="input mt-1" placeholder="もう一度入力" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                <a href="/legal/terms" target="_blank" style={{ color: "var(--accent)", textDecoration: "underline" }}>利用規約</a>
                および
                <a href="/legal/privacy" target="_blank" style={{ color: "var(--accent)", textDecoration: "underline" }}>プライバシーポリシー</a>
                に同意します
              </span>
            </label>
          </div>

          {error && <p className="mt-2 text-xs text-center" style={{ color: "var(--danger)" }}>{error}</p>}

          <button onClick={handleSignup} disabled={loading} className="btn-primary w-full mt-4 text-sm">
            {loading ? "登録中..." : "アカウントを作成"}
          </button>

          <p className="mt-4 text-center text-xs">
            <button onClick={() => router.push("/login")} style={{ color: "var(--accent)" }}>
              すでにアカウントをお持ちの方
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
