/**
 * SLOTY Avatar System — Phase-based avatar generation foundation.
 *
 * Phase 1: 3 base bodies (male/female/neutral) with fixed anchor coordinates
 * Phase 2: Face parts with anchor-relative positioning
 * Phase 3: Hair parts with base-compatible restrictions
 * Phase 4: Clothing with body-compatible restrictions
 * Phase 5: Body type variants with safe scaling
 * Phase 6: Plaza integration
 *
 * Core principle: every position is derived from anchors.
 * No magic numbers. No random generation. Safe combinations only.
 */

// ═══════════════════════════════════════════════════════
// Phase 1: Base Body Types
// ═══════════════════════════════════════════════════════

export type BaseBody = "male" | "female" | "neutral";

export const BASE_BODY_NAMES: Record<BaseBody, string> = {
  male: "男性ベース",
  female: "女性ベース",
  neutral: "中性ベース",
};

/**
 * Fixed body parameters per base. These define the fundamental proportions
 * and NEVER change within a base type. This is the "stable skeleton".
 */
const BASE_PARAMS: Record<BaseBody, {
  headRx: number;       // Base head ellipse X radius
  headRy: number;       // Base head ellipse Y radius
  shoulderHW: number;   // Shoulder half-width
  torsoHeight: number;  // Torso length
  legHeight: number;    // Leg length
}> = {
  male:    { headRx: 25, headRy: 28, shoulderHW: 25, torsoHeight: 30, legHeight: 22 },
  female:  { headRx: 27, headRy: 30, shoulderHW: 22, torsoHeight: 28, legHeight: 20 },
  neutral: { headRx: 26, headRy: 29, shoulderHW: 24, torsoHeight: 29, legHeight: 21 },
};

// ═══════════════════════════════════════════════════════
// Phase 2: Face Shape Modifiers
// ═══════════════════════════════════════════════════════

/** Small adjustments to head shape. Applied ON TOP of base params. */
const FACE_SHAPE_MODS: Record<number, { dRx: number; dRy: number }> = {
  0: { dRx: 0, dRy: 0 },      // まる — default
  1: { dRx: -1, dRy: 2 },     // たまご — slightly taller
  2: { dRx: -2, dRy: -2 },    // やや角 — slightly smaller/squarer
  3: { dRx: -3, dRy: 1 },     // ほそめ — narrower
};

// ═══════════════════════════════════════════════════════
// Phase 5: Body Type Scaling
// ═══════════════════════════════════════════════════════

const BODY_TYPE_SCALE: Record<number, { widthMul: number; heightMul: number }> = {
  0: { widthMul: 1.0,  heightMul: 1.0 },   // 標準
  1: { widthMul: 0.9,  heightMul: 0.92 },   // 小柄
  2: { widthMul: 0.88, heightMul: 0.95 },   // 細身
  3: { widthMul: 1.1,  heightMul: 1.06 },   // がっしり
};

// ═══════════════════════════════════════════════════════
// Anchor System — THE foundation
// ═══════════════════════════════════════════════════════

export type Anchors = {
  // Head
  headCx: number;        // Head center X (always 50)
  headCy: number;        // Head center Y (always 38)
  headRx: number;        // Computed head X radius
  headRy: number;        // Computed head Y radius
  headTop: number;       // Top of head (headCy - headRy)

  // Face features — all proportional to headRy
  eyeLine: number;       // Y: eye centers
  eyeSpacing: number;    // X: distance from center to each eye
  browLine: number;      // Y: eyebrows
  noseLine: number;      // Y: nose
  mouthLine: number;     // Y: mouth
  cheekLine: number;     // Y: cheeks

  // Connection chain: head → neck → body
  neckTop: number;       // Y: where neck meets head (inside head ellipse)
  neckBottom: number;    // Y: where neck meets body

  // Body
  shoulderLine: number;  // Y: shoulder line
  shoulderHW: number;    // Half-width of shoulders
  bodyTop: number;       // Y: top of torso
  bodyBottom: number;    // Y: bottom of torso
  hipHW: number;         // Half-width of hips

  // Legs
  footBase: number;      // Y: bottom of feet

  // Ground
  shadowY: number;       // Y: shadow ellipse
  viewBoxH: number;      // Total viewBox height
};

/**
 * Compute all anchor points from base body + face shape + body type.
 * This is the SINGLE SOURCE OF TRUTH for all avatar positioning.
 */
