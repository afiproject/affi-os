"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getTicketBalance,
  getAuthSession,
  getSlots,
  getKycImage,
  getProfile,
  findAuthUserByEmail,
} from "@/lib/demo-store";

export default function HomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("ゲスト");
  const [tickets, setTickets] = useState(0);
  const [kycDone, setKycDone] = useState(false);
  const [slots, setSlots] = useState<ReturnType<typeof getSlots>>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [allSlots, setAllSlots] = useState<ReturnType<typeof getSlots>>([]);

  useEffect(() => {
    const session = getAuthSession();
    const profile = getProfile();
    if (profile?.displayName) {
      setUserName(profile.displayName);
    } else if (session) {
      const authUser = findAuthUserByEmail(session.email);
      setUserName(authUser?.displayName || session.email.split("@")[0]);
    }
    setTickets(getTicketBalance());
    setKycDone(!!getKycImage("selfie"));
    const listed = getSlots().filter((s) => s.status === "listed");
    setAllSlots(listed);
    setSlots(listed.slice(0, 4));
  }, []);

  const announcements = [
    { id: 1, text: "SLOTYベータ版をご利用いただきありがとうございます！", date: "2024.12.01" },
    { id: 2, text: "対面モードご利用にはeKYC（本人確認）が必要です", date: "2024.12.01" },
  ];

  return (
    <div className="px-5 pt-3 pb-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-extrabold tracking-wide"
          style={{
            background: "var(--gradient-main)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SLOTY
        </h1>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => router.push("/mypage")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}
          >
            {userName[0]}
          </button>
        </div>
      </div>

      {/* ── Greeting ── */}
      <div className="mt-6">
        <p className="text-lg font-bold">
          こんにちは、{userName}さん
        </p>
        <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
          今どうする？
        </p>
      </div>

      {/* ── 3 Main Actions ── */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          {
            label: "時間を探す",
            href: "/market",
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            ),
          },
          {
            label: "近くで探す",
            href: "/nearby",
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            ),
          },
          {
            label: "時間を出す",
            href: "/market/sell",
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            ),
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-2xl py-5 transition-all active:scale-95"
            style={{
              background: "var(--gradient-main)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(155, 138, 251, 0.25)",
            }}
          >
            {action.icon}
            <span className="text-xs font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Mini status bar ── */}
      <div className="mt-5 flex items-center gap-3">
        <Link
          href="/tickets"
          className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: "var(--accent-soft)" }}
        >
          <span className="text-sm">🎫</span>
          <span className="text-xs font-semibold" style={{ color: "var(--accent-soft-text)" }}>
            {tickets}枚
          </span>
        </Link>
        <Link
          href="/verify"
          className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: kycDone ? "rgba(52,199,123,0.08)" : "var(--accent-soft)" }}
        >
          <span className="text-sm">{kycDone ? "✅" : "🪪"}</span>
          <span
            className="text-xs font-semibold"
            style={{ color: kycDone ? "var(--success)" : "var(--accent-soft-text)" }}
          >
            {kycDone ? "確認済み" : "本人確認"}
          </span>
        </Link>
      </div>

      {/* ── Recommended Slots (Tinder style) ── */}
      {slots.length > 0 && (
        <div className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">おすすめのスロット</h2>
            {!showAllSlots && allSlots.length > 4 && (
              <button onClick={() => { setShowAllSlots(true); setSlots(allSlots); }} className="text-xs font-medium" style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                もっと見る
              </button>
            )}
            {showAllSlots && (
              <button onClick={() => { setShowAllSlots(false); setSlots(allSlots.slice(0, 4)); }} className="text-xs font-medium" style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
                閉じる
              </button>
            )}
          </div>
          <div data-no-swipe className="mt-3 flex gap-3 overflow-x-auto pb-1" style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
            {slots.map((slot) => {
              const start = new Date(slot.startAt);
              const GRADIENTS = [
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              ];
              const bgGradient = GRADIENTS[slot.id.charCodeAt(slot.id.length - 1) % GRADIENTS.length];
              const hasAvatar = slot.seller.avatarUrl && slot.seller.avatarUrl.startsWith("data:");
              return (
                <Link
                  key={slot.id}
                  href={`/market/slots/${slot.id}`}
                  className="flex-shrink-0 rounded-2xl overflow-hidden relative"
                  style={{
                    width: "75%",
                    minWidth: 260,
                    height: 380,
                    scrollSnapAlign: "start",
                    scrollSnapStop: "always",
                    background: hasAvatar ? undefined : bgGradient,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  {/* Background photo */}
                  {hasAvatar && (
                    <img src={slot.seller.avatarUrl!} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  {/* Placeholder initial when no photo */}
                  {!hasAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[120px] font-bold text-white/20">{slot.seller.displayName[0]}</span>
                    </div>
                  )}
                  {/* Bottom gradient overlay */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 40%, transparent 60%)" }} />
                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                      {slot.mode === "call" ? "📞 通話" : "🚶 対面"}
                    </span>
                    {slot.seller.verificationStatus === "verified" && (
                      <span className="rounded-full px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm" style={{ backgroundColor: "rgba(52,199,123,0.6)" }}>
                        ✓ 認証済
                      </span>
                    )}
                  </div>
                  {/* Bottom info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-xl font-bold text-white">
                      {slot.seller.displayName}
                    </p>
                    <p className="mt-0.5 text-xs text-white/70">
                      ★{slot.seller.ratingAvg} ({slot.seller.ratingCount})
                    </p>
                    <p className="mt-1.5 text-xs text-white/80">
                      {start.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })}
                      {" "}
                      {start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                      〜{new Date(slot.endAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: "rgba(155,138,251,0.8)", backdropFilter: "blur(4px)" }}>
                        {slot.priceYen}🎫
                      </span>
                      <span className="rounded-full px-2.5 py-1 text-[10px] text-white/80 backdrop-blur-sm" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                        {slot.durationMinutes}分
                      </span>
                      {slot.areaValue && (
                        <span className="rounded-full px-2.5 py-1 text-[10px] text-white/80 backdrop-blur-sm" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                          📍{slot.areaValue}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Announcements (collapsed) ── */}
      <div className="mt-7">
        <button
          onClick={() => setShowAnnouncements(!showAnnouncements)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            お知らせ ({announcements.length})
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showAnnouncements ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showAnnouncements && (
          <div className="mt-2 space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl px-4 py-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <p className="text-xs">{a.text}</p>
                <p className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>{a.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
