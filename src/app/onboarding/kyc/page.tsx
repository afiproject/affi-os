"use client";

import { useRouter } from "next/navigation";

export default function OnboardingKycPage() {
  const router = useRouter();

  return (
    <div className="p-4 pb-8 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <h1
          className="text-center text-3xl font-extrabold tracking-wide"
          style={{
            background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 45%, #F3A7C6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SLOTY
        </h1>

        <div className="card mt-6 p-6 text-center">
          <p className="text-4xl">🛡️</p>
          <h2 className="mt-3 text-lg font-bold">本人確認のご案内</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            安全にご利用いただくために、本人確認をおすすめしています。
          </p>

          <div className="mt-4 space-y-2 text-left">
            <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-medium">Lv1 ライト確認</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                セルフィー提出のみ。通話機能が使えるようになります。
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-medium">Lv2 フル確認</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                身分証 + ライブネスチェック。対面機能が使えるようになります。
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/verify")}
            className="btn-primary w-full mt-5 text-sm"
          >
            今すぐ本人確認する
          </button>

          <button
            onClick={() => router.replace("/home")}
            className="btn-outline w-full mt-2 text-xs"
          >
            あとで（スキップ）
          </button>
        </div>
      </div>
    </div>
  );
}
