"use client";

import type { AvatarStyle } from "@/lib/demo-data";

/**
 * AvatarFigure — Rich, human-like SVG mini-character for SLOTY plaza.
 *
 * 2–2.5 head-body ratio. Expressive face with iris/pupil/highlight.
 * Hair with volume and layers. Clothing with silhouette variety.
 * Natural body poses. Subtle shadows for depth.
 * Part-separated structure for future dress-up system.
 */
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

  const skin = skinTone;
  const skinS = dk(skin, 10);
  const skinH = lt(skin, 8);
  const hairS = dk(hairColor, 14);
  const hairH = lt(hairColor, 12);
  const topS = dk(topColor, 14);
  const topH = lt(topColor, 8);
  const botS = dk(bottomColor, 10);
  const shoe = "#5A5560";
  const shoeH = "#7A7580";

  const animClass = animate === "walk"
    ? "animate-avatar-walk"
    : animate === "idle"
      ? "animate-avatar-idle"
      : "";

  const poses = getPose(bodyPose);

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      className={`${className || ""} ${animClass}`.trim()}
      style={{ overflow: "visible" }}
    >
      {/* Ground shadow */}
      <ellipse cx="50" cy="117" rx="20" ry="4" fill="#000" opacity="0.1" />

      {/* ── LEGS ── */}
      <g data-part="legs">
        {legs(bottomColor, botS, bottomType, skin, shoe, shoeH, poses)}
      </g>

      {/* ── TORSO ── */}
      <g data-part="torso">
        {torso(topColor, topS, topH, topType, skin, poses)}
      </g>

      {/* ── ARMS ── */}
      <g data-part="arms">
        {arms(topColor, topS, skin, skinS, skinH, bodyPose)}
      </g>

      {/* ── NECK ── */}
      <rect x="44" y="56" width="12" height="12" rx="5" fill={skin} />
      <rect x="45" y="60" width="10" height="6" rx="4" fill={skinS} opacity="0.1" />

      {/* ── HEAD ── */}
      <g data-part="head">
        <ellipse cx="50" cy="36" rx="25" ry="24" fill={skin} />
        {/* jaw shadow */}
        <ellipse cx="50" cy="46" rx="18" ry="10" fill={skinS} opacity="0.08" />
        {/* forehead highlight */}
        <ellipse cx="47" cy="26" rx="12" ry="8" fill={skinH} opacity="0.18" />
      </g>

      {/* ── EARS ── */}
      <g data-part="ears">
        <ellipse cx="25" cy="37" rx="4" ry="5.5" fill={skin} />
        <ellipse cx="75" cy="37" rx="4" ry="5.5" fill={skin} />
        <ellipse cx="25" cy="38" rx="2.5" ry="3.5" fill={skinS} opacity="0.15" />
        <ellipse cx="75" cy="38" rx="2.5" ry="3.5" fill={skinS} opacity="0.15" />
        {accessory === 4 && <>
          <circle cx="24" cy="43" r="2" fill="#E8D4A0" />
          <circle cx="24" cy="43" r="1.2" fill="#F0E0B0" />
          <circle cx="76" cy="43" r="2" fill="#E8D4A0" />
          <circle cx="76" cy="43" r="1.2" fill="#F0E0B0" />
        </>}
      </g>

      {/* ── FACE ── */}
      <g data-part="face">
        {eyebrows(expression, hairColor)}
        <g className="avatar-eyes">
          {eyes(expression, eyeType, eyeColor)}
        </g>
        {/* nose */}
        <path d="M49 44.5 Q50 46.5 51 44.5" stroke={skinS} strokeWidth="1.2" fill="none" opacity="0.25" strokeLinecap="round" />
        {/* cheeks */}
        <ellipse cx="33" cy="44" rx="5" ry="3.2" fill={cheekColor} opacity="0.3" />
        <ellipse cx="67" cy="44" rx="5" ry="3.2" fill={cheekColor} opacity="0.3" />
        {mouth(expression)}
      </g>

      {/* ── HAIR ── */}
      <g data-part="hair">
        {hair(hairStyle, hairColor, hairS, hairH)}
      </g>

      {/* ── ACCESSORIES ── */}
      <g data-part="accessories">
        {accs(accessory, topColor, hairColor)}
      </g>
    </svg>
  );
}

