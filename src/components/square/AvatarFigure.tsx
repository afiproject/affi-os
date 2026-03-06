"use client";

import type { AvatarStyle } from "@/lib/demo-data";
import { computeAnchors, type Anchors, type BaseBody } from "@/lib/avatar-system";

/**
 * AvatarFigure — Pigg-style 2~2.5 head chibi avatar for SLOTY.
 *
 * Phase-based architecture:
 * - Phase 1: 3 base bodies (male/female/neutral) with fixed anchors
 * - Phase 2: Face parts positioned relative to base-body anchors
 * - Phase 3: Hair parts with base-compatible restrictions
 * - Phase 4: Clothing with body-compatible restrictions
 * - Phase 5: Body type variants with safe scaling
 * - Phase 6: Plaza integration
 *
 * All positions derived from computeAnchors(base, faceShape, bodyType).
 */

/* ═══ Color helpers ═══ */
function dk(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * pct / 100));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * pct / 100));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * pct / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
function lt(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * pct / 100));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * pct / 100));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * pct / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function AvatarFigure({
  style,
  size = 64,
  className,
  animate,
}: {
  style: AvatarStyle;
  size?: number;
  className?: string;
  animate?: "idle" | "walk";
}) {
  const base: BaseBody = (style as Record<string, unknown>).base as BaseBody ?? "neutral";
  const {
    faceShape = 0, eyeType = 0, eyeColor = "#2A2A3A", browType = 0,
    mouthType = 0, cheekType = 0, cheekColor = "#FFB4B4", noseType = 0,
    hairStyle = 0, hairColor = "#2C2C2C", bodyType = 0, skinTone = "#FFDBB4",
    topType = 0, topColor = "#7B8CFF", bottomType = 0, bottomColor = "#3A3A5E",
    accessory = 0,
  } = style;

  const skin = skinTone;
  const skinD = dk(skin, 8);
  const hairD = dk(hairColor, 14);
  const hairH = lt(hairColor, 12);
  const topD = dk(topColor, 12);
  const botD = dk(bottomColor, 10);

  // Phase 1: Anchors computed from base body + face shape + body type
  const a = computeAnchors(base, faceShape, bodyType);

  const animClass = animate === "walk" ? "animate-avatar-walk" : animate === "idle" ? "animate-avatar-idle" : "";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 100 ${a.viewBoxH}`}
      className={`${animClass} ${className ?? ""}`}
      style={{ overflow: "visible" }}
    >
      {/* ══════ Ground shadow ══════ */}
      <ellipse cx={50} cy={a.shadowY} rx={a.shoulderHW * 0.75} ry={3} fill="rgba(0,0,0,0.08)" />

      {/* ══════ BODY GROUP ══════ */}
      <g data-part="body">
        <g data-part="legs">
          {renderBottom(bottomType, bottomColor, botD, skin, a)}
          <ellipse cx={a.headCx - a.hipHW * 0.55} cy={a.footBase} rx={a.hipHW * 0.28} ry={3} fill="#4A4A5A" />
          <ellipse cx={a.headCx + a.hipHW * 0.55} cy={a.footBase} rx={a.hipHW * 0.28} ry={3} fill="#4A4A5A" />
        </g>
        <g data-part="torso">
          {renderTop(topType, topColor, topD, skin, skinD, a)}
        </g>
        <g data-part="arms">
          {renderArms(skin, topColor, a)}
        </g>
      </g>

      {/* ══════ NECK ══════ */}
      <rect x={a.headCx - 4} y={a.neckTop} width={8} height={a.neckBottom - a.neckTop} rx={3} fill={skin} />

      {/* ══════ HEAD GROUP ══════ */}
      <g data-part="head">
        {renderHairBack(hairStyle, hairColor, hairD, a)}

        <ellipse cx={a.headCx} cy={a.headCy} rx={a.headRx} ry={a.headRy} fill={skin} />
        <ellipse cx={a.headCx} cy={a.headCy + a.headRy * 0.7} rx={a.headRx * 0.6} ry={4} fill={skinD} opacity={0.3} />

        {/* Ears */}
        <ellipse cx={a.headCx - a.headRx + 2} cy={a.headCy + 2} rx={4} ry={5} fill={skin} />
        <ellipse cx={a.headCx + a.headRx - 2} cy={a.headCy + 2} rx={4} ry={5} fill={skin} />
        <ellipse cx={a.headCx - a.headRx + 2} cy={a.headCy + 2} rx={2.5} ry={3} fill={skinD} opacity={0.2} />
        <ellipse cx={a.headCx + a.headRx - 2} cy={a.headCy + 2} rx={2.5} ry={3} fill={skinD} opacity={0.2} />

        {/* Hair cap — BEHIND face so face features are visible */}
        {renderHairCap(hairColor, a)}

        <g data-part="face">
          {renderBrows(browType, a)}
          {renderEyes(eyeType, eyeColor, a)}
          {renderNose(noseType, a, skin)}
          {renderMouth(mouthType, a)}
          {renderCheeks(cheekType, cheekColor, a)}
        </g>

        {renderHairFront(hairStyle, hairColor, hairD, hairH, a)}
        {renderAccessory(accessory, a)}
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   FACE PARTS — anchored to computed positions
   ══════════════════════════════════════════════════════ */

function renderEyes(type: number, color: string, a: Anchors) {
  const ey = a.eyeLine;
  const lx = a.headCx - a.eyeSpacing;
  const rx = a.headCx + a.eyeSpacing;

  switch (type) {
    case 0: // まる
      return (<>
        <ellipse cx={lx} cy={ey} rx={5} ry={5.5} fill="white" />
        <ellipse cx={rx} cy={ey} rx={5} ry={5.5} fill="white" />
        <ellipse cx={lx + 0.5} cy={ey + 0.5} rx={3.5} ry={4} fill={color} />
        <ellipse cx={rx - 0.5} cy={ey + 0.5} rx={3.5} ry={4} fill={color} />
        <circle cx={lx + 1.5} cy={ey - 1} r={1.3} fill="white" />
        <circle cx={rx - 1.5} cy={ey - 1} r={1.3} fill="white" />
      </>);
    case 1: // たれ目
      return (<>
        <ellipse cx={lx} cy={ey} rx={5} ry={5} fill="white" />
        <ellipse cx={rx} cy={ey} rx={5} ry={5} fill="white" />
        <ellipse cx={lx + 0.5} cy={ey + 0.8} rx={3.2} ry={3.5} fill={color} />
        <ellipse cx={rx - 0.5} cy={ey + 0.8} rx={3.2} ry={3.5} fill={color} />
        <circle cx={lx + 1.5} cy={ey - 0.5} r={1.2} fill="white" />
        <circle cx={rx - 1.5} cy={ey - 0.5} r={1.2} fill="white" />
        <path d={`M${lx - 5},${ey - 4} Q${lx},${ey - 6} ${lx + 5},${ey - 3}`} fill="none" stroke="#3A3A4A" strokeWidth="1" />
        <path d={`M${rx - 5},${ey - 3} Q${rx},${ey - 6} ${rx + 5},${ey - 4}`} fill="none" stroke="#3A3A4A" strokeWidth="1" />
      </>);
    case 2: // つり目
      return (<>
        <ellipse cx={lx} cy={ey} rx={5.5} ry={4.5} fill="white" />
        <ellipse cx={rx} cy={ey} rx={5.5} ry={4.5} fill="white" />
        <ellipse cx={lx + 0.5} cy={ey + 0.3} rx={3} ry={3.5} fill={color} />
        <ellipse cx={rx - 0.5} cy={ey + 0.3} rx={3} ry={3.5} fill={color} />
        <circle cx={lx + 1.5} cy={ey - 1} r={1.2} fill="white" />
        <circle cx={rx - 1.5} cy={ey - 1} r={1.2} fill="white" />
        <path d={`M${lx - 5.5},${ey - 2} Q${lx},${ey - 6} ${lx + 6},${ey - 4}`} fill="none" stroke="#3A3A4A" strokeWidth="1.2" />
        <path d={`M${rx - 6},${ey - 4} Q${rx},${ey - 6} ${rx + 5.5},${ey - 2}`} fill="none" stroke="#3A3A4A" strokeWidth="1.2" />
      </>);
    case 3: // 細め
      return (<>
        <ellipse cx={lx} cy={ey} rx={5.5} ry={3} fill="white" />
        <ellipse cx={rx} cy={ey} rx={5.5} ry={3} fill="white" />
        <ellipse cx={lx} cy={ey + 0.3} rx={2.8} ry={2.5} fill={color} />
        <ellipse cx={rx} cy={ey + 0.3} rx={2.8} ry={2.5} fill={color} />
        <circle cx={lx + 1} cy={ey - 0.5} r={1} fill="white" />
        <circle cx={rx - 1} cy={ey - 0.5} r={1} fill="white" />
      </>);
    case 4: // キラキラ
      return (<>
        <ellipse cx={lx} cy={ey} rx={6} ry={6.5} fill="white" />
        <ellipse cx={rx} cy={ey} rx={6} ry={6.5} fill="white" />
        <ellipse cx={lx + 0.5} cy={ey + 0.5} rx={4} ry={4.5} fill={color} />
        <ellipse cx={rx - 0.5} cy={ey + 0.5} rx={4} ry={4.5} fill={color} />
        <circle cx={lx + 2} cy={ey - 1.5} r={2} fill="white" />
        <circle cx={rx - 2} cy={ey - 1.5} r={2} fill="white" />
        <circle cx={lx - 1} cy={ey + 2} r={0.8} fill="white" />
        <circle cx={rx + 1} cy={ey + 2} r={0.8} fill="white" />
      </>);
    case 5: // ジト目
      return (<>
        <path d={`M${lx - 5},${ey} Q${lx},${ey - 2} ${lx + 5},${ey}`} fill="none" stroke="#3A3A4A" strokeWidth="2" strokeLinecap="round" />
        <path d={`M${rx - 5},${ey} Q${rx},${ey - 2} ${rx + 5},${ey}`} fill="none" stroke="#3A3A4A" strokeWidth="2" strokeLinecap="round" />
        <circle cx={lx} cy={ey + 0.5} r={2} fill={color} />
        <circle cx={rx} cy={ey + 0.5} r={2} fill={color} />
      </>);
    case 6: // 半目
      return (<>
        <ellipse cx={lx} cy={ey + 1} rx={4.5} ry={3} fill="white" />
        <ellipse cx={rx} cy={ey + 1} rx={4.5} ry={3} fill="white" />
        <ellipse cx={lx} cy={ey + 1.5} rx={3} ry={2.5} fill={color} />
        <ellipse cx={rx} cy={ey + 1.5} rx={3} ry={2.5} fill={color} />
        <path d={`M${lx - 5},${ey - 1} Q${lx},${ey - 2} ${lx + 5},${ey}`} fill="none" stroke="#3A3A4A" strokeWidth="1.5" />
        <path d={`M${rx - 5},${ey} Q${rx},${ey - 2} ${rx + 5},${ey - 1}`} fill="none" stroke="#3A3A4A" strokeWidth="1.5" />
        <circle cx={lx + 1} cy={ey} r={0.8} fill="white" />
        <circle cx={rx - 1} cy={ey} r={0.8} fill="white" />
      </>);
    case 7: // にっこり
      return (<>
        <path d={`M${lx - 4},${ey + 1} Q${lx},${ey - 3} ${lx + 4},${ey + 1}`} fill="none" stroke="#3A3A4A" strokeWidth="2" strokeLinecap="round" />
        <path d={`M${rx - 4},${ey + 1} Q${rx},${ey - 3} ${rx + 4},${ey + 1}`} fill="none" stroke="#3A3A4A" strokeWidth="2" strokeLinecap="round" />
      </>);
    case 8: // 爽やか — bright open eyes, slightly wider
      return (<>
        <ellipse cx={lx} cy={ey} rx={5.5} ry={6} fill="white" />
        <ellipse cx={rx} cy={ey} rx={5.5} ry={6} fill="white" />
        <ellipse cx={lx + 0.3} cy={ey + 0.3} rx={3.2} ry={3.8} fill={color} />
        <ellipse cx={rx - 0.3} cy={ey + 0.3} rx={3.2} ry={3.8} fill={color} />
        <circle cx={lx + 1.5} cy={ey - 1.5} r={1.5} fill="white" />
        <circle cx={rx - 1.5} cy={ey - 1.5} r={1.5} fill="white" />
        <circle cx={lx - 0.5} cy={ey + 1.5} r={0.6} fill="white" />
        <circle cx={rx + 0.5} cy={ey + 1.5} r={0.6} fill="white" />
        <path d={`M${lx - 5},${ey - 5} Q${lx},${ey - 7} ${lx + 5.5},${ey - 5}`} fill="none" stroke="#3A3A4A" strokeWidth="0.8" />
        <path d={`M${rx - 5.5},${ey - 5} Q${rx},${ey - 7} ${rx + 5},${ey - 5}`} fill="none" stroke="#3A3A4A" strokeWidth="0.8" />
      </>);
    case 9: // ゆるい — relaxed droopy, soft
      return (<>
        <ellipse cx={lx} cy={ey + 1} rx={5} ry={4.5} fill="white" />
        <ellipse cx={rx} cy={ey + 1} rx={5} ry={4.5} fill="white" />
        <ellipse cx={lx + 0.5} cy={ey + 1.5} rx={3} ry={3.2} fill={color} />
        <ellipse cx={rx - 0.5} cy={ey + 1.5} rx={3} ry={3.2} fill={color} />
        <circle cx={lx + 1} cy={ey + 0.5} r={1} fill="white" />
        <circle cx={rx - 1} cy={ey + 0.5} r={1} fill="white" />
        <path d={`M${lx - 5},${ey - 2.5} Q${lx},${ey - 4} ${lx + 5},${ey - 1.5}`} fill="none" stroke="#5A5A6A" strokeWidth="1" strokeLinecap="round" />
        <path d={`M${rx - 5},${ey - 1.5} Q${rx},${ey - 4} ${rx + 5},${ey - 2.5}`} fill="none" stroke="#5A5A6A" strokeWidth="1" strokeLinecap="round" />
      </>);
    default:
      return renderEyes(0, color, a);
  }
}

function renderBrows(type: number, a: Anchors) {
  const by = a.browLine;
  const lx = a.headCx - a.eyeSpacing;
  const rx = a.headCx + a.eyeSpacing;

  switch (type) {
    case 0: // ナチュラル
      return (<>
        <path d={`M${lx - 4},${by} Q${lx},${by - 2} ${lx + 4},${by}`} fill="none" stroke="#4A4A5A" strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M${rx - 4},${by} Q${rx},${by - 2} ${rx + 4},${by}`} fill="none" stroke="#4A4A5A" strokeWidth="1.2" strokeLinecap="round" />
      </>);
    case 1: // 平行
      return (<>
        <line x1={lx - 4} y1={by} x2={lx + 4} y2={by} stroke="#4A4A5A" strokeWidth="1.3" strokeLinecap="round" />
        <line x1={rx - 4} y1={by} x2={rx + 4} y2={by} stroke="#4A4A5A" strokeWidth="1.3" strokeLinecap="round" />
      </>);
    case 2: // 困り
      return (<>
        <path d={`M${lx - 4},${by - 1.5} Q${lx},${by + 1} ${lx + 4},${by}`} fill="none" stroke="#4A4A5A" strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M${rx - 4},${by} Q${rx},${by + 1} ${rx + 4},${by - 1.5}`} fill="none" stroke="#4A4A5A" strokeWidth="1.2" strokeLinecap="round" />
      </>);
    case 3: // キリッ
      return (<>
        <path d={`M${lx - 4},${by + 1} Q${lx},${by - 2.5} ${lx + 5},${by - 1}`} fill="none" stroke="#4A4A5A" strokeWidth="1.5" strokeLinecap="round" />
        <path d={`M${rx - 5},${by - 1} Q${rx},${by - 2.5} ${rx + 4},${by + 1}`} fill="none" stroke="#4A4A5A" strokeWidth="1.5" strokeLinecap="round" />
      </>);
    case 4: // 太め
      return (<>
        <path d={`M${lx - 4},${by} Q${lx},${by - 2} ${lx + 4},${by}`} fill="none" stroke="#3A3A4A" strokeWidth="2.2" strokeLinecap="round" />
        <path d={`M${rx - 4},${by} Q${rx},${by - 2} ${rx + 4},${by}`} fill="none" stroke="#3A3A4A" strokeWidth="2.2" strokeLinecap="round" />
      </>);
    case 5: // 薄め
      return (<>
        <path d={`M${lx - 3},${by} Q${lx},${by - 1} ${lx + 3},${by}`} fill="none" stroke="#8A8A9A" strokeWidth="0.8" strokeLinecap="round" />
        <path d={`M${rx - 3},${by} Q${rx},${by - 1} ${rx + 3},${by}`} fill="none" stroke="#8A8A9A" strokeWidth="0.8" strokeLinecap="round" />
      </>);
    case 6: // アーチ — elegant arch
      return (<>
        <path d={`M${lx - 4},${by + 0.5} Q${lx - 2},${by - 3} ${lx + 4},${by - 1}`} fill="none" stroke="#4A4A5A" strokeWidth="1.1" strokeLinecap="round" />
        <path d={`M${rx - 4},${by - 1} Q${rx + 2},${by - 3} ${rx + 4},${by + 0.5}`} fill="none" stroke="#4A4A5A" strokeWidth="1.1" strokeLinecap="round" />
      </>);
    case 7: // しっかり — thick natural
      return (<>
        <path d={`M${lx - 5},${by + 0.5} Q${lx},${by - 2.5} ${lx + 5},${by}`} fill="none" stroke="#3A3A4A" strokeWidth="1.8" strokeLinecap="round" />
        <path d={`M${rx - 5},${by} Q${rx},${by - 2.5} ${rx + 5},${by + 0.5}`} fill="none" stroke="#3A3A4A" strokeWidth="1.8" strokeLinecap="round" />
      </>);
    default:
      return renderBrows(0, a);
  }
}

function renderMouth(type: number, a: Anchors) {
  const my = a.mouthLine;
  const cx = a.headCx;

  switch (type) {
    case 0: // 微笑み
      return <path d={`M${cx - 3},${my} Q${cx},${my + 2.5} ${cx + 3},${my}`} fill="none" stroke="#C06060" strokeWidth="1.2" strokeLinecap="round" />;
    case 1: // にっこり
      return (<>
        <path d={`M${cx - 4},${my - 0.5} Q${cx},${my + 4} ${cx + 4},${my - 0.5}`} fill="none" stroke="#C06060" strokeWidth="1.3" strokeLinecap="round" />
        <path d={`M${cx - 3},${my + 1} Q${cx},${my + 3} ${cx + 3},${my + 1}`} fill="#E87070" opacity="0.3" />
      </>);
    case 2: // 真顔
      return <line x1={cx - 3} y1={my} x2={cx + 3} y2={my} stroke="#B06060" strokeWidth="1.2" strokeLinecap="round" />;
    case 3: // ちょい不満
      return <path d={`M${cx - 3},${my + 1} Q${cx},${my - 2} ${cx + 3},${my + 1}`} fill="none" stroke="#B06060" strokeWidth="1.2" strokeLinecap="round" />;
    case 4: // ニヤリ
      return <path d={`M${cx - 4},${my} Q${cx - 1},${my + 3} ${cx + 4},${my - 1}`} fill="none" stroke="#C06060" strokeWidth="1.3" strokeLinecap="round" />;
    case 5: // への字
      return <path d={`M${cx - 3},${my - 0.5} L${cx},${my + 1.5} L${cx + 3},${my - 0.5}`} fill="none" stroke="#B06060" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />;
    case 6: // ぽかん
      return <ellipse cx={cx} cy={my + 1} rx={2.5} ry={3} fill="#C06060" opacity="0.7" />;
    case 7: // にー
      return (<>
        <path d={`M${cx - 5},${my - 0.5} Q${cx},${my + 5} ${cx + 5},${my - 0.5}`} fill="#E87070" opacity="0.25" />
        <path d={`M${cx - 5},${my - 0.5} Q${cx},${my + 5} ${cx + 5},${my - 0.5}`} fill="none" stroke="#C06060" strokeWidth="1.2" strokeLinecap="round" />
      </>);
    default:
      return renderMouth(0, a);
  }
}

function renderNose(type: number, a: Anchors, skin: string) {
  const ny = a.noseLine;
  const cx = a.headCx;
  switch (type) {
    case 0: // ちょん
      return <path d={`M${cx},${ny} L${cx + 1},${ny + 1.5}`} stroke={dk(skin, 18)} strokeWidth="1" strokeLinecap="round" />;
    case 1: // まるぽち
      return <circle cx={cx} cy={ny + 0.5} r={1.2} fill={dk(skin, 15)} />;
    case 2: // なし
      return null;
    default:
      return renderNose(0, a, skin);
  }
}

function renderCheeks(type: number, color: string, a: Anchors) {
  const cy = a.cheekLine;
  const dist = a.headRx * 0.6;
  const cx = a.headCx;

  switch (type) {
    case 0: // まるチーク
      return (<>
        <ellipse cx={cx - dist} cy={cy} rx={5} ry={3.5} fill={color} opacity="0.35" />
        <ellipse cx={cx + dist} cy={cy} rx={5} ry={3.5} fill={color} opacity="0.35" />
      </>);
    case 1: // ほんのり
      return (<>
        <ellipse cx={cx - dist} cy={cy} rx={4} ry={2.5} fill={color} opacity="0.2" />
        <ellipse cx={cx + dist} cy={cy} rx={4} ry={2.5} fill={color} opacity="0.2" />
      </>);
    case 2: // なし
      return null;
    case 3: // そばかす
      return (<>
        <circle cx={cx - dist - 2} cy={cy - 1} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx - dist} cy={cy} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx - dist + 2} cy={cy + 0.5} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx + dist - 2} cy={cy + 0.5} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx + dist} cy={cy} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx + dist + 2} cy={cy - 1} r={0.7} fill="#C8A882" opacity="0.5" />
      </>);
    default:
      return renderCheeks(0, color, a);
  }
}

/* ══════════════════════════════════════════════════════
   HAIR — back layer (behind head)
   Uses anchors for proper positioning
   ══════════════════════════════════════════════════════ */

function renderHairBack(style: number, color: string, colorD: string, a: Anchors) {
  const { headCx: hx, headCy: hy, headRx: rx } = a;

  switch (style) {
    case 6: // ロングストレート
      return (<>
        <path d={`M${hx - rx - 2},${hy - 5} Q${hx - rx - 4},${hy + 30} ${hx - rx + 5},${hy + 50}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 5} Q${hx + rx + 4},${hy + 30} ${hx + rx - 5},${hy + 50}`} fill={color} />
        <rect x={hx - rx - 3} y={hy + 10} width={rx * 2 + 6} height={42} rx={8} fill={color} />
      </>);
    case 7: // ロングウェーブ
      return (<>
        <path d={`M${hx - rx - 2},${hy - 5} Q${hx - rx - 6},${hy + 15} ${hx - rx},${hy + 30} Q${hx - rx - 6},${hy + 40} ${hx - rx + 3},${hy + 52}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 5} Q${hx + rx + 6},${hy + 15} ${hx + rx},${hy + 30} Q${hx + rx + 6},${hy + 40} ${hx + rx - 3},${hy + 52}`} fill={color} />
        <rect x={hx - rx - 3} y={hy + 10} width={rx * 2 + 6} height={44} rx={10} fill={color} />
      </>);
    case 8: // ツインテ
      return (<>
        <path d={`M${hx - rx + 2},${hy - 8} Q${hx - rx - 12},${hy + 10} ${hx - rx - 6},${hy + 45}`} fill={color} stroke={colorD} strokeWidth="0.5" />
        <path d={`M${hx + rx - 2},${hy - 8} Q${hx + rx + 12},${hy + 10} ${hx + rx + 6},${hy + 45}`} fill={color} stroke={colorD} strokeWidth="0.5" />
      </>);
    case 9: // ポニーテール
      return (
        <path d={`M${hx + 5},${hy - rx + 8} Q${hx + rx + 10},${hy - 5} ${hx + rx + 5},${hy + 35}`} fill={color} stroke={colorD} strokeWidth="0.5" />
      );
    case 10: // おだんご
      return (
        <circle cx={hx} cy={hy - rx - 5} r={9} fill={color} stroke={colorD} strokeWidth="0.5" />
      );
    case 12: // メンズさっぱり — neat short
      return null;
    case 13: // メンズ無造作 — messy textured
      return null;
    case 14: // ゆるウェーブボブ — loose wave bob
      return (<>
        <path d={`M${hx - rx - 3},${hy - 3} Q${hx - rx - 6},${hy + 12} ${hx - rx},${hy + 22} Q${hx - rx - 4},${hy + 28} ${hx - rx + 5},${hy + 24}`} fill={color} />
        <path d={`M${hx + rx + 3},${hy - 3} Q${hx + rx + 6},${hy + 12} ${hx + rx},${hy + 22} Q${hx + rx + 4},${hy + 28} ${hx + rx - 5},${hy + 24}`} fill={color} />
      </>);
    case 15: // 前髪なしロング — long swept back
      return (<>
        <path d={`M${hx - rx - 2},${hy - 5} Q${hx - rx - 4},${hy + 28} ${hx - rx + 4},${hy + 48}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 5} Q${hx + rx + 4},${hy + 28} ${hx + rx - 4},${hy + 48}`} fill={color} />
        <rect x={hx - rx - 3} y={hy + 8} width={rx * 2 + 6} height={40} rx={8} fill={color} />
      </>);
    case 16: // 中性ボブ — neutral bob
      return (<>
        <path d={`M${hx - rx - 3},${hy - 3} Q${hx - rx - 5},${hy + 8} ${hx - rx + 5},${hy + 16}`} fill={color} />
        <path d={`M${hx + rx + 3},${hy - 3} Q${hx + rx + 5},${hy + 8} ${hx + rx - 5},${hy + 16}`} fill={color} />
      </>);
    case 17: // 中性前髪長め — neutral long bangs
      return null;
    default:
      return null;
  }
}

/* ══════════════════════════════════════════════════════
   HAIR — cap layer (behind face, on top of head)
   Rendered BEFORE face features so eyes/mouth stay visible
   ══════════════════════════════════════════════════════ */

function renderHairCap(color: string, a: Anchors) {
  const { headCx: hx, headCy: hy, headRx: rx, headRy: ry } = a;
  // Covers crown of head only — stops above brow area so face skin shows correctly
  return <ellipse cx={hx} cy={hy - ry * 0.45} rx={rx + 2} ry={ry * 0.4} fill={color} />;
}

/* ══════════════════════════════════════════════════════
   HAIR — front layer (over face)
   Bangs and side strands only — cap is rendered separately
   ══════════════════════════════════════════════════════ */

function renderHairFront(style: number, color: string, colorD: string, colorH: string, a: Anchors) {
  const { headCx: hx, headCy: hy, headRx: rx, headRy: ry } = a;

  // Hair top curve — common to most styles, adapts to faceRx/faceRy
  const hairTop = (extraHeight = 8) => (
    <path d={`M${hx - rx - 3},${hy - 10} Q${hx},${hy - ry - extraHeight} ${hx + rx + 3},${hy - 10}`} fill={color} />
  );

  switch (style) {
    case 0: // メンズショート
      return (<>
        <path d={`M${hx - rx - 1},${hy - 10} Q${hx - 10},${hy - ry - 8} ${hx},${hy - ry - 4} Q${hx + 8},${hy - ry - 10} ${hx + rx + 1},${hy - 10}`} fill={color} />
        <path d={`M${hx - 8},${hy - ry - 2} L${hx - 5},${hy - ry - 7} L${hx - 2},${hy - ry - 3}`} fill={colorD} opacity="0.3" />
        <path d={`M${hx + 2},${hy - ry - 3} L${hx + 6},${hy - ry - 9} L${hx + 10},${hy - ry - 2}`} fill={colorD} opacity="0.3" />
        <rect x={hx - rx - 1} y={hy - 10} width={5} height={14} rx={2} fill={color} />
        <rect x={hx + rx - 4} y={hy - 10} width={5} height={14} rx={2} fill={color} />
      </>);
    case 1: // メンズマッシュ
      return (<>
        <path d={`M${hx - rx - 2},${hy - 5} Q${hx - rx + 5},${hy - ry - 5} ${hx},${hy - ry - 6} Q${hx + rx - 5},${hy - ry - 5} ${hx + rx + 2},${hy - 5}`} fill={color} />
        {/* Heavy bangs — positioned relative to browLine */}
        <path d={`M${hx - rx},${hy - 8} Q${hx - 8},${a.browLine + 5} ${hx},${a.browLine + 6} Q${hx + 8},${a.browLine + 5} ${hx + rx},${hy - 8}`} fill={color} />
        <path d={`M${hx - 5},${hy - ry - 2} L${hx - 3},${a.browLine + 5}`} stroke={colorH} strokeWidth="0.6" opacity="0.4" />
        <path d={`M${hx + 5},${hy - ry - 2} L${hx + 3},${a.browLine + 5}`} stroke={colorH} strokeWidth="0.6" opacity="0.4" />
      </>);
    case 2: // メンズセンターパート
      return (<>
        <path d={`M${hx - rx - 2},${hy - 5} Q${hx - rx + 5},${hy - ry - 6} ${hx},${hy - ry - 8} Q${hx + rx - 5},${hy - ry - 6} ${hx + rx + 2},${hy - 5}`} fill={color} />
        <path d={`M${hx},${hy - ry - 5} Q${hx - 12},${hy - 8} ${hx - rx},${a.browLine + 4}`} fill={color} />
        <path d={`M${hx},${hy - ry - 5} Q${hx + 12},${hy - 8} ${hx + rx},${a.browLine + 4}`} fill={color} />
        <line x1={hx} y1={hy - ry - 5} x2={hx} y2={hy - ry + 3} stroke={colorD} strokeWidth="0.8" opacity="0.4" />
        <rect x={hx - rx - 1} y={hy - 8} width={5} height={18} rx={2} fill={color} />
        <rect x={hx + rx - 4} y={hy - 8} width={5} height={18} rx={2} fill={color} />
      </>);
    case 3: // メンズ前髪重め
      return (<>
        <path d={`M${hx - rx - 1},${a.browLine + 4} Q${hx},${hy - ry - 10} ${hx + rx + 1},${a.browLine + 4}`} fill={color} />
        {/* Very heavy straight bangs — covers brows, positioned relative to eyeLine */}
        <rect x={hx - rx + 2} y={hy - 12} width={rx * 2 - 4} height={a.eyeLine - hy + 12} rx={4} fill={color} />
        <path d={`M${hx - rx + 2},${a.eyeLine} L${hx + rx - 2},${a.eyeLine}`} stroke={colorD} strokeWidth="0.5" opacity="0.3" />
      </>);
    case 4: // ボブ
      return (<>
        {hairTop()}
        <path d={`M${hx - rx - 3},${hy - 10} Q${hx - rx - 5},${hy + 10} ${hx - rx + 8},${hy + 18}`} fill={color} />
        <path d={`M${hx + rx + 3},${hy - 10} Q${hx + rx + 5},${hy + 10} ${hx + rx - 8},${hy + 18}`} fill={color} />
        <path d={`M${hx - rx + 3},${a.browLine + 1} Q${hx},${a.browLine + 5} ${hx + rx - 3},${a.browLine + 1}`} fill={color} />
        <path d={`M${hx - 6},${a.browLine + 2} L${hx - 4},${a.browLine + 6}`} stroke={colorH} strokeWidth="0.5" opacity="0.3" />
      </>);
    case 5: // ミディアム
      return (<>
        {hairTop()}
        <path d={`M${hx - rx - 3},${hy - 10} Q${hx - rx - 6},${hy + 15} ${hx - rx + 3},${hy + 30}`} fill={color} />
        <path d={`M${hx + rx + 3},${hy - 10} Q${hx + rx + 6},${hy + 15} ${hx + rx - 3},${hy + 30}`} fill={color} />
        <path d={`M${hx - rx + 5},${a.browLine - 1} Q${hx - 3},${a.browLine + 4} ${hx + rx - 8},${a.browLine + 1}`} fill={color} />
      </>);
    case 6: // ロングストレート
      return (<>
        {hairTop()}
        <path d={`M${hx - rx + 3},${a.browLine + 1} Q${hx},${a.browLine + 6} ${hx + rx - 3},${a.browLine + 1}`} fill={color} />
        <path d={`M${hx - rx - 2},${hy - 8} L${hx - rx - 3},${hy + 20}`} stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d={`M${hx + rx + 2},${hy - 8} L${hx + rx + 3},${hy + 20}`} stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>);
    case 7: // ロングウェーブ
      return (<>
        {hairTop()}
        <path d={`M${hx - rx + 5},${a.browLine + 1} Q${hx - 3},${a.browLine + 6} ${hx + rx - 8},${a.browLine + 2}`} fill={color} />
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx - rx - 5},${hy + 5} ${hx - rx},${hy + 15} Q${hx - rx - 5},${hy + 25} ${hx - rx + 2},${hy + 32}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 8} Q${hx + rx + 5},${hy + 5} ${hx + rx},${hy + 15} Q${hx + rx + 5},${hy + 25} ${hx + rx - 2},${hy + 32}`} fill={color} />
      </>);
    case 8: // ツインテ
      return (<>
        <path d={`M${hx - rx - 2},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 2},${hy - 10}`} fill={color} />
        <path d={`M${hx - rx + 4},${a.browLine + 1} Q${hx},${a.browLine + 5} ${hx + rx - 4},${a.browLine + 1}`} fill={color} />
        <circle cx={hx - rx + 1} cy={hy - 10} r={3} fill="#FF8888" />
        <circle cx={hx + rx - 1} cy={hy - 10} r={3} fill="#FF8888" />
      </>);
    case 9: // ポニーテール
      return (<>
        <path d={`M${hx - rx - 2},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 2},${hy - 10}`} fill={color} />
        <path d={`M${hx - rx + 5},${a.browLine} Q${hx - 2},${a.browLine + 5} ${hx + rx - 5},${a.browLine + 2}`} fill={color} />
        <circle cx={hx + 8} cy={hy - rx - 2} r={2.5} fill="#FF8888" />
        <rect x={hx - rx - 1} y={hy - 8} width={4} height={12} rx={2} fill={color} />
      </>);
    case 10: // おだんご
      return (<>
        <path d={`M${hx - rx - 2},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 2},${hy - 10}`} fill={color} />
        <path d={`M${hx - rx + 4},${a.browLine + 1} Q${hx},${a.browLine + 6} ${hx + rx - 4},${a.browLine + 1}`} fill={color} />
        <circle cx={hx + 2} cy={hy - rx - 5} r={3} fill={colorH} opacity="0.3" />
        <rect x={hx - rx - 1} y={hy - 8} width={4} height={10} rx={2} fill={color} />
        <rect x={hx + rx - 3} y={hy - 8} width={4} height={10} rx={2} fill={color} />
      </>);
    case 11: // 中性ショート
      return (<>
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx},${hy - ry - 7} ${hx + rx + 2},${hy - 8}`} fill={color} />
        <path d={`M${hx - rx + 2},${a.browLine + 1} Q${hx - 5},${a.browLine + 7} ${hx + 2},${a.browLine + 4} Q${hx + 8},${a.browLine + 6} ${hx + rx - 2},${a.browLine + 2}`} fill={color} />
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx - rx - 3},${hy + 3} ${hx - rx + 5},${hy + 10}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 8} Q${hx + rx + 3},${hy + 3} ${hx + rx - 5},${hy + 10}`} fill={color} />
      </>);
    case 12: // メンズさっぱり — clean neat short
      return (<>
        {cap}
        <path d={`M${hx - rx - 1},${hy - 8} Q${hx},${hy - ry - 6} ${hx + rx + 1},${hy - 8}`} fill={color} />
        {/* Very short sides */}
        <rect x={hx - rx - 1} y={hy - 8} width={4} height={10} rx={2} fill={color} />
        <rect x={hx + rx - 3} y={hy - 8} width={4} height={10} rx={2} fill={color} />
        {/* Subtle top texture */}
        <path d={`M${hx - 5},${hy - ry - 2} L${hx - 3},${hy - ry - 5}`} stroke={colorD} strokeWidth="0.5" opacity="0.3" />
        <path d={`M${hx + 3},${hy - ry - 2} L${hx + 5},${hy - ry - 5}`} stroke={colorD} strokeWidth="0.5" opacity="0.3" />
      </>);
    case 13: // メンズ無造作 — messy textured
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx - 5},${hy - ry - 10} ${hx},${hy - ry - 8} Q${hx + 5},${hy - ry - 12} ${hx + rx + 2},${hy - 8}`} fill={color} />
        {/* Spiky bits */}
        <path d={`M${hx - 8},${hy - ry - 3} L${hx - 10},${hy - ry - 10} L${hx - 4},${hy - ry - 5}`} fill={color} />
        <path d={`M${hx - 2},${hy - ry - 4} L${hx},${hy - ry - 12} L${hx + 3},${hy - ry - 5}`} fill={color} />
        <path d={`M${hx + 5},${hy - ry - 3} L${hx + 9},${hy - ry - 11} L${hx + 11},${hy - ry - 4}`} fill={color} />
        {/* Messy bangs */}
        <path d={`M${hx - rx + 2},${a.browLine - 1} Q${hx - 6},${a.browLine + 5} ${hx - 2},${a.browLine + 3} L${hx + 3},${a.browLine + 1} Q${hx + 8},${a.browLine + 4} ${hx + rx - 2},${a.browLine - 1}`} fill={color} />
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx - rx - 3},${hy + 2} ${hx - rx + 4},${hy + 8}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 8} Q${hx + rx + 3},${hy + 2} ${hx + rx - 4},${hy + 8}`} fill={color} />
        <path d={`M${hx - 3},${hy - ry - 5} L${hx - 1},${a.browLine + 3}`} stroke={colorH} strokeWidth="0.5" opacity="0.35" />
      </>);
    case 14: // ゆるウェーブボブ — loose wave bob
      return (<>
        {cap}
        {hairTop()}
        <path d={`M${hx - rx + 3},${a.browLine + 1} Q${hx - 4},${a.browLine + 5} ${hx + rx - 5},${a.browLine + 2}`} fill={color} />
        {/* Wavy sides */}
        <path d={`M${hx - rx - 3},${hy - 8} Q${hx - rx - 5},${hy + 5} ${hx - rx - 2},${hy + 12} Q${hx - rx - 5},${hy + 18} ${hx - rx + 3},${hy + 22}`} fill={color} />
        <path d={`M${hx + rx + 3},${hy - 8} Q${hx + rx + 5},${hy + 5} ${hx + rx + 2},${hy + 12} Q${hx + rx + 5},${hy + 18} ${hx + rx - 3},${hy + 22}`} fill={color} />
        <path d={`M${hx - rx - 1},${hy + 10} Q${hx - rx - 3},${hy + 12} ${hx - rx},${hy + 14}`} stroke={colorH} strokeWidth="0.5" opacity="0.3" />
        <path d={`M${hx + rx + 1},${hy + 10} Q${hx + rx + 3},${hy + 12} ${hx + rx},${hy + 14}`} stroke={colorH} strokeWidth="0.5" opacity="0.3" />
      </>);
    case 15: // 前髪なしロング — long no bangs
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 2},${hy - 10}`} fill={color} />
        {/* No bangs — forehead visible, hair swept to sides */}
        <path d={`M${hx - rx},${hy - ry * 0.1} Q${hx - rx - 3},${hy - 4} ${hx - rx - 2},${hy - 10}`} fill={color} />
        <path d={`M${hx + rx},${hy - ry * 0.1} Q${hx + rx + 3},${hy - 4} ${hx + rx + 2},${hy - 10}`} fill={color} />
        {/* Side hair flowing down */}
        <path d={`M${hx - rx - 2},${hy - 8} L${hx - rx - 3},${hy + 20}`} stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d={`M${hx + rx + 2},${hy - 8} L${hx + rx + 3},${hy + 20}`} stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>);
    case 16: // 中性ボブ — neutral bob, slightly asymmetric
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx},${hy - ry - 7} ${hx + rx + 2},${hy - 8}`} fill={color} />
        {/* Asymmetric bangs — longer on left */}
        <path d={`M${hx - rx + 1},${a.browLine + 3} Q${hx - 5},${a.browLine + 7} ${hx + 2},${a.browLine + 5} Q${hx + 8},${a.browLine + 3} ${hx + rx - 1},${a.browLine}`} fill={color} />
        {/* Bob sides — left slightly longer */}
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx - rx - 4},${hy + 8} ${hx - rx + 6},${hy + 18}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 8} Q${hx + rx + 4},${hy + 6} ${hx + rx - 6},${hy + 14}`} fill={color} />
        <path d={`M${hx - 4},${a.browLine + 4} L${hx - 2},${a.browLine + 7}`} stroke={colorH} strokeWidth="0.5" opacity="0.3" />
      </>);
    case 17: // 中性前髪長め — neutral with long side-swept bangs
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx},${hy - ry - 7} ${hx + rx + 2},${hy - 8}`} fill={color} />
        {/* Long side-swept bangs covering one eye area */}
        <path d={`M${hx - rx},${hy - 10} Q${hx - 8},${a.eyeLine - 2} ${hx - 2},${a.eyeLine + 2} Q${hx + 5},${a.browLine + 2} ${hx + rx},${a.browLine - 1}`} fill={color} />
        {/* Medium length sides */}
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx - rx - 4},${hy + 5} ${hx - rx + 3},${hy + 15}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 8} Q${hx + rx + 4},${hy + 5} ${hx + rx - 3},${hy + 15}`} fill={color} />
        <path d={`M${hx - 6},${a.browLine} L${hx - 4},${a.eyeLine}`} stroke={colorH} strokeWidth="0.6" opacity="0.35" />
      </>);
    default:
      return renderHairFront(0, color, colorD, colorH, a);
  }
}

/* ══════════════════════════════════════════════════════
   ARMS — properly anchored to shoulder
   ══════════════════════════════════════════════════════ */

function renderArms(skin: string, topColor: string, a: Anchors) {
  const shoulderL = a.headCx - a.shoulderHW;
  const shoulderR = a.headCx + a.shoulderHW;
  const sy = a.shoulderLine + 4;
  const handY = sy + 20;

  return (<>
    {/* Left arm */}
    <path d={`M${shoulderL},${sy} Q${shoulderL - 8},${sy + 10} ${shoulderL - 6},${handY}`} fill="none" stroke={skin} strokeWidth="6" strokeLinecap="round" />
    <circle cx={shoulderL - 6} cy={handY} r={3.5} fill={skin} />
    <path d={`M${shoulderL},${sy} Q${shoulderL - 4},${sy + 4} ${shoulderL - 3},${sy + 7}`} fill="none" stroke={topColor} strokeWidth="6.5" strokeLinecap="round" />
    {/* Right arm */}
    <path d={`M${shoulderR},${sy} Q${shoulderR + 8},${sy + 10} ${shoulderR + 6},${handY}`} fill="none" stroke={skin} strokeWidth="6" strokeLinecap="round" />
    <circle cx={shoulderR + 6} cy={handY} r={3.5} fill={skin} />
    <path d={`M${shoulderR},${sy} Q${shoulderR + 4},${sy + 4} ${shoulderR + 3},${sy + 7}`} fill="none" stroke={topColor} strokeWidth="6.5" strokeLinecap="round" />
  </>);
}

/* ══════════════════════════════════════════════════════
   CLOTHING — Top (anchored to body coordinates)
   ══════════════════════════════════════════════════════ */

function renderTop(type: number, color: string, colorD: string, skin: string, _skinD: string, a: Anchors) {
  const ty = a.bodyTop;
  const by = a.bodyBottom;
  const cx = a.headCx;
  const hw = a.shoulderHW; // half-width from anchors

  const left = cx - hw;
  const right = cx + hw;

  // Base torso shape
  const base = <path d={`M${left},${ty + 6} Q${left},${ty} ${left + 9},${ty - 2} L${right - 9},${ty - 2} Q${right},${ty} ${right},${ty + 6} L${right + 2},${by} Q${right + 2},${by + 3} ${right - 2},${by + 3} L${left + 2},${by + 3} Q${left - 2},${by + 3} ${left - 2},${by} Z`} fill={color} />;
  const neckline = (d: string) => <path d={d} fill={skin} />;

  // Neckline coordinates
  const nl = cx - 8;
  const nr = cx + 8;
  const nTopY = ty - 2;

  switch (type) {
    case 0: // Tシャツ
      return (<>{base}{neckline(`M${nl},${nTopY} Q${cx},${nTopY + 4} ${nr},${nTopY}`)}</>);
    case 1: // ボーダーT
      return (<>
        {base}
        {neckline(`M${nl},${nTopY} Q${cx},${nTopY + 4} ${nr},${nTopY}`)}
        {[0.2, 0.4, 0.6, 0.8].map(p => {
          const y = ty + (by - ty) * p;
          return <line key={p} x1={left} y1={y} x2={right} y2={y} stroke={colorD} strokeWidth="2" opacity="0.35" />;
        })}
      </>);
    case 2: // シャツ
      return (<>
        {base}
        <path d={`M${nl},${nTopY} L${cx - 4},${ty + 4} L${cx},${ty} L${cx + 4},${ty + 4} L${nr},${nTopY}`} fill="white" stroke={colorD} strokeWidth="0.5" />
        <line x1={cx} y1={ty + 2} x2={cx} y2={by} stroke={colorD} strokeWidth="0.5" opacity="0.4" />
        {[0.3, 0.5, 0.7].map(p => {
          const y = ty + (by - ty) * p;
          return <circle key={p} cx={cx} cy={y} r={1} fill={colorD} opacity="0.3" />;
        })}
      </>);
    case 3: // パーカー
      return (<>
        {base}
        <path d={`M${left + 9},${nTopY} Q${cx},${nTopY - 8} ${right - 9},${nTopY}`} fill={colorD} />
        {neckline(`M${nl},${nTopY} Q${cx},${nTopY + 5} ${nr},${nTopY}`)}
        <line x1={cx - 3} y1={nTopY + 2} x2={cx - 4} y2={ty + 10} stroke={colorD} strokeWidth="0.5" opacity="0.4" />
        <line x1={cx + 3} y1={nTopY + 2} x2={cx + 4} y2={ty + 10} stroke={colorD} strokeWidth="0.5" opacity="0.4" />
        <path d={`M${left + 10},${by - 10} L${right - 10},${by - 10} L${right - 10},${by} Q${cx},${by + 2} ${left + 10},${by} Z`} fill={colorD} opacity="0.15" />
      </>);
    case 4: // トレーナー
      return (<>
        {base}
        {neckline(`M${nl},${nTopY} Q${cx},${nTopY + 5} ${nr},${nTopY}`)}
        <path d={`M${nl - 2},${nTopY} Q${cx},${nTopY + 2} ${nr + 2},${nTopY} L${nr + 2},${nTopY + 2} Q${cx},${nTopY + 4} ${nl - 2},${nTopY + 2} Z`} fill={colorD} opacity="0.2" />
      </>);
    case 5: // ニット
      return (<>
        {base}
        {neckline(`M${nl},${nTopY} Q${cx},${nTopY + 5} ${nr},${nTopY}`)}
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(p => {
          const y = ty + (by - ty) * p;
          return <path key={p} d={`M${left},${y} Q${left + hw * 0.5},${y + 2} ${cx},${y} Q${cx + hw * 0.5},${y - 2} ${right},${y}`} fill="none" stroke={colorD} strokeWidth="0.5" opacity="0.2" />;
        })}
      </>);
    case 6: // カーディガン
      return (<>
        {base}
        <path d={`M${nl - 2},${nTopY + 2} Q${cx},${nTopY + 4} ${nr + 2},${nTopY + 2} L${nr + 2},${by} L${nl - 2},${by} Z`} fill="white" opacity="0.3" />
        <line x1={cx} y1={nTopY + 2} x2={cx} y2={by + 2} stroke={colorD} strokeWidth="1" opacity="0.3" />
        {[0.2, 0.5, 0.8].map(p => {
          const y = ty + (by - ty) * p;
          return <circle key={p} cx={cx - 2} cy={y} r={1.2} fill={colorD} opacity="0.3" />;
        })}
      </>);
    case 7: // ブラウス
      return (<>
        {base}
        <path d={`M${nl - 2},${nTopY} Q${cx - 6},${nTopY + 4} ${cx},${nTopY + 6} Q${cx + 6},${nTopY + 4} ${nr + 2},${nTopY}`} fill="white" stroke={colorD} strokeWidth="0.3" />
        <path d={`M${cx - 6},${nTopY + 4} Q${cx - 3},${nTopY + 7} ${cx},${nTopY + 4} Q${cx + 3},${nTopY + 7} ${cx + 6},${nTopY + 4}`} fill="none" stroke="white" strokeWidth="0.8" opacity="0.5" />
      </>);
    case 8: // ベスト
      return (<>
        <path d={`M${left + 4},${ty + 6} Q${left + 4},${ty} ${left + 12},${nTopY} L${right - 12},${nTopY} Q${right - 4},${ty} ${right - 4},${ty + 6} L${right - 2},${by} Q${right - 2},${by + 3} ${right - 6},${by + 3} L${left + 6},${by + 3} Q${left + 2},${by + 3} ${left + 2},${by} Z`} fill={color} />
        <rect x={left - 2} y={ty} width={8} height={12} rx={3} fill={skin} />
        <rect x={right - 6} y={ty} width={8} height={12} rx={3} fill={skin} />
        {neckline(`M${nl},${nTopY} Q${cx},${nTopY + 4} ${nr},${nTopY}`)}
        <line x1={cx} y1={nTopY + 2} x2={cx} y2={by} stroke={colorD} strokeWidth="0.5" opacity="0.3" />
      </>);
    case 9: // ジャケット
      return (<>
        {base}
        <path d={`M${nl},${nTopY} L${cx - 4},${ty + 6} L${cx},${ty + 2}`} fill={colorD} opacity="0.3" />
        <path d={`M${nr},${nTopY} L${cx + 4},${ty + 6} L${cx},${ty + 2}`} fill={colorD} opacity="0.3" />
        <line x1={cx} y1={ty + 2} x2={cx} y2={by + 2} stroke={colorD} strokeWidth="0.8" opacity="0.3" />
      </>);
    case 10: // ワンピース
      return (<>
        <path d={`M${left},${ty + 6} Q${left},${ty} ${left + 10},${nTopY} L${right - 10},${nTopY} Q${right},${ty} ${right},${ty + 6} L${right + 2},${by + 3} L${left - 2},${by + 3} Z`} fill={color} />
        {neckline(`M${nl},${nTopY} Q${cx},${nTopY + 4} ${nr},${nTopY}`)}
        <path d={`M${left + 2},${ty + (by - ty) * 0.5} Q${cx},${ty + (by - ty) * 0.6} ${right - 2},${ty + (by - ty) * 0.5}`} fill="none" stroke={colorD} strokeWidth="0.8" opacity="0.3" />
      </>);
    case 11: // セーラー
      return (<>
        {base}
        <path d={`M${left + 4},${nTopY} L${left + 4},${ty + 10} L${cx},${ty + 16} L${right - 4},${ty + 10} L${right - 4},${nTopY}`} fill="#3A3A6A" opacity="0.8" />
        <path d={`M${left + 4},${nTopY} L${left + 4},${ty + 10} L${cx},${ty + 16} L${right - 4},${ty + 10} L${right - 4},${nTopY}`} fill="none" stroke="white" strokeWidth="1.5" />
        <path d={`M${cx - 2},${nTopY + 2} L${cx},${nTopY + 12} L${cx + 2},${nTopY + 2}`} fill="#CC4444" />
      </>);
    default:
      return renderTop(0, color, colorD, skin, _skinD, a);
  }
}

/* ══════════════════════════════════════════════════════
   CLOTHING — Bottom (anchored to body coordinates)
   ══════════════════════════════════════════════════════ */

function renderBottom(type: number, color: string, colorD: string, skin: string, a: Anchors) {
  const by = a.bodyBottom;
  const fy = a.footBase;
  const cx = a.headCx;
  const hw = a.hipHW; // half-width from anchors
  const legInset = hw * 0.1; // gap between legs at center

  const ll = cx - hw; // left leg outer
  const lr = cx - legInset; // left leg inner
  const rl = cx + legInset; // right leg inner
  const rr = cx + hw; // right leg outer

  switch (type) {
    case 0: // スリムパンツ
      return <path d={`M${ll},${by} L${ll + 2},${fy} L${lr + 4},${fy} L${cx},${by + 6} L${rl - 4},${fy} L${rr - 2},${fy} L${rr},${by} Z`} fill={color} />;
    case 1: // ワイドパンツ
      return <path d={`M${ll - 2},${by} L${ll - 2},${fy} L${lr + 6},${fy} L${cx},${by + 6} L${rl - 6},${fy} L${rr + 2},${fy} L${rr + 2},${by} Z`} fill={color} />;
    case 2: // ハーフパンツ
      {
        const mid = by + (fy - by) * 0.6;
        return (<>
          <path d={`M${ll},${by} L${ll + 2},${mid} L${lr + 4},${mid} L${cx},${by + 5} L${rl - 4},${mid} L${rr - 2},${mid} L${rr},${by} Z`} fill={color} />
          <rect x={ll + 3} y={mid} width={9} height={fy - mid - 2} rx={3} fill={skin} />
          <rect x={rr - 12} y={mid} width={9} height={fy - mid - 2} rx={3} fill={skin} />
        </>);
      }
    case 3: // ショートパンツ
      {
        const mid = by + (fy - by) * 0.4;
        return (<>
          <path d={`M${ll},${by} L${ll + 4},${mid} L${lr + 6},${mid} L${cx},${by + 4} L${rl - 6},${mid} L${rr - 4},${mid} L${rr},${by} Z`} fill={color} />
          <rect x={ll + 5} y={mid} width={8} height={fy - mid - 2} rx={3} fill={skin} />
          <rect x={rr - 13} y={mid} width={8} height={fy - mid - 2} rx={3} fill={skin} />
        </>);
      }
    case 4: // ミニスカート
      {
        const skirtBottom = by + (fy - by) * 0.65;
        return (<>
          <path d={`M${ll - 4},${by} L${ll - 8},${skirtBottom} L${rr + 8},${skirtBottom} L${rr + 4},${by} Z`} fill={color} />
          <path d={`M${ll - 4},${by} L${ll - 8},${skirtBottom}`} stroke={colorD} strokeWidth="0.5" opacity="0.2" />
          <path d={`M${cx},${by} L${cx},${skirtBottom}`} stroke={colorD} strokeWidth="0.3" opacity="0.15" />
          <rect x={ll + 4} y={skirtBottom} width={7} height={fy - skirtBottom - 2} rx={3} fill={skin} />
          <rect x={rr - 11} y={skirtBottom} width={7} height={fy - skirtBottom - 2} rx={3} fill={skin} />
        </>);
      }
    case 5: // ロングスカート
      return (<>
        <path d={`M${ll - 4},${by} L${ll - 10},${fy + 2} L${rr + 10},${fy + 2} L${rr + 4},${by} Z`} fill={color} />
        <path d={`M${ll + 3},${by} L${ll},${fy + 2}`} stroke={colorD} strokeWidth="0.5" opacity="0.15" />
        <path d={`M${cx},${by} L${cx},${fy + 2}`} stroke={colorD} strokeWidth="0.5" opacity="0.15" />
        <path d={`M${rr - 3},${by} L${rr},${fy + 2}`} stroke={colorD} strokeWidth="0.5" opacity="0.15" />
      </>);
    case 6: // サロペット
      {
        const strapTop = a.bodyTop + 2;
        return (<>
          <path d={`M${ll},${by - 6} L${ll + 2},${fy} L${lr + 4},${fy} L${cx},${by} L${rl - 4},${fy} L${rr - 2},${fy} L${rr},${by - 6} Z`} fill={color} />
          <line x1={ll + 7} y1={by - 6} x2={ll + 10} y2={strapTop} stroke={color} strokeWidth="3" strokeLinecap="round" />
          <line x1={rr - 7} y1={by - 6} x2={rr - 10} y2={strapTop} stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx={ll + 10} cy={strapTop} r={1.5} fill={colorD} />
          <circle cx={rr - 10} cy={strapTop} r={1.5} fill={colorD} />
        </>);
      }
    case 7: // レギンス
      return (<>
        <path d={`M${ll},${by} L${ll + 2},${fy + 2} L${lr + 4},${fy + 2} L${cx},${by + 6} L${rl - 4},${fy + 2} L${rr - 2},${fy + 2} L${rr},${by} Z`} fill={color} />
        <path d={`M${ll + 6},${by + 4} L${ll + 4},${fy}`} stroke={colorD} strokeWidth="0.4" opacity="0.2" />
        <path d={`M${rr - 6},${by + 4} L${rr - 4},${fy}`} stroke={colorD} strokeWidth="0.4" opacity="0.2" />
      </>);
    default:
      return renderBottom(0, color, colorD, skin, a);
  }
}

/* ══════════════════════════════════════════════════════
   ACCESSORIES (anchored to head)
   ══════════════════════════════════════════════════════ */

function renderAccessory(type: number, a: Anchors) {
  const { headCx: hx, headCy: hy, headRx: rx, headRy: ry } = a;

  switch (type) {
    case 0: return null;
    case 1: // 丸メガネ
      return (<>
        <circle cx={hx - a.eyeSpacing} cy={a.eyeLine} r={6.5} fill="none" stroke="#4A4A5A" strokeWidth="1.2" />
        <circle cx={hx + a.eyeSpacing} cy={a.eyeLine} r={6.5} fill="none" stroke="#4A4A5A" strokeWidth="1.2" />
        <line x1={hx - a.eyeSpacing + 6.5} y1={a.eyeLine} x2={hx + a.eyeSpacing - 6.5} y2={a.eyeLine} stroke="#4A4A5A" strokeWidth="1" />
        <line x1={hx - a.eyeSpacing - 6.5} y1={a.eyeLine} x2={hx - rx + 2} y2={hy} stroke="#4A4A5A" strokeWidth="0.8" />
        <line x1={hx + a.eyeSpacing + 6.5} y1={a.eyeLine} x2={hx + rx - 2} y2={hy} stroke="#4A4A5A" strokeWidth="0.8" />
      </>);
    case 2: // 四角メガネ
      return (<>
        <rect x={hx - a.eyeSpacing - 6} y={a.eyeLine - 5} width={12} height={10} rx={2} fill="none" stroke="#3A3A4A" strokeWidth="1.3" />
        <rect x={hx + a.eyeSpacing - 6} y={a.eyeLine - 5} width={12} height={10} rx={2} fill="none" stroke="#3A3A4A" strokeWidth="1.3" />
        <line x1={hx - a.eyeSpacing + 6} y1={a.eyeLine} x2={hx + a.eyeSpacing - 6} y2={a.eyeLine} stroke="#3A3A4A" strokeWidth="1" />
        <line x1={hx - a.eyeSpacing - 6} y1={a.eyeLine - 1} x2={hx - rx + 2} y2={hy - 1} stroke="#3A3A4A" strokeWidth="0.8" />
        <line x1={hx + a.eyeSpacing + 6} y1={a.eyeLine - 1} x2={hx + rx - 2} y2={hy - 1} stroke="#3A3A4A" strokeWidth="0.8" />
      </>);
    case 3: // キャップ
      return (<>
        <ellipse cx={hx} cy={hy - ry * 0.45} rx={rx + 4} ry={ry * 0.35} fill="#4A6B8A" />
        <path d={`M${hx - rx - 5},${hy - ry * 0.3} Q${hx - rx - 10},${hy - ry * 0.15} ${hx - rx - 8},${hy - ry * 0.1}`} fill="#3A5A7A" />
        <ellipse cx={hx} cy={hy - ry * 0.3} rx={rx + 6} ry={3} fill="#3A5A7A" />
      </>);
    case 4: // ニット帽
      return (<>
        <path d={`M${hx - rx - 1},${hy - ry * 0.2} Q${hx - rx},${hy - ry - 10} ${hx},${hy - ry - 14} Q${hx + rx},${hy - ry - 10} ${hx + rx + 1},${hy - ry * 0.2}`} fill="#CC6666" />
        <circle cx={hx} cy={hy - ry - 14} r={4} fill="#DD8888" />
        <path d={`M${hx - rx},${hy - ry * 0.2} Q${hx},${hy - ry * 0.15} ${hx + rx},${hy - ry * 0.2}`} fill="none" stroke="#BB5555" strokeWidth="1.5" />
      </>);
    case 5: // ヘッドホン
      return (<>
        <path d={`M${hx - rx - 1},${hy - 2} Q${hx},${hy - ry - 12} ${hx + rx + 1},${hy - 2}`} fill="none" stroke="#4A4A5A" strokeWidth="2" />
        <ellipse cx={hx - rx} cy={hy + 1} rx={5} ry={7} fill="#4A4A5A" />
        <ellipse cx={hx + rx} cy={hy + 1} rx={5} ry={7} fill="#4A4A5A" />
        <ellipse cx={hx - rx} cy={hy + 1} rx={3} ry={5} fill="#5A5A6A" />
        <ellipse cx={hx + rx} cy={hy + 1} rx={3} ry={5} fill="#5A5A6A" />
      </>);
    case 6: // ピアス
      return (<>
        <circle cx={hx - rx + 2} cy={hy + 7} r={1.5} fill="#FFD700" />
        <circle cx={hx + rx - 2} cy={hy + 7} r={1.5} fill="#FFD700" />
      </>);
    case 7: // マフラー
      return (<>
        <path d={`M${hx - 16},${hy + ry - 5} Q${hx},${hy + ry + 2} ${hx + 16},${hy + ry - 5}`} fill="#CC6666" />
        <path d={`M${hx - 16},${hy + ry - 5} Q${hx},${hy + ry - 2} ${hx + 16},${hy + ry - 5}`} fill="#DD8888" />
        <rect x={hx - 4} y={hy + ry - 3} width={7} height={14} rx={2} fill="#CC6666" />
        <line x1={hx - 2} y1={hy + ry + 8} x2={hx + 1} y2={hy + ry + 8} stroke="#BB5555" strokeWidth="0.5" />
      </>);
    case 8: // リボン
      return (<>
        <path d={`M${hx - 2},${hy - ry - 2} Q${hx - 10},${hy - ry - 10} ${hx - 2},${hy - ry - 5}`} fill="#FF6B8A" />
        <path d={`M${hx + 2},${hy - ry - 2} Q${hx + 10},${hy - ry - 10} ${hx + 2},${hy - ry - 5}`} fill="#FF6B8A" />
        <circle cx={hx} cy={hy - ry - 3} r={2} fill="#FF4570" />
      </>);
    case 9: // ミニバッグ — small crossbody bag
      {
        const bagX = hx + rx + 8;
        const bagY = a.bodyBottom - 4;
        return (<>
          <line x1={hx - 5} y1={a.shoulderLine + 2} x2={bagX} y2={bagY} stroke="#8B7355" strokeWidth="1" />
          <rect x={bagX - 5} y={bagY - 3} width={10} height={8} rx={2} fill="#A0845C" />
          <rect x={bagX - 4} y={bagY - 1} width={3} height={1.5} rx={0.5} fill="#8B7355" />
        </>);
      }
    case 10: // イヤリング — drop earrings
      return (<>
        <line x1={hx - rx + 2} y1={hy + 5} x2={hx - rx + 1} y2={hy + 10} stroke="#D4AF37" strokeWidth="0.6" />
        <circle cx={hx - rx + 1} cy={hy + 11} r={2} fill="#D4AF37" />
        <line x1={hx + rx - 2} y1={hy + 5} x2={hx + rx - 1} y2={hy + 10} stroke="#D4AF37" strokeWidth="0.6" />
        <circle cx={hx + rx - 1} cy={hy + 11} r={2} fill="#D4AF37" />
      </>);
    default:
      return null;
  }
}
