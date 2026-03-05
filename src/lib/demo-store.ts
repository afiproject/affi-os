"use client";

// ===== Types =====
export type DemoSlot = {
  id: string;
  category: string;
  mode: "call" | "in_person";
  startAt: string;
  endAt: string;
  durationMinutes: number;
  priceYen: number;
  areaValue: string | null;
  bookingType: "instant" | "approval";
  status: string;
  seller: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    verificationStatus: string;
    ratingAvg: number;
    ratingCount: number;
    cancelRate: number;
  };
};

export type DemoBooking = {
  id: string;
  slotId: string;
  slot: DemoSlot;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  createdAt: string;
};

export type DemoPost = {
  id: string;
  text: string;
  tags: string[];
  preferredMode: string;
  photos: string[];
  likeCount: number;
  createdAt: string;
  user: { id: string; displayName: string; avatarUrl: string | null };
  aiFlag?: boolean;
};

export type DemoRequest = {
  id: string;
  fromUser: { id: string; displayName: string };
  toUser: { id: string; displayName: string };
  postId?: string;
  postText?: string;
  timing: string;
  mode: "call" | "in_person";
  durationMinutes: number;
  budgetYen: number;
  note: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type EventKind = "busy" | "free" | "private" | "buffer";

export type DemoEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  visibility: "busy_only" | "title" | "detail" | "hidden";
  memo?: string;
  kind?: EventKind;
  nearbyExclude?: boolean;   // すれ違い対象外（デフォtrue）
  bufferBefore?: number;     // 前バッファ分
  bufferAfter?: number;      // 後バッファ分
};

export type TicketEntry = {
  delta: number;
  reason: string;
  createdAt: string;
};

export type DemoCheckin = {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  photoIndex: number;        // photos配列のindex
  mode: "call" | "in_person";
  durationMinutes: number;
  purpose: string;           // 目的テンプレ
  note: string;
  lat: number;
  lng: number;
  distanceRange: string;     // "〜500m" etc (丸め済み)
  expiresAt: string;
  createdAt: string;
};

