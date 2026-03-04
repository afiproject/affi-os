// DEMO_MODE フラグ（サーバー/クライアント両方で利用可能）
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

// ===== デモユーザー =====
export const DEMO_USER = {
  id: "demo-user-1",
  displayName: "あなた（デモ）",
  avatarUrl: null,
  email: "demo@sloty.app",
  ticketBalance: 18,
  verificationStatus: "verified" as const,
  ratingAvg: 4.5,
  ratingCount: 12,
  cancelRate: 2.1,
};

// ===== デモスロット =====
function futureDate(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3600_000).toISOString();
}

export const DEMO_SLOTS = [
  {
    id: "slot-1",
    category: "chat",
    mode: "call" as const,
    startAt: futureDate(2),
    endAt: futureDate(3),
    durationMinutes: 60,
    priceYen: 500,
    areaValue: null,
    bookingType: "instant" as const,
    status: "listed",
    seller: {
      id: "user-a",
      displayName: "はるか",
      avatarUrl: null,
      verificationStatus: "verified",
      ratingAvg: 4.8,
      ratingCount: 31,
      cancelRate: 1.2,
    },
  },
  {
    id: "slot-2",
    category: "study",
    mode: "in_person" as const,
    startAt: futureDate(4),
    endAt: futureDate(5),
    durationMinutes: 60,
    priceYen: 800,
    areaValue: "仙台駅周辺",
    bookingType: "approval" as const,
    status: "listed",
    seller: {
      id: "user-b",
      displayName: "たくや",
      avatarUrl: null,
      verificationStatus: "verified",
      ratingAvg: 4.3,
      ratingCount: 15,
      cancelRate: 5.0,
    },
  },
  {
    id: "slot-3",
    category: "walk",
    mode: "in_person" as const,
    startAt: futureDate(6),
    endAt: futureDate(7),
    durationMinutes: 60,
    priceYen: 600,
    areaValue: "青葉区",
    bookingType: "approval" as const,
    status: "listed",
    seller: {
      id: "user-c",
      displayName: "みさき",
      avatarUrl: null,
      verificationStatus: "none",
      ratingAvg: 4.0,
      ratingCount: 5,
      cancelRate: 0,
    },
  },
  {
    id: "slot-4",
    category: "consult",
    mode: "call" as const,
    startAt: futureDate(1),
    endAt: futureDate(1.5),
    durationMinutes: 30,
    priceYen: 300,
    areaValue: null,
    bookingType: "instant" as const,
    status: "listed",
    seller: {
      id: "user-d",
      displayName: "ゆうた",
      avatarUrl: null,
      verificationStatus: "verified",
      ratingAvg: 4.9,
      ratingCount: 42,
      cancelRate: 0.8,
    },
  },
  {
    id: "slot-5",
    category: "game",
    mode: "call" as const,
    startAt: futureDate(3),
    endAt: futureDate(4.5),
    durationMinutes: 90,
    priceYen: 400,
    areaValue: null,
    bookingType: "instant" as const,
    status: "listed",
    seller: {
      id: "user-e",
      displayName: "あおい",
      avatarUrl: null,
      verificationStatus: "verified",
      ratingAvg: 4.6,
      ratingCount: 20,
      cancelRate: 3.5,
    },
  },
  {
    id: "slot-6",
    category: "work",
    mode: "in_person" as const,
    startAt: futureDate(5),
    endAt: futureDate(6),
    durationMinutes: 60,
    priceYen: 700,
    areaValue: "仙台駅周辺",
    bookingType: "instant" as const,
    status: "listed",
    seller: {
      id: "user-b",
      displayName: "たくや",
      avatarUrl: null,
      verificationStatus: "verified",
      ratingAvg: 4.3,
      ratingCount: 15,
      cancelRate: 5.0,
    },
  },
];

// ===== デモ広場投稿 =====
export const DEMO_POSTS = [
  {
    id: "post-1",
    text: "今日の午後暇だ〜 誰か雑談しない？",
    tags: ["chat"],
    preferredMode: "call",
    likeCount: 12,
    createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    user: { id: "user-a", displayName: "はるか", avatarUrl: null },
  },
  {
    id: "post-2",
    text: "カフェで勉強してるけど、一緒にやる人いない？仙台駅周辺です",
    tags: ["study", "work"],
    preferredMode: "in_person",
    likeCount: 5,
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    user: { id: "user-b", displayName: "たくや", avatarUrl: null },
  },
  {
    id: "post-3",
    text: "散歩しながら誰かと話したいな〜 天気いいし！",
    tags: ["walk", "chat"],
    preferredMode: "either",
    likeCount: 8,
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    user: { id: "user-c", displayName: "みさき", avatarUrl: null },
  },
  {
    id: "post-4",
    text: "プログラミングの相談乗ってくれる人募集！React分かる方",
    tags: ["consult"],
    preferredMode: "call",
    likeCount: 15,
    createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
    user: { id: "user-d", displayName: "ゆうた", avatarUrl: null },
  },
  {
    id: "post-5",
    text: "ゲーム一緒にやろう！スプラかスマブラ",
    tags: ["game"],
    preferredMode: "call",
    likeCount: 22,
    createdAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    user: { id: "user-e", displayName: "あおい", avatarUrl: null },
  },
];

