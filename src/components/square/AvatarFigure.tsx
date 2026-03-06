"use client";

import type { AvatarStyle } from "@/lib/demo-data";

/**
 * AvatarFigure — Premium quality 2.5D mini-character for SLOTY plaza.
 *
 * Design direction:
 * - 2–2.5 head-body ratio chibi with realistic proportions
 * - Detailed face: layered iris, natural brows, soft contour
 * - Hair with strand bundles, highlights, depth
 * - Clothing with folds, seams, fabric feel
 * - Natural standing poses with weight shift
 * - Soft ambient shadows for grounding
 * - Korean social-game inspired, clean, modern aesthetic
 * - Part-separated for future dress-up system
 */

/* ═══ Unique ID counter for SVG defs per instance ═══ */
let _uid = 0;
function uid() { return `av${++_uid}`; }

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
    hairStyle, hairColor, skinTone, topColor, topType = 0, bottomColor,
    bottomType = 0, accessory, expression, bodyPose = 0,
    eyeType = 0, eyeColor = "#2A2A3A", cheekColor = "#FFB4B4",
  } = style;

  const id = uid();
  const skin = skinTone;
  const skinD = dk(skin, 12);
  const skinDD = dk(skin, 20);
  const skinH = lt(skin, 10);
  const skinHH = lt(skin, 18);
  const hairD = dk(hairColor, 16);
  const hairDD = dk(hairColor, 28);
  const hairH = lt(hairColor, 14);
  const hairHH = lt(hairColor, 24);
  const topD = dk(topColor, 16);
  const topDD = dk(topColor, 28);
  const topH = lt(topColor, 10);
  const topHH = lt(topColor, 20);
  const botD = dk(bottomColor, 12);
  const botDD = dk(bottomColor, 22);
  const shoe = "#4A4550";
  const shoeH = "#6A6570";
  const shoeD = "#3A3540";

  const animClass = animate === "walk"
    ? "animate-avatar-walk"
    : animate === "idle"
      ? "animate-avatar-idle"
      : "";

  const pose = getPose(bodyPose);

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      className={`${className || ""} ${animClass}`.trim()}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Skin gradient — soft 3D feel */}
        <radialGradient id={`${id}-skin`} cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor={skinHH} />
          <stop offset="50%" stopColor={skin} />
          <stop offset="100%" stopColor={skinD} />
        </radialGradient>
        {/* Hair gradient */}
        <linearGradient id={`${id}-hair`} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={hairH} />
          <stop offset="40%" stopColor={hairColor} />
          <stop offset="100%" stopColor={hairD} />
        </linearGradient>
        {/* Top fabric gradient */}
        <linearGradient id={`${id}-top`} x1="0.3" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={topH} />
          <stop offset="45%" stopColor={topColor} />
          <stop offset="100%" stopColor={topD} />
        </linearGradient>
        {/* Bottom fabric gradient */}
        <linearGradient id={`${id}-bot`} x1="0.4" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={bottomColor} />
          <stop offset="100%" stopColor={botD} />
        </linearGradient>
        {/* Iris gradient — depth */}
        <radialGradient id={`${id}-iris`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor={lt(eyeColor, 20)} />
          <stop offset="50%" stopColor={eyeColor} />
          <stop offset="100%" stopColor={dk(eyeColor, 15)} />
        </radialGradient>
        {/* Soft drop shadow filter */}
        <filter id={`${id}-shadow`} x="-30%" y="-10%" width="160%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
          <feOffset dy="1.5" />
          <feComponentTransfer><feFuncA type="linear" slope="0.12" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Soft inner glow for cheeks */}
        <filter id={`${id}-cheek`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* ═══ GROUND SHADOW ═══ */}
      <ellipse cx="50" cy="116" rx="22" ry="5" fill="#000" opacity="0.08" />
      <ellipse cx="50" cy="116.5" rx="16" ry="3.5" fill="#000" opacity="0.05" />

      {/* ═══ BACK HAIR (long styles) ═══ */}
      <g data-part="hair-back">
        {hairBack(hairStyle, `url(#${id}-hair)`, hairD, hairDD, hairH)}
      </g>

      {/* ═══ LEGS ═══ */}
      <g data-part="legs" filter={`url(#${id}-shadow)`}>
        {renderLegs(bottomColor, botD, botDD, `url(#${id}-bot)`, bottomType, skin, skinD, shoe, shoeH, shoeD, pose)}
      </g>

      {/* ═══ TORSO ═══ */}
      <g data-part="torso" filter={`url(#${id}-shadow)`}>
        {renderTorso(topColor, topD, topDD, topH, topHH, `url(#${id}-top)`, topType, skin, skinD, pose)}
      </g>

      {/* ═══ ARMS ═══ */}
      <g data-part="arms">
        {renderArms(topColor, topD, topH, `url(#${id}-top)`, skin, skinD, skinH, bodyPose)}
      </g>

      {/* ═══ NECK ═══ */}
      <g data-part="neck">
        <path d="M44 56 Q44 52 46 52 L54 52 Q56 52 56 56 L56 64 Q54 66 50 66 Q46 66 44 64Z" fill={`url(#${id}-skin)`} />
        <path d="M46 58 Q50 60 54 58" stroke={skinD} strokeWidth="0.6" fill="none" opacity="0.12" />
      </g>

      {/* ═══ HEAD ═══ */}
      <g data-part="head">
        {/* Main head shape — slightly tapered jawline */}
        <path
          d="M25 34 Q25 14 50 12 Q75 14 75 34 L74 42 Q72 52 62 56 Q56 58 50 58 Q44 58 38 56 Q28 52 26 42Z"
          fill={`url(#${id}-skin)`}
        />
        {/* Jaw shadow — soft */}
        <path
          d="M32 46 Q50 54 68 46"
          stroke={skinDD} strokeWidth="1.5" fill="none" opacity="0.06"
        />
        {/* Forehead highlight */}
        <ellipse cx="47" cy="24" rx="14" ry="9" fill={skinHH} opacity="0.2" />
        {/* Temple shadow left */}
        <path d="M28 30 Q26 36 28 42" stroke={skinD} strokeWidth="2" fill="none" opacity="0.06" />
        {/* Temple shadow right */}
        <path d="M72 30 Q74 36 72 42" stroke={skinD} strokeWidth="2" fill="none" opacity="0.06" />
        {/* Chin definition */}
        <path d="M44 54 Q50 57 56 54" stroke={skinD} strokeWidth="0.8" fill="none" opacity="0.08" />
      </g>

      {/* ═══ EARS ═══ */}
      <g data-part="ears">
        <ellipse cx="25.5" cy="37" rx="4" ry="5.5" fill={`url(#${id}-skin)`} />
        <ellipse cx="74.5" cy="37" rx="4" ry="5.5" fill={`url(#${id}-skin)`} />
        {/* Inner ear shadow */}
        <ellipse cx="25.5" cy="38" rx="2.2" ry="3.2" fill={skinD} opacity="0.15" />
        <ellipse cx="74.5" cy="38" rx="2.2" ry="3.2" fill={skinD} opacity="0.15" />
        {/* Earrings */}
        {accessory === 4 && <>
          <circle cx="24.5" cy="43.5" r="2.2" fill="#E8D4A0" />
          <circle cx="24.5" cy="43.5" r="1.3" fill="#F5ECCE" />
          <circle cx="75.5" cy="43.5" r="2.2" fill="#E8D4A0" />
          <circle cx="75.5" cy="43.5" r="1.3" fill="#F5ECCE" />
        </>}
      </g>

      {/* ═══ FACE ═══ */}
      <g data-part="face">
        {/* Eyebrows */}
        {renderEyebrows(expression, hairColor, hairD)}
        {/* Eyes with blink animation */}
        <g className="avatar-eyes">
          {renderEyes(expression, eyeType, `url(#${id}-iris)`, eyeColor, skin, skinD)}
        </g>
        {/* Nose — subtle but present */}
        {renderNose(skinD, skinDD)}
        {/* Cheek blush — soft airbrush */}
        <ellipse cx="33" cy="45" rx="5.5" ry="3.5" fill={cheekColor} opacity="0.25" filter={`url(#${id}-cheek)`} />
        <ellipse cx="67" cy="45" rx="5.5" ry="3.5" fill={cheekColor} opacity="0.25" filter={`url(#${id}-cheek)`} />
        {/* Mouth */}
        {renderMouth(expression)}
      </g>

      {/* ═══ FRONT HAIR ═══ */}
      <g data-part="hair-front">
        {hairFront(hairStyle, `url(#${id}-hair)`, hairColor, hairD, hairDD, hairH, hairHH)}
      </g>

      {/* ═══ ACCESSORIES ═══ */}
      <g data-part="accessories">
        {renderAccessories(accessory, topColor, topD, hairColor)}
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════ */
/*                    POSE SYSTEM                     */
/* ═══════════════════════════════════════════════════ */
function getPose(p: number) {
  switch (p) {
    case 1: return { ll: -1.5, rl: 1, shoulderTilt: 1.5 };
    case 2: return { ll: 0, rl: 0, shoulderTilt: 0 };
    case 3: return { ll: 0.5, rl: -0.5, shoulderTilt: -1 };
    case 4: return { ll: -0.5, rl: 0.5, shoulderTilt: 0.5 };
    default: return { ll: 0.5, rl: -0.3, shoulderTilt: 0.8 };
  }
}

