"use client";

import { useState, useEffect } from "react";
import {
  getAdminSession, setAdminSession, clearAdminSession, addAdminAudit, getAdminAuditLog,
  getKycRequests, updateKycRequest, addKycAudit, getKycAuditLog, runKycAiScoring, getKycAssetsMeta, getKycImage,
  getUsers, updateUser, banUser, unbanUser, forcePasswordReset,
  getReports, getRooms, getMessages, getMedia, getCallLogs,
  getTicketLedger, getTicketBalance,
  getAuthUsers, getAuthLog, getSupportMessages,
  getOnboardingProfile, getOnboardingProfileForUser,
} from "@/lib/demo-store";
import type { OnboardingProfile } from "@/lib/demo-store";
import type {
  AdminAuditEntry, KycRequest, KycAuditEntry, KycAssetMeta,
  DemoUser, DemoReport, DemoRoom, DemoMessage, DemoMedia, TicketEntry,
  AuthUser, AuthLogEntry, SupportMessage,
} from "@/lib/demo-store";

// ===== 日本語タブ定義 =====
const ADMIN_TABS = [
  { key: "kyc", label: "本人確認" },
  { key: "users", label: "ユーザー" },
  { key: "reports", label: "通報" },
  { key: "sessions", label: "セッション" },
  { key: "messages", label: "会話ログ" },
  { key: "tickets", label: "チケット" },
  { key: "authlog", label: "認証ログ" },
  { key: "support", label: "問い合わせ" },
  { key: "audit", label: "監査ログ" },
] as const;
type AdminTab = typeof ADMIN_TABS[number]["key"];

const STATUS_LABELS: Record<string, string> = {
  none: "未申請", pending_ai: "AI判定中", pending_review: "審査待ち",
  approved: "承認", rejected: "却下", resubmit_required: "再提出",
};
const STATUS_COLORS: Record<string, string> = {
  pending_ai: "#f59e0b", pending_review: "#3b82f6", approved: "#22c55e",
  rejected: "#ef4444", resubmit_required: "#f97316",
};
const USER_STATUS_LABELS: Record<string, string> = {
  active: "有効", banned: "凍結",
};

// デモ用パスコード（本番ではサーバーサイド検証）
const DEMO_PASSCODE = "sloty2024";

// ===== 文字列正規化（検索用） =====
function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000]+/g, "")
    // ひらがな→カタカナ
    .replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60))
    // 全角英数→半角
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
}

