# SLOTY — データモデル（ER図相当）

> 推奨DB: PostgreSQL (Prisma ORM経由)
> タイムゾーン: 全てUTC保存、表示時にAsia/Tokyoへ変換

---

## ER関連図（テキスト）

```
users ─────────< slots ─────────< bookings
  │                                  │
  │                                  │
  ├──< private_events                │
  │                                  │
  ├──< friends (user_id)             │
  │      │                           │
  │      └── friends (friend_user_id)│
  │                                  │
  ├──< invites                       │
  │                                  │
  ├──< square_posts ──< square_likes │
  │         │                        │
  │         └──< requests            │
  │                                  │
  ├──< ticket_ledger                 │
  │                                  │
  ├──< reports                       │
  │                                  │
  └──< notifications                 │
                                     │
bookings ────────────────────────────┘
```

---

## テーブル定義

### 1. users

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK, default gen_random_uuid() | |
| email | VARCHAR(255) | UNIQUE, NULL許可 | メール認証時 |
| phone | VARCHAR(20) | UNIQUE, NULL許可 | 電話認証時 |
| display_name | VARCHAR(50) | NOT NULL | 表示名 |
| avatar_url | TEXT | NULL許可 | プロフィール画像URL |
| bio_short | VARCHAR(160) | NULL許可 | 短い自己紹介 |
| verification_status | ENUM('none','pending','verified') | NOT NULL, DEFAULT 'none' | 本人確認状態 |
| rating_avg | DECIMAL(2,1) | DEFAULT 0.0 | 平均評価（集計キャッシュ） |
| rating_count | INT | DEFAULT 0 | 評価件数 |
| cancel_rate | DECIMAL(4,1) | DEFAULT 0.0 | キャンセル率(%)（集計キャッシュ） |
| ticket_balance | INT | DEFAULT 0 | チケット残高キャッシュ |
| locale | VARCHAR(10) | DEFAULT 'ja' | |
| timezone | VARCHAR(50) | DEFAULT 'Asia/Tokyo' | |
| dark_mode | BOOLEAN | DEFAULT false | |
| push_enabled | BOOLEAN | DEFAULT true | |
| default_calendar_permission | ENUM('busy_only','title','detail') | DEFAULT 'busy_only' | フレンドへのデフォルト共有レベル |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_users_email` ON (email) WHERE email IS NOT NULL
- `idx_users_phone` ON (phone) WHERE phone IS NOT NULL

---

### 2. slots

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| seller_user_id | UUID | FK → users.id, NOT NULL | 出品者 |
| start_at | TIMESTAMPTZ | NOT NULL | 開始日時 |
| end_at | TIMESTAMPTZ | NOT NULL | 終了日時 |
| duration_minutes | INT | NOT NULL | 30/60/90 |
| mode | ENUM('call','in_person') | NOT NULL | 形式 |
| category | VARCHAR(50) | NOT NULL | カテゴリ |
| price_yen | INT | NOT NULL, CHECK >= 0 | 価格（円） |
| area_type | ENUM('city','radius','region') | NULL | 対面時のエリア種別 |
| area_value | VARCHAR(100) | NULL | 「仙台駅周辺」等 |
| area_radius_km | DECIMAL(4,1) | NULL | 半径km（radius型のみ） |
| area_lat | DECIMAL(9,6) | NULL | エリア中心緯度 |
| area_lng | DECIMAL(9,6) | NULL | エリア中心経度 |
| exact_location | TEXT | NULL | 予約成立後のみ開示。暗号化推奨 |
| booking_type | ENUM('instant','approval') | NOT NULL | 即確定/承認制 |
| status | ENUM('draft','listed','paused','booked_pending','booked_confirmed','completed','cancelled','expired') | NOT NULL, DEFAULT 'draft' | |
| boost_until | TIMESTAMPTZ | NULL | ブースト期限 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_slots_seller` ON (seller_user_id)
- `idx_slots_status_start` ON (status, start_at) — 検索用
- `idx_slots_mode_category` ON (mode, category) WHERE status = 'listed'
- `idx_slots_area` ON (area_lat, area_lng) WHERE mode = 'in_person' AND status = 'listed'
- `idx_slots_boost` ON (boost_until) WHERE boost_until IS NOT NULL