/* ═══ POSE ═══ */
function getPose(p: number) {
  switch (p) {
    case 1: return { ll: -1, rl: 1 };
    case 2: return { ll: 0, rl: 0 };
    case 3: return { ll: 0, rl: 1 };
    case 4: return { ll: -1, rl: 1 };
    default: return { ll: 0, rl: 0 };
  }
}

/* ═══ LEGS ═══ */
function legs(c: string, s: string, bt: number, skin: string, shoe: string, shoeH: string, poses: { ll: number; rl: number }) {
  const lx = 37 + poses.ll;
  const rx = 55 + poses.rl;

  if (bt === 2) {
    return <>
      <path d="M32 82 Q35 80 50 80 Q65 80 68 82 L70 96 Q60 100 50 100 Q40 100 30 96Z" fill={c} />
      <path d="M35 90 Q50 94 65 90" stroke={s} strokeWidth="1" fill="none" opacity="0.2" />
      <rect x={lx} y="96" width="9" height="12" rx="4" fill={skin} opacity="0.9" />
      <rect x={rx} y="96" width="9" height="12" rx="4" fill={skin} opacity="0.9" />
      {shoes(lx + 4.5, rx + 4.5, shoe, shoeH)}
    </>;
  }

  const w = bt === 1 ? 12 : bt === 3 ? 9 : 10;
  const h = bt === 3 ? 14 : 19;
  const y = bt === 3 ? 86 : 84;

  return <>
    <rect x={lx} y={y} width={w} height={h} rx={w / 2.2} fill={c} />
    <rect x={lx} y={y + 6} width={w} height={6} rx={3} fill={s} opacity="0.15" />
    <rect x={rx} y={y} width={w} height={h} rx={w / 2.2} fill={c} />
    <rect x={rx} y={y + 6} width={w} height={6} rx={3} fill={s} opacity="0.15" />
    {shoes(lx + w / 2, rx + w / 2, shoe, shoeH)}
  </>;
}

function shoes(lx: number, rx: number, c: string, h: string) {
  return <>
    <ellipse cx={lx} cy="109" rx="7.5" ry="4" fill={c} />
    <ellipse cx={rx} cy="109" rx="7.5" ry="4" fill={c} />
    <ellipse cx={lx} cy="107.5" rx="6" ry="2.5" fill={h} opacity="0.25" />
    <ellipse cx={rx} cy="107.5" rx="6" ry="2.5" fill={h} opacity="0.25" />
    <ellipse cx={lx} cy="110.5" rx="7" ry="1.5" fill="#000" opacity="0.06" />
    <ellipse cx={rx} cy="110.5" rx="7" ry="1.5" fill="#000" opacity="0.06" />
  </>;
}

/* ═══ TORSO ═══ */
function torso(tc: string, ts: string, th: string, tt: number, skin: string, poses: { ll: number; rl: number }) {
  return <>
    {/* Main body */}
    <path d="M31 66 Q30 62 34 60 L66 60 Q70 62 69 66 L68 88 Q66 92 50 92 Q34 92 32 88Z" fill={tc} />
    {/* Side shadows */}
    <path d="M31 66 Q32 72 33 86" stroke={ts} strokeWidth="3" fill="none" opacity="0.12" />
    <path d="M69 66 Q68 72 67 86" stroke={ts} strokeWidth="3" fill="none" opacity="0.12" />
    {/* Hem */}
    <path d="M34 88 Q50 92 66 88" stroke={ts} strokeWidth="1.5" fill="none" opacity="0.15" />
    {/* Neckline detail */}
    {neckline(tt, tc, ts, th, skin)}
  </>;
}

