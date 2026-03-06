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

// ===== デモアバター（SVG data URI） =====
function demoAvatar(initial: string, gradient: [string, string]): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${gradient[0]}"/><stop offset="100%" stop-color="${gradient[1]}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="220" font-family="sans-serif" font-size="160" font-weight="bold" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;base64,${typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(svg))) : Buffer.from(svg).toString("base64")}`;
}

const AVATAR_HARUKA = demoAvatar("は", ["#f093fb", "#f5576c"]);
const AVATAR_TAKUYA = demoAvatar("た", ["#4facfe", "#00f2fe"]);
const AVATAR_MISAKI = demoAvatar("み", ["#43e97b", "#38f9d7"]);
const AVATAR_YUTA   = demoAvatar("ゆ", ["#fa709a", "#fee140"]);
const AVATAR_AOI    = demoAvatar("あ", ["#a18cd1", "#fbc2eb"]);
const AVATAR_YUUKI  = demoAvatar("ゆ", ["#667eea", "#764ba2"]);
const AVATAR_SAKURA = demoAvatar("さ", ["#ff9a9e", "#fad0c4"]);

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
      avatarUrl: AVATAR_HARUKA,
      verificationStatus: "verified",
      ratingAvg: 4.8,
      ratingCount: 31,
      cancelRate: 1.2,
      gender: "女性",
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
    areaValue: "駅周辺",
    bookingType: "approval" as const,
    status: "listed",
    seller: {
      id: "user-b",
      displayName: "たくや",
      avatarUrl: AVATAR_TAKUYA,
      verificationStatus: "verified",
      ratingAvg: 4.3,
      ratingCount: 15,
      cancelRate: 5.0,
      gender: "男性",
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
    areaValue: "市内",
    bookingType: "approval" as const,
    status: "listed",
    seller: {
      id: "user-c",
      displayName: "みさき",
      avatarUrl: AVATAR_MISAKI,
      verificationStatus: "none",
      ratingAvg: 4.0,
      ratingCount: 5,
      cancelRate: 0,
      gender: "女性",
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
      avatarUrl: AVATAR_YUTA,
      verificationStatus: "verified",
      ratingAvg: 4.9,
      ratingCount: 42,
      cancelRate: 0.8,
      gender: "男性",
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
      avatarUrl: AVATAR_AOI,
      verificationStatus: "verified",
      ratingAvg: 4.6,
      ratingCount: 20,
      cancelRate: 3.5,
      gender: "女性",
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
    areaValue: "駅周辺",
    bookingType: "instant" as const,
    status: "listed",
    seller: {
      id: "user-b",
      displayName: "たくや",
      avatarUrl: AVATAR_TAKUYA,
      verificationStatus: "verified",
      ratingAvg: 4.3,
      ratingCount: 15,
      cancelRate: 5.0,
      gender: "男性",
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
    photos: [],
    likeCount: 12,
    createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    user: { id: "user-a", displayName: "はるか", avatarUrl: AVATAR_HARUKA },
  },
  {
    id: "post-2",
    text: "カフェで勉強してるけど、一緒にやる人いない？仙台駅周辺です",
    tags: ["study", "work"],
    preferredMode: "in_person",
    photos: [],
    likeCount: 5,
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    user: { id: "user-b", displayName: "たくや", avatarUrl: AVATAR_TAKUYA },
  },
  {
    id: "post-3",
    text: "散歩しながら誰かと話したいな〜 天気いいし！",
    tags: ["walk", "chat"],
    preferredMode: "either",
    photos: [],
    likeCount: 8,
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    user: { id: "user-c", displayName: "みさき", avatarUrl: AVATAR_MISAKI },
  },
  {
    id: "post-4",
    text: "プログラミングの相談乗ってくれる人募集！React分かる方",
    tags: ["consult"],
    preferredMode: "call",
    photos: [],
    likeCount: 15,
    createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
    user: { id: "user-d", displayName: "ゆうた", avatarUrl: AVATAR_YUTA },
  },
  {
    id: "post-5",
    text: "ゲーム一緒にやろう！スプラかスマブラ",
    tags: ["game"],
    preferredMode: "call",
    photos: [],
    likeCount: 22,
    createdAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    user: { id: "user-e", displayName: "あおい", avatarUrl: AVATAR_AOI },
  },
];

// ===== デモフレンド =====
export const DEMO_FRIENDS = [
  {
    id: "friend-1",
    displayName: "ゆうき",
    avatarUrl: AVATAR_YUUKI,
    permissionLevel: "busy_only" as const,
    status: "accepted" as const,
  },
  {
    id: "friend-2",
    displayName: "さくら",
    avatarUrl: AVATAR_SAKURA,
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
// ユーザーの現在地付近にランダム配置（全国対応）
function nearbyOffset() { return (Math.random() - 0.5) * 0.006; }

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
    lat: 35.6812 + nearbyOffset(),
    lng: 139.7671 + nearbyOffset(),
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
    note: "駅近くのスタバにいます",
    lat: 35.6812 + nearbyOffset(),
    lng: 139.7671 + nearbyOffset(),
    distanceRange: "〜500m",
    expiresAt: new Date(Date.now() + 50 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    id: "ci-demo-3",
    userId: "user-c",
    displayName: "みさき",
    bio: "旅行好き🌍 街探索中",
    photoIndex: 0,
    mode: "in_person" as const,
    durationMinutes: 30,
    purpose: "散歩30分",
    note: "天気いいし散歩しよ！",
    lat: 35.6812 + nearbyOffset(),
    lng: 139.7671 + nearbyOffset(),
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
  "最寄り駅 改札前",
  "スターバックス",
  "駅前カフェ",
  "ショッピングモール入口",
  "近くの公園",
];

// ===== プロフィール タグ選択肢 =====
export const PURPOSE_TAG_OPTIONS = ["雑談", "カフェ", "勉強", "作業同行", "散歩", "ゲーム", "相談", "観光", "暇つぶし"];
export const HOBBY_TAG_OPTIONS = ["カフェ巡り", "読書", "映画", "音楽", "旅行", "料理", "スポーツ", "ゲーム", "プログラミング", "写真", "アニメ", "ファッション", "筋トレ", "ヨガ", "登山"];
export const JOB_OPTIONS = ["会社員", "学生", "フリーランス", "自営業", "公務員", "クリエイター", "エンジニア", "医療", "教育", "その他"];
export const WORK_STYLE_OPTIONS = ["フルリモート", "ハイブリッド", "出社", "フリー"];
export const INCOME_RANGE_OPTIONS = ["非公開", "〜300万", "300〜500万", "500〜700万", "700〜1000万", "1000万〜"];
export const LIFE_TAG_OPTIONS = ["非喫煙", "喫煙", "お酒飲む", "お酒飲まない", "朝型", "夜型", "インドア", "アウトドア"];
export const GENDER_OPTIONS = ["男性", "女性", "その他", "非公開"];
export const AREA_TAG_OPTIONS = ["東京", "大阪", "名古屋", "福岡", "札幌", "仙台", "横浜", "京都", "神戸", "広島", "埼玉", "千葉"];
export const CONTACT_STYLE_OPTIONS = ["即レス派", "ゆっくり派", "夜だけ", "平日のみ", "週末のみ"];
export const NG_TAG_OPTIONS = ["通話NG", "対面NG", "タバコNG", "お酒NG", "深夜NG", "早朝NG"];

// ===== POI（近くの候補地点）ユーザーの位置ベースで動的に表示 =====
export const DEMO_POIS: { id: string; name: string; category: string; lat: number; lng: number; note: string }[] = [
  { id: "poi-1", name: "駅前広場", category: "公共", lat: 35.6815 + nearbyOffset(), lng: 139.7670 + nearbyOffset(), note: "雨でもOK・人が多く安全" },
  { id: "poi-2", name: "スターバックス", category: "カフェ", lat: 35.6820 + nearbyOffset(), lng: 139.7680 + nearbyOffset(), note: "Wi-Fi有・長居OK" },
  { id: "poi-3", name: "ショッピングモール", category: "公共", lat: 35.6800 + nearbyOffset(), lng: 139.7660 + nearbyOffset(), note: "わかりやすい待ち合わせスポット" },
  { id: "poi-4", name: "並木道", category: "公園", lat: 35.6825 + nearbyOffset(), lng: 139.7650 + nearbyOffset(), note: "天気いい日の散歩に最適" },
  { id: "poi-5", name: "中央公園", category: "公園", lat: 35.6840 + nearbyOffset(), lng: 139.7640 + nearbyOffset(), note: "広くて開放的" },
  { id: "poi-6", name: "タリーズコーヒー", category: "カフェ", lat: 35.6805 + nearbyOffset(), lng: 139.7675 + nearbyOffset(), note: "コンセント有・静か" },
  { id: "poi-7", name: "定食屋", category: "ご飯", lat: 35.6818 + nearbyOffset(), lng: 139.7685 + nearbyOffset(), note: "テーブル席あり・1人OK" },
  { id: "poi-8", name: "フィットネスジム", category: "公共", lat: 35.6830 + nearbyOffset(), lng: 139.7690 + nearbyOffset(), note: "24h営業" },
  { id: "poi-9", name: "ドトールコーヒー", category: "カフェ", lat: 35.6835 + nearbyOffset(), lng: 139.7655 + nearbyOffset(), note: "リーズナブル・駅近" },
  { id: "poi-10", name: "和食レストラン", category: "ご飯", lat: 35.6810 + nearbyOffset(), lng: 139.7665 + nearbyOffset(), note: "和食定食・1人OK" },
];

// ===== アバター広場データ =====
export type AvatarStyle = {
  hairStyle: number;   // 0-7
  hairColor: string;   // hex
  skinTone: string;    // hex
  topColor: string;    // hex (shirt/top)
  topType: number;     // 0=crew-neck tee, 1=v-neck, 2=collared shirt, 3=hoodie, 4=cardigan, 5=blouse
  bottomColor: string; // hex
  bottomType: number;  // 0=slim pants, 1=wide pants, 2=skirt, 3=shorts
  accessory: number;   // 0=none, 1=glasses, 2=hat, 3=headphones, 4=earrings, 5=scarf
  expression: number;  // 0=neutral, 1=smile, 2=wink, 3=happy, 4=gentle, 5=cool
  bodyPose: number;    // 0=relaxed, 1=hand-on-hip, 2=arms-crossed, 3=wave, 4=hands-behind
  eyeType: number;     // 0=round, 1=almond, 2=soft-droopy, 3=sharp
  eyeColor: string;    // hex
  cheekColor: string;  // hex (blush)
};

export const DEFAULT_AVATAR_STYLES: Record<string, AvatarStyle> = {
  "user-a": { hairStyle: 2, hairColor: "#5C3317", skinTone: "#FFDBB4", topColor: "#f093fb", topType: 5, bottomColor: "#4A4A6A", bottomType: 2, accessory: 0, expression: 1, bodyPose: 0, eyeType: 0, eyeColor: "#4A3520", cheekColor: "#FFB4B4" },
  "user-b": { hairStyle: 0, hairColor: "#2C2C2C", skinTone: "#F5CBA7", topColor: "#4facfe", topType: 2, bottomColor: "#3D3D5C", bottomType: 0, accessory: 1, expression: 0, bodyPose: 1, eyeType: 3, eyeColor: "#2A2A3A", cheekColor: "#F0C0A0" },
  "user-c": { hairStyle: 3, hairColor: "#8B4513", skinTone: "#FFE0BD", topColor: "#E8F0E8", topType: 4, bottomColor: "#5C5C8A", bottomType: 2, accessory: 0, expression: 3, bodyPose: 3, eyeType: 2, eyeColor: "#5A4030", cheekColor: "#FFBCBC" },
  "user-d": { hairStyle: 1, hairColor: "#1A1A2E", skinTone: "#F0C8A0", topColor: "#666680", topType: 3, bottomColor: "#3A3A5E", bottomType: 0, accessory: 3, expression: 5, bodyPose: 2, eyeType: 3, eyeColor: "#1A1A2E", cheekColor: "#E8B8A0" },
  "user-e": { hairStyle: 4, hairColor: "#6B3FA0", skinTone: "#FFDBB4", topColor: "#a18cd1", topType: 0, bottomColor: "#4B4B7A", bottomType: 1, accessory: 4, expression: 1, bodyPose: 0, eyeType: 0, eyeColor: "#6B3FA0", cheekColor: "#F5B0D0" },
};

export type SquareVisitor = {
  id: string;
  userId: string;
  displayName: string;
  gender: string;
  avatarStyle: AvatarStyle;
  bubble: string;
  mode: "call" | "in_person" | "either";
  tags: string[];
  verified: boolean;
  availability: string;
  area: string;
  bio: string;
  ratingAvg: number;
  ratingCount: number;
  /** Position in the plaza as % of width/height (0-100) */
  x: number;
  y: number;
  lastActive: string;
};

/**
 * Plaza visitor positions are based on landmarks in ParkBackground.
 * Coordinates are % of viewBox (800x700):
 * - Fountain center: ~50%, ~48%
 * - Left bench: ~24%, ~57%
 * - Right bench: ~77%, ~58%
 * - Upper bench (near fountain): ~47%, ~42%
 * - Lower bench: ~50%, ~72%
 * - Left tree area: ~12%, ~40%
 * - Right tree area: ~88%, ~43%
 * - Path intersections: ~38%, ~55% / ~62%, ~55%
 * - Lower left path: ~26%, ~75%
 * - Lower right path: ~76%, ~75%
 */
export const DEMO_SQUARE_VISITORS: SquareVisitor[] = [
  {
    // Near left bench — sitting/standing by bench
    id: "sv-1", userId: "user-a", displayName: "はるか", gender: "女性",
    avatarStyle: DEFAULT_AVATAR_STYLES["user-a"],
    bubble: "誰か話そー", mode: "call", tags: ["雑談"], verified: true,
    availability: "今からOK", area: "", bio: "カフェと散歩が好き！気軽に話しかけてね",
    ratingAvg: 4.8, ratingCount: 31, x: 25, y: 54, lastActive: new Date(Date.now() - 3 * 60_000).toISOString(),
  },
  {
    // Near fountain — upper right
    id: "sv-2", userId: "user-b", displayName: "たくや", gender: "男性",
    avatarStyle: DEFAULT_AVATAR_STYLES["user-b"],
    bubble: "作業通話できる人いる？", mode: "either", tags: ["作業", "勉強"], verified: true,
    availability: "30分だけ", area: "仙台駅周辺", bio: "プログラミングと筋トレ",
    ratingAvg: 4.3, ratingCount: 15, x: 58, y: 43, lastActive: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    // Right bench area
    id: "sv-3", userId: "user-c", displayName: "みさき", gender: "女性",
    avatarStyle: DEFAULT_AVATAR_STYLES["user-c"],
    bubble: "今から散歩", mode: "in_person", tags: ["散歩", "雑談"], verified: false,
    availability: "今からOK", area: "市内", bio: "旅行好き 街探索中",
    ratingAvg: 4.0, ratingCount: 5, x: 78, y: 56, lastActive: new Date(Date.now() - 1 * 60_000).toISOString(),
  },
  {
    // Lower bench area
    id: "sv-4", userId: "user-d", displayName: "ゆうた", gender: "男性",
    avatarStyle: DEFAULT_AVATAR_STYLES["user-d"],
    bubble: "相談のります", mode: "call", tags: ["相談"], verified: true,
    availability: "19:00以降対応", area: "", bio: "何でも相談のります。エンジニア5年目",
    ratingAvg: 4.9, ratingCount: 42, x: 52, y: 70, lastActive: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    // Near fountain — left side
    id: "sv-5", userId: "user-e", displayName: "あおい", gender: "女性",
    avatarStyle: DEFAULT_AVATAR_STYLES["user-e"],
    bubble: "ゲームしよ！", mode: "call", tags: ["ゲーム"], verified: true,
    availability: "今日中OK", area: "", bio: "スプラ・スマブラ一緒にやろう",
    ratingAvg: 4.6, ratingCount: 20, x: 42, y: 47, lastActive: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    // Path intersection area — left
    id: "sv-6", userId: "user-f", displayName: "りょう", gender: "男性",
    avatarStyle: { hairStyle: 5, hairColor: "#2C2C2C", skinTone: "#F5CBA7", topColor: "#667eea", topType: 0, bottomColor: "#3D3D5C", bottomType: 0, accessory: 0, expression: 0, bodyPose: 1, eyeType: 1, eyeColor: "#2A2A3A", cheekColor: "#E8C0A8" },
    bubble: "ちょい暇", mode: "call", tags: ["雑談", "ゲーム"], verified: true,
    availability: "1時間OK", area: "渋谷", bio: "デザイナーやってます。ゲーム雑談なんでも",
    ratingAvg: 4.4, ratingCount: 18, x: 35, y: 37, lastActive: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
  {
    // Near right tree — observing from a distance
    id: "sv-7", userId: "user-g", displayName: "ことね", gender: "女性",
    avatarStyle: { hairStyle: 4, hairColor: "#8B4513", skinTone: "#FFE0BD", topColor: "#FF6B6B", topType: 5, bottomColor: "#4A4A6A", bottomType: 2, accessory: 4, expression: 1, bodyPose: 0, eyeType: 2, eyeColor: "#5A4030", cheekColor: "#FFBCBC" },
    bubble: "カフェ行ける人", mode: "in_person", tags: ["カフェ"], verified: false,
    availability: "今からOK", area: "新宿", bio: "カフェ巡りが趣味です☕",
    ratingAvg: 4.2, ratingCount: 8, x: 85, y: 42, lastActive: new Date(Date.now() - 4 * 60_000).toISOString(),
  },
  {
    // Near left tree — slightly apart
    id: "sv-8", userId: "user-h", displayName: "そうた", gender: "男性",
    avatarStyle: { hairStyle: 6, hairColor: "#1A1A2E", skinTone: "#F0C8A0", topColor: "#2C2C2C", topType: 2, bottomColor: "#3A3A5E", bottomType: 0, accessory: 1, expression: 4, bodyPose: 4, eyeType: 1, eyeColor: "#2A2A3A", cheekColor: "#E0B8A0" },
    bubble: "30分だけOK", mode: "either", tags: ["相談", "作業"], verified: true,
    availability: "30分OK", area: "", bio: "フリーランスエンジニア。気軽にどうぞ",
    ratingAvg: 4.7, ratingCount: 35, x: 15, y: 40, lastActive: new Date(Date.now() - 7 * 60_000).toISOString(),
  },
];

// ===== 着せ替えオプション =====
export const HAIR_STYLE_NAMES = ["ショート", "ミディアム", "ロング", "ボブ", "ポニーテール", "マッシュ", "センター分け", "ウルフ"];
export const HAIR_COLORS = ["#1A1A2E", "#2C2C2C", "#5C3317", "#8B4513", "#D4A574", "#C0392B", "#6B3FA0", "#E8B4B8", "#C8A882", "#4A6B8A"];
export const SKIN_TONES = ["#FFDBB4", "#F5CBA7", "#F0C8A0", "#FFE0BD", "#D4A574", "#C19A6B"];
export const TOP_COLORS = ["#f093fb", "#4facfe", "#43e97b", "#fa709a", "#a18cd1", "#667eea", "#FF6B6B", "#FFF3E0", "#E0F7FA", "#2C2C2C", "#E8F0E8", "#666680"];
export const TOP_TYPE_NAMES = ["Tシャツ", "Vネック", "シャツ", "パーカー", "カーディガン", "ブラウス"];
export const BOTTOM_COLORS = ["#3A3A5E", "#3D3D5C", "#4A4A6A", "#4B4B7A", "#5C5C8A", "#2C2C2C", "#7B8CFF", "#C4956A"];
export const BOTTOM_TYPE_NAMES = ["スリムパンツ", "ワイドパンツ", "スカート", "ショートパンツ"];
export const ACCESSORY_NAMES = ["なし", "メガネ", "帽子", "ヘッドホン", "ピアス", "マフラー"];
export const EXPRESSION_NAMES = ["ふつう", "にっこり", "ウインク", "わーい", "やさしい", "クール"];
export const BODY_POSE_NAMES = ["リラックス", "腰に手", "腕組み", "手振り", "後ろ手"];
export const EYE_TYPE_NAMES = ["まるめ", "アーモンド", "たれ目", "つり目"];
export const EYE_COLORS = ["#2A2A3A", "#4A3520", "#5A4030", "#1A1A2E", "#6B3FA0", "#4A6B5A"];
export const CHEEK_COLORS = ["#FFB4B4", "#FFBCBC", "#F5B0D0", "#F0C0A0", "#E8C0A8", "#E8B8A0", "#E0B8A0", "#00000000"];

export const BUBBLE_TEMPLATES = [
  "誰か話そー", "ちょい暇", "通話OK", "対面OK",
  "30分だけ雑談OK", "作業通話できる人いる？", "カフェ行ける人",
  "今から散歩", "相談のります", "暇つぶし中", "ゲームしよ！",
  "勉強中…休憩したい", "近くにいる人いる？",
];

// ===== フレンドカレンダーデモイベント =====
export function getDemoFriendCalendarEvents(friendId: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const events: { startAt: string; endAt: string; type: "busy" | "free"; title?: string }[] = [];
  for (let day = 0; day < 14; day++) {
    const d = new Date(today.getTime() + day * 86400_000);
    if (day % 2 === 0) {
      const s = new Date(d); s.setHours(9, 0);
      const e = new Date(d); e.setHours(12, 0);
      events.push({ startAt: s.toISOString(), endAt: e.toISOString(), type: "busy", title: friendId === "friend-2" ? "仕事" : undefined });
    }
    if (day % 3 === 0) {
      const s = new Date(d); s.setHours(14, 0);
      const e = new Date(d); e.setHours(16, 0);
      events.push({ startAt: s.toISOString(), endAt: e.toISOString(), type: "busy", title: friendId === "friend-2" ? "予定あり" : undefined });
    }
    if (day % 4 === 1) {
      const s = new Date(d); s.setHours(18, 0);
      const e = new Date(d); e.setHours(20, 0);
      events.push({ startAt: s.toISOString(), endAt: e.toISOString(), type: "free" });
    }
  }
  return events;
}
