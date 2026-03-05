"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, resendVerificationEmail, getOutbox, isProfileComplete, findAuthUserByEmail } from "@/lib/demo-store";
import { sendEmailFromOutbox } from "@/lib/send-email";
import { setSessionCookie } from "@/lib/session";

const DEMO_ENTRY_KEY = process.env.NEXT_PUBLIC_DEMO_ENTRY_KEY || "";

// Master account credentials (owner/viewer only - no registration)
const MASTER_ID = "sloty";
const MASTER_PASS = "owner1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needVerify, setNeedVerify] = useState(false);

  // Demo login modal
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoKey, setDemoKey] = useState("");
  const [demoError, setDemoError] = useState("");

  function handleLogin() {
    setError("");
    setNeedVerify(false);
    if (!email || !password) {
      setError("IDまたはメールアドレスとパスワードを入力してください");
      return;
    }

    // Master account check (ID + password, no registration needed)
    if (email === MASTER_ID && password === MASTER_PASS) {
      setSessionCookie({
        userId: "master-owner",
        email: "owner@sloty.app",
        role: "MASTER",
        profileComplete: true,
      });
      router.replace("/home");
      return;
    }

    setLoading(true);
    const result = loginUser(email, password);
    if (result.ok) {
      // Check user's profileComplete flag (persisted in AuthUser record)
      const authUser = findAuthUserByEmail(email);
      const profileDone = authUser?.profileComplete ?? isProfileComplete();
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
      if (result.needVerify) {
        setNeedVerify(true);
      }
      setError(result.error ?? "ログインに失敗しました");
      setLoading(false);
    }
  }

  async function handleResend() {
    resendVerificationEmail(email);
    const outbox = getOutbox();
    const mail = outbox.find((m) => m.to === email && m.subject.includes("確認"));
    if (mail) {
      await sendEmailFromOutbox(mail.to, mail.subject, mail.body, mail.links);
    }
    setError("確認メールを再送しました。メールを確認してください。");
    setNeedVerify(false);
  }

  function handleDemoLogin() {
    setDemoError("");
    if (demoKey !== DEMO_ENTRY_KEY) {
      setDemoError("合言葉が正しくありません");
      return;
    }
    // Set DEMO session cookie
    setSessionCookie({
      userId: "demo-user-1",
      email: "demo@sloty.app",
      role: "DEMO",
      profileComplete: true,
    });
    router.replace("/home");
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
        <p className="mt-1 text-center text-xs" style={{ color: "var(--muted)" }}>
          〜あなたの時間を価値に〜
        </p>

        <div className="card mt-8 p-5">
          <h2 className="text-lg font-bold text-center">ログイン</h2>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                IDまたはメールアドレス
              </label>
              <input
                type="text"
                className="input mt-1"
                placeholder="IDまたはメールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                パスワード
              </label>
              <input
                type="password"
                className="input mt-1"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          {error && (
            <p
              className="mt-2 text-xs text-center"
              style={{ color: needVerify ? "#b45309" : "var(--danger)" }}
            >
              {error}
            </p>
          )}
          {needVerify && (
            <button onClick={handleResend} className="btn-outline w-full mt-2 text-xs">
              確認メールを再送する
            </button>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full mt-4 text-sm"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          <div className="mt-4 flex items-center justify-between text-xs">
            <button onClick={() => router.push("/forgot")} style={{ color: "var(--accent)" }}>
              パスワードを忘れた方
            </button>
            <button onClick={() => router.push("/signup")} style={{ color: "var(--accent)" }}>
              新規登録はこちら
            </button>
          </div>
        </div>

        {/* Demo login button (only shown when DEMO_ENTRY_KEY is set) */}
        {DEMO_ENTRY_KEY && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowDemoModal(true)}
              className="text-xs px-4 py-2 rounded-lg"
              style={{
                color: "var(--muted)",
                border: "1px dashed var(--border)",
              }}
            >
              デモで入る
            </button>
          </div>
        )}
      </div>

      {/* Demo entry key modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDemoModal(false)}
          />
          <div
            className="relative w-full max-w-xs rounded-2xl p-5"
            style={{ backgroundColor: "var(--card)" }}
          >
            <h3 className="text-base font-bold text-center">デモモード</h3>
            <p className="mt-1 text-xs text-center" style={{ color: "var(--muted)" }}>
              合言葉を入力してください
            </p>
            <input
              type="text"
              className="input mt-3"
              placeholder="合言葉"
              value={demoKey}
              onChange={(e) => setDemoKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDemoLogin()}
              autoFocus
            />
            {demoError && (
              <p className="mt-1 text-xs text-center" style={{ color: "var(--danger)" }}>
                {demoError}
              </p>
            )}
            <button onClick={handleDemoLogin} className="btn-primary w-full mt-3 text-sm">
              入る
            </button>
            <button
              onClick={() => setShowDemoModal(false)}
              className="btn-outline w-full mt-2 text-xs"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
