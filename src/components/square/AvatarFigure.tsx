"use client";

import type { AvatarStyle } from "@/lib/demo-data";

/**
 * AvatarFigure — Pigg-style 2~2.5 head chibi avatar for SLOTY.
 *
 * Design direction:
 * - Ameba Pigg-inspired: big head, small body, cute & approachable
 * - 記号的な顔: eyes/brows/mouth as simple expressive shapes
 * - Silhouette-driven individuality: hair shape is the main differentiator
 * - Simple flat coloring with minimal shading
 * - SVG-based, part-separated for dress-up
 * - Quirky faces allowed (ジト目, への字 etc.)
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

  // ── Body type scaling ──
  const bodyScale = [1, 0.92, 0.95, 1.08][bodyType] ?? 1;
  const bodyWidth = [1, 0.9, 0.88, 1.12][bodyType] ?? 1;

  // ── ViewBox: 100x130 — head ~60% of height ──
  const vw = 100, vh = 130;
  // Head center
  const hx = 50, hy = 36;
  // Face shape radii
  const faceRx = [28, 26, 25, 23][faceShape] ?? 28;
  const faceRy = [30, 32, 28, 31][faceShape] ?? 30;

  const animClass = animate === "walk" ? "animate-avatar-walk" : animate === "idle" ? "animate-avatar-idle" : "";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vw} ${vh}`}
      className={`${animClass} ${className ?? ""}`}
      style={{ overflow: "visible" }}
    >
      {/* ══════ Ground shadow ══════ */}
      <ellipse cx={50} cy={127} rx={18 * bodyWidth} ry={3} fill="rgba(0,0,0,0.08)" />

      {/* ══════ BODY GROUP ══════ */}
      <g data-part="body" transform={`translate(${50 - 50 * bodyWidth},${80 - (bodyScale - 1) * 5}) scale(${bodyWidth},${bodyScale})`}>

        {/* ── Legs ── */}
        <g data-part="legs">
          {renderBottom(bottomType, bottomColor, botD, skin)}
          {/* Shoes */}
          <ellipse cx={38} cy={48} rx={6} ry={3} fill="#4A4A5A" />
          <ellipse cx={62} cy={48} rx={6} ry={3} fill="#4A4A5A" />
        </g>

        {/* ── Torso ── */}
        <g data-part="torso">
          {renderTop(topType, topColor, topD, skin, skinD)}
        </g>

        {/* ── Arms (simple) ── */}
        <g data-part="arms">
          {/* Left arm */}
          <path d={`M22,8 Q14,20 16,28`} fill="none" stroke={skin} strokeWidth="6" strokeLinecap="round" />
          <circle cx={16} cy={28} r={3.5} fill={skin} />
          {/* Sleeve hint */}
          <path d={`M22,8 Q18,12 19,15`} fill="none" stroke={topColor} strokeWidth="6.5" strokeLinecap="round" />
          {/* Right arm */}
          <path d={`M78,8 Q86,20 84,28`} fill="none" stroke={skin} strokeWidth="6" strokeLinecap="round" />
          <circle cx={84} cy={28} r={3.5} fill={skin} />
          <path d={`M78,8 Q82,12 81,15`} fill="none" stroke={topColor} strokeWidth="6.5" strokeLinecap="round" />
        </g>
      </g>

      {/* ══════ NECK ══════ */}
      <rect x={46} y={66} width={8} height={8} rx={3} fill={skin} />

      {/* ══════ HEAD GROUP ══════ */}
      <g data-part="head">
        {/* Back hair (behind head) */}
        {renderHairBack(hairStyle, hairColor, hairD, hx, hy, faceRx)}

        {/* Head shape */}
        <ellipse cx={hx} cy={hy} rx={faceRx} ry={faceRy} fill={skin} />
        {/* Subtle head shadow at bottom */}
        <ellipse cx={hx} cy={hy + faceRy * 0.7} rx={faceRx * 0.6} ry={4} fill={skinD} opacity={0.3} />

        {/* ── Ears ── */}
        <ellipse cx={hx - faceRx + 2} cy={hy + 2} rx={4} ry={5} fill={skin} />
        <ellipse cx={hx + faceRx - 2} cy={hy + 2} rx={4} ry={5} fill={skin} />
        <ellipse cx={hx - faceRx + 2} cy={hy + 2} rx={2.5} ry={3} fill={skinD} opacity={0.2} />
        <ellipse cx={hx + faceRx - 2} cy={hy + 2} rx={2.5} ry={3} fill={skinD} opacity={0.2} />

        {/* ══════ FACE ══════ */}
        <g data-part="face">
          {/* ── Eyebrows ── */}
          {renderBrows(browType, hx, hy)}

          {/* ── Eyes ── */}
          <g className="avatar-eyes">
            {renderEyes(eyeType, eyeColor, hx, hy)}
          </g>

          {/* ── Nose ── */}
          {renderNose(noseType, hx, hy, skin)}

          {/* ── Mouth ── */}
          {renderMouth(mouthType, hx, hy)}

          {/* ── Cheeks ── */}
          {renderCheeks(cheekType, cheekColor, hx, hy, faceRx)}
        </g>

        {/* ── Front hair (over face) ── */}
        {renderHairFront(hairStyle, hairColor, hairD, hairH, hx, hy, faceRx, faceRy)}

        {/* ── Accessories ── */}
        {renderAccessory(accessory, hx, hy, faceRx, faceRy, hairColor)}
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   FACE PARTS — 記号的、ピグ風
   ══════════════════════════════════════════════════════ */

