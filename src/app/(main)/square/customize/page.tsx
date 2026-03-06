"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AvatarFigure from "@/components/square/AvatarFigure";
import {
  FACE_SHAPE_NAMES, EYE_TYPE_NAMES, EYE_COLORS, BROW_TYPE_NAMES,
  MOUTH_TYPE_NAMES, CHEEK_TYPE_NAMES, CHEEK_COLORS, NOSE_TYPE_NAMES,
  HAIR_STYLE_NAMES, HAIR_COLORS, BODY_TYPE_NAMES, SKIN_TONES,
  TOP_TYPE_NAMES, TOP_COLORS, BOTTOM_TYPE_NAMES, BOTTOM_COLORS,
  ACCESSORY_NAMES, AVATAR_PRESETS,
} from "@/lib/demo-data";
import type { AvatarStyle } from "@/lib/demo-data";
import { BASE_BODY_NAMES, getAllowed, sanitizeStyle } from "@/lib/avatar-system";
import type { BaseBody } from "@/lib/avatar-system";

/** Guided flow steps */
type Step = "base" | "preset" | "face" | "hair" | "outfit" | "accessory";

type Category =
  | "faceShape" | "eyeType" | "eyeColor" | "browType" | "mouthType"
  | "cheekType" | "cheekColor" | "noseType"
  | "hairStyle" | "hairColor" | "bodyType" | "skinTone"
  | "topType" | "topColor" | "bottomType" | "bottomColor" | "accessory";

/** Categories that have compatibility restrictions */
const COMPAT_FIELDS: Category[] = [
  "faceShape", "eyeType", "browType", "mouthType",
  "hairStyle", "bodyType", "topType", "bottomType", "accessory",
];

/** Step definitions for guided flow */
const GUIDED_STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "face", label: "顔", icon: "face" },
  { key: "hair", label: "髪", icon: "hair" },
  { key: "outfit", label: "服", icon: "outfit" },
  { key: "accessory", label: "仕上げ", icon: "acc" },
];

/** Categories grouped by guided step */
const STEP_CATEGORIES: Record<string, { key: Category; label: string }[]> = {
  face: [
    { key: "faceShape", label: "輪郭" },
    { key: "eyeType", label: "目" },
    { key: "eyeColor", label: "瞳色" },
    { key: "browType", label: "眉" },
    { key: "mouthType", label: "口" },
    { key: "noseType", label: "鼻" },
    { key: "cheekType", label: "チーク" },
    { key: "cheekColor", label: "チーク色" },
    { key: "skinTone", label: "肌" },
  ],
  hair: [
    { key: "hairStyle", label: "髪型" },
    { key: "hairColor", label: "髪色" },
  ],
  outfit: [
    { key: "topType", label: "トップス" },
    { key: "topColor", label: "トップス色" },
    { key: "bottomType", label: "ボトムス" },
    { key: "bottomColor", label: "ボトムス色" },
  ],
  accessory: [
    { key: "bodyType", label: "体型" },
    { key: "accessory", label: "小物" },
  ],
};

const DEFAULT_STYLE: AvatarStyle = AVATAR_PRESETS[0].style;