export type DemoPing = {
  id: string;
  fromUser: { id: string; displayName: string; photoIndex: number };
  toUser: { id: string; displayName: string };
  checkinId: string;
  purpose: string;
  durationMinutes: number;
  mode: "call" | "in_person";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type DemoProfile = {
  displayName: string;
  handle: string;
  bioShort: string;
  bioLong: string;
  bio: string;               // legacy compat
  photos: string[];
  birthdate: string;
  age: string;
  gender: string;
  purposeTags: string[];
  hobbyTags: string[];
  job: string;
  workStyle: string;
  areaTags: string[];
  contactStyle: string;
  ngTags: string[];
  height: string;
  incomeRange: string;
  incomeVisibility: "all" | "match" | "private";
  lifeTags: string[];
};

// ===== localStorage helpers =====
function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`sloty_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`sloty_${key}`, JSON.stringify(value));
}

// ===== Store =====
import { DEMO_SLOTS, DEMO_POSTS, DEMO_TICKET_LEDGER } from "./demo-data";

// --- Tickets ---
export function getTicketBalance(): number {
  return load<number>("tickets", 18);
}
export function setTicketBalance(v: number) {
  save("tickets", v);
}
export function getTicketLedger(): TicketEntry[] {
  return load<TicketEntry[]>("ticket_ledger", DEMO_TICKET_LEDGER);
}
export function addTicketEntry(delta: number, reason: string) {
  const ledger = getTicketLedger();
  ledger.unshift({ delta, reason, createdAt: new Date().toISOString() });
  save("ticket_ledger", ledger);
  setTicketBalance(getTicketBalance() + delta);
}
export function consumeTickets(amount: number, reason: string): boolean {
  if (getTicketBalance() < amount) return false;
  addTicketEntry(-amount, reason);
  return true;
}

// --- Slots ---
export function getSlots(): DemoSlot[] {
  return load<DemoSlot[]>("slots", DEMO_SLOTS);
}
export function addSlot(slot: DemoSlot) {
  const slots = getSlots();
  slots.unshift(slot);
  save("slots", slots);
}

// --- Bookings ---
export function getBookings(): DemoBooking[] {
  return load<DemoBooking[]>("bookings", []);
}
export function addBooking(b: DemoBooking) {
  const bookings = getBookings();
  bookings.unshift(b);
  save("bookings", bookings);
}
export function updateBookingStatus(id: string, status: DemoBooking["status"]) {
  const bookings = getBookings();
  const b = bookings.find((x) => x.id === id);
  if (b) b.status = status;
  save("bookings", bookings);
}

// --- Posts ---
export function getPosts(): DemoPost[] {
  return load<DemoPost[]>("posts", DEMO_POSTS);
}
export function addPost(p: DemoPost) {
  const posts = getPosts();
  posts.unshift(p);
  save("posts", posts);
}

// --- Requests ---
export function getRequests(): DemoRequest[] {
  return load<DemoRequest[]>("requests", []);
}
export function addRequest(r: DemoRequest) {
  const reqs = getRequests();
  reqs.unshift(r);
  save("requests", reqs);
}
export function updateRequestStatus(id: string, status: DemoRequest["status"]) {
  const reqs = getRequests();
  const r = reqs.find((x) => x.id === id);
  if (r) r.status = status;
  save("requests", reqs);
}

// --- Private Events ---
export function getPrivateEvents(): DemoEvent[] {
  return load<DemoEvent[]>("private_events", []);
}
export function addPrivateEvent(e: DemoEvent) {
  const events = getPrivateEvents();
  events.push(e);
  save("private_events", events);
}
export function removePrivateEvent(id: string) {
  save("private_events", getPrivateEvents().filter((e) => e.id !== id));
}
export function updatePrivateEvent(id: string, updates: Partial<DemoEvent>) {
  const events = getPrivateEvents();
  const ev = events.find((e) => e.id === id);
  if (ev) Object.assign(ev, updates);
  save("private_events", events);
}

// --- Checkins ---
export function getCheckins(): DemoCheckin[] {
  return load<DemoCheckin[]>("checkins", []);
}
export function getMyCheckin(): DemoCheckin | null {
  const all = getCheckins();
  const mine = all.find((c) => c.userId === "demo-user-1");
  if (!mine) return null;
  if (new Date(mine.expiresAt).getTime() < Date.now()) {
    // expired — remove
    save("checkins", all.filter((c) => c.id !== mine.id));
    return null;
  }
  return mine;
}
export function addCheckin(c: DemoCheckin) {
  const all = getCheckins().filter((x) => x.userId !== c.userId); // replace existing
  all.unshift(c);
  save("checkins", all);
}
export function removeMyCheckin() {
  save("checkins", getCheckins().filter((c) => c.userId !== "demo-user-1"));
}
export function getCheckinCooldown(): number {
  // returns ms remaining until next checkin allowed (60s cooldown)
  const last = load<number>("checkin_last", 0);
  const remaining = (last + 60_000) - Date.now();
  return remaining > 0 ? remaining : 0;
}
export function setCheckinCooldown() {
  save("checkin_last", Date.now());
}

// --- Pings ---
export function getPings(): DemoPing[] {
  return load<DemoPing[]>("pings", []);
}
export function addPing(p: DemoPing) {
  const pings = getPings();
  pings.unshift(p);
  save("pings", pings);
}
export function updatePingStatus(id: string, status: DemoPing["status"]) {
  const pings = getPings();
  const p = pings.find((x) => x.id === id);
  if (p) p.status = status;
  save("pings", pings);
}
export function getPingCooldown(targetUserId: string): number {
  // 10min cooldown per target
  const key = `ping_cd_${targetUserId}`;
  const last = load<number>(key, 0);
  const remaining = (last + 10 * 60_000) - Date.now();
  return remaining > 0 ? remaining : 0;
}
export function setPingCooldown(targetUserId: string) {
  save(`ping_cd_${targetUserId}`, Date.now());
}

// --- Profile ---
const DEFAULT_PROFILE: DemoProfile = {
  displayName: "", handle: "", bioShort: "", bioLong: "",
  bio: "", photos: [], birthdate: "", age: "", gender: "",
  purposeTags: [], hobbyTags: [], job: "", workStyle: "",
  areaTags: [], contactStyle: "", ngTags: [],
  height: "", incomeRange: "", incomeVisibility: "private", lifeTags: [],
};
export function getProfile(): DemoProfile {
  return load<DemoProfile>("profile", DEFAULT_PROFILE);
}
export function saveProfile(p: DemoProfile) {
  save("profile", p);
}
export function hasPhotos(): boolean {
  return getProfile().photos.length > 0;
}

// --- Friend events (shared busy/free) ---
export type FriendEvent = {
  startAt: string; endAt: string;
  type: "busy" | "free"; title?: string;
};
export function getFriendEvents(friendId: string): FriendEvent[] {
  return load<FriendEvent[]>(`friend_events_${friendId}`, []);
}
export function getCalendarVisibility(): { showFriends: boolean; selectedFriends: string[] } {
  return load("cal_vis", { showFriends: false, selectedFriends: [] });
}
export function setCalendarVisibility(v: { showFriends: boolean; selectedFriends: string[] }) {
  save("cal_vis", v);
}
// --- Common free time ---
export function calcCommonFree(friendId: string): { start: string; end: string; minutes: number }[] {
  const myEvents = getPrivateEvents().filter(e => (e.kind ?? "busy") !== "free");
  const friendEvents = getFriendEvents(friendId).filter(e => e.type === "busy");
  const now = Date.now();
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
  const eod = endOfDay.getTime();

  // Build blocked intervals
  const blocked: { s: number; e: number }[] = [];
  for (const ev of myEvents) {
    const buf = ((ev.bufferBefore ?? 10) + (ev.bufferAfter ?? 10)) * 60_000;
    blocked.push({ s: new Date(ev.startAt).getTime() - (ev.bufferBefore ?? 10) * 60_000, e: new Date(ev.endAt).getTime() + (ev.bufferAfter ?? 10) * 60_000 });
  }
  for (const ev of friendEvents) {
    blocked.push({ s: new Date(ev.startAt).getTime(), e: new Date(ev.endAt).getTime() });
  }
  blocked.sort((a, b) => a.s - b.s);

  // Merge intervals
  const merged: { s: number; e: number }[] = [];
  for (const b of blocked) {
    if (merged.length && b.s <= merged[merged.length - 1].e) {
      merged[merged.length - 1].e = Math.max(merged[merged.length - 1].e, b.e);
    } else {
      merged.push({ ...b });
    }
  }

  // Find gaps from now to end of day
  const gaps: { start: string; end: string; minutes: number }[] = [];
  let cursor = now;
  for (const m of merged) {
    if (m.s > cursor && m.s <= eod) {
      const gapMin = Math.floor((m.s - cursor) / 60_000);
      if (gapMin >= 15) {
        gaps.push({ start: new Date(cursor).toISOString(), end: new Date(m.s).toISOString(), minutes: gapMin });
      }
    }
    cursor = Math.max(cursor, m.e);
  }
  if (cursor < eod) {
    const gapMin = Math.floor((eod - cursor) / 60_000);
    if (gapMin >= 15) {
      gaps.push({ start: new Date(cursor).toISOString(), end: new Date(eod).toISOString(), minutes: gapMin });
    }
  }
  return gaps.slice(0, 5);
}

// --- Free time calculation ---
export function calcFreeMinutes(): { freeMinutes: number; nextEventTitle: string | null; nextEventAt: string | null } {
  const now = Date.now();
  const events = getPrivateEvents();

  // Get events that block time (everything except free and hidden)
  const blockers = events
    .filter((e) => {
      const kind = e.kind ?? "busy";
      if (kind === "free") return false;
      if (e.nearbyExclude === false) return false; // explicitly opted-in to nearby
      return true;
    })
    .map((e) => {
      const bufBefore = (e.bufferBefore ?? 10) * 60_000;
      const bufAfter = (e.bufferAfter ?? 10) * 60_000;
      return {
        start: new Date(e.startAt).getTime() - bufBefore,
        end: new Date(e.endAt).getTime() + bufAfter,
        title: e.title,
        originalStart: e.startAt,
      };
    })
    .filter((b) => b.end > now)
    .sort((a, b) => a.start - b.start);

  // Check if currently in a blocking event
  const currentBlocker = blockers.find((b) => b.start <= now && b.end > now);
  if (currentBlocker) {
    // Find next free gap after this blocker
    const afterCurrent = blockers.filter((b) => b.start > currentBlocker.end);
    if (afterCurrent.length === 0) {
      return { freeMinutes: 0, nextEventTitle: currentBlocker.title, nextEventAt: new Date(currentBlocker.end).toISOString() };
    }
    return { freeMinutes: 0, nextEventTitle: currentBlocker.title, nextEventAt: currentBlocker.originalStart };
  }

  // Find next future blocker
  const nextBlocker = blockers.find((b) => b.start > now);
  if (!nextBlocker) {
    return { freeMinutes: 180, nextEventTitle: null, nextEventAt: null }; // 3h+ free
  }

  const freeMs = nextBlocker.start - now;
  return {
    freeMinutes: Math.floor(freeMs / 60_000),
    nextEventTitle: nextBlocker.title,
    nextEventAt: nextBlocker.originalStart,
  };
}

// --- KYC (本人確認) ---
export type KycLevel = 0 | 1 | 2;
export type KycStatus = "none" | "pending_ai" | "pending_review" | "approved" | "rejected" | "resubmit_required";
export type KycRequest = {
  id: string;
  userId: string;
  displayName: string;
  level: KycLevel;
  status: KycStatus;
  selfieSubmitted: boolean;
  idDocSubmitted: boolean;
  livenessSubmitted: boolean;
  aiScore: number | null;
  reviewerNote: string;
  createdAt: string;
  updatedAt: string;
};
export type KycAuditEntry = {
  id: string;
  kycRequestId: string;
  action: string;
  actor: string;
  note: string;
  createdAt: string;
};

export function getKycRequests(): KycRequest[] {
  return load<KycRequest[]>("kyc_requests", []);
}
export function getMyKycRequest(): KycRequest | null {
  return getKycRequests().find(r => r.userId === "demo-user-1") ?? null;
}
export function getKycLevel(): KycLevel {
  const req = getMyKycRequest();
  if (!req || req.status !== "approved") return 0;
  return req.level;
}
export function submitKycRequest(level: KycLevel) {
  const reqs = getKycRequests().filter(r => r.userId !== "demo-user-1");
  const req: KycRequest = {
    id: `kyc-${Date.now()}`,
    userId: "demo-user-1",
    displayName: "あなた（デモ）",
    level,
    status: "pending_ai",
    selfieSubmitted: true,
    idDocSubmitted: level >= 2,
    livenessSubmitted: level >= 2,
    aiScore: null,
    reviewerNote: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  reqs.unshift(req);
  save("kyc_requests", reqs);
  addKycAudit(req.id, "submitted", "demo-user-1", `レベル${level}申請`);
}
export function runKycAiScoring(reqId: string) {
  const updated = getKycRequests();
  const r = updated.find(x => x.id === reqId);
  if (r && r.status === "pending_ai") {
    r.aiScore = 75 + Math.floor(Math.random() * 20);
    r.status = "pending_review";
    r.updatedAt = new Date().toISOString();
    save("kyc_requests", updated);
    addKycAudit(reqId, "ai_scored", "SYSTEM", `AI判定スコア: ${r.aiScore}`);
  }
}
export function updateKycRequest(id: string, updates: Partial<KycRequest>) {
  const reqs = getKycRequests();
  const r = reqs.find(x => x.id === id);
  if (r) { Object.assign(r, updates, { updatedAt: new Date().toISOString() }); }
  save("kyc_requests", reqs);
}
export function getKycAuditLog(): KycAuditEntry[] {
  return load<KycAuditEntry[]>("kyc_audit_log", []);
}
export function addKycAudit(kycRequestId: string, action: string, actor: string, note: string) {
  const log = getKycAuditLog();
  log.unshift({ id: `ka-${Date.now()}`, kycRequestId, action, actor, note, createdAt: new Date().toISOString() });
  save("kyc_audit_log", log);
}

// --- Rooms (チャット/通話) ---
export type DemoRoom = {
  id: string;
  bookingId: string;
  participants: { id: string; displayName: string }[];
  startAt: string;
  endAt: string;
  extended: boolean;
  createdAt: string;
};
export type DemoMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  masked: boolean;
  createdAt: string;
};
export type DemoCallLog = {
  id: string;
  roomId: string;
  type: "voice" | "video";
  startedAt: string;
  endedAt: string | null;
  participants: string[];
};
export type DemoReport = {
  id: string;
  roomId: string;
  reporterId: string;
  targetId: string;
  reason: string;
  createdAt: string;
};
export type DemoBlock = {
  userId: string;
  blockedAt: string;
};

export function getRooms(): DemoRoom[] {
  return load<DemoRoom[]>("rooms", []);
}
export function getRoom(roomId: string): DemoRoom | null {
  return getRooms().find(r => r.id === roomId) ?? null;
}
export function createRoom(bookingId: string, participants: { id: string; displayName: string }[], startAt: string, endAt: string): DemoRoom {
  const rooms = getRooms();
  const existing = rooms.find(r => r.bookingId === bookingId);
  if (existing) return existing;
  const room: DemoRoom = {
    id: `room-${Date.now()}`,
    bookingId,
    participants,
    startAt,
    endAt,
    extended: false,
    createdAt: new Date().toISOString(),
  };
  rooms.unshift(room);
  save("rooms", rooms);
  return room;
}
export function extendRoom(roomId: string, extraMinutes: number) {
  const rooms = getRooms();
  const r = rooms.find(x => x.id === roomId);
  if (r) {
    r.endAt = new Date(new Date(r.endAt).getTime() + extraMinutes * 60_000).toISOString();
    r.extended = true;
  }
  save("rooms", rooms);
}

export function getMessages(roomId: string): DemoMessage[] {
  return load<DemoMessage[]>(`messages_${roomId}`, []);
}
const CONTACT_PATTERN = /(?:\d{3}[-\s]?\d{4}[-\s]?\d{4}|@[a-zA-Z0-9_.]+|LINE|カカオ|instagram|twitter|discord)/i;
export function addMessage(roomId: string, senderId: string, senderName: string, text: string): DemoMessage {
  const msgs = getMessages(roomId);
  const masked = CONTACT_PATTERN.test(text);
  const msg: DemoMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    roomId, senderId, senderName,
    text: masked ? "⚠️ 外部連絡先の共有は禁止されています" : text,
    masked,
    createdAt: new Date().toISOString(),
  };
  msgs.push(msg);
  save(`messages_${roomId}`, msgs);
  return msg;
}

export function getCallLogs(roomId: string): DemoCallLog[] {
  return load<DemoCallLog[]>(`calls_${roomId}`, []);
}
export function addCallLog(roomId: string, type: "voice" | "video"): DemoCallLog {
  const logs = getCallLogs(roomId);
  const log: DemoCallLog = {
    id: `call-${Date.now()}`, roomId, type,
    startedAt: new Date().toISOString(), endedAt: null,
    participants: ["demo-user-1"],
  };
  logs.push(log);
  save(`calls_${roomId}`, logs);
  return log;
}
export function endCallLog(roomId: string, callId: string) {
  const logs = getCallLogs(roomId);
  const log = logs.find(l => l.id === callId);
  if (log) log.endedAt = new Date().toISOString();
  save(`calls_${roomId}`, logs);
}

export function getReports(): DemoReport[] {
  return load<DemoReport[]>("reports", []);
}
export function addReport(roomId: string, targetId: string, reason: string) {
  const reports = getReports();
  const rpt: DemoReport = { id: `rpt-${Date.now()}`, roomId, reporterId: "demo-user-1", targetId, reason, createdAt: new Date().toISOString() };
  reports.unshift(rpt);
  save("reports", reports);
  return rpt;
}

export function getBlocks(): DemoBlock[] {
  return load<DemoBlock[]>("blocks", []);
}
export function addBlock(userId: string) {
  const blocks = getBlocks();
  if (!blocks.find(b => b.userId === userId)) {
    blocks.push({ userId, blockedAt: new Date().toISOString() });
    save("blocks", blocks);
  }
}

// --- Subscription ---
export type SubscriptionPlan = "none" | "basic" | "plus";
export type SubscriptionState = {
  plan: SubscriptionPlan;
  startedAt: string | null;
  ticketsGrantedThisMonth: boolean;
};
export function getSubscription(): SubscriptionState {
  return load<SubscriptionState>("subscription_state", { plan: "none", startedAt: null, ticketsGrantedThisMonth: false });
}
export function setSubscription(plan: SubscriptionPlan) {
  const sub: SubscriptionState = { plan, startedAt: plan === "none" ? null : new Date().toISOString(), ticketsGrantedThisMonth: plan !== "none" };
  save("subscription_state", sub);
  if (plan === "basic") addTicketEntry(40, "Basicサブスク 月40🎫付与");
  if (plan === "plus") addTicketEntry(100, "Plusサブスク 月100🎫付与");
}

// --- Ticket Purchases (mock) ---
export type TicketPurchase = {
  id: string;
  ticketCount: number;
  priceYen: number;
  createdAt: string;
};
export const TICKET_PACKAGES = [
  { ticketCount: 10, priceYen: 480 },
  { ticketCount: 30, priceYen: 1200 },
  { ticketCount: 80, priceYen: 2980 },
  { ticketCount: 200, priceYen: 6980 },
] as const;
export function getPurchases(): TicketPurchase[] {
  return load<TicketPurchase[]>("purchases_mock", []);
}
export function purchaseTickets(ticketCount: number, priceYen: number) {
  const purchases = getPurchases();
  purchases.unshift({ id: `pur-${Date.now()}`, ticketCount, priceYen, createdAt: new Date().toISOString() });
  save("purchases_mock", purchases);
  addTicketEntry(ticketCount, `${ticketCount}🎫購入`);
}

// --- Free reward (completion bonus) ---
export function claimCompletionReward(partnerId: string): boolean {
  const todayKey = new Date().toISOString().slice(0, 10);
  const rewards = load<{ date: string; partnerId: string }[]>("completion_rewards", []);
  const todayRewards = rewards.filter(r => r.date === todayKey);
  // Same partner within 24h: 1 time only
  if (todayRewards.some(r => r.partnerId === partnerId)) return false;
  // Daily cap: 3
  if (todayRewards.length >= 3) return false;
  rewards.push({ date: todayKey, partnerId });
  save("completion_rewards", rewards);
  addTicketEntry(1, "通話/対面完了ボーナス (+1🎫)");
  return true;
}

// --- Users (admin view) ---
export type DemoUser = {
  id: string;
  displayName: string;
  loginEmail: string;
  loginProvider: "email" | "google" | "apple";
  kycLevel: KycLevel;
  reportCount: number;
  lastActiveAt: string;
  status: "active" | "banned";
  forceResetFlag: boolean;
  adminNote: string;
};
const DEMO_USERS_DEFAULT: DemoUser[] = [
  { id: "demo-user-1", displayName: "あなた（デモ）", loginEmail: "demo@sloty.app", loginProvider: "email", kycLevel: 0, reportCount: 0, lastActiveAt: new Date().toISOString(), status: "active", forceResetFlag: false, adminNote: "" },
  { id: "user-a", displayName: "はるか", loginEmail: "haruka@example.com", loginProvider: "google", kycLevel: 2, reportCount: 0, lastActiveAt: new Date(Date.now() - 3600_000).toISOString(), status: "active", forceResetFlag: false, adminNote: "" },
  { id: "user-b", displayName: "たくや", loginEmail: "takuya@example.com", loginProvider: "email", kycLevel: 1, reportCount: 1, lastActiveAt: new Date(Date.now() - 7200_000).toISOString(), status: "active", forceResetFlag: false, adminNote: "" },
  { id: "user-c", displayName: "みさき", loginEmail: "misaki@example.com", loginProvider: "apple", kycLevel: 0, reportCount: 0, lastActiveAt: new Date(Date.now() - 86400_000).toISOString(), status: "active", forceResetFlag: false, adminNote: "" },
  { id: "user-d", displayName: "ゆうた", loginEmail: "yuta@example.com", loginProvider: "google", kycLevel: 2, reportCount: 0, lastActiveAt: new Date(Date.now() - 1800_000).toISOString(), status: "active", forceResetFlag: false, adminNote: "" },
  { id: "user-e", displayName: "あおい", loginEmail: "aoi@example.com", loginProvider: "email", kycLevel: 1, reportCount: 2, lastActiveAt: new Date(Date.now() - 14400_000).toISOString(), status: "active", forceResetFlag: false, adminNote: "" },
];
export function getUsers(): DemoUser[] {
  return load<DemoUser[]>("users", DEMO_USERS_DEFAULT);
}
export function getUser(userId: string): DemoUser | null {
  return getUsers().find(u => u.id === userId) ?? null;
}
export function updateUser(userId: string, updates: Partial<DemoUser>) {
  const users = getUsers();
  const u = users.find(x => x.id === userId);
  if (u) Object.assign(u, updates);
  save("users", users);
}
export function banUser(userId: string) { updateUser(userId, { status: "banned" }); }
export function unbanUser(userId: string) { updateUser(userId, { status: "active" }); }
export function forcePasswordReset(userId: string) { updateUser(userId, { forceResetFlag: true }); }

// --- Admin Audit Log ---
export type AdminAuditEntry = {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
  ip: string;
  userAgent: string;
};
export function getAdminAuditLog(): AdminAuditEntry[] {
  return load<AdminAuditEntry[]>("admin_audit_log", []);
}
export function addAdminAudit(action: string, targetType: string, targetId: string, reason: string) {
  const log = getAdminAuditLog();
  log.unshift({
    id: `aal-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    actorUserId: "owner",
    action, targetType, targetId, reason,
    createdAt: new Date().toISOString(),
    ip: "127.0.0.1",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 80) : "demo",
  });
  save("admin_audit_log", log);
}

