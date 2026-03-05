"use client";

import { useState } from "react";
import {
  signupUser, verifyEmail, loginUser, getOutbox,
  saveKycImage, submitKycRequest, addKycAssetMeta, runKycAiScoring, getMyKycRequest,
  getProfile, saveProfile,
} from "@/lib/demo-store";
import type { OutboxMail } from "@/lib/demo-store";

// Simple SVG data URLs for sample images
const SAMPLE_SELFIE = (() => {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!canvas) return "";
  canvas.width = 200; canvas.height = 240;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#E8D5F5"; ctx.fillRect(0, 0, 200, 240);
  ctx.fillStyle = "#B79DFF"; ctx.beginPath(); ctx.arc(100, 100, 60, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#7B8CFF"; ctx.beginPath(); ctx.arc(80, 90, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(120, 90, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#7B8CFF"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(100, 110, 20, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  ctx.fillStyle = "#555"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("Sample Selfie", 100, 220);
  return canvas.toDataURL("image/jpeg", 0.7);
})();

const SAMPLE_ID = (() => {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!canvas) return "";
  canvas.width = 320; canvas.height = 200;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#D5E8F5"; ctx.fillRect(0, 0, 320, 200);
  ctx.strokeStyle = "#7B8CFF"; ctx.lineWidth = 2; ctx.strokeRect(10, 10, 300, 180);
  ctx.fillStyle = "#B79DFF"; ctx.fillRect(20, 30, 80, 100);
  ctx.fillStyle = "#555"; ctx.font = "bold 14px sans-serif"; ctx.fillText("運転免許証", 130, 50);
  ctx.font = "11px sans-serif"; ctx.fillText("氏名: テスト太郎", 130, 80);
  ctx.fillText("生年月日: 1995/01/01", 130, 100);
  ctx.fillText("住所: 宮城県仙台市", 130, 120);
  ctx.font = "10px sans-serif"; ctx.fillStyle = "#999"; ctx.fillText("SAMPLE - Demo Only", 130, 180);
  return canvas.toDataURL("image/jpeg", 0.7);
})();