function neckline(tt: number, tc: string, ts: string, th: string, skin: string) {
  switch (tt) {
    case 1: return <>
      <path d="M42 59 L50 70 L58 59" fill={skin} opacity="0.6" />
      <path d="M42 59 L50 70 L58 59" stroke={ts} strokeWidth="1.2" fill="none" opacity="0.3" />
    </>;
    case 2: return <>
      <path d="M42 59 Q50 64 58 59" fill={ts} opacity="0.15" />
      <path d="M42 58 L38 54 Q40 58 44 62" fill={th} opacity="0.6" />
      <path d="M58 58 L62 54 Q60 58 56 62" fill={th} opacity="0.6" />
      <path d="M42 58 L38 54" stroke={ts} strokeWidth="0.8" fill="none" opacity="0.3" />
      <path d="M58 58 L62 54" stroke={ts} strokeWidth="0.8" fill="none" opacity="0.3" />
      <circle cx="50" cy="68" r="1.2" fill={ts} opacity="0.2" />
      <circle cx="50" cy="75" r="1.2" fill={ts} opacity="0.2" />
      <circle cx="50" cy="82" r="1.2" fill={ts} opacity="0.2" />
    </>;
    case 3: return <>
      <path d="M40 58 Q50 66 60 58" fill={ts} opacity="0.2" />
      <path d="M36 56 Q42 50 50 50 Q58 50 64 56" stroke={ts} strokeWidth="2.5" fill="none" opacity="0.15" />
      <path d="M38 78 L62 78 L62 88 Q50 90 38 88Z" fill={ts} opacity="0.08" />
      <path d="M38 78 L62 78" stroke={ts} strokeWidth="1" opacity="0.15" />
      <line x1="46" y1="62" x2="45" y2="72" stroke={th} strokeWidth="1" opacity="0.3" />
      <line x1="54" y1="62" x2="55" y2="72" stroke={th} strokeWidth="1" opacity="0.3" />
    </>;
    case 4: return <>
      <path d="M44 60 L56 60 L56 88 Q50 90 44 88Z" fill={lt(tc, 20)} />
      <line x1="44" y1="60" x2="44" y2="88" stroke={ts} strokeWidth="2" opacity="0.3" />
      <line x1="56" y1="60" x2="56" y2="88" stroke={ts} strokeWidth="2" opacity="0.3" />
    </>;
    case 5: return <>
      <path d="M40 58 Q50 66 60 58" fill={th} opacity="0.3" />
      <path d="M40 58 Q43 62 46 58 Q48 62 50 59 Q52 62 54 58 Q57 62 60 58" stroke={th} strokeWidth="1.2" fill="none" opacity="0.4" />
    </>;
    default: return <>
      <path d="M42 60 Q50 65 58 60" fill={ts} opacity="0.2" />
      <path d="M42 59 Q50 63 58 59" stroke={ts} strokeWidth="1.5" fill="none" opacity="0.25" />
    </>;
  }
}

