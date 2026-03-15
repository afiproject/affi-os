// ========================================
// Affi OS — ダミーデータ
// ========================================
import type {
  AffiliateItem,
  CandidatePost,
  CandidatePostVariant,
  ScheduledPost,
  DashboardStats,
  DailyAnalytics,
  CategoryAnalytics,
  HourlyAnalytics,
  ToneAnalytics,
  ApprovalLog,
  ErrorLog,
  SystemSettings,
  AccountSettings,
  ContentRule,
  WorkflowLog,
} from "@/types";

// ---------- Affiliate Items ----------
export const demoItems: AffiliateItem[] = [
  {
    id: "item-1",
    source_id: "src-1",
    external_id: "ext-001",
    title: "人気作品A - 無料視聴キャンペーン",
    description: "期間限定で全話無料公開中。高評価の人気シリーズ。",
    category: "動画",
    tags: ["無料", "人気", "キャンペーン"],
    thumbnail_url: "",
    sample_video_url: "",
    affiliate_url: "https://example.com/aff/001",
    is_free_trial: true,
    popularity_score: 92,
    freshness_score: 95,
    collected_at: new Date().toISOString(),
    is_excluded: false,
  },
  {
    id: "item-2",
    source_id: "src-1",
    external_id: "ext-002",
    title: "新作コンテンツB - 本日公開",
    description: "話題の新作が本日より配信開始。初回無料あり。",
    category: "動画",
    tags: ["新作", "初回無料", "話題"],
    thumbnail_url: "",
    sample_video_url: "",
    affiliate_url: "https://example.com/aff/002",
    is_free_trial: true,
    popularity_score: 88,
    freshness_score: 100,
    collected_at: new Date().toISOString(),
    is_excluded: false,
  },
  {
    id: "item-3",
    source_id: "src-1",
    external_id: "ext-003",
    title: "ランキング1位作品C",
    description: "今週のランキング1位。圧倒的な人気を誇る作品。",
    category: "コミック",
    tags: ["ランキング", "1位", "人気"],
    thumbnail_url: "",
    sample_video_url: "",
    affiliate_url: "https://example.com/aff/003",
    is_free_trial: false,
    popularity_score: 98,
    freshness_score: 70,
    collected_at: new Date().toISOString(),
    is_excluded: false,
  },
  {
    id: "item-4",
    source_id: "src-2",
    external_id: "ext-004",
    title: "限定コンテンツD - 期間限定公開",
    description: "今月末までの期間限定。見逃し注意の話題作。",
    category: "動画",
    tags: ["期間限定", "話題", "おすすめ"],
    thumbnail_url: "",
    sample_video_url: "",
    affiliate_url: "https://example.com/aff/004",
    is_free_trial: true,
    popularity_score: 85,
    freshness_score: 80,
    collected_at: new Date().toISOString(),
    is_excluded: false,
  },
  {
    id: "item-5",
    source_id: "src-2",
    external_id: "ext-005",
    title: "人気シリーズE - 最新話更新",
    description: "大人気シリーズの最新話が更新。ファン必見の展開。",
    category: "コミック",
    tags: ["シリーズ", "最新話", "人気"],
    thumbnail_url: "",
    sample_video_url: "",
    affiliate_url: "https://example.com/aff/005",
    is_free_trial: false,
    popularity_score: 82,
    freshness_score: 90,
    collected_at: new Date().toISOString(),
    is_excluded: false,
  },
];

