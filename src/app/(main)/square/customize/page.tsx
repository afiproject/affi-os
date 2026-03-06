"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AvatarFigure from "@/components/square/AvatarFigure";
import {
  HAIR_STYLE_NAMES, HAIR_COLORS, SKIN_TONES, TOP_COLORS, TOP_TYPE_NAMES,
  BOTTOM_COLORS, BOTTOM_TYPE_NAMES, ACCESSORY_NAMES, EXPRESSION_NAMES,
  BODY_POSE_NAMES, EYE_TYPE_NAMES, EYE_COLORS, CHEEK_COLORS,
} from "@/lib/demo-data";
import type { AvatarStyle } from "@/lib/demo-data";

type Category = "hair" | "hairColor" | "skin" | "top" | "topType" | "bottom" | "bottomType" | "accessory" | "expression" | "bodyPose" | "eyeType" | "eyeColor" | "cheek";

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "hair", label: "髪型", icon: "💇" },
  { key: "hairColor", label: "髪色", icon: "🎨" },
  { key: "eyeType", label: "目", icon: "👁" },
  { key: "eyeColor", label: "瞳色", icon: "✨" },
  { key: "expression", label: "表情", icon: "😊" },
  { key: "cheek", label: "チーク", icon: "🩷" },
  { key: "skin", label: "肌", icon: "✋" },
  { key: "topType", label: "服型", icon: "👔" },
  { key: "top", label: "服色", icon: "👕" },
  { key: "bottomType", label: "下型", icon: "👗" },
  { key: "bottom", label: "下色", icon: "👖" },
  { key: "accessory", label: "アクセ", icon: "🕶️" },
  { key: "bodyPose", label: "ポーズ", icon: "🧍" },
];

const DEFAULT_STYLE: AvatarStyle = {
  hairStyle: 0, hairColor: "#2C2C2C", skinTone: "#FFDBB4",
  topColor: "#7B8CFF", topType: 0, bottomColor: "#3A3A5E", bottomType: 0,
  accessory: 0, expression: 1, bodyPose: 0,
  eyeType: 0, eyeColor: "#2A2A3A", cheekColor: "#FFB4B4",
};

