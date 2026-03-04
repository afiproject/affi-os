"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRequests, updateRequestStatus, addBooking, addTicketEntry, addBookingCalendarEvent } from "@/lib/demo-store";
import type { DemoRequest } from "@/lib/demo-store";

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  pending: { label: "承認待ち", color: "var(--accent)" },
  accepted: { label: "承認済み", color: "var(--success)" },
  rejected: { label: "拒否", color: "var(--danger)" },
};

export default function RequestInboxPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<DemoRequest[]>([]);

  useEffect(() => { setRequests(getRequests()); }, []);

  function handleAccept(req: DemoRequest) {
    updateRequestStatus(req.id, "accepted");
    const booking = {
      id: `bk-${Date.now()}`,
      slotId: `auto-${req.id}`,
      slot: {
        id: `auto-${req.id}`,
        category: "chat",
        mode: req.mode,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + req.durationMinutes * 60_000).toISOString(),
        durationMinutes: req.durationMinutes,
        priceYen: req.budgetYen,
        areaValue: null,
        bookingType: "approval" as const,
        status: "booked_confirmed",
        seller: { id: req.toUser.id, displayName: req.toUser.displayName, avatarUrl: null, verificationStatus: "verified", ratingAvg: 4.5, ratingCount: 10, cancelRate: 2.0 },
      },
      status: "confirmed" as const,
      createdAt: new Date().toISOString(),
    };
    addBooking(booking);
    addBookingCalendarEvent(booking);
    setRequests(getRequests());
  }

  function handleReject(req: DemoRequest) {
    updateRequestStatus(req.id, "rejected");
    addTicketEntry(2, `依頼拒否（返金）- ${req.fromUser.displayName}`);
    setRequests(getRequests());
  }

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
      <h1 className="mt-3 text-lg font-bold">依頼受信箱</h1>

      <div className="mt-4 space-y-3">
        {requests.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-3xl">📬</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>依頼はまだありません</p>
          </div>
        )}
        {requests.map((req) => {
          const st = STATUS_STYLES[req.status];
          return (
            <div key={req.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{req.fromUser.displayName} → {req.toUser.displayName}</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--accent-soft)", color: st.color }}>{st.label}</span>
              </div>
              {req.postText && <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>元投稿: 「{req.postText}」</p>}
              <div className="mt-2 space-y-1 text-sm" style={{ color: "var(--muted)" }}>
                <p>📅 {req.timing} / {req.mode === "call" ? "📞 通話" : "🚶 対面"} / {req.durationMinutes}分</p>
                <p>🎫 上限: {req.budgetYen}枚</p>
                {req.note && <p>💬 {req.note}</p>}
              </div>
              {req.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleAccept(req)} className="btn-primary flex-1 text-xs !py-2">承認</button>
                  <button onClick={() => handleReject(req)} className="btn-outline flex-1 text-xs" style={{ color: "var(--danger)" }}>拒否（2🎫返金）</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
