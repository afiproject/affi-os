"use client";
import { useState, useCallback } from "react";

const SLOTS = [
  { name: "avatar-haruka.png", label: "はるか（茶髪セーラー服の女の子）" },
  { name: "avatar-takuya.png", label: "たくや（茶髪の男の子）" },
  { name: "avatar-misaki.png", label: "みさき（黒髪の女の子）" },
  { name: "avatar-kotone.png", label: "ことね（金髪の女の子）" },
];

export default function UploadAvatarsPage() {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const upload = useCallback(async (file: File, name: string) => {
    setStatus((s) => ({ ...s, [name]: "アップロード中..." }));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name);
    const res = await fetch("/api/upload-avatar", { method: "POST", body: fd });
    if (res.ok) {
      setStatus((s) => ({ ...s, [name]: "完了!" }));
      setPreviews((p) => ({ ...p, [name]: URL.createObjectURL(file) }));
    } else {
      setStatus((s) => ({ ...s, [name]: "エラー" }));
    }
  }, []);

  const allDone = SLOTS.every((s) => status[s.name] === "完了!");

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif", padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>CHARAT アバター アップロード</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        各スロットにダウンロードしたCHARAT画像をドラッグ&ドロップしてください。
      </p>

      {SLOTS.map((slot) => (
        <div
          key={slot.name}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) upload(file, slot.name);
          }}
          style={{
            border: status[slot.name] === "完了!" ? "2px solid #22c55e" : "2px dashed #ccc",
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: status[slot.name] === "完了!" ? "#f0fdf4" : "#fafafa",
            cursor: "pointer",
            position: "relative",
          }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/png,image/jpeg,image/webp";
            input.onchange = () => {
              const file = input.files?.[0];
              if (file) upload(file, slot.name);
            };
            input.click();
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              background: previews[slot.name] ? `url(${previews[slot.name]}) center/cover` : "#e5e7eb",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{slot.label}</div>
            <div style={{ fontSize: 12, color: "#999" }}>{slot.name}</div>
            {status[slot.name] && (
              <div style={{ fontSize: 13, color: status[slot.name] === "完了!" ? "#16a34a" : "#666", marginTop: 4 }}>
                {status[slot.name]}
              </div>
            )}
          </div>
        </div>
      ))}

      {allDone && (
        <div style={{ marginTop: 24, padding: 16, background: "#f0fdf4", borderRadius: 12, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#16a34a" }}>
            全てアップロード完了! 広場ページで確認してください。
          </p>
          <a href="/square" style={{ color: "#2563eb", textDecoration: "underline" }}>広場へ →</a>
        </div>
      )}
    </div>
  );
}
