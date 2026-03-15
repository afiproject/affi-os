# Affi OS - 開発進捗メモ

## プロジェクト概要
X(Twitter)自動アフィリエイト投稿システム。Next.js 15 + Supabase + Vercel + X API v2。

## 完成形イメージ
1. FANZA動画を自動収集 → AIで投稿文生成 → **サンプル動画付き**でXに自動投稿
2. ユーザーは管理画面で候補を確認・承認するだけ
3. Cronで毎日自動実行（collect → score → generate → post）

## 現在の状況（2026-03-15 時点）

### ✅ 動作確認済み
- X投稿（テキスト + アフィリエイトリンク）→ 成功
- DMM API収集 → 成功（30件取得）
- AIによる投稿文生成 → 成功（Gemini/Groq）
- 承認 → 即時投稿フロー → 成功
- Vercel東京リージョン（hnd1）→ 動作確認済み
- FANZA CDN動画URL（正しいCID使用）→ **200 OK確認済み**（東京リージョンから）

### ❌ 未解決の最重要課題：動画付き投稿が動かない

**完成形**: 採用ボタン → 動画ダウンロード → X APIに動画アップロード → 動画付きツイート投稿
**現状**: 採用ボタン → テキスト+リンクのみの投稿（動画なし）

#### 動画が付かない原因の調査ポイント（次回最初にやること）

**原因の可能性は3つ：**

1. **投稿した候補がVR動画だった**（VR動画はsampleMovieURLが空 → 動画URLなし）
   - DMM APIの最新5件中、4件がVRで動画なし、1件だけ非VRで動画あり
   - → 収集時にVRを除外するか、非VR限定にする必要がある可能性

2. **動画ダウンロードが失敗した**（タイムアウトやメモリ不足）
   - `_sm_w.mp4`（約6MB）を優先する修正は済み
   - → Vercel Function Logsで`[downloadVideo]`ログを確認すること

3. **サムネ画像フォールバックも失敗した**
   - `uploadImageFromUrl()`を追加済みだが、実際に動いたかログ未確認
   - → Vercel Function Logsで`[uploadImage]`ログを確認すること

#### 次回の確認手順

**Step 1: Vercel Function Logsを確認**
Vercel Dashboard → Deployments → 最新デプロイ → Functions → Logs
- `[XPostingAdapter]`、`[downloadVideo]`、`[uploadImage]` のログを探す
- どこで失敗したか特定する

**Step 2: 非VR動画で再テスト**
```sql
-- Supabase SQL Editor: sample_video_urlがある候補を確認
SELECT ai.title, ai.sample_video_url, ai.thumbnail_url
FROM affiliate_items ai
WHERE ai.sample_video_url != '' AND ai.sample_video_url IS NOT NULL
ORDER BY ai.collected_at DESC LIMIT 10;
```
→ sample_video_urlが入っているアイテムが候補にあるか確認

**Step 3: 動画ダウンロードの直接テスト**
```javascript
fetch('/api/test-dmm-video', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.json()).then(d => console.log('region:', d.region, JSON.stringify(d.test_results, null, 2)))
```
→ `region: hnd1` かつ CDN URLの`status: 200`を確認

### 今回のセッション（3/15）で行った修正

| 修正内容 | ファイル | 状態 |
|---------|--------|------|
| vercel.json に `"regions": ["hnd1"]` 追加（東京リージョン強制） | vercel.json | ✅ push済み |
| sampleMovieURLから正しいCID抽出（content_idとは異なる） | affiliate-source.ts | ✅ push済み |
| 動画DL失敗時にサムネ画像をX投稿に添付するフォールバック | posting.ts, x-api.ts | ✅ push済み |
| `/api/post-now`にthumbnail_url渡し追加 | post-now/route.ts | ✅ push済み |
| Refererヘッダー追加（FANZA CDN用） | x-api.ts | ✅ push済み |
| 軽量版動画（_sm_w.mp4）を優先ダウンロード | x-api.ts | ✅ push済み |
| 収集時にsort/offsetをランダム化（多様な候補） | affiliate-source.ts | ✅ push済み |
| `/api/cron/pipeline` 統合エンドポイント追加 | pipeline/route.ts | ✅ push済み（ただし内部呼び出しが壊れている） |
| `/api/test-dmm-video` 診断エンドポイント追加 | test-dmm-video/route.ts | ✅ push済み |

### 判明した技術的事実