// ---------- Candidate Post Variants ----------
function makeVariants(candidateId: string): CandidatePostVariant[] {
  return [
    {
      id: `${candidateId}-v-a`,
      candidate_id: candidateId,
      variant_label: "A",
      body_text: "🔥今だけ無料で見れる話題の作品、もうチェックした？\n期間限定だから早めにどうぞ👀\n詳しくはこちら↓",
      tone: "click_bait",
      length: "short",
      hashtags: ["#無料", "#期間限定", "#おすすめ"],
      is_selected: true,
      created_at: new Date().toISOString(),
    },
    {
      id: `${candidateId}-v-b`,
      candidate_id: candidateId,
      variant_label: "B",
      body_text: "最近話題になっている作品、無料で視聴できるキャンペーン中みたいです。\n気になる方はリンクからどうぞ。",
      tone: "natural",
      length: "medium",
      hashtags: ["#おすすめ作品"],
      is_selected: false,
      created_at: new Date().toISOString(),
    },
    {
      id: `${candidateId}-v-c`,
      candidate_id: candidateId,
      variant_label: "C",
      body_text: "この作品、無料キャンペーンやってるので見てみてください。個人的にかなり良かったです。",
      tone: "casual",
      length: "short",
      hashtags: [],
      is_selected: false,
      created_at: new Date().toISOString(),
    },
  ];
}