/* ═══════════════════════════════════════════════════ */
/*                       LEGS                         */
/* ═══════════════════════════════════════════════════ */
function renderLegs(
  c: string, cd: string, cdd: string, grad: string,
  bt: number, skin: string, skinD: string,
  shoe: string, shoeH: string, shoeD: string,
  pose: { ll: number; rl: number }
) {
  const lx = 37 + pose.ll;
  const rx = 55 + pose.rl;

  // Skirt
  if (bt === 2) {
    return <>
      {/* Skirt body */}
      <path
        d={`M31 82 Q34 79 50 78 Q66 79 69 82 L71 98 Q65 102 50 102 Q35 102 29 98Z`}
        fill={grad}
      />
      {/* Skirt folds */}
      <path d="M38 82 Q39 90 37 98" stroke={cd} strokeWidth="1" fill="none" opacity="0.15" />
      <path d="M50 80 Q50 90 50 100" stroke={cd} strokeWidth="0.8" fill="none" opacity="0.1" />
      <path d="M62 82 Q61 90 63 98" stroke={cd} strokeWidth="1" fill="none" opacity="0.15" />
      {/* Skirt hem highlight */}
      <path d="M33 96 Q50 100 67 96" stroke={cdd} strokeWidth="0.8" fill="none" opacity="0.1" />
      {/* Legs below skirt */}
      <path d={`M${lx} 97 Q${lx + 4} 97 ${lx + 5} 98 L${lx + 6} 108 Q${lx + 4.5} 110 ${lx + 2} 108 L${lx - 1} 98Z`} fill={skin} />
      <path d={`M${rx} 97 Q${rx + 4} 97 ${rx + 5} 98 L${rx + 6} 108 Q${rx + 4.5} 110 ${rx + 2} 108 L${rx - 1} 98Z`} fill={skin} />
      {/* Knee shadow */}
      <ellipse cx={lx + 3} cy={103} rx="2.5" ry="1.5" fill={skinD} opacity="0.1" />
      <ellipse cx={rx + 3} cy={103} rx="2.5" ry="1.5" fill={skinD} opacity="0.1" />
      {renderShoes(lx + 3, rx + 3, shoe, shoeH, shoeD)}
    </>;
  }

  // Pants (slim, wide, shorts)
  const w = bt === 1 ? 12 : bt === 3 ? 10 : 10;
  const h = bt === 3 ? 16 : 20;
  const y = bt === 3 ? 84 : 82;

  return <>
    {/* Left leg */}
    <path
      d={`M${lx} ${y} Q${lx + w * 0.1} ${y - 1} ${lx + w} ${y}
          L${lx + w + (bt === 1 ? 1 : 0)} ${y + h}
          Q${lx + w / 2} ${y + h + 1.5} ${lx - (bt === 1 ? 1 : 0)} ${y + h}Z`}
      fill={grad}
    />
    {/* Left leg center fold */}
    <path d={`M${lx + w / 2} ${y + 2} Q${lx + w / 2 + 0.5} ${y + h / 2} ${lx + w / 2} ${y + h - 2}`}
      stroke={cd} strokeWidth="0.8" fill="none" opacity="0.12" />
    {/* Left leg inner shadow */}
    <path d={`M${lx + w - 1} ${y + 3} L${lx + w} ${y + h - 2}`}
      stroke={cd} strokeWidth="1.2" fill="none" opacity="0.08" />

    {/* Right leg */}
    <path
      d={`M${rx} ${y} Q${rx + w * 0.1} ${y - 1} ${rx + w} ${y}
          L${rx + w + (bt === 1 ? 1 : 0)} ${y + h}
          Q${rx + w / 2} ${y + h + 1.5} ${rx - (bt === 1 ? 1 : 0)} ${y + h}Z`}
      fill={grad}
    />
    {/* Right leg center fold */}
    <path d={`M${rx + w / 2} ${y + 2} Q${rx + w / 2 - 0.5} ${y + h / 2} ${rx + w / 2} ${y + h - 2}`}
      stroke={cd} strokeWidth="0.8" fill="none" opacity="0.12" />

    {/* Crotch shadow */}
    <path d={`M${lx + w - 1} ${y} Q${(lx + rx + w) / 2} ${y + 4} ${rx + 1} ${y}`}
      stroke={cdd} strokeWidth="0.8" fill="none" opacity="0.08" />

    {renderShoes(lx + w / 2, rx + w / 2, shoe, shoeH, shoeD)}
  </>;
}

