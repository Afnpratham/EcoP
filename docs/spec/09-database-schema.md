# 09 — Database Schema

> **Spec file:** `09-database-schema.md`  
> **Enums referenced:** All enums — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)  
> **Migrations:** Alembic (per [08-backend-architecture.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/08-backend-architecture.md))

---

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o| sap_profiles : "has optional"
    users ||--o{ auth_providers : "has many"
    users ||--o{ disposal_sessions : "creates"
    users ||--o{ ecop_transactions : "has many"
    users ||--o{ reward_redemptions : "redeems"
    users ||--o{ user_achievements : "earns"
    users ||--o{ leaderboard_snapshots : "appears in"

    bins ||--o{ disposal_sessions : "hosts"
    bins ||--o| cameras : "has one"

    disposal_sessions ||--o| waste_events : "verified by"

    rewards ||--o{ reward_redemptions : "redeemed as"

    achievements ||--o{ user_achievements : "unlocked as"

    point_rules ||--o{ ecop_transactions : "governs"

    users {
        uuid id PK
        string full_name
        string email UK
        string password_hash
        enum role
        boolean is_active
        boolean is_email_verified
        boolean is_onboarded
        integer points_balance
        timestamp password_changed_at
        timestamp created_at
        timestamp updated_at
    }

    sap_profiles {
        uuid id PK
        uuid user_id FK_UK
        string sap_id UK
        timestamp created_at
    }

    auth_providers {
        uuid id PK
        uuid user_id FK
        enum provider
        string provider_uid
        timestamp created_at
    }

    bins {
        uuid id PK
        string bin_code UK
        string description
        string location
        decimal latitude
        decimal longitude
        enum status
        timestamp created_at
        timestamp updated_at
    }

    cameras {
        uuid id PK
        string camera_code UK
        uuid bin_id FK_UK
        string hmac_secret
        enum status
        text error_log
        timestamp last_heartbeat
        timestamp created_at
        timestamp updated_at
    }

    disposal_sessions {
        uuid id PK
        uuid user_id FK
        uuid bin_id FK
        timestamp start_time
        timestamp expiry_time
        timestamp end_time
        enum status
        timestamp created_at
        timestamp updated_at
    }

    waste_events {
        uuid id PK
        uuid session_id FK_UK
        string bin_id
        decimal confidence
        enum verification_result
        timestamp event_timestamp
        timestamp created_at
    }

    failed_events {
        uuid id PK
        uuid session_id
        text payload
        text error_message
        integer retry_count
        boolean resolved
        timestamp created_at
        timestamp updated_at
    }

    ecop_transactions {
        uuid id PK
        uuid user_id FK
        enum transaction_type
        integer amount
        uuid reference_id
        string reference_type
        string description
        timestamp created_at
    }

    point_rules {
        uuid id PK
        enum waste_type
        integer points_per_event
        timestamp active_from
        timestamp active_until
        timestamp created_at
        timestamp updated_at
    }

    rewards {
        uuid id PK
        string name
        string description
        string image_url
        integer points_required
        integer quantity_total
        integer quantity_remaining
        boolean one_per_user
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    reward_redemptions {
        uuid id PK
        uuid user_id FK
        uuid reward_id FK
        integer points_spent
        enum status
        timestamp created_at
        timestamp updated_at
    }

    achievements {
        uuid id PK
        string key UK
        string name
        string description
        string icon_url
        integer threshold
        string threshold_type
        timestamp created_at
    }

    user_achievements {
        uuid id PK
        uuid user_id FK
        uuid achievement_id FK
        timestamp unlocked_at
    }

    leaderboard_snapshots {
        uuid id PK
        uuid user_id FK
        enum segment
        enum period
        integer rank
        integer points
        integer bottle_count
        timestamp computed_at
    }

    admin_settings {
        uuid id PK
        string key UK
        string value
        string description
        timestamp updated_at
        uuid updated_by FK
    }

    admin_audit_log {
        uuid id PK
        uuid actor_id FK
        string action
        string entity_type
        uuid entity_id
        jsonb before_state
        jsonb after_state
        timestamp created_at
    }
```

---

## 2. Table Definitions

### `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default `gen_random_uuid()` | |
| `full_name` | VARCHAR(100) | NOT NULL | |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Lowercase, trimmed |
| `password_hash` | VARCHAR(255) | NOT NULL | Argon2id hash |
| `role` | VARCHAR(20) | NOT NULL, default `NULL` | `UserRole` enum; NULL until onboarding complete |
| `is_active` | BOOLEAN | NOT NULL, default `TRUE` | Soft-delete / deactivation flag |
| `is_email_verified` | BOOLEAN | NOT NULL, default `FALSE` | Set to TRUE on verification link click |
| `is_onboarded` | BOOLEAN | NOT NULL, default `FALSE` | Set to TRUE after role selection |
| `points_balance` | INTEGER | NOT NULL, default `0` | Cached balance; updated transactionally with `ecop_transactions` |
| `password_changed_at` | TIMESTAMPTZ | NULL | Used to invalidate password-reset tokens issued before this timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | Auto-updated via trigger |

**Indexes:**
- `idx_users_email` UNIQUE on `email`
- `idx_users_role` on `role` (for leaderboard segment queries)

---

### `sap_profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → `users.id` ON DELETE CASCADE | One-to-one |
| `sap_id` | VARCHAR(50) | NOT NULL, UNIQUE | Opaque string, the university SAP-ERP enrollment/employee ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**Indexes:**
- `idx_sap_profiles_user_id` UNIQUE on `user_id`
- `idx_sap_profiles_sap_id` UNIQUE on `sap_id`

---

### `auth_providers`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL, FK → `users.id` ON DELETE CASCADE | |
| `provider` | VARCHAR(30) | NOT NULL | `AuthProvider` enum value |
| `provider_uid` | VARCHAR(255) | NOT NULL | Provider-specific user identifier (email for `EMAIL_PASSWORD`) |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**Constraints:**
- UNIQUE on `(provider, provider_uid)` — one account per provider identity
- UNIQUE on `(user_id, provider)` — one provider type per user (V1 constraint; V2 may allow multiple)

---

### `bins`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `bin_code` | VARCHAR(50) | NOT NULL, UNIQUE | e.g., `ECOP-BIN-LIBRARY` |
| `description` | VARCHAR(255) | NULL | Human-readable description |
| `location` | VARCHAR(255) | NULL | Physical location description |
| `latitude` | DECIMAL(10, 8) | NULL | GPS latitude (V1: nullable; V2: geofencing) |
| `longitude` | DECIMAL(11, 8) | NULL | GPS longitude |
| `status` | VARCHAR(20) | NOT NULL, default `'ACTIVE'` | `BinStatus` enum |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**Indexes:**
- `idx_bins_bin_code` UNIQUE on `bin_code`
- `idx_bins_status` on `status`

---

### `cameras`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `camera_code` | VARCHAR(50) | NOT NULL, UNIQUE | e.g., `CAM-LIBRARY-01` |
| `bin_id` | UUID | NOT NULL, UNIQUE, FK → `bins.id` | One camera per bin (V1) |
| `hmac_secret` | VARCHAR(255) | NOT NULL | Per-camera HMAC-SHA256 shared secret |
| `status` | VARCHAR(20) | NOT NULL, default `'OFFLINE'` | `CameraStatus` enum |
| `error_log` | TEXT | NULL | Last error message if `DEGRADED` |
| `last_heartbeat` | TIMESTAMPTZ | NULL | Last heartbeat timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

---

### `disposal_sessions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | Also used as `session_id` in waste events |
| `user_id` | UUID | NOT NULL, FK → `users.id` | Session creator |
| `bin_id` | UUID | NOT NULL, FK → `bins.id` | Target bin |
| `start_time` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `expiry_time` | TIMESTAMPTZ | NOT NULL | `start_time + 60 seconds` (user-facing countdown) |
| `end_time` | TIMESTAMPTZ | NULL | Set when session reaches terminal state |
| `status` | VARCHAR(20) | NOT NULL, default `'WAITING'` | `SessionStatus` enum |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**Indexes:**
- `idx_sessions_user_id` on `user_id`
- `idx_sessions_bin_id_status` on `(bin_id, status)` — for the "one active session per bin" check
- `idx_sessions_user_status` on `(user_id, status)` — for rate limit queries
- `idx_sessions_status` on `status` — for expiry sweep job

**Constraints:**
- Application-enforced: at most one row per `bin_id` where `status IN ('WAITING', 'PROCESSING')`.
  Implemented as a partial unique index: `CREATE UNIQUE INDEX idx_sessions_active_bin ON disposal_sessions (bin_id) WHERE status IN ('WAITING', 'PROCESSING');`

---

### `waste_events`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `session_id` | UUID | NOT NULL, UNIQUE, FK → `disposal_sessions.id` | **Unique** — enforces exactly one event per session |
| `bin_id` | VARCHAR(50) | NOT NULL | Bin code as reported by Awareness Engine |
| `confidence` | DECIMAL(4, 3) | NOT NULL | 0.000–1.000 |
| `verification_result` | VARCHAR(20) | NOT NULL | `VerificationResult` enum |
| `event_timestamp` | TIMESTAMPTZ | NOT NULL | Timestamp from Awareness Engine |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**Indexes:**
- `idx_waste_events_session_id` UNIQUE on `session_id` — prevents double-awarding

---

### `failed_events`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `session_id` | UUID | NULL | May be NULL if payload was unparseable |
| `payload` | TEXT | NOT NULL | Raw JSON payload that failed processing |
| `error_message` | TEXT | NOT NULL | Error description |
| `retry_count` | INTEGER | NOT NULL, default `0` | Number of delivery attempts |
| `resolved` | BOOLEAN | NOT NULL, default `FALSE` | Admin-resolved flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

---

### `ecop_transactions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL, FK → `users.id` | |
| `transaction_type` | VARCHAR(20) | NOT NULL | `TransactionType` enum |
| `amount` | INTEGER | NOT NULL | Positive for awards, negative for redemptions |
| `reference_id` | UUID | NULL | FK to the entity that triggered this transaction |
| `reference_type` | VARCHAR(30) | NULL | `'disposal_session'`, `'reward_redemption'`, `'admin_adjustment'` |
| `description` | VARCHAR(255) | NULL | Human-readable description |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | **Append-only: no UPDATE or DELETE on this table** |

**Indexes:**
- `idx_transactions_user_id` on `user_id`
- `idx_transactions_user_type` on `(user_id, transaction_type)`
- `idx_transactions_created_at` on `created_at` (for history pagination)

**Constraint:** This table is append-only. The application must never issue UPDATE or DELETE statements against it. Corrections are made via new `REVERSAL` rows.

---

### `point_rules`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `waste_type` | VARCHAR(30) | NOT NULL | `WasteType` enum |
| `points_per_event` | INTEGER | NOT NULL | Points awarded per verified disposal |
| `active_from` | TIMESTAMPTZ | NOT NULL, default `NOW()` | Rule is active from this timestamp |
| `active_until` | TIMESTAMPTZ | NULL | NULL = currently active (no end date) |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**V1 seed data:** One row: `waste_type='PLASTIC_BOTTLE'`, `points_per_event=10`, `active_from=NOW()`, `active_until=NULL`.

**Rule resolution:** When awarding points, query: `WHERE waste_type = :type AND active_from <= NOW() AND (active_until IS NULL OR active_until > NOW())`. Admin edits set `active_until` on the current row and create a new row with the new value.

---

### `rewards`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `name` | VARCHAR(100) | NOT NULL | |
| `description` | TEXT | NULL | |
| `image_url` | VARCHAR(500) | NULL | URL to reward image |
| `points_required` | INTEGER | NOT NULL | Cost in EcoP Points |
| `quantity_total` | INTEGER | NULL | NULL = unlimited supply |
| `quantity_remaining` | INTEGER | NULL | NULL = unlimited; decremented on redemption |
| `one_per_user` | BOOLEAN | NOT NULL, default `FALSE` | If TRUE, each user can redeem only once |
| `is_active` | BOOLEAN | NOT NULL, default `TRUE` | Admin can deactivate |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

---

### `reward_redemptions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL, FK → `users.id` | |
| `reward_id` | UUID | NOT NULL, FK → `rewards.id` | |
| `points_spent` | INTEGER | NOT NULL | Points deducted at time of redemption |
| `status` | VARCHAR(20) | NOT NULL, default `'PENDING'` | `RedemptionStatus` enum |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**Constraints:**
- Conditional unique: `CREATE UNIQUE INDEX idx_redemptions_one_per_user ON reward_redemptions (user_id, reward_id) WHERE status != 'CANCELLED';` — enforces `one_per_user` at DB level (only for non-cancelled redemptions).

---

### `achievements`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `key` | VARCHAR(30) | NOT NULL, UNIQUE | `AchievementKey` enum value |
| `name` | VARCHAR(100) | NOT NULL | Display name |
| `description` | VARCHAR(255) | NOT NULL | Display description |
| `icon_url` | VARCHAR(500) | NULL | Badge icon URL |
| `threshold` | INTEGER | NULL | Numeric threshold (NULL for non-numeric like `CAMPUS_CHAMPION`) |
| `threshold_type` | VARCHAR(30) | NOT NULL | `'bottle_count'` or `'leaderboard_rank'` |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**V1 seed data:** 9 rows per `AchievementKey` enum.

---

### `user_achievements`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL, FK → `users.id` | |
| `achievement_id` | UUID | NOT NULL, FK → `achievements.id` | |
| `unlocked_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**Constraints:**
- UNIQUE on `(user_id, achievement_id)` — each achievement unlocked at most once per user.

---

### `leaderboard_snapshots`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | NOT NULL, FK → `users.id` | |
| `segment` | VARCHAR(20) | NOT NULL | `LeaderboardSegment` enum |
| `period` | VARCHAR(20) | NOT NULL | `LeaderboardPeriod` enum |
| `rank` | INTEGER | NOT NULL | 1-indexed position |
| `points` | INTEGER | NOT NULL | Total points in this period |
| `bottle_count` | INTEGER | NOT NULL | Total bottles in this period |
| `computed_at` | TIMESTAMPTZ | NOT NULL | Timestamp of computation |

**Indexes:**
- `idx_lb_segment_period_rank` on `(segment, period, rank)` — primary query pattern
- `idx_lb_user_segment_period` on `(user_id, segment, period)` — find user's rank quickly
- `idx_lb_computed_at` on `computed_at` — cleanup old snapshots

**Note:** Each precompute job inserts new rows and optionally deletes rows from previous computations older than 24h.

---

### `admin_settings`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `key` | VARCHAR(100) | NOT NULL, UNIQUE | Setting key name |
| `value` | TEXT | NOT NULL | Setting value (stored as string, parsed by application) |
| `description` | VARCHAR(255) | NULL | Human-readable description |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |
| `updated_by` | UUID | NULL, FK → `users.id` | Admin who last changed this setting |

**V1 seed data:**

| Key | Value | Description |
|-----|-------|-------------|
| `confidence_threshold_verified` | `0.85` | Minimum confidence for auto-verification |
| `confidence_threshold_manual_review` | `0.50` | Minimum confidence for manual review (below = FAILED) |
| `max_sessions_per_hour` | `10` | Max disposal sessions per user per hour |
| `max_sessions_per_day` | `20` | Max disposal sessions per user per day |
| `plastic_grams_per_bottle` | `18` | Grams of plastic per bottle (for impact calc) |
| `co2e_grams_per_bottle` | `54` | Grams of CO₂e avoided per bottle recycled |
| `session_timeout_seconds` | `60` | User-facing countdown duration |
| `session_grace_seconds` | `90` | Total session lifetime before forced expiry |
| `anomaly_percentile_threshold` | `95` | Percentile for anomaly flagging |

---

### `admin_audit_log`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `actor_id` | UUID | NOT NULL, FK → `users.id` | Admin who performed the action |
| `action` | VARCHAR(50) | NOT NULL | e.g., `'update_setting'`, `'approve_review'`, `'deactivate_user'` |
| `entity_type` | VARCHAR(50) | NOT NULL | e.g., `'user'`, `'reward'`, `'bin'`, `'setting'` |
| `entity_id` | UUID | NULL | ID of the affected entity |
| `before_state` | JSONB | NULL | State before the change |
| `after_state` | JSONB | NULL | State after the change |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `NOW()` | |

**Append-only.** No UPDATE or DELETE.

---

## 3. Key Constraints Summary

| Constraint | Mechanism | Purpose |
|-----------|-----------|---------|
| One active session per bin | Partial unique index on `disposal_sessions(bin_id) WHERE status IN ('WAITING','PROCESSING')` | Prevents concurrent sessions on the same bin |
| One event per session | UNIQUE index on `waste_events.session_id` | Prevents double-awarding points |
| One-per-user rewards | Conditional unique index on `reward_redemptions(user_id, reward_id) WHERE status != 'CANCELLED'` | Enforces `one_per_user` flag |
| Unique achievements per user | UNIQUE on `user_achievements(user_id, achievement_id)` | Each achievement unlocked once |
| Unique SAP ID | UNIQUE on `sap_profiles.sap_id` | No two users share an SAP ID |
| Unique email | UNIQUE on `users.email` | Account uniqueness |
| Append-only ledger | Application-enforced (no UPDATE/DELETE on `ecop_transactions`) | Audit integrity |
| Append-only audit log | Application-enforced (no UPDATE/DELETE on `admin_audit_log`) | Admin action history |
