"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SlotCard from "@/components/market/SlotCard";
import { getSlots } from "@/lib/demo-store";
import { CATEGORY_LABELS } from "@/lib/demo-data";

type ModeFilter = "all" | "call" | "in_person";

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<"time" | "now">("time");

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">マーケット</h1>
        <Link href="/market/sell" className="btn-primary text-xs !px-4 !py-2">+ 出品</Link>
      </div>

      <div className="mt-4 flex" style={{ borderBottom: "1px solid var(--border)" }}>
        {(["time", "now"] as const).map((tab) => (
          <button key={tab}
            className={`flex-1 pb-2 text-center text-sm ${activeTab === tab ? "tab-active" : "tab-inactive"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "time" ? "時間から探す" : "今から探す"}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === "time" ? <TimeSearch /> : <NowSearch />}
      </div>
    </div>
  );
}

function TimeSearch() {
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("18:00");
  const [maxPrice, setMaxPrice] = useState("");
  const [searched, setSearched] = useState(false);
  const [slots, setSlots] = useState<ReturnType<typeof getSlots>>([]);

  useEffect(() => { setSlots(getSlots()); }, []);

  const filtered = slots.filter((s) => {
    if (modeFilter !== "all" && s.mode !== modeFilter) return false;
    if (categoryFilter && s.category !== categoryFilter) return false;
    if (maxPrice && s.priceYen > parseInt(maxPrice)) return false;
    if (s.status !== "listed") return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>日付</label>
          <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>開始</label>
            <input type="time" className="input mt-1" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>終了</label>
            <input type="time" className="input mt-1" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>形式</label>
          <div className="mt-1 flex gap-2">
            {([["all", "すべて"], ["call", "📞 通話"], ["in_person", "🚶 対面"]] as const).map(([v, l]) => (
              <button key={v} className={`chip ${v === modeFilter ? "chip-active" : "chip-inactive"}`} onClick={() => setModeFilter(v as ModeFilter)}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>カテゴリ</label>
          <select className="input mt-1" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">すべて</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>消費チケット上限</label>
          <div className="mt-1 flex items-center gap-1">
            <input type="number" className="input" placeholder="例: 10" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            <span className="text-sm">🎫</span>
          </div>
        </div>
        <button className="btn-primary w-full" onClick={() => { setSlots(getSlots()); setSearched(true); }}>候補を検索</button>
      </div>

      {searched && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>{filtered.length}件のスロット</p>
          {filtered.map((slot) => <SlotCard key={slot.id} {...slot} />)}
          {filtered.length === 0 && (
            <div className="card p-6 text-center">
              <p className="text-3xl">🔍</p>
              <p className="mt-2 text-sm">見つかりませんでした</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NowSearch() {
  const [duration, setDuration] = useState(30);
  const [radius, setRadius] = useState(3);
  const [searched, setSearched] = useState(false);
  const [slots, setSlots] = useState<ReturnType<typeof getSlots>>([]);

  useEffect(() => { setSlots(getSlots()); }, []);

  const listed = slots.filter(s => s.status === "listed");

  return (
    <div className="space-y-4">
      <div className="card p-3 flex items-center gap-1.5 text-sm">📍 仙台駅付近（デモ）</div>
      <div>
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>時間</label>
        <div className="mt-1 flex gap-2">
          {[30, 60, 90].map((d) => (
            <button key={d} className={`chip ${d === duration ? "chip-active" : "chip-inactive"}`} onClick={() => setDuration(d)}>{d}分</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>半径</label>
        <div className="mt-1 flex gap-2">
          {[1, 3, 5].map((r) => (
            <button key={r} className={`chip ${r === radius ? "chip-active" : "chip-inactive"}`} onClick={() => setRadius(r)}>{r}km</button>
          ))}
        </div>
      </div>
      <button className="btn-primary w-full" onClick={() => { setSlots(getSlots()); setSearched(true); }}>スロットを探す</button>
      {searched && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>{listed.length}件</p>
          {listed.map((slot) => <SlotCard key={slot.id} {...slot} />)}
        </div>
      )}
    </div>
  );
}