function renderShoes(lx: number, rx: number, c: string, h: string, d: string) {
  return <>
    {/* Left shoe */}
    <path d={`M${lx - 6} 109 Q${lx - 7} 106 ${lx - 3} 105 L${lx + 4} 105 Q${lx + 7} 106 ${lx + 8} 109 Q${lx + 7} 112 ${lx} 112 Q${lx - 6} 112 ${lx - 6} 109Z`} fill={c} />
    <path d={`M${lx - 5} 107.5 Q${lx} 106 ${lx + 5} 107.5`} stroke={h} strokeWidth="1.2" fill="none" opacity="0.25" />
    <ellipse cx={lx} cy={111} rx="6.5" ry="1.5" fill={d} opacity="0.1" />
    {/* Right shoe */}
    <path d={`M${rx - 6} 109 Q${rx - 7} 106 ${rx - 3} 105 L${rx + 4} 105 Q${rx + 7} 106 ${rx + 8} 109 Q${rx + 7} 112 ${rx} 112 Q${rx - 6} 112 ${rx - 6} 109Z`} fill={c} />
    <path d={`M${rx - 5} 107.5 Q${rx} 106 ${rx + 5} 107.5`} stroke={h} strokeWidth="1.2" fill="none" opacity="0.25" />
    <ellipse cx={rx} cy={111} rx="6.5" ry="1.5" fill={d} opacity="0.1" />
  </>;
}

/* ═══════════════════════════════════════════════════ */
/*                      TORSO                         */
/* ═══════════════════════════════════════════════════ */
function renderTorso(
  tc: string, td: string, tdd: string, th: string, thh: string,
  grad: string, tt: number, skin: string, skinD: string,
  pose: { shoulderTilt: number }
) {
  const tilt = pose.shoulderTilt;
  return <>
    {/* Main torso shape — tapered */}
    <path
      d={`M30 ${64 - tilt} Q29 60 34 58 L66 ${58 + tilt} Q71 60 70 ${64 + tilt}
          L69 88 Q66 92 50 92 Q34 92 31 88Z`}
      fill={grad}
    />
    {/* Side shadow — left */}
    <path d={`M31 66 Q32 74 33 87`} stroke={td} strokeWidth="2.5" fill="none" opacity="0.1" />
    {/* Side shadow — right */}
    <path d={`M69 66 Q68 74 67 87`} stroke={td} strokeWidth="2.5" fill="none" opacity="0.1" />
    {/* Center fold — subtle */}
    <path d="M50 62 Q50.5 72 50 86" stroke={td} strokeWidth="0.6" fill="none" opacity="0.06" />
    {/* Hem shadow */}
    <path d="M34 88 Q50 92 66 88" stroke={tdd} strokeWidth="1.2" fill="none" opacity="0.12" />
    {/* Chest highlight */}
    <path d="M40 64 Q50 62 60 64" stroke={thh} strokeWidth="1.5" fill="none" opacity="0.12" />
    {/* Neckline */}
    {renderNeckline(tt, tc, td, tdd, th, thh, skin, skinD)}
  </>;
}

function renderNeckline(
  tt: number, tc: string, td: string, tdd: string,
  th: string, thh: string, skin: string, skinD: string
) {
  switch (tt) {
    case 1: // V-neck
      return <>
        <path d="M42 57 L50 68 L58 57" fill={skin} />
        <path d="M42 57 L50 68 L58 57" stroke={td} strokeWidth="1.2" fill="none" opacity="0.25" />
        {/* V-neck shadow */}
        <path d="M44 58 L50 66" stroke={skinD} strokeWidth="0.8" fill="none" opacity="0.08" />
      </>;
    case 2: // Collared shirt
      return <>
        <path d="M42 57 Q50 62 58 57" fill={td} opacity="0.12" />
        {/* Collar left */}
        <path d="M42 56 L37 52 Q40 56 44 60" fill={thh} opacity="0.7" />
        <path d="M42 56 L37 52" stroke={td} strokeWidth="0.8" fill="none" opacity="0.25" />
        {/* Collar right */}
        <path d="M58 56 L63 52 Q60 56 56 60" fill={thh} opacity="0.7" />
        <path d="M58 56 L63 52" stroke={td} strokeWidth="0.8" fill="none" opacity="0.25" />
        {/* Buttons */}
        <circle cx="50" cy="66" r="1" fill={td} opacity="0.2" />
        <circle cx="50" cy="73" r="1" fill={td} opacity="0.18" />
        <circle cx="50" cy="80" r="1" fill={td} opacity="0.15" />
        {/* Button line */}
        <line x1="50" y1="60" x2="50" y2="86" stroke={td} strokeWidth="0.5" opacity="0.08" />
      </>;
    case 3: // Hoodie
      return <>
        <path d="M40 56 Q50 64 60 56" fill={td} opacity="0.15" />
        {/* Hood shadow */}
        <path d="M36 54 Q42 48 50 48 Q58 48 64 54" stroke={td} strokeWidth="2.5" fill="none" opacity="0.12" />
        {/* Kangaroo pocket */}
        <path d="M38 76 L62 76 L63 87 Q50 90 37 87Z" fill={td} opacity="0.06" />
        <path d="M38 76 L62 76" stroke={td} strokeWidth="0.8" opacity="0.12" />
        {/* Drawstrings */}
        <line x1="46" y1="60" x2="45" y2="70" stroke={th} strokeWidth="0.8" opacity="0.2" />
        <line x1="54" y1="60" x2="55" y2="70" stroke={th} strokeWidth="0.8" opacity="0.2" />
      </>;
    case 4: // Cardigan
      return <>
        {/* Opening */}
        <path d="M44 58 L56 58 L56 88 Q50 90 44 88Z" fill={lt(tc, 22)} />
        <line x1="44" y1="58" x2="44" y2="88" stroke={td} strokeWidth="1.5" opacity="0.25" />
        <line x1="56" y1="58" x2="56" y2="88" stroke={td} strokeWidth="1.5" opacity="0.25" />
        {/* Cardigan edge texture */}
        <path d="M44 58 Q44 68 44 78" stroke={tdd} strokeWidth="0.5" fill="none" opacity="0.1" />
      </>;
    case 5: // Blouse
      return <>
        <path d="M40 56 Q50 64 60 56" fill={th} opacity="0.25" />
        {/* Ruffle edge */}
        <path d="M40 56 Q43 60 46 56 Q48 60 50 57 Q52 60 54 56 Q57 60 60 56"
          stroke={th} strokeWidth="1" fill="none" opacity="0.35" />
        {/* Center seam */}
        <line x1="50" y1="58" x2="50" y2="86" stroke={td} strokeWidth="0.4" opacity="0.06" />
      </>;
    default: // Crew neck tee
      return <>
        <path d="M42 58 Q50 62 58 58" fill={td} opacity="0.15" />
        <path d="M42 57 Q50 61 58 57" stroke={td} strokeWidth="1.2" fill="none" opacity="0.2" />
        {/* Collar ribbing */}
        <path d="M42 56.5 Q50 60 58 56.5" stroke={tdd} strokeWidth="0.6" fill="none" opacity="0.1" />
      </>;
  }
}

