"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getRoom, getMessages, addMessage, addReport, addBlock, extendRoom } from "@/lib/demo-store";
import type { DemoRoom, DemoMessage } from "@/lib/demo-store";
import { DEMO_USER } from "@/lib/demo-data";

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<DemoRoom | null>(null);
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [text, setText] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(() => {
    const r = getRoom(roomId as string);
    setRoom(r);
    if (r) setMessages(getMessages(r.id));
  }, [roomId]);

  useEffect(() => { reload(); const iv = setInterval(reload, 2000); return () => clearInterval(iv); }, [reload]);

  if (!room) {
    return <div className="p-4 text-center"><p className="mt-12" style={{ color: "var(--muted)" }}>ルームが見つかりません</p>
      <button className="btn-primary mt-4 text-sm" onClick={() => router.push("/bookings")}>予約一覧へ</button></div>;
  }

  const now = Date.now();
  const roomStart = new Date(room.startAt).getTime() - 5 * 60_000;
  const roomEnd = new Date(room.endAt).getTime();
  const canChat = now >= roomStart && now <= roomEnd;
  const chatViewable = now <= roomEnd + 24 * 3600_000;
  const partner = room.participants.find(p => p.id !== DEMO_USER.id) ?? room.participants[0];
  const remaining = Math.max(0, Math.floor((roomEnd - now) / 60_000));

  function handleSend() {
    if (!text.trim() || !canChat) return;
    addMessage(room!.id, DEMO_USER.id, DEMO_USER.displayName, text.trim());
    setText("");
    reload();
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleExtend() {
    extendRoom(room!.id, 30);
    reload();
  }

  function handleReport() {
    if (!reportReason.trim()) return;
    addReport(room!.id, partner.id, reportReason);
    setShowReport(false);
    setReportReason("");
    alert("通報しました。運営が確認します。");
  }

  function handleBlock() {
    if (!confirm(`${partner.displayName}をブロックしますか？`)) return;
    addBlock(partner.id);
    alert("ブロックしました");
    router.push("/bookings");
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 p-3" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
        <button onClick={() => router.push("/bookings")} className="text-sm" style={{ color: "var(--muted)" }}>←</button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{partner.displayName}</p>
          <p className="text-[10px]" style={{ color: canChat ? "var(--success)" : "var(--muted)" }}>
            {canChat ? `残り${remaining}分` : chatViewable ? "チャット終了（閲覧のみ）" : "閲覧期限切れ"}
          </p>
        </div>
        <Link href={`/rooms/${roomId}/call`} className="btn-outline !px-2 !py-1 text-xs">📞</Link>
        <Link href={`/rooms/${roomId}/video`} className="btn-outline !px-2 !py-1 text-xs">📹</Link>
        <button onClick={() => setShowReport(!showReport)} className="text-xs" style={{ color: "var(--danger)" }}>⚠️</button>
      </div>

      {/* Report/Block panel */}
      {showReport && (
        <div className="flex-shrink-0 p-3 space-y-2" style={{ backgroundColor: "rgba(220,38,38,0.05)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex gap-2">
            <input className="input flex-1 text-xs" placeholder="通報理由" value={reportReason} onChange={e => setReportReason(e.target.value)} />
            <button onClick={handleReport} className="rounded px-3 py-1 text-xs text-white" style={{ backgroundColor: "var(--danger)" }}>通報</button>
          </div>
          <button onClick={handleBlock} className="text-xs" style={{ color: "var(--danger)" }}>🚫 {partner.displayName}をブロック</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ backgroundColor: "var(--bg)" }}>
        {!chatViewable && <p className="text-center text-xs" style={{ color: "var(--muted)" }}>チャット閲覧期限（24時間）を過ぎました</p>}
        {messages.map(msg => {
          const isMine = msg.senderId === DEMO_USER.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%] rounded-2xl px-3 py-2"
                style={{
                  backgroundColor: msg.masked ? "rgba(220,38,38,0.1)" : isMine ? "var(--accent)" : "var(--card)",
                  color: msg.masked ? "var(--danger)" : isMine ? "var(--accent-fg)" : "var(--text)",
                }}>
                {!isMine && <p className="text-[10px] font-medium mb-0.5" style={{ opacity: 0.7 }}>{msg.senderName}</p>}
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className="text-[9px] mt-0.5" style={{ opacity: 0.5 }}>{new Date(msg.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {canChat ? (
        <div className="flex-shrink-0 flex gap-2 p-3" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <input
            className="input flex-1"
            placeholder="メッセージを入力..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button onClick={handleSend} className="btn-primary !px-4 text-sm">送信</button>
        </div>
      ) : remaining <= 5 && remaining > 0 ? (
        <div className="flex-shrink-0 p-3 flex gap-2" style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <button onClick={handleExtend} className="btn-primary flex-1 text-xs" disabled={room.extended}>
            {room.extended ? "延長済み" : "30分延長する（双方合意）"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