function renderEyes(type: number, color: string, cx: number, cy: number) {
  const ex = 10; // eye offset from center
  const ey = cy + 2;
  const lx = cx - ex, rx = cx + ex;

  switch (type) {
    case 0: // まる — classic Pigg round eyes
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
        {/* droopy upper lid line */}
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
        {/* sharp upper lids */}
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
    case 4: // キラキラ — big sparkly Pigg eyes
      return (<>
        <ellipse cx={lx} cy={ey} rx={6} ry={6.5} fill="white" />
        <ellipse cx={rx} cy={ey} rx={6} ry={6.5} fill="white" />
        <ellipse cx={lx + 0.5} cy={ey + 0.5} rx={4} ry={4.5} fill={color} />
        <ellipse cx={rx - 0.5} cy={ey + 0.5} rx={4} ry={4.5} fill={color} />
        {/* Big highlight */}
        <circle cx={lx + 2} cy={ey - 1.5} r={2} fill="white" />
        <circle cx={rx - 2} cy={ey - 1.5} r={2} fill="white" />
        {/* Small secondary highlight */}
        <circle cx={lx - 1} cy={ey + 2} r={0.8} fill="white" />
        <circle cx={rx + 1} cy={ey + 2} r={0.8} fill="white" />
      </>);
    case 5: // ジト目 — skeptical flat eyes
      return (<>
        <path d={`M${lx - 5},${ey} Q${lx},${ey - 2} ${lx + 5},${ey}`} fill="none" stroke="#3A3A4A" strokeWidth="2" strokeLinecap="round" />
        <path d={`M${rx - 5},${ey} Q${rx},${ey - 2} ${rx + 5},${ey}`} fill="none" stroke="#3A3A4A" strokeWidth="2" strokeLinecap="round" />
        <circle cx={lx} cy={ey + 0.5} r={2} fill={color} />
        <circle cx={rx} cy={ey + 0.5} r={2} fill={color} />
      </>);
    case 6: // 半目 — sleepy half-closed
      return (<>
        <ellipse cx={lx} cy={ey + 1} rx={4.5} ry={3} fill="white" />
        <ellipse cx={rx} cy={ey + 1} rx={4.5} ry={3} fill="white" />
        <ellipse cx={lx} cy={ey + 1.5} rx={3} ry={2.5} fill={color} />
        <ellipse cx={rx} cy={ey + 1.5} rx={3} ry={2.5} fill={color} />
        {/* Heavy droopy lids */}
        <path d={`M${lx - 5},${ey - 1} Q${lx},${ey - 2} ${lx + 5},${ey}`} fill="none" stroke="#3A3A4A" strokeWidth="1.5" />
        <path d={`M${rx - 5},${ey} Q${rx},${ey - 2} ${rx + 5},${ey - 1}`} fill="none" stroke="#3A3A4A" strokeWidth="1.5" />
        <circle cx={lx + 1} cy={ey} r={0.8} fill="white" />
        <circle cx={rx - 1} cy={ey} r={0.8} fill="white" />
      </>);
    case 7: // にっこり — happy closed eyes
      return (<>
        <path d={`M${lx - 4},${ey + 1} Q${lx},${ey - 3} ${lx + 4},${ey + 1}`} fill="none" stroke="#3A3A4A" strokeWidth="2" strokeLinecap="round" />
        <path d={`M${rx - 4},${ey + 1} Q${rx},${ey - 3} ${rx + 4},${ey + 1}`} fill="none" stroke="#3A3A4A" strokeWidth="2" strokeLinecap="round" />
      </>);
    default:
      return renderEyes(0, color, cx, cy);
  }
}