/* ═══════════════════════════════════════════════════ */
/*                       ARMS                         */
/* ═══════════════════════════════════════════════════ */
function renderArms(
  tc: string, td: string, th: string, grad: string,
  skin: string, skinD: string, skinH: string, bp: number
) {
  switch (bp) {
    case 1: // Hand on hip
      return <>
        {/* Left arm — hanging */}
        <path d="M30 62 Q26 68 27 78 Q27 82 29 84" fill={grad} />
        <path d="M30 62 Q26 68 27 78" stroke={td} strokeWidth="0.8" fill="none" opacity="0.1" />
        {renderHand(28, 84, skin, skinD, skinH)}
        {/* Right arm — on hip */}
        <path d="M68 62 Q76 68 72 80 Q70 84 66 82" fill={grad} />
        <path d="M70 70 Q72 74 70 78" stroke={td} strokeWidth="0.8" fill="none" opacity="0.1" />
        {renderHand(68, 82, skin, skinD, skinH)}
      </>;
    case 2: // Arms crossed
      return <>
        <path d="M30 62 Q28 68 32 78 Q36 80 42 76" fill={grad} />
        <path d="M70 62 Q72 68 68 78 Q64 80 58 76" fill={grad} />
        <path d="M40 74 Q50 78 60 74" fill={td} opacity="0.1" />
        {renderHand(40, 75, skin, skinD, skinH, 3.5)}
        {renderHand(60, 75, skin, skinD, skinH, 3.5)}
      </>;
    case 3: // Wave
      return <>
        {/* Left arm — relaxed */}
        <path d="M30 62 Q26 68 27 78 Q27 82 29 84" fill={grad} />
        {renderHand(28, 84, skin, skinD, skinH)}
        {/* Right arm — waving */}
        <path d="M66 60 Q74 54 78 44 Q80 40 78 38" fill={grad} />
        <path d="M68 58 Q74 52 77 44" stroke={td} strokeWidth="0.8" fill="none" opacity="0.1" />
        <g className="avatar-wave-hand">
          {renderHand(78, 38, skin, skinD, skinH, 5)}
          {/* Fingers */}
          <path d="M76 34 L75 31" stroke={skin} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M78 33 L78 29.5" stroke={skin} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M80 34 L81 31" stroke={skin} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </>;
    case 4: // Hands behind back
      return <>
        <path d="M30 62 Q26 68 28 78 Q30 82 32 80" fill={grad} />
        <path d="M30 62 Q26 68 28 78" stroke={td} strokeWidth="0.8" fill="none" opacity="0.1" />
        <path d="M70 62 Q74 68 72 78 Q70 82 68 80" fill={grad} />
        <path d="M70 62 Q74 68 72 78" stroke={td} strokeWidth="0.8" fill="none" opacity="0.1" />
      </>;
    default: // Relaxed
      return <>
        {/* Left arm */}
        <path d="M30 62 Q26 68 27 78 Q27 82 29 85" fill={grad} />
        <path d="M30 62 Q26 68 27 78" stroke={td} strokeWidth="0.8" fill="none" opacity="0.1" />
        <ellipse cx="28" cy="72" rx="5" ry="3" fill={td} opacity="0.06" />
        {renderHand(28, 85, skin, skinD, skinH)}
        {/* Right arm */}
        <path d="M70 62 Q74 68 73 78 Q73 82 71 85" fill={grad} />
        <path d="M70 62 Q74 68 73 78" stroke={td} strokeWidth="0.8" fill="none" opacity="0.1" />
        <ellipse cx="72" cy="73" rx="5" ry="3" fill={td} opacity="0.06" />
        {renderHand(72, 85, skin, skinD, skinH)}
      </>;
  }
}

function renderHand(cx: number, cy: number, skin: string, skinD: string, skinH: string, r = 4.5) {
  return <>
    <circle cx={cx} cy={cy} r={r} fill={skin} />
    <circle cx={cx - 0.5} cy={cy - 0.5} r={r * 0.5} fill={skinH} opacity="0.15" />
    <circle cx={cx + 0.5} cy={cy + 0.5} r={r * 0.6} fill={skinD} opacity="0.06" />
  </>;
}

/* ═══════════════════════════════════════════════════ */
/*                    EYEBROWS                        */
/* ═══════════════════════════════════════════════════ */
function renderEyebrows(exp: number, hc: string, hd: string) {
  const c = dk(hc, 10);
  const w = 1.6;
  const o = 0.55;

  // More natural brow shapes with taper
  switch (exp) {
    case 1: // Happy — slightly raised
      return <>
        <path d="M34 30.5 Q36 28.5 39 28.5 Q41.5 28.5 43 30" stroke={c} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />
        <path d="M57 30 Q59.5 28.5 62 28.5 Q64 28.5 66 30.5" stroke={c} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />
      </>;
    case 2: // Wink — one raised
      return <>
        <path d="M34 30 Q38 28 43 30.5" stroke={c} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />
        <path d="M57 28.5 Q62 26.5 66 29.5" stroke={c} strokeWidth={w * 1.05} fill="none" opacity={o} strokeLinecap="round" />
      </>;
    case 3: // Surprised — raised
      return <>
        <path d="M34 28.5 Q38 26 43 28" stroke={c} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />
        <path d="M57 28 Q62 26 66 28.5" stroke={c} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />
      </>;
    case 4: // Gentle — soft arch
      return <>
        <path d="M35 30 Q38 28.5 43 30.5" stroke={c} strokeWidth={w * 0.9} fill="none" opacity={o * 0.8} strokeLinecap="round" />
        <path d="M57 30.5 Q62 28.5 65 30" stroke={c} strokeWidth={w * 0.9} fill="none" opacity={o * 0.8} strokeLinecap="round" />
      </>;
    case 5: // Cool — flatter
      return <>
        <path d="M33 29.5 Q38 28 43 29" stroke={c} strokeWidth={w * 1.1} fill="none" opacity={o * 0.85} strokeLinecap="round" />
        <path d="M57 29 Q62 28 67 29.5" stroke={c} strokeWidth={w * 1.1} fill="none" opacity={o * 0.85} strokeLinecap="round" />
      </>;
    default: // Neutral — natural arch
      return <>
        <path d="M34 30 Q37 28 39.5 28 Q42 28 43 29.5" stroke={c} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />
        <path d="M57 29.5 Q58 28 60.5 28 Q63 28 66 30" stroke={c} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />
      </>;
  }
}

/* ═══════════════════════════════════════════════════ */
/*                      EYES                          */
/* ═══════════════════════════════════════════════════ */
function renderEyes(exp: number, et: number, irisGrad: string, ec: string, skin: string, skinD: string) {
  if (exp === 2) { // Wink
    return <>
      {/* Winking eye — curved line */}
      <path d="M35 39 Q39 43 43 39" stroke="#3A3A4A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Lower lash marks for wink */}
      <path d="M36 40 Q39 42.5 42 40" stroke="#3A3A4A" strokeWidth="0.6" fill="none" opacity="0.15" />
      {/* Open eye */}
      {renderSingleEye(61, 38.5, et, irisGrad, ec, skin, skinD, false, false)}
    </>;
  }
  if (exp === 3) { // Happy squint
    return <>
      <path d="M35 39 Q39 43 43 39" stroke="#3A3A4A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M57 39 Q61 43 65 39" stroke="#3A3A4A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Under-eye smile lines */}
      <path d="M36 40 Q39 42 42 40" stroke="#3A3A4A" strokeWidth="0.5" fill="none" opacity="0.12" />
      <path d="M58 40 Q61 42 64 40" stroke="#3A3A4A" strokeWidth="0.5" fill="none" opacity="0.12" />
    </>;
  }

  const half = exp === 5;
  const gentle = exp === 4;

  return <>
    {renderSingleEye(39, 38.5, et, irisGrad, ec, skin, skinD, half, gentle)}
    {renderSingleEye(61, 38.5, et, irisGrad, ec, skin, skinD, half, gentle)}
  </>;
}

