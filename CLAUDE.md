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

## 現在の問題（次回対応）

### collect cronエンドポイントが500エラー
- `/api/cron/collect` を実行すると `{"error":"Collection failed","details":"[object Object]"}` が返る
- エラー詳細が `[object Object]` のままで原因が特定できていない
- `src/app/api/cron/collect/route.ts` のcatchブロックで `JSON.stringify(error)` に修正済みだが、**デプロイに反映されていない可能性あり**

### 次回やるべきこと
1. **デプロイ元ブランチの確認**: Vercelがmainブランチからデプロイしている場合、`claude/affi-os-automation-F0hsx` ブランチの変更がデプロイされていない。mainにマージするか、Vercelのデプロイ設定を確認する必要がある
2. **Vercel Function Logsの確認**: Vercelダッシュボード → Functions → ログで実際のエラー詳細を確認
3. **collectエンドポイントのデバッグ**: エラー原因を特定して修正
4. **全cronフローのテスト**: collect → score → generate → post の順にテスト
5. **自動投稿の動作確認**

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
ChromeのDevTools Console (F12) で:
```javascript
fetch('/api/cron/collect', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```
