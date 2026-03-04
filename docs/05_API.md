# SLOTY — API一覧（認可ルール付き）

> プロトコル: REST (JSON)
> ベースURL: `/api/v1`
> 認証: Bearer Token (JWT via NextAuth.js)
> 共通ヘッダー: `Authorization: Bearer <token>`

---

## 認可ロール定義

| ロール | 説明 |
|-------|------|
| `public` | 認証不要 |
| `authenticated` | ログイン済みユーザー |
| `owner` | リソースの所有者（自分のデータのみ） |
| `friend` | 相互承認済みフレンド |
| `admin` | 運営管理者（将来） |

---

## 1. Auth（認証）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| POST | `/auth/signup` | 新規登録 | public | `{email?, phone?, password?, provider?}` | `{user, token}` |
| POST | `/auth/signin` | ログイン | public | `{email?, phone?, password?, provider?}` | `{user, token}` |
| POST | `/auth/verify-phone` | 電話番号SMS認証 | public | `{phone, code}` | `{verified: true}` |
| POST | `/auth/refresh` | トークンリフレッシュ | authenticated | `{refresh_token}` | `{token}` |
| POST | `/auth/signout` | ログアウト | authenticated | — | `{ok: true}` |
| DELETE | `/auth/account` | アカウント削除 | owner | — | `{ok: true}` |

**実装メモ**:
- NextAuth.js のプロバイダ: Credentials (phone/email), Apple, Google
- JWTペイロード: `{sub: user_id, iat, exp}`
- トークン有効期限: access 1h, refresh 30d

---

## 2. Users（ユーザー）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| GET | `/users/me` | 自分のプロフィール | owner | — | `{user}` |
| PATCH | `/users/me` | プロフィール更新 | owner | `{display_name?, avatar_url?, bio_short?, dark_mode?, push_enabled?, default_calendar_permission?}` | `{user}` |
| GET | `/users/:id/public` | 公開情報（最小限） | authenticated | — | `{display_name, avatar_url, verification_status, rating_avg, cancel_rate}` |

**認可ルール**:
- `/users/me` : 自分のデータのみ。他人のフルプロフィールは取得不可
- `/users/:id/public` : スロット詳細画面で出品者の最小情報を表示する用途のみ。カレンダー等は含めない

---

## 3. Slots（スロット）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| GET | `/slots` | スロット検索 | authenticated | Query: `time_start, time_end, mode, category, max_price, lat, lng, radius_km, sort, page, limit` | `{slots[], total, page}` |
| GET | `/slots/now` | 今から検索 | authenticated | Query: `duration, mode, lat, lng, radius_km, limit` | `{slots[]}` |
| GET | `/slots/:id` | スロット詳細 | authenticated | — | `{slot, seller_public}` |
| POST | `/slots` | スロット出品 | authenticated | `{start_at, end_at, duration_minutes, mode, category, price_yen, area_type?, area_value?, area_lat?, area_lng?, area_radius_km?, exact_location?, booking_type}` | `{slot}` |
| PATCH | `/slots/:id` | スロット更新 | owner | `{status?, price_yen?, ...}` | `{slot}` |
| POST | `/slots/:id/pause` | 販売停止 | owner | — | `{slot}` |
| POST | `/slots/:id/resume` | 販売再開 | owner | — | `{slot}` |
| POST | `/slots/:id/boost` | ブースト | owner | `{duration_hours: 1|6}` | `{slot, ticket_cost}` |
| GET | `/slots/mine` | 自分の出品一覧 | owner | Query: `status, page, limit` | `{slots[], total}` |

**認可ルール**:
- `GET /slots`, `GET /slots/now` : 認証済みユーザーのみ。status=listed のみ返却
- `POST /slots` : 出品時に衝突チェック実行（private_events + 既存slots）
- `PATCH`, `pause`, `resume`, `boost` : slot.seller_user_id === 認証ユーザーのみ
- `GET /slots/:id` : 認証済み。exact_location は booking が confirmed の buyer にのみ返却

**衝突チェック処理（POST /slots）**:
```sql
-- 非公開予定との衝突
SELECT COUNT(*) FROM private_events
WHERE user_id = :seller_id
  AND start_at < :end_at
  AND end_at > :start_at;

-- 既存スロットとの衝突
SELECT COUNT(*) FROM slots
WHERE seller_user_id = :seller_id
  AND status IN ('listed', 'booked_pending', 'booked_confirmed')
  AND start_at < :end_at
  AND end_at > :start_at;
```
衝突があれば 409 Conflict を返す。