1. **`preferredRegion`（ルート単位）はVercelで効かない** → `vercel.json`の`"regions"`で全関数を東京に強制する必要がある
2. **DMM APIの`content_id`とCDN用CIDは異なる** → `sampleMovieURL`内のプレイヤーURL（`cid=xxx`）から正しいCIDを抽出する必要がある
3. **FANZA CDNは日本国外からのアクセスを完全ブロック（403）** → 東京リージョン必須
4. **東京リージョン + 正しいCIDなら200 OK（video/mp4）** → ダウンロード自体は可能
5. **VR動画はsampleMovieURLが空** → サンプル動画がない
6. **`/api/cron/pipeline`の内部fetch呼び出しがHTMLを返す** → 個別にcollect→score→generateを呼ぶ必要あり

### DBクリーンアップSQL（全データ削除する場合）
```sql
TRUNCATE posted_logs, scheduled_posts, ai_generation_logs, candidate_post_variants, candidate_posts, affiliate_items CASCADE;
```
※ 外部キー制約があるため、必ずTRUNCATE CASCADEを使うこと。DELETE FROMは順番依存でエラーになる。

## まだやっていないこと（優先順）

### 1. 🔴 動画付きX投稿の完成（最優先）
上記「次回の確認手順」に従って原因を特定し、動画付き投稿を実現する。
- VR動画除外 or 非VRフィルタの追加が必要かもしれない
- Vercel Function Logsでの失敗箇所の特定が最優先

### 2. 🟡 pipeline統合エンドポイントの修正
`/api/cron/pipeline`の内部fetch呼び出しがHTMLを返す問題。
直接ロジックをimportして呼び出す方式に変更する必要あり。

### 3. 🟡 投稿文カスタム入力機能
ユーザーが承認時に投稿文を自分で編集・入力できるようにする。

### 4. 🟢 クレジット表示の実装
affi-osサイトのフッターに「Powered by FANZA Webサービス」を追加。

### 5. 🟢 Cronスケジュールの動作確認
Vercel Cronが毎日自動で動くか翌日に確認。

## 手動テスト手順（Console F12）

**収集〜投稿の全フロー（個別実行）：**
```javascript
// 1. 収集
fetch('/api/cron/collect', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.json()).then(console.log)
// 2. スコアリング
fetch('/api/cron/score', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.json()).then(console.log)
// 3. 文面生成
fetch('/api/cron/generate', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.json()).then(console.log)
// 4. サイトで「採用」ボタン
// 5. 投稿（cronから実行する場合）
fetch('/api/cron/post', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.json()).then(console.log)
```

**動画ダウンロードテスト：**
```javascript
fetch('/api/test-dmm-video', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))
```

## DMMアフィリエイト情報
- **API ID**: `BeXRzsMX6quNr3MHpGLu`
- **アフィリエイトID（API用）**: `affiking1414-990`（末尾990〜999がAPI用。通常の `affiking1414-004` はサイト表示用）
- **Vercel環境変数**: `DMM_API_ID` = `BeXRzsMX6quNr3MHpGLu`, `DMM_AFFILIATE_ID` = `affiking1414-990`（設定済み）

### クレジット表示義務
DMM APIを使う場合、affi-osのWebサイト上に以下のクレジットを表示する必要がある（利用規約）：
> **Powered by FANZA Webサービス**
→ **未対応。後で対応が必要。**

## ブランチ情報
- 開発ブランチ: `claude/affi-os-automation-F0hsx`
- Supabase Project ID: `ptslpbibkrjmvdnnngjq`

## Vercel環境変数（設定済み）
- X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET（console.x.comのOAuth 1.0キー）
- DMM_API_ID = `BeXRzsMX6quNr3MHpGLu`
- DMM_AFFILIATE_ID = `affiking1414-990`
- CRON_SECRET = `yut000`
- その他: ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY等

## Vercel Cronスケジュール（vercel.json）
- 06:00 → /api/cron/collect（素材収集）
- 06:30 → /api/cron/cache-videos（動画キャッシュ）
- 07:00 → /api/cron/score（スコアリング）
- 08:00 → /api/cron/generate（文面生成）
- 09:00 → /api/cron/post（自動投稿）
- 21:00 → /api/cron/analyze（分析）

## Xアカウント情報
- ユーザーID: av_review_xX
- 表示名: たこちゃ
- X API: console.x.com で管理（従量課金制、$5チャージ済み）

## テスト時の注意
- `allow pasting` を先にConsoleに入力してからコードを貼り付ける
- 必ずVercel Deploymentsの最新URLを使うこと
- SQL実行はSupabase SQL Editorで行う
- SQL Editorでは**前の文章を必ず消してから**新しいSQLを貼る
