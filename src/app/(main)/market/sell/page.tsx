"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS, DEMO_USER } from "@/lib/demo-data";
import { addSlot, consumeTickets, checkConflict } from "@/lib/demo-store";

export default function SellPage() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("15:00");
  const [duration, setDuration] = useState(60);
  const [mode, setMode] = useState<"call" | "in_person">("call");
  const [category, setCategory] = useState("chat");
  const [price, setPrice] = useState("500");
  const [area, setArea] = useState("");
  const [bookingType, setBookingType] = useState<"instant" | "approval">("instant");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit() {
    setError("");
    const startAt = new Date(`${date}T${startTime}:00`).toISOString();
    const endAt = new Date(new Date(`${date}T${startTime}:00`).getTime() + duration * 60_000).toISOString();

    const conflict = checkConflict(startAt, endAt);
    if (conflict) {
      setError(`非公開予定「${conflict.title || "Busy"}」と時間が重複しています。出品できません。`);
      return;
    }

    if (!consumeTickets(0, "スロット出品")) {
      setError("チケットが不足しています");
      return;
    }

    addSlot({
      id: `slot-${Date.now()}`,
      category,
      mode,
      startAt,
      endAt,
      durationMinutes: duration,
      priceYen: parseInt(price) || 500,
      areaValue: mode === "in_person" && area ? area : null,
      bookingType,
      status: "listed",
      seller: {
        id: DEMO_USER.id,
        displayName: DEMO_USER.displayName,
        avatarUrl: null,
        verificationStatus: DEMO_USER.verificationStatus,
        ratingAvg: DEMO_USER.ratingAvg,
        ratingCount: DEMO_USER.ratingCount,
        cancelRate: DEMO_USER.cancelRate,
      },
    });
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl">✓</div>
        <p className="mt-3 text-lg font-semibold">出品しました！</p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>マーケットに表示されます</p>
        <button onClick={() => router.push("/market")} className="btn-primary mt-6 text-sm">マーケットに戻る</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
      <h1 className="mt-3 text-lg font-bold">スロットを出品</h1>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>日付</label>
          <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>開始時刻</label>
            <input type="time" className="input mt-1" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>時間</label>
            <div className="mt-1 flex gap-2">
              {[30, 60, 90].map((d) => (
                <button key={d} className={`chip ${d === duration ? "chip-active" : "chip-inactive"}`} onClick={() => setDuration(d)}>{d}分</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>形式</label>
          <div className="mt-1 flex gap-2">
            {([["call", "📞 通話"], ["in_person", "🚶 対面"]] as const).map(([v, l]) => (
              <button key={v} className={`chip ${v === mode ? "chip-active" : "chip-inactive"}`} onClick={() => setMode(v as "call" | "in_person")}>{l}</button>
            ))}
          </div>
        </div>
        {mode === "in_person" && (
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>エリア</label>
            <input className="input mt-1" placeholder="例: 仙台駅周辺" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
        )}
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>カテゴリ</label>
          <select className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>チケット枚数</label>
          <div className="mt-1 flex items-center gap-1">
            <input type="number" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
            <span className="text-sm">🎫</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>購入者がこの枚数のチケットを消費します</p>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>予約タイプ</label>
          <div className="mt-1 flex gap-2">
            {([["instant", "⚡ 即確定"], ["approval", "🔒 承認制"]] as const).map(([v, l]) => (
              <button key={v} className={`chip ${v === bookingType ? "chip-active" : "chip-inactive"}`} onClick={() => setBookingType(v as "instant" | "approval")}>{l}</button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-xl p-3 text-xs font-medium" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "var(--danger)" }}>{error}</div>}

        <button className="btn-primary w-full" onClick={handleSubmit}>出品する</button>
      </div>
    </div>
  );
}
