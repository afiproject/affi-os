# SLOTY — 時間共有マーケット

時間をスロット単位で売買できるマーケットプレイスアプリ。

## デモモード（UI確認用）

DB・認証・Stripe の設定不要でUI/動線を確認できます。

### ローカル起動

```bash
cp .env.example .env.local
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く（スマホ幅で確認推奨）。

### Vercel デプロイ手順

1. **GitHub にリポジトリを push**（済み）
2. [vercel.com](https://vercel.com) にログイン → **Add New Project**
3. GitHub リポジトリを選択してインポート
4. **Environment Variables** に以下を追加:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_DEMO_MODE` | `1` |
5. **Deploy** をクリック
6. デプロイ完了後、発行された URL をスマホで開いて確認

> **Note:** デモモードでは全データがダミーです。DB接続は不要です。

## 本番モード

デモモード以外で動かす場合は `.env.example` のコメントアウトされた変数をすべて設定してください。

```bash
# .env.local に以下を設定
NEXT_PUBLIC_DEMO_MODE=0
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
# ... 他の変数
```

## 技術スタック

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS 3**
- **Prisma 6** + PostgreSQL
- **NextAuth.js v5**
- **Stripe** (チケット購入)
