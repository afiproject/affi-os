"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import Link from "next/link";
import {
  getMyCheckin, addCheckin, removeMyCheckin, getCheckins,
  getCheckinCooldown, setCheckinCooldown, calcFreeMinutes,
  hasPhotos, consumeTickets, addPing, getPingCooldown,
  setPingCooldown, getTicketBalance, getKycLevel,
} from "@/lib/demo-store";
import type { DemoCheckin } from "@/lib/demo-store";
import { DEMO_USER, PURPOSE_TEMPLATES, DEMO_NEARBY_CHECKINS, DEMO_POIS } from "@/lib/demo-data";
import { suggestMeetups } from "@/lib/ai";

const LeafletMap = lazy(() => import("@/components/shared/LeafletMap"));

const FALLBACK_LAT = 38.2601;
const FALLBACK_LNG = 140.8829;

function remainingStr(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "期限切れ";
  return `残り${Math.ceil(ms / 60_000)}分`;
}

export default function NearbyPage() {
  const [myCheckin, setMyCheckin] = useState<DemoCheckin | null>(null);
  const [nearbyList, setNearbyList] = useState<DemoCheckin[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [freeInfo, setFreeInfo] = useState({ freeMinutes: 0, nextEventTitle: null as string | null, nextEventAt: null as string | null });
  const [tickets, setTickets] = useState(18);
  const [showMap, setShowMap] = useState(false);
  const [myLat, setMyLat] = useState(FALLBACK_LAT);
  const [myLng, setMyLng] = useState(FALLBACK_LNG);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "denied">("idle");

  const [duration, setDuration] = useState(15);
  const [mode, setMode] = useState<"call" | "in_person">("call");
  const [purpose, setPurpose] = useState(PURPOSE_TEMPLATES[0]);
  const [note, setNote] = useState("");

  const [pingTarget, setPingTarget] = useState<DemoCheckin | null>(null);
  const [pingDuration, setPingDuration] = useState(30);
  const [pingSent, setPingSent] = useState(false);
  const [pingError, setPingError] = useState("");

  const reload = useCallback(() => {
    setMyCheckin(getMyCheckin());
    const userCheckins = getCheckins().filter((c) => c.userId !== "demo-user-1");
    const demoIds = new Set(userCheckins.map((c) => c.userId));
    const demoCheckins = DEMO_NEARBY_CHECKINS.filter((c) => !demoIds.has(c.userId));
    setNearbyList([...userCheckins, ...demoCheckins]);
    setCooldown(getCheckinCooldown());
    setFreeInfo(calcFreeMinutes());
    setTickets(getTicketBalance());
  }, []);

  useEffect(() => { reload(); const iv = setInterval(reload, 5000); return () => clearInterval(iv); }, [reload]);

  function requestLocation() {
    setLocStatus("loading");
    if (!navigator.geolocation) { setLocStatus("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); setLocStatus("ok"); },
      () => { setMyLat(FALLBACK_LAT); setMyLng(FALLBACK_LNG); setLocStatus("denied"); },
      { timeout: 5000, enableHighAccuracy: false }
    );
  }

  function handleCheckin() {
    if (!hasPhotos()) { alert("プロフィール写真を1枚以上登録してください"); return; }
    if (cooldown > 0) return;
    if (locStatus !== "ok") requestLocation();
    const lat = myLat + (Math.random() - 0.5) * 0.002;
    const lng = myLng + (Math.random() - 0.5) * 0.002;
    addCheckin({
      id: `ci-${Date.now()}`, userId: DEMO_USER.id, displayName: DEMO_USER.displayName,
      bio: "", photoIndex: 0, mode, durationMinutes: duration, purpose, note,
      lat, lng, distanceRange: "〜0m",
      expiresAt: new Date(Date.now() + duration * 60_000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    setCheckinCooldown(); setShowForm(false); reload();
  }

  function handleSendPing(target: DemoCheckin) {
    setPingError("");
    if (!hasPhotos()) { setPingError("写真未登録のためピン送信できません"); return; }
    const kycLv = getKycLevel();
    if (target.mode === "in_person" && kycLv < 2) { setPingError("対面ピンにはLv2本人確認が必要です（設定→本人確認）"); return; }
    const cd = getPingCooldown(target.userId);
    if (cd > 0) { setPingError(`この相手には${Math.ceil(cd / 60_000)}分後に送信可能`); return; }
    if (!consumeTickets(5, `ピン送信: ${target.displayName}`)) { setPingError("チケット不足（5🎫必要）"); return; }
    addPing({
      id: `ping-${Date.now()}`,
      fromUser: { id: DEMO_USER.id, displayName: DEMO_USER.displayName, photoIndex: 0 },
      toUser: { id: target.userId, displayName: target.displayName },
      checkinId: target.id, purpose: target.purpose, durationMinutes: pingDuration,
      mode: target.mode, status: "pending", createdAt: new Date().toISOString(),
    });
    setPingCooldown(target.userId); setPingSent(true); setTickets(getTicketBalance());
  }

  const photoGuard = !hasPhotos();
  const aiSuggestions = myCheckin ? suggestMeetups(myCheckin.mode, myCheckin.purpose, myCheckin.durationMinutes) : [];

  const mapMarkers = [
    { id: "me", lat: myLat, lng: myLng, label: "自分", color: "#9b8afb", icon: "📍" },
    ...nearbyList.map(ci => ({
      id: ci.id, lat: ci.lat, lng: ci.lng, label: ci.displayName,
      color: ci.mode === "in_person" ? "#f97316" : "#3b82f6",
      icon: ci.mode === "in_person" ? "🚶" : "📞",
      onClick: () => { setPingTarget(ci); setPingSent(false); setPingError(""); },
    })),
    ...DEMO_POIS.map(poi => ({
      id: poi.id, lat: poi.lat, lng: poi.lng, label: poi.name,
      color: "#6b7280", icon: poi.category === "カフェ" ? "☕" : poi.category === "公園" ? "🌳" : "📍",
    })),
  ];

  return (
    <div className="p-4 pb-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">すれ違い</h1>
        <div className="flex gap-2">
          <button onClick={() => { if (!showMap) requestLocation(); setShowMap(!showMap); }}
            className={`!px-3 !py-1.5 text-xs rounded-lg ${showMap ? "btn-primary" : "btn-outline"}`}>🌍 マップ</button>
          <Link href="/pings" className="btn-outline !px-3 !py-1.5 text-xs">受信箱</Link>
        </div>
      </div>

      {photoGuard && (
        <Link href="/profile" className="mt-3 block rounded-xl p-3 text-xs font-medium"
          style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "var(--danger)" }}>
          ⚠️ プロフィール写真を登録するとすれ違い機能が使えます →
        </Link>
      )}

      {showMap && (
        <div className="mt-3" data-no-swipe>
          <Suspense fallback={<div className="rounded-xl flex items-center justify-center text-sm" style={{ height: 300, backgroundColor: "var(--accent-soft)", color: "var(--muted)" }}>マップを読み込み中...</div>}>
            <LeafletMap center={[myLat, myLng]} zoom={15} height={300} markers={mapMarkers} radiusCircle={{ lat: myLat, lng: myLng, radius: 500 }} />
          </Suspense>
          <div className="mt-1 flex items-center gap-3 px-1 text-[10px]" style={{ color: "var(--muted)" }}>
            <span>📍自分</span><span>🚶対面</span><span>📞通話</span><span>☕POI</span>
            <span className="ml-auto">{locStatus === "ok" ? "📡 位置取得済み" : "📡 仙台駅（デモ）"}</span>
          </div>
        </div>
      )}

      {freeInfo.freeMinutes > 0 && !myCheckin && (
        <div className="mt-3 card p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">自動ヒマ候補</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {freeInfo.nextEventTitle ? `次の予定「${freeInfo.nextEventTitle}」まで${freeInfo.freeMinutes}分空いてます` : `この先${freeInfo.freeMinutes}分以上空いてます`}
              </p>
            </div>
          </div>
          <button onClick={() => { setDuration(Math.min(freeInfo.freeMinutes, 60)); setShowForm(true); }}
            disabled={photoGuard} className="btn-primary mt-3 w-full text-sm">タップでイマヒマON</button>
        </div>
      )}

      {myCheckin && aiSuggestions.length > 0 && myCheckin.mode === "in_person" && (
        <div className="mt-3 card p-3">
          <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--muted)" }}>🤖 AI待ち合わせ提案</p>
          <div className="mt-2 space-y-1.5">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="rounded-lg p-2 text-xs" style={{ backgroundColor: "var(--accent-soft)" }}>
                <span className="font-medium" style={{ color: "var(--accent-soft-text)" }}>📍 {s.place}</span>
                <p className="mt-0.5 text-[10px]" style={{ color: "var(--muted)" }}>{s.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {myCheckin ? (
        <div className="mt-3 card p-4" style={{ borderColor: "var(--accent)", borderWidth: 2 }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>📡 イマヒマON</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>{remainingStr(myCheckin.expiresAt)}</span>
          </div>
          <p className="mt-1 text-sm">{myCheckin.purpose}</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{myCheckin.mode === "call" ? "📞 通話" : "🚶 対面"} / {myCheckin.durationMinutes}分</p>
          <button onClick={() => { removeMyCheckin(); reload(); }} className="btn-outline mt-3 w-full text-xs">チェックインを終了</button>
        </div>
      ) : (
        <div className="mt-3">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} disabled={photoGuard} className="btn-primary w-full text-sm">📡 イマヒマ チェックイン</button>
          ) : (
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-sm">チェックイン</h3>
              <div><label className="text-xs font-medium" style={{ color: "var(--muted)" }}>期間</label>
                <div className="mt-1 flex gap-2">{[15, 30, 60].map(d => <button key={d} onClick={() => setDuration(d)} className={`chip ${d === duration ? "chip-active" : "chip-inactive"}`}>{d}分</button>)}</div></div>
              <div><label className="text-xs font-medium" style={{ color: "var(--muted)" }}>モード</label>
                <div className="mt-1 flex gap-2">{([["call", "📞 通話"], ["in_person", "🚶 対面"]] as const).map(([v, l]) => <button key={v} onClick={() => setMode(v)} className={`chip ${v === mode ? "chip-active" : "chip-inactive"}`}>{l}</button>)}</div></div>
              <div><label className="text-xs font-medium" style={{ color: "var(--muted)" }}>目的（必須）</label>
                <div className="mt-1 flex flex-wrap gap-1.5">{PURPOSE_TEMPLATES.map(t => <button key={t} onClick={() => setPurpose(t)} className={`chip text-[11px] ${t === purpose ? "chip-active" : "chip-inactive"}`}>{t}</button>)}</div></div>
              <div><label className="text-xs font-medium" style={{ color: "var(--muted)" }}>ひとこと（任意）</label>
                <input className="input mt-1" maxLength={60} placeholder="暇してます〜" value={note} onChange={e => setNote(e.target.value)} /></div>
              {cooldown > 0 && <p className="text-xs" style={{ color: "var(--danger)" }}>クールダウン中（{Math.ceil(cooldown / 1000)}秒後に再度可能）</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="btn-outline flex-1 text-sm">キャンセル</button>
                <button onClick={handleCheckin} disabled={cooldown > 0 || photoGuard} className="btn-primary flex-1 text-sm">チェックイン</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold" style={{ color: "var(--muted)" }}>近くのチェックイン</h2>
        {nearbyList.length === 0 ? (
          <div className="card mt-2 p-6 text-center"><p className="text-3xl">📡</p><p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>近くにチェックインしている人はいません</p></div>
        ) : (
          <div className="mt-2 space-y-2">
            {nearbyList.map(ci => (
              <div key={ci.id} className="card p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>{ci.displayName[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{ci.displayName}</span>
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>{ci.distanceRange}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{ci.bio}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>{ci.purpose}</span>
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>{ci.mode === "call" ? "📞" : "🚶"} {remainingStr(ci.expiresAt)}</span>
                    </div>
                    {ci.note && <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>「{ci.note}」</p>}
                  </div>
                </div>
                <button onClick={() => { setPingTarget(ci); setPingSent(false); setPingError(""); }} disabled={photoGuard} className="btn-primary mt-2 w-full text-xs !py-2">ピンを送る 5🎫</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs" style={{ color: "var(--muted)" }}>残り {tickets}🎫</p>

      {pingTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPingTarget(null)} />
          <div className="relative w-full max-w-lg rounded-t-2xl p-5 pb-8" style={{ backgroundColor: "var(--card)" }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />
            {pingSent ? (
              <div className="text-center py-4">
                <p className="text-3xl" style={{ color: "var(--accent)" }}>✓</p>
                <p className="mt-2 font-semibold">ピンを送信しました！</p>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{pingTarget.displayName}さんの応答を待っています</p>
                <button onClick={() => setPingTarget(null)} className="btn-primary mt-4 text-sm">閉じる</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold">{pingTarget.displayName}にピン</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>目的: {pingTarget.purpose} / {pingTarget.mode === "call" ? "📞 通話" : "🚶 対面"}</p>
                {pingTarget.mode === "in_person" && (
                  <div className="mt-3 rounded-lg p-2" style={{ backgroundColor: "var(--accent-soft)" }}>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--accent-soft-text)" }}>🤖 おすすめ待ち合わせ場所</p>
                    {suggestMeetups("in_person", pingTarget.purpose, pingDuration).map((s, i) => (
                      <p key={i} className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>📍 {s.place}（{s.reason}）</p>
                    ))}
                  </div>
                )}
                <div className="mt-4"><label className="text-xs font-medium" style={{ color: "var(--muted)" }}>希望時間</label>
                  <div className="mt-1 flex gap-2">{[30, 60, 90].map(d => <button key={d} onClick={() => setPingDuration(d)} className={`chip ${d === pingDuration ? "chip-active" : "chip-inactive"}`}>{d}分</button>)}</div></div>
                {pingError && <p className="mt-3 text-xs font-medium" style={{ color: "var(--danger)" }}>{pingError}</p>}
                <button onClick={() => handleSendPing(pingTarget)} className="btn-primary mt-4 w-full text-sm">ピンを送信 5🎫</button>
                <button onClick={() => setPingTarget(null)} className="btn-outline mt-2 w-full text-sm">キャンセル</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
