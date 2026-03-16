-- auto_post_enabled: 承認なしで自動投稿するかどうか
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS auto_post_enabled BOOLEAN NOT NULL DEFAULT true;
