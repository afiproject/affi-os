-- PULSE Location App - Database Schema
-- Supabase PostgreSQL

-- Spots: 店舗・場所の情報
CREATE TABLE IF NOT EXISTS spots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other', -- bar, cafe, restaurant, club, other
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  google_place_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports: 匿名投稿（24時間で自動消滅）
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  crowdedness TEXT NOT NULL CHECK (crowdedness IN ('empty', 'normal', 'crowded')),  -- 少 / 普通 / 多
  atmosphere TEXT NOT NULL CHECK (atmosphere IN ('quiet', 'normal', 'lively')),     -- 静か / 普通 / にぎやか
  gender_ratio TEXT NOT NULL CHECK (gender_ratio IN ('male_heavy', 'balanced', 'female_heavy')), -- 男多 / 同じくらい / 女多
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_reports_spot_id ON reports(spot_id);
CREATE INDEX IF NOT EXISTS idx_reports_expires_at ON reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_spots_location ON spots(latitude, longitude);

-- RLS Policies
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Anyone can read spots
CREATE POLICY "spots_read" ON spots FOR SELECT USING (true);
-- Anyone can insert spots (new places discovered by users)
CREATE POLICY "spots_insert" ON spots FOR INSERT WITH CHECK (true);

-- Anyone can read non-expired reports
CREATE POLICY "reports_read" ON reports FOR SELECT USING (expires_at > NOW());
-- Anyone can insert reports (anonymous)
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (true);

-- Function to clean up expired reports (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM reports WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
