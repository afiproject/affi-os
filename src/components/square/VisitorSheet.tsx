"use client";

import { useRouter } from "next/navigation";
import AvatarFigure from "./AvatarFigure";
import type { SquareVisitor } from "@/lib/demo-data";

/**
 * VisitorSheet — Enhanced bottom sheet for plaza avatar tap.
 *
 * Priority order of information:
 * 1. Avatar + name + atmosphere (NOT photo first)
 * 2. Current status / hitokoto
 * 3. Availability & mode
 * 4. Quick action buttons
 * 5. Secondary links
 */
export default function VisitorSheet({
  visitor,
  onClose,
}: {
  visitor: SquareVisitor;
  onClose: () => void;
}) {
  const router = useRouter();
  const minutesAgo = Math.floor((Date.now() - new Date(visitor.lastActive).getTime()) / 60_000);
  const activeLabel = minutesAgo < 2 ? "今アクティブ" : `${minutesAgo}分前`;
  const isOnline = minutesAgo < 5;

  const modeLabel = visitor.mode === "call" ? "通話" : visitor.mode === "in_person" ? "対面" : "どちらでも";
  const modeIcon = visitor.mode === "call" ? "📞" : visitor.mode === "in_person" ? "🚶" : "📞🚶";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-[fadeIn_200ms_ease-out]"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg rounded-t-3xl pb-10 pt-3 animate-[slideUp_300ms_ease-out]"
        style={{ backgroundColor: "var(--card)" }}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />

        <div className="px-5">
          {/* ── Avatar + identity row ── */}
          <div className="flex items-start gap-4">
            {/* Avatar — larger, centered */}
            <div className="shrink-0 -mt-1">
              <div
                className="rounded-2xl p-2"
                style={{ background: "var(--gradient-soft)" }}
              >
                <AvatarFigure style={visitor.avatarStyle} size={72} />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              {/* Name + badges */}
              <div className="flex items-center gap-2">
                <p className="text-[17px] font-bold truncate">{visitor.displayName}</p>
                {visitor.verified && (
                  <span
                    className="shrink-0 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold text-white"
                    style={{ backgroundColor: "var(--success)" }}
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    認証済
                  </span>
                )}
              </div>

              {/* Gender + Rating */}
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>
                {visitor.gender} · ★ {visitor.ratingAvg.toFixed(1)}
                <span className="opacity-60"> ({visitor.ratingCount}件)</span>
              </p>

              {/* Online status */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: isOnline ? "var(--success)" : "var(--muted)",
                    boxShadow: isOnline ? "0 0 6px rgba(52,199,123,0.4)" : "none",
                  }}
                />
                <span
                  className="text-[11px] font-medium"
                  style={{ color: isOnline ? "var(--success)" : "var(--muted)" }}
                >
                  {activeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* ── Hitokoto / Status message ── */}
          {visitor.bubble && (
            <div
              className="mt-4 rounded-2xl px-4 py-3"
              style={{ backgroundColor: "var(--accent-soft)" }}
            >
              <p className="text-[13px] font-medium" style={{ color: "var(--accent-soft-text)" }}>
                「{visitor.bubble}」
              </p>
            </div>
          )}

          {/* ── Info chips ── */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <InfoChip icon={modeIcon} label={modeLabel} accent />
            {visitor.availability && <InfoChip icon="⏰" label={visitor.availability} />}
            {visitor.area && <InfoChip icon="📍" label={visitor.area} />}
            {visitor.tags.map((t) => (
              <InfoChip key={t} label={t} />
            ))}
          </div>

          {/* ── Bio preview ── */}
          {visitor.bio && (
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {visitor.bio}
            </p>
          )}

          {/* ── Primary actions ── */}
          <div className="mt-5 flex gap-2.5">
            <button
              onClick={() => router.push(`/square/person/${visitor.userId}`)}
              className="btn-outline flex-1 text-[13px] !py-3 !rounded-2xl"
            >
              プロフィールを見る
            </button>
            <button
              onClick={() => router.push(`/square/request/${visitor.userId}`)}
              className="btn-primary flex-1 text-[13px] !py-3 !rounded-2xl"
            >
              時間共有を依頼
            </button>
          </div>

          {/* ── Secondary links ── */}
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => router.push(`/market?seller=${visitor.userId}`)}
              className="flex-1 rounded-xl py-2.5 text-center text-[11px] font-medium transition-colors"
              style={{ color: "var(--muted)", backgroundColor: "var(--bg)" }}
            >
              スロットを見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon, label, accent }: { icon?: string; label: string; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium"
      style={{
        backgroundColor: accent ? "var(--accent-soft)" : "var(--bg)",
        color: accent ? "var(--accent-soft-text)" : "var(--text)",
        border: accent ? "none" : "1px solid var(--border)",
      }}
    >
      {icon && <span className="text-[11px]">{icon}</span>}
      {label}
    </span>
  );
}
