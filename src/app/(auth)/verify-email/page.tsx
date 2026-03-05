"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail, isProfileComplete, getAuthSession } from "@/lib/demo-store";
import { setSessionCookie } from "@/lib/session";
import { Suspense } from "react";

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setError("トークンがありません"); return; }
    const result = verifyEmail(token);
    if (result.ok) {
      setStatus("ok");
      // Set session cookie
      const profileDone = isProfileComplete();
      const sess = getAuthSession();
      setSessionCookie({ userId: sess?.userId ?? "verified", email: sess?.email ?? "", role: "USER", profileComplete: profileDone });
      setTimeout(() => router.replace(profileDone ? "/home" : "/onboarding/profile"), 2000);
    } else {
      setStatus("error");
      setError(result.error ?? "確認に失敗しました");
    }
  }, [token, router]);

  return (
    <div className="mx-auto max-w-sm min-h-screen flex flex-col items-center justify-center p-6">
      <div className="card p-6 text-center w-full">
        {status === "loading" && <p className="text-sm">確認中...</p>}
        {status === "ok" && (
          <>
            <p className="text-3xl">✅</p>
            <h2 className="mt-2 text-lg font-bold">メールアドレス確認完了</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>自動的にホーム画面へ移動します...</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-3xl">❌</p>
            <h2 className="mt-2 text-lg font-bold">確認失敗</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>{error}</p>
            <button onClick={() => router.push("/login")} className="btn-primary w-full mt-4 text-sm">ログインへ</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>読み込み中...</p></div>}><VerifyEmailInner /></Suspense>;
}
