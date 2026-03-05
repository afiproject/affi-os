"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoom, addCallLog, endCallLog } from "@/lib/demo-store";

export default function VoiceCallPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const [callId, setCallId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [workMode, setWorkMode] = useState(false);

  const room = typeof window !== "undefined" ? getRoom(roomId as string) : null;
  const partner = room?.participants.find(p => p.id !== "demo-user-1") ?? room?.participants[0];

  useEffect(() => {
    if (!room) return;
    const log = addCallLog(room.id, "voice");
    setCallId(log.id);
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEnd() {
    if (callId && room) endCallLog(room.id, callId);
    router.push(`/rooms/${roomId}`);
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="text-center">
        <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-full text-4xl"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
          {partner?.displayName[0] ?? "?"}
        </div>
        <p className="mt-4 text-lg font-semibold">{partner?.displayName ?? "相手"}</p>
        <p className="mt-1 text-sm" style={{ color: "var(--success)" }}>📞 音声通話中</p>
        <p className="mt-2 text-2xl font-mono" style={{ color: "var(--accent)" }}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>

      {workMode && (
        <div className="mt-4 rounded-xl p-3 text-center text-xs" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
          🎧 作業通話モード（沈黙OK・30分タイマー）
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <button onClick={() => setMuted(!muted)}
          className="flex h-14 w-14 items-center justify-center rounded-full text-xl"
          style={{ backgroundColor: muted ? "var(--danger)" : "var(--card)", border: "1px solid var(--border)" }}>
          {muted ? "🔇" : "🎤"}
        </button>
        <button onClick={() => setWorkMode(!workMode)}
          className="flex h-14 w-14 items-center justify-center rounded-full text-xl"
          style={{ backgroundColor: workMode ? "var(--accent)" : "var(--card)", border: "1px solid var(--border)" }}>
          🎧
        </button>
        <button onClick={handleEnd}
          className="flex h-14 w-14 items-center justify-center rounded-full text-xl text-white"
          style={{ backgroundColor: "var(--danger)" }}>
          📞
        </button>
      </div>

      <p className="mt-8 text-xs" style={{ color: "var(--muted)" }}>デモモード：実際の通話は行われません</p>
    </div>
  );
}
