"use client";

import { useState } from "react";
import SlotCard from "@/components/market/SlotCard";
import { DEMO_SLOTS } from "@/lib/demo-data";

type SearchTab = "time" | "now";
type ModeFilter = "all" | "call" | "in_person";

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<SearchTab>("time");

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">マーケット</h1>
        <button className="text-xl">🔔</button>
      </div>

      <div className="mt-4 flex border-b border-[var(--color-border)]">
        <button
          className={`flex-1 pb-2 text-center text-sm ${activeTab === "time" ? "tab-active" : "tab-inactive"}`}
          onClick={() => setActiveTab("time")}
        >
          時間から探す
        </button>
        <button
          className={`flex-1 pb-2 text-center text-sm ${activeTab === "now" ? "tab-active" : "tab-inactive"}`}
          onClick={() => setActiveTab("now")}
        >
          今から探す
        </button>
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
  const [searched, setSearched] = useState(false);

  const filtered = DEMO_SLOTS.filter((s) => {
    if (modeFilter !== "all" && s.mode !== modeFilter) return false;
    if (categoryFilter && s.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="card p-3 text-center text-sm">
        <div className="text-lg">📅</div>
        <p className="mt-1 text-[var(--color-text-secondary)]">日付・時間帯を選択してから検索</p>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span>今日</span>
          <span className="font-semibold text-[var(--color-accent)]">
            {new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })}
          </span>
          <span>14:00 - 18:00</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">形式</label>
          <div className="mt-1 flex gap-2">
            {([["all", "すべて"], ["call", "通話"], ["in_person", "対面"]] as const).map(([v, l]) => (
              <button key={v} className={v === modeFilter ? "btn-primary text-xs" : "rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs"} onClick={() => setModeFilter(v as ModeFilter)}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">カテゴリ</label>
          <select className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">すべて</option>
            <option value="chat">雑談</option><option value="work">作業同行</option><option value="study">勉強</option>
            <option value="consult">相談</option><option value="walk">散歩</option><option value="game">ゲーム</option>
          </select>
        </div>
        <button className="btn-primary w-full" onClick={() => setSearched(true)}>候補を検索</button>
      </div>

      {searched && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-secondary)]">{filtered.length}件のスロット</p>
          {filtered.map((slot) => (<SlotCard key={slot.id} {...slot} />))}
          {filtered.length === 0 && (
            <div className="card p-6 text-center">
              <p className="text-3xl">🔍</p>
              <p className="mt-2 text-sm">見つかりませんでした</p>
              <button className="btn-primary mt-3 w-full text-xs">時間を広げて探す</button>
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

  return (
    <div className="space-y-4">
      <div className="card p-3">
        <div className="flex items-center gap-1.5 text-sm">📍 仙台駅付近（デモ）</div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">時間</label>
        <div className="mt-1 flex gap-2">
          {[30, 60, 90].map((d) => (
            <button key={d} className={d === duration ? "btn-primary text-xs" : "rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs"} onClick={() => setDuration(d)}>{d}分</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">半径</label>
        <div className="mt-1 flex gap-2">
          {[1, 3, 5].map((r) => (
            <button key={r} className={r === radius ? "btn-primary text-xs" : "rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs"} onClick={() => setRadius(r)}>{r}km</button>
          ))}
        </div>
      </div>
      <button className="btn-primary w-full" onClick={() => setSearched(true)}>スロットを探す</button>
      {searched && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-secondary)]">{DEMO_SLOTS.length}件</p>
          {DEMO_SLOTS.map((slot) => (<SlotCard key={slot.id} {...slot} />))}
        </div>
      )}
    </div>
  );
}
