"use client";

import { useState } from "react";
import SlotCard from "@/components/market/SlotCard";

type SearchTab = "time" | "now";

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<SearchTab>("time");

  return (
    <div className="p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">マーケット</h1>
        <button className="text-xl">🔔</button>
      </div>

      {/* タブ切替 */}
      <div className="mt-4 flex border-b border-[var(--color-border)]">
        <button
          className={`flex-1 pb-2 text-center text-sm ${
            activeTab === "time" ? "tab-active" : "tab-inactive"
          }`}
          onClick={() => setActiveTab("time")}
        >
          時間から探す
        </button>
        <button
          className={`flex-1 pb-2 text-center text-sm ${
            activeTab === "now" ? "tab-active" : "tab-inactive"
          }`}
          onClick={() => setActiveTab("now")}
        >
          今から探す
        </button>
      </div>

      {/* 検索UI */}
      <div className="mt-4">
        {activeTab === "time" ? (
          <TimeSearch />
        ) : (
          <NowSearch />
        )}
      </div>
    </div>
  );
}

function TimeSearch() {
  return (
    <div className="space-y-4">
      {/* カレンダーUI（プレースホルダー） */}
      <div className="card text-center text-sm text-[var(--color-text-secondary)]">
        📅 カレンダーUIがここに入ります
        <br />
        日付・時間帯を選択してください
      </div>

      {/* フィルタ */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            形式
          </label>
          <div className="mt-1 flex gap-2">
            <button className="btn-primary text-xs">通話</button>
            <button className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs">
              対面
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            カテゴリ
          </label>
          <select className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm">
            <option value="">すべて</option>
            <option value="chat">雑談</option>
            <option value="work">作業同行</option>
            <option value="study">勉強</option>
            <option value="consult">相談</option>
            <option value="walk">散歩</option>
            <option value="game">ゲーム</option>
          </select>
        </div>

        <button className="btn-primary w-full">候補を検索</button>
      </div>

      {/* スロット一覧（プレースホルダー） */}
      <div className="text-center text-sm text-[var(--color-text-secondary)]">
        検索条件を設定して候補を探しましょう
      </div>
    </div>
  );
}

function NowSearch() {
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-1.5 text-sm">
          <span>📍</span>
          <span>現在地を取得中...</span>
        </div>
      </div>

      {/* 時間選択 */}
      <div>
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          時間
        </label>
        <div className="mt-1 flex gap-2">
          <button className="btn-primary text-xs">30分</button>
          <button className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs">
            60分
          </button>
          <button className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs">
            90分
          </button>
        </div>
      </div>

      {/* 半径選択 */}
      <div>
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          半径
        </label>
        <div className="mt-1 flex gap-2">
          <button className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs">
            1km
          </button>
          <button className="btn-primary text-xs">3km</button>
          <button className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs">
            5km
          </button>
        </div>
      </div>

      <button className="btn-primary w-full">スロットを探す</button>

      {/* 結果プレースホルダー */}
      <div className="text-center text-sm text-[var(--color-text-secondary)]">
        近くのスロットを検索しましょう
      </div>
    </div>
  );
}
