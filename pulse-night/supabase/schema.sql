-- PULSE Night DB Schema (Supabase)

-- 店舗・スポット
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('station', 'izakaya', 'club', 'aiseki', 'cabaret', 'host')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ステータスログ（混雑度・人数など）
CREATE TABLE status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  male_count INTEGER DEFAULT 0,
  female_count INTEGER DEFAULT 0,
  age_group TEXT,
  crowd_level TEXT CHECK (crowd_level IN ('empty', 'normal', 'crowded')),
  vibe_level TEXT CHECK (vibe_level IN ('quiet', 'normal', 'hype')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 匿名投稿（24時間で自動削除）
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 24時間経過した投稿を削除する関数
CREATE OR REPLACE FUNCTION delete_old_posts()
RETURNS void AS $$
BEGIN
  DELETE FROM posts WHERE created_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "places_read" ON places FOR SELECT USING (true);
CREATE POLICY "status_logs_read" ON status_logs FOR SELECT USING (true);
CREATE POLICY "posts_read" ON posts FOR SELECT USING (true);

-- 全ユーザーが投稿可能（匿名投稿）
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "status_logs_insert" ON status_logs FOR INSERT WITH CHECK (true);
