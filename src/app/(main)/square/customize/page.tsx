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

type Step = "preset" | "detail";
type Category =
  | "faceShape" | "eyeType" | "eyeColor" | "browType" | "mouthType"
  | "cheekType" | "cheekColor" | "noseType"
  | "hairStyle" | "hairColor" | "bodyType" | "skinTone"
  | "topType" | "topColor" | "bottomType" | "bottomColor" | "accessory";

const CATEGORIES: { key: Category; label: string; group: string }[] = [
  { key: "hairStyle", label: "髪型", group: "見た目" },
  { key: "hairColor", label: "髪色", group: "見た目" },
  { key: "faceShape", label: "輪郭", group: "顔" },
  { key: "eyeType", label: "目", group: "顔" },
  { key: "eyeColor", label: "瞳色", group: "顔" },
  { key: "browType", label: "眉", group: "顔" },
  { key: "mouthType", label: "口", group: "顔" },
  { key: "noseType", label: "鼻", group: "顔" },
  { key: "cheekType", label: "チーク", group: "顔" },
  { key: "cheekColor", label: "チーク色", group: "顔" },
  { key: "skinTone", label: "肌", group: "見た目" },
  { key: "bodyType", label: "体型", group: "見た目" },
  { key: "topType", label: "トップス", group: "服" },
  { key: "topColor", label: "トップス色", group: "服" },
  { key: "bottomType", label: "ボトムス", group: "服" },
  { key: "bottomColor", label: "ボトムス色", group: "服" },
  { key: "accessory", label: "小物", group: "服" },
];

const DEFAULT_STYLE: AvatarStyle = AVATAR_PRESETS[0].style;

export default function CustomizePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("preset");
  const [style, setStyle] = useState<AvatarStyle>(DEFAULT_STYLE);
  const [activeCategory, setActiveCategory] = useState<Category>("hairStyle");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sloty_avatar_style");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if it has new fields — if not, stay on preset step
        if (parsed.faceShape !== undefined) {
          setStyle(parsed);
          setStep("detail");
        }
      }
    } catch { /* ignore */ }
  }, []);

  const update = (partial: Partial<AvatarStyle>) => setStyle((s) => ({ ...s, ...partial }));

  const save = () => {
    localStorage.setItem("sloty_avatar_style", JSON.stringify(style));
    router.back();
  };

  const selectPreset = (preset: AvatarStyle) => {
    setStyle(preset);
    setStep("detail");
  };

  // ── Preset selection step ──
  if (step === "preset") {
    return (
      <div className="px-5 pt-3 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h1 className="text-lg font-bold">アバターを選ぼう</h1>
        </div>

        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          まずはベースを選んでね。あとから細かく変えられるよ
        </p>

        <div className="grid grid-cols-3 gap-3">
          {AVATAR_PRESETS.map((preset, i) => (
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

        <button
          onClick={() => setStep("detail")}
          className="mt-4 w-full rounded-xl py-2.5 text-[12px] font-medium"
          style={{ color: "var(--muted)", backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
        >
          スキップして細かく作る
        </button>
      </div>
    );
  }

  // ── Detail editing step ──
  return (
    <div className="px-5 pt-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => setStep("preset")} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-lg font-bold">カスタマイズ</h1>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center rounded-2xl py-6" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <AvatarFigure style={style} size={130} animate="idle" />
        <p className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>プレビュー</p>
      </div>

      {/* Category tabs */}
      <div data-no-swipe className="mt-4 flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
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
      <div className="mt-3 rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        {/* Named options with mini avatar preview */}
        {activeCategory === "hairStyle" && <NamedGrid names={HAIR_STYLE_NAMES} selected={style.hairStyle} style={style} field="hairStyle" update={update} />}
        {activeCategory === "faceShape" && <NamedGrid names={FACE_SHAPE_NAMES} selected={style.faceShape} style={style} field="faceShape" update={update} />}
        {activeCategory === "eyeType" && <NamedGrid names={EYE_TYPE_NAMES} selected={style.eyeType} style={style} field="eyeType" update={update} />}
        {activeCategory === "browType" && <NamedGrid names={BROW_TYPE_NAMES} selected={style.browType} style={style} field="browType" update={update} />}
        {activeCategory === "mouthType" && <NamedGrid names={MOUTH_TYPE_NAMES} selected={style.mouthType} style={style} field="mouthType" update={update} />}
        {activeCategory === "cheekType" && <NamedGrid names={CHEEK_TYPE_NAMES} selected={style.cheekType} style={style} field="cheekType" update={update} />}
        {activeCategory === "noseType" && <NamedGrid names={NOSE_TYPE_NAMES} selected={style.noseType} style={style} field="noseType" update={update} />}
        {activeCategory === "bodyType" && <NamedGrid names={BODY_TYPE_NAMES} selected={style.bodyType} style={style} field="bodyType" update={update} />}
        {activeCategory === "topType" && <NamedGrid names={TOP_TYPE_NAMES} selected={style.topType} style={style} field="topType" update={update} />}
        {activeCategory === "bottomType" && <NamedGrid names={BOTTOM_TYPE_NAMES} selected={style.bottomType} style={style} field="bottomType" update={update} />}
        {activeCategory === "accessory" && <NamedGrid names={ACCESSORY_NAMES} selected={style.accessory} style={style} field="accessory" update={update} />}

        {/* Color pickers */}
        {activeCategory === "hairColor" && <ColorGrid colors={HAIR_COLORS} selected={style.hairColor} onSelect={(c) => update({ hairColor: c })} />}
        {activeCategory === "eyeColor" && <ColorGrid colors={EYE_COLORS} selected={style.eyeColor} onSelect={(c) => update({ eyeColor: c })} />}
        {activeCategory === "cheekColor" && <ColorGrid colors={CHEEK_COLORS} selected={style.cheekColor} onSelect={(c) => update({ cheekColor: c })} />}
        {activeCategory === "skinTone" && <ColorGrid colors={SKIN_TONES} selected={style.skinTone} onSelect={(c) => update({ skinTone: c })} />}
        {activeCategory === "topColor" && <ColorGrid colors={TOP_COLORS} selected={style.topColor} onSelect={(c) => update({ topColor: c })} />}
        {activeCategory === "bottomColor" && <ColorGrid colors={BOTTOM_COLORS} selected={style.bottomColor} onSelect={(c) => update({ bottomColor: c })} />}
      </div>

      {/* Save */}
      <button onClick={save} className="btn-primary mt-5 w-full">
        保存する
      </button>
    </div>
  );
}

// ── Grid with mini avatar + name for each option ──
function NamedGrid({ names, selected, style, field, update }: {
  names: string[];
  selected: number;
  style: AvatarStyle;
  field: keyof AvatarStyle;
  update: (p: Partial<AvatarStyle>) => void;
}) {
  const cols = names.length <= 4 ? "grid-cols-2" : names.length <= 6 ? "grid-cols-3" : "grid-cols-4";
  return (
    <div className={`grid ${cols} gap-2`}>
      {names.map((name, i) => (
        <button
          key={i}
          onClick={() => update({ [field]: i })}
          className="flex flex-col items-center gap-1 rounded-xl p-2 transition-all"
          style={{
            backgroundColor: selected === i ? "var(--accent-soft)" : "var(--bg)",
            border: selected === i ? "2px solid var(--accent)" : "1px solid var(--border)",
          }}
        >
          <AvatarFigure style={{ ...style, [field]: i }} size={36} />
          <span className="text-[9px] font-medium leading-tight text-center">{name}</span>
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
          className="h-10 w-10 rounded-full transition-all"
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
