# Affi OS - 開発進捗メモ

## プロジェクト概要
X(Twitter)自動アフィリエイト投稿システム。Next.js 15 + Supabase + Vercel + X API v2。

## 完了済み作業

### 1. DBスキーマ作成 (Supabase)
- `supabase/schema.sql` を Supabase SQL Editor で実行済み
- 全16テーブル作成完了（`IF NOT EXISTS` 付きに修正済み）
- テーブル一覧: users, accounts, affiliate_sources, affiliate_items, candidate_posts, candidate_post_variants, scheduled_posts, posted_logs, performance_metrics, system_settings, account_settings, content_rules, ai_generation_logs, approval_logs, workflow_logs, error_logs

### 2. Vercel環境変数設定
以下を全てVercelの環境変数に設定済み:
- `NEXT_PUBLIC_SUPABASE_URL` — `https://ptslpbibkrjmvdnnngjq.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — レガシー形式(eyJ...)に変更済み
- `SUPABASE_SERVICE_ROLE_KEY` — レガシー形式(eyJ...)に変更済み
- `X_API_KEY` / `X_API_SECRET` / `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` — 設定済み
- `ANTHROPIC_API_KEY` — 設定済み
- `CRON_SECRET` — `yut000`
- `NEXT_PUBLIC_DEMO_MODE` — `0` に変更済み（デモモード解除）

### 3. デプロイ
- Vercelデプロイ完了
- ダッシュボード画面は正常に表示される
- URL: `https://affi-28dzci6j7-yus-projects-8f9fc121.vercel.app`

## 修正済み（mainへのマージ待ち）

### collect cron 500エラーの修正（ブランチ: claude/affi-os-automation-F0hsx）
**原因特定済み**: `affiliate_sources` テーブルが空の状態でcollectを実行すると、デモデータの偽source_id（"src-1"）がそのままDBに挿入されるため、外部キー制約違反で500エラーが発生していた。

**修正内容** (`src/app/api/cron/collect/route.ts`):
- ソースが0件の場合、`affiliate_sources` テーブルにデフォルトソース（type: "demo"）を自動作成
- そのIDを使ってデモデータを正しくinsert
- エラーログを `JSON.stringify(error)` に改善（[object Object]問題の修正）

## 次回やるべきこと（優先順）

### 1. featureブランチをmainにマージ
Vercelはmainブランチからデプロイしている。修正はfeatureブランチにしかないため、マージが必要。
- 方法A: GitHub/Giteaの「PR表示」ボタンからPRをマージ
- 方法B: Vercelの設定でデプロイブランチを変更

### 2. collectエンドポイントの動作確認
マージ・デプロイ後、ChromeのDevTools Console (F12)で:
```javascript
fetch('/api/cron/collect', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```
期待するレスポンス: `{"success":true,"workflow":"collect","sources_count":0,"items_collected":X,...}`

### 3. 残りのcronフローをテスト
```javascript
// score
fetch('/api/cron/score', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
// generate
fetch('/api/cron/generate', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
// post
fetch('/api/cron/post', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```

### 4. ダッシュボードで投稿候補を承認
- 「投稿候補」ページで候補を確認・承認
- 承認後「予約一覧」で予約投稿が作成されるか確認

### 5. 自動投稿の動作確認
- postエンドポイントで実際にXに投稿されるか確認

## ブランチ情報
- 開発ブランチ: `claude/affi-os-automation-F0hsx`
- Supabase Project ID: `ptslpbibkrjmvdnnngjq`

## Vercel Cronスケジュール（vercel.json）
- 06:00 → /api/cron/collect（素材収集）
- 07:00 → /api/cron/score（スコアリング）
- 08:00 → /api/cron/generate（文面生成）
- 09:00 → /api/cron/post（自動投稿）
- 21:00 → /api/cron/analyze（分析）

## テスト方法
ChromeのDevTools Console (F12) で affi-osのサイトを開いた状態で:
```javascript
fetch('/api/cron/collect', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```
※ `allow pasting` を先にConsoleに入力してからコードを貼り付ける
