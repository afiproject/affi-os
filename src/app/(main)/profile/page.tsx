"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { getTicketBalance, getTicketLedger, addTicketEntry, getProfile, saveProfile, hasPhotos, getMyKycRequest, submitKycRequest, getKycLevel, runKycAiScoring } from "@/lib/demo-store";
import type { DemoProfile, KycRequest } from "@/lib/demo-store";
import {
  DEMO_USER, DEMO_PHOTO_PLACEHOLDERS,
  PURPOSE_TAG_OPTIONS, HOBBY_TAG_OPTIONS, JOB_OPTIONS,
  WORK_STYLE_OPTIONS, INCOME_RANGE_OPTIONS, LIFE_TAG_OPTIONS,
} from "@/lib/demo-data";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState(18);
  const [ledger, setLedger] = useState<{ delta: number; reason: string; createdAt: string }[]>([]);
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [kycReq, setKycReq] = useState<KycRequest | null>(null);
  const [kycLevel, setKycLevel] = useState(0);

  useEffect(() => {
    setMounted(true);
    setTickets(getTicketBalance());
    setLedger(getTicketLedger());
    setProfile(getProfile());
    setKycReq(getMyKycRequest());
    setKycLevel(getKycLevel());
  }, []);

  if (!profile) return null;

  function persist(updates: Partial<DemoProfile>) {
    const next = { ...profile!, ...updates };
    setProfile(next);
    saveProfile(next);
  }

  function handleCharge() {
    addTicketEntry(10, "開発用チャージ（+10）");
    setTickets(getTicketBalance());
    setLedger(getTicketLedger());
  }

  function addDemoPhoto(id: string) {
    persist({ photos: [...profile!.photos, id].slice(0, 10) });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => persist({ photos: [...profile!.photos, reader.result as string].slice(0, 10) });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    persist({ photos: profile!.photos.filter((_, i) => i !== index) });
    if (photoIdx >= profile!.photos.length - 1) setPhotoIdx(Math.max(0, profile!.photos.length - 2));
  }

  function toggleTag(arr: string[], tag: string, key: keyof DemoProfile, max = 10) {
    const next = arr.includes(tag) ? arr.filter(t => t !== tag) : [...arr, tag].slice(0, max);
    persist({ [key]: next } as Partial<DemoProfile>);
  }

  const photos = profile.photos;
  const COLORS = ["#E8D5F5", "#D5E8F5", "#F5E8D5", "#D5F5E8", "#F5D5E8"];

  return (
    <div className="p-4 pb-6">
      <h1 className="text-xl font-bold">プロフィール</h1>

      {/* Photo Card (Tinder style) */}
      <div className="mt-4 relative overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        {photos.length > 0 ? (
          <div className="relative" style={{ height: 320 }}>
            <div className="h-full w-full flex items-center justify-center"
              style={{ backgroundColor: photos[photoIdx]?.startsWith("data:") ? undefined : COLORS[DEMO_PHOTO_PLACEHOLDERS.indexOf(photos[photoIdx]) % COLORS.length] || COLORS[0] }}>
              {photos[photoIdx]?.startsWith("data:") ? (
                <img src={photos[photoIdx]} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-6xl">📷</span>
              )}
            </div>
            {photos.length > 1 && (
              <div className="absolute top-2 left-0 right-0 flex justify-center gap-1">
                {photos.map((_, i) => (
                  <div key={i} className="h-1 rounded-full transition-all"
                    style={{ width: i === photoIdx ? 24 : 8, backgroundColor: i === photoIdx ? "white" : "rgba(255,255,255,0.5)" }} />
                ))}
              </div>
            )}
            {photoIdx > 0 && <button onClick={() => setPhotoIdx(photoIdx - 1)} className="absolute left-0 top-0 bottom-0 w-1/3" />}
            {photoIdx < photos.length - 1 && <button onClick={() => setPhotoIdx(photoIdx + 1)} className="absolute right-0 top-0 bottom-0 w-1/3" />}
            {photoIdx === 0 && <span className="absolute top-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">メイン</span>}
            <button onClick={() => removePhoto(photoIdx)} className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-xs">×</button>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2" style={{ color: "var(--muted)" }}>
            <span className="text-4xl">📷</span>
            <span className="text-xs">写真を追加してください</span>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{DEMO_USER.displayName}</span>
            {profile.age && <span className="text-sm" style={{ color: "var(--muted)" }}>{profile.age}</span>}
          </div>
          {profile.bio && <p className="mt-1 text-sm">{profile.bio}</p>}
          {profile.job && <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{profile.job}{profile.workStyle ? ` / ${profile.workStyle}` : ""}</p>}
          {profile.purposeTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.purposeTags.map(t => (
                <span key={t} className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasPhotos() && (
        <div className="mt-2 rounded-xl p-3 text-xs font-medium" style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "var(--danger)" }}>
          ⚠️ 写真を1枚以上登録すると、すれ違い・広場投稿・依頼送信が使えます
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => fileRef.current?.click()} className="btn-primary !px-3 !py-2 text-xs flex-1">端末から追加</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <button onClick={() => setShowPhotos(!showPhotos)} className="btn-outline !px-3 !py-2 text-xs">{showPhotos ? "閉じる" : `管理 (${photos.length}/10)`}</button>
      </div>
      {showPhotos && (
        <div className="mt-2 card p-3">
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <div className="h-16 w-16 rounded-lg overflow-hidden" style={{ backgroundColor: p.startsWith("data:") ? undefined : COLORS[DEMO_PHOTO_PLACEHOLDERS.indexOf(p) % COLORS.length] || COLORS[0] }}>
                  {p.startsWith("data:") ? <img src={p} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xl">📷</div>}
                </div>
                <button onClick={() => removePhoto(i)} className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] text-white" style={{ backgroundColor: "var(--danger)" }}>×</button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1">
            {DEMO_PHOTO_PLACEHOLDERS.filter(id => !photos.includes(id)).slice(0, 3).map(id => (
              <button key={id} onClick={() => addDemoPhoto(id)} className="rounded px-2 py-1 text-[10px]" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>+サンプル</button>
            ))}
          </div>
        </div>
      )}

      <section className="mt-5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>自己紹介（20〜40字推奨）</label>
        <input className="input mt-1" maxLength={60} placeholder="カフェ好き！気軽に話しかけてね" value={profile.bio} onChange={e => persist({ bio: e.target.value })} />
      </section>

      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>目的タグ</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {PURPOSE_TAG_OPTIONS.map(t => (
            <button key={t} onClick={() => toggleTag(profile.purposeTags, t, "purposeTags")} className={`chip text-[11px] ${profile.purposeTags.includes(t) ? "chip-active" : "chip-inactive"}`}>{t}</button>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>趣味タグ（最大10）</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {HOBBY_TAG_OPTIONS.map(t => (
            <button key={t} onClick={() => toggleTag(profile.hobbyTags, t, "hobbyTags")} className={`chip text-[11px] ${profile.hobbyTags.includes(t) ? "chip-active" : "chip-inactive"}`}>{t}</button>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>職業</label>
        <select className="input mt-1" value={profile.job} onChange={e => persist({ job: e.target.value })}>
          <option value="">未設定</option>
          {JOB_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <label className="mt-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>勤務形態</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {WORK_STYLE_OPTIONS.map(w => (
            <button key={w} onClick={() => persist({ workStyle: profile.workStyle === w ? "" : w })} className={`chip text-[11px] ${profile.workStyle === w ? "chip-active" : "chip-inactive"}`}>{w}</button>
          ))}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>年齢（任意）</label>
          <input className="input mt-1" placeholder="25" value={profile.age} onChange={e => persist({ age: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>身長（任意）</label>
          <input className="input mt-1" placeholder="170cm" value={profile.height} onChange={e => persist({ height: e.target.value })} />
        </div>
      </section>

      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>年収レンジ（任意）</label>
        <select className="input mt-1" value={profile.incomeRange} onChange={e => persist({ incomeRange: e.target.value })}>
          {INCOME_RANGE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="mt-1 flex gap-2">
          {(["private", "match", "all"] as const).map(v => (
            <button key={v} onClick={() => persist({ incomeVisibility: v })} className={`chip text-[10px] ${profile.incomeVisibility === v ? "chip-active" : "chip-inactive"}`}>
              {v === "private" ? "非公開" : v === "match" ? "マッチ後" : "全体"}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>生活タグ</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {LIFE_TAG_OPTIONS.map(t => (
            <button key={t} onClick={() => toggleTag(profile.lifeTags, t, "lifeTags")} className={`chip text-[11px] ${profile.lifeTags.includes(t) ? "chip-active" : "chip-inactive"}`}>{t}</button>
          ))}
        </div>
      </section>

      <div className="mt-6 h-px" style={{ backgroundColor: "var(--border)" }} />

      {/* KYC Section */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>本人確認</h2>
        <div className="mt-2 card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">確認レベル</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {kycLevel === 0 ? "Lv0 未確認（閲覧のみ）" : kycLevel === 1 ? "Lv1 ライト（通話OK）" : "Lv2 強（対面OK）"}
              </p>
            </div>
            <span className="text-2xl">{kycLevel === 0 ? "🔒" : kycLevel === 1 ? "🔓" : "✅"}</span>
          </div>
          {kycReq && kycReq.status !== "approved" && (
            <div className="mt-2 rounded-lg p-2 text-xs"
              style={{ backgroundColor: kycReq.status === "rejected" ? "rgba(220,38,38,0.08)" : "rgba(234,179,8,0.1)",
                color: kycReq.status === "rejected" ? "var(--danger)" : "#b45309" }}>
              {kycReq.status === "pending_ai" && "🤖 AI判定中..."}
              {kycReq.status === "pending_review" && `📋 人間レビュー待ち（AIスコア: ${kycReq.aiScore}）`}
              {kycReq.status === "rejected" && `❌ 却下: ${kycReq.reviewerNote || "理由なし"}`}
              {kycReq.status === "resubmit_required" && `🔄 再提出要求: ${kycReq.reviewerNote || "書類を再提出してください"}`}
            </div>
          )}
          {(!kycReq || kycReq.status === "rejected" || kycReq.status === "resubmit_required") && (
            <div className="mt-3 space-y-2">
              <button onClick={() => { submitKycRequest(1); setKycReq(getMyKycRequest()); setTimeout(() => { runKycAiScoring(getMyKycRequest()?.id ?? ""); setKycReq(getMyKycRequest()); }, 2000); }}
                className="btn-outline w-full text-xs !py-2">Lv1 ライト申請（セルフィーのみ）</button>
              <button onClick={() => { submitKycRequest(2); setKycReq(getMyKycRequest()); setTimeout(() => { runKycAiScoring(getMyKycRequest()?.id ?? ""); setKycReq(getMyKycRequest()); }, 2000); }}
                className="btn-primary w-full text-xs !py-2">Lv2 強 申請（身分証+ライブネス）</button>
            </div>
          )}
          <Link href="/admin/kyc" className="mt-2 block text-center text-[10px]" style={{ color: "var(--accent)" }}>
            管理者：審査キューを開く →
          </Link>
        </div>
      </section>

      <div className="mt-6 space-y-6">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>表示</h2>
          <div className="mt-2 flex items-center justify-between rounded-xl p-3 text-sm">
            <span>ダークモード</span>
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" style={{ backgroundColor: theme === "dark" ? "var(--accent)" : "#d1d5db" }}>
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: theme === "dark" ? "translateX(1.375rem)" : "translateX(0.25rem)" }} />
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>チケット</h2>
          <div className="mt-2 card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">🎫 残高</span>
              <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>{tickets}枚</span>
            </div>
          </div>
          <button onClick={handleCharge} className="btn-primary mt-2 w-full text-sm">🎫 +10 チャージ（開発用）</button>
          <div className="mt-3 card p-3 space-y-2">
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>最近の履歴</p>
            {ledger.slice(0, 6).map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span>{entry.reason}</span>
                <span className="font-semibold" style={{ color: entry.delta > 0 ? "var(--success)" : "var(--danger)" }}>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>その他</h2>
          <div className="mt-2 space-y-1">
            <SettingsRow label="ピン受信箱" href="/pings" />
            <SettingsRow label="依頼受信箱" href="/requests/inbox" />
            <SettingsRow label="予約管理" href="/bookings" />
            <SettingsRow label="フレンド" href="/friends" />
            <SettingsRow label="非公開予定管理" href="/friends/events" />
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingsRow({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl p-3 text-sm transition-colors hover:opacity-80">
      <span>{label}</span>
      <span style={{ color: "var(--muted)" }}>→</span>
    </Link>
  );
}
