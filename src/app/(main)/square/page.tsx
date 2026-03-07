"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import ParkBackground from "@/components/square/ParkBackground";
import AvatarFigure from "@/components/square/AvatarFigure";
import Bubble from "@/components/square/Bubble";
import VisitorSheet from "@/components/square/VisitorSheet";
import { DEMO_SQUARE_VISITORS } from "@/lib/demo-data";
import type { SquareVisitor } from "@/lib/demo-data";

/**
 * SquarePage — SLOTY's isometric miniature garden avatar plaza.
 *
 * Design philosophy:
 * - "人がいる感" — avatar presence and ambient life
 * - 箱庭 — rich background, layered depth
 * - 静かなUI — minimal chrome, world-first
 * - 自然な導線 — tap → sheet → action
 *
 * Avatars drift gently (1-2px), bubbles cycle with stagger.
 * The park area is scrollable vertically to show the full scene on mobile.
 */

type VisitorAnim = SquareVisitor & {
  dx: number;
  dy: number;
  showBubble: boolean;
  facing: "left" | "right";
};

export default function SquarePage() {
  const [visitors, setVisitors] = useState<VisitorAnim[]>([]);
  const [selected, setSelected] = useState<SquareVisitor | null>(null);
  const driftRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const bubbleRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Initialize
  useEffect(() => {
    // Only show visitors that have CHARAT avatar images (image-based display)
    const imageVisitors = DEMO_SQUARE_VISITORS.filter((v) => v.avatarImage);
    setVisitors(
      imageVisitors.map((v, i) => ({
        ...v,
        dx: 0,
        dy: 0,
        showBubble: i < 4,
        facing: Math.random() > 0.5 ? "left" : "right",
      }))
    );
  }, []);

  // Gentle drift — very subtle, 1-2px max, every 5s
  useEffect(() => {
    driftRef.current = setInterval(() => {
      setVisitors((prev) =>
        prev.map((v) => ({
          ...v,
          dx: Math.max(-3, Math.min(3, v.dx + (Math.random() - 0.5) * 2)),
          dy: Math.max(-2, Math.min(2, v.dy + (Math.random() - 0.5) * 1.5)),
          // Occasionally flip facing
          facing: Math.random() > 0.92 ? (v.facing === "left" ? "right" : "left") : v.facing,
        }))
      );
    }, 5000);
    return () => clearInterval(driftRef.current);
  }, []);

  // Bubble cycling — stagger so max ~4 visible at once
  useEffect(() => {
    bubbleRef.current = setInterval(() => {
      setVisitors((prev) =>
        prev.map((v, i) => ({
          ...v,
          showBubble: ((Date.now() / 4000 + i * 1.3) % 6) < 3,
        }))
      );
    }, 3000);
    return () => clearInterval(bubbleRef.current);
  }, []);

  const handleTap = useCallback((visitor: SquareVisitor) => {
    setSelected(visitor);
  }, []);

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 72px)" }}>
      {/* ── Header — minimal, quiet ── */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-bold">広場</h1>
          {/* Live count */}
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-[6px] w-[6px] rounded-full animate-pulse"
              style={{ backgroundColor: "var(--success)" }}
            />
            <span className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>
              {visitors.length}人
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/square/bubble"
            className="flex h-8 items-center gap-1 rounded-full px-3 text-[11px] font-medium transition-colors"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}
          >
            💬 吹き出し
          </Link>
          <Link
            href="/square/customize"
            className="flex h-8 items-center gap-1 rounded-full px-3 text-[11px] font-medium transition-colors"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}
          >
            ✨ 着せ替え
          </Link>
        </div>
      </div>

      {/* ── Park area — the world ── */}
      <div
        data-no-swipe
        className="flex-1 relative mx-2 mb-1 rounded-2xl overflow-hidden"
        style={{
          minHeight: 520,
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.03)",
        }}
      >
        {/* Background world */}
        <ParkBackground />

        {/* Ambient particles — very subtle floating light dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { x: "15%", y: "30%", delay: "0s", dur: "8s" },
            { x: "70%", y: "25%", delay: "2s", dur: "10s" },
            { x: "45%", y: "60%", delay: "4s", dur: "7s" },
            { x: "80%", y: "50%", delay: "1s", dur: "9s" },
            { x: "30%", y: "70%", delay: "3s", dur: "11s" },
          ].map((p, i) => (
            <div
              key={`particle-${i}`}
              className="absolute animate-plaza-float"
              style={{
                left: p.x,
                top: p.y,
                width: 3,
                height: 3,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.5)",
                animationDelay: p.delay,
                animationDuration: p.dur,
              }}
            />
          ))}
        </div>

        {/* ── Visitor avatars ── */}
        {visitors.map((v, idx) => {
          const zIndex = Math.round(v.y + v.dy);
          const avatarSize = 62 + Math.round((v.y / 100) * 16);
          const hasImage = !!v.avatarImage;

          return (
            <button
              key={v.id}
              onClick={() => handleTap(v)}
              className="absolute transition-all duration-[4500ms] ease-in-out group"
              style={{
                left: `${v.x + v.dx * 0.3}%`,
                top: `${v.y + v.dy * 0.3}%`,
                transform: `translate(-50%, -100%) scaleX(${v.facing === "left" ? -1 : 1})`,
                zIndex,
              }}
            >
              {/* Avatar wrapper — relative so Bubble uses bottom:100% */}
              <div className="relative">
                {/* Bubble — unflipped so text reads correctly */}
                <div style={{ transform: `scaleX(${v.facing === "left" ? -1 : 1})` }}>
                  <Bubble text={v.bubble} visible={v.showBubble} />
                </div>

                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(circle, rgba(155,138,251,0.15) 0%, transparent 70%)",
                    transform: "scale(2)",
                    pointerEvents: "none",
                  }}
                />

                {hasImage ? (
                  /* ── Image-based avatar (CHARAT) ── */
                  <div className="flex flex-col items-center">
                    <img
                      src={v.avatarImage}
                      alt={v.displayName}
                      className="animate-avatar-float"
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        objectFit: "contain",
                        animationDelay: `${idx * 0.6}s`,
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))",
                      }}
                      draggable={false}
                    />
                    {/* Foot shadow */}
                    <div
                      className="animate-avatar-shadow"
                      style={{
                        width: avatarSize * 0.5,
                        height: avatarSize * 0.12,
                        borderRadius: "50%",
                        backgroundColor: "rgba(0,0,0,0.12)",
                        marginTop: -2,
                        animationDelay: `${idx * 0.6}s`,
                      }}
                    />
                  </div>
                ) : (
                  /* ── SVG parts-based avatar (fallback) ── */
                  <AvatarFigure style={v.avatarStyle} size={avatarSize} animate="idle" />
                )}
              </div>

              {/* Name tag — unflipped */}
              <p
                className="mt-0.5 text-center text-[10px] font-semibold leading-none"
                style={{
                  color: "#3A3A4A",
                  textShadow: "0 0 6px rgba(255,255,255,0.95), 0 0 12px rgba(255,255,255,0.5)",
                  transform: `scaleX(${v.facing === "left" ? -1 : 1})`,
                  letterSpacing: "0.02em",
                }}
              >
                {v.displayName}
              </p>
            </button>
          );
        })}

        {/* "You are here" — soft indicator */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1.5 text-[10px] font-medium backdrop-blur-md"
          style={{
            backgroundColor: "rgba(123,140,255,0.12)",
            color: "var(--accent)",
            border: "1px solid rgba(123,140,255,0.2)",
            boxShadow: "0 2px 8px rgba(123,140,255,0.08)",
          }}
        >
          あなたもここにいます
        </div>
      </div>

      {/* ── Bottom action bar — quiet ── */}
      <div className="flex items-center justify-between px-5 py-2">
        <p className="text-[11px]" style={{ color: "var(--muted)" }}>
          タップして話しかけよう
        </p>
        <Link
          href="/square/new"
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold text-white shadow-sm transition-transform active:scale-95"
          style={{ background: "var(--gradient-main)" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          投稿する
        </Link>
      </div>

      {/* ── Bottom sheet ── */}
      {selected && (
        <VisitorSheet visitor={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
