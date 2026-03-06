"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AvatarFigure from "@/components/square/AvatarFigure";
import { DEMO_SQUARE_VISITORS } from "@/lib/demo-data";
import { getSlots } from "@/lib/demo-store";

/**
 * PersonDetailPage — Full detail view of a plaza visitor.
 * Shows avatar, bio, tags, availability, slots, and action buttons.
 */
export default function PersonDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const visitor = DEMO_SQUARE_VISITORS.find((v) => v.userId === userId);
  const slots = getSlots().filter((s) => s.seller.id === userId && s.status === "listed");

  if (!visitor) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm" style={{ color: "var(--muted)" }}>ユーザーが見つかりません</p>
        <button onClick={() => router.back()} className="btn-outline text-xs">戻る</button>
      </div>
    );
  }

  const minutesAgo = Math.floor((Date.now() - new Date(visitor.lastActive).getTime()) / 60_000);
  const activeLabel = minutesAgo < 2 ? "今アクティブ" : `${minutesAgo}分前`;

  return (
    <div className="px-5 pt-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--accent-soft)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">{visitor.displayName}</h1>
      </div>

      {/* Avatar card */}
      <div className="flex flex-col items-center rounded-2xl py-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <AvatarFigure style={visitor.avatarStyle} size={96} animate="idle" />
        <p className="mt-3 text-lg font-bold">{visitor.displayName}</p>
        <div className="mt-1 flex items-center gap-2">
          {visitor.verified && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: "rgba(52,199,123,0.8)" }}>
              ✓ 認証済
            </span>
          )}
          <span className="text-xs" style={{ color: "var(--muted)" }}>{visitor.gender}</span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>★{visitor.ratingAvg} ({visitor.ratingCount})</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: minutesAgo < 5 ? "var(--success)" : "var(--muted)" }} />
          <span className="text-[11px]" style={{ color: minutesAgo < 5 ? "var(--success)" : "var(--muted)" }}>{activeLabel}</span>
        </div>
      </div>

      {/* Bubble */}
      {visitor.bubble && (
        <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: "var(--accent-soft)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>今の一言</p>
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--accent-soft-text)" }}>
            &ldquo;{visitor.bubble}&rdquo;
          </p>
        </div>
      )}

      {/* Bio */}
      <div className="mt-4 card p-4">
        <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>自己紹介</p>
        <p className="mt-1 text-sm leading-relaxed">{visitor.bio}</p>
      </div>

      {/* Mode & availability */}
      <div className="mt-3 card p-4">
        <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>対応形式・予定</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip icon={visitor.mode === "call" ? "📞" : visitor.mode === "in_person" ? "🚶" : "📞🚶"} label={visitor.mode === "call" ? "通話" : visitor.mode === "in_person" ? "対面" : "どちらでも"} />
          {visitor.availability && <Chip icon="⏰" label={visitor.availability} />}
          {visitor.area && <Chip icon="📍" label={visitor.area} />}
        </div>
      </div>

      {/* Tags */}
      {visitor.tags.length > 0 && (
        <div className="mt-3 card p-4">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>タグ</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visitor.tags.map((t) => (
              <span key={t} className="chip chip-inactive text-[11px]">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Slots */}
      {slots.length > 0 && (
        <div className="mt-3 card p-4">
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>出品中のスロット</p>
          <div className="mt-2 space-y-2">
            {slots.map((s) => {
              const start = new Date(s.startAt);
              return (
                <Link
                  key={s.id}
                  href={`/market/slots/${s.id}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <div>
                    <p className="text-xs font-medium">
                      {start.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })}
                      {" "}
                      {start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                      {s.durationMinutes}分 &middot; {s.mode === "call" ? "📞 通話" : "🚶 対面"}
                    </p>
                  </div>
                  <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                    {s.priceYen}🎫
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => router.push(`/square/request/${visitor.userId}`)}
          className="btn-primary flex-1 text-sm !py-3"
        >
          時間共有を依頼
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <Link
          href={`/profile/${visitor.userId}`}
          className="btn-outline flex-1 text-center text-xs !py-2.5"
        >
          プロフィール詳細
        </Link>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}>
      {icon && <span>{icon}</span>}{label}
    </span>
  );
}
