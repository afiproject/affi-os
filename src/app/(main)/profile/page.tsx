"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { getTicketBalance, getTicketLedger, addTicketEntry, getProfile, saveProfile, hasPhotos } from "@/lib/demo-store";
import { DEMO_USER, DEMO_PHOTO_PLACEHOLDERS } from "@/lib/demo-data";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState(18);
  const [ledger, setLedger] = useState<{ delta: number; reason: string; createdAt: string }[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [showPhotoSection, setShowPhotoSection] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setTickets(getTicketBalance());
    setLedger(getTicketLedger());
    const p = getProfile();
    setPhotos(p.photos);
    setBio(p.bio);
  }, []);

  function handleCharge() {
    addTicketEntry(10, "開発用チャージ（+10）");
    setTickets(getTicketBalance());
    setLedger(getTicketLedger());
  }

  function addDemoPhoto(id: string) {
    const newPhotos = [...photos, id].slice(0, 10);
    setPhotos(newPhotos);
    saveProfile({ bio, photos: newPhotos });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newPhotos = [...photos, dataUrl].slice(0, 10);
      setPhotos(newPhotos);
      saveProfile({ bio, photos: newPhotos });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    saveProfile({ bio, photos: newPhotos });
  }

  function saveBio() {
    saveProfile({ bio, photos });
  }

  const photoCount = photos.length;

  // Generate placeholder visual for demo photos
  function photoDisplay(photo: string, idx: number) {
    if (photo.startsWith("data:")) {
      return (
        <div key={idx} className="relative">
          <img src={photo} alt={`写真${idx + 1}`} className="h-24 w-24 rounded-xl object-cover" />
          {idx === 0 && (
            <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">メイン</span>
          )}
          <button onClick={() => removePhoto(idx)}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white"
            style={{ backgroundColor: "var(--danger)" }}>×</button>
        </div>
      );
    }
    // Demo placeholder
    const colors = ["#E8D5F5", "#D5E8F5", "#F5E8D5", "#D5F5E8", "#F5D5E8"];
    const colorIdx = DEMO_PHOTO_PLACEHOLDERS.indexOf(photo);
    return (
      <div key={idx} className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: colors[colorIdx % colors.length] }}>
          📷
        </div>
        {idx === 0 && (
          <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">メイン</span>
        )}
        <button onClick={() => removePhoto(idx)}
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white"
          style={{ backgroundColor: "var(--danger)" }}>×</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">設定</h1>

      <div className="mt-4 card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
            {DEMO_USER.displayName[0]}
          </div>
          <div>
            <p className="font-semibold">{DEMO_USER.displayName}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{DEMO_USER.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
          <span className="text-sm">🎫 チケット残高</span>
          <span className="text-lg font-bold" style={{ color: "var(--accent)" }}>{tickets}枚</span>
        </div>
      </div>

      {/* Profile Photos */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            プロフィール写真（{photoCount}/10）
          </h2>
          <button onClick={() => setShowPhotoSection(!showPhotoSection)} className="text-xs" style={{ color: "var(--accent)" }}>
            {showPhotoSection ? "閉じる" : "管理"}
          </button>
        </div>

        {!hasPhotos() && (
          <div className="mt-2 rounded-xl p-3 text-xs font-medium"
            style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "var(--danger)" }}>
            ⚠️ 写真を1枚以上登録すると、すれ違い・広場投稿・依頼送信が使えます
          </div>
        )}

        {showPhotoSection && (
          <div className="mt-3 card p-4">
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => photoDisplay(p, i))}
              {photoCount < 10 && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => fileRef.current?.click()}
                    className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed text-2xl"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    +
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </div>
              )}
            </div>
            {/* Demo placeholders */}
            <div className="mt-3">
              <p className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>デモ用サンプル写真:</p>
              <div className="mt-1 flex gap-1.5">
                {DEMO_PHOTO_PLACEHOLDERS.filter((id) => !photos.includes(id)).slice(0, 3).map((id) => (
                  <button key={id} onClick={() => addDemoPhoto(id)}
                    className="rounded-lg px-2 py-1 text-[10px]"
                    style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                    +追加
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Bio */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>自己紹介</h2>
        <div className="mt-2 flex gap-2">
          <input className="input flex-1" maxLength={60} placeholder="ひとこと自己紹介（60字以内）" value={bio}
            onChange={(e) => setBio(e.target.value)} onBlur={saveBio} />
        </div>
      </section>

      <div className="mt-6 space-y-6">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>表示</h2>
          <div className="mt-2">
            <div className="flex items-center justify-between rounded-xl p-3 text-sm">
              <span>ダークモード</span>
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ backgroundColor: theme === "dark" ? "var(--accent)" : "#d1d5db" }}
                >
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{ transform: theme === "dark" ? "translateX(1.375rem)" : "translateX(0.25rem)" }} />
                </button>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>チケット</h2>
          <button onClick={handleCharge} className="btn-primary mt-2 w-full text-sm">🎫 +10 チャージ（開発用）</button>
          <div className="mt-3 card p-3 space-y-2">
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>最近の履歴</p>
            {ledger.slice(0, 6).map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span>{entry.reason}</span>
                <span className="font-semibold" style={{ color: entry.delta > 0 ? "var(--success)" : "var(--danger)" }}>
                  {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-xl p-3 text-xs" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
            <p className="font-semibold">消費ルール:</p>
            <ul className="mt-1 space-y-0.5 list-disc pl-4">
              <li>ピン送信: 5🎫（拒否時2🎫返金）</li>
              <li>広場投稿: 2🎫</li>
              <li>時間共有依頼: 5🎫（拒否時2🎫返金）</li>
              <li>チェックイン: 無料</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>その他</h2>
          <div className="mt-2 space-y-1">
            <SettingsRow label="ピン受信箱" href="/pings" />
            <SettingsRow label="依頼受信箱" href="/requests/inbox" />
            <SettingsRow label="予約管理" href="/bookings" />
            <SettingsRow label="非公開予定管理" href="/friends/events" />
            <SettingsRow label="利用規約" href="/profile" />
            <SettingsRow label="ヘルプ" href="/profile" />
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingsRow({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl p-3 text-sm transition-colors hover:opacity-80">
      <span>{label}</span>
      <span style={{ color: "var(--muted)" }}>→</span>
    </Link>
  );
}