function renderBrows(type: number, cx: number, cy: number) {
  const by = cy - 7;
  const lx = cx - 10, rx = cx + 10;

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
    default:
      return renderBrows(0, cx, cy);
  }
}

function renderMouth(type: number, cx: number, cy: number) {
  const my = cy + 12;

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
    case 6: // ぽかん — open O mouth
      return <ellipse cx={cx} cy={my + 1} rx={2.5} ry={3} fill="#C06060" opacity="0.7" />;
    case 7: // にー — big grin
      return (<>
        <path d={`M${cx - 5},${my - 0.5} Q${cx},${my + 5} ${cx + 5},${my - 0.5}`} fill="#E87070" opacity="0.25" />
        <path d={`M${cx - 5},${my - 0.5} Q${cx},${my + 5} ${cx + 5},${my - 0.5}`} fill="none" stroke="#C06060" strokeWidth="1.2" strokeLinecap="round" />
      </>);
    default:
      return renderMouth(0, cx, cy);
  }
}

function renderNose(type: number, cx: number, cy: number, skin: string) {
  const ny = cy + 7;
  switch (type) {
    case 0: // ちょん — tiny line
      return <path d={`M${cx},${ny} L${cx + 1},${ny + 1.5}`} stroke={dk(skin, 18)} strokeWidth="1" strokeLinecap="round" />;
    case 1: // まるぽち
      return <circle cx={cx} cy={ny + 0.5} r={1.2} fill={dk(skin, 15)} />;
    case 2: // なし
      return null;
    default:
      return renderNose(0, cx, cy, skin);
  }
}

function renderCheeks(type: number, color: string, cx: number, cy: number, faceRx: number) {
  const cy2 = cy + 7;
  const dist = faceRx * 0.6;

  switch (type) {
    case 0: // まるチーク — classic Pigg round blush
      return (<>
        <ellipse cx={cx - dist} cy={cy2} rx={5} ry={3.5} fill={color} opacity="0.35" />
        <ellipse cx={cx + dist} cy={cy2} rx={5} ry={3.5} fill={color} opacity="0.35" />
      </>);
    case 1: // ほんのり
      return (<>
        <ellipse cx={cx - dist} cy={cy2} rx={4} ry={2.5} fill={color} opacity="0.2" />
        <ellipse cx={cx + dist} cy={cy2} rx={4} ry={2.5} fill={color} opacity="0.2" />
      </>);
    case 2: // なし
      return null;
    case 3: // そばかす
      return (<>
        <circle cx={cx - dist - 2} cy={cy2 - 1} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx - dist} cy={cy2} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx - dist + 2} cy={cy2 + 0.5} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx + dist - 2} cy={cy2 + 0.5} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx + dist} cy={cy2} r={0.7} fill="#C8A882" opacity="0.5" />
        <circle cx={cx + dist + 2} cy={cy2 - 1} r={0.7} fill="#C8A882" opacity="0.5" />
      </>);
    default:
      return renderCheeks(0, color, cx, cy, faceRx);
  }
}

/* ══════════════════════════════════════════════════════
   HAIR — back layer (behind head)
   ══════════════════════════════════════════════════════ */

function renderHairBack(style: number, color: string, colorD: string, hx: number, hy: number, rx: number) {
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
    default:
      return null;
  }
}

/* ══════════════════════════════════════════════════════
   HAIR — front layer (over face)
   ══════════════════════════════════════════════════════ */