// ---------- Candidate Posts ----------
export const demoCandidates: CandidatePost[] = demoItems.map((item, i) => {
  const id = `cand-${i + 1}`;
  const hours = [10, 12, 15, 19, 21];
  const statuses: CandidatePost["status"][] = ["pending", "pending", "approved", "pending", "rejected"];
  return {
    id,
    item_id: item.id,
    account_id: "acc-1",
    item,
    status: statuses[i],
    ai_score: 70 + Math.floor(Math.random() * 25),
    freshness_score: item.freshness_score,
    popularity_score: item.popularity_score,
    free_trial_score: item.is_free_trial ? 90 : 30,
    historical_ctr_score: 50 + Math.floor(Math.random() * 40),
    time_fitness_score: 60 + Math.floor(Math.random() * 30),
    duplicate_risk_score: Math.floor(Math.random() * 30),
    safety_score: 80 + Math.floor(Math.random() * 20),
    total_score: 60 + Math.floor(Math.random() * 35),
    estimated_ctr: parseFloat((1.5 + Math.random() * 3.5).toFixed(2)),
    recommended_time: `${hours[i]}:00`,
    recommendation_reason:
      i === 0
        ? "無料キャンペーン中で高CTRが期待できる新着コンテンツ"
        : i === 1
        ? "本日公開の新作。初動のクリック率が高い傾向"
        : i === 2
        ? "ランキング1位の安定した人気作品"
        : i === 3
        ? "期間限定の希少性が高く、CTR上昇が見込める"
        : "シリーズファンからの安定したクリックが期待できる",
    risk_flags:
      i === 4
        ? [{ type: "duplicate", severity: "medium", message: "類似投稿が3日前にあります" }]
        : i === 2
        ? [{ type: "category_overuse", severity: "low", message: "コミックカテゴリが今週多め" }]
        : [],
    has_alternative: i < 3,
    variants: makeVariants(id),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

// ---------- Scheduled Posts ----------
export const demoScheduled: ScheduledPost[] = [
  {
    id: "sched-1",
    candidate_id: "cand-3",
    account_id: "acc-1",
    variant_id: "cand-3-v-a",
    candidate: demoCandidates[2],
    variant: demoCandidates[2].variants[0],
    scheduled_at: new Date(Date.now() + 2 * 3600000).toISOString(),
    status: "scheduled",
    post_mode: "A",
    retry_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ---------- Dashboard Stats ----------
export const demoDashboardStats: DashboardStats = {
  recommended_post_count: 5,
  pending_approval_count: 3,
  scheduled_today_count: 1,
  recent_clicks: 247,
  recent_ctr: 3.2,
  top_categories: [
    { category: "動画", score: 85 },
    { category: "コミック", score: 72 },
    { category: "ゲーム", score: 58 },
  ],
  recommended_hours: [10, 12, 15, 19, 21],
  system_status: "healthy",
  recent_errors: [],
  recent_approvals: [
    {
      id: "appr-1",
      candidate_id: "cand-3",
      action: "approved",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "appr-2",
      candidate_id: "cand-5",
      action: "rejected",
      note: "重複のため",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
};

// ---------- Analytics ----------
export const demoDailyAnalytics: DailyAnalytics[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const clicks = 100 + Math.floor(Math.random() * 200);
  const impressions = clicks * (15 + Math.floor(Math.random() * 20));
  return {
    date: d.toISOString().split("T")[0],
    clicks,
    impressions,
    ctr: parseFloat(((clicks / impressions) * 100).toFixed(2)),
    posts_count: 3 + Math.floor(Math.random() * 4),
    approved_count: 3 + Math.floor(Math.random() * 3),
    rejected_count: Math.floor(Math.random() * 2),
  };
});

export const demoCategoryAnalytics: CategoryAnalytics[] = [
  { category: "動画", total_posts: 45, total_clicks: 1230, avg_ctr: 3.8, total_conversions: 12 },
  { category: "コミック", total_posts: 32, total_clicks: 890, avg_ctr: 3.1, total_conversions: 8 },
  { category: "ゲーム", total_posts: 18, total_clicks: 420, avg_ctr: 2.5, total_conversions: 3 },
  { category: "アプリ", total_posts: 12, total_clicks: 310, avg_ctr: 2.9, total_conversions: 5 },
];

export const demoHourlyAnalytics: HourlyAnalytics[] = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  avg_clicks: h >= 10 && h <= 23 ? 10 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 5),
  avg_ctr: h >= 19 && h <= 23 ? 3 + Math.random() * 2 : 1 + Math.random() * 2,
  post_count: h >= 10 && h <= 22 ? Math.floor(Math.random() * 5) : 0,
}));

export const demoToneAnalytics: ToneAnalytics[] = [
  { tone: "click_bait", total_posts: 28, avg_ctr: 4.1, avg_clicks: 32 },
  { tone: "natural", total_posts: 35, avg_ctr: 3.2, avg_clicks: 25 },
  { tone: "casual", total_posts: 22, avg_ctr: 2.8, avg_clicks: 20 },
  { tone: "informative", total_posts: 15, avg_ctr: 2.5, avg_clicks: 18 },
  { tone: "urgent", total_posts: 10, avg_ctr: 3.8, avg_clicks: 28 },
];

// ---------- Settings ----------
export const demoSystemSettings: SystemSettings = {
  id: "sys-1",
  daily_post_limit: 6,
  min_interval_minutes: 90,
  allow_night_posts: false,
  night_start_hour: 1,
  night_end_hour: 6,
  ai_provider: "claude",
  ai_model: "claude-sonnet-4-6",
  risk_threshold: 70,
  auto_collect_enabled: true,
  auto_score_enabled: true,
  auto_generate_enabled: true,
  updated_at: new Date().toISOString(),
};

export const demoAccountSettings: AccountSettings = {
  id: "accs-1",
  account_id: "acc-1",
  daily_post_limit: 6,
  min_interval_minutes: 90,
  preferred_tone: "natural",
  preferred_length: "medium",
  ng_words: ["詐欺", "100%", "絶対"],
  ng_categories: [],
  priority_categories: ["動画", "コミック"],
  updated_at: new Date().toISOString(),
};

export const demoContentRules: ContentRule[] = [
  { id: "rule-1", rule_type: "ng_word", value: "詐欺", is_active: true, created_at: new Date().toISOString() },
  { id: "rule-2", rule_type: "ng_word", value: "100%", is_active: true, created_at: new Date().toISOString() },
  { id: "rule-3", rule_type: "priority_category", value: "動画", is_active: true, created_at: new Date().toISOString() },
  { id: "rule-4", rule_type: "priority_category", value: "コミック", is_active: true, created_at: new Date().toISOString() },
];

// ---------- Workflow Logs ----------
export const demoWorkflowLogs: WorkflowLog[] = [
  {
    id: "wf-1",
    workflow_type: "collect",
    status: "completed",
    items_processed: 15,
    started_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 3 + 45000).toISOString(),
  },
  {
    id: "wf-2",
    workflow_type: "score",
    status: "completed",
    items_processed: 15,
    started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 2 + 12000).toISOString(),
  },
  {
    id: "wf-3",
    workflow_type: "generate",
    status: "completed",
    items_processed: 5,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 3600000 + 30000).toISOString(),
  },
];