**CHECK制約**:
- `chk_slots_time` CHECK (end_at > start_at)
- `chk_slots_duration` CHECK (duration_minutes IN (30, 60, 90))

---

### 3. bookings

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| slot_id | UUID | FK → slots.id, NOT NULL | |
| buyer_user_id | UUID | FK → users.id, NOT NULL | 買い手 |
| seller_user_id | UUID | FK → users.id, NOT NULL | 売り手（非正規化） |
| status | ENUM('init','payment_authorized','confirmed','in_progress','completed','cancelled_by_buyer','cancelled_by_seller','auto_cancelled','refunded','partial_refunded') | NOT NULL, DEFAULT 'init' | |
| payment_intent_id | VARCHAR(255) | NULL | Stripe PaymentIntent ID |
| amount_yen | INT | NOT NULL | 取引金額 |
| fee_yen | INT | NOT NULL, DEFAULT 0 | プラットフォーム手数料 |
| cancel_reason | TEXT | NULL | キャンセル理由 |
| confirmed_at | TIMESTAMPTZ | NULL | |
| cancelled_at | TIMESTAMPTZ | NULL | |
| completed_at | TIMESTAMPTZ | NULL | |
| refund_amount_yen | INT | DEFAULT 0 | 返金額 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_bookings_buyer` ON (buyer_user_id)
- `idx_bookings_seller` ON (seller_user_id)
- `idx_bookings_slot` ON (slot_id)
- `idx_bookings_status` ON (status)

---

### 4. private_events

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | |
| start_at | TIMESTAMPTZ | NOT NULL | |
| end_at | TIMESTAMPTZ | NOT NULL | |
| title | VARCHAR(100) | NULL | hiddenの場合も保持するが外に出さない |
| visibility_to_friends | ENUM('busy_only','title','detail','hidden') | NOT NULL, DEFAULT 'busy_only' | |
| source | ENUM('manual','import') | NOT NULL, DEFAULT 'manual' | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_private_events_user_time` ON (user_id, start_at, end_at)

**CHECK制約**:
- `chk_private_events_time` CHECK (end_at > start_at)

---

### 5. friends

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | 自分 |
| friend_user_id | UUID | FK → users.id, NOT NULL | 相手 |
| status | ENUM('pending','accepted','blocked') | NOT NULL, DEFAULT 'pending' | |
| permission_level | ENUM('busy_only','title','detail') | NOT NULL, DEFAULT 'busy_only' | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_friends_user` ON (user_id, status)
- `idx_friends_pair` UNIQUE ON (user_id, friend_user_id)

---

### 6. invites

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| inviter_user_id | UUID | FK → users.id, NOT NULL | |
| token | VARCHAR(64) | UNIQUE, NOT NULL | 暗号学的乱数 |
| type | ENUM('qr','link') | NOT NULL | |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| max_uses | INT | NOT NULL, DEFAULT 1 | |
| used_count | INT | NOT NULL, DEFAULT 0 | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_invites_token` ON (token)
- `idx_invites_user_created` ON (inviter_user_id, created_at) — レート制限用

---

### 7. square_posts

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | |
| text | VARCHAR(280) | NOT NULL | |
| tags | TEXT[] | NOT NULL | PostgreSQL配列 |
| preferred_mode | ENUM('call','in_person','either') | NOT NULL | |
| like_count | INT | DEFAULT 0 | キャッシュ |
| status | ENUM('active','hidden') | NOT NULL, DEFAULT 'active' | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_square_posts_created` ON (created_at DESC) WHERE status = 'active'
- `idx_square_posts_user` ON (user_id)

---

### 8. square_likes

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| post_id | UUID | FK → square_posts.id, NOT NULL | |
| user_id | UUID | FK → users.id, NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**制約**:
- `uq_square_likes_post_user` UNIQUE ON (post_id, user_id)

---

### 9. requests

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| post_id | UUID | FK → square_posts.id, NOT NULL | 元投稿 |
| from_user_id | UUID | FK → users.id, NOT NULL | 依頼者 |
| to_user_id | UUID | FK → users.id, NOT NULL | 受信者（投稿者） |
| desired_start_at | TIMESTAMPTZ | NULL | 日時指定時 |
| desired_window | ENUM('now','today','specified') | NOT NULL | |
| mode | ENUM('call','in_person') | NOT NULL | |
| duration_minutes | INT | NOT NULL | |
| budget_yen | INT | NOT NULL | |
| note_short | VARCHAR(80) | NULL | ひとこと |
| status | ENUM('sent','accepted','rejected','timeout','refunded','partial_refunded') | NOT NULL, DEFAULT 'sent' | |
| ticket_cost | INT | NOT NULL | 消費チケット数 |
| generated_slot_id | UUID | FK → slots.id, NULL | 承認時に生成されたスロット |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_requests_to_user` ON (to_user_id, status)
- `idx_requests_from_user` ON (from_user_id)
- `idx_requests_timeout` ON (created_at) WHERE status = 'sent' — タイムアウトバッチ用

