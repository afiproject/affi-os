"use client";

import { useState, useRef } from "react";

interface SquareCardProps {
  id: string;
  text: string;
  tags: string[];
  preferredMode: string;
  photos?: string[];
  likeCount: number;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  isLiked?: boolean;
  onLike?: (postId: string) => void;
  onRequest?: (postId: string) => void;
  onTap?: (postId: string) => void;
}

const TAG_LABELS: Record<string, string> = {
  chat: "雑談",
  work: "作業",
  study: "勉強",
  consult: "相談",
  game: "ゲーム",
  walk: "散歩",
};

export default function SquareCard({
  id,
  text,
  tags,
  preferredMode,
  photos = [],
  likeCount,
  createdAt,
  user,
  isLiked = false,
  onLike,
  onRequest,
  onTap,
}: SquareCardProps) {
  const timeAgo = getTimeAgo(new Date(createdAt));

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      {/* 写真カルーセル */}
      {photos.length > 0 && (
        <div onClick={() => onTap?.(id)} className="cursor-pointer">
          <PhotoCarousel photos={photos} />
        </div>
      )}

      <div className="p-4" onClick={() => onTap?.(id)} style={{ cursor: onTap ? "pointer" : undefined }}>
        {/* ヘッダー: アバター + 名前 + 時間 */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              user.displayName[0]
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold">{user.displayName}</span>
            <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>{timeAgo}</span>
          </div>
        </div>

        {/* 本文 */}
        <p className="mt-2.5 text-sm leading-relaxed">{text}</p>

        {/* タグ */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
              #{TAG_LABELS[tag] ?? tag}
            </span>
          ))}
          <span className="rounded-full px-2.5 py-0.5 text-xs"
            style={{ backgroundColor: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
            {preferredMode === "call" ? "📞 通話"
              : preferredMode === "in_person" ? "🚶 対面"
              : "📞🚶 どちらでも"}
          </span>
        </div>
      </div>

      {/* アクション */}
      <div className="flex items-center justify-between px-4 pb-4">
        <button
          onClick={(e) => { e.stopPropagation(); onLike?.(id); }}
          className={`flex items-center gap-1 text-sm transition-colors ${
            isLiked ? "text-red-500" : "text-[var(--color-text-secondary)] hover:text-red-500"
          }`}
        >
          {isLiked ? "♥" : "♡"} {likeCount}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRequest?.(id); }}
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 100%)" }}
        >
          時間共有を依頼
        </button>
      </div>
    </div>
  );
}

// ===== Photo Carousel =====
function PhotoCarousel({ photos }: { photos: string[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50 && current < photos.length - 1) setCurrent(c => c + 1);
    if (diff < -50 && current > 0) setCurrent(c => c - 1);
  }

  if (photos.length === 1) {
    return (
      <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
        <img src={photos[0]} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}>
        {photos.map((p, i) => (
          <div key={i} className="w-full shrink-0" style={{ aspectRatio: "4/3" }}>
            <img src={p} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {/* Indicators */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {photos.map((_, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
            className="rounded-full transition-all"
            style={{
              width: i === current ? 16 : 6,
              height: 6,
              backgroundColor: i === current ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}日前`;
}