export function computeAnchors(base: BaseBody, faceShape: number, bodyType: number): Anchors {
  const bp = BASE_PARAMS[base];
  const fm = FACE_SHAPE_MODS[faceShape] ?? FACE_SHAPE_MODS[0];
  const bt = BODY_TYPE_SCALE[bodyType] ?? BODY_TYPE_SCALE[0];

  // Fixed origin
  const headCx = 50;
  const headCy = 38;

  // Head shape = base + face modifier
  const headRx = bp.headRx + fm.dRx;
  const headRy = bp.headRy + fm.dRy;
  const headTop = headCy - headRy;

  // Face features — proportional to headRy so they stay inside face
  const eyeLine = headCy + headRy * 0.07;
  const eyeSpacing = 10;
  const browLine = headCy - headRy * 0.17;
  const noseLine = headCy + headRy * 0.25;
  const mouthLine = headCy + headRy * 0.40;
  const cheekLine = headCy + headRy * 0.25;

  // Neck — bridges head to body
  const neckTop = headCy + headRy - 2;
  const neckBottom = neckTop + 8;

  // Body — derived from base params + body type
  const shoulderHW = bp.shoulderHW * bt.widthMul;
  const shoulderLine = neckBottom;
  const bodyTop = shoulderLine;
  const torsoH = bp.torsoHeight * bt.heightMul;
  const bodyBottom = bodyTop + torsoH;
  const hipHW = shoulderHW * 0.9;
  const legH = bp.legHeight * bt.heightMul;
  const footBase = bodyBottom + legH;

  // Ground
  const shadowY = footBase + 3;
  const viewBoxH = Math.round(shadowY + 5);

  return {
    headCx, headCy, headRx, headRy, headTop,
    eyeLine, eyeSpacing, browLine, noseLine, mouthLine, cheekLine,
    neckTop, neckBottom,
    shoulderLine, shoulderHW, bodyTop, bodyBottom, hipHW,
    footBase, shadowY, viewBoxH,
  };
}

// ═══════════════════════════════════════════════════════
// Compatibility Maps — safe combinations only
// ═══════════════════════════════════════════════════════

export const COMPAT: Record<string, Record<BaseBody, readonly number[]>> = {
  faceShape: {
    male:    [0, 2],           // まる, やや角
    female:  [0, 1],           // まる, たまご
    neutral: [0, 1, 3],        // まる, たまご, ほそめ
  },
  eyeType: {
    male:    [0, 2, 3, 5, 6],           // まる, つり目, 細め, ジト目, 半目
    female:  [0, 1, 4, 7],              // まる, たれ目, キラキラ, にっこり
    neutral: [0, 1, 2, 3, 5, 6, 7],     // all except キラキラ
  },
  browType: {
    male:    [0, 3, 4, 5],     // ナチュラル, キリッ, 太め, 薄め
    female:  [0, 1, 2, 5],     // ナチュラル, 平行, 困り, 薄め
    neutral: [0, 1, 2, 5],     // ナチュラル, 平行, 困り, 薄め
  },
  mouthType: {
    male:    [0, 2, 3, 4, 5],  // 微笑み, 真顔, ちょい不満, ニヤリ, への字
    female:  [0, 1, 6, 7],     // 微笑み, にっこり, ぽかん, にー
    neutral: [0, 1, 2, 5, 7],  // 微笑み, にっこり, 真顔, への字, にー
  },
  hairStyle: {
    male:    [0, 1, 2, 3, 11],          // メンズ系 + 中性ショート
    female:  [4, 5, 6, 7, 8, 9, 10],    // レディース系
    neutral: [1, 2, 4, 5, 9, 11],       // マッシュ, センター, ボブ, ミディアム, ポニテ, 中性
  },
  topType: {
    male:    [0, 1, 2, 3, 4, 5, 8, 9],     // Tシャツ〜ニット, ベスト, ジャケット
    female:  [0, 2, 3, 5, 6, 7, 10, 11],    // Tシャツ, シャツ, パーカー, ニット, カーディガン, ブラウス, ワンピ, セーラー
    neutral: [0, 1, 2, 3, 4, 5, 6],         // 中性的な服
  },
  bottomType: {
    male:    [0, 1, 2, 3],              // パンツ系
    female:  [0, 3, 4, 5, 7],           // パンツ+スカート+レギンス
    neutral: [0, 1, 2, 3, 7],           // パンツ系+レギンス
  },
  bodyType: {
    male:    [0, 1, 2, 3],    // all
    female:  [0, 1, 2],       // no がっしり
    neutral: [0, 1, 2],       // no がっしり
  },
  accessory: {
    male:    [0, 1, 2, 3, 4, 5, 7],     // no ピアス, no リボン
    female:  [0, 1, 2, 4, 6, 7, 8],     // no キャップ, no ヘッドホン
    neutral: [0, 1, 2, 3, 4, 5, 6, 7, 8], // all
  },
};

/** Check if a specific value is compatible with a base body */
export function isCompatible(base: BaseBody, field: string, value: number): boolean {
  const allowed = COMPAT[field]?.[base];
  if (!allowed) return true; // no restriction
  return allowed.includes(value);
}

/** Get allowed values for a field given a base body */
export function getAllowed(base: BaseBody, field: string): readonly number[] {
  return COMPAT[field]?.[base] ?? [];
}

/**
 * Sanitize an avatar style to ensure all parts are compatible with the base.
 * If a part is incompatible, reset it to the first allowed value.
 */
export function sanitizeStyle(base: BaseBody, style: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...style, base };
  for (const field of Object.keys(COMPAT)) {
    const value = result[field];
    if (typeof value === "number" && !isCompatible(base, field, value)) {
      const allowed = getAllowed(base, field);
      result[field] = allowed.length > 0 ? allowed[0] : 0;
    }
  }
  return result;
}
