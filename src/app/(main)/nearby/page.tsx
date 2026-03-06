"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import Link from "next/link";
import {
  getMyCheckin, addCheckin, removeMyCheckin, getCheckins,
  getCheckinCooldown, setCheckinCooldown, calcFreeMinutes,
  hasPhotos, consumeTickets, addPing, getPingCooldown,
  setPingCooldown, getTicketBalance, getKycLevel, getProfile,
  getLocationEnabled,
} from "@/lib/demo-store";
import type { DemoCheckin } from "@/lib/demo-store";
import { DEMO_USER, PURPOSE_TEMPLATES, DEMO_NEARBY_CHECKINS, DEMO_POIS } from "@/lib/demo-data";
import { suggestMeetups } from "@/lib/ai";

const LeafletMap = lazy(() => import("@/components/shared/LeafletMap"));

// Default to user's geolocation; fallback to central Tokyo (full Japan support)
const FALLBACK_LAT = 35.6812;
const FALLBACK_LNG = 139.7671;

const POI_FILTERS = [
  { key: "all", label: "すべて", icon: "📍" },
  { key: "カフェ", label: "カフェ", icon: "☕" },
  { key: "ご飯", label: "ご飯", icon: "🍽️" },
  { key: "公共", label: "公共", icon: "🏛️" },
  { key: "公園", label: "公園", icon: "🌳" },
];