export default function CustomizePage() {
  const router = useRouter();
  const [style, setStyle] = useState<AvatarStyle>(DEFAULT_STYLE);
  const [activeCategory, setActiveCategory] = useState<Category>("hair");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sloty_avatar_style");
      if (saved) setStyle(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const update = (partial: Partial<AvatarStyle>) => setStyle((s) => ({ ...s, ...partial }));

  const save = () => {
    localStorage.setItem("sloty_avatar_style", JSON.stringify(style));
    router.back();
  };

  return (
    <div className="px-5 pt-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold">着せ替え</h1>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center rounded-2xl py-8" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <AvatarFigure style={style} size={120} animate="idle" />
        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>プレビュー</p>
      </div>

      {/* AI suggestion banner */}
      <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: "var(--accent-soft)", border: "1px solid rgba(123,140,255,0.15)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--accent-soft-text)" }}>
          📸 写真からAIおすすめ作成
        </p>
        <p className="mt-0.5 text-[10px]" style={{ color: "var(--muted)" }}>
          写真をアップロードすると、雰囲気に合ったアバターを自動提案します（任意）
        </p>
        <button className="mt-2 rounded-lg px-3 py-1.5 text-[11px] font-medium" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          写真から作成（準備中）
        </button>
      </div>

      {/* Category tabs */}
      <div data-no-swipe className="mt-5 flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
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
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        {activeCategory === "hair" && (
          <div className="grid grid-cols-3 gap-2">
            {HAIR_STYLE_NAMES.map((name, i) => (
              <button key={i} onClick={() => update({ hairStyle: i })}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all"
                style={{ backgroundColor: style.hairStyle === i ? "var(--accent-soft)" : "var(--bg)", border: style.hairStyle === i ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
                <AvatarFigure style={{ ...style, hairStyle: i }} size={40} />
                <span className="text-[10px]">{name}</span>
              </button>
            ))}
          </div>
        )}

        {activeCategory === "hairColor" && <ColorGrid colors={HAIR_COLORS} selected={style.hairColor} onSelect={(c) => update({ hairColor: c })} />}

        {activeCategory === "skin" && <ColorGrid colors={SKIN_TONES} selected={style.skinTone} onSelect={(c) => update({ skinTone: c })} />}

        {activeCategory === "top" && <ColorGrid colors={TOP_COLORS} selected={style.topColor} onSelect={(c) => update({ topColor: c })} />}

        {activeCategory === "topType" && (
          <div className="grid grid-cols-3 gap-2">
            {TOP_TYPE_NAMES.map((name, i) => (
              <button key={i} onClick={() => update({ topType: i })}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all"
                style={{ backgroundColor: style.topType === i ? "var(--accent-soft)" : "var(--bg)", border: style.topType === i ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
                <AvatarFigure style={{ ...style, topType: i }} size={40} />
                <span className="text-[10px]">{name}</span>
              </button>
            ))}
          </div>
        )}

        {activeCategory === "bottom" && <ColorGrid colors={BOTTOM_COLORS} selected={style.bottomColor} onSelect={(c) => update({ bottomColor: c })} />}

        {activeCategory === "bottomType" && (
          <div className="grid grid-cols-2 gap-2">
            {BOTTOM_TYPE_NAMES.map((name, i) => (
              <button key={i} onClick={() => update({ bottomType: i })}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all"
                style={{ backgroundColor: style.bottomType === i ? "var(--accent-soft)" : "var(--bg)", border: style.bottomType === i ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
                <AvatarFigure style={{ ...style, bottomType: i }} size={40} />
                <span className="text-[10px]">{name}</span>
              </button>
            ))}
          </div>
        )}

        {activeCategory === "accessory" && (
          <div className="grid grid-cols-3 gap-2">
            {ACCESSORY_NAMES.map((name, i) => (
              <button key={i} onClick={() => update({ accessory: i })}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all"
                style={{ backgroundColor: style.accessory === i ? "var(--accent-soft)" : "var(--bg)", border: style.accessory === i ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
                <AvatarFigure style={{ ...style, accessory: i }} size={40} />
                <span className="text-[10px]">{name}</span>
              </button>
            ))}
          </div>
        )}

        {activeCategory === "expression" && (
          <div className="grid grid-cols-3 gap-2">
            {EXPRESSION_NAMES.map((name, i) => (
              <button key={i} onClick={() => update({ expression: i })}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all"
                style={{ backgroundColor: style.expression === i ? "var(--accent-soft)" : "var(--bg)", border: style.expression === i ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
                <AvatarFigure style={{ ...style, expression: i }} size={40} />
                <span className="text-[10px]">{name}</span>
              </button>
            ))}
          </div>
        )}

        {activeCategory === "bodyPose" && (
          <div className="grid grid-cols-3 gap-2">
            {BODY_POSE_NAMES.map((name, i) => (
              <button key={i} onClick={() => update({ bodyPose: i })}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all"
                style={{ backgroundColor: style.bodyPose === i ? "var(--accent-soft)" : "var(--bg)", border: style.bodyPose === i ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
                <AvatarFigure style={{ ...style, bodyPose: i }} size={40} />
                <span className="text-[10px]">{name}</span>
              </button>
            ))}
          </div>
        )}

        {activeCategory === "eyeType" && (
          <div className="grid grid-cols-2 gap-2">
            {EYE_TYPE_NAMES.map((name, i) => (
              <button key={i} onClick={() => update({ eyeType: i })}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all"
                style={{ backgroundColor: style.eyeType === i ? "var(--accent-soft)" : "var(--bg)", border: style.eyeType === i ? "2px solid var(--accent)" : "1px solid var(--border)" }}>
                <AvatarFigure style={{ ...style, eyeType: i }} size={40} />
                <span className="text-[10px]">{name}</span>
              </button>
            ))}
          </div>
        )}

        {activeCategory === "eyeColor" && <ColorGrid colors={EYE_COLORS} selected={style.eyeColor} onSelect={(c) => update({ eyeColor: c })} />}

        {activeCategory === "cheek" && <ColorGrid colors={CHEEK_COLORS} selected={style.cheekColor} onSelect={(c) => update({ cheekColor: c })} />}
      </div>

      {/* Save */}
      <button onClick={save} className="btn-primary mt-6 w-full">
        保存する
      </button>
    </div>
  );
}

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
