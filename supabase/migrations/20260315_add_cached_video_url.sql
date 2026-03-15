-- affiliate_itemsにキャッシュ済み動画URLカラムを追加
ALTER TABLE affiliate_items ADD COLUMN IF NOT EXISTS cached_video_url TEXT;

-- Supabase Storageバケット作成（動画キャッシュ用）
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-cache', 'video-cache', true)
ON CONFLICT (id) DO NOTHING;

-- 誰でも読める（公開バケット）
CREATE POLICY "Public read access for video-cache"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'video-cache');

-- Service Role keyでのみアップロード可能
CREATE POLICY "Service role upload for video-cache"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'video-cache');

CREATE POLICY "Service role delete for video-cache"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'video-cache');
