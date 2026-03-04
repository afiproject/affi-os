# SLOTY — MVP実装計画

> スタック: Next.js 15 + TypeScript + Prisma + PostgreSQL + NextAuth.js + Stripe + Vercel
> 目標: 8週間でMVPリリース

---

## フェーズ概要

| フェーズ | 期間 | 内容 |
|---------|------|------|
| Phase 1 | Week 1-2 | 基盤構築（認証・DB・デプロイ） |
| Phase 2 | Week 3-4 | マーケット（スロット出品/検索/購入） |
| Phase 3 | Week 5-6 | 広場 + チケット + フレンド |
| Phase 4 | Week 7-8 | 安全機能 + テスト + リリース準備 |

---

## Phase 1: 基盤構築（Week 1-2）

### Step 1-1: プロジェクトセットアップ
- [x] Next.js 15 プロジェクト作成（App Router）
- [x] TypeScript + ESLint + Prettier 設定
- [x] Tailwind CSS + カラーテーマ（薄紫アクセント）設定
- [x] ダークモード対応（next-themes）
- [x] ディレクトリ構造確定

```
src/
├── app/
│   ├── (auth)/           # 認証関連ページ
│   ├── (main)/           # メインタブページ
│   │   ├── market/       # マーケット
│   │   ├── square/       # 広場
│   │   ├── friends/      # フレンド
│   │   └── profile/      # プロフィール/設定
│   ├── api/              # API Routes
│   └── layout.tsx
├── components/
│   ├── ui/               # 共通UIコンポーネント
│   ├── market/           # マーケット固有
│   ├── square/           # 広場固有
│   ├── friends/          # フレンド固有
│   └── shared/           # 共有コンポーネント
├── lib/
│   ├── auth.ts           # NextAuth設定
│   ├── db.ts             # Prisma client
│   ├── stripe.ts         # Stripe設定
│   └── utils.ts          # ユーティリティ
├── prisma/
│   ├── schema.prisma     # DBスキーマ
│   └── seed.ts           # 初期データ
└── types/                # 型定義
```

### Step 1-2: データベースセットアップ
- Prisma schema 定義（全14テーブル）
- PostgreSQL 接続（Vercel Postgres or Supabase Postgres）
- マイグレーション実行
- seed データ（カテゴリ・エリアマスタ）

### Step 1-3: 認証
- NextAuth.js 設定
  - Credentials Provider（メール/パスワード）
  - Phone Provider（SMS認証 — Twilio）
  - Google Provider
  - Apple Provider
- セッション管理（JWT）
- ミドルウェアで認証必須ページを保護

### Step 1-4: デプロイパイプライン
- Vercel プロジェクト作成
- GitHub 連携（main → production, dev → preview）
- 環境変数設定（DATABASE_URL, NEXTAUTH_SECRET, STRIPE_*, etc.）

---

## Phase 2: マーケット（Week 3-4）

### Step 2-1: スロット出品
- 出品フォーム画面（S06）
- 衝突チェックAPI（`POST /api/v1/slots`）
- 非公開予定との衝突検証
- 既存スロットとの衝突検証
- 出品成功 → LISTED ステータス

### Step 2-2: スロット検索
- 時間起点検索画面（S03）
  - カレンダーUI（日付選択）
  - フィルタ（形式/カテゴリ/予算/距離）
  - 検索API（`GET /api/v1/slots`）
  - スコアリングロジック
- 今から起点検索画面（S04）
  - 位置情報取得（Geolocation API）
  - 時間・半径フィルタ
  - シャッフル表示
- ゼロ候補対策UI
- SlotCard 共通コンポーネント

### Step 2-3: スロット詳細 & 予約
- スロット詳細画面（S05）
- 予約API（`POST /api/v1/bookings`）
- Stripe PaymentIntent 作成（与信）
- 即確定フロー
- 承認制フロー（BOOKED_PENDING → 売り手通知）
- 承認/拒否API
- タイムアウト自動キャンセル（Cron or Vercel Cron）