---

### 10. ticket_ledger

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | |
| delta | INT | NOT NULL | 正=増加、負=消費 |
| reason | ENUM('purchase','signup_bonus','daily_bonus','weekly_bonus','post','request','boost','refund','trade_bonus_seller','trade_bonus_buyer') | NOT NULL | |
| ref_type | ENUM('post','request','slot','booking','system') | NULL | 参照先タイプ |
| ref_id | UUID | NULL | 参照先ID |
| idempotency_key | VARCHAR(100) | UNIQUE | 冪等性保証 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_ticket_ledger_user` ON (user_id, created_at)
- `idx_ticket_ledger_idempotency` UNIQUE ON (idempotency_key)

---

### 11. reports

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| reporter_user_id | UUID | FK → users.id, NOT NULL | 通報者 |
| target_type | ENUM('user','slot','post') | NOT NULL | |
| target_id | UUID | NOT NULL | |
| reason | VARCHAR(50) | NOT NULL | |
| detail | TEXT | NULL | |
| status | ENUM('pending','reviewed','resolved','dismissed') | NOT NULL, DEFAULT 'pending' | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_reports_target` ON (target_type, target_id)
- `idx_reports_status` ON (status)

---

### 12. notifications

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | |
| type | VARCHAR(50) | NOT NULL | イベント種別 |
| title | VARCHAR(100) | NOT NULL | 通知タイトル |
| body | VARCHAR(500) | NOT NULL | 通知本文 |
| ref_type | VARCHAR(50) | NULL | |
| ref_id | UUID | NULL | |
| is_read | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス**:
- `idx_notifications_user` ON (user_id, is_read, created_at DESC)

---

### 13. supported_areas（マスタ）

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | UUID | PK | |
| name | VARCHAR(50) | NOT NULL | 「仙台」等 |
| display_name | VARCHAR(100) | NOT NULL | 「仙台市」 |
| lat | DECIMAL(9,6) | NOT NULL | 中心緯度 |
| lng | DECIMAL(9,6) | NOT NULL | 中心経度 |
| radius_km | DECIMAL(5,1) | NOT NULL | 対象半径 |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### 14. categories（マスタ）

| カラム | 型 | 制約 | 説明 |
|-------|---|------|------|
| id | VARCHAR(50) | PK | 'chat','work','study','consult','walk','sightseeing','event' |
| display_name | VARCHAR(50) | NOT NULL | '雑談','作業同行','勉強','相談','散歩','観光','イベント同行' |
| sort_order | INT | NOT NULL | 表示順 |
| is_active | BOOLEAN | DEFAULT true | |

---

## リレーション図（簡略）

```
users 1──< N slots
users 1──< N bookings (as buyer)
users 1──< N bookings (as seller)
slots 1──< N bookings
users 1──< N private_events
users 1──< N friends (as user_id)
users 1──< N friends (as friend_user_id)
users 1──< N invites
users 1──< N square_posts
users 1──< N square_likes
square_posts 1──< N square_likes
square_posts 1──< N requests
users 1──< N requests (as from_user_id)
users 1──< N requests (as to_user_id)
requests 0..1──1 slots (generated_slot_id)
users 1──< N ticket_ledger
users 1──< N reports
users 1──< N notifications
```
