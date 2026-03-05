"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { consumeTickets, addPost, getTicketBalance, hasPhotos } from "@/lib/demo-store";
import { DEMO_USER } from "@/lib/demo-data";

const TAG_OPTIONS = [
  { id: "chat", label: "雑談" },
  { id: "work", label: "作業" },
  { id: "study", label: "勉強" },
  { id: "consult", label: "相談" },
  { id: "game", label: "ゲーム" },
  { id: "walk", label: "散歩" },
];

const MAX_PHOTOS = 4;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const COMPRESS_WIDTH = 1024;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_SIZE_BYTES) {
      reject(new Error("ファイルサイズは2MB以下にしてください"));
      return;
    }
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      reject(new Error("JPEGまたはPNG画像のみ対応しています"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = img.width > COMPRESS_WIDTH ? COMPRESS_WIDTH / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}

export default function NewPostPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [mode, setMode] = useState<"call" | "in_person" | "either">("call");
  const [photos, setPhotos] = useState<string[]>([]);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState(18);

  useEffect(() => { setTickets(getTicketBalance()); }, []);

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  async function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setError("");
    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {
      try {
        const dataUrl = await compressImage(file);
        setPhotos(prev => [...prev, dataUrl]);
      } catch (err) {
        setError((err as Error).message);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  const handlePost = () => {
    setError("");
    if (!hasPhotos()) {
      setError("プロフィール写真を1枚以上登録してから投稿してください（設定→プロフィール写真）");
      return;
    }
    if (!text.trim() || tags.length === 0) return;
    if (!consumeTickets(2, "広場投稿")) {
      setError("チケットが不足しています（2🎫必要）");
      return;
    }
    addPost({
      id: `post-${Date.now()}`,
      text: text.trim(),
      tags,
      preferredMode: mode,
      photos,
      likeCount: 0,
      createdAt: new Date().toISOString(),
      user: { id: DEMO_USER.id, displayName: DEMO_USER.displayName, avatarUrl: null },
      aiFlag: false,
    });
    setPosted(true);
  };

  if (posted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <div className="text-4xl">✓</div>
        <p className="mt-3 text-lg font-semibold">投稿しました！</p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>2🎫 消費</p>
        <button onClick={() => router.push("/square")} className="btn-primary mt-6 text-sm">広場に戻る</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm" style={{ color: "var(--muted)" }}>← 戻る</button>
        <button onClick={handlePost} disabled={!text.trim() || tags.length === 0} className="btn-primary text-xs !px-4 !py-2">投稿 2🎫</button>
      </div>

      {/* 写真アップロード */}
      <div className="mt-4">
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>写真（最大{MAX_PHOTOS}枚・任意）</label>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handlePhotoAdd} />
        <div className="mt-2 flex gap-2 flex-wrap">
          {photos.map((p, i) => (
            <div key={i} className="relative">
              <img src={p} alt="" className="h-20 w-20 rounded-xl object-cover" style={{ border: "1px solid var(--border)" }} />
              <button onClick={() => removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white"
                style={{ backgroundColor: "var(--danger)" }}>×</button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button onClick={() => fileRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-xl text-2xl"
              style={{ border: "2px dashed var(--border)", color: "var(--muted)" }}>
              +
            </button>
          )}
        </div>
        <p className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>JPEG/PNG・1枚2MBまで</p>
      </div>

      <div className="mt-4">
        <textarea className="input" rows={4} maxLength={280} placeholder="何を考えてる？" value={text} onChange={(e) => setText(e.target.value)} />
        <p className="mt-1 text-right text-xs" style={{ color: "var(--muted)" }}>{text.length}/280</p>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>タグ（1つ以上選択）</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAG_OPTIONS.map((t) => (
            <button key={t.id} onClick={() => toggleTag(t.id)} className={`chip ${tags.includes(t.id) ? "chip-active" : "chip-inactive"}`}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>希望形式</label>
        <div className="mt-2 flex gap-2">
          {([["call", "📞 通話"], ["in_person", "🚶 対面"], ["either", "どちらでも"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setMode(v as typeof mode)} className={`chip ${v === mode ? "chip-active" : "chip-inactive"}`}>{l}</button>
          ))}
        </div>
      </div>

      {error && <div className="mt-4 rounded-xl p-3 text-xs font-medium" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "var(--danger)" }}>{error}</div>}

      <div className="mt-6 rounded-xl p-3 text-center text-xs" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
        残りチケット: {tickets}🎫
      </div>
    </div>
  );
}