/* ═══ ARMS ═══ */
function arms(tc: string, ts: string, skin: string, skinS: string, skinH: string, bp: number) {
  switch (bp) {
    case 1: return <>
      <ellipse cx="28" cy="74" rx="6.5" ry="9" fill={tc} />
      <ellipse cx="28" cy="77" rx="5" ry="5" fill={ts} opacity="0.12" />
      <circle cx="28" cy="83.5" r="4.5" fill={skin} />
      <circle cx="28" cy="84.5" r="3" fill={skinS} opacity="0.08" />
      <path d="M68 66 Q76 72 72 82 Q70 86 66 84" fill={tc} />
      <circle cx="69" cy="84" r="4.5" fill={skin} />
    </>;
    case 2: return <>
      <path d="M30 65 Q28 70 30 80 Q34 82 40 78" fill={tc} />
      <path d="M70 65 Q72 70 70 80 Q66 82 60 78" fill={tc} />
      <path d="M38 76 Q50 80 62 76" fill={ts} opacity="0.15" />
      <circle cx="38" cy="77" r="4" fill={skin} />
      <circle cx="62" cy="77" r="4" fill={skin} />
    </>;
    case 3: return <>
      <ellipse cx="28" cy="74" rx="6.5" ry="9" fill={tc} />
      <ellipse cx="28" cy="77" rx="5" ry="5" fill={ts} opacity="0.12" />
      <circle cx="28" cy="83.5" r="4.5" fill={skin} />
      <path d="M66 64 Q74 58 78 48 Q80 44 78 42" fill={tc} />
      <g className="avatar-wave-hand">
        <circle cx="78" cy="42" r="5" fill={skin} />
        <path d="M76 38 L75 35" stroke={skin} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M78 37 L78 33.5" stroke={skin} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M80 38 L81 35" stroke={skin} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </>;
    case 4: return <>
      <path d="M30 64 Q26 70 28 80" fill={tc} />
      <path d="M70 64 Q74 70 72 80" fill={tc} />
      <path d="M30 64 Q26 70 28 80" stroke={ts} strokeWidth="1" fill="none" opacity="0.12" />
      <path d="M70 64 Q74 70 72 80" stroke={ts} strokeWidth="1" fill="none" opacity="0.12" />
    </>;
    default: return <>
      <ellipse cx="27" cy="74" rx="6.5" ry="9" fill={tc} transform="rotate(3 27 74)" />
      <ellipse cx="27" cy="77" rx="5" ry="5" fill={ts} opacity="0.12" />
      <circle cx="27" cy="83.5" r="4.5" fill={skin} />
      <circle cx="27" cy="84.5" r="3" fill={skinS} opacity="0.08" />
      <path d="M25 86 Q27 88 29 86" stroke={skinS} strokeWidth="0.8" fill="none" opacity="0.15" />
      <ellipse cx="73" cy="75" rx="6.5" ry="8.5" fill={tc} transform="rotate(-2 73 75)" />
      <ellipse cx="73" cy="78" rx="5" ry="5" fill={ts} opacity="0.12" />
      <circle cx="73" cy="84" r="4.5" fill={skin} />
      <circle cx="73" cy="85" r="3" fill={skinS} opacity="0.08" />
    </>;
  }
}

/* ═══ EYEBROWS ═══ */
function eyebrows(exp: number, hc: string) {
  const c = dk(hc, 8);
  const o = 0.5;
  switch (exp) {
    case 1: return <>
      <path d="M34 31 Q38 29 43 30.5" stroke={c} strokeWidth="1.8" fill="none" opacity={o} strokeLinecap="round" />
      <path d="M57 30.5 Q62 29 66 31" stroke={c} strokeWidth="1.8" fill="none" opacity={o} strokeLinecap="round" />
    </>;
    case 2: return <>
      <path d="M34 31 Q38 29 43 31" stroke={c} strokeWidth="1.8" fill="none" opacity={o} strokeLinecap="round" />
      <path d="M57 29 Q62 27 66 30" stroke={c} strokeWidth="2" fill="none" opacity={o} strokeLinecap="round" />
    </>;
    case 3: return <>
      <path d="M34 29.5 Q38 27 43 29" stroke={c} strokeWidth="1.8" fill="none" opacity={o} strokeLinecap="round" />
      <path d="M57 29 Q62 27 66 29.5" stroke={c} strokeWidth="1.8" fill="none" opacity={o} strokeLinecap="round" />
    </>;
    case 4: return <>
      <path d="M35 30 Q38 29.5 43 31" stroke={c} strokeWidth="1.6" fill="none" opacity={o * 0.8} strokeLinecap="round" />
      <path d="M57 31 Q62 29.5 65 30" stroke={c} strokeWidth="1.6" fill="none" opacity={o * 0.8} strokeLinecap="round" />
    </>;
    case 5: return <>
      <path d="M33 30 L43 29" stroke={c} strokeWidth="2.2" fill="none" opacity={o * 0.9} strokeLinecap="round" />
      <path d="M57 29 L67 30" stroke={c} strokeWidth="2.2" fill="none" opacity={o * 0.9} strokeLinecap="round" />
    </>;
    default: return <>
      <path d="M34 30.5 Q38 28.5 43 30" stroke={c} strokeWidth="2" fill="none" opacity={o} strokeLinecap="round" />
      <path d="M57 30 Q62 28.5 66 30.5" stroke={c} strokeWidth="2" fill="none" opacity={o} strokeLinecap="round" />
    </>;
  }
}