export default function CustomizePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("base");
  const [style, setStyle] = useState<AvatarStyle>(DEFAULT_STYLE);
  const [activeCategory, setActiveCategory] = useState<Category>("eyeType");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sloty_avatar_style");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.base && parsed.faceShape !== undefined) {
          setStyle(parsed);
          setStep("face");
        }
      }
    } catch { /* ignore */ }
  }, []);

  const update = (partial: Partial<AvatarStyle>) => setStyle((s) => ({ ...s, ...partial }));

  const changeBase = (base: BaseBody) => {
    setStyle((s) => {
      const sanitized = sanitizeStyle(base, { ...s, base }) as unknown as AvatarStyle;
      return sanitized;
    });
  };

  const save = () => {
    localStorage.setItem("sloty_avatar_style", JSON.stringify(style));
    router.back();
  };

  const selectPreset = (preset: AvatarStyle) => {
    setStyle(preset);
    setStep("face");
  };

  /** Navigate between guided steps */
  const goBack = () => {
    const idx = GUIDED_STEPS.findIndex((s) => s.key === step);
    if (idx > 0) {
      const prev = GUIDED_STEPS[idx - 1].key;
      setStep(prev);
      setActiveCategory(STEP_CATEGORIES[prev][0].key);
    } else if (step === "face") {
      setStep("preset");
    } else if (step === "preset") {
      setStep("base");
    } else {
      router.back();
    }
  };

  const goNext = () => {
    const idx = GUIDED_STEPS.findIndex((s) => s.key === step);
    if (idx < GUIDED_STEPS.length - 1) {
      const next = GUIDED_STEPS[idx + 1].key;
      setStep(next);
      setActiveCategory(STEP_CATEGORIES[next][0].key);
    } else {
      save();
    }
  };

  // ── Step 1: Base body selection ──
  if (step === "base") {
    const bases: BaseBody[] = ["male", "female", "neutral"];
    return (
      <div className="px-5 pt-3 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="text-lg font-bold">アバターを作ろう</h1>
        </div>

        <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
          まずはベースとなる体型を選んでね
        </p>

        <div className="grid grid-cols-3 gap-3">
          {bases.map((base) => {
            const previewStyle: AvatarStyle = { ...DEFAULT_STYLE, base };
            return (
              <button
                key={base}
                onClick={() => { changeBase(base); setStep("preset"); }}
                className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all active:scale-95"
                style={{
                  backgroundColor: style.base === base ? "var(--accent-soft)" : "var(--card)",
                  border: style.base === base ? "2px solid var(--accent)" : "1px solid var(--border)",
                }}
              >
                <div className="rounded-xl p-1" style={{ background: "var(--gradient-soft)" }}>
                  <AvatarFigure style={previewStyle} size={72} />
                </div>
                <span className="text-[12px] font-semibold">{BASE_BODY_NAMES[base]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Step 2: Preset selection ──
  if (step === "preset") {
    const filteredPresets = AVATAR_PRESETS.filter((p) => p.style.base === style.base);
    return (
      <div className="px-5 pt-3 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setStep("base")} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="text-lg font-bold">雰囲気を選ぼう</h1>
          <span className="text-[11px] rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
            {BASE_BODY_NAMES[style.base]}
          </span>
        </div>

        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          好みの雰囲気を選んで、あとから細かく変えられるよ
        </p>

        {filteredPresets.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {filteredPresets.map((preset, i) => (
              <button
                key={i}
                onClick={() => selectPreset(preset.style)}
                className="flex flex-col items-center gap-2 rounded-2xl p-3 transition-all active:scale-95"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="rounded-xl p-1" style={{ background: "var(--gradient-soft)" }}>
                  <AvatarFigure style={preset.style} size={64} />
                </div>
                <span className="text-[11px] font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-center py-6" style={{ color: "var(--muted)" }}>
            この素体のプリセットはまだないよ
          </p>
        )}

        <button
          onClick={() => { setStep("face"); setActiveCategory("eyeType"); }}
          className="mt-4 w-full rounded-xl py-2.5 text-[12px] font-medium"
          style={{ color: "var(--muted)", backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
        >
          スキップして自分で作る
        </button>
      </div>
    );
  }

  // ── Steps 3-6: Guided detail editing ──
  const currentStepIdx = GUIDED_STEPS.findIndex((s) => s.key === step);
  const isLastStep = currentStepIdx === GUIDED_STEPS.length - 1;
  const categories = STEP_CATEGORIES[step] ?? [];

  /** Get allowed indices for a compatibility-restricted field */
  const allowed = (field: Category): readonly number[] => {
    if (COMPAT_FIELDS.includes(field)) {
      return getAllowed(style.base, field);
    }
    return [];
  };

  /** Name lookup map for each named-grid category */
  const nameMap: Record<string, string[]> = {
    hairStyle: HAIR_STYLE_NAMES,
    faceShape: FACE_SHAPE_NAMES,
    eyeType: EYE_TYPE_NAMES,
    browType: BROW_TYPE_NAMES,
    mouthType: MOUTH_TYPE_NAMES,
    cheekType: CHEEK_TYPE_NAMES,
    noseType: NOSE_TYPE_NAMES,
    bodyType: BODY_TYPE_NAMES,
    topType: TOP_TYPE_NAMES,
    bottomType: BOTTOM_TYPE_NAMES,
    accessory: ACCESSORY_NAMES,
  };

  return (
    <div className="px-5 pt-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-lg font-bold">
          {GUIDED_STEPS[currentStepIdx]?.label ?? "カスタマイズ"}
        </h1>
        <span className="text-[11px] rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
          {currentStepIdx + 1} / {GUIDED_STEPS.length}
        </span>
      </div>

      {/* Step progress bar */}
      <div className="flex gap-1 mb-3">
        {GUIDED_STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => { setStep(s.key); setActiveCategory(STEP_CATEGORIES[s.key][0].key); }}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="h-1 w-full rounded-full transition-all"
              style={{
                backgroundColor: i <= currentStepIdx ? "var(--accent)" : "var(--border)",
              }}
            />
            <span className="text-[9px] font-medium" style={{
              color: i === currentStepIdx ? "var(--accent)" : "var(--muted)",
            }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center rounded-2xl py-5 mb-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <AvatarFigure style={style} size={120} animate="idle" />
      </div>

      {/* Sub-category tabs within current step */}
      <div data-no-swipe className="flex gap-1 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all"
            style={{
              backgroundColor: activeCategory === cat.key ? "var(--accent)" : "var(--card)",
              color: activeCategory === cat.key ? "#fff" : "var(--text)",
              border: activeCategory === cat.key ? "none" : "1px solid var(--border)",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Options panel */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        {nameMap[activeCategory] && (
          <FilteredNamedGrid
            names={nameMap[activeCategory]}
            allowedIndices={allowed(activeCategory)}
            selected={(style as Record<string, unknown>)[activeCategory] as number}
            style={style}
            field={activeCategory as keyof AvatarStyle}
            update={update}
          />
        )}

        {activeCategory === "hairColor" && <ColorGrid colors={HAIR_COLORS} selected={style.hairColor} onSelect={(c) => update({ hairColor: c })} />}
        {activeCategory === "eyeColor" && <ColorGrid colors={EYE_COLORS} selected={style.eyeColor} onSelect={(c) => update({ eyeColor: c })} />}
        {activeCategory === "cheekColor" && <ColorGrid colors={CHEEK_COLORS} selected={style.cheekColor} onSelect={(c) => update({ cheekColor: c })} />}
        {activeCategory === "skinTone" && <ColorGrid colors={SKIN_TONES} selected={style.skinTone} onSelect={(c) => update({ skinTone: c })} />}
        {activeCategory === "topColor" && <ColorGrid colors={TOP_COLORS} selected={style.topColor} onSelect={(c) => update({ topColor: c })} />}
        {activeCategory === "bottomColor" && <ColorGrid colors={BOTTOM_COLORS} selected={style.bottomColor} onSelect={(c) => update({ bottomColor: c })} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-4">
        {currentStepIdx > 0 && (
          <button
            onClick={goBack}
            className="flex-1 rounded-xl py-2.5 text-[12px] font-medium"
            style={{ color: "var(--muted)", backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
          >
            戻る
          </button>
        )}
        <button
          onClick={isLastStep ? save : goNext}
          className="flex-1 btn-primary"
        >
          {isLastStep ? "完成！" : "次へ"}
        </button>
      </div>

      {/* Skip to save */}
      {!isLastStep && (
        <button
          onClick={save}
          className="mt-2 w-full py-2 text-[11px] font-medium"
          style={{ color: "var(--muted)" }}
        >
          このまま保存する
        </button>
      )}
    </div>
  );
}

// ── Compatibility-filtered grid with mini avatar + name ──
function FilteredNamedGrid({ names, allowedIndices, selected, style, field, update }: {
  names: string[];
  allowedIndices: readonly number[];
  selected: number;
  style: AvatarStyle;
  field: keyof AvatarStyle;
  update: (p: Partial<AvatarStyle>) => void;
}) {
  const indices = allowedIndices.length > 0
    ? allowedIndices.filter((i) => i < names.length)
    : names.map((_, i) => i);

  const cols = indices.length <= 4 ? "grid-cols-2" : indices.length <= 6 ? "grid-cols-3" : "grid-cols-4";
  return (
    <div className={`grid ${cols} gap-2`}>
      {indices.map((i) => (
        <button
          key={i}
          onClick={() => update({ [field]: i })}
          className="flex flex-col items-center gap-1 rounded-xl p-2 transition-all active:scale-95"
          style={{
            backgroundColor: selected === i ? "var(--accent-soft)" : "var(--bg)",
            border: selected === i ? "2px solid var(--accent)" : "1px solid var(--border)",
          }}
        >
          <AvatarFigure style={{ ...style, [field]: i }} size={36} />
          <span className="text-[9px] font-medium leading-tight text-center">{names[i]}</span>
        </button>
      ))}
    </div>
  );
}

// ── Color swatch grid ──
function ColorGrid({ colors, selected, onSelect }: { colors: string[]; selected: string; onSelect: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className="h-10 w-10 rounded-full transition-all active:scale-90"
          style={{
            backgroundColor: c === "#00000000" ? "transparent" : c,
            border: selected === c ? "3px solid var(--accent)" : c === "#00000000" ? "2px dashed var(--border)" : "2px solid var(--border)",
            boxShadow: selected === c ? "0 0 0 2px var(--card)" : "none",
          }}
        >
          {c === "#00000000" && <span className="text-[10px]" style={{ color: "var(--muted)" }}>なし</span>}
        </button>
      ))}
    </div>
  );
}
