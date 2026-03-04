"use client";

import { useState, useEffect } from "react";
import { getKycRequests, updateKycRequest, addKycAudit, getKycAuditLog, runKycAiScoring } from "@/lib/demo-store";
import type { KycRequest, KycAuditEntry } from "@/lib/demo-store";

const STATUS_COLORS: Record<string, string> = {
  pending_ai: "#f59e0b",
  pending_review: "#3b82f6",
  approved: "#22c55e",
  rejected: "#ef4444",
  resubmit_required: "#f97316",
};
const STATUS_LABELS: Record<string, string> = {
  none: "未申請",
  pending_ai: "AI判定中",
  pending_review: "人間レビュー待ち",
  approved: "承認済み",
  rejected: "却下",
  resubmit_required: "再提出要求",
};

export default function AdminKycPage() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [auditLog, setAuditLog] = useState<KycAuditEntry[]>([]);
  const [selected, setSelected] = useState<KycRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    setRequests(getKycRequests());
    setAuditLog(getKycAuditLog());
    const iv = setInterval(() => {
      setRequests(getKycRequests());
      setAuditLog(getKycAuditLog());
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  function handleApprove(req: KycRequest) {
    updateKycRequest(req.id, { status: "approved", reviewerNote: reviewNote });
    addKycAudit(req.id, "approved", "admin-1", reviewNote || "承認");
    setSelected(null); setReviewNote("");
    setRequests(getKycRequests()); setAuditLog(getKycAuditLog());
  }

  function handleReject(req: KycRequest) {
    updateKycRequest(req.id, { status: "rejected", reviewerNote: reviewNote });
    addKycAudit(req.id, "rejected", "admin-1", reviewNote || "却下");
    setSelected(null); setReviewNote("");
    setRequests(getKycRequests()); setAuditLog(getKycAuditLog());
  }

  function handleResubmit(req: KycRequest) {
    updateKycRequest(req.id, { status: "resubmit_required", reviewerNote: reviewNote });
    addKycAudit(req.id, "resubmit_required", "admin-1", reviewNote || "再提出をお願いします");
    setSelected(null); setReviewNote("");
    setRequests(getKycRequests()); setAuditLog(getKycAuditLog());
  }

  function handleRunAi(req: KycRequest) {
    runKycAiScoring(req.id);
    setRequests(getKycRequests()); setAuditLog(getKycAuditLog());
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">KYC審査キュー</h1>
        <a href="/profile" className="text-xs" style={{ color: "var(--accent)" }}>← アプリへ戻る</a>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>管理者用：本人確認申請の審査</p>

      {/* Queue */}
      <div className="mt-4 space-y-3">
        {requests.length === 0 ? (
          <div className="card p-6 text-center"><p className="text-3xl">📋</p><p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>審査待ちの申請はありません</p></div>
        ) : requests.map(req => (
          <div key={req.id} className="card p-4 cursor-pointer" onClick={() => { setSelected(req); setReviewNote(""); }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-sm">{req.displayName}</span>
                <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>Lv{req.level}</span>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${STATUS_COLORS[req.status]}20`, color: STATUS_COLORS[req.status] }}>
                {STATUS_LABELS[req.status]}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]" style={{ color: "var(--muted)" }}>
              <span>{req.selfieSubmitted ? "✓ セルフィー" : "✕ セルフィー"}</span>
              <span>{req.idDocSubmitted ? "✓ 身分証" : "✕ 身分証"}</span>
              <span>{req.livenessSubmitted ? "✓ ライブネス" : "✕ ライブネス"}</span>
            </div>
            {req.aiScore !== null && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--muted)" }}>AI スコア:</span>
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: "var(--border)" }}>
                  <div className="h-2 rounded-full" style={{ width: `${req.aiScore}%`, backgroundColor: req.aiScore >= 80 ? "var(--success)" : req.aiScore >= 60 ? "#f59e0b" : "var(--danger)" }} />
                </div>
                <span className="text-xs font-medium">{req.aiScore}</span>
              </div>
            )}
            <p className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>{new Date(req.createdAt).toLocaleString("ja-JP")}</p>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md rounded-2xl p-5" style={{ backgroundColor: "var(--card)" }}>
            <h3 className="text-lg font-bold">{selected.displayName}の申請詳細</h3>
            <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--muted)" }}>
              <p>レベル: Lv{selected.level}</p>
              <p>ステータス: {STATUS_LABELS[selected.status]}</p>
              <p>AI スコア: {selected.aiScore ?? "未判定"}</p>
              <p>セルフィー: {selected.selfieSubmitted ? "✓ 提出済み" : "✕ 未提出"}</p>
              <p>身分証: {selected.idDocSubmitted ? "✓ 提出済み" : "✕ 未提出"}</p>
              <p>ライブネス: {selected.livenessSubmitted ? "✓ 提出済み" : "✕ 未提出"}</p>
              {selected.reviewerNote && <p>審査メモ: {selected.reviewerNote}</p>}
              <p>申請日: {new Date(selected.createdAt).toLocaleString("ja-JP")}</p>
            </div>

            {selected.status === "pending_ai" && (
              <button onClick={() => handleRunAi(selected)} className="btn-primary w-full mt-3 text-sm">AI判定を実行</button>
            )}

            {(selected.status === "pending_review" || selected.status === "pending_ai") && (
              <>
                <div className="mt-3">
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>審査メモ</label>
                  <input className="input mt-1" placeholder="理由や所見" value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleReject(selected)} className="btn-outline flex-1 text-xs" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>却下</button>
                  <button onClick={() => handleResubmit(selected)} className="btn-outline flex-1 text-xs" style={{ color: "#f97316", borderColor: "#f97316" }}>再提出要求</button>
                  <button onClick={() => handleApprove(selected)} className="btn-primary flex-1 text-xs">承認</button>
                </div>
              </>
            )}

            <button onClick={() => setSelected(null)} className="btn-outline w-full mt-3 text-sm">閉じる</button>
          </div>
        </div>
      )}

      {/* Audit log */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold" style={{ color: "var(--muted)" }}>監査ログ</h2>
        <div className="mt-2 space-y-1">
          {auditLog.slice(0, 20).map(entry => (
            <div key={entry.id} className="flex items-center gap-2 text-xs py-1" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-[10px] shrink-0" style={{ color: "var(--muted)" }}>{new Date(entry.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="font-medium">{entry.actor}</span>
              <span style={{ color: "var(--muted)" }}>{entry.action}</span>
              <span className="truncate flex-1">{entry.note}</span>
            </div>
          ))}
          {auditLog.length === 0 && <p className="text-xs" style={{ color: "var(--muted)" }}>ログなし</p>}
        </div>
      </div>
    </div>
  );
}
