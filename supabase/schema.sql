-- ========================================
-- Affi OS — Supabase DB Schema
-- ========================================

-- ---------- Users ----------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Accounts (X等のSNSアカウント) ----------
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'x',        -- x, other
  username TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- ---------- Affiliate Sources (ASP/素材元) ----------
CREATE TABLE IF NOT EXISTS affiliate_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,                        -- ASP名
  base_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Affiliate Items (収集した素材) ----------
CREATE TABLE IF NOT EXISTS affiliate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES affiliate_sources(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  sample_video_url TEXT NOT NULL DEFAULT '',
  affiliate_url TEXT NOT NULL,
  is_free_trial BOOLEAN NOT NULL DEFAULT false,
  popularity_score INTEGER NOT NULL DEFAULT 0,
  freshness_score INTEGER NOT NULL DEFAULT 0,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_excluded BOOLEAN NOT NULL DEFAULT false,
  exclusion_reason TEXT,
  UNIQUE(source_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_items_source ON affiliate_items(source_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON affiliate_items(category);
CREATE INDEX IF NOT EXISTS idx_items_collected ON affiliate_items(collected_at DESC);

-- ---------- Candidate Posts (投稿候補) ----------
CREATE TABLE IF NOT EXISTS candidate_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES affiliate_items(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',     -- pending, approved, rejected, alternative_requested, regenerate_requested
  ai_score INTEGER NOT NULL DEFAULT 0,
  freshness_score INTEGER NOT NULL DEFAULT 0,
  popularity_score INTEGER NOT NULL DEFAULT 0,
  free_trial_score INTEGER NOT NULL DEFAULT 0,
  historical_ctr_score INTEGER NOT NULL DEFAULT 0,
  time_fitness_score INTEGER NOT NULL DEFAULT 0,
  duplicate_risk_score INTEGER NOT NULL DEFAULT 0,
  safety_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  estimated_ctr NUMERIC(5,2) NOT NULL DEFAULT 0,
  recommended_time TEXT NOT NULL DEFAULT '12:00',
  recommendation_reason TEXT NOT NULL DEFAULT '',
  risk_flags JSONB NOT NULL DEFAULT '[]',     -- [{type, severity, message}]
  has_alternative BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_candidates_account ON candidate_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidate_posts(status);
CREATE INDEX IF NOT EXISTS idx_candidates_score ON candidate_posts(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_date ON candidate_posts(created_at DESC);

-- ---------- Candidate Post Variants (文面バリエーション) ----------
CREATE TABLE IF NOT EXISTS candidate_post_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_posts(id) ON DELETE CASCADE,
  variant_label TEXT NOT NULL DEFAULT 'A',   -- A, B, C
  body_text TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'natural',       -- click_bait, natural, informative, casual, urgent
  length TEXT NOT NULL DEFAULT 'medium',      -- short, medium, long
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_variants_candidate ON candidate_post_variants(candidate_id);

-- ---------- Scheduled Posts (予約済み投稿) ----------
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_posts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES candidate_post_variants(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',   -- scheduled, pending_approval, posted, failed, paused, cancelled
  post_mode TEXT NOT NULL DEFAULT 'A',          -- A: 動画+テキスト+リンク1ツイート, B: 動画+テキスト→リプライにリンク
  custom_body_text TEXT,                        -- ユーザーが手入力した文面（NULLならAI生成を使用）
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  external_post_id TEXT,
  reply_post_id TEXT,                           -- モードB時のリプライツイートID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scheduled_account ON scheduled_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_time ON scheduled_posts(scheduled_at);

-- ---------- Posted Logs (投稿結果ログ) ----------
CREATE TABLE IF NOT EXISTS posted_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id UUID NOT NULL REFERENCES scheduled_posts(id),
  external_post_id TEXT NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL,
  body_text TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  tone TEXT NOT NULL DEFAULT '',
  account_id UUID NOT NULL REFERENCES accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_posted_account ON posted_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_posted_date ON posted_logs(posted_at DESC);

-- ---------- Performance Metrics (成績) ----------
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_log_id UUID NOT NULL REFERENCES posted_logs(id),
  date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(5,2) NOT NULL DEFAULT 0,
  engagements INTEGER NOT NULL DEFAULT 0,
  retweets INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(10,0) NOT NULL DEFAULT 0,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perf_posted ON performance_metrics(posted_log_id);
CREATE INDEX IF NOT EXISTS idx_perf_date ON performance_metrics(date DESC);

-- ---------- System Settings ----------
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_post_limit INTEGER NOT NULL DEFAULT 6,
  min_interval_minutes INTEGER NOT NULL DEFAULT 90,
  allow_night_posts BOOLEAN NOT NULL DEFAULT false,
  night_start_hour INTEGER NOT NULL DEFAULT 1,
  night_end_hour INTEGER NOT NULL DEFAULT 6,
  ai_provider TEXT NOT NULL DEFAULT 'claude',
  ai_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  risk_threshold INTEGER NOT NULL DEFAULT 70,
  auto_collect_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_score_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_generate_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_post_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Account Settings ----------
CREATE TABLE IF NOT EXISTS account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  daily_post_limit INTEGER NOT NULL DEFAULT 6,
  min_interval_minutes INTEGER NOT NULL DEFAULT 90,
  preferred_tone TEXT NOT NULL DEFAULT 'natural',
  preferred_length TEXT NOT NULL DEFAULT 'medium',
  ng_words TEXT[] NOT NULL DEFAULT '{}',
  ng_categories TEXT[] NOT NULL DEFAULT '{}',
  priority_categories TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_accsettings_account ON account_settings(account_id);

-- ---------- Content Rules ----------
CREATE TABLE IF NOT EXISTS content_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL,                   -- ng_word, ng_category, priority_category, required_hashtag
  value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rules_type ON content_rules(rule_type);

-- ---------- AI Generation Logs ----------
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidate_posts(id),
  prompt_type TEXT NOT NULL,                 -- post_body, recommendation, hashtag, risk
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ailogs_date ON ai_generation_logs(created_at DESC);

-- ---------- Approval Logs ----------
CREATE TABLE IF NOT EXISTS approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidate_posts(id),
  action TEXT NOT NULL,                      -- approved, rejected, alternative, regenerate, time_change
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_approval_date ON approval_logs(created_at DESC);

-- ---------- Workflow Logs ----------
CREATE TABLE IF NOT EXISTS workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT NOT NULL,               -- collect, score, generate, post, analyze
  status TEXT NOT NULL DEFAULT 'started',    -- started, completed, failed
  items_processed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_workflow_date ON workflow_logs(started_at DESC);

-- ---------- Error Logs ----------
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_errors_date ON error_logs(created_at DESC);

-- ---------- Noimos AI Imports (CSV連携) ----------
CREATE TABLE IF NOT EXISTS noimos_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'noimos_csv',     -- noimos_csv, manual_csv, api
  rows_total INTEGER NOT NULL DEFAULT 0,
  rows_processed INTEGER NOT NULL DEFAULT 0,
  rows_failed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',         -- pending, processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_noimos_imports_date ON noimos_imports(created_at DESC);

CREATE TABLE IF NOT EXISTS noimos_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES noimos_imports(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL DEFAULT 0,
  scheduled_time TEXT NOT NULL,                    -- HH:MM or ISO timestamp
  body_text TEXT NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  affiliate_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  post_mode TEXT NOT NULL DEFAULT 'A',
  status TEXT NOT NULL DEFAULT 'pending',          -- pending, scheduled, posted, failed, skipped
  scheduled_post_id UUID REFERENCES scheduled_posts(id),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',                     -- Noimos AIからの追加データ（エンゲージメント予測等）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_noimos_rows_import ON noimos_import_rows(import_id);
CREATE INDEX IF NOT EXISTS idx_noimos_rows_status ON noimos_import_rows(status);

-- ---------- Updated At Trigger ----------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_users_updated ON users;
CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_accounts_updated ON accounts;
CREATE TRIGGER tr_accounts_updated BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_candidates_updated ON candidate_posts;
CREATE TRIGGER tr_candidates_updated BEFORE UPDATE ON candidate_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_scheduled_updated ON scheduled_posts;
CREATE TRIGGER tr_scheduled_updated BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_syssettings_updated ON system_settings;
CREATE TRIGGER tr_syssettings_updated BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_accsettings_updated ON account_settings;
CREATE TRIGGER tr_accsettings_updated BEFORE UPDATE ON account_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
