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

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

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
  const hasPhotos = photos.length > 0;
  const hasAvatar = user.avatarUrl && user.avatarUrl.startsWith("data:");
  const bgGradient = GRADIENTS[id.charCodeAt(id.length - 1) % GRADIENTS.length];

  // Determine background: post photos > avatar > gradient
  const bgImage = hasPhotos ? photos[0] : hasAvatar ? user.avatarUrl : null;

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        height: 480,
        background: bgImage ? undefined : bgGradient,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      {/* Background image */}
      {bgImage && (
        <PhotoBackground photos={photos.length > 0 ? photos : [bgImage!]} />
      )}

      {/* Placeholder initial when no photo */}
      {!bgImage && (
        <div className="absolute inset-0 flex items-center justify-center" onClick={() => onTap?.(id)} style={{ cursor: "pointer" }}>
          <span className="text-[140px] font-bold text-white/20">{user.displayName[0]}</span>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 35%, transparent 55%)" }} />

      {/* Top-left: time ago badge */}
      <div className="absolute top-3 left-3">
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          {timeAgo}
        </span>
      </div>

      {/* Top-right: mode badge */}
      <div className="absolute top-3 right-3">
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          {preferredMode === "call" ? "📞 通話"
            : preferredMode === "in_person" ? "🚶 対面"
            : "📞🚶 どちらでも"}
        </span>
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* User name */}
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-white">{user.displayName}</p>
        </div>

        {/* Post text */}
        <p className="mt-1.5 text-sm text-white/90 leading-relaxed line-clamp-2">{text}</p>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              #{TAG_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={(e) => { e.stopPropagation(); onLike?.(id); }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all active:scale-95"
            style={{ backgroundColor: isLiked ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.15)" }}
          >
            {isLiked ? "♥" : "♡"} {likeCount}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRequest?.(id); }}
            className="rounded-full px-5 py-2 text-xs font-bold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 100%)", boxShadow: "0 2px 12px rgba(155,138,251,0.4)" }}
          >
            時間共有を依頼
          </button>
        </div>
      </div>

      {/* Tap area (middle portion) */}
      <div className="absolute top-12 left-0 right-0 bottom-40 cursor-pointer" onClick={() => onTap?.(id)} />
    </div>
  );
}

// ===== Photo Background with swipe =====
function PhotoBackground({ photos }: { photos: string[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && current < photos.length - 1) setCurrent(c => c + 1);
    if (diff < -50 && current > 0) setCurrent(c => c - 1);
  }

  return (
    <div className="absolute inset-0" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)`, width: `${photos.length * 100}%` }}>
        {photos.map((p, i) => (
          <div key={i} className="h-full" style={{ width: `${100 / photos.length}%` }}>
            <img src={p} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {/* Photo indicators */}
      {photos.length > 1 && (
        <div className="absolute top-2 left-0 right-0 flex justify-center gap-1">
          {photos.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all"
              style={{
                width: i === current ? 24 : 8,
                backgroundColor: i === current ? "white" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      )}
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
