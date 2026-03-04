"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPosts } from "@/lib/demo-store";
import type { DemoPost } from "@/lib/demo-store";

const TAG_LABELS: Record<string, string> = {
  chat: "雑談", work: "作業", study: "勉強",
  consult: "相談", game: "ゲーム", walk: "散歩",
};

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<DemoPost | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const found = getPosts().find(p => p.id === id) ?? null;
    setPost(found);
    if (found) setLikeCount(found.likeCount);
  }, [id]);

  if (!post) {
    return (
      <div className="p-4 text-center">
        <p className="mt-12" style={{ color: "var(--muted)" }}>投稿が見つかりません</p>
        <button className="btn-primary mt-4 text-sm" onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  const photos = post.photos ?? [];

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
      </div>

      {/* Photos */}
      {photos.length > 0 && <DetailCarousel photos={photos} />}

      <div className="p-4">
        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
            {post.user.avatarUrl ? (
              <img src={post.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              post.user.displayName[0]
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{post.user.displayName}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{getTimeAgo(new Date(post.createdAt))}</p>
          </div>
        </div>

        {/* Text */}
        <p className="mt-4 text-base leading-relaxed">{post.text}</p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map(tag => (
            <span key={tag} className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
              #{TAG_LABELS[tag] ?? tag}
            </span>
          ))}
          <span className="rounded-full px-3 py-1 text-xs"
            style={{ backgroundColor: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
            {post.preferredMode === "call" ? "📞 通話"
              : post.preferredMode === "in_person" ? "🚶 対面"
              : "📞🚶 どちらでも"}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-4">
          <button onClick={() => { setLiked(!liked); setLikeCount(c => c + (liked ? -1 : 1)); }}
            className={`flex items-center gap-1.5 text-base transition-colors ${liked ? "text-red-500" : ""}`}
            style={{ color: liked ? undefined : "var(--muted)" }}>
            {liked ? "♥" : "♡"} <span className="text-sm">{likeCount}</span>
          </button>
        </div>

        {/* Request button */}
        <button onClick={() => router.push(`/square/request/${post.id}`)}
          className="mt-5 w-full rounded-full py-3 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #7B8CFF 0%, #B79DFF 100%)" }}>
          時間共有を依頼
        </button>
      </div>
    </div>
  );
}

// ===== Detail Carousel (full width, larger) =====
function DetailCarousel({ photos }: { photos: string[] }) {
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
    <div className="relative overflow-hidden" style={{ backgroundColor: "var(--bg)" }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}>
        {photos.map((p, i) => (
          <div key={i} className="w-full shrink-0" style={{ aspectRatio: "4/3" }}>
            <img src={p} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className="rounded-full transition-all"
              style={{
                width: i === current ? 18 : 7,
                height: 7,
                backgroundColor: i === current ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      )}
      {/* Counter */}
      {photos.length > 1 && (
        <div className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff" }}>
          {current + 1}/{photos.length}
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