// ===== メインコンポーネント =====
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<AdminTab>("kyc");

  useEffect(() => {
    const session = getAdminSession();
    if (session.authenticated) setAuthed(true);
  }, []);

  function handleLogin() {
    if (passcode === DEMO_PASSCODE) {
      setAdminSession();
      addAdminAudit("ADMIN_LOGIN", "session", "owner", "管理画面ログイン");
      setAuthed(true);
      setError("");
    } else {
      setError("パスコードが正しくありません");
    }
  }

  function handleLogout() {
    clearAdminSession();
    addAdminAudit("ADMIN_LOGOUT", "session", "owner", "管理画面ログアウト");
    setAuthed(false);
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm p-6 mt-20">
        <div className="card p-6 text-center">
          <p className="text-3xl">🔐</p>
          <h1 className="mt-2 text-lg font-bold">管理画面ログイン</h1>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>オーナー専用：パスコードを入力してください</p>
          <input type="password" className="input mt-4" placeholder="パスコード" value={passcode}
            onChange={e => setPasscode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {error && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
          <button onClick={handleLogin} className="btn-primary w-full mt-3 text-sm">ログイン</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">管理画面</h1>
        <div className="flex items-center gap-2">
          <a href="/market" className="text-xs" style={{ color: "var(--accent)" }}>← アプリへ戻る</a>
          <button onClick={handleLogout} className="text-xs px-2 py-1 rounded" style={{ color: "var(--danger)" }}>ログアウト</button>
        </div>
      </div>
      <p className="text-[10px]" style={{ color: "var(--muted)" }}>オーナー: demo@sloty.app ／ セッション有効期限: 30分</p>

      {/* タブ */}
      <div className="mt-4 flex gap-1 overflow-x-auto pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
        {ADMIN_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="shrink-0 px-3 py-2 text-xs font-medium transition-colors"
            style={{ color: tab === t.key ? "var(--accent)" : "var(--muted)", borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "kyc" && <AdminKyc />}
        {tab === "users" && <AdminUsersTab />}
        {tab === "reports" && <AdminReportsTab />}
        {tab === "sessions" && <AdminSessionsTab />}
        {tab === "messages" && <AdminMessagesTab />}
        {tab === "tickets" && <AdminTicketsTab />}
        {tab === "authlog" && <AdminAuthLogTab />}
        {tab === "support" && <AdminSupportTab />}
        {tab === "audit" && <AdminAuditTab />}
      </div>
    </div>
  );
}

// ===== 本人確認タブ =====
function AdminKyc() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [auditLog, setAuditLog] = useState<KycAuditEntry[]>([]);
  const [selected, setSelected] = useState<KycRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [showAssets, setShowAssets] = useState(false);
  const [assets, setAssets] = useState<KycAssetMeta[]>([]);

  useEffect(() => { refresh(); }, []);
  function refresh() { setRequests(getKycRequests()); setAuditLog(getKycAuditLog()); }

  function handleViewAssets(req: KycRequest) {
    addAdminAudit("VIEW_KYC_ASSET", "kyc", req.id, "書類閲覧");
    setAssets(getKycAssetsMeta(req.id));
    setShowAssets(true);
    refresh();
  }
  function handleApprove(req: KycRequest) {
    updateKycRequest(req.id, { status: "approved", reviewerNote: reviewNote });
    addKycAudit(req.id, "approved", "owner", reviewNote || "承認");
    addAdminAudit("APPROVE_KYC", "kyc", req.id, reviewNote || "承認");
    setSelected(null); setReviewNote(""); refresh();
  }
  function handleReject(req: KycRequest) {
    updateKycRequest(req.id, { status: "rejected", reviewerNote: reviewNote });
    addKycAudit(req.id, "rejected", "owner", reviewNote || "却下");
    addAdminAudit("REJECT_KYC", "kyc", req.id, reviewNote || "却下");
    setSelected(null); setReviewNote(""); refresh();
  }
  function handleResubmit(req: KycRequest) {
    updateKycRequest(req.id, { status: "resubmit_required", reviewerNote: reviewNote });
    addKycAudit(req.id, "resubmit_required", "owner", reviewNote || "再提出要求");
    addAdminAudit("RESUBMIT_KYC", "kyc", req.id, reviewNote || "再提出要求");
    setSelected(null); setReviewNote(""); refresh();
  }
  function handleRunAi(req: KycRequest) {
    runKycAiScoring(req.id);
    refresh();
  }

  return (
    <div>
      <h2 className="text-sm font-semibold">本人確認 審査一覧</h2>
      <div className="mt-3 space-y-3">
        {requests.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>審査待ちの申請はありません</p>}
        {requests.map(req => (
          <div key={req.id} className="card p-4 cursor-pointer" onClick={() => { setSelected(req); setReviewNote(""); setShowAssets(false); }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-sm">{req.displayName}</span>
                <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>レベル{req.level}</span>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${STATUS_COLORS[req.status] ?? "#999"}20`, color: STATUS_COLORS[req.status] ?? "#999" }}>
                {STATUS_LABELS[req.status]}
              </span>
            </div>
            {req.aiScore !== null && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--muted)" }}>AIスコア:</span>
                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: "var(--border)" }}>
                  <div className="h-2 rounded-full" style={{ width: `${req.aiScore}%`, backgroundColor: req.aiScore >= 80 ? "var(--success)" : "#f59e0b" }} />
                </div>
                <span className="text-xs font-medium">{req.aiScore}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 詳細モーダル */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md rounded-2xl p-5 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: "var(--card)" }}>
            <h3 className="text-lg font-bold">{selected.displayName} — レベル{selected.level}</h3>
            <p className="text-xs" style={{ color: "var(--muted)" }}>ステータス: {STATUS_LABELS[selected.status]}</p>
            {selected.aiScore !== null && <p className="text-xs" style={{ color: "var(--muted)" }}>AIスコア: {selected.aiScore}</p>}

            {selected.status === "pending_ai" && (
              <button onClick={() => { handleRunAi(selected); setSelected(getKycRequests().find(r => r.id === selected.id) ?? null); }} className="btn-primary w-full mt-3 text-sm">AI判定を実行</button>
            )}

            {/* 提出書類の閲覧 */}
            <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-medium">提出書類</p>
              <button onClick={() => handleViewAssets(selected)} className="btn-outline w-full mt-1 text-[10px]">書類を確認する</button>
              {showAssets && (
                <div className="mt-2 space-y-2">
                  {assets.length === 0 && <p className="text-[10px]" style={{ color: "var(--muted)" }}>書類データなし</p>}
                  {assets.map(a => {
                    const ASSET_LABELS: Record<string, string> = {
                      selfie: "セルフィー", id_front: "身分証（表）", id_back: "身分証（裏）",
                      liveness_left: "ライブネス（左）", liveness_right: "ライブネス（右）",
                    };
                    const imgData = getKycImage(a.assetType);
                    return (
                      <div key={a.id} className="p-2 rounded" style={{ backgroundColor: "var(--accent-soft)" }}>
                        <p className="text-[10px] font-medium">📄 {ASSET_LABELS[a.assetType] ?? a.assetType}</p>
                        {imgData ? (
                          <div className="relative mt-1 rounded-lg overflow-hidden select-none" style={{ maxHeight: 200, pointerEvents: "none" }}>
                            <img src={imgData} alt={a.assetType} className="w-full object-contain" style={{ maxHeight: 200 }} draggable={false} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-bold rotate-[-25deg] select-none" style={{ color: "rgba(0,0,0,0.15)" }}>
                                SLOTY管理 {new Date().toISOString().slice(0, 10)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>画像データなし（{a.objectKey}）</p>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-[9px]" style={{ color: "var(--muted)" }}>※ ウォーターマーク付き一時表示。ダウンロード不可。</p>
                </div>
              )}
            </div>

            {(selected.status === "pending_review" || selected.status === "pending_ai") && (
              <>
                <div className="mt-3">
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>審査メモ（任意）</label>
                  <input className="input mt-1" placeholder="メモがあれば入力" value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleReject(selected)} className="btn-outline flex-1 text-xs" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>却下</button>
                  <button onClick={() => handleResubmit(selected)} className="btn-outline flex-1 text-xs" style={{ color: "#f97316", borderColor: "#f97316" }}>再提出</button>
                  <button onClick={() => handleApprove(selected)} className="btn-primary flex-1 text-xs">承認</button>
                </div>
              </>
            )}
            <button onClick={() => setSelected(null)} className="btn-outline w-full mt-3 text-sm">閉じる</button>
          </div>
        </div>
      )}

      {/* 本人確認 監査ログ */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold" style={{ color: "var(--muted)" }}>本人確認 操作履歴</h3>
        <div className="mt-2 space-y-1">
          {auditLog.slice(0, 30).map(entry => (
            <div key={entry.id} className="flex items-center gap-2 text-[10px] py-1" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="shrink-0" style={{ color: "var(--muted)" }}>{new Date(entry.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="font-medium">{entry.actor}</span>
              <span style={{ color: "var(--muted)" }}>{entry.action}</span>
              <span className="truncate flex-1">{entry.note}</span>
            </div>
          ))}
          {auditLog.length === 0 && <p className="text-[10px]" style={{ color: "var(--muted)" }}>履歴なし</p>}
        </div>
      </div>
    </div>
  );
}

// ===== ユーザータブ =====
function AdminUsersTab() {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [selected, setSelected] = useState<DemoUser | null>(null);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { setUsers(getUsers()); setAuthUsers(getAuthUsers()); }, []);

  // Load onboarding profiles per user (check user-specific key, then email key, then global fallback)
  function getProfileForUser(u: DemoUser): OnboardingProfile {
    const byId = getOnboardingProfileForUser(u.id);
    if (byId.displayName) return byId;
    const byEmail = getOnboardingProfileForUser(u.loginEmail);
    if (byEmail.displayName) return byEmail;
    return getOnboardingProfile();
  }

  const filteredUsers = search.trim()
    ? users.filter(u => {
        const q = normalize(search);
        const obProfile = getProfileForUser(u);
        return normalize(u.displayName).includes(q)
          || normalize(u.loginEmail).includes(q)
          || normalize(u.id).includes(q)
          || (obProfile.nameKanji && normalize(obProfile.nameKanji).includes(q))
          || (obProfile.nameHiragana && normalize(obProfile.nameHiragana).includes(q))
          || (obProfile.nameKatakana && normalize(obProfile.nameKatakana).includes(q))
          || (obProfile.birthdate && obProfile.birthdate.includes(search.trim()));
      })
    : users;

  function handleBan(u: DemoUser) {
    addAdminAudit("BAN_USER", "user", u.id, "凍結");
    banUser(u.id);
    setUsers(getUsers()); setSelected(null);
  }
  function handleUnban(u: DemoUser) {
    addAdminAudit("UNBAN_USER", "user", u.id, "凍結解除");
    unbanUser(u.id);
    setUsers(getUsers()); setSelected(null);
  }
  function handleForceReset(u: DemoUser) {
    addAdminAudit("FORCE_PASSWORD_RESET", "user", u.id, "パスワード強制リセット");
    forcePasswordReset(u.id);
    setUsers(getUsers()); setSelected(null);
  }
  function handleSaveNote(u: DemoUser) {
    updateUser(u.id, { adminNote: note });
    setUsers(getUsers());
  }

  return (
    <div>
      <h2 className="text-sm font-semibold">ユーザー管理</h2>
      <p className="text-[10px]" style={{ color: "var(--muted)" }}>パスワードの平文閲覧は不可（ハッシュ化保存前提）</p>

      {/* 検索 */}
      <input className="input mt-3 text-xs" placeholder="表示名・メール・ID・本名・ふりがな・カタカナ・生年月日で検索" value={search} onChange={e => setSearch(e.target.value)} />

      <div className="mt-3 space-y-2">
        {filteredUsers.length === 0 && <p className="text-xs" style={{ color: "var(--muted)" }}>該当するユーザーはいません</p>}
        {filteredUsers.map(u => (
          <div key={u.id} className="card p-3 cursor-pointer" onClick={() => { setSelected(u); setNote(u.adminNote); }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{u.displayName}</span>
                <span className="text-[10px] px-1 rounded" style={{
                  backgroundColor: u.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  color: u.status === "active" ? "var(--success)" : "var(--danger)"
                }}>
                  {USER_STATUS_LABELS[u.status] ?? u.status}
                </span>
              </div>
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>レベル{u.kycLevel}</span>
            </div>
            <div className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>
              <span>{u.loginEmail}</span> ／ <span>{u.loginProvider}</span> ／ <span>通報{u.reportCount}件</span>
              {u.forceResetFlag && <span className="ml-1" style={{ color: "var(--danger)" }}>※パスワード強制リセット済</span>}
            </div>
            {(() => { const au = authUsers.find(a => a.email.toLowerCase() === u.loginEmail.toLowerCase()); return au ? (
              <div className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>
                登録: {new Date(au.createdAt).toLocaleDateString("ja-JP")} ／ 最終ログイン: {au.lastLoginAt ? new Date(au.lastLoginAt).toLocaleString("ja-JP") : "なし"} ／ ログイン{au.loginCount}回
              </div>
            ) : null; })()}
          </div>
        ))}
      </div>

      {/* ユーザー詳細モーダル */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md rounded-2xl p-5" style={{ backgroundColor: "var(--card)" }}>
            <h3 className="text-lg font-bold">{selected.displayName}</h3>
            <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--muted)" }}>
              <p>ユーザーID: {selected.id}</p>
              <p>メールアドレス: {selected.loginEmail}</p>
              <p>ログイン方式: {selected.loginProvider}</p>
              <p>本人確認レベル: レベル{selected.kycLevel}</p>
              <p>通報回数: {selected.reportCount}件</p>
              <p>最終アクティブ: {new Date(selected.lastActiveAt).toLocaleString("ja-JP")}</p>
              <p>状態: {USER_STATUS_LABELS[selected.status] ?? selected.status}</p>
              {selected.forceResetFlag && <p style={{ color: "var(--danger)" }}>※ パスワード強制リセット済み</p>}
              <p className="text-[10px] italic">※ パスワードの平文閲覧は不可（仕様）</p>
              {/* Onboarding Profile (per-user) */}
              {(() => { const up = getProfileForUser(selected); return up.nameKanji ? (
                <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-semibold" style={{ color: "var(--accent)" }}>プロフィール情報</p>
                  <p>本名: {up.nameKanji}</p>
                  {up.nameHiragana && <p>ふりがな: {up.nameHiragana}</p>}
                  {up.nameKatakana && <p>カタカナ: {up.nameKatakana}</p>}
                  {up.birthdate && <p>生年月日: {up.birthdate}</p>}
                  {up.gender && <p>性別: {up.gender}</p>}
                  {up.area && <p>エリア: {up.area}</p>}
                  {up.job && <p>職業: {up.job}</p>}
                  {up.interests.length > 0 && <p>趣味: {up.interests.join(", ")}</p>}
                  {up.bio && <p>自己紹介: {up.bio}</p>}
                </div>
              ) : <p className="mt-2 text-[10px]" style={{ color: "var(--muted)" }}>プロフィール未入力</p>; })()}
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>管理者メモ</label>
              <input className="input mt-1 text-xs" value={note} onChange={e => setNote(e.target.value)} placeholder="メモ（任意）" />
              <button onClick={() => handleSaveNote(selected)} className="btn-outline w-full mt-1 text-[10px]">メモを保存</button>
            </div>
            <div className="mt-3 flex gap-2">
              {selected.status === "active" ? (
                <button onClick={() => handleBan(selected)} className="btn-outline flex-1 text-xs" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>凍結する</button>
              ) : (
                <button onClick={() => handleUnban(selected)} className="btn-outline flex-1 text-xs" style={{ color: "var(--success)", borderColor: "var(--success)" }}>凍結解除</button>
              )}
              <button onClick={() => handleForceReset(selected)} className="btn-outline flex-1 text-xs" style={{ color: "#f59e0b", borderColor: "#f59e0b" }}>パスワード強制リセット</button>
            </div>
            <button onClick={() => setSelected(null)} className="btn-outline w-full mt-3 text-sm">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 通報タブ =====
function AdminReportsTab() {
  const [reports, setReports] = useState<DemoReport[]>([]);
  useEffect(() => { setReports(getReports()); }, []);

  return (
    <div>
      <h2 className="text-sm font-semibold">通報一覧</h2>
      <div className="mt-3 space-y-2">
        {reports.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>通報はありません</p>}
        {reports.map(r => (
          <div key={r.id} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">通報 #{r.id.slice(-4)}</span>
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>{new Date(r.createdAt).toLocaleString("ja-JP")}</span>
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              <p>ルーム: {r.roomId} ／ 対象: {r.targetId}</p>
              <p>理由: {r.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== セッションタブ =====
function AdminSessionsTab() {
  const [rooms, setRooms] = useState<DemoRoom[]>([]);
  useEffect(() => { setRooms(getRooms()); }, []);

  return (
    <div>
      <h2 className="text-sm font-semibold">セッション一覧</h2>
      <p className="text-[10px]" style={{ color: "var(--muted)" }}>成立した予約・通話・対面の履歴</p>
      <div className="mt-3 space-y-2">
        {rooms.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>セッションはありません</p>}
        {rooms.map(r => {
          const calls = getCallLogs(r.id);
          return (
            <div key={r.id} className="card p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{r.participants.map(p => p.displayName).join(" ／ ")}</span>
                <span className="text-[10px]" style={{ color: r.extended ? "var(--accent)" : "var(--muted)" }}>{r.extended ? "延長済" : ""}</span>
              </div>
              <div className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>
                <p>{new Date(r.startAt).toLocaleString("ja-JP")} 〜 {new Date(r.endAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</p>
                <p>通話回数: {calls.length}回</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 会話ログタブ（ページング・件数制限なし） =====
const PAGE_SIZE = 50;

function AdminMessagesTab() {
  const [rooms, setRoomsState] = useState<DemoRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessagesState] = useState<DemoMessage[]>([]);
  const [media, setMediaState] = useState<DemoMedia[]>([]);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [roomSearch, setRoomSearch] = useState("");

  useEffect(() => { setRoomsState(getRooms()); }, []);

  function handleOpenRoom(roomId: string) {
    addAdminAudit("VIEW_CHAT_LOG", "room", roomId, "会話ログ閲覧");
    const allMsgs = getMessages(roomId);
    setMessagesState(allMsgs);
    setMediaState(getMedia(roomId));
    setSelectedRoomId(roomId);
    setPage(0);
    setSearchQuery("");
  }

  // 外部連絡先マスク
  const CONTACT_RE = /(\d{3}[-\s]?\d{4}[-\s]?\d{4}|@[a-zA-Z0-9_.]+|LINE|カカオ|instagram|twitter|discord)/gi;
  function maskText(text: string): string {
    return text.replace(CONTACT_RE, "***非表示***");
  }

  // フィルタ済みメッセージ
  const filteredMsgs = searchQuery.trim()
    ? messages.filter(m => normalize(m.text).includes(normalize(searchQuery)) || normalize(m.senderName).includes(normalize(searchQuery)))
    : messages;

  const totalPages = Math.max(1, Math.ceil(filteredMsgs.length / PAGE_SIZE));
  const pagedMsgs = filteredMsgs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ルーム検索
  const filteredRooms = roomSearch.trim()
    ? rooms.filter(r => {
        const q = normalize(roomSearch);
        return normalize(r.id).includes(q) || r.participants.some(p => normalize(p.displayName).includes(q));
      })
    : rooms;

  return (
    <div>
      <h2 className="text-sm font-semibold">会話ログ</h2>
      <p className="text-[10px]" style={{ color: "var(--muted)" }}>ルームを選んで会話履歴を確認。エクスポート・一括ダウンロードは禁止。</p>

      {/* ルーム検索 */}
      <input className="input mt-2 text-xs" placeholder="ルームID・ユーザー名で検索" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} />

      {/* ルーム一覧 */}
      <div className="mt-3 space-y-2">
        {filteredRooms.length === 0 && <p className="text-xs" style={{ color: "var(--muted)" }}>ルームなし</p>}
        {filteredRooms.map(r => (
          <div key={r.id} className="card p-3 cursor-pointer" onClick={() => handleOpenRoom(r.id)}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{r.participants.map(p => p.displayName).join(" ／ ")}</span>
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>{r.id.slice(-6)}</span>
            </div>
            <p className="text-[10px]" style={{ color: "var(--muted)" }}>{new Date(r.startAt).toLocaleDateString("ja-JP")}</p>
          </div>
        ))}
      </div>

      {/* 会話詳細モーダル */}
      {selectedRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedRoomId(null)} />
          <div className="relative w-full max-w-lg rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: "var(--card)" }}>
            <h3 className="text-sm font-bold">会話ログ — {selectedRoomId.slice(-8)}</h3>
            <p className="text-[10px]" style={{ color: "var(--muted)" }}>全{filteredMsgs.length}件</p>

            {/* キーワード検索 */}
            <input className="input mt-2 text-xs" placeholder="キーワード・送信者名で絞り込み" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(0); }} />

            {/* メッセージ一覧 */}
            <div className="mt-3 space-y-1">
              {pagedMsgs.length === 0 && <p className="text-[10px]" style={{ color: "var(--muted)" }}>メッセージなし</p>}
              {pagedMsgs.map(m => (
                <div key={m.id} className="text-[10px] p-1.5 rounded" style={{ backgroundColor: "var(--bg)" }}>
                  <span className="font-medium">{m.senderName}</span>
                  <span className="ml-1" style={{ color: "var(--muted)" }}>{new Date(m.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <p className="mt-0.5" style={{ color: m.masked ? "var(--danger)" : undefined }}>{maskText(m.text)}</p>
                </div>
              ))}
            </div>

            {/* ページング */}
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-outline text-[10px] !px-2 !py-1" style={{ opacity: page === 0 ? 0.3 : 1 }}>← 前へ</button>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>{page + 1} / {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-outline text-[10px] !px-2 !py-1" style={{ opacity: page >= totalPages - 1 ? 0.3 : 1 }}>次へ →</button>
              </div>
            )}

            {/* 画像送信履歴 */}
            {media.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>画像送信履歴（ダウンロード不可）</p>
                <div className="mt-1 space-y-1">
                  {media.map(m => (
                    <div key={m.id} className="text-[10px] p-2 rounded relative" style={{ backgroundColor: "var(--bg)" }}>
                      <span>{m.senderName} — {new Date(m.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <div className="mt-1 relative h-16 w-16 rounded bg-gray-200 flex items-center justify-center select-none" style={{ pointerEvents: "none" }}>
                        <span>🖼️</span>
                        <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-black/20 rotate-[-20deg]">SLOTY管理 {new Date().toISOString().slice(0, 10)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setSelectedRoomId(null)} className="btn-outline w-full mt-3 text-sm">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== チケットタブ =====
function AdminTicketsTab() {
  const [ledger, setLedger] = useState<TicketEntry[]>([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => { setLedger(getTicketLedger()); setBalance(getTicketBalance()); }, []);

  return (
    <div>
      <h2 className="text-sm font-semibold">チケット台帳</h2>
      <p className="mt-1 text-xs">現在の残高: <span className="font-bold" style={{ color: "var(--accent)" }}>{balance}🎫</span></p>
      <div className="mt-3 space-y-1 max-h-96 overflow-y-auto">
        {ledger.map((entry, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-1" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <span>{entry.reason}</span>
              <span className="ml-2 text-[10px]" style={{ color: "var(--muted)" }}>{new Date(entry.createdAt).toLocaleString("ja-JP")}</span>
            </div>
            <span className="font-semibold" style={{ color: entry.delta > 0 ? "var(--success)" : "var(--danger)" }}>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</span>
          </div>
        ))}
        {ledger.length === 0 && <p className="text-xs" style={{ color: "var(--muted)" }}>履歴なし</p>}
      </div>
    </div>
  );
}

// ===== 認証ログタブ =====
function AdminAuthLogTab() {
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => { setLogs(getAuthLog()); const iv = setInterval(() => setLogs(getAuthLog()), 3000); return () => clearInterval(iv); }, []);

  const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    signup: { label: "新規登録", color: "var(--success)" },
    login: { label: "ログイン", color: "var(--accent)" },
    logout: { label: "ログアウト", color: "var(--muted)" },
    failed_login: { label: "ログイン失敗", color: "var(--danger)" },
    password_reset: { label: "パスワードリセット", color: "#f59e0b" },
  };

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pagedLogs = logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <h2 className="text-sm font-semibold">認証ログ</h2>
      <p className="text-[10px]" style={{ color: "var(--muted)" }}>
        全{logs.length}件 ／ ログイン・登録・ログアウト・失敗の履歴 ／ パスワード平文閲覧不可
      </p>
      <div className="mt-3 space-y-1">
        {pagedLogs.length === 0 && <p className="text-xs" style={{ color: "var(--muted)" }}>認証ログなし</p>}
        {pagedLogs.map(entry => {
          const a = ACTION_LABELS[entry.action] ?? { label: entry.action, color: "var(--muted)" };
          return (
            <div key={entry.id} className="text-[10px] py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="shrink-0 font-medium" style={{ color: a.color }}>{a.label}</span>
                <span className="truncate">{entry.email}</span>
                <span className="ml-auto shrink-0" style={{ color: "var(--muted)" }}>
                  {new Date(entry.timestamp).toLocaleString("ja-JP")}
                </span>
              </div>
              <div className="flex gap-2 mt-0.5" style={{ color: "var(--muted)" }}>
                <span>ID: {entry.userId.slice(0, 12)}</span>
                <span>IP: {entry.ip}</span>
              </div>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-outline text-[10px] !px-2 !py-1" style={{ opacity: page === 0 ? 0.3 : 1 }}>← 前へ</button>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-outline text-[10px] !px-2 !py-1" style={{ opacity: page >= totalPages - 1 ? 0.3 : 1 }}>次へ →</button>
        </div>
      )}
    </div>
  );
}

// ===== お問い合わせタブ =====
function AdminSupportTab() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  useEffect(() => { setMessages(getSupportMessages()); }, []);

  return (
    <div>
      <h2 className="text-sm font-semibold">お問い合わせ一覧</h2>
      <div className="mt-3 space-y-2">
        {messages.length === 0 && <p className="text-xs" style={{ color: "var(--muted)" }}>お問い合わせはありません</p>}
        {messages.map(m => (
          <div key={m.id} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{m.name}</span>
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>{new Date(m.createdAt).toLocaleString("ja-JP")}</span>
            </div>
            <p className="text-[10px]" style={{ color: "var(--muted)" }}>{m.email}</p>
            <p className="mt-1 text-xs">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== 監査ログタブ =====
function AdminAuditTab() {
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => { setLogs(getAdminAuditLog()); const iv = setInterval(() => setLogs(getAdminAuditLog()), 3000); return () => clearInterval(iv); }, []);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pagedLogs = logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // アクション名の日本語マッピング
  const ACTION_LABELS: Record<string, string> = {
    ADMIN_LOGIN: "ログイン",
    ADMIN_LOGOUT: "ログアウト",
    VIEW_KYC_ASSET: "本人確認書類閲覧",
    VIEW_CHAT_LOG: "会話ログ閲覧",
    VIEW_MEDIA_LOG: "画像履歴閲覧",
    APPROVE_KYC: "本人確認 承認",
    REJECT_KYC: "本人確認 却下",
    RESUBMIT_KYC: "本人確認 再提出要求",
    BAN_USER: "ユーザー凍結",
    UNBAN_USER: "凍結解除",
    FORCE_PASSWORD_RESET: "パスワード強制リセット",
    ADJUST_TICKETS: "チケット調整",
  };

  return (
    <div>
      <h2 className="text-sm font-semibold">監査ログ</h2>
      <p className="text-[10px]" style={{ color: "var(--muted)" }}>全管理操作の記録（誰が・何を・いつ）</p>
      <div className="mt-3 space-y-1">
        {pagedLogs.length === 0 && <p className="text-xs" style={{ color: "var(--muted)" }}>ログなし</p>}
        {pagedLogs.map(entry => (
          <div key={entry.id} className="text-[10px] py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="shrink-0 font-medium" style={{
                color: entry.action.startsWith("VIEW_") ? "#f59e0b" : entry.action.includes("BAN") ? "var(--danger)" : "var(--accent)"
              }}>
                {ACTION_LABELS[entry.action] ?? entry.action}
              </span>
              <span style={{ color: "var(--muted)" }}>{entry.targetType}/{entry.targetId.slice(0, 12)}</span>
              <span className="ml-auto shrink-0" style={{ color: "var(--muted)" }}>{new Date(entry.createdAt).toLocaleString("ja-JP")}</span>
            </div>
            {entry.reason && <p className="mt-0.5" style={{ color: "var(--muted)" }}>{entry.reason}</p>}
          </div>
        ))}
      </div>
      {/* ページング */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-outline text-[10px] !px-2 !py-1" style={{ opacity: page === 0 ? 0.3 : 1 }}>← 前へ</button>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-outline text-[10px] !px-2 !py-1" style={{ opacity: page >= totalPages - 1 ? 0.3 : 1 }}>次へ →</button>
        </div>
      )}
    </div>
  );
}
