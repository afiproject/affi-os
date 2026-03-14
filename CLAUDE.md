# Affi OS - 開発進捗メモ

## プロジェクト概要
X(Twitter)自動アフィリエイト投稿システム。Next.js 15 + Supabase + Vercel + X API v2。

## 現在の状況（2026-03-14 時点）

### 完了済み（全てmainマージ済み）
1. ✅ collect cron 500エラー修正（PR#3）
2. ✅ フロントエンドのデモデータ問題修正（PR#4）
3. ✅ 承認ボタンのDB保存修正
4. ✅ Google Gemini / Groqプロバイダー追加（無料AI生成用）
5. ✅ generate時に空variantsを自動削除する修正
6. ✅ getTopCandidatesの日付フィルター修正
7. ✅ X API診断エンドポイント（/api/test-x）追加
8. ✅ DMM/FANZA API連携アダプター追加
9. ✅ body_text生成 → 成功確認済み（Gemini/Groqで動作）
10. ✅ X投稿テスト → 成功確認済み（テスト投稿がXに表示された）
11. ✅ 本番投稿テスト → 成功確認済み（posted:1）

### X API設定（解決済み）
- **問題**: 503 Service Unavailableが4日間続いた
- **原因1**: X Developer Portalでアプリが「Free」プランのままだった（Freeプランは廃止済み）
- **原因2**: console.x.com で「従量課金制（Pay Per Use）」に切り替え + $5チャージで解決
- **原因3**: developer.x.comのキーではなくconsole.x.comのOAuth 1.0キーを使う必要があった
- Vercel環境変数: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET（全てconsole.x.comから取得したもの）

### 現在の停止ポイント ⚠️
**DMM/FANZAの実データ収集がまだ完了していない。**

DBにはまだ古いデモデータ（example.com）が残っている。以下のクリーンアップSQLを**まだ実行していない**：

#### 作業再開時にまずやること（Supabase SQL Editor）
**前の文章を消して**、以下を貼って「Run」：
```sql
UPDATE affiliate_sources SET is_active = false WHERE type = 'demo';
DELETE FROM candidate_post_variants;
DELETE FROM scheduled_posts;
DELETE FROM candidate_posts;
DELETE FROM affiliate_items;
```

#### その後、affi-osの最新デプロイURLのConsole（F12）で順番に実行：

**1. FANZA動画を収集：**
```javascript
fetch('/api/cron/collect', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```

**2. 収集結果を確認（Supabase SQL Editor、前の文章を消して）：**
```sql
SELECT title, affiliate_url, source_id FROM affiliate_items ORDER BY collected_at DESC LIMIT 10;
```
→ affiliate_urlが `https://al.dmm.co.jp/...` のようなFANZAのURLになっていればOK

**3. スコアリング（Console）：**
```javascript
fetch('/api/cron/score', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```

**4. 文面生成（Console）：**
```javascript
fetch('/api/cron/generate', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```

**5. affi-osサイトで候補を「採用」ボタンで承認**

**6. 投稿実行（Console）：**
```javascript
fetch('/api/cron/post', {headers: {'Authorization': 'Bearer yut000'}}).then(r => r.text()).then(console.log)
```

**7. Xアカウント（@av_review_xX）で投稿を確認** → FANZAのアフィリエイトリンク付きの投稿が表示されるはず

## DMMアフィリエイト情報
- **API ID**: `BeXRzsMX6quNr3MHpGLu`
- **アフィリエイトID（API用）**: `affiking1414-990`（末尾990〜999がAPI用。通常の `affiking1414-004` はサイト表示用）
- **Vercel環境変数**: `DMM_API_ID` = `BeXRzsMX6quNr3MHpGLu`, `DMM_AFFILIATE_ID` = `affiking1414-990`（設定済み）
- **サイト**: FANZA（アダルト動画）
- **API**: DMM Affiliate API v3（https://api.dmm.com/affiliate/v3/ItemList）

### クレジット表示義務
DMM APIを使う場合、affi-osのWebサイト上に以下のクレジットを表示する必要がある（利用規約）：
> **Powered by FANZA Webサービス**

X投稿文自体には不要。affi-osの管理画面のフッターなどに表示すればOK。
→ **未対応。後で対応が必要。**

## まだやっていないこと（優先順）

### 1. DMM実データでのE2Eテスト
上記「作業再開時にまずやること」を実行して、FANZA動画のアフィリエイトリンク付き投稿がXに投稿されるか確認する。

### 2. 投稿文カスタム入力機能
ユーザーが承認時に投稿文を自分で編集・入力できるようにする。
現状はAI生成の文面がそのまま投稿される。

### 3. クレジット表示の実装
affi-osサイトのフッターに「Powered by FANZA Webサービス」を追加。

### 4. Cronスケジュールの動作確認
Vercel Cronが毎日自動で動くか翌日に確認：
- 06:00 collect → 07:00 score → 08:00 generate → 09:00 post → 21:00 analyze

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
※ SQL実行はSupabase SQL Editorで行う（ブラウザConsoleではない）
※ SQL Editorでは**前の文章を必ず消してから**新しいSQLを貼る

## Xアカウント情報
- ユーザーID: av_review_xX
- 表示名: たこちゃ
- X API: console.x.com で管理（従量課金制、$5チャージ済み）
