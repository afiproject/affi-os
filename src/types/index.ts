// ========================================
// Affi OS — 型定義
// ========================================

// ---------- User / Account ----------
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  platform: "x" | "other";
  username: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------- Affiliate ----------
export interface AffiliateSource {
  id: string;
  name: string;
  type: string; // ASP名など
  base_url: string;
  is_active: boolean;
  created_at: string;
}

export interface AffiliateItem {
  id: string;
  source_id: string;
  external_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail_url: string;
  sample_video_url: string;
  cached_video_url?: string;
  affiliate_url: string;
  is_free_trial: boolean;
  popularity_score: number;
  freshness_score: number;
  collected_at: string;
  is_excluded: boolean;
  exclusion_reason?: string;
}

// ---------- Candidate ----------
export type CandidateStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "alternative_requested"
  | "regenerate_requested";

export interface CandidatePost {
  id: string;
  item_id: string;
  account_id: string;
  item: AffiliateItem;
  status: CandidateStatus;
  ai_score: number;
  freshness_score: number;
  popularity_score: number;
  free_trial_score: number;
  historical_ctr_score: number;
  time_fitness_score: number;
  duplicate_risk_score: number;
  safety_score: number;
  total_score: number;
  estimated_ctr: number;
  recommended_time: string;
  recommendation_reason: string;
  risk_flags: RiskFlag[];
  has_alternative: boolean;
  variants: CandidatePostVariant[];
  created_at: string;
  updated_at: string;
}

export interface CandidatePostVariant {
  id: string;
  candidate_id: string;
  variant_label: string; // A, B, C
  body_text: string;
  tone: "click_bait" | "natural" | "informative" | "casual" | "urgent";
  length: "short" | "medium" | "long";
  hashtags: string[];
  is_selected: boolean;
  created_at: string;
}

export interface RiskFlag {
  type: "duplicate" | "wording" | "time_conflict" | "frequency" | "category_overuse";
  severity: "low" | "medium" | "high";
  message: string;
}

// ---------- Schedule ----------
export type ScheduleStatus =
  | "scheduled"
  | "pending_approval"
  | "posted"
  | "failed"
  | "paused"
  | "cancelled";

export interface ScheduledPost {
  id: string;
  candidate_id: string;
  account_id: string;
  variant_id: string;
  candidate: CandidatePost;
  variant: CandidatePostVariant;
  scheduled_at: string;
  posted_at?: string;
  status: ScheduleStatus;
  post_mode: "A" | "B";
  custom_body_text?: string;
  retry_count: number;
  error_message?: string;
  external_post_id?: string;
  reply_post_id?: string;
  created_at: string;
  updated_at: string;
}

// ---------- Performance ----------
export interface PostedLog {
  id: string;
  scheduled_post_id: string;
  external_post_id: string;
  posted_at: string;
  body_text: string;
  affiliate_url: string;
  category: string;
  tags: string[];
  tone: string;
  account_id: string;
}

export interface PerformanceMetric {
  id: string;
  posted_log_id: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  engagements: number;
  retweets: number;
  likes: number;
  replies: number;
  conversions: number;
  revenue: number;
  collected_at: string;
}

// ---------- Settings ----------
export interface SystemSettings {
  id: string;
  daily_post_limit: number;
  min_interval_minutes: number;
  allow_night_posts: boolean;
  night_start_hour: number;
  night_end_hour: number;
  ai_provider: "claude" | "openai";
  ai_model: string;
  risk_threshold: number;
  auto_collect_enabled: boolean;
  auto_score_enabled: boolean;
  auto_generate_enabled: boolean;
  updated_at: string;
}

export interface AccountSettings {
  id: string;
  account_id: string;
  daily_post_limit: number;
  min_interval_minutes: number;
  preferred_tone: string;
  preferred_length: string;
  ng_words: string[];
  ng_categories: string[];
  priority_categories: string[];
  updated_at: string;
}

export interface ContentRule {
  id: string;
  rule_type: "ng_word" | "ng_category" | "priority_category" | "required_hashtag";
  value: string;
  is_active: boolean;
  created_at: string;
}

// ---------- Logs ----------
export interface AIGenerationLog {
  id: string;
  candidate_id?: string;
  prompt_type: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface ApprovalLog {
  id: string;
  candidate_id: string;
  action: "approved" | "rejected" | "alternative" | "regenerate" | "time_change";
  note?: string;
  created_at: string;
}

export interface WorkflowLog {
  id: string;
  workflow_type: "collect" | "score" | "generate" | "post" | "analyze";
  status: "started" | "completed" | "failed";
  items_processed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface ErrorLog {
  id: string;
  source: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ---------- Dashboard ----------
export interface DashboardStats {
  recommended_post_count: number;
  pending_approval_count: number;
  scheduled_today_count: number;
  recent_clicks: number;
  recent_ctr: number;
  top_categories: { category: string; score: number }[];
  recommended_hours: number[];
  system_status: "healthy" | "warning" | "error";
  recent_errors: ErrorLog[];
  recent_approvals: ApprovalLog[];
}

// ---------- Analytics ----------
export interface DailyAnalytics {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  posts_count: number;
  approved_count: number;
  rejected_count: number;
}

export interface CategoryAnalytics {
  category: string;
  total_posts: number;
  total_clicks: number;
  avg_ctr: number;
  total_conversions: number;
}

export interface HourlyAnalytics {
  hour: number;
  avg_clicks: number;
  avg_ctr: number;
  post_count: number;
}

export interface ToneAnalytics {
  tone: string;
  total_posts: number;
  avg_ctr: number;
  avg_clicks: number;
}
