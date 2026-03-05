"use client";

import Link from "next/link";

interface SlotCardProps {
  id: string;
  category: string;
  mode: "call" | "in_person";
  startAt: string;
  endAt: string;
  durationMinutes: number;
  priceYen: number;
  areaValue?: string | null;
  bookingType: "instant" | "approval";
  seller: {
    displayName: string;
    verificationStatus: string;
    ratingAvg: number;
    cancelRate: number;
  };
}

const MODE_ICONS = {
  call: "📞",
  in_person: "🚶",
};

const CATEGORY_LABELS: Record<string, string> = {
  chat: "雑談",
  work: "作業同行",
  study: "勉強",
  consult: "相談",
  walk: "散歩",
  sightseeing: "観光",
  event: "イベント同行",
  game: "ゲーム",
};

export default function SlotCard({
  id,
  category,
  mode,
  startAt,
  endAt,
  durationMinutes,
  priceYen,
  areaValue,
  bookingType,
  seller,
}: SlotCardProps) {
  const start = new Date(startAt);
  const dateStr = start.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  const timeStr = `${start.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })}-${new Date(endAt).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return (
    <Link href={`/market/slots/${id}`} className="card block transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{MODE_ICONS[mode]}</span>
          <span className="font-semibold">
            {CATEGORY_LABELS[category] ?? category}
          </span>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {durationMinutes}分
          </span>
        </div>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
          {bookingType === "instant" ? "即確定" : "承認制"}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-sm">
        <div className="flex items-center gap-1.5">
          <span>📅</span>
          <span>{dateStr} {timeStr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🎫</span>
          <span className="font-semibold">{priceYen}枚</span>
        </div>
        {areaValue && (
          <div className="flex items-center gap-1.5">
            <span>📍</span>
            <span>{areaValue}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
        {seller.verificationStatus === "verified" && (
          <span className="text-green-600">✓ 本人確認済み</span>
        )}
        <span>★ {Number(seller.ratingAvg).toFixed(1)}</span>
        {Number(seller.cancelRate) < 10 && (
          <span>キャンセル率 &lt;{Math.ceil(Number(seller.cancelRate))}%</span>
        )}
      </div>
    </Link>
  );
}