function getEyeShape(et: number) {
  switch (et) {
    case 1: return { rx: 4.8, ry: 3.8, ir: 3, pr: 1.8 }; // Almond
    case 2: return { rx: 4.8, ry: 4.2, ir: 3.2, pr: 1.9 }; // Soft droopy
    case 3: return { rx: 4.5, ry: 3.5, ir: 2.8, pr: 1.7 }; // Sharp
    default: return { rx: 4.5, ry: 4.2, ir: 3.2, pr: 1.9 }; // Round
  }
}

function renderSingleEye(
  cx: number, cy: number, et: number,
  irisGrad: string, ec: string, skin: string, skinD: string,
  half: boolean, gentle: boolean
) {
  const s = getEyeShape(et);
  const ry = half ? s.ry * 0.55 : gentle ? s.ry * 0.88 : s.ry;

  return <g>
    {/* Eye white — with subtle gradient */}
    <ellipse cx={cx} cy={cy} rx={s.rx} ry={ry} fill="#FAFAFA" />
    {/* Eye white inner shadow (upper) */}
    <ellipse cx={cx} cy={cy - ry * 0.3} rx={s.rx * 0.8} ry={ry * 0.3} fill="#E8E4E0" opacity="0.15" />
    {/* Eye outline — very subtle */}
    <ellipse cx={cx} cy={cy} rx={s.rx} ry={ry} fill="none" stroke="#D8D0C8" strokeWidth="0.4" opacity="0.35" />

    {/* Iris — with gradient for depth */}
    <ellipse cx={cx + 0.3} cy={cy + 0.3} rx={s.ir} ry={Math.min(s.ir, ry - 0.5)} fill={irisGrad} />
    {/* Iris ring — darker outer edge */}
    <ellipse cx={cx + 0.3} cy={cy + 0.3} rx={s.ir} ry={Math.min(s.ir, ry - 0.5)} fill="none" stroke={dk(ec, 20)} strokeWidth="0.5" opacity="0.25" />
    {/* Inner iris — lighter center */}
    <ellipse cx={cx + 0.2} cy={cy - 0.2} rx={s.ir * 0.5} ry={Math.min(s.ir * 0.5, ry - 1.2)} fill={lt(ec, 25)} opacity="0.25" />

    {/* Pupil — with subtle reflection */}
    <circle cx={cx + 0.3} cy={cy + 0.5} r={Math.min(s.pr, ry - 1.5)} fill="#0A0A1A" />

    {/* Primary highlight — large, upper-left */}
    <ellipse cx={cx - 1.2} cy={cy - 1.2} rx={1.5} ry={1.2} fill="#fff" opacity="0.9" />
    {/* Secondary highlight — small, lower-right */}
    <circle cx={cx + 1.5} cy={cy + 0.8} r={0.6} fill="#fff" opacity="0.5" />
    {/* Tertiary ambient light */}
    <circle cx={cx - 0.5} cy={cy + 1} r={0.4} fill="#fff" opacity="0.2" />

    {/* Upper eyelid line — key feature for expression */}
    {!half && <path
      d={`M${cx - s.rx} ${cy - ry * 0.1} Q${cx} ${cy - ry - 0.8} ${cx + s.rx} ${cy - ry * 0.1}`}
      stroke="#3A3040" strokeWidth="1.4" fill="none" opacity="0.3" strokeLinecap="round"
    />}
    {/* Upper lid shadow — gives depth */}
    {!half && <path
      d={`M${cx - s.rx + 0.5} ${cy - ry * 0.2} Q${cx} ${cy - ry + 0.5} ${cx + s.rx - 0.5} ${cy - ry * 0.2}`}
      stroke={skinD} strokeWidth="1" fill="none" opacity="0.08"
    />}
    {/* Lower lash line — very subtle */}
    <path
      d={`M${cx - s.rx + 1} ${cy + ry * 0.6} Q${cx} ${cy + ry + 0.3} ${cx + s.rx - 1} ${cy + ry * 0.6}`}
      stroke="#5A5060" strokeWidth="0.5" fill="none" opacity="0.08"
    />
    {/* Outer corner lash emphasis */}
    {!half && <>
      <path d={`M${cx + s.rx - 0.5} ${cy - ry * 0.3} L${cx + s.rx + 0.5} ${cy - ry * 0.5}`}
        stroke="#3A3040" strokeWidth="0.8" fill="none" opacity="0.15" strokeLinecap="round" />
    </>}
  </g>;
}

/* ═══════════════════════════════════════════════════ */
/*                      NOSE                          */
/* ═══════════════════════════════════════════════════ */
function renderNose(skinD: string, skinDD: string) {
  return <>
    {/* Nose bridge shadow — very subtle vertical */}
    <path d="M49.5 40 Q50 42 49.8 44" stroke={skinD} strokeWidth="0.6" fill="none" opacity="0.08" />
    {/* Nose tip — small soft highlight */}
    <path d="M48.5 44.5 Q50 46.5 51.5 44.5" stroke={skinDD} strokeWidth="1" fill="none" opacity="0.2" strokeLinecap="round" />
    {/* Nostril hints */}
    <circle cx="48.5" cy="45.5" r="0.6" fill={skinDD} opacity="0.08" />
    <circle cx="51.5" cy="45.5" r="0.6" fill={skinDD} opacity="0.08" />
  </>;
}