### Step 2-4: 予約管理
- 予約一覧画面（S07）
- キャンセルAPI + 返金計算
- 完了確認API
- 予約ステータス遷移の実装

### Step 2-5: 非公開予定
- 非公開予定追加画面（S15）
- CRUD API（`/api/v1/private-events`）
- 追加時の既存スロット衝突チェック→自動PAUSE

---

## Phase 3: 広場 + チケット + フレンド（Week 5-6）

### Step 3-1: チケットシステム（先に実装 — 広場の前提）
- ticket_ledger テーブル + 残高キャッシュ
- チケット消費/返金ロジック（トランザクション内）
- 初回登録ボーナス（20🎫）
- チケット購入画面（S16）
- Stripe Checkout Session（チケットパック購入）
- 残高確認API
- 利用履歴API

### Step 3-2: 広場
- 広場フィード画面（S08）
- 投稿作成画面（S09）+ チケット消費
- いいね機能（トグル）
- テキストフィルタ（URL/電話番号除去）

### Step 3-3: 依頼（Request）
- 依頼フォーム画面（S10）+ チケット消費
- 依頼受信箱画面（S11）
- 承認→スロット自動生成→予約フロー
- 拒否→半額返金
- タイムアウト→全額返金（Cron）

### Step 3-4: フレンド
- フレンド一覧画面（S12）
- 招待画面（S13）
  - QRコード生成（qrcode ライブラリ）
  - QRスキャン（html5-qrcode）
  - ワンタイムリンク生成
- 招待トークン検証 + フレンド成立
- カレンダー共有画面（S14）
  - Free/Busy表示
  - 権限に応じたフィルタ

---

## Phase 4: 安全 + テスト + リリース（Week 7-8）

### Step 4-1: 安全機能
- 通報画面（S17）+ API
- ブロック機能
- 自動非表示（通報閾値）
- テキストフィルタ強化

### Step 4-2: 通知
- アプリ内通知（notifications テーブル + API）
- 通知ベルUI（未読カウント）
- Push通知基盤（Web Push / FCM — 将来のネイティブ化準備）
- リマインド通知（Cron: 予約1h前、10min前）

### Step 4-3: 設定 & オンボーディング
- 設定画面（S18）
- オンボーディング画面（S01）
- ダークモード切替
- 通知設定
- プライバシー設定

### Step 4-4: テスト & QA
- 単体テスト（Jest + Testing Library）
  - 衝突チェックロジック
  - チケット消費/返金ロジック
  - キャンセル返金計算
  - 認可チェック
- E2Eテスト（Playwright）
  - 認証フロー
  - スロット出品→検索→予約→完了
  - 広場投稿→依頼→承認→予約
  - フレンド招待→承認→カレンダー共有
- セキュリティチェック
  - 認可漏れテスト
  - XSS/インジェクション確認
  - レート制限テスト

### Step 4-5: リリース準備
- 本番環境セットアップ（Vercel Production）
- DB本番マイグレーション
- Stripe本番モード設定
- ドメイン設定
- エラー監視（Sentry）
- 分析（Vercel Analytics）
- seedデータ（仙台エリア + カテゴリ）
- 利用規約/プライバシーポリシーページ

---

## 後回し機能（MVP後）

| 機能 | 優先度 | 想定時期 |
|------|-------|---------|
| カレンダー自動取り込み（Google/Apple） | 高 | MVP+1ヶ月 |
| eKYC本人確認 | 高 | MVP+1ヶ月 |
| ネイティブアプリ化（React Native / Expo） | 高 | MVP+2ヶ月 |
| 高度なブースト/広告枠 | 中 | MVP+3ヶ月 |
| レコメンド高度化 | 中 | MVP+3ヶ月 |
| 対面安全強化（チェックイン/アウト） | 中 | MVP+3ヶ月 |
| 複数都市展開 | 中 | MVP+4ヶ月 |
| 運営モデレーション管理画面 | 中 | MVP+4ヶ月 |
| 日次ログインボーナス | 低 | MVP+2ヶ月 |