const POI_ICON: Record<string, string> = { "カフェ": "☕", "ご飯": "🍽️", "公共": "🏛️", "公園": "🌳" };

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
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "denied">("idle");

  const [duration, setDuration] = useState(15);
  const [mode, setMode] = useState<"call" | "in_person">("call");
  const [purpose, setPurpose] = useState(PURPOSE_TEMPLATES[0]);
  const [note, setNote] = useState("");

  const [pingTarget, setPingTarget] = useState<DemoCheckin | null>(null);
  const [pingDuration, setPingDuration] = useState(30);
  const [pingSent, setPingSent] = useState(false);
  const [pingError, setPingError] = useState("");

  // Location enabled (from profile settings)
  const [locationOn, setLocationOn] = useState(false);

  // POI state
  const [showPoi, setShowPoi] = useState(false);
  const [poiFilter, setPoiFilter] = useState("all");

  // Toast
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

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

  useEffect(() => {
    setLocationOn(getLocationEnabled());
    reload();
    const iv = setInterval(reload, 5000);
    return () => clearInterval(iv);
  }, [reload]);

  // 位置情報がONの場合、自動的にブラウザから位置情報を取得
  useEffect(() => {
    if (locationOn && locStatus === "idle") {
      requestLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationOn]);

  function requestLocation() {
    setLocStatus("loading");
    if (!navigator.geolocation) { setLocStatus("denied"); showToast("このブラウザは位置情報に対応していません"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMyLat(pos.coords.latitude); setMyLng(pos.coords.longitude); setLocStatus("ok"); showToast("位置情報を取得しました"); },
      () => { setLocStatus("denied"); showToast("位置情報の取得に失敗しました。ブラウザの設定を確認してください"); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function handleCheckin() {
    if (!hasPhotos()) return;
    if (cooldown > 0) return;
    if (locStatus !== "ok" || myLat === null || myLng === null) { requestLocation(); return; }
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
    showToast("チェックインしました");
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
  const profile = getProfile();
  const myInitial = DEMO_USER.displayName[0];
  const myPhoto = profile.photos.length > 0 && profile.photos[0].startsWith("data:") ? profile.photos[0] : null;
  const activeCount = nearbyList.length;

  const filteredPois = showPoi ? DEMO_POIS.filter(p => poiFilter === "all" || p.category === poiFilter) : [];

  const hasLocation = locationOn && locStatus === "ok" && myLat !== null && myLng !== null;

  const mapMarkers = hasLocation ? [
    { id: "me", lat: myLat, lng: myLng, label: "自分", color: "#9b8afb", icon: "★", photoUrl: myPhoto || undefined, subLabel: myCheckin ? "イマヒマ中" : undefined },
    ...nearbyList.map(ci => ({
      id: ci.id, lat: ci.lat, lng: ci.lng, label: ci.displayName,
      color: ci.mode === "in_person" ? "#f97316" : "#3b82f6",
      icon: ci.mode === "in_person" ? "🚶" : "📞",
      subLabel: `${ci.durationMinutes}分・${ci.mode === "call" ? "通話" : "対面"}`,
      onClick: () => { setPingTarget(ci); setPingSent(false); setPingError(""); },
    })),
    ...filteredPois.map(poi => ({
      id: poi.id, lat: poi.lat, lng: poi.lng, label: poi.name,
      color: "#6b7280", icon: POI_ICON[poi.category] ?? "📍",
    })),
  ] : [];

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] rounded-full px-4 py-2 text-xs font-medium shadow-lg animate-pulse"
          style={{ backgroundColor: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}>
          {toast}
        </div>
      )}

      {/* Photo guard card */}
      {photoGuard && (
        <Link href="/profile" className="mx-4 mt-3 block card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
              <span className="text-lg">📷</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">プロフィール写真を登録してください</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>すれ違い機能を使うにはプロフィール写真が必要です</p>
            </div>
            <span style={{ color: "var(--accent)" }}>→</span>
          </div>
        </Link>
      )}

      {/* Map area */}
      <div className="relative flex-1 mx-4 mt-3 rounded-2xl overflow-hidden shadow-lg" style={{ minHeight: 420, backgroundColor: "#1a1a2e", border: "none" }} data-no-swipe>
        {!locationOn ? (
          /* 位置情報OFF時のメッセージ */
          <div className="flex flex-col items-center justify-center text-center px-6" style={{ height: 420 }}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full mb-4" style={{ backgroundColor: "rgba(155,138,251,0.15)" }}>
              <span className="text-4xl">📍</span>
            </div>
            <p className="text-base font-bold text-white">位置情報がOFFです</p>
            <p className="mt-2 text-xs text-white/60 leading-relaxed">
              すれ違い機能を使うには位置情報をONにしてください。<br/>
              マイページの設定から変更できます。
            </p>
            <Link href="/mypage#location" className="mt-4 rounded-full px-5 py-2.5 text-sm font-medium transition-transform active:scale-95"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
              設定に移動
            </Link>
          </div>
        ) : !hasLocation ? (
          /* 位置情報ON だが取得中/失敗 */
          <div className="flex flex-col items-center justify-center text-center px-6" style={{ height: 420 }}>
            {locStatus === "loading" ? (
              <>
                <div className="mx-auto h-10 w-10 rounded-full animate-pulse mb-3" style={{ backgroundColor: "var(--accent-soft)" }} />
                <p className="text-sm text-white">位置情報を取得中...</p>
              </>
            ) : (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full mb-4" style={{ backgroundColor: "rgba(220,38,38,0.15)" }}>
                  <span className="text-4xl">⚠️</span>
                </div>
                <p className="text-base font-bold text-white">位置情報を取得できませんでした</p>
                <p className="mt-2 text-xs text-white/60 leading-relaxed">
                  ブラウザの位置情報を許可してください。
                </p>
                <button onClick={requestLocation} className="mt-4 rounded-full px-5 py-2.5 text-sm font-medium transition-transform active:scale-95"
                  style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
                  再取得する
                </button>
              </>
            )}
          </div>
        ) : (
          /* 位置情報ON & 取得成功 → マップ表示 */
          <>
            {/* Status overlay bar (top) */}
            <div className="absolute top-0 left-0 right-0 z-10 p-3" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
                    style={{ backgroundColor: myCheckin ? "var(--success)" : "var(--accent-soft)", color: myCheckin ? "#fff" : "var(--accent-soft-text)" }}>
                    {myCheckin ? "ON" : "📡"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{myCheckin ? "イマヒマON" : "近くのチェックイン"}</p>
                    <p className="text-[10px] text-white/60">
                      {activeCount > 0 ? `${activeCount}人がヒマ` : "チェックインを待っています"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                    {tickets}🎫
                  </span>
                  {locStatus === "ok" && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--success)" }} />}
                </div>
              </div>
            </div>

            {/* Map */}
            <Suspense fallback={
              <div className="flex items-center justify-center text-sm" style={{ height: 420, color: "var(--muted)" }}>
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent-soft)" }} />
                  <p className="mt-2 text-xs">マップを読み込み中...</p>
                </div>
              </div>
            }>
              <LeafletMap center={[myLat, myLng]} zoom={15} height={420} markers={mapMarkers}
                radiusCircle={{ lat: myLat, lng: myLng, radius: 500 }} />
            </Suspense>

            {/* My avatar (center overlay) */}
            <div className="absolute z-10 pointer-events-none" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <div className="relative">
                <div className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: myPhoto ? undefined : "var(--accent)",
                    color: "var(--accent-fg)",
                    border: "3px solid var(--accent-fg)",
                    boxShadow: "0 0 20px var(--ring), 0 0 40px rgba(155,138,251,0.2)",
                  }}>
                  {myPhoto ? <img src={myPhoto} alt="" className="h-full w-full object-cover" /> : myInitial}
                </div>
                {myCheckin && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[8px]"
                    style={{ backgroundColor: "var(--success)", color: "#fff", border: "2px solid var(--card)" }}>✓</div>
                )}
              </div>
            </div>

            {/* Quick actions (bottom of map) */}
            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-3">
              <button onClick={() => { setShowPoi(!showPoi); }}
                className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: showPoi ? "var(--accent)" : "var(--card)", color: showPoi ? "var(--accent-fg)" : "var(--text)", border: "1px solid var(--border)" }}
                title="近くの場所">
                🌏
              </button>
              <button onClick={() => { requestLocation(); }}
                className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                title="現在地">
                📍
              </button>
              <Link href="/pings"
                className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                title="受信箱">
                💬
              </Link>
            </div>
          </>
        )}
      </div>

      {/* POI filter chips */}
      {showPoi && (
        <div className="mx-4 mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {POI_FILTERS.map(f => (
            <button key={f.key} onClick={() => setPoiFilter(f.key)}
              className={`chip text-[11px] whitespace-nowrap ${f.key === poiFilter ? "chip-active" : "chip-inactive"}`}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      )}

      {/* AI suggestions for in-person checkin */}
      {myCheckin && aiSuggestions.length > 0 && myCheckin.mode === "in_person" && (
        <div className="mx-4 mt-3 card !p-3">
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

      {/* Free time suggestion */}
      {freeInfo.freeMinutes > 0 && !myCheckin && !showForm && (
        <div className="mx-4 mt-3 card !p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">自動ヒマ候補</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                {freeInfo.nextEventTitle ? `「${freeInfo.nextEventTitle}」まで${freeInfo.freeMinutes}分空き` : `${freeInfo.freeMinutes}分以上空いてます`}
              </p>
            </div>
            <button onClick={() => { setDuration(Math.min(freeInfo.freeMinutes, 60)); setShowForm(true); }}
              disabled={photoGuard} className="btn-primary text-xs !px-3 !py-2">GO</button>
          </div>
        </div>
      )}

      {/* Checkin control */}
      <div className="mx-4 mt-3">
        {myCheckin ? (
          <div className="card !p-4" style={{ borderColor: "var(--accent)", borderWidth: 2 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--success)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>イマヒマON</span>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                {remainingStr(myCheckin.expiresAt)}
              </span>
            </div>
            <p className="mt-1.5 text-sm">{myCheckin.purpose}</p>
            <p className="text-[10px]" style={{ color: "var(--muted)" }}>{myCheckin.mode === "call" ? "📞 通話" : "🚶 対面"} / {myCheckin.durationMinutes}分</p>
            <button onClick={() => { removeMyCheckin(); reload(); showToast("チェックイン終了"); }} className="btn-outline mt-3 w-full text-xs">終了する</button>
          </div>
        ) : !showForm ? (
          <button onClick={() => setShowForm(true)} disabled={photoGuard}
            className="btn-primary w-full text-sm !py-3.5" style={{ opacity: photoGuard ? 0.4 : 1 }}>
            📡 イマヒマ チェックイン
          </button>
        ) : (
          <div className="card !p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">チェックイン</h3>
              <button onClick={() => setShowForm(false)} className="text-xs" style={{ color: "var(--muted)" }}>✕</button>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>期間</label>
              <div className="mt-1 flex gap-2">{[15, 30, 60].map(d => <button key={d} onClick={() => setDuration(d)} className={`chip ${d === duration ? "chip-active" : "chip-inactive"}`}>{d}分</button>)}</div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>モード</label>
              <div className="mt-1 flex gap-2">{([["call", "📞 通話"], ["in_person", "🚶 対面"]] as const).map(([v, l]) => <button key={v} onClick={() => setMode(v)} className={`chip ${v === mode ? "chip-active" : "chip-inactive"}`}>{l}</button>)}</div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>目的</label>
              <div className="mt-1 flex flex-wrap gap-1.5">{PURPOSE_TEMPLATES.map(t => <button key={t} onClick={() => setPurpose(t)} className={`chip text-[11px] ${t === purpose ? "chip-active" : "chip-inactive"}`}>{t}</button>)}</div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>ひとこと（任意）</label>
              <input className="input mt-1" maxLength={60} placeholder="暇してます〜" value={note} onChange={e => setNote(e.target.value)} />
            </div>
            {cooldown > 0 && <p className="text-xs" style={{ color: "var(--danger)" }}>クールダウン中（{Math.ceil(cooldown / 1000)}秒）</p>}
            <button onClick={handleCheckin} disabled={cooldown > 0 || photoGuard} className="btn-primary w-full text-sm">チェックイン</button>
          </div>
        )}
      </div>

      {/* Nearby users list */}
      <div className="mx-4 mt-5 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--muted)" }}>近くの人</h2>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>{activeCount}人</span>
        </div>
        {nearbyList.length === 0 ? (
          <div className="card mt-2 p-6 text-center">
            <p className="text-3xl">📡</p>
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>近くにチェックインしている人はいません</p>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {nearbyList.map(ci => (
              <button key={ci.id} onClick={() => { setPingTarget(ci); setPingSent(false); setPingError(""); }}
                disabled={photoGuard}
                className="card w-full !p-3 text-left transition-transform active:scale-[0.98]">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: ci.mode === "in_person" ? "rgba(249,115,22,0.15)" : "rgba(59,130,246,0.15)", color: ci.mode === "in_person" ? "#f97316" : "#3b82f6" }}>
                      {ci.displayName[0]}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">{ci.mode === "call" ? "📞" : "🚶"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{ci.displayName}</span>
                      <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>{ci.distanceRange}</span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{ci.purpose}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>{remainingStr(ci.expiresAt)}</span>
                      {ci.note && <span className="text-[10px] truncate" style={{ color: "var(--muted)" }}>「{ci.note}」</span>}
                    </div>
                  </div>
                  <div className="flex items-center self-center">
                    <span className="text-xs" style={{ color: "var(--accent)" }}>5🎫 →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ping modal */}
      {pingTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPingTarget(null)} />
          <div className="relative w-full max-w-lg rounded-t-2xl p-5 pb-8" style={{ backgroundColor: "var(--card)" }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: "var(--border)" }} />
            {pingSent ? (
              <div className="text-center py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--accent-soft)" }}>
                  <span className="text-2xl" style={{ color: "var(--accent)" }}>✓</span>
                </div>
                <p className="mt-3 font-semibold">ピンを送信しました</p>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{pingTarget.displayName}さんの応答を待っています</p>
                <button onClick={() => setPingTarget(null)} className="btn-primary mt-4 text-sm">閉じる</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                    style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-soft-text)" }}>
                    {pingTarget.displayName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{pingTarget.displayName}</h3>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{pingTarget.purpose} / {pingTarget.mode === "call" ? "📞 通話" : "🚶 対面"}</p>
                  </div>
                </div>
                {pingTarget.mode === "in_person" && (
                  <div className="mt-3 rounded-lg p-2" style={{ backgroundColor: "var(--accent-soft)" }}>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--accent-soft-text)" }}>🤖 おすすめ待ち合わせ場所</p>
                    {suggestMeetups("in_person", pingTarget.purpose, pingDuration).map((s, i) => (
                      <p key={i} className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>📍 {s.place}（{s.reason}）</p>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>希望時間</label>
                  <div className="mt-1 flex gap-2">{[30, 60, 90].map(d => <button key={d} onClick={() => setPingDuration(d)} className={`chip ${d === pingDuration ? "chip-active" : "chip-inactive"}`}>{d}分</button>)}</div>
                </div>
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
