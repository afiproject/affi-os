# 08_KYC — 本人確認（eKYC）設計書

## 概要

SLOTYでは、ユーザーの安全を確保するために本人確認（eKYC）を3段階で実施する。

## KYCレベル

| レベル | 要件 | 利用可能機能 |
|--------|------|-------------|
| Lv0 | なし | 閲覧のみ |
| Lv1 | 正面セルフィー | 通話OK |
| Lv2 | 身分証 + ライブネスチェック | 対面OK |

## フロー

1. ユーザーが `/verify` で書類提出
2. `pending_ai` → AI自動スコアリング（ダミー/外部API）
3. `pending_review` → Owner が `/admin` → KYCタブ で最終確認
4. `approved` / `rejected` / `resubmit_required`

## 保管方針

### 推奨案（A）：KYCベンダーに委託

- TRUSTDOCK / Liquid 等のeKYC SaaSに寄せる
- 画像をアプリ側で保持しない → 漏洩リスク最小
- API呼び出しで判定結果のみ受け取る

### 自前保管案（B）：S3 + KMS

以下の設計で画像の安全な取り扱いを確保する。

#### ストレージ構造
```
s3://sloty-kyc-bucket/
  kyc/{userId}/{verificationId}/{assetType}.jpg
```

#### アクセス制御
- IAMポリシーで管理画面サーバーからのみアクセス可能
- 署名URL（有効期限: 60秒）で一時表示
- DL禁止：`Content-Disposition: inline` + クライアント側 `pointer-events: none`

#### 暗号化
- S3 SSE-KMS 暗号化
- KMSキーのローテーション: 年1回

#### 管理画面での表示
- ウォーターマーク重畳: 日時 + userId + "SLOTY MODERATION"
- ダウンロードボタンなし
- 閲覧時に必ず理由入力 → 監査ログに記録

#### 保管期限
- `RETENTION_DAYS` 環境変数で制御（デフォルト: 180日）
- 期限到来後はS3ライフサイクルポリシーで自動削除
- 削除ログを監査ログに記録

## 監査ログ

以下のアクションを必ず記録する：

| アクション | 説明 |
|-----------|------|
| `VIEW_KYC_ASSET` | 本人確認画像の閲覧 |
| `VIEW_FACE_ASSET` | 顔写真の閲覧 |
| `APPROVE_KYC` | KYC承認 |
| `REJECT_KYC` | KYC却下 |
| `RESUBMIT_KYC` | 再提出要求 |

## 警察提供フロー（将来実装）

1. 適法な要請（令状/捜査関係事項照会書）を確認
2. Owner が `/admin` → 監査ログに `EXPORT_KYC_FOR_LE` を記録
3. 対象ユーザーのKYC画像を安全な方法で提供
4. 提供後、提供ログを監査ログに永久保存

## Owner運用手順

### 何かあった時

1. `/admin` にパスコードでログイン
2. Reports タブで通報を確認
3. KYC タブで本人確認を審査
4. Messages タブで通報紐付きチャットを確認（理由必須）
5. Users タブでBAN/強制PWリセット
6. Audit Logs タブで全操作を確認

### 定期運用

- 週1回: pending_review の申請を処理
- 月1回: Audit Logs を確認し、不審な閲覧がないか監査
- 半年ごと: RETENTION_DAYS 超過のKYCデータ削除を確認