export default function TestbenchPage() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  const [log, setLog] = useState<string[]>([]);
  const [step, setStep] = useState(0);

  function addLog(msg: string) { setLog(prev => [...prev, `[${new Date().toLocaleTimeString("ja-JP")}] ${msg}`]); }

  function step1_createUser() {
    const email = `test-${Date.now()}@sloty.app`;
    const result = signupUser(email, "password123", "テストユーザー");
    if (!result.ok) { addLog(`❌ 登録失敗: ${result.error}`); return; }
    addLog(`✅ ユーザー登録: ${email}`);

    // Auto-verify email
    const outbox = getOutbox();
    const verifyMail = outbox.find(m => m.to === email && m.subject.includes("確認"));
    if (verifyMail) {
      const link = verifyMail.links[0]?.url ?? "";
      const token = new URL(link, "http://localhost").searchParams.get("token") ?? "";
      if (token) {
        const vr = verifyEmail(token);
        if (vr.ok) addLog("✅ メール認証完了 → 自動ログイン");
        else addLog(`❌ メール認証失敗: ${vr.error}`);
      }
    }
    setStep(1);
  }

  function step2_setProfilePhoto() {
    if (!SAMPLE_SELFIE) { addLog("❌ Canvas非対応"); return; }
    const profile = getProfile();
    profile.photos = [SAMPLE_SELFIE];
    profile.displayName = "テストユーザー";
    profile.bioShort = "テスト用アカウント";
    saveProfile(profile);
    addLog("✅ プロフィール写真セット完了");
    setStep(2);
  }

  function step3_submitKyc() {
    if (!SAMPLE_SELFIE || !SAMPLE_ID) { addLog("❌ Canvas非対応"); return; }
    saveKycImage("selfie", SAMPLE_SELFIE);
    saveKycImage("id_front", SAMPLE_ID);
    saveKycImage("id_back", SAMPLE_ID);
    submitKycRequest(2);
    const req = getMyKycRequest();
    if (req) {
      addKycAssetMeta(req.id, "demo-user-1", "selfie");
      addKycAssetMeta(req.id, "demo-user-1", "id_front");
      addKycAssetMeta(req.id, "demo-user-1", "id_back");
      addKycAssetMeta(req.id, "demo-user-1", "liveness_left");
      addKycAssetMeta(req.id, "demo-user-1", "liveness_right");
      addLog("✅ KYC書類セット＋提出完了");

      setTimeout(() => {
        runKycAiScoring(req.id);
        addLog("✅ AI判定完了 → 管理画面で承認してください");
        setStep(3);
      }, 1500);
    }
  }

  if (!isDemo) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm" style={{ color: "var(--danger)" }}>DEMO_MODE=1 のときのみ利用できます</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg min-h-screen p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dev Testbench</h1>
        <span className="rounded px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>DEV</span>
      </div>
      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>ワンクリックでテスト環境をセットアップ</p>

      <div className="mt-5 space-y-3">
        {/* Step 1 */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: step >= 1 ? "var(--success)" : "var(--accent-soft)", color: step >= 1 ? "white" : "var(--accent-soft-text)" }}>
              {step >= 1 ? "✓" : "1"}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">サンプルユーザー作成＋メール認証</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>登録→メール確認→自動ログイン</p>
            </div>
            <button onClick={step1_createUser} disabled={step >= 1} className="btn-primary text-xs !px-3 !py-1.5" style={{ opacity: step >= 1 ? 0.4 : 1 }}>
              実行
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: step >= 2 ? "var(--success)" : "var(--accent-soft)", color: step >= 2 ? "white" : "var(--accent-soft-text)" }}>
              {step >= 2 ? "✓" : "2"}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">プロフィール写真1枚セット</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>サンプルセルフィーをメイン写真に</p>
            </div>
            <button onClick={step2_setProfilePhoto} disabled={step < 1 || step >= 2} className="btn-primary text-xs !px-3 !py-1.5" style={{ opacity: step >= 1 && step < 2 ? 1 : 0.4 }}>
              実行
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: step >= 3 ? "var(--success)" : "var(--accent-soft)", color: step >= 3 ? "white" : "var(--accent-soft-text)" }}>
              {step >= 3 ? "✓" : "3"}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">KYC書類セット＋提出</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>サンプル画像2枚→AI判定→管理画面で承認</p>
            </div>
            <button onClick={step3_submitKyc} disabled={step < 2 || step >= 3} className="btn-primary text-xs !px-3 !py-1.5" style={{ opacity: step >= 2 && step < 3 ? 1 : 0.4 }}>
              実行
            </button>
          </div>
        </div>

        {/* Step 4 */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>4</span>
            <div className="flex-1">
              <p className="text-sm font-medium">管理画面でKYC承認</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>別タブで /admin を開いて承認</p>
            </div>
            <a href="/admin" target="_blank" className="btn-outline text-xs !px-3 !py-1.5">
              /admin を開く
            </a>
          </div>
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="mt-5 card p-3">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>実行ログ</p>
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {log.map((l, i) => (
              <p key={i} className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{l}</p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 card p-3 text-xs" style={{ backgroundColor: "var(--accent-soft)" }}>
        <p className="font-semibold">関連リンク:</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <a href="/dev/mailbox" className="underline" style={{ color: "var(--accent)" }}>/dev/mailbox</a>
          <a href="/verify" className="underline" style={{ color: "var(--accent)" }}>/verify</a>
          <a href="/profile" className="underline" style={{ color: "var(--accent)" }}>/profile</a>
          <a href="/admin" className="underline" style={{ color: "var(--accent)" }}>/admin</a>
        </div>
      </div>
    </div>
  );
}