/* ═══ EYES ═══ */
function eyes(exp: number, et: number, ec: string) {
  if (exp === 2) return <>
    <path d="M35 39 Q39 43 43 39" stroke="#2A2A3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    {singleEye(61, 38.5, et, ec, false)}
  </>;
  if (exp === 3) return <>
    <path d="M35 39 Q39 43 43 39" stroke="#2A2A3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M57 39 Q61 43 65 39" stroke="#2A2A3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
  </>;
  const half = exp === 5;
  const gentle = exp === 4;
  return <>
    {singleEye(39, 38.5, et, ec, half, gentle)}
    {singleEye(61, 38.5, et, ec, half, gentle)}
  </>;
}

function eyeShape(et: number) {
  switch (et) {
    case 1: return { rx: 4.5, ry: 3.5, ir: 2.8, pr: 1.6 };
    case 2: return { rx: 4.5, ry: 4, ir: 3, pr: 1.8 };
    case 3: return { rx: 4.2, ry: 3.2, ir: 2.6, pr: 1.5 };
    default: return { rx: 4.2, ry: 4, ir: 3, pr: 1.8 };
  }
}

function singleEye(cx: number, cy: number, et: number, ec: string, half: boolean, gentle?: boolean) {
  const s = eyeShape(et);
  const ry = half ? s.ry * 0.6 : gentle ? s.ry * 0.9 : s.ry;
  return <g>
    {/* White */}
    <ellipse cx={cx} cy={cy} rx={s.rx} ry={ry} fill="#FAFAFA" />
    <ellipse cx={cx} cy={cy} rx={s.rx} ry={ry} fill="none" stroke="#E0D8D0" strokeWidth="0.5" opacity="0.4" />
    {/* Iris */}
    <ellipse cx={cx + 0.3} cy={cy + 0.3} rx={s.ir} ry={Math.min(s.ir, ry - 0.5)} fill={ec} />
    {/* Inner iris lighter */}
    <ellipse cx={cx + 0.2} cy={cy} rx={s.ir * 0.6} ry={Math.min(s.ir * 0.6, ry - 1)} fill={lt(ec, 15)} opacity="0.3" />
    {/* Pupil */}
    <circle cx={cx + 0.3} cy={cy + 0.5} r={Math.min(s.pr, ry - 1.5)} fill="#1A1A2A" />
    {/* Highlight */}
    <circle cx={cx - 1} cy={cy - 1} r={1.3} fill="#fff" opacity="0.85" />
    <circle cx={cx + 1.5} cy={cy + 1} r={0.7} fill="#fff" opacity="0.5" />
    {/* Upper lid shadow */}
    {!half && <path
      d={`M${cx - s.rx} ${cy - ry * 0.3} Q${cx} ${cy - ry - 1} ${cx + s.rx} ${cy - ry * 0.3}`}
      stroke="#2A2A3A" strokeWidth="0.8" fill="none" opacity="0.12"
    />}
    {/* Lash line */}
    <path
      d={`M${cx - s.rx} ${cy} Q${cx} ${cy - ry - 0.5} ${cx + s.rx} ${cy}`}
      stroke="#3A3A4A" strokeWidth={half ? "1.8" : "1.2"} fill="none" opacity="0.25" strokeLinecap="round"
    />
  </g>;
}

/* ═══ MOUTH ═══ */
function mouth(exp: number) {
  switch (exp) {
    case 1: return <>
      <path d="M44 49 Q50 54.5 56 49" stroke="#D87070" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M46 49.5 Q50 52 54 49.5" fill="#F5A0A0" opacity="0.15" />
    </>;
    case 2: return <>
      <path d="M44 49 Q50 55 56 49" stroke="#D87070" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M46 49 Q50 53 54 49" fill="#F5A0A0" opacity="0.2" />
    </>;
    case 3: return <>
      <path d="M43 48 Q50 57 57 48" stroke="#D87070" strokeWidth="2" fill="#F8C0C0" fillOpacity="0.35" strokeLinecap="round" />
      <ellipse cx="50" cy="53" rx="4" ry="2.5" fill="#E89090" opacity="0.3" />
    </>;
    case 4: return <path d="M45 49 Q50 52 55 49" stroke="#C8857A" strokeWidth="1.5" fill="none" strokeLinecap="round" />;
    case 5: return <path d="M44 50 Q48 50.5 50 49.5 Q54 49 56 50.5" stroke="#B0706A" strokeWidth="1.6" fill="none" strokeLinecap="round" />;
    default: return <path d="M45 49.5 Q50 51.5 55 49.5" stroke="#C4756C" strokeWidth="1.6" fill="none" strokeLinecap="round" />;
  }
}