---

## 4. Bookings（予約）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| POST | `/bookings` | 予約作成（購入） | authenticated | `{slot_id}` | `{booking, payment_intent_client_secret?}` |
| POST | `/bookings/:id/approve` | 承認（売り手） | owner(seller) | — | `{booking}` |
| POST | `/bookings/:id/reject` | 拒否（売り手） | owner(seller) | `{reason?}` | `{booking}` |
| POST | `/bookings/:id/cancel` | キャンセル | owner(buyer/seller) | `{reason?}` | `{booking, refund_amount}` |
| POST | `/bookings/:id/complete` | 完了確認 | owner(buyer/seller) | — | `{booking}` |
| GET | `/bookings/mine` | 自分の予約一覧 | owner | Query: `role(buyer|seller), status, page, limit` | `{bookings[], total}` |
| GET | `/bookings/:id` | 予約詳細 | owner(buyer/seller) | — | `{booking, slot, counterpart_public}` |

**認可ルール**:
- `POST /bookings` : 認証済み。自分のスロットは購入不可。与信処理をStripeで実行
- `approve`, `reject` : booking.seller_user_id === 認証ユーザー
- `cancel` : buyer or seller のみ。キャンセル規定に基づき返金額を計算
- `complete` : buyer or seller。双方が完了ボタンを押した時点で COMPLETED にする（or 終了時刻+1h後に自動完了）
- `GET /bookings/:id` : buyer or seller のみ。confirmed 以降で exact_location を含む

---

## 5. Square（広場）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| GET | `/square/posts` | 投稿一覧 | authenticated | Query: `tag?, mode?, page, limit` | `{posts[], total}` |
| POST | `/square/posts` | 投稿作成 | authenticated | `{text, tags[], preferred_mode}` | `{post, ticket_cost}` |
| DELETE | `/square/posts/:id` | 投稿削除（自分のみ） | owner | — | `{ok: true}` |
| POST | `/square/posts/:id/like` | いいねトグル | authenticated | — | `{liked: boolean, like_count}` |

**認可ルール**:
- `POST /square/posts` : チケット残高チェック（2🎫）。日次上限10件チェック。テキストフィルタ（URL/電話番号除去）
- `DELETE` : post.user_id === 認証ユーザー
- `like` : 自分の投稿にもいいね可

---

## 6. Requests（依頼）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| POST | `/square/posts/:id/request` | 時間共有を依頼 | authenticated | `{desired_start_at?, desired_window, mode, duration_minutes, budget_yen, note_short?}` | `{request, ticket_cost}` |
| GET | `/requests/inbox` | 受信した依頼一覧 | owner | Query: `status, page, limit` | `{requests[], total}` |
| GET | `/requests/sent` | 送信した依頼一覧 | owner | Query: `status, page, limit` | `{requests[], total}` |
| POST | `/requests/:id/accept` | 依頼を承認 | owner(receiver) | `{price_yen?}` | `{request, slot, booking}` |
| POST | `/requests/:id/reject` | 依頼を拒否 | owner(receiver) | — | `{request, refund_tickets}` |

**認可ルール**:
- `POST /requests` : チケット残高チェック（5🎫）。日次上限20件。自分の投稿への依頼は不可
- `accept` : request.to_user_id === 認証ユーザー。Slot自動生成 + Booking作成
- `reject` : request.to_user_id === 認証ユーザー。半額返金処理

**承認時の自動処理**:
1. Slot を生成（from_user の依頼内容をベースに、to_user が売り手）
2. Booking を作成（status=confirmed or payment_authorized）
3. 決済フローを開始

---

## 7. Friends（フレンド）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| GET | `/friends` | フレンド一覧 | owner | Query: `status` | `{friends[]}` |
| POST | `/friends/invite` | 招待トークン発行 | authenticated | `{type: 'qr'|'link'}` | `{token, expires_at, invite_url?}` |
| POST | `/friends/accept` | 招待を承認 | authenticated | `{token}` | `{friend}` |
| PATCH | `/friends/:id` | 権限変更 | owner | `{permission_level}` | `{friend}` |
| POST | `/friends/:id/block` | ブロック | owner | — | `{friend}` |
| POST | `/friends/:id/unblock` | ブロック解除 | owner | — | `{friend}` |
| DELETE | `/friends/:id` | フレンド解除 | owner | — | `{ok: true}` |
| GET | `/friends/:id/calendar` | カレンダー表示 | friend | Query: `start_date, end_date` | `{events[]}` |