/* ═══════════════════════════════════════════════════ */
/*                     MOUTH                          */
/* ═══════════════════════════════════════════════════ */
function renderMouth(exp: number) {
  switch (exp) {
    case 1: // Smile
      return <>
        <path d="M44 49.5 Q50 54 56 49.5" stroke="#C86868" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Lip color fill */}
        <path d="M45 50 Q50 53.5 55 50" fill="#E8A0A0" opacity="0.12" />
        {/* Upper lip definition */}
        <path d="M46 49.5 Q50 48.5 54 49.5" stroke="#C08080" strokeWidth="0.5" fill="none" opacity="0.12" />
      </>;
    case 2: // Wink smile
      return <>
        <path d="M44 49.5 Q50 55 56 49.5" stroke="#C86868" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M46 50 Q50 53 54 50" fill="#E8A0A0" opacity="0.15" />
      </>;
    case 3: // Big happy
      return <>
        <path d="M43 48.5 Q50 57 57 48.5" stroke="#C86868" strokeWidth="1.8" fill="#F5C8C8" fillOpacity="0.3" strokeLinecap="round" />
        {/* Tongue hint */}
        <ellipse cx="50" cy="53" rx="3.5" ry="2.2" fill="#E09090" opacity="0.3" />
        {/* Teeth hint */}
        <path d="M46 49.5 L54 49.5" stroke="#fff" strokeWidth="1.5" opacity="0.25" />
      </>;
    case 4: // Gentle
      return <>
        <path d="M45.5 49.5 Q50 52 54.5 49.5" stroke="#B87878" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {/* Subtle lip color */}
        <path d="M47 50 Q50 51.5 53 50" fill="#D0A0A0" opacity="0.08" />
      </>;
    case 5: // Cool / slight smirk
      return <>
        <path d="M44 50 Q48 50.5 50 49.5 Q54 49 56 50.5" stroke="#A87070" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </>;
    default: // Neutral
      return <>
        <path d="M45.5 50 Q50 51.5 54.5 50" stroke="#B87575" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {/* Upper lip definition */}
        <path d="M47 49.5 Q50 49 53 49.5" stroke="#C08888" strokeWidth="0.4" fill="none" opacity="0.1" />
      </>;
  }
}