/* ═══ HAIR ═══ */
function hair(s: number, c: string, sh: string, hi: string) {
  switch (s) {
    case 0: return <>
      <path d="M27 30 Q30 14 50 12 Q70 14 73 30 L73 36 Q70 28 50 22 Q30 28 27 36Z" fill={c} />
      <path d="M32 26 Q50 14 68 26" fill={hi} opacity="0.15" />
      <path d="M28 32 Q26 36 28 40" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M72 32 Q74 36 72 40" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M40 16 Q45 14 50 15" stroke={sh} strokeWidth="1" fill="none" opacity="0.15" />
      <path d="M55 15 Q60 14 65 17" stroke={sh} strokeWidth="1" fill="none" opacity="0.12" />
      <path d="M29 34 Q28 38 30 42" stroke={c} strokeWidth="3" fill="none" />
      <path d="M71 34 Q72 38 70 42" stroke={c} strokeWidth="3" fill="none" />
    </>;
    case 1: return <>
      <path d="M24 34 Q28 12 50 8 Q72 12 76 34 L76 42 Q72 30 50 22 Q28 30 24 42Z" fill={c} />
      <path d="M24 36 Q20 42 22 52" stroke={c} strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <path d="M76 36 Q80 42 78 52" stroke={c} strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <path d="M28 30 Q50 12 72 30" fill={hi} opacity="0.12" />
      <path d="M30 34 Q28 42 30 50" stroke={sh} strokeWidth="1.5" fill="none" opacity="0.1" />
      <path d="M70 34 Q72 42 70 50" stroke={sh} strokeWidth="1.5" fill="none" opacity="0.1" />
      <path d="M36 28 Q40 24 44 28" stroke={c} strokeWidth="3" fill="none" />
      <path d="M52 27 Q56 23 60 27" stroke={c} strokeWidth="3" fill="none" />
    </>;
    case 2: return <>
      <path d="M24 32 Q28 10 50 6 Q72 10 76 32 L76 38 Q72 26 50 20 Q28 26 24 38Z" fill={c} />
      <path d="M22 36 Q16 48 18 72 Q20 78 24 76" stroke={c} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M78 36 Q84 48 82 72 Q80 78 76 76" stroke={c} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M22 42 Q18 54 20 68" stroke={sh} strokeWidth="3" fill="none" opacity="0.15" />
      <path d="M78 42 Q82 54 80 68" stroke={sh} strokeWidth="3" fill="none" opacity="0.15" />
      <path d="M24 38 Q20 48 22 60" stroke={hi} strokeWidth="2" fill="none" opacity="0.15" />
      <path d="M76 38 Q80 48 78 60" stroke={hi} strokeWidth="2" fill="none" opacity="0.15" />
      <path d="M28 28 Q50 10 72 28" fill={hi} opacity="0.1" />
      <path d="M32 30 Q36 24 40 30" stroke={c} strokeWidth="4" fill="none" />
      <path d="M44 28 Q48 22 52 28" stroke={c} strokeWidth="4" fill="none" />
      <path d="M56 28 Q60 22 64 28" stroke={c} strokeWidth="3.5" fill="none" />
      <path d="M20 70 Q18 74 22 76" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M80 70 Q82 74 78 76" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>;
    case 3: return <>
      <path d="M24 28 Q28 8 50 6 Q72 8 76 28 L78 52 Q76 60 70 60 L30 60 Q24 60 22 52Z" fill={c} />
      <path d="M28 24 Q50 8 72 24" fill={hi} opacity="0.12" />
      <path d="M28 50 Q50 44 72 50" fill={sh} opacity="0.12" />
      <path d="M28 56 Q32 62 36 58" stroke={sh} strokeWidth="1.5" fill="none" opacity="0.15" />
      <path d="M72 56 Q68 62 64 58" stroke={sh} strokeWidth="1.5" fill="none" opacity="0.15" />
      <path d="M32 28 L32 32" stroke={c} strokeWidth="5" strokeLinecap="round" />
      <path d="M40 26 L40 31" stroke={c} strokeWidth="5" strokeLinecap="round" />
      <path d="M48 25 L48 30" stroke={c} strokeWidth="5" strokeLinecap="round" />
      <path d="M56 25 L56 30" stroke={c} strokeWidth="5" strokeLinecap="round" />
      <path d="M64 26 L64 31" stroke={c} strokeWidth="5" strokeLinecap="round" />
    </>;
    case 4: return <>
      <path d="M26 30 Q30 12 50 10 Q70 12 74 30 L74 36 Q70 26 50 20 Q30 26 26 36Z" fill={c} />
      <path d="M70 24 Q78 20 82 28 Q86 44 80 56 Q76 60 74 54 Q78 40 74 30" fill={c} />
      <path d="M74 30 Q80 28 82 34" fill={sh} opacity="0.15" />
      <ellipse cx="72" cy="26" rx="3" ry="2.5" fill={dk(c, 25)} opacity="0.4" />
      <path d="M78 30 Q82 40 80 50" stroke={hi} strokeWidth="2" fill="none" opacity="0.15" />
      <path d="M30 30 Q34 24 38 30" stroke={c} strokeWidth="3.5" fill="none" />
      <path d="M42 28 Q46 22 50 28" stroke={c} strokeWidth="3.5" fill="none" />
      <path d="M28 34 Q26 38 28 42" stroke={c} strokeWidth="3" fill="none" />
    </>;
    case 5: return <>
      <path d="M22 36 Q26 8 50 4 Q74 8 78 36 L78 42 Q74 30 50 22 Q26 30 22 42Z" fill={c} />
      <path d="M24 34 Q30 22 44 28 L44 34 Q30 28 26 36Z" fill={c} />
      <path d="M24 36 L22 44" stroke={c} strokeWidth="5" strokeLinecap="round" />
      <path d="M30 24 Q38 16 50 20" stroke={sh} strokeWidth="1.5" fill="none" opacity="0.12" />
      <path d="M55 18 Q65 14 72 24" stroke={sh} strokeWidth="1.5" fill="none" opacity="0.1" />
      <path d="M30 30 Q50 10 70 30" fill={hi} opacity="0.1" />
      <path d="M74 36 Q76 40 74 42" stroke={c} strokeWidth="4" fill="none" />
    </>;
    case 6: return <>
      <path d="M24 32 Q28 10 50 8 Q72 10 76 32 L76 40 Q72 28 50 22 Q28 28 24 40Z" fill={c} />
      <line x1="50" y1="10" x2="50" y2="26" stroke={sh} strokeWidth="1.5" opacity="0.2" />
      <path d="M24 34 Q20 42 22 54" stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M76 34 Q80 42 78 54" stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M48 24 Q44 20 36 26" stroke={c} strokeWidth="4" fill="none" />
      <path d="M52 24 Q56 20 64 26" stroke={c} strokeWidth="4" fill="none" />
      <path d="M30 28 Q40 14 50 16" fill={hi} opacity="0.1" />
      <path d="M50 16 Q60 14 70 28" fill={hi} opacity="0.08" />
    </>;
    case 7: return <>
      <path d="M22 34 Q26 8 50 4 Q74 8 78 34 L78 40 Q74 28 50 20 Q26 28 22 40Z" fill={c} />
      <path d="M22 38 Q16 50 20 68" stroke={c} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M78 38 Q84 50 80 68" stroke={c} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M28 32 Q32 24 38 30" stroke={c} strokeWidth="4" fill="none" />
      <path d="M36 28 Q42 20 48 28" stroke={c} strokeWidth="3.5" fill="none" />
      <path d="M46 26 Q50 20 54 26" stroke={c} strokeWidth="3" fill="none" />
      <path d="M52 28 Q58 20 64 28" stroke={c} strokeWidth="3.5" fill="none" />
      <path d="M62 30 Q68 24 72 32" stroke={c} strokeWidth="4" fill="none" />
      <path d="M24 44 Q20 52 22 64" stroke={sh} strokeWidth="2" fill="none" opacity="0.12" />
      <path d="M76 44 Q80 52 78 64" stroke={sh} strokeWidth="2" fill="none" opacity="0.12" />
      <path d="M30 28 Q50 8 70 28" fill={hi} opacity="0.1" />
    </>;
    default: return <>
      <path d="M27 30 Q30 14 50 12 Q70 14 73 30 L73 36 Q70 28 50 22 Q30 28 27 36Z" fill={c} />
      <path d="M32 26 Q50 14 68 26" fill={hi} opacity="0.15" />
    </>;
  }
}

