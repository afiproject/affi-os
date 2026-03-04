"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoom, addCallLog, endCallLog } from "@/lib/demo-store";

export default function VideoCallPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const [callId, setCallId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(true);

  const room = typeof window !== "undefined" ? getRoom(roomId as string) : null;
  const partner = room?.participants.find(p => p.id !== "demo-user-1") ?? room?.participants[0];

  useEffect(() => {
    if (!room) return;
    const log = addCallLog(room.id, "video");
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
    <div className="flex flex-col items-center justify-center min-h-screen p-6" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Partner video placeholder */}
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden" style={{ height: 320, backgroundColor: "#2d2d44" }}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full text-4xl"
              style={{ backgroundColor: "rgba(155,138,251,0.2)", color: "#9b8afb" }}>
              {partner?.displayName[0] ?? "?"}
            </div>
            <p className="mt-3 text-white font-medium">{partner?.displayName ?? "相手"}</p>
          </div>
        </div>
        {/* Self view */}
        <div className="absolute bottom-3 right-3 w-20 h-28 rounded-lg overflow-hidden" style={{ backgroundColor: cameraOff ? "#333" : "#555" }}>
          <div className="flex h-full items-center justify-center text-white text-xs">
            {cameraOff ? "カメラOFF" : "自分"}
          </div>
        </div>
        {/* Timer */}
        <div className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs text-white" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          📹 {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button onClick={() => setMuted(!muted)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: muted ? "#ef4444" : "rgba(255,255,255,0.2)" }}>
          {muted ? "🔇" : "🎤"}
        </button>
        <button onClick={() => setCameraOff(!cameraOff)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: cameraOff ? "#ef4444" : "rgba(255,255,255,0.2)" }}>
          {cameraOff ? "📷" : "📹"}
        </button>
        <button onClick={handleEnd}
          className="flex h-12 w-12 items-center justify-center rounded-full text-lg text-white"
          style={{ backgroundColor: "#ef4444" }}>
          ✕
        </button>
      </div>

      <p className="mt-6 text-xs" style={{ color: "#888" }}>デモモード：実際のビデオ通話は行われません</p>
    </div>
  );
}
