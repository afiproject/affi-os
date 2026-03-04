"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getPings,
  updatePingStatus,
  addBooking,
  addTicketEntry,
} from "@/lib/demo-store";
import type { DemoPing } from "@/lib/demo-store";
import { DEMO_USER, MEETUP_PLACES } from "@/lib/demo-data";

export default function PingsPage() {
  const router = useRouter();
  const [pings, setPings] = useState<DemoPing[]>([]);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);

  useEffect(() => {
    setPings(getPings());
  }, []);

  // Split into received (to me) and sent (from me)
  const received = pings.filter((p) => p.toUser.id === DEMO_USER.id);
  const sent = pings.filter((p) => p.fromUser.id === DEMO_USER.id);

  function handleAccept(ping: DemoPing) {
    updatePingStatus(ping.id, "accepted");

    // Create booking from ping
    const now = new Date();
    const endAt = new Date(now.getTime() + ping.durationMinutes * 60_000);
    addBooking({
      id: `bk-ping-${Date.now()}`,
      slotId: `slot-ping-${ping.id}`,
      slot: {
        id: `slot-ping-${ping.id}`,
        category: "chat",
        mode: ping.mode,
        startAt: now.toISOString(),
        endAt: endAt.toISOString(),
        durationMinutes: ping.durationMinutes,
        priceYen: 0,
        areaValue: ping.mode === "in_person" ? MEETUP_PLACES[0] : null,
        bookingType: "instant",
        status: "booked",
        seller: {
          id: ping.fromUser.id,
          displayName: ping.fromUser.displayName,
          avatarUrl: null,
          verificationStatus: "verified",
          ratingAvg: 4.5,
          ratingCount: 10,
          cancelRate: 2,
        },
      },
      status: "confirmed",
      createdAt: now.toISOString(),
    });

    setAcceptedId(ping.id);
    setPings(getPings());
  }

  function handleReject(ping: DemoPing) {
    updatePingStatus(ping.id, "rejected");
    // Refund partial tickets to sender
    addTicketEntry(2, `ピン拒否返金: ${ping.fromUser.displayName}`);
    setPings(getPings());
  }

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
      <h1 className="mt-3 text-xl font-bold">ピン受信箱</h1>

      {/* Accepted toast */}
      {acceptedId && (
        <div className="mt-3 rounded-xl p-3 text-sm font-medium" style={{ backgroundColor: "rgba(52,199,123,0.1)", color: "var(--success)" }}>
          ✓ マッチ成立！予約が作成されました
          <button onClick={() => router.push("/bookings")} className="ml-2 underline">予約を確認</button>
        </div>
      )}

      {/* Received pings */}
      <section className="mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>受信したピン</h2>
        {received.length === 0 ? (
          <div className="card mt-2 p-6 text-center">
            <p className="text-3xl">📥</p>
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>受信したピンはありません</p>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {received.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                    {p.fromUser.displayName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{p.fromUser.displayName}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {p.purpose} / {p.mode === "call" ? "📞 通話" : "🚶 対面"} / {p.durationMinutes}分
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: p.status === "pending"
                        ? "rgba(234,179,8,0.15)"
                        : p.status === "accepted"
                          ? "rgba(52,199,123,0.15)"
                          : "rgba(220,38,38,0.1)",
                      color: p.status === "pending"
                        ? "#b45309"
                        : p.status === "accepted"
                          ? "var(--success)"
                          : "var(--danger)",
                    }}
                  >
                    {p.status === "pending" ? "未対応" : p.status === "accepted" ? "承認済み" : "拒否"}
                  </span>
                </div>

                {p.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleReject(p)} className="btn-outline flex-1 text-xs">
                      拒否
                    </button>
                    <button onClick={() => handleAccept(p)} className="btn-primary flex-1 text-xs">
                      承認（マッチ）
                    </button>
                  </div>
                )}

                {p.status === "accepted" && (
                  <div className="mt-2 rounded-lg p-2 text-xs" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                    {p.mode === "in_person"
                      ? `📍 待ち合わせ: ${MEETUP_PLACES[0]}`
                      : "📞 通話を開始してください"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sent pings */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>送信したピン</h2>
        {sent.length === 0 ? (
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>まだピンを送信していません</p>
        ) : (
          <div className="mt-2 space-y-2">
            {sent.map((p) => (
              <div key={p.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.toUser.displayName}へ</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: p.status === "pending"
                        ? "rgba(234,179,8,0.15)"
                        : p.status === "accepted"
                          ? "rgba(52,199,123,0.15)"
                          : "rgba(220,38,38,0.1)",
                      color: p.status === "pending" ? "#b45309" : p.status === "accepted" ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {p.status === "pending" ? "待機中" : p.status === "accepted" ? "マッチ！" : "不成立"}
                  </span>
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {p.purpose} / {p.durationMinutes}分
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
