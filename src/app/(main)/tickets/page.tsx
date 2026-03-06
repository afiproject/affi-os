"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getTicketBalance, getTicketLedger,
  getSubscription, setSubscription,
  TICKET_PACKAGES, purchaseTickets,
} from "@/lib/demo-store";
import type { SubscriptionPlan } from "@/lib/demo-store";

const SUB_PLANS = [
  { plan: "basic" as const, label: "Basic", price: "¥980/月", tickets: "毎月40🎫", perks: "週末ブースト参加権" },
  { plan: "plus" as const, label: "Plus", price: "¥1,980/月", tickets: "毎月100🎫", perks: "すれ違い軽優先・ピンCD短縮" },
];

const PAYMENT_METHODS = [
  { key: "card", label: "クレジットカード", icon: "💳" },
  { key: "applepay", label: "Apple Pay", icon: "🍎" },
  { key: "googlepay", label: "Google Pay", icon: "📱" },
  { key: "convenience", label: "コンビニ払い", icon: "🏪" },
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState(0);
  const [ledger, setLedger] = useState<{ delta: number; reason: string; createdAt: string }[]>([]);
  const [sub, setSub] = useState<{ plan: SubscriptionPlan }>({ plan: "none" });
  const [showPurchase, setShowPurchase] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    setTickets(getTicketBalance());
    setLedger(getTicketLedger());
    setSub(getSubscription());
  }, []);

  const handlePurchase = (pkg: (typeof TICKET_PACKAGES)[number]) => {
    purchaseTickets(pkg.ticketCount, pkg.priceYen);
    setTickets(getTicketBalance());
    setLedger(getTicketLedger());
    alert(`${pkg.ticketCount}枚のチケットを購入しました！`);
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSubscription(plan);
    setSub({ plan });
    alert(plan === "none" ? "解約しました" : `${plan}プランに加入しました！`);
  };

  return (
    <div className="px-5 pt-3 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mypage" className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">チケット</h1>
      </div>

      {/* Balance */}
      <div className="mt-5 card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">🎫 残高</span>
          <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>{tickets}枚</span>
        </div>
      </div>

      {/* Purchase */}
      <button onClick={() => setShowPurchase(!showPurchase)} className="btn-primary mt-3 w-full text-sm">🎫 チケットを購入</button>
      {showPurchase && (
        <div className="mt-2 card p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>お支払い方法</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                  className="rounded-lg p-2 text-xs text-left transition-all"
                  style={{
                    backgroundColor: paymentMethod === m.key ? "var(--accent-soft)" : "var(--bg)",
                    border: paymentMethod === m.key ? "2px solid var(--accent)" : "1px solid var(--border)",
                    fontWeight: paymentMethod === m.key ? 600 : 400,
                  }}>
                  <span className="mr-1">{m.icon}</span>{m.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>チケットパック</p>
          {TICKET_PACKAGES.map(pkg => (
            <button key={pkg.ticketCount} onClick={() => handlePurchase(pkg)} className="w-full flex items-center justify-between rounded-xl p-3 text-sm hover:opacity-80" style={{ backgroundColor: "var(--accent-soft)" }}>
              <span className="font-medium">🎫 {pkg.ticketCount}枚</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>¥{pkg.priceYen.toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      {/* Subscription */}
      <div className="mt-4 card p-4">
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

      {/* Ledger */}
      <button onClick={() => setShowLedger(!showLedger)} className="btn-outline mt-3 w-full text-xs">{showLedger ? "閉じる" : "🎫 台帳を表示"}</button>
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

      {/* Usage guide */}
      <div className="mt-4 card p-3">
        <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>消費目安</p>
        <div className="mt-1 space-y-1 text-[11px]">
          <div className="flex justify-between"><span>ピン送信</span><span>5🎫</span></div>
          <div className="flex justify-between"><span>広場投稿</span><span>2🎫</span></div>
          <div className="flex justify-between"><span>スロット出品</span><span>1🎫</span></div>
        </div>
      </div>
    </div>
  );
}
