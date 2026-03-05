"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import {
  getTicketBalance, getTicketLedger,
  getProfile, saveProfile, hasPhotos,
  getMyKycRequest, getKycLevel,
  getSubscription, setSubscription,
  TICKET_PACKAGES, purchaseTickets,
} from "@/lib/demo-store";
import type { DemoProfile, KycRequest, SubscriptionPlan } from "@/lib/demo-store";
import {
  DEMO_USER, DEMO_PHOTO_PLACEHOLDERS,
  PURPOSE_TAG_OPTIONS, HOBBY_TAG_OPTIONS, JOB_OPTIONS,
  WORK_STYLE_OPTIONS, INCOME_RANGE_OPTIONS, LIFE_TAG_OPTIONS,
  GENDER_OPTIONS, AREA_TAG_OPTIONS, CONTACT_STYLE_OPTIONS, NG_TAG_OPTIONS,
} from "@/lib/demo-data";

const SUB_PLANS = [
  { plan: "basic" as const, label: "Basic", price: "¥980/月", tickets: "毎月40🎫", perks: "週末ブースト参加権" },
  { plan: "plus" as const, label: "Plus", price: "¥1,980/月", tickets: "毎月100🎫", perks: "すれ違い軽優先・ピンCD短縮" },
];

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
  const [sub, setSub] = useState<{ plan: SubscriptionPlan }>({ plan: "none" });
  const [showPurchase, setShowPurchase] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTickets(getTicketBalance());
    setLedger(getTicketLedger());
    setProfile(getProfile());
    setKycReq(getMyKycRequest());
    setKycLevel(getKycLevel());
    setSub(getSubscription());
  }, []);

  if (!profile) return null;

  function persist(updates: Partial<DemoProfile>) {
    const next = { ...profile!, ...updates };
    setProfile(next);
    saveProfile(next);
  }
  function refreshTickets() { setTickets(getTicketBalance()); setLedger(getTicketLedger()); }
  function handlePurchase(pkg: typeof TICKET_PACKAGES[number]) {
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
    if (isDemo) {
      purchaseTickets(pkg.ticketCount, pkg.priceYen);
      refreshTickets();
    } else {
      // Production: redirect to Stripe Checkout
      // TODO: Replace with actual Stripe Checkout session creation via API route
      // fetch("/api/checkout", { method: "POST", body: JSON.stringify({ ticketCount: pkg.ticketCount, priceYen: pkg.priceYen }) })
      //   .then(r => r.json()).then(d => window.location.href = d.url);
      alert(`本番モード: Stripe Checkoutに遷移します（${pkg.ticketCount}🎫 / ¥${pkg.priceYen.toLocaleString()}）\n※ STRIPE_SECRET_KEY を設定してください`);
    }
  }
  function handleSubscribe(plan: SubscriptionPlan) {
    const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
    if (isDemo) {
      setSubscription(plan);
      setSub(getSubscription());
      refreshTickets();
    } else {
      // Production: redirect to Stripe Billing Portal
      // TODO: Replace with actual Stripe Billing session
      alert(`本番モード: Stripe Billingに遷移します（${plan}）\n※ STRIPE_SECRET_KEY を設定してください`);
    }
  }
  function addDemoPhoto(id: string) { persist({ photos: [...profile!.photos, id].slice(0, 10) }); }
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => persist({ photos: [...profile!.photos, reader.result as string].slice(0, 10) });
    reader.readAsDataURL(file); e.target.value = "";
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

      {/* Photo Card */}
      <div className="mt-4 relative overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        {photos.length > 0 ? (
          <div className="relative" style={{ height: 320 }}>
            <div className="h-full w-full flex items-center justify-center"
              style={{ backgroundColor: photos[photoIdx]?.startsWith("data:") ? undefined : COLORS[DEMO_PHOTO_PLACEHOLDERS.indexOf(photos[photoIdx]) % COLORS.length] || COLORS[0] }}>
              {photos[photoIdx]?.startsWith("data:") ? <img src={photos[photoIdx]} alt="" className="h-full w-full object-cover" /> : <span className="text-6xl">📷</span>}
            </div>
            {photos.length > 1 && (
              <div className="absolute top-2 left-0 right-0 flex justify-center gap-1">
                {photos.map((_, i) => <div key={i} className="h-1 rounded-full transition-all" style={{ width: i === photoIdx ? 24 : 8, backgroundColor: i === photoIdx ? "white" : "rgba(255,255,255,0.5)" }} />)}
              </div>
            )}
            {photoIdx > 0 && <button onClick={() => setPhotoIdx(photoIdx - 1)} className="absolute left-0 top-0 bottom-0 w-1/3" />}
            {photoIdx < photos.length - 1 && <button onClick={() => setPhotoIdx(photoIdx + 1)} className="absolute right-0 top-0 bottom-0 w-1/3" />}
            {photoIdx === 0 && <span className="absolute top-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">メイン</span>}
            <button onClick={() => removePhoto(photoIdx)} className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-xs">×</button>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2" style={{ color: "var(--muted)" }}>
            <span className="text-4xl">📷</span><span className="text-xs">写真を追加してください</span>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{profile.displayName || DEMO_USER.displayName}</span>
            {profile.age && <span className="text-sm" style={{ color: "var(--muted)" }}>{profile.age}</span>}
            {profile.gender && profile.gender !== "非公開" && <span className="text-xs" style={{ color: "var(--muted)" }}>{profile.gender}</span>}
          </div>
          {profile.handle && <p className="text-xs" style={{ color: "var(--muted)" }}>@{profile.handle}</p>}
          {(profile.bioShort || profile.bio) && <p className="mt-1 text-sm">{profile.bioShort || profile.bio}</p>}
          {profile.job && <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{profile.job}{profile.workStyle ? ` / ${profile.workStyle}` : ""}</p>}
          {profile.purposeTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.purposeTags.map(t => <span key={t} className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>{t}</span>)}
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
        </div>
      )}

      {/* Basic info */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>表示名</label>
          <input className="input mt-1" maxLength={20} placeholder="表示名" value={profile.displayName} onChange={e => persist({ displayName: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>任意ID</label>
          <input className="input mt-1" maxLength={20} placeholder="@handle" value={profile.handle} onChange={e => persist({ handle: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })} />
        </div>
      </section>
      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>自己紹介（1行・20〜40字推奨）</label>
        <input className="input mt-1" maxLength={60} placeholder="カフェ好き！気軽に話しかけてね" value={profile.bioShort || profile.bio} onChange={e => persist({ bioShort: e.target.value, bio: e.target.value })} />
      </section>
      <section className="mt-3">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>詳しい自己紹介（任意）</label>
        <textarea className="input mt-1" rows={3} maxLength={300} placeholder="趣味や好きなことなど自由に" value={profile.bioLong} onChange={e => persist({ bioLong: e.target.value })} style={{ resize: "vertical" }} />
      </section>
      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>目的タグ</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {PURPOSE_TAG_OPTIONS.map(t => <button key={t} onClick={() => toggleTag(profile.purposeTags, t, "purposeTags")} className={`chip text-[11px] ${profile.purposeTags.includes(t) ? "chip-active" : "chip-inactive"}`}>{t}</button>)}
        </div>
      </section>
      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>趣味タグ（最大10）</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {HOBBY_TAG_OPTIONS.map(t => <button key={t} onClick={() => toggleTag(profile.hobbyTags, t, "hobbyTags")} className={`chip text-[11px] ${profile.hobbyTags.includes(t) ? "chip-active" : "chip-inactive"}`}>{t}</button>)}
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
          {WORK_STYLE_OPTIONS.map(w => <button key={w} onClick={() => persist({ workStyle: profile.workStyle === w ? "" : w })} className={`chip text-[11px] ${profile.workStyle === w ? "chip-active" : "chip-inactive"}`}>{w}</button>)}
        </div>
      </section>
      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>性別（任意）</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {GENDER_OPTIONS.map(g => <button key={g} onClick={() => persist({ gender: profile.gender === g ? "" : g })} className={`chip text-[11px] ${profile.gender === g ? "chip-active" : "chip-inactive"}`}>{g}</button>)}
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
          {LIFE_TAG_OPTIONS.map(t => <button key={t} onClick={() => toggleTag(profile.lifeTags, t, "lifeTags")} className={`chip text-[11px] ${profile.lifeTags.includes(t) ? "chip-active" : "chip-inactive"}`}>{t}</button>)}
        </div>
      </section>
      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>活動エリア</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {AREA_TAG_OPTIONS.map(t => <button key={t} onClick={() => toggleTag(profile.areaTags, t, "areaTags")} className={`chip text-[11px] ${profile.areaTags.includes(t) ? "chip-active" : "chip-inactive"}`}>{t}</button>)}
        </div>
      </section>
      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>連絡スタイル</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {CONTACT_STYLE_OPTIONS.map(c => <button key={c} onClick={() => persist({ contactStyle: profile.contactStyle === c ? "" : c })} className={`chip text-[11px] ${profile.contactStyle === c ? "chip-active" : "chip-inactive"}`}>{c}</button>)}
        </div>
      </section>
      <section className="mt-4">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>NG事項</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {NG_TAG_OPTIONS.map(t => <button key={t} onClick={() => toggleTag(profile.ngTags, t, "ngTags")} className={`chip text-[11px] ${profile.ngTags.includes(t) ? "chip-active" : "chip-inactive"}`}>{t}</button>)}
        </div>
      </section>

      <div className="mt-6 h-px" style={{ backgroundColor: "var(--border)" }} />

      {/* KYC */}
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
              style={{ backgroundColor: kycReq.status === "rejected" ? "rgba(220,38,38,0.08)" : "rgba(234,179,8,0.1)", color: kycReq.status === "rejected" ? "var(--danger)" : "#b45309" }}>
              {kycReq.status === "pending_ai" && "🤖 AI判定中..."}
              {kycReq.status === "pending_review" && `📋 人間レビュー待ち（AIスコア: ${kycReq.aiScore}）`}
              {kycReq.status === "rejected" && `❌ 却下: ${kycReq.reviewerNote || "理由なし"}`}
              {kycReq.status === "resubmit_required" && `🔄 再提出要求: ${kycReq.reviewerNote || "書類を再提出してください"}`}
            </div>
          )}
          {(!kycReq || kycReq.status === "rejected" || kycReq.status === "resubmit_required") && (
            <Link href="/verify" className="btn-outline w-full text-xs !py-2 block text-center mt-3">本人確認を申請する →</Link>
          )}
        </div>
      </section>

      <div className="mt-6 h-px" style={{ backgroundColor: "var(--border)" }} />

      {/* Tickets */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>チケット</h2>
        <div className="mt-2 card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">🎫 残高</span>
            <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>{tickets}枚</span>
          </div>
        </div>
        <button onClick={() => setShowPurchase(!showPurchase)} className="btn-primary mt-2 w-full text-sm">🎫 チケットを購入</button>
        {showPurchase && (
          <div className="mt-2 card p-4 space-y-2">
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>チケットパック</p>
            {TICKET_PACKAGES.map(pkg => (
              <button key={pkg.ticketCount} onClick={() => handlePurchase(pkg)} className="w-full flex items-center justify-between rounded-xl p-3 text-sm hover:opacity-80" style={{ backgroundColor: "var(--accent-soft)" }}>
                <span className="font-medium">🎫 {pkg.ticketCount}枚</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>¥{pkg.priceYen.toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 card p-4">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>サブスクリプション</p>
          <p className="mt-1 text-xs">現在: <span className="font-bold" style={{ color: "var(--accent)" }}>{sub.plan === "none" ? "なし" : sub.plan === "basic" ? "Basic" : "Plus"}</span></p>
          <div className="mt-2 space-y-2">
            {SUB_PLANS.map(sp => (
              <div key={sp.plan} className="rounded-xl p-3" style={{ backgroundColor: sub.plan === sp.plan ? "var(--accent-soft)" : "var(--bg)", border: sub.plan === sp.plan ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{sp.label} <span className="text-xs" style={{ color: "var(--muted)" }}>{sp.price}</span></p>
                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>{sp.tickets} / {sp.perks}</p>
                  </div>
                  {sub.plan === sp.plan ? (
                    <button onClick={() => handleSubscribe("none")} className="text-[10px] px-2 py-1 rounded" style={{ color: "var(--danger)" }}>解約</button>
                  ) : (
                    <button onClick={() => handleSubscribe(sp.plan)} className="btn-primary text-[10px] !px-3 !py-1">加入</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setShowLedger(!showLedger)} className="btn-outline mt-2 w-full text-xs">{showLedger ? "閉じる" : "🎫 台帳を表示"}</button>
        {showLedger && (
          <div className="mt-2 card p-3 space-y-2 max-h-64 overflow-y-auto">
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>チケット台帳</p>
            {ledger.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div><span>{entry.reason}</span><span className="ml-2 text-[10px]" style={{ color: "var(--muted)" }}>{new Date(entry.createdAt).toLocaleDateString("ja-JP")}</span></div>
                <span className="font-semibold" style={{ color: entry.delta > 0 ? "var(--success)" : "var(--danger)" }}>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 card p-3">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>消費目安</p>
          <div className="mt-1 space-y-1 text-[11px]">
            <div className="flex justify-between"><span>ピン送信</span><span>5🎫</span></div>
            <div className="flex justify-between"><span>広場投稿</span><span>2🎫</span></div>
            <div className="flex justify-between"><span>スロット出品</span><span>1🎫</span></div>
            <div className="flex justify-between"><span>ブースト(30分)</span><span>10🎫</span></div>
            <div className="flex justify-between"><span>チェックイン</span><span>0🎫</span></div>
            <div className="flex justify-between" style={{ color: "var(--success)" }}><span>通話/対面完了</span><span>+1🎫(1日3回上限)</span></div>
          </div>
        </div>
      </section>

      <div className="mt-6 h-px" style={{ backgroundColor: "var(--border)" }} />

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
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>SLOTYの使い方</h2>
          <button onClick={() => setShowHowTo(!showHowTo)} className="mt-2 w-full flex items-center justify-between rounded-xl p-3 text-sm transition-colors hover:opacity-80" style={{ backgroundColor: "var(--accent-soft)" }}>
            <span>📖 はじめてのSLOTY</span>
            <span style={{ color: "var(--muted)", transform: showHowTo ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>→</span>
          </button>
          {showHowTo && (
            <div className="mt-2 card p-4 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-xs" style={{ color: "var(--accent)" }}>SLOTYとは？</p>
                <p className="mt-1 text-xs leading-relaxed">SLOTYは「人」ではなく「時間枠（スロット）」を売買・共有するマーケットアプリです。空いた時間をスロットとして出品し、気になる人の時間を予約できます。</p>
              </div>
              <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

              <div>
                <p className="font-semibold text-xs">📝 Step 1: プロフィールを作ろう</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>写真を1枚以上登録し、表示名・自己紹介・目的タグを設定しましょう。写真がないと、すれ違い・広場投稿・依頼送信が使えません。</p>
              </div>

              <div>
                <p className="font-semibold text-xs">🎫 Step 2: チケットを手に入れよう</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>チケットはアプリ内の通貨です。チケットパックの購入やサブスクリプションで入手できます。通話や対面の完了でも毎日最大3枚もらえます。</p>
              </div>

              <div>
                <p className="font-semibold text-xs">🛒 Step 3: スロットを出品しよう</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>マーケットタブから「空き時間」をスロットとして出品できます（1🎫）。カフェでおしゃべり、オンライン通話、散歩など自由に設定できます。</p>
              </div>

              <div>
                <p className="font-semibold text-xs">📌 Step 4: 気になる人にピンを送ろう</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>マーケットやすれ違いで見つけた相手にピン（5🎫）を送って興味を伝えましょう。相手が受け入れるとマッチングが成立し、メッセージが始まります。</p>
              </div>

              <div>
                <p className="font-semibold text-xs">📅 Step 5: 予約して会おう</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>マッチした相手のスロットを予約して、通話や対面の予定を確定させましょう。予約管理から確認・キャンセルもできます。</p>
              </div>

              <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
              <div>
                <p className="font-semibold text-xs">💡 その他の機能</p>
                <div className="mt-1 space-y-1 text-xs" style={{ color: "var(--muted)" }}>
                  <p>🗺️ <strong>すれ違い</strong> — 近くにいるユーザーをマップで発見</p>
                  <p>📢 <strong>広場</strong> — 投稿や依頼で仲間を見つける（2🎫）</p>
                  <p>🚀 <strong>ブースト</strong> — 30分間マーケットで目立つ（10🎫）</p>
                  <p>👥 <strong>フレンド</strong> — カレンダーを共有して予定を合わせる</p>
                  <p>🔒 <strong>本人確認</strong> — KYCレベルを上げて信頼度アップ</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>アカウント</h2>
          <div className="mt-2 space-y-1">
            <SettingsRow label="マイプロフィール" href="/profile" />
            <SettingsRow label="アカウント設定" href="/account" />
            <SettingsRow label="本人確認" href="/verify" />
          </div>
        </section>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>その他</h2>
          <div className="mt-2 space-y-1">
            <SettingsRow label="メッセージ" href="/messages" />
            <SettingsRow label="ピン受信箱" href="/pings" />
            <SettingsRow label="依頼受信箱" href="/requests/inbox" />
            <SettingsRow label="予約管理" href="/bookings" />
            <SettingsRow label="フレンド" href="/friends" />
            <SettingsRow label="非公開予定管理" href="/friends/events" />
          </div>
        </section>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>法的情報</h2>
          <div className="mt-2 space-y-1">
            <SettingsRow label="利用規約" href="/legal/terms" />
            <SettingsRow label="プライバシーポリシー" href="/legal/privacy" />
            <SettingsRow label="特定商取引法に基づく表示" href="/legal/tokusho" />
            <SettingsRow label="お問い合わせ" href="/support" />
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