**認可ルール**:
- `POST /friends/invite` : レート制限（10回/日）
- `POST /friends/accept` : トークン有効性チェック（期限・使用回数）。相互承認レコード作成
- `GET /friends/:id/calendar` : friends テーブルで相互 accepted 確認 + permission_level に応じたフィールドフィルタ

**カレンダー返却フィルタ**:
```
IF permission_level == 'busy_only':
  events[] = [{start_at, end_at, type: 'busy'}]  // タイトル等なし

IF permission_level == 'title':
  events[] = [{start_at, end_at, title, type: 'event'}]
  ※ visibility_to_friends == 'hidden' の予定は除外
  ※ visibility_to_friends == 'busy_only' の予定は type: 'busy' で返却

IF permission_level == 'detail':
  events[] = [{start_at, end_at, title, location?, memo?, type: 'event'}]
  ※ hidden は除外、busy_only は type: 'busy' で返却
```

---

## 8. Private Events（非公開予定）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| GET | `/private-events` | 自分の非公開予定一覧 | owner | Query: `start_date, end_date` | `{events[]}` |
| POST | `/private-events` | 非公開予定追加 | owner | `{start_at, end_at, title?, visibility_to_friends}` | `{event, conflicts?}` |
| PATCH | `/private-events/:id` | 非公開予定更新 | owner | `{start_at?, end_at?, title?, visibility_to_friends?}` | `{event}` |
| DELETE | `/private-events/:id` | 非公開予定削除 | owner | — | `{ok: true}` |

**認可ルール**:
- 全て `owner` のみ（自分の非公開予定のみ操作可能）
- `POST` 時に既存スロットとの衝突チェックを実行し、衝突があれば `conflicts` フィールドで返却

---

## 9. Tickets（チケット）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| GET | `/tickets/balance` | チケット残高 | owner | — | `{balance, last_updated}` |
| POST | `/tickets/purchase` | チケット購入 | authenticated | `{pack_id}` | `{payment_intent_client_secret, pack}` |
| POST | `/tickets/purchase/confirm` | 購入確定 | authenticated | `{payment_intent_id}` | `{balance, ledger_entry}` |
| GET | `/tickets/ledger` | 利用履歴 | owner | Query: `page, limit` | `{entries[], total, balance}` |

**認可ルール**:
- `balance`, `ledger` : 自分のデータのみ
- `purchase` : Stripe Checkout/PaymentIntent で課金。IAP の場合はWebhookで処理

---

## 10. Reports（通報）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| POST | `/reports` | 通報送信 | authenticated | `{target_type, target_id, reason, detail?}` | `{report}` |

**認可ルール**:
- 認証済みユーザーのみ
- 同一ユーザーが同一ターゲットに対して24h以内に重複通報不可
- 通報閾値（同一ターゲットに3件以上）で自動非表示フラグ設定

---

## 11. Notifications（通知）

| Method | Path | 説明 | 認可 | リクエスト | レスポンス |
|--------|------|------|------|----------|----------|
| GET | `/notifications` | 通知一覧 | owner | Query: `page, limit, unread_only?` | `{notifications[], unread_count}` |
| POST | `/notifications/:id/read` | 既読にする | owner | — | `{ok: true}` |
| POST | `/notifications/read-all` | 全て既読 | owner | — | `{ok: true}` |

---

## 共通エラーレスポンス

```json
{
  "error": {
    "code": "CONFLICT_DETECTED",
    "message": "この時間帯に既存の予定があります",
    "details": {
      "conflicting_events": [...]
    }
  }
}
```

| HTTPステータス | コード | 説明 |
|--------------|-------|------|
| 400 | INVALID_REQUEST | リクエスト不正 |
| 401 | UNAUTHORIZED | 認証必要 |
| 403 | FORBIDDEN | 認可不足 |
| 404 | NOT_FOUND | リソース不在 |
| 409 | CONFLICT_DETECTED | 衝突検知 |
| 422 | INSUFFICIENT_TICKETS | チケット不足 |
| 429 | RATE_LIMITED | レート制限超過 |
| 500 | INTERNAL_ERROR | サーバーエラー |

---

## レート制限

| エンドポイントグループ | 制限 |
|---------------------|------|
| Auth | 10 req/min/IP |
| Slots (GET) | 60 req/min/user |
| Slots (POST/PATCH) | 20 req/min/user |
| Square (POST) | 10 req/min/user |
| Requests (POST) | 20 req/min/user |
| Friends/invite | 10 req/day/user |
| Tickets/purchase | 5 req/min/user |
| Reports | 5 req/min/user |
