"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  getTicketBalance,
  getProfile,
  getMyKycRequest,
  getKycLevel,
  getSubscription,
  getBookings,
  getLocationEnabled, setLocationEnabled as saveLocationEnabled,
} from "@/lib/demo-store";
import type { KycRequest, SubscriptionPlan } from "@/lib/demo-store";
import { DEMO_USER } from "@/lib/demo-data";

export default function MyPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState(0);
  const [kycLevel, setKycLevel] = useState(0);
  const [kycReq, setKycReq] = useState<KycRequest | null>(null);
  const [sub, setSub] = useState<{ plan: SubscriptionPlan }>({ plan: "none" });
  const [profile, setProfile] = useState<{ displayName: string; bioShort: string; photos: string[] }>({ displayName: "", bioShort: "", photos: [] });
  const [nextBooking, setNextBooking] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTickets(getTicketBalance());
    setKycLevel(getKycLevel());
    setKycReq(getMyKycRequest());
    setSub(getSubscription());
    setLocationEnabled(getLocationEnabled());
    const p = getProfile();
    if (p) setProfile({ displayName: p.displayName || DEMO_USER.displayName, bioShort: p.bioShort || p.bio || "", photos: p.photos || [] });
    const bookings = getBookings();
    const next = bookings.find(b => b.status === "confirmed");
    if (next) {
      const d = new Date(next.slot.startAt);
      setNextBooking(`${d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })} ${d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`);
    }
  }, []);

  const COLORS = ["#E8D5F5", "#D5E8F5", "#F5E8D5"];

  return (
    <div className="px-5 pt-3 pb-4">
      {/* Header with calendar icon */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">マイページ</h1>
        <Link
          href="/calendar"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--accent-soft)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </Link>
      </div>

      {/* Profile card */}
      <Link href="/profile" className="mt-5 flex items-center gap-4 rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold"
          style={{
            backgroundColor: profile.photos.length > 0 && profile.photos[0]?.startsWith("data:") ? undefined : COLORS[0],
            overflow: "hidden",
          }}
        >
          {profile.photos.length > 0 && profile.photos[0]?.startsWith("data:") ? (
            <img src={profile.photos[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <span style={{ color: "var(--accent-soft-text)" }}>{profile.displayName[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold truncate">{profile.displayName}</p>
          {profile.bioShort && <p className="mt-0.5 text-xs truncate" style={{ color: "var(--muted)" }}>{profile.bioShort}</p>}
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--accent)" }}>プロフィールを編集 →</p>
        </div>
      </Link>

      {/* Quick status */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href="/tickets" className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>{tickets}</span>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>🎫 チケット</span>
        </Link>
        <Link href="/verify" className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <span className="text-lg font-bold" style={{ color: kycLevel > 0 ? "var(--success)" : "var(--muted)" }}>Lv{kycLevel}</span>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>本人確認</span>
        </Link>
        <div className="flex flex-col items-center gap-1 rounded-xl py-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <span className="text-lg font-bold" style={{ color: sub.plan !== "none" ? "var(--accent)" : "var(--muted)" }}>
            {sub.plan === "none" ? "—" : sub.plan === "basic" ? "Basic" : "Plus"}
          </span>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>プラン</span>
        </div>
      </div>

      {/* Next booking */}
      {nextBooking && (
        <Link href="/bookings" className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(52,199,123,0.06)", border: "1px solid rgba(52,199,123,0.15)" }}>
          <span className="text-base">📅</span>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--success)" }}>次の予約</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{nextBooking}</p>
          </div>
        </Link>
      )}

      {/* Management section */}
      <div className="mt-6">
        <p className="section-title mb-2">管理</p>
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <MenuRow label="出品管理" href="/market/sell" icon="🏪" />
          <MenuRow label="予約管理" href="/bookings" icon="📋" border />
          <MenuRow label="チケット・課金" href="/tickets" icon="🎫" border />
          <MenuRow label="本人確認" href="/verify" icon="🪪" border />
        </div>
      </div>

      {/* Activity section */}
      <div className="mt-5">
        <p className="section-title mb-2">アクティビティ</p>
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <MenuRow label="ピン受信箱" href="/pings" icon="📌" />
          <MenuRow label="依頼受信箱" href="/requests/inbox" icon="📩" border />
          <MenuRow label="フレンド" href="/friends" icon="👥" border />
          <MenuRow label="すれ違い" href="/nearby" icon="📡" border />
        </div>
      </div>

      {/* Settings */}
      <div className="mt-5">
        <p className="section-title mb-2">設定</p>
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-sm">🌙</span>
              <span className="text-sm">ダークモード</span>
            </div>
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" style={{ backgroundColor: theme === "dark" ? "var(--accent)" : "#d1d5db" }}>
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: theme === "dark" ? "translateX(1.375rem)" : "translateX(0.25rem)" }} />
              </button>
            )}
          </div>
          <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
          <div id="location" className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-sm">📍</span>
              <div>
                <span className="text-sm">位置情報</span>
                <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                  {locationEnabled ? "すれ違い機能で使用中" : "オフ"}
                </p>
              </div>
            </div>
            <button onClick={() => {
              if (locationEnabled) {
                setLocationEnabled(false);
                saveLocationEnabled(false);
              } else {
                setShowLocationConfirm(true);
              }
            }} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" style={{ backgroundColor: locationEnabled ? "var(--accent)" : "#d1d5db" }}>
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" style={{ transform: locationEnabled ? "translateX(1.375rem)" : "translateX(0.25rem)" }} />
            </button>
          </div>
          <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
          <MenuRow label="アカウント設定" href="/account" icon="⚙️" />
        </div>
      </div>

      {/* Legal */}
      <div className="mt-5">
        <p className="section-title mb-2">その他</p>
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <MenuRow label="利用規約" href="/legal/terms" icon="📄" />
          <MenuRow label="プライバシーポリシー" href="/legal/privacy" icon="🔒" border />
          <MenuRow label="特定商取引法に基づく表示" href="/legal/tokusho" icon="📋" border />
          <MenuRow label="お問い合わせ" href="/support" icon="💬" border />
        </div>
      </div>

      <p className="mt-5 text-center text-[10px]" style={{ color: "var(--muted)" }}>
        &copy; 2024 SLOTY. All rights reserved.
      </p>

      {/* Location confirm dialog */}
      {showLocationConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLocationConfirm(false)} />
          <div className="relative rounded-2xl p-6 mx-6 w-full max-w-sm shadow-xl" style={{ backgroundColor: "var(--card)" }}>
            <p className="text-base font-bold text-center">位置情報をONにしますか？</p>
            <p className="mt-2 text-xs text-center" style={{ color: "var(--muted)" }}>
              すれ違い機能であなたの現在地を使用します。
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowLocationConfirm(false)} className="btn-outline flex-1 text-sm !py-2.5">いいえ</button>
              <button onClick={() => { setLocationEnabled(true); saveLocationEnabled(true); setShowLocationConfirm(false); }} className="btn-primary flex-1 text-sm !py-2.5">はい</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuRow({ label, href, icon, border }: { label: string; href: string; icon: string; border?: boolean }) {
  return (
    <>
      {border && <div className="h-px" style={{ backgroundColor: "var(--border)" }} />}
      <Link href={href} className="flex items-center justify-between px-4 py-3.5 transition-colors active:opacity-70">
        <div className="flex items-center gap-3">
          <span className="text-sm">{icon}</span>
          <span className="text-sm">{label}</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </>
  );
}
