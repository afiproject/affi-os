# PULSE Night セットアップ手順

## 前提条件
- Node.js 18以上
- npm または yarn
- Expo Go アプリ（スマホにインストール）
- Google Maps API Key（Android/iOS用）

## 1. インストール

```bash
cd frontend
npm install
```

## 2. Google Maps API Key の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 「Maps SDK for Android」「Maps SDK for iOS」を有効化
3. APIキーを作成
4. `frontend/app.json` の以下を書き換え：
   - `expo.ios.config.googleMapsApiKey`
   - `expo.android.config.googleMaps.apiKey`

## 3. 起動

```bash
cd frontend
npx expo start
```

スマホのExpo Goアプリでスキャンして実行。

## 4. ディレクトリ構成

```
pulse-night/
├── frontend/          # Expo (React Native) アプリ
│   ├── App.tsx        # エントリポイント
│   ├── src/
│   │   ├── screens/   # 画面コンポーネント
│   │   ├── components/# UI部品
│   │   ├── constants/ # 定数・テーマ・ダミーデータ
│   │   └── types/     # TypeScript型定義
│   └── app.json       # Expo設定
├── docs/              # ドキュメント
└── supabase/          # Supabase設定（後で追加）
```
