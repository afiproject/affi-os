"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SlotCard from "@/components/market/SlotCard";
import { getSlots } from "@/lib/demo-store";
import { CATEGORY_LABELS, GENDER_OPTIONS } from "@/lib/demo-data";

type ModeFilter = "all" | "call" | "in_person";
type GenderFilter = "" | "男性" | "女性" | "その他";

export default function MarketPage() {
  return (
    <div className="px-5 pt-3 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">時間を探す</h1>
        <Link
          href="/market/sell"
          className="flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold"
          style={{
            background: "var(--gradient-main)",
            color: "#fff",
            boxShadow: "0 2px 12px rgba(155, 138, 251, 0.25)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          出品
        </Link>
      </div>

      <TabSearch />
    </div>
  );
}

function TabSearch() {
  const [activeTab, setActiveTab] = useState<"time" | "now">("time");

  return (
    <>
      <div className="mt-4 flex gap-2">
        {(["time", "now"] as const).map((tab) => (
          <button
            key={tab}
            className={`chip ${activeTab === tab ? "chip-active" : "chip-inactive"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "time" ? "日時で探す" : "今すぐ探す"}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {activeTab === "time" ? <TimeSearch /> : <NowSearch />}
      </div>
    </>
  );
}

function TimeSearch() {
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("18:00");
  const [searched, setSearched] = useState(false);
  const [slots, setSlots] = useState<ReturnType<typeof getSlots>>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("");

  useEffect(() => { setSlots(getSlots()); }, []);

  const filtered = slots.filter((s) => {
    if (modeFilter !== "all" && s.mode !== modeFilter) return false;
    if (categoryFilter && s.category !== categoryFilter) return false;
    if (maxPrice && s.priceYen > parseInt(maxPrice)) return false;
    if (genderFilter && (s.seller as any).gender !== genderFilter) return false;
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
        <div className="grid grid-cols-2 gap-3">
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
          <div className="mt-1.5 flex gap-2">
            {([["all", "すべて"], ["call", "📞 通話"], ["in_person", "🚶 対面"]] as const).map(([v, l]) => (
              <button key={v} className={`chip ${v === modeFilter ? "chip-active" : "chip-inactive"}`} onClick={() => setModeFilter(v as ModeFilter)}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>性別</label>
          <div className="mt-1.5 flex gap-2">
            {([["", "すべて"], ["男性", "♂ 男性"], ["女性", "♀ 女性"], ["その他", "その他"]] as const).map(([v, l]) => (
              <button key={v} className={`chip ${v === genderFilter ? "chip-active" : "chip-inactive"}`} onClick={() => setGenderFilter(v as GenderFilter)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-medium"
        style={{ color: "var(--muted)", backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        {showAdvanced ? "条件を閉じる" : "詳細条件"}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: showAdvanced ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {showAdvanced && (
        <div className="space-y-3 rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>カテゴリ</label>
            <select className="input mt-1" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">すべて</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>チケット上限</label>
            <div className="mt-1 flex items-center gap-2">
              <input type="number" className="input" placeholder="例: 10" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              <span className="text-sm shrink-0">🎫</span>
            </div>
          </div>
        </div>
      )}

      <button className="btn-primary w-full" onClick={() => { setSlots(getSlots()); setSearched(true); }}>
        検索する
      </button>

      {searched && (
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>{filtered.length}件のスロット</p>
          {filtered.map((slot) => <SlotCard key={slot.id} {...slot} />)}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12" style={{ color: "var(--muted)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm">見つかりませんでした</p>
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
      <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="text-sm">現在地付近</span>
      </div>
      <div>
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>時間</label>
        <div className="mt-1.5 flex gap-2">
          {[30, 60, 90].map((d) => (
            <button key={d} className={`chip ${d === duration ? "chip-active" : "chip-inactive"}`} onClick={() => setDuration(d)}>{d}分</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>半径</label>
        <div className="mt-1.5 flex gap-2">
          {[1, 3, 5].map((r) => (
            <button key={r} className={`chip ${r === radius ? "chip-active" : "chip-inactive"}`} onClick={() => setRadius(r)}>{r}km</button>
          ))}
        </div>
      </div>
      <button className="btn-primary w-full" onClick={() => { setSlots(getSlots()); setSearched(true); }}>検索する</button>
      {searched && (
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>{listed.length}件</p>
          {listed.map((slot) => <SlotCard key={slot.id} {...slot} />)}
        </div>
      )}
    </div>
  );
}
