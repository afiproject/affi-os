-- サンプル動画URLをaffiliate_itemsに追加
ALTER TABLE affiliate_items ADD COLUMN IF NOT EXISTS sample_video_url TEXT NOT NULL DEFAULT '';

-- 投稿モード・カスタムテキスト・リプライIDをscheduled_postsに追加
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS post_mode TEXT NOT NULL DEFAULT 'A';
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS custom_body_text TEXT;
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS reply_post_id TEXT;
