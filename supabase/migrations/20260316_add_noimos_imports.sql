-- Noimos AI CSV連携用テーブル
CREATE TABLE IF NOT EXISTS noimos_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'noimos_csv',
  rows_total INTEGER NOT NULL DEFAULT 0,
  rows_processed INTEGER NOT NULL DEFAULT 0,
  rows_failed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_noimos_imports_date ON noimos_imports(created_at DESC);

CREATE TABLE IF NOT EXISTS noimos_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES noimos_imports(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL DEFAULT 0,
  scheduled_time TEXT NOT NULL,
  body_text TEXT NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  affiliate_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  post_mode TEXT NOT NULL DEFAULT 'A',
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_post_id UUID REFERENCES scheduled_posts(id),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_noimos_rows_import ON noimos_import_rows(import_id);
CREATE INDEX IF NOT EXISTS idx_noimos_rows_status ON noimos_import_rows(status);
