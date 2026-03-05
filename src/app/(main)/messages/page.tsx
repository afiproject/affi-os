"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRooms, getMessages } from "@/lib/demo-store";
import type { DemoRoom, DemoMessage } from "@/lib/demo-store";

export default function MessagesPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<{ room: DemoRoom; lastMessage: DemoMessage | null }[]>([]);

  useEffect(() => {
    const rooms = getRooms();
    const t = rooms.map(room => {
      const msgs = getMessages(room.id);
      return { room, lastMessage: msgs.length > 0 ? msgs[msgs.length - 1] : null };
    }).sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.room.createdAt;
      const bTime = b.lastMessage?.createdAt ?? b.room.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    setThreads(t);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">メッセージ</h1>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>成立した予約のチャットスレッド</p>

      <div className="mt-4 space-y-2">
        {threads.length === 0 && (
          <div className="card p-6 text-center">
            <p className="text-3xl">💬</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>メッセージはまだありません</p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>予約が成立するとここにスレッドが表示されます</p>
            <button onClick={() => router.push("/market")} className="btn-primary mt-3 text-sm">マーケットで探す</button>
          </div>
        )}
        {threads.map(({ room, lastMessage }) => {
          const partner = room.participants.find(p => p.id !== "demo-user-1") ?? room.participants[0];
          const isActive = new Date(room.endAt).getTime() + 24 * 3600_000 > Date.now();
          return (
            <button key={room.id} onClick={() => router.push(`/rooms/${room.id}`)}
              className="w-full card p-4 text-left" style={{ opacity: isActive ? 1 : 0.6 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg" style={{ backgroundColor: "var(--accent-soft)" }}>
                    {partner.displayName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{partner.displayName}</p>
                    {lastMessage ? (
                      <p className="text-xs truncate max-w-[200px]" style={{ color: lastMessage.masked ? "var(--danger)" : "var(--muted)" }}>
                        {lastMessage.senderName === "あなた（デモ）" ? "あなた: " : ""}{lastMessage.text}
                      </p>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--muted)" }}>まだメッセージなし</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                    {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                  {!isActive && <span className="text-[10px]" style={{ color: "var(--muted)" }}>終了</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