function renderHairFront(style: number, color: string, colorD: string, colorH: string, hx: number, hy: number, rx: number, ry: number) {
  // Common hair cap (top of head)
  const cap = (
    <ellipse cx={hx} cy={hy - ry * 0.3} rx={rx + 3} ry={ry * 0.55} fill={color} />
  );

  switch (style) {
    case 0: // メンズショート
      return (<>
        {cap}
        {/* Short spiky fringe */}
        <path d={`M${hx - rx - 1},${hy - 10} Q${hx - 10},${hy - ry - 8} ${hx},${hy - ry - 4} Q${hx + 8},${hy - ry - 10} ${hx + rx + 1},${hy - 10}`} fill={color} />
        {/* Subtle spikes */}
        <path d={`M${hx - 8},${hy - ry - 2} L${hx - 5},${hy - ry - 7} L${hx - 2},${hy - ry - 3}`} fill={colorD} opacity="0.3" />
        <path d={`M${hx + 2},${hy - ry - 3} L${hx + 6},${hy - ry - 9} L${hx + 10},${hy - ry - 2}`} fill={colorD} opacity="0.3" />
        {/* Side burns */}
        <rect x={hx - rx - 1} y={hy - 10} width={5} height={14} rx={2} fill={color} />
        <rect x={hx + rx - 4} y={hy - 10} width={5} height={14} rx={2} fill={color} />
      </>);
    case 1: // メンズマッシュ
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 5} Q${hx - rx + 5},${hy - ry - 5} ${hx},${hy - ry - 6} Q${hx + rx - 5},${hy - ry - 5} ${hx + rx + 2},${hy - 5}`} fill={color} />
        {/* Heavy bangs covering forehead */}
        <path d={`M${hx - rx},${hy - 8} Q${hx - 8},${hy - 2} ${hx},${hy - 1} Q${hx + 8},${hy - 2} ${hx + rx},${hy - 8}`} fill={color} />
        {/* Strand lines */}
        <path d={`M${hx - 5},${hy - ry - 2} L${hx - 3},${hy - 2}`} stroke={colorH} strokeWidth="0.6" opacity="0.4" />
        <path d={`M${hx + 5},${hy - ry - 2} L${hx + 3},${hy - 2}`} stroke={colorH} strokeWidth="0.6" opacity="0.4" />
      </>);
    case 2: // メンズセンターパート
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 5} Q${hx - rx + 5},${hy - ry - 6} ${hx},${hy - ry - 8} Q${hx + rx - 5},${hy - ry - 6} ${hx + rx + 2},${hy - 5}`} fill={color} />
        {/* Center part — split bangs */}
        <path d={`M${hx},${hy - ry - 5} Q${hx - 12},${hy - 8} ${hx - rx},${hy - 3}`} fill={color} />
        <path d={`M${hx},${hy - ry - 5} Q${hx + 12},${hy - 8} ${hx + rx},${hy - 3}`} fill={color} />
        {/* Part line */}
        <line x1={hx} y1={hy - ry - 5} x2={hx} y2={hy - ry + 3} stroke={colorD} strokeWidth="0.8" opacity="0.4" />
        <rect x={hx - rx - 1} y={hy - 8} width={5} height={18} rx={2} fill={color} />
        <rect x={hx + rx - 4} y={hy - 8} width={5} height={18} rx={2} fill={color} />
      </>);
    case 3: // メンズ前髪重め
      return (<>
        {cap}
        <path d={`M${hx - rx - 1},${hy - 3} Q${hx},${hy - ry - 10} ${hx + rx + 1},${hy - 3}`} fill={color} />
        {/* Very heavy straight bangs — covers brows */}
        <rect x={hx - rx + 2} y={hy - 12} width={rx * 2 - 4} height={14} rx={4} fill={color} />
        <path d={`M${hx - rx + 2},${hy + 2} L${hx + rx - 2},${hy + 2}`} stroke={colorD} strokeWidth="0.5" opacity="0.3" />
      </>);
    case 4: // ボブ
      return (<>
        {cap}
        <path d={`M${hx - rx - 3},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 3},${hy - 10}`} fill={color} />
        {/* Bob sides — rounded */}
        <path d={`M${hx - rx - 3},${hy - 10} Q${hx - rx - 5},${hy + 10} ${hx - rx + 8},${hy + 18}`} fill={color} />
        <path d={`M${hx + rx + 3},${hy - 10} Q${hx + rx + 5},${hy + 10} ${hx + rx - 8},${hy + 18}`} fill={color} />
        {/* Bangs */}
        <path d={`M${hx - rx + 3},${hy - 6} Q${hx},${hy - 2} ${hx + rx - 3},${hy - 6}`} fill={color} />
        <path d={`M${hx - 6},${hy - 5} L${hx - 4},${hy - 1}`} stroke={colorH} strokeWidth="0.5" opacity="0.3" />
      </>);
    case 5: // ミディアム
      return (<>
        {cap}
        <path d={`M${hx - rx - 3},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 3},${hy - 10}`} fill={color} />
        <path d={`M${hx - rx - 3},${hy - 10} Q${hx - rx - 6},${hy + 15} ${hx - rx + 3},${hy + 30}`} fill={color} />
        <path d={`M${hx + rx + 3},${hy - 10} Q${hx + rx + 6},${hy + 15} ${hx + rx - 3},${hy + 30}`} fill={color} />
        {/* Side-swept bangs */}
        <path d={`M${hx - rx + 5},${hy - 8} Q${hx - 3},${hy - 3} ${hx + rx - 8},${hy - 6}`} fill={color} />
      </>);
    case 6: // ロングストレート
      return (<>
        {cap}
        <path d={`M${hx - rx - 3},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 3},${hy - 10}`} fill={color} />
        {/* Straight bangs */}
        <path d={`M${hx - rx + 3},${hy - 6} Q${hx},${hy - 1} ${hx + rx - 3},${hy - 6}`} fill={color} />
        {/* Long side hair (continues from back) */}
        <path d={`M${hx - rx - 2},${hy - 8} L${hx - rx - 3},${hy + 20}`} stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d={`M${hx + rx + 2},${hy - 8} L${hx + rx + 3},${hy + 20}`} stroke={color} strokeWidth="5" strokeLinecap="round" />
      </>);
    case 7: // ロングウェーブ
      return (<>
        {cap}
        <path d={`M${hx - rx - 3},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 3},${hy - 10}`} fill={color} />
        {/* Wavy bangs */}
        <path d={`M${hx - rx + 5},${hy - 6} Q${hx - 3},${hy - 1} ${hx + rx - 8},${hy - 5}`} fill={color} />
        {/* Wavy side strands */}
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx - rx - 5},${hy + 5} ${hx - rx},${hy + 15} Q${hx - rx - 5},${hy + 25} ${hx - rx + 2},${hy + 32}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 8} Q${hx + rx + 5},${hy + 5} ${hx + rx},${hy + 15} Q${hx + rx + 5},${hy + 25} ${hx + rx - 2},${hy + 32}`} fill={color} />
      </>);
    case 8: // ツインテ
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 2},${hy - 10}`} fill={color} />
        {/* Bangs */}
        <path d={`M${hx - rx + 4},${hy - 6} Q${hx},${hy - 2} ${hx + rx - 4},${hy - 6}`} fill={color} />
        {/* Twin tail ties */}
        <circle cx={hx - rx + 1} cy={hy - 10} r={3} fill="#FF8888" />
        <circle cx={hx + rx - 1} cy={hy - 10} r={3} fill="#FF8888" />
      </>);
    case 9: // ポニーテール
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 2},${hy - 10}`} fill={color} />
        {/* Side-swept bangs */}
        <path d={`M${hx - rx + 5},${hy - 7} Q${hx - 2},${hy - 2} ${hx + rx - 5},${hy - 5}`} fill={color} />
        {/* Ponytail tie */}
        <circle cx={hx + 8} cy={hy - rx - 2} r={2.5} fill="#FF8888" />
        {/* Sideburns */}
        <rect x={hx - rx - 1} y={hy - 8} width={4} height={12} rx={2} fill={color} />
      </>);
    case 10: // おだんご
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 10} Q${hx},${hy - ry - 8} ${hx + rx + 2},${hy - 10}`} fill={color} />
        {/* Bangs */}
        <path d={`M${hx - rx + 4},${hy - 6} Q${hx},${hy - 1} ${hx + rx - 4},${hy - 6}`} fill={color} />
        {/* Bun highlight */}
        <circle cx={hx + 2} cy={hy - rx - 5} r={3} fill={colorH} opacity="0.3" />
        <rect x={hx - rx - 1} y={hy - 8} width={4} height={10} rx={2} fill={color} />
        <rect x={hx + rx - 3} y={hy - 8} width={4} height={10} rx={2} fill={color} />
      </>);
    case 11: // 中性ショート
      return (<>
        {cap}
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx},${hy - ry - 7} ${hx + rx + 2},${hy - 8}`} fill={color} />
        {/* Soft layered fringe */}
        <path d={`M${hx - rx + 2},${hy - 6} Q${hx - 5},${hy} ${hx + 2},${hy - 3} Q${hx + 8},${hy - 1} ${hx + rx - 2},${hy - 5}`} fill={color} />
        {/* Tousled volume */}
        <path d={`M${hx - rx - 2},${hy - 8} Q${hx - rx - 3},${hy + 3} ${hx - rx + 5},${hy + 10}`} fill={color} />
        <path d={`M${hx + rx + 2},${hy - 8} Q${hx + rx + 3},${hy + 3} ${hx + rx - 5},${hy + 10}`} fill={color} />
      </>);
    default:
      return renderHairFront(0, color, colorD, colorH, hx, hy, rx, ry);
  }
}

/* ══════════════════════════════════════════════════════
   CLOTHING — Top
   ══════════════════════════════════════════════════════ */

function renderTop(type: number, color: string, colorD: string, skin: string, skinD: string) {
  // Base torso shape — small pigg body
  const base = <path d="M26,0 Q26,-5 35,-6 L65,-6 Q74,-5 74,0 L76,25 Q76,28 72,28 L28,28 Q24,28 24,25 Z" fill={color} />;
  const neckline = (d: string) => <path d={d} fill={skin} />;

  switch (type) {
    case 0: // Tシャツ
      return (<>{base}{neckline("M42,-6 Q50,-2 58,-6")}</>);
    case 1: // ボーダーT
      return (<>
        {base}
        {neckline("M42,-6 Q50,-2 58,-6")}
        {/* Stripes */}
        {[4, 10, 16, 22].map(y => (
          <line key={y} x1={26} y1={y} x2={74} y2={y} stroke={colorD} strokeWidth="2" opacity="0.35" />
        ))}
      </>);
    case 2: // シャツ
      return (<>
        {base}
        {/* Collar */}
        <path d="M42,-6 L46,2 L50,-2 L54,2 L58,-6" fill="white" stroke={colorD} strokeWidth="0.5" />
        {/* Center button line */}
        <line x1={50} y1={2} x2={50} y2={26} stroke={colorD} strokeWidth="0.5" opacity="0.4" />
        {[6, 12, 18].map(y => <circle key={y} cx={50} cy={y} r={1} fill={colorD} opacity="0.3" />)}
      </>);
    case 3: // パーカー
      return (<>
        {base}
        {/* Hood shape behind neck */}
        <path d="M35,-6 Q50,-14 65,-6" fill={colorD} />
        {neckline("M42,-6 Q50,-1 58,-6")}
        {/* Drawstrings */}
        <line x1={47} y1={-2} x2={46} y2={8} stroke={colorD} strokeWidth="0.5" opacity="0.4" />
        <line x1={53} y1={-2} x2={54} y2={8} stroke={colorD} strokeWidth="0.5" opacity="0.4" />
        {/* Pocket */}
        <path d="M38,16 L62,16 L62,26 Q50,28 38,26 Z" fill={colorD} opacity="0.15" />
      </>);
    case 4: // トレーナー
      return (<>
        {base}
        {neckline("M42,-6 Q50,-1 58,-6")}
        {/* Ribbed collar */}
        <path d="M40,-6 Q50,-2 60,-6 L60,-4 Q50,0 40,-4 Z" fill={colorD} opacity="0.2" />
      </>);
    case 5: // ニット
      return (<>
        {base}
        {neckline("M42,-6 Q50,-1 58,-6")}
        {/* Knit texture lines */}
        {[2, 7, 12, 17, 22].map(y => (
          <path key={y} d={`M28,${y} Q38,${y + 2} 50,${y} Q62,${y - 2} 72,${y}`} fill="none" stroke={colorD} strokeWidth="0.5" opacity="0.2" />
        ))}
      </>);
    case 6: // カーディガン
      return (<>
        {base}
        {/* Inner shirt */}
        <path d="M40,-4 Q50,0 60,-4 L60,26 L40,26 Z" fill="white" opacity="0.3" />
        {/* Cardigan opening */}
        <line x1={50} y1={-4} x2={50} y2={27} stroke={colorD} strokeWidth="1" opacity="0.3" />
        {[4, 12, 20].map(y => <circle key={y} cx={48} cy={y} r={1.2} fill={colorD} opacity="0.3" />)}
      </>);
    case 7: // ブラウス
      return (<>
        {base}
        {/* Rounded collar */}
        <path d="M40,-6 Q44,-2 50,0 Q56,-2 60,-6" fill="white" stroke={colorD} strokeWidth="0.3" />
        {/* Ruffle hint */}
        <path d="M44,0 Q47,3 50,0 Q53,3 56,0" fill="none" stroke="white" strokeWidth="0.8" opacity="0.5" />
      </>);
    case 8: // ベスト
      return (<>
        <path d="M30,0 Q30,-5 38,-6 L62,-6 Q70,-5 70,0 L72,25 Q72,28 68,28 L32,28 Q28,28 28,25 Z" fill={color} />
        {/* Sleeveless — show skin arms area */}
        <rect x={24} y={-2} width={8} height={12} rx={3} fill={skin} />
        <rect x={68} y={-2} width={8} height={12} rx={3} fill={skin} />
        {neckline("M42,-6 Q50,-2 58,-6")}
        <line x1={50} y1={-2} x2={50} y2={26} stroke={colorD} strokeWidth="0.5" opacity="0.3" />
      </>);
    case 9: // ジャケット
      return (<>
        {base}
        {/* Lapels */}
        <path d="M42,-6 L46,4 L50,0" fill={colorD} opacity="0.3" />
        <path d="M58,-6 L54,4 L50,0" fill={colorD} opacity="0.3" />
        <line x1={50} y1={0} x2={50} y2={27} stroke={colorD} strokeWidth="0.8" opacity="0.3" />
      </>);
    case 10: // ワンピース (extends into bottom area)
      return (<>
        <path d="M28,0 Q28,-5 37,-6 L63,-6 Q72,-5 72,0 L74,28 L26,28 Z" fill={color} />
        {neckline("M42,-6 Q50,-2 58,-6")}
        {/* Waist cinch */}
        <path d="M30,14 Q50,18 70,14" fill="none" stroke={colorD} strokeWidth="0.8" opacity="0.3" />
      </>);
    case 11: // セーラー
      return (<>
        {base}
        {/* Sailor collar */}
        <path d="M30,-6 L30,8 L50,14 L70,8 L70,-6" fill="#3A3A6A" opacity="0.8" />
        <path d="M30,-6 L30,8 L50,14 L70,8 L70,-6" fill="none" stroke="white" strokeWidth="1.5" />
        {/* Tie */}
        <path d="M48,0 L50,10 L52,0" fill="#CC4444" />
      </>);
    default:
      return renderTop(0, color, colorD, skin, skinD);
  }
}

/* ══════════════════════════════════════════════════════
   CLOTHING — Bottom
   ══════════════════════════════════════════════════════ */

function renderBottom(type: number, color: string, colorD: string, skin: string) {
  switch (type) {
    case 0: // スリムパンツ
      return (<>
        <path d="M28,26 L30,44 L42,44 L50,30 L58,44 L70,44 L72,26 Z" fill={color} />
      </>);
    case 1: // ワイドパンツ
      return (<>
        <path d="M26,26 L26,44 L44,44 L50,30 L56,44 L74,44 L74,26 Z" fill={color} />
      </>);
    case 2: // ハーフパンツ
      return (<>
        <path d="M28,26 L30,38 L44,38 L50,30 L56,38 L70,38 L72,26 Z" fill={color} />
        {/* Exposed lower legs */}
        <rect x={32} y={38} width={9} height={8} rx={3} fill={skin} />
        <rect x={59} y={38} width={9} height={8} rx={3} fill={skin} />
      </>);
    case 3: // ショートパンツ
      return (<>
        <path d="M28,26 L32,35 L46,35 L50,28 L54,35 L68,35 L72,26 Z" fill={color} />
        <rect x={33} y={35} width={8} height={11} rx={3} fill={skin} />
        <rect x={59} y={35} width={8} height={11} rx={3} fill={skin} />
      </>);
    case 4: // ミニスカート
      return (<>
        <path d="M26,26 L22,40 L78,40 L74,26 Z" fill={color} />
        <path d="M26,26 L22,40" stroke={colorD} strokeWidth="0.5" opacity="0.2" />
        <path d="M50,26 L50,40" stroke={colorD} strokeWidth="0.3" opacity="0.15" />
        <rect x={34} y={40} width={7} height={6} rx={3} fill={skin} />
        <rect x={59} y={40} width={7} height={6} rx={3} fill={skin} />
      </>);
    case 5: // ロングスカート
      return (<>
        <path d="M26,26 L20,46 L80,46 L74,26 Z" fill={color} />
        {/* Pleat lines */}
        <path d={`M35,26 L32,46`} stroke={colorD} strokeWidth="0.5" opacity="0.15" />
        <path d={`M50,26 L50,46`} stroke={colorD} strokeWidth="0.5" opacity="0.15" />
        <path d={`M65,26 L68,46`} stroke={colorD} strokeWidth="0.5" opacity="0.15" />
      </>);
    case 6: // サロペット
      return (<>
        <path d="M28,20 L30,44 L42,44 L50,30 L58,44 L70,44 L72,20 Z" fill={color} />
        {/* Straps */}
        <line x1={35} y1={20} x2={38} y2={4} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1={65} y1={20} x2={62} y2={4} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx={38} cy={4} r={1.5} fill={colorD} />
        <circle cx={62} cy={4} r={1.5} fill={colorD} />
      </>);
    case 7: // レギンス
      return (<>
        <path d="M28,26 L30,46 L42,46 L50,30 L58,46 L70,46 L72,26 Z" fill={color} />
        {/* Legging lines */}
        <path d="M36,30 L34,44" stroke={colorD} strokeWidth="0.4" opacity="0.2" />
        <path d="M64,30 L66,44" stroke={colorD} strokeWidth="0.4" opacity="0.2" />
      </>);
    default:
      return renderBottom(0, color, colorD, skin);
  }
}

/* ══════════════════════════════════════════════════════
   ACCESSORIES
   ══════════════════════════════════════════════════════ */

function renderAccessory(type: number, hx: number, hy: number, rx: number, ry: number, _hairColor: string) {
  switch (type) {
    case 0: return null; // なし
    case 1: // 丸メガネ
      return (<>
        <circle cx={hx - 10} cy={hy + 2} r={6.5} fill="none" stroke="#4A4A5A" strokeWidth="1.2" />
        <circle cx={hx + 10} cy={hy + 2} r={6.5} fill="none" stroke="#4A4A5A" strokeWidth="1.2" />
        <line x1={hx - 3.5} y1={hy + 2} x2={hx + 3.5} y2={hy + 2} stroke="#4A4A5A" strokeWidth="1" />
        <line x1={hx - 16.5} y1={hy + 2} x2={hx - rx + 2} y2={hy} stroke="#4A4A5A" strokeWidth="0.8" />
        <line x1={hx + 16.5} y1={hy + 2} x2={hx + rx - 2} y2={hy} stroke="#4A4A5A" strokeWidth="0.8" />
      </>);
    case 2: // 四角メガネ
      return (<>
        <rect x={hx - 16} y={hy - 3} width={12} height={10} rx={2} fill="none" stroke="#3A3A4A" strokeWidth="1.3" />
        <rect x={hx + 4} y={hy - 3} width={12} height={10} rx={2} fill="none" stroke="#3A3A4A" strokeWidth="1.3" />
        <line x1={hx - 4} y1={hy + 2} x2={hx + 4} y2={hy + 2} stroke="#3A3A4A" strokeWidth="1" />
        <line x1={hx - 16} y1={hy + 1} x2={hx - rx + 2} y2={hy - 1} stroke="#3A3A4A" strokeWidth="0.8" />
        <line x1={hx + 16} y1={hy + 1} x2={hx + rx - 2} y2={hy - 1} stroke="#3A3A4A" strokeWidth="0.8" />
      </>);
    case 3: // キャップ
      return (<>
        <ellipse cx={hx} cy={hy - ry * 0.45} rx={rx + 4} ry={ry * 0.35} fill="#4A6B8A" />
        {/* Brim */}
        <path d={`M${hx - rx - 5},${hy - ry * 0.3} Q${hx - rx - 10},${hy - ry * 0.15} ${hx - rx - 8},${hy - ry * 0.1}`} fill="#3A5A7A" />
        <ellipse cx={hx} cy={hy - ry * 0.3} rx={rx + 6} ry={3} fill="#3A5A7A" />
      </>);
    case 4: // ニット帽
      return (<>
        <path d={`M${hx - rx - 1},${hy - ry * 0.2} Q${hx - rx},${hy - ry - 10} ${hx},${hy - ry - 14} Q${hx + rx},${hy - ry - 10} ${hx + rx + 1},${hy - ry * 0.2}`} fill="#CC6666" />
        {/* Pom-pom */}
        <circle cx={hx} cy={hy - ry - 14} r={4} fill="#DD8888" />
        {/* Ribbing */}
        <path d={`M${hx - rx},${hy - ry * 0.2} Q${hx},${hy - ry * 0.15} ${hx + rx},${hy - ry * 0.2}`} fill="none" stroke="#BB5555" strokeWidth="1.5" />
      </>);
    case 5: // ヘッドホン
      return (<>
        {/* Band */}
        <path d={`M${hx - rx - 1},${hy - 2} Q${hx},${hy - ry - 12} ${hx + rx + 1},${hy - 2}`} fill="none" stroke="#4A4A5A" strokeWidth="2" />
        {/* Ear cups */}
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
        {/* Hanging end */}
        <rect x={hx - 4} y={hy + ry - 3} width={7} height={14} rx={2} fill="#CC6666" />
        <line x1={hx - 2} y1={hy + ry + 8} x2={hx + 1} y2={hy + ry + 8} stroke="#BB5555" strokeWidth="0.5" />
      </>);
    case 8: // リボン
      return (<>
        <path d={`M${hx - 2},${hy - ry - 2} Q${hx - 10},${hy - ry - 10} ${hx - 2},${hy - ry - 5}`} fill="#FF6B8A" />
        <path d={`M${hx + 2},${hy - ry - 2} Q${hx + 10},${hy - ry - 10} ${hx + 2},${hy - ry - 5}`} fill="#FF6B8A" />
        <circle cx={hx} cy={hy - ry - 3} r={2} fill="#FF4570" />
      </>);
    default:
      return null;
  }
}