// --- Admin session ---
export function getAdminSession(): { authenticated: boolean; expiresAt: number } {
  const s = load<{ authenticated: boolean; expiresAt: number }>("admin_session", { authenticated: false, expiresAt: 0 });
  if (s.authenticated && s.expiresAt < Date.now()) {
    save("admin_session", { authenticated: false, expiresAt: 0 });
    return { authenticated: false, expiresAt: 0 };
  }
  return s;
}
export function setAdminSession() {
  save("admin_session", { authenticated: true, expiresAt: Date.now() + 30 * 60_000 }); // 30min
}
export function clearAdminSession() {
  save("admin_session", { authenticated: false, expiresAt: 0 });
}

// --- Media (image messages) ---
export type DemoMedia = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  url: string; // data URI in demo
  createdAt: string;
};
export function getMedia(roomId: string): DemoMedia[] {
  return load<DemoMedia[]>(`media_${roomId}`, []);
}
export function addMedia(roomId: string, senderId: string, senderName: string, url: string): DemoMedia {
  const media = getMedia(roomId);
  const m: DemoMedia = { id: `med-${Date.now()}`, roomId, senderId, senderName, url, createdAt: new Date().toISOString() };
  media.push(m);
  save(`media_${roomId}`, media);
  return m;
}
export function getAllMedia(): DemoMedia[] {
  // Gather media from all rooms
  const rooms = getRooms();
  return rooms.flatMap(r => getMedia(r.id));
}

