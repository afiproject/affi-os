# Affi OS - 開発進捗メモ

## プロジェクト概要
X(Twitter)自動アフィリエイト投稿システム。Next.js 15 + Supabase + Vercel + X API v2。

## 現在の状況（2026-03-09 時点）

### DB状態
- users: 1件（たこちゃ / you@example.com）
- accounts: 1件（X / av_review_xX / たこちゃ）※重複削除済み
- affiliate_items: 5件（collectで収集済み）
- candidate_posts: 5件（scoreで作成済み）
- candidate_post_variants: 15件（generateで作成済み。ただし **body_text が全て空**）
- scheduled_posts: 0件
- affiliate_sources: 1件（type: "demo"、collectで自動作成）

### body_textが空の問題
generateは15件のvariantsを作成したがbody_textが全て空。原因はClaude APIがエラーを返しているか、ANTHROPIC_API_KEYの問題。ai-provider.tsにエラーハンドリングを追加済み（APIエラー時はmockGenerateにフォールバック）。
→ **次回**: DBの既存variantsを削除してgenerateを再実行し、body_textが生成されるか確認する必要あり。

## 完了済み修正（全てブランチ: claude/affi-os-automation-F0hsx）

### 修正1: collect cron 500エラー（PR#3でmainマージ済み）
- affiliate_sourcesが空の時にデフォルトソース自動作成
- エラーログの[object Object]問題修正

### 修正2: フロントエンドのデモデータ問題（PR#4でmainマージ済み）
**問題**: candidates/page.tsx、queue/page.tsx、analytics/page.tsx、settings/page.tsx が `isDemoMode()` チェックなしにハードコードのデモデータを常に表示していた。DEMO_MODE=0にしても意味がなかった。
**修正**: 全ページをasync Server Componentに変更し、isDemoMode()チェック付きでDBからデータ取得するように修正。

### 修正3: 承認ボタンがDBに保存されない問題（mainマージ待ち）
**問題**: candidate-list.tsxとcandidate-detail.tsxの承認/却下ボタンがクライアントstateのみ更新し、APIを呼んでいなかった。ページ遷移で元に戻り、scheduled_postsも作成されなかった。
**修正**:
- 承認ボタンクリック時に `/api/candidates` (POST) でステータス更新
- 承認時に `/api/schedule` (POST) で予約投稿も自動作成
- 却下ボタンクリック時も `/api/candidates` (POST) でDB更新

## 次回やるべきこと（優先順）

### 1. featureブランチをmainにマージ（修正3）
ブランチ `claude/affi-os-automation-F0hsx` の最新コミットがまだmainにマージされていない。
GitHub で PR作成 → マージ → Vercel自動デプロイ。

### 2. 承認→予約フローのテスト
マージ・デプロイ後、最新デプロイURLで:
1. 「投稿候補」ページを開く
2. 候補を「採用」ボタンで承認
3. 「予約一覧」ページで予約が作成されているか確認

### 3. AI文面生成（body_text空）の修正確認
既存の空variantsを削除してgenerateを再実行:
```sql
-- SQL Editorで実行
DELETE FROM candidate_post_variants;
```
その後、affi-osサイトのConsoleで:
```javascript
fetch('/api/cron/generate', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```
生成後にSQL Editorで確認:
```sql
SELECT id, body_text, tone FROM candidate_post_variants LIMIT 5;
```
body_textがまだ空なら、Vercelの `ANTHROPIC_API_KEY` を確認、またはVercelのFunction Logsで `[ClaudeProvider] API error:` を検索。

### 4. 自動投稿のE2Eテスト
承認 → 予約作成 → postエンドポイント実行 → Xに投稿されるか確認:
```javascript
fetch('/api/cron/post', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```

### 5. Cronスケジュールの動作確認
Vercel Cronが毎日自動で動くか翌日に確認:
- 06:00 collect → 07:00 score → 08:00 generate → 09:00 post → 21:00 analyze

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
ChromeのDevTools Console (F12) で affi-osの**最新デプロイURL**を開いた状態で:
```javascript
fetch('/api/cron/collect', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```
※ `allow pasting` を先にConsoleに入力してからコードを貼り付ける
※ 必ずVercel Deploymentsの最新URLを使うこと（古いURLは古いコードで動く）

## Xアカウント情報
- ユーザーID: av_review_xX
- 表示名: たこちゃ
