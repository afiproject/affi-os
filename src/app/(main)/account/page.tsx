"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAuthSession, logoutUser, sendPasswordResetEmail, sendEmailChangeEmail,
} from "@/lib/demo-store";

export default function AccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ userId: string; email: string } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    const s = getAuthSession();
    if (s) setSession({ userId: s.userId, email: s.email });
  }, []);

  function handlePasswordChange() {
    if (!session) return;
    sendPasswordResetEmail(session.email);
    setPwMsg("パスワードリセットメールを送信しました。メールを確認してください。");
  }

  function handleEmailChange() {
    if (!session || !newEmail.trim()) return;
    const result = sendEmailChangeEmail(session.userId, session.email, newEmail);
    if (result && !result.ok) {
      setEmailMsg(result.error ?? "エラー");
    } else {
      setEmailMsg("確認メールを送信しました。メールを確認してください。");
      setNewEmail("");
    }
  }

  function handleLogout() {
    logoutUser();
    router.replace("/login");
  }

  return (
    <div className="p-4 pb-6">
      <h1 className="text-xl font-bold">アカウント設定</h1>

      {/* Current email */}
      <section className="mt-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>メールアドレス</h2>
        <div className="mt-2 card p-4">
          <p className="text-sm">{session?.email ?? "未ログイン"}</p>
        </div>
      </section>

      {/* Email change */}
      <section className="mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>メールアドレス変更</h2>
        <div className="mt-2 card p-4">
          <p className="text-xs" style={{ color: "var(--muted)" }}>新しいメールアドレスに確認メールを送信します</p>
          <div className="mt-2 flex gap-2">
            <input type="email" className="input flex-1" placeholder="新しいメールアドレス" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <button onClick={handleEmailChange} className="btn-primary text-xs !px-3 shrink-0">変更</button>
          </div>
          {emailMsg && <p className="mt-2 text-xs" style={{ color: "var(--accent)" }}>{emailMsg}</p>}
        </div>
      </section>

      {/* Password change */}
      <section className="mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>パスワード変更</h2>
        <div className="mt-2 card p-4">
          <p className="text-xs" style={{ color: "var(--muted)" }}>パスワードリセットメールを送信します（直接入力では変更しません）</p>
          <button onClick={handlePasswordChange} className="btn-outline w-full mt-2 text-xs">パスワード変更メールを送信</button>
          {pwMsg && <p className="mt-2 text-xs" style={{ color: "var(--accent)" }}>{pwMsg}</p>}
        </div>
      </section>

      {/* Logout */}
      <section className="mt-6">
        <button onClick={handleLogout} className="w-full rounded-xl p-3 text-sm font-medium text-center" style={{ color: "var(--danger)", border: "1px solid var(--danger)" }}>
          ログアウト
        </button>
      </section>
    </div>
  );
}