/* ═══ ACCESSORIES ═══ */
function accs(a: number, tc: string, hc: string) {
  switch (a) {
    case 1: return <>
      <circle cx="39" cy="38.5" r="7.5" fill="none" stroke="#5A5A6A" strokeWidth="1.5" />
      <circle cx="61" cy="38.5" r="7.5" fill="none" stroke="#5A5A6A" strokeWidth="1.5" />
      <path d="M46.5 38.5 Q50 36.5 53.5 38.5" stroke="#5A5A6A" strokeWidth="1.2" fill="none" />
      <line x1="31.5" y1="38" x2="26" y2="37" stroke="#5A5A6A" strokeWidth="1" />
      <line x1="68.5" y1="38" x2="74" y2="37" stroke="#5A5A6A" strokeWidth="1" />
      <path d="M35 35 Q37 34 38 36" stroke="#fff" strokeWidth="1" fill="none" opacity="0.2" />
      <path d="M57 35 Q59 34 60 36" stroke="#fff" strokeWidth="1" fill="none" opacity="0.2" />
    </>;
    case 2: return <>
      <path d="M28 20 Q30 6 50 4 Q70 6 72 20Z" fill={tc} />
      <path d="M30 18 Q50 8 70 18" fill={lt(tc, 8)} opacity="0.3" />
      <ellipse cx="50" cy="22" rx="30" ry="6" fill={dk(tc, 8)} />
      <ellipse cx="50" cy="21" rx="29" ry="5" fill={tc} />
      <circle cx="50" cy="6" r="2" fill={dk(tc, 15)} opacity="0.4" />
      <line x1="50" y1="6" x2="50" y2="20" stroke={dk(tc, 10)} strokeWidth="0.8" opacity="0.2" />
    </>;
    case 3: return <>
      <path d="M22 34 Q22 10 50 8 Q78 10 78 34" stroke="#555" strokeWidth="3.5" fill="none" />
      <path d="M38 10 Q50 6 62 10" stroke="#666" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="15" y="30" width="11" height="16" rx="5" fill="#555" />
      <rect x="74" y="30" width="11" height="16" rx="5" fill="#555" />
      <rect x="16" y="32" width="9" height="12" rx="4" fill="#666" />
      <rect x="75" y="32" width="9" height="12" rx="4" fill="#666" />
      <rect x="17" y="34" width="3" height="5" rx="1.5" fill="#888" opacity="0.3" />
      <rect x="76" y="34" width="3" height="5" rx="1.5" fill="#888" opacity="0.3" />
    </>;
    case 4: return null; // Earrings rendered in ears
    case 5: return <>
      <path d="M36 56 Q50 62 64 56 Q66 60 64 64 Q50 68 36 64 Q34 60 36 56Z" fill={tc} opacity="0.85" />
      <path d="M36 58 Q50 64 64 58" stroke={dk(tc, 8)} strokeWidth="1" fill="none" opacity="0.2" />
      <path d="M38 64 Q36 72 40 78" stroke={tc} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M39 74 L41 78 L37 78Z" fill={tc} />
      <path d="M40 58 Q42 60 44 58" stroke={lt(tc, 10)} strokeWidth="0.8" fill="none" opacity="0.3" />
      <path d="M48 59 Q50 61 52 59" stroke={lt(tc, 10)} strokeWidth="0.8" fill="none" opacity="0.3" />
    </>;
    default: return null;
  }
}

/* ═══ COLOR UTILS ═══ */
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