// --- KYC asset metadata (no raw images stored in app) ---
export type KycAssetMeta = {
  id: string;
  kycRequestId: string;
  userId: string;
  assetType: "selfie" | "id_front" | "id_back" | "liveness_left" | "liveness_right";
  uploadedAt: string;
  objectKey: string; // simulated S3 path
};
export function getKycAssetsMeta(kycRequestId: string): KycAssetMeta[] {
  return load<KycAssetMeta[]>("kyc_assets_meta", []).filter(a => a.kycRequestId === kycRequestId);
}
export function addKycAssetMeta(kycRequestId: string, userId: string, assetType: KycAssetMeta["assetType"]) {
  const all = load<KycAssetMeta[]>("kyc_assets_meta", []);
  all.push({
    id: `kya-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    kycRequestId, userId, assetType,
    uploadedAt: new Date().toISOString(),
    objectKey: `kyc/${userId}/${kycRequestId}/${assetType}.jpg`,
  });
  save("kyc_assets_meta", all);
}

// ===== Conflict check =====
export function checkConflict(startAt: string, endAt: string): DemoEvent | null {
  const events = getPrivateEvents();
  const s = new Date(startAt).getTime();
  const e = new Date(endAt).getTime();
  return events.find((ev) => {
    if (ev.visibility === "hidden") return false;
    const es = new Date(ev.startAt).getTime();
    const ee = new Date(ev.endAt).getTime();
    return s < ee && e > es;
  }) ?? null;
}

// ===== Booking → Calendar auto-sync =====
export function addBookingCalendarEvent(booking: DemoBooking): boolean {
  const sourceId = `booking:${booking.id}`;
  const existing = getPrivateEvents();
  // Dedup: don't add if same sourceId already exists
  if (existing.some(e => e.id === sourceId)) return false;

  const mode = booking.slot.mode === "call" ? "通話" : "対面";
  const dur = booking.slot.durationMinutes;
  const bufMin = 10;

  const startMs = new Date(booking.slot.startAt).getTime();
  const endMs = new Date(booking.slot.endAt).getTime();

  addPrivateEvent({
    id: sourceId,
    title: `SLOTY：${mode}（${dur}分）`,
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    visibility: "busy_only",
    memo: `予約ID: ${booking.id} / ${booking.slot.seller.displayName}`,
    kind: "busy",
    nearbyExclude: true,
    bufferBefore: bufMin,
    bufferAfter: bufMin,
  });
  return true;
}

export function removeBookingCalendarEvent(bookingId: string) {
  const sourceId = `booking:${bookingId}`;
  removePrivateEvent(sourceId);
}

// ===== KYC image storage (localStorage for cross-tab access) =====
export function saveKycImage(assetType: string, dataUrl: string) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(`sloty_kyc_img_${assetType}`, dataUrl); } catch { /* quota */ }
}

export function getKycImage(assetType: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`sloty_kyc_img_${assetType}`);
}

// ===== POI categories =====
export const POI_CATEGORIES = ["カフェ", "ご飯", "公共", "公園"] as const;
export type PoiCategory = typeof POI_CATEGORIES[number];

// ===== Auth system (DEMO_MODE) =====
export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
  status: "active" | "banned" | "kycpending";
};
export type AuthSession = {
  userId: string;
  email: string;
  token: string;
  expiresAt: number;
};
export type AuthLogEntry = {
  id: string;
  timestamp: string;
  userId: string;
  email: string;
  action: "signup" | "login" | "logout" | "failed_login" | "password_reset" | "email_change" | "email_verified";
  ip: string;
  ua: string;
};

// Outbox (pseudo-email)
export type OutboxMail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  links: { label: string; url: string }[];
  createdAt: string;
};
export function getOutbox(): OutboxMail[] { return load<OutboxMail[]>("outbox", []); }
export function addOutboxMail(mail: Omit<OutboxMail, "id" | "createdAt">) {
  const mails = getOutbox();
  mails.unshift({ ...mail, id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, createdAt: new Date().toISOString() });
  save("outbox", mails);
}

// Tokens (email verify / password reset / email change)
type TokenEntry = { token: string; userId: string; email: string; expiresAt: number; newEmail?: string };
function getTokens(kind: string): TokenEntry[] { return load<TokenEntry[]>(`tokens_${kind}`, []); }
function addToken(kind: string, userId: string, email: string, newEmail?: string): string {
  const tokens = getTokens(kind).filter(t => t.expiresAt > Date.now());
  const token = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  tokens.push({ token, userId, email, expiresAt: Date.now() + 60 * 60_000, newEmail });
  save(`tokens_${kind}`, tokens);
  return token;
}
function consumeToken(kind: string, token: string): TokenEntry | null {
  const tokens = getTokens(kind);
  const idx = tokens.findIndex(t => t.token === token && t.expiresAt > Date.now());
  if (idx === -1) return null;
  const entry = tokens[idx];
  tokens.splice(idx, 1);
  save(`tokens_${kind}`, tokens);
  return entry;
}

// Email verification
export function sendVerificationEmail(userId: string, email: string) {
  const token = addToken("verify", userId, email);
  addOutboxMail({ to: email, subject: "【SLOTY】メールアドレスの確認", body: "以下のリンクをクリックしてメールアドレスを確認してください。", links: [{ label: "メールを確認する", url: `/auth/verify-email?token=${token}` }] });
}
export function verifyEmail(token: string): { ok: boolean; error?: string } {
  const entry = consumeToken("verify", token);
  if (!entry) return { ok: false, error: "トークンが無効または期限切れです" };
  const users = getAuthUsers();
  const u = users.find(x => x.id === entry.userId);
  if (!u) return { ok: false, error: "ユーザーが見つかりません" };
  u.emailVerified = true;
  save("auth_users", users);
  addAuthLog(u.id, u.email, "email_verified");
  setAuthSession(u.id, u.email);
  return { ok: true };
}

// Password reset via token
export function sendPasswordResetEmail(email: string) {
  const user = findAuthUserByEmail(email);
  if (!user) return; // don't reveal existence
  const token = addToken("reset", user.id, email);
  addOutboxMail({ to: email, subject: "【SLOTY】パスワードリセット", body: "以下のリンクからパスワードを再設定してください。", links: [{ label: "パスワードをリセットする", url: `/auth/reset-password?token=${token}` }] });
  addAuthLog(user.id, email, "password_reset");
}
export function resetPasswordWithToken(token: string, newPassword: string): { ok: boolean; error?: string } {
  const entry = consumeToken("reset", token);
  if (!entry) return { ok: false, error: "トークンが無効または期限切れです" };
  const users = getAuthUsers();
  const u = users.find(x => x.id === entry.userId);
  if (!u) return { ok: false, error: "ユーザーが見つかりません" };
  u.passwordHash = hashPassword(newPassword);
  save("auth_users", users);
  return { ok: true };
}

// Email change via token
export function sendEmailChangeEmail(userId: string, currentEmail: string, newEmail: string) {
  if (findAuthUserByEmail(newEmail)) return { ok: false, error: "このメールアドレスは既に使用されています" };
  const token = addToken("emailchange", userId, currentEmail, newEmail);
  addOutboxMail({ to: newEmail, subject: "【SLOTY】メールアドレス変更の確認", body: `メールアドレスを ${newEmail} に変更するには、以下のリンクをクリックしてください。`, links: [{ label: "メールアドレスを変更する", url: `/auth/confirm-email-change?token=${token}` }] });
  return { ok: true };
}
export function confirmEmailChange(token: string): { ok: boolean; error?: string } {
  const entry = consumeToken("emailchange", token);
  if (!entry || !entry.newEmail) return { ok: false, error: "トークンが無効または期限切れです" };
  const users = getAuthUsers();
  const u = users.find(x => x.id === entry.userId);
  if (!u) return { ok: false, error: "ユーザーが見つかりません" };
  const oldEmail = u.email;
  u.email = entry.newEmail;
  save("auth_users", users);
  addAuthLog(u.id, entry.newEmail, "email_change");
  // Update session
  const session = getAuthSession();
  if (session && session.userId === u.id) setAuthSession(u.id, entry.newEmail);
  return { ok: true };
}

// FNV-1a based hash (not reversible, demo substitute for SHA-256)
function simpleHash(str: string): string {
  let h1 = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = ((h1 << 5) - h1 + c) | 0;
  }
  let h2 = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h2 ^= str.charCodeAt(i);
    h2 = Math.imul(h2, 0x01000193);
  }
  return `hash:${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

export function hashPassword(password: string): string {
  return simpleHash(password + "sloty_salt_2024");
}

export function getAuthUsers(): AuthUser[] {
  return load<AuthUser[]>("auth_users", []);
}

export function findAuthUserByEmail(email: string): AuthUser | null {
  return getAuthUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function signupUser(email: string, password: string, displayName: string): { ok: boolean; error?: string; needVerify?: boolean } {
  const users = getAuthUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "このメールアドレスは既に登録されています" };
  }
  const user: AuthUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    email,
    passwordHash: hashPassword(password),
    displayName,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    loginCount: 1,
    status: "active",
  };
  users.push(user);
  save("auth_users", users);
  addAuthLog(user.id, email, "signup");
  setAuthSession(user.id, email);
  return { ok: true, needVerify: false };
}

export function loginUser(email: string, password: string): { ok: boolean; error?: string; needVerify?: boolean } {
  const user = findAuthUserByEmail(email);
  if (!user) {
    addAuthLog("unknown", email, "failed_login");
    return { ok: false, error: "メールアドレスまたはパスワードが正しくありません" };
  }
  if (user.status === "banned") {
    addAuthLog(user.id, email, "failed_login");
    return { ok: false, error: "このアカウントは凍結されています" };
  }
  if (user.passwordHash !== hashPassword(password)) {
    addAuthLog(user.id, email, "failed_login");
    return { ok: false, error: "メールアドレスまたはパスワードが正しくありません" };
  }
  // Require email verification before login
  if (!user.emailVerified) {
    return { ok: false, error: "メールアドレスの確認が完了していません。確認メールのリンクをクリックしてください。", needVerify: true };
  }
  const users = getAuthUsers();
  const u = users.find(x => x.id === user.id);
  if (u) { u.lastLoginAt = new Date().toISOString(); u.loginCount += 1; }
  save("auth_users", users);
  addAuthLog(user.id, email, "login");
  setAuthSession(user.id, email);
  return { ok: true };
}

// Resend verification
export function resendVerificationEmail(email: string) {
  const user = findAuthUserByEmail(email);
  if (user && !user.emailVerified) sendVerificationEmail(user.id, email);
}

export function logoutUser() {
  const session = getAuthSession();
  if (session) addAuthLog(session.userId, session.email, "logout");
  save("auth_session", null);
}

export function getAuthSession(): AuthSession | null {
  const s = load<AuthSession | null>("auth_session", null);
  if (!s) return null;
  if (s.expiresAt < Date.now()) { save("auth_session", null); return null; }
  return s;
}

export function setAuthSession(userId: string, email: string) {
  save("auth_session", {
    userId, email,
    token: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    expiresAt: Date.now() + 24 * 60 * 60_000,
  });
}

export function isLoggedIn(): boolean { return getAuthSession() !== null; }

export function getAuthLog(): AuthLogEntry[] { return load<AuthLogEntry[]>("auth_log", []); }

export function addAuthLog(userId: string, email: string, action: AuthLogEntry["action"], meta?: string) {
  const log = getAuthLog();
  log.unshift({
    id: `alog-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    timestamp: new Date().toISOString(),
    userId, email, action,
    ip: "unknown",
    ua: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 60) : "unknown",
  });
  save("auth_log", log);
}

// Support messages
export type SupportMessage = { id: string; name: string; email: string; message: string; createdAt: string };
export function getSupportMessages(): SupportMessage[] { return load<SupportMessage[]>("support_messages", []); }
export function addSupportMessage(name: string, email: string, message: string) {
  const msgs = getSupportMessages();
  msgs.unshift({ id: `sup-${Date.now()}`, name, email, message, createdAt: new Date().toISOString() });
  save("support_messages", msgs);
}

// ===== Imahima status =====
export function getImahimaStatus(): boolean { return load<boolean>("imahima_status", false); }
export function setImahimaStatus(on: boolean) { save("imahima_status", on); }

// ===== Onboarding Profile =====
export type OnboardingProfile = {
  displayName: string;
  nameKanji: string;
  nameHiragana: string;
  nameKatakana: string;
  isForeigner: boolean;
  birthdate: string;
  gender: string;
  area: string;
  job: string;
  interests: string[];
  bio: string;
};

const EMPTY_ONBOARDING: OnboardingProfile = {
  displayName: "", nameKanji: "", nameHiragana: "", nameKatakana: "",
  isForeigner: false, birthdate: "", gender: "", area: "", job: "",
  interests: [], bio: "",
};

export function getOnboardingProfile(): OnboardingProfile {
  return load<OnboardingProfile>("onboarding_profile", EMPTY_ONBOARDING);
}

export function saveOnboardingProfile(p: OnboardingProfile) {
  save("onboarding_profile", p);
  // Also sync to the legacy DemoProfile
  const existing = getProfile();
  existing.displayName = p.displayName;
  existing.birthdate = p.birthdate;
  existing.gender = p.gender;
  existing.job = p.job;
  existing.hobbyTags = p.interests;
  existing.bio = p.bio;
  existing.bioShort = p.bio;
  saveProfile(existing);
}

export function isProfileComplete(): boolean {
  const p = getOnboardingProfile();
  return !!(p.displayName && p.nameKanji && p.nameHiragana && p.birthdate);
}