/* ═══════════════════════════════════════════════════ */
/*                   HAIR — BACK                      */
/* ═══════════════════════════════════════════════════ */
function hairBack(s: number, grad: string, hd: string, hdd: string, hh: string) {
  switch (s) {
    case 2: // Long — back hair falls behind body
      return <>
        <path d="M22 36 Q18 52 20 75 Q22 82 28 80" fill={grad} />
        <path d="M78 36 Q82 52 80 75 Q78 82 72 80" fill={grad} />
        {/* Back hair strand lines */}
        <path d="M24 42 Q22 55 24 72" stroke={hd} strokeWidth="1.5" fill="none" opacity="0.12" />
        <path d="M76 42 Q78 55 76 72" stroke={hd} strokeWidth="1.5" fill="none" opacity="0.12" />
        <path d="M22 50 Q20 60 22 74" stroke={hh} strokeWidth="1" fill="none" opacity="0.1" />
        <path d="M78 50 Q80 60 78 74" stroke={hh} strokeWidth="1" fill="none" opacity="0.1" />
      </>;
    case 7: // Wolf — longer back
      return <>
        <path d="M22 38 Q18 52 22 72" fill={grad} />
        <path d="M78 38 Q82 52 78 72" fill={grad} />
        <path d="M24 44 Q22 56 24 68" stroke={hd} strokeWidth="1.2" fill="none" opacity="0.1" />
        <path d="M76 44 Q78 56 76 68" stroke={hd} strokeWidth="1.2" fill="none" opacity="0.1" />
      </>;
    case 4: // Ponytail — back tail
      return <>
        <path d="M70 22 Q78 20 82 28 Q86 42 82 58 Q78 64 74 56 Q80 42 76 30" fill={grad} />
        <path d="M76 28 Q82 36 80 50" stroke={hd} strokeWidth="1.5" fill="none" opacity="0.12" />
        <path d="M78 32 Q84 40 82 52" stroke={hh} strokeWidth="1" fill="none" opacity="0.1" />
        {/* Tie */}
        <ellipse cx="73" cy="24" rx="3" ry="2.5" fill={hdd} opacity="0.4" />
      </>;
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════ */
/*                   HAIR — FRONT                     */
/* ═══════════════════════════════════════════════════ */
function hairFront(
  s: number, grad: string, hc: string,
  hd: string, hdd: string, hh: string, hhh: string
) {
  // Common crown/top
  const crown = (extra?: React.ReactNode) => <>
    {/* Main hair mass */}
    <path d="M26 30 Q28 12 50 10 Q72 12 74 30 L74 36 Q72 26 50 20 Q28 26 26 36Z" fill={grad} />
    {/* Crown highlight */}
    <path d="M34 24 Q50 12 66 24" fill={hhh} opacity="0.12" />
    {/* Hair shine line */}
    <path d="M36 20 Q44 16 52 18" stroke={hhh} strokeWidth="1.2" fill="none" opacity="0.15" />
    {extra}
  </>;

  switch (s) {
    case 0: // Short — neat, textured
      return <>
        {crown()}
        {/* Side hair — left */}
        <path d="M28 32 Q26 36 28 42" stroke={hc} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M29 34 Q27 38 29 43" stroke={hd} strokeWidth="1.5" fill="none" opacity="0.12" />
        {/* Side hair — right */}
        <path d="M72 32 Q74 36 72 42" stroke={hc} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M71 34 Q73 38 71 43" stroke={hd} strokeWidth="1.5" fill="none" opacity="0.12" />
        {/* Strand bundles on top */}
        <path d="M36 22 Q38 18 40 22" stroke={hc} strokeWidth="3" fill="none" />
        <path d="M44 20 Q46 16 48 20" stroke={hc} strokeWidth="2.5" fill="none" />
        <path d="M52 20 Q54 16 56 20" stroke={hc} strokeWidth="2.5" fill="none" />
        <path d="M60 22 Q62 18 64 22" stroke={hc} strokeWidth="3" fill="none" />
        {/* Hair texture strands */}
        <path d="M38 16 Q42 14 46 16" stroke={hd} strokeWidth="0.8" fill="none" opacity="0.1" />
        <path d="M54 15 Q58 13 62 16" stroke={hd} strokeWidth="0.8" fill="none" opacity="0.1" />
      </>;
    case 1: // Medium — side-swept
      return <>
        <path d="M24 34 Q28 12 50 8 Q72 12 76 34 L76 42 Q72 28 50 20 Q28 28 24 42Z" fill={grad} />
        <path d="M30 28 Q50 10 70 28" fill={hhh} opacity="0.1" />
        {/* Side volume — left */}
        <path d="M24 36 Q20 44 22 54" stroke={hc} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M26 38 Q22 46 24 52" stroke={hd} strokeWidth="2" fill="none" opacity="0.12" />
        <path d="M24 40 Q20 48 22 54" stroke={hh} strokeWidth="1.5" fill="none" opacity="0.1" />
        {/* Side volume — right */}
        <path d="M76 36 Q80 44 78 54" stroke={hc} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M74 38 Q78 46 76 52" stroke={hd} strokeWidth="2" fill="none" opacity="0.12" />
        {/* Top bundles */}
        <path d="M34 26 Q38 20 42 26" stroke={hc} strokeWidth="3.5" fill="none" />
        <path d="M48 24 Q52 18 56 24" stroke={hc} strokeWidth="3" fill="none" />
        <path d="M58 26 Q62 20 66 26" stroke={hc} strokeWidth="3.5" fill="none" />
        {/* Strand highlights */}
        <path d="M36 22 Q40 18 44 22" stroke={hh} strokeWidth="1" fill="none" opacity="0.12" />
      </>;
    case 2: // Long — flowing
      return <>
        <path d="M24 32 Q28 10 50 6 Q72 10 76 32 L76 38 Q72 24 50 18 Q28 24 24 38Z" fill={grad} />
        <path d="M30 26 Q50 8 70 26" fill={hhh} opacity="0.1" />
        {/* Long side hair — left */}
        <path d="M22 36 Q18 52 20 72 Q22 80 28 78" stroke={hc} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M24 40 Q20 54 22 68" stroke={hd} strokeWidth="3" fill="none" opacity="0.12" />
        <path d="M22 44 Q18 56 20 70" stroke={hh} strokeWidth="2" fill="none" opacity="0.1" />
        {/* Long side hair — right */}
        <path d="M78 36 Q82 52 80 72 Q78 80 72 78" stroke={hc} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M76 40 Q80 54 78 68" stroke={hd} strokeWidth="3" fill="none" opacity="0.12" />
        <path d="M78 44 Q82 56 80 70" stroke={hh} strokeWidth="2" fill="none" opacity="0.1" />
        {/* Top bundle structure */}
        <path d="M32 28 Q36 20 40 28" stroke={hc} strokeWidth="4.5" fill="none" />
        <path d="M42 26 Q46 18 50 26" stroke={hc} strokeWidth="4" fill="none" />
        <path d="M52 26 Q56 18 60 26" stroke={hc} strokeWidth="4" fill="none" />
        <path d="M62 28 Q66 20 70 28" stroke={hc} strokeWidth="4.5" fill="none" />
        {/* Strand tips */}
        <path d="M20 72 Q18 76 22 78" stroke={hc} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M80 72 Q82 76 78 78" stroke={hc} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>;
    case 3: // Bob
      return <>
        <path d="M24 28 Q28 8 50 6 Q72 8 76 28 L78 54 Q76 62 70 62 L30 62 Q24 62 22 54Z" fill={grad} />
        <path d="M30 24 Q50 6 70 24" fill={hhh} opacity="0.1" />
        {/* Bob edge curve — tapered */}
        <path d="M26 50 Q30 60 36 60" stroke={hd} strokeWidth="1.5" fill="none" opacity="0.15" />
        <path d="M74 50 Q70 60 64 60" stroke={hd} strokeWidth="1.5" fill="none" opacity="0.15" />
        {/* Interior strand lines */}
        <path d="M32 30 Q32 40 34 52" stroke={hd} strokeWidth="1" fill="none" opacity="0.08" />
        <path d="M42 28 Q42 40 44 52" stroke={hd} strokeWidth="0.8" fill="none" opacity="0.06" />
        <path d="M58 28 Q58 40 56 52" stroke={hd} strokeWidth="0.8" fill="none" opacity="0.06" />
        <path d="M68 30 Q68 40 66 52" stroke={hd} strokeWidth="1" fill="none" opacity="0.08" />
        {/* Top bundle structure */}
        <path d="M34 26 L34 32" stroke={hc} strokeWidth="5" strokeLinecap="round" />
        <path d="M42 24 L42 30" stroke={hc} strokeWidth="5" strokeLinecap="round" />
        <path d="M50 23 L50 28" stroke={hc} strokeWidth="5" strokeLinecap="round" />
        <path d="M58 24 L58 30" stroke={hc} strokeWidth="5" strokeLinecap="round" />
        <path d="M66 26 L66 32" stroke={hc} strokeWidth="5" strokeLinecap="round" />
        {/* Highlight on top */}
        <path d="M36 22 Q42 18 48 22" stroke={hh} strokeWidth="1.2" fill="none" opacity="0.12" />
        <path d="M52 22 Q58 18 64 22" stroke={hh} strokeWidth="1" fill="none" opacity="0.1" />
      </>;
    case 4: // Ponytail
      return <>
        {crown()}
        {/* Side hair */}
        <path d="M28 32 Q26 38 28 44" stroke={hc} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M72 32 Q74 38 72 44" stroke={hc} strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Bangs */}
        <path d="M34 26 Q38 20 42 26" stroke={hc} strokeWidth="3.5" fill="none" />
        <path d="M44 24 Q48 18 52 24" stroke={hc} strokeWidth="3" fill="none" />
        <path d="M54 24 Q58 18 62 24" stroke={hc} strokeWidth="3" fill="none" />
        {/* Strand detail */}
        <path d="M40 18 Q44 14 48 18" stroke={hh} strokeWidth="0.8" fill="none" opacity="0.12" />
      </>;
    case 5: // Mash
      return <>
        <path d="M22 34 Q26 8 50 4 Q74 8 78 34 L78 42 Q74 28 50 20 Q26 28 22 42Z" fill={grad} />
        {/* Heavy bangs — layered */}
        <path d="M24 34 Q30 22 44 28 L44 36 Q30 30 26 38Z" fill={grad} />
        <path d="M26 36 Q32 26 42 30" stroke={hd} strokeWidth="1.5" fill="none" opacity="0.12" />
        <path d="M24 36 L22 44" stroke={hc} strokeWidth="5" strokeLinecap="round" />
        {/* Right side */}
        <path d="M74 36 Q76 40 74 44" stroke={hc} strokeWidth="4.5" fill="none" />
        {/* Strand bundles */}
        <path d="M34 28 Q38 22 42 28" stroke={hc} strokeWidth="3" fill="none" />
        <path d="M46 26 Q50 20 54 26" stroke={hc} strokeWidth="2.5" fill="none" />
        <path d="M58 28 Q62 22 66 28" stroke={hc} strokeWidth="3" fill="none" />
        {/* Highlight */}
        <path d="M30 24 Q40 14 50 18" stroke={hh} strokeWidth="1.2" fill="none" opacity="0.1" />
        <path d="M56 16 Q64 12 72 22" stroke={hh} strokeWidth="1" fill="none" opacity="0.08" />
      </>;
    case 6: // Center part
      return <>
        <path d="M24 32 Q28 10 50 8 Q72 10 76 32 L76 40 Q72 26 50 20 Q28 26 24 40Z" fill={grad} />
        {/* Part line */}
        <line x1="50" y1="8" x2="50" y2="24" stroke={hdd} strokeWidth="1.5" opacity="0.18" />
        {/* Side volume — left */}
        <path d="M24 34 Q20 44 22 56" stroke={hc} strokeWidth="6.5" fill="none" strokeLinecap="round" />
        <path d="M26 36 Q22 46 24 54" stroke={hd} strokeWidth="2" fill="none" opacity="0.1" />
        {/* Side volume — right */}
        <path d="M76 34 Q80 44 78 56" stroke={hc} strokeWidth="6.5" fill="none" strokeLinecap="round" />
        <path d="M74 36 Q78 46 76 54" stroke={hd} strokeWidth="2" fill="none" opacity="0.1" />
        {/* Bangs — swept to both sides from center */}
        <path d="M48 22 Q44 18 36 26" stroke={hc} strokeWidth="4" fill="none" />
        <path d="M52 22 Q56 18 64 26" stroke={hc} strokeWidth="4" fill="none" />
        {/* Crown highlight */}
        <path d="M32 26 Q42 14 50 16" fill={hhh} opacity="0.08" />
        <path d="M50 16 Q58 14 68 26" fill={hhh} opacity="0.08" />
        {/* Strand texture */}
        <path d="M30 30 Q26 40 28 50" stroke={hh} strokeWidth="1" fill="none" opacity="0.08" />
        <path d="M70 30 Q74 40 72 50" stroke={hh} strokeWidth="1" fill="none" opacity="0.08" />
      </>;
    case 7: // Wolf
      return <>
        <path d="M22 34 Q26 8 50 4 Q74 8 78 34 L78 42 Q74 28 50 20 Q26 28 22 42Z" fill={grad} />
        <path d="M30 28 Q50 6 70 28" fill={hhh} opacity="0.08" />
        {/* Layered wolf bangs */}
        <path d="M28 32 Q34 22 40 30" stroke={hc} strokeWidth="4.5" fill="none" />
        <path d="M36 28 Q42 18 48 28" stroke={hc} strokeWidth="4" fill="none" />
        <path d="M44 26 Q50 18 56 26" stroke={hc} strokeWidth="3.5" fill="none" />
        <path d="M52 28 Q58 18 64 28" stroke={hc} strokeWidth="4" fill="none" />
        <path d="M60 30 Q66 22 72 32" stroke={hc} strokeWidth="4.5" fill="none" />
        {/* Side layers — left */}
        <path d="M22 38 Q18 52 22 68" stroke={hc} strokeWidth="7.5" fill="none" strokeLinecap="round" />
        <path d="M24 42 Q20 54 22 64" stroke={hd} strokeWidth="2.5" fill="none" opacity="0.12" />
        <path d="M22 46 Q18 56 20 64" stroke={hh} strokeWidth="1.5" fill="none" opacity="0.1" />
        {/* Side layers — right */}
        <path d="M78 38 Q82 52 78 68" stroke={hc} strokeWidth="7.5" fill="none" strokeLinecap="round" />
        <path d="M76 42 Q80 54 78 64" stroke={hd} strokeWidth="2.5" fill="none" opacity="0.12" />
        {/* Strand texture top */}
        <path d="M34 24 Q38 18 42 24" stroke={hh} strokeWidth="0.8" fill="none" opacity="0.1" />
        <path d="M52 22 Q56 16 60 22" stroke={hh} strokeWidth="0.8" fill="none" opacity="0.08" />
      </>;
    default: // Fallback short
      return <>
        {crown()}
        <path d="M28 32 Q26 36 28 42" stroke={hc} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M72 32 Q74 36 72 42" stroke={hc} strokeWidth="4" fill="none" strokeLinecap="round" />
      </>;
  }
}

/* ═══════════════════════════════════════════════════ */
/*                  ACCESSORIES                       */
/* ═══════════════════════════════════════════════════ */
function renderAccessories(a: number, tc: string, td: string, hc: string) {
  switch (a) {
    case 1: // Glasses — refined
      return <>
        {/* Left lens */}
        <rect x="31" y="34" width="14" height="10" rx="4" fill="none" stroke="#5A5A6A" strokeWidth="1.3" />
        {/* Right lens */}
        <rect x="55" y="34" width="14" height="10" rx="4" fill="none" stroke="#5A5A6A" strokeWidth="1.3" />
        {/* Bridge */}
        <path d="M45 38 Q50 36 55 38" stroke="#5A5A6A" strokeWidth="1" fill="none" />
        {/* Temples */}
        <line x1="31" y1="37" x2="26" y2="36" stroke="#5A5A6A" strokeWidth="0.8" />
        <line x1="69" y1="37" x2="74" y2="36" stroke="#5A5A6A" strokeWidth="0.8" />
        {/* Lens glare */}
        <path d="M34 35.5 Q36 35 37 36.5" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.2" />
        <path d="M58 35.5 Q60 35 61 36.5" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.2" />
      </>;
    case 2: // Hat — cap style
      return <>
        <path d="M28 20 Q30 6 50 4 Q70 6 72 20Z" fill={tc} />
        <path d="M32 18 Q50 8 68 18" fill={lt(tc, 8)} opacity="0.25" />
        {/* Brim */}
        <ellipse cx="50" cy="22" rx="30" ry="6" fill={td} />
        <ellipse cx="50" cy="21" rx="29" ry="5" fill={tc} />
        {/* Button on top */}
        <circle cx="50" cy="6" r="2" fill={td} opacity="0.35" />
        {/* Cap seam */}
        <line x1="50" y1="6" x2="50" y2="20" stroke={td} strokeWidth="0.6" opacity="0.15" />
        {/* Brim shine */}
        <path d="M35 20 Q50 18 65 20" stroke={lt(tc, 12)} strokeWidth="0.8" fill="none" opacity="0.2" />
      </>;
    case 3: // Headphones
      return <>
        {/* Band */}
        <path d="M22 34 Q22 10 50 8 Q78 10 78 34" stroke="#555" strokeWidth="3" fill="none" />
        <path d="M24 30 Q24 12 50 10 Q76 12 76 30" stroke="#666" strokeWidth="1.5" fill="none" opacity="0.3" />
        {/* Cushion top */}
        <path d="M38 10 Q50 6 62 10" stroke="#666" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        {/* Left ear cup */}
        <rect x="14" y="30" width="12" height="17" rx="5.5" fill="#555" />
        <rect x="15" y="32" width="10" height="13" rx="4.5" fill="#666" />
        <rect x="16.5" y="34" width="3" height="5" rx="1.5" fill="#888" opacity="0.25" />
        {/* Right ear cup */}
        <rect x="74" y="30" width="12" height="17" rx="5.5" fill="#555" />
        <rect x="75" y="32" width="10" height="13" rx="4.5" fill="#666" />
        <rect x="76.5" y="34" width="3" height="5" rx="1.5" fill="#888" opacity="0.25" />
      </>;
    case 4: return null; // Earrings handled in ears section
    case 5: // Scarf
      return <>
        <path d="M36 54 Q50 60 64 54 Q66 58 64 62 Q50 66 36 62 Q34 58 36 54Z" fill={tc} opacity="0.85" />
        <path d="M36 56 Q50 62 64 56" stroke={td} strokeWidth="0.8" fill="none" opacity="0.18" />
        {/* Scarf tail */}
        <path d="M38 62 Q36 70 40 76" stroke={tc} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M39 72 L41 76 L37 76Z" fill={tc} />
        {/* Scarf knit texture */}
        <path d="M40 56 Q42 58 44 56" stroke={lt(tc, 10)} strokeWidth="0.6" fill="none" opacity="0.25" />
        <path d="M48 57 Q50 59 52 57" stroke={lt(tc, 10)} strokeWidth="0.6" fill="none" opacity="0.25" />
        <path d="M56 56 Q58 58 60 56" stroke={lt(tc, 10)} strokeWidth="0.6" fill="none" opacity="0.25" />
      </>;
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════ */
/*                  COLOR UTILS                       */
/* ═══════════════════════════════════════════════════ */
function dk(hex: string, p: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - Math.round(2.55 * p));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(2.55 * p));
  const b = Math.max(0, (n & 0xff) - Math.round(2.55 * p));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lt(hex: string, p: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (n >> 16) + Math.round(2.55 * p));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(2.55 * p));
  const b = Math.min(255, (n & 0xff) + Math.round(2.55 * p));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