// ===== デモフレンド =====
export const DEMO_FRIENDS = [
  {
    id: "friend-1",
    displayName: "ゆうき",
    avatarUrl: null,
    permissionLevel: "busy_only" as const,
    status: "accepted" as const,
  },
  {
    id: "friend-2",
    displayName: "さくら",
    avatarUrl: null,
    permissionLevel: "title" as const,
    status: "accepted" as const,
  },
];

// ===== デモカレンダー（Free/Busy） =====
export function getDemoCalendarEvents(friendId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = [];
  for (let day = 0; day < 7; day++) {
    const d = new Date(today.getTime() + day * 86400_000);
    // 午前のbusy
    if (day % 2 === 0) {
      const s = new Date(d);
      s.setHours(9, 0);
      const e = new Date(d);
      e.setHours(12, 0);
      events.push({
        startAt: s.toISOString(),
        endAt: e.toISOString(),
        type: "busy" as const,
        title: friendId === "friend-2" ? "仕事" : undefined,
      });
    }
    // 午後のbusy
    if (day % 3 === 0) {
      const s = new Date(d);
      s.setHours(14, 0);
      const e = new Date(d);
      e.setHours(16, 0);
      events.push({
        startAt: s.toISOString(),
        endAt: e.toISOString(),
        type: "busy" as const,
        title: friendId === "friend-2" ? "予定あり" : undefined,
      });
    }
  }
  return events;
}

// ===== デモチケット履歴 =====
export const DEMO_TICKET_LEDGER = [
  { delta: 20, reason: "初回登録ボーナス", createdAt: new Date(Date.now() - 7 * 86400_000).toISOString() },
  { delta: -2, reason: "広場投稿", createdAt: new Date(Date.now() - 5 * 86400_000).toISOString() },
  { delta: -5, reason: "時間共有依頼", createdAt: new Date(Date.now() - 3 * 86400_000).toISOString() },
  { delta: 2, reason: "依頼拒否（返金）", createdAt: new Date(Date.now() - 3 * 86400_000).toISOString() },
  { delta: 1, reason: "ログインボーナス", createdAt: new Date(Date.now() - 1 * 86400_000).toISOString() },
  { delta: 2, reason: "取引完了ボーナス", createdAt: new Date(Date.now() - 12 * 3600_000).toISOString() },
];

// ===== カテゴリラベル =====
export const CATEGORY_LABELS: Record<string, string> = {
  chat: "雑談",
  work: "作業同行",
  study: "勉強",
  consult: "相談",
  walk: "散歩",
  sightseeing: "観光",
  event: "イベント同行",
  game: "ゲーム",
};

export const TAG_LABELS: Record<string, string> = {
  chat: "雑談",
  work: "作業",
  study: "勉強",
  consult: "相談",
  game: "ゲーム",
  walk: "散歩",
  sightseeing: "観光",
  event: "イベント同行",
};

// ===== すれ違いデモデータ =====
export const PURPOSE_TEMPLATES = [
  "今から30分カフェ",
  "今から60分暇つぶし",
  "通話30分雑談",
  "作業同行30分（黙々OK）",
  "散歩30分",
  "通話15分軽くおしゃべり",
  "カフェ作業60分",
  "ゲーム一緒にやろう",
];

// デモ近隣チェックイン（他ユーザー）
export const DEMO_NEARBY_CHECKINS = [
  {
    id: "ci-demo-1",
    userId: "user-a",
    displayName: "はるか",
    bio: "カフェと散歩が好き！気軽に話しかけてね",
    photoIndex: 0,
    mode: "call" as const,
    durationMinutes: 30,
    purpose: "通話30分雑談",
    note: "暇してます〜",
    lat: 38.2605,
    lng: 140.8825,
    distanceRange: "〜300m",
    expiresAt: new Date(Date.now() + 25 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: "ci-demo-2",
    userId: "user-b",
    displayName: "たくや",
    bio: "プログラミングと筋トレ💪",
    photoIndex: 0,
    mode: "in_person" as const,
    durationMinutes: 60,
    purpose: "カフェ作業60分",
    note: "仙台駅近くのスタバにいます",
    lat: 38.2602,
    lng: 140.8830,
    distanceRange: "〜500m",
    expiresAt: new Date(Date.now() + 50 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    id: "ci-demo-3",
    userId: "user-c",
    displayName: "みさき",
    bio: "旅行好き🌍 仙台探索中",
    photoIndex: 0,
    mode: "in_person" as const,
    durationMinutes: 30,
    purpose: "散歩30分",
    note: "天気いいし散歩しよ！",
    lat: 38.2610,
    lng: 140.8820,
    distanceRange: "〜800m",
    expiresAt: new Date(Date.now() + 20 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
];

// デモ用プロフィール写真プレースホルダ
export const DEMO_PHOTO_PLACEHOLDERS = [
  "demo-photo-1",
  "demo-photo-2",
  "demo-photo-3",
  "demo-photo-4",
  "demo-photo-5",
];

// 場所テンプレ（対面用）
export const MEETUP_PLACES = [
  "仙台駅 東口",
  "仙台駅 西口",
  "青葉通り スタバ前",
  "仙台パルコ 1F",
  "勾当台公園",
];
