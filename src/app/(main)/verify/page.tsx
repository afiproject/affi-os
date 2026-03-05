"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMyKycRequest, submitKycRequest, runKycAiScoring, addKycAssetMeta, getKycLevel, saveKycImage } from "@/lib/demo-store";
import type { KycRequest, KycLevel } from "@/lib/demo-store";

const ID_DOC_TYPES = [
  { value: "license", label: "運転免許証" },
  { value: "passport", label: "パスポート" },
  { value: "student", label: "学生証（補助扱い）" },
];

/** Compress image to max 1024px and return dataURL */
function compressImage(file: File, maxSize = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type UploadSlot = {
  key: string;
  label: string;
  sublabel: string;
  capture?: "user" | "environment";
  preview: string | null;
};

export default function VerifyPage() {
  const router = useRouter();
  const [level, setLevel] = useState<KycLevel>(1);
  const [kycReq, setKycReq] = useState<KycRequest | null>(null);
  const [kycLevel, setKycLevelState] = useState<KycLevel>(0);
  const [idDocType, setIdDocType] = useState("license");
  const [submitting, setSubmitting] = useState(false);

  // Image previews
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [livenessLeftDone, setLivenessLeftDone] = useState(false);
  const [livenessRightDone, setLivenessRightDone] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [activeUpload, setActiveUpload] = useState<string>("");

  useEffect(() => {
    setKycReq(getMyKycRequest());
    setKycLevelState(getKycLevel());
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImage(file);
      const target = activeUpload;

      // Save to session/memory
      saveKycImage(target, dataUrl);

      if (target === "selfie") setSelfiePreview(dataUrl);
      if (target === "id_front") setIdFrontPreview(dataUrl);
      if (target === "id_back") setIdBackPreview(dataUrl);
    } catch {
      // ignore compression error
    }
    if (fileRef.current) fileRef.current.value = "";
  }, [activeUpload]);

  function triggerUpload(target: string, capture?: "user" | "environment") {
    setActiveUpload(target);
    if (fileRef.current) {
      if (capture) {
        fileRef.current.setAttribute("capture", capture);
      } else {
        fileRef.current.removeAttribute("capture");
      }
      fileRef.current.click();
    }
  }

  function handleSubmit() {
    setSubmitting(true);
    submitKycRequest(level);
    const req = getMyKycRequest();
    if (req) {
      addKycAssetMeta(req.id, "demo-user-1", "selfie");
      if (level >= 2) {
        addKycAssetMeta(req.id, "demo-user-1", "id_front");
        addKycAssetMeta(req.id, "demo-user-1", "id_back");
        addKycAssetMeta(req.id, "demo-user-1", "liveness_left");
        addKycAssetMeta(req.id, "demo-user-1", "liveness_right");
      }
      setTimeout(() => {
        runKycAiScoring(req.id);
        setKycReq(getMyKycRequest());
        setSubmitting(false);
      }, 2000);
    }
    setKycReq(getMyKycRequest());
  }

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

  function makeSampleSelfie(): string {
    const c = document.createElement("canvas"); c.width = 200; c.height = 240;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#E8D5F5"; ctx.fillRect(0, 0, 200, 240);
    ctx.fillStyle = "#B79DFF"; ctx.beginPath(); ctx.arc(100, 100, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#7B8CFF"; ctx.beginPath(); ctx.arc(80, 90, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(120, 90, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#7B8CFF"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(100, 110, 20, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.fillStyle = "#555"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("Sample Selfie", 100, 220);
    return c.toDataURL("image/jpeg", 0.7);
  }
  function makeSampleId(): string {
    const c = document.createElement("canvas"); c.width = 320; c.height = 200;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#D5E8F5"; ctx.fillRect(0, 0, 320, 200);
    ctx.strokeStyle = "#7B8CFF"; ctx.lineWidth = 2; ctx.strokeRect(10, 10, 300, 180);
    ctx.fillStyle = "#B79DFF"; ctx.fillRect(20, 30, 80, 100);
    ctx.fillStyle = "#555"; ctx.font = "bold 14px sans-serif"; ctx.fillText("運転免許証", 130, 50);
    ctx.font = "11px sans-serif"; ctx.fillText("氏名: テスト太郎", 130, 80);
    ctx.fillText("SAMPLE", 130, 180);
    return c.toDataURL("image/jpeg", 0.7);
  }
  function setSampleSelfie() { const d = makeSampleSelfie(); saveKycImage("selfie", d); setSelfiePreview(d); }
  function setSampleId() { const d = makeSampleId(); saveKycImage("id_front", d); setIdFrontPreview(d); saveKycImage("id_back", d); setIdBackPreview(d); }

  const canSubmitLv1 = !!selfiePreview;
  const canSubmitLv2 = !!selfiePreview && !!idFrontPreview && livenessLeftDone && livenessRightDone;
  const canSubmit = level === 1 ? canSubmitLv1 : canSubmitLv2;

  if (kycLevel >= 2) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">本人確認</h1>
        <div className="mt-6 card p-6 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 text-sm font-medium">Lv2 確認済みです</p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>すべての機能が利用可能です</p>
          <button onClick={() => router.push("/profile")} className="btn-primary mt-4 text-sm">プロフィールへ戻る</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-6">
      <h1 className="text-xl font-bold">本人確認</h1>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>安全な利用のために本人確認をお願いします</p>


      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Status display */}
      {kycReq && kycReq.status !== "approved" && kycReq.status !== "none" && (
        <div className="mt-4 card p-4">
          <p className="text-sm font-medium">申請状況</p>
          <div className="mt-2 rounded-lg p-3 text-xs" style={{
            backgroundColor: kycReq.status === "rejected" || kycReq.status === "resubmit_required" ? "rgba(220,38,38,0.08)" : "rgba(234,179,8,0.1)",
            color: kycReq.status === "rejected" || kycReq.status === "resubmit_required" ? "var(--danger)" : "#b45309"
          }}>
            {kycReq.status === "pending_ai" && "🤖 AI判定中...（約2秒）"}
            {kycReq.status === "pending_review" && `📋 管理者レビュー待ち（AIスコア: ${kycReq.aiScore}）`}
            {kycReq.status === "rejected" && `❌ 却下: ${kycReq.reviewerNote || "理由なし"}`}
            {kycReq.status === "resubmit_required" && `🔄 再提出: ${kycReq.reviewerNote || "書類を確認してください"}`}
          </div>
          {kycReq.status === "pending_review" && (
            <p className="mt-2 text-[10px]" style={{ color: "var(--muted)" }}>/admin → 本人確認 で管理者が承認すると反映されます</p>
          )}
        </div>
      )}

      {/* Level selection */}
      {(!kycReq || kycReq.status === "rejected" || kycReq.status === "resubmit_required" || kycReq.status === "none") && (
        <>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setLevel(1)}
              className="flex-1 rounded-xl p-4 text-center text-sm"
              style={{ backgroundColor: level === 1 ? "var(--accent-soft)" : "var(--bg)", border: level === 1 ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
              <p className="text-2xl">🔓</p>
              <p className="mt-1 font-medium">Lv1 ライト</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>通話OK</p>
            </button>
            <button onClick={() => setLevel(2)}
              className="flex-1 rounded-xl p-4 text-center text-sm"
              style={{ backgroundColor: level === 2 ? "var(--accent-soft)" : "var(--bg)", border: level === 2 ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
              <p className="text-2xl">✅</p>
              <p className="mt-1 font-medium">Lv2 強</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>対面OK</p>
            </button>
          </div>

          {/* Required documents */}
          <div className="mt-4 space-y-3">
            <h3 className="text-sm font-medium">必要書類</h3>

            {/* Selfie */}
            <div className="card !p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">正面セルフィー</p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>Lv1・Lv2 共通</p>
                </div>
                {selfiePreview && <span className="text-sm" style={{ color: "var(--success)" }}>✓</span>}
              </div>

              {/* Preview */}
              {selfiePreview ? (
                <div className="relative rounded-lg overflow-hidden mb-2" style={{ height: 160 }}>
                  <img src={selfiePreview} alt="selfie" className="h-full w-full object-cover" />
                  <button onClick={() => setSelfiePreview(null)}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white text-xs">×</button>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden mb-2 flex items-center justify-center"
                  style={{ height: 160, backgroundColor: "var(--accent-soft)", border: "2px dashed var(--border)" }}>
                  {/* Face guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="rounded-full border-2 border-dashed" style={{ width: 100, height: 120, borderColor: "var(--muted)", opacity: 0.4 }} />
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>顔写真を撮影してください</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => triggerUpload("selfie", "user")} className="btn-primary flex-1 text-xs !py-2">
                  📷 カメラで撮影
                </button>
                <button onClick={() => triggerUpload("selfie")} className="btn-outline flex-1 text-xs !py-2">
                  📁 写真から選択
                </button>
              </div>
            </div>

            {/* ID document (Lv2) */}
            {level >= 2 && (
              <>
                <div className="card !p-3">
                  <p className="text-sm font-medium">身分証明書</p>
                  <select className="input mt-1 text-xs" value={idDocType} onChange={e => setIdDocType(e.target.value)}>
                    {ID_DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>

                  {/* Front */}
                  <div className="mt-3">
                    <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>表面</p>
                    {idFrontPreview ? (
                      <div className="relative rounded-lg overflow-hidden mt-1" style={{ height: 120 }}>
                        <img src={idFrontPreview} alt="id_front" className="h-full w-full object-cover" />
                        <button onClick={() => setIdFrontPreview(null)}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white text-[10px]">×</button>
                      </div>
                    ) : (
                      <div className="rounded-lg mt-1 flex items-center justify-center"
                        style={{ height: 100, backgroundColor: "var(--accent-soft)", border: "2px dashed var(--border)" }}>
                        {/* Card guide */}
                        <div className="rounded border border-dashed" style={{ width: 120, height: 75, borderColor: "var(--muted)", opacity: 0.3 }} />
                      </div>
                    )}
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => triggerUpload("id_front", "environment")} className="btn-primary flex-1 text-xs !py-1.5">📷 撮影</button>
                      <button onClick={() => triggerUpload("id_front")} className="btn-outline flex-1 text-xs !py-1.5">📁 選択</button>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="mt-3">
                    <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>裏面</p>
                    {idBackPreview ? (
                      <div className="relative rounded-lg overflow-hidden mt-1" style={{ height: 120 }}>
                        <img src={idBackPreview} alt="id_back" className="h-full w-full object-cover" />
                        <button onClick={() => setIdBackPreview(null)}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white text-[10px]">×</button>
                      </div>
                    ) : (
                      <div className="rounded-lg mt-1 flex items-center justify-center"
                        style={{ height: 100, backgroundColor: "var(--accent-soft)", border: "2px dashed var(--border)" }}>
                        <div className="rounded border border-dashed" style={{ width: 120, height: 75, borderColor: "var(--muted)", opacity: 0.3 }} />
                      </div>
                    )}
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => triggerUpload("id_back", "environment")} className="btn-primary flex-1 text-xs !py-1.5">📷 撮影</button>
                      <button onClick={() => triggerUpload("id_back")} className="btn-outline flex-1 text-xs !py-1.5">📁 選択</button>
                    </div>
                  </div>
                </div>

                {/* Liveness check */}
                <div className="card !p-3">
                  <p className="text-sm font-medium">ライブネスチェック</p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>なりすまし防止のため、顔を左右に向けてください</p>

                  <div className="mt-3 rounded-lg flex items-center justify-center"
                    style={{ height: 120, backgroundColor: "var(--accent-soft)", border: "1px solid var(--border)" }}>
                    <div className="text-center">
                      <div className="mx-auto rounded-full border-2 border-dashed flex items-center justify-center"
                        style={{ width: 60, height: 70, borderColor: "var(--muted)", opacity: 0.5 }}>
                        <span className="text-2xl" style={{ opacity: 0.3 }}>🧑</span>
                      </div>
                      <p className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>カメラ枠</p>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button onClick={() => setLivenessLeftDone(true)}
                      className={`flex-1 text-xs !py-2.5 ${livenessLeftDone ? "btn-outline" : "btn-primary"}`}>
                      {livenessLeftDone ? "✓ 左向き完了" : "← 左を向く"}
                    </button>
                    <button onClick={() => setLivenessRightDone(true)}
                      className={`flex-1 text-xs !py-2.5 ${livenessRightDone ? "btn-outline" : "btn-primary"}`}>
                      {livenessRightDone ? "✓ 右向き完了" : "右を向く →"}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button onClick={handleSubmit} disabled={!canSubmit || submitting}
              className="btn-primary w-full text-sm !py-3" style={{ opacity: canSubmit && !submitting ? 1 : 0.5 }}>
              {submitting ? "送信中..." : `Lv${level} 申請を送信`}
            </button>
          </div>
        </>
      )}

      <div className="mt-6 card p-4">
        <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>確認レベルについて</p>
        <div className="mt-2 space-y-2 text-xs" style={{ color: "var(--muted)" }}>
          <p><strong>Lv0</strong> — 閲覧のみ（本人確認なし）</p>
          <p><strong>Lv1</strong> — 通話OK（セルフィー提出）</p>
          <p><strong>Lv2</strong> — 対面OK（身分証 + ライブネスチェック）</p>
        </div>
      </div>
    </div>
  );
}
