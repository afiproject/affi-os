"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getTicketBalance,
  isLoggedIn,
  getAuthSession,
  getImahimaStatus,
  getKycImage,
} from "@/lib/demo-store";

export default function HomePage() {
  const router = useRouter();
  const [tickets, setTickets] = useState(0);
  const [imahima, setImahima] = useState(false);
  const [kycDone, setKycDone] = useState(false);
  const [userName, setUserName] = useState("ゲスト");

  useEffect(() => {
    setTickets(getTicketBalance());
    setImahima(getImahimaStatus());
    setKycDone(!!getKycImage("selfie"));
    const session = getAuthSession();
    if (session) setUserName(session.email.split("@")[0]);
  }, []);

  const announcements = [
    { id: 1, text: "SLOTYベータ版をご利用いただきありがとうございます！", date: "2024.12.01" },
    { id: 2, text: "対面モードご利用にはeKYC（本人確認）が必要です", date: "2024.12.01" },
  ];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-extrabold tracking-wide"
            style={{
              background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 45%, #F3A7C6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SLOTY
          </h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            ようこそ、{userName}さん
          </p>
        </div>
        <button
          onClick={() => router.push("/profile")}
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}
        >
          {userName[0]}
        </button>
      </div>

      {/* Status Cards */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {/* イマヒマ状態 */}
        <div className="card p-3 cursor-pointer" onClick={() => router.push("/nearby")}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{imahima ? "🟢" : "⚪"}</span>
            <div>
              <p className="text-xs font-semibold">{imahima ? "イマヒマ中" : "オフライン"}</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>すれ違い</p>
            </div>
          </div>
        </div>

        {/* チケット残高 */}
        <div className="card p-3 cursor-pointer" onClick={() => router.push("/profile")}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎫</span>
            <div>
              <p className="text-xs font-semibold">{tickets}枚</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>チケット残高</p>
            </div>
          </div>
        </div>

        {/* KYC状態 */}
        <div className="card p-3 cursor-pointer" onClick={() => router.push("/verify")}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{kycDone ? "✅" : "🪪"}</span>
            <div>
              <p className="text-xs font-semibold">{kycDone ? "確認済み" : "未確認"}</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>本人確認</p>
            </div>
          </div>
        </div>

        {/* 予約 */}
        <div className="card p-3 cursor-pointer" onClick={() => router.push("/bookings")}>
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <div>
              <p className="text-xs font-semibold">予約</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>確認する</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          クイックアクション
        </h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { icon: "🛒", label: "マーケット", href: "/market" },
            { icon: "📡", label: "すれ違い", href: "/nearby" },
            { icon: "💬", label: "メッセージ", href: "/messages" },
          ].map((a) => (
            <button
              key={a.href}
              onClick={() => router.push(a.href)}
              className="card flex flex-col items-center gap-1 p-3"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-[10px] font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div className="mt-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          お知らせ
        </h2>
        <div className="mt-2 space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="card p-3">
              <div className="flex items-start gap-2">
                <span className="text-sm">📢</span>
                <div className="flex-1">
                  <p className="text-xs">{a.text}</p>
                  <p className="mt-0.5 text-[10px]" style={{ color: "var(--muted)" }}>{a.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Links */}
      <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
          {[
            { label: "利用規約", href: "/legal/terms" },
            { label: "プライバシーポリシー", href: "/legal/privacy" },
            { label: "特定商取引法に基づく表示", href: "/legal/tokusho" },
            { label: "お問い合わせ", href: "/support" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[10px] underline"
              style={{ color: "var(--muted)" }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px]" style={{ color: "var(--muted)" }}>
          &copy; 2024 SLOTY. All rights reserved.
        </p>
      </div>
    </div>
  );
}
