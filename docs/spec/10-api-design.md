# 10 — REST API Design

> **Spec file:** `10-api-design.md`  
> **Enums referenced:** All enums — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)  
> **Database schema:** See [09-database-schema.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/09-database-schema.md)  
> **Response envelope:** `{ data, meta, error }` — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)

All endpoints are prefixed with `/api/v1/`. Breaking changes require a new version prefix. Additive changes do not.

---

## 1. Auth Endpoints

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `POST` | `/auth/register` | None | `{ full_name, email, password }` | `{ user_id, email, message: "Verification email sent" }` | `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS` |
| `POST` | `/auth/verify-email` | None | `{ token }` | `{ message: "Email verified" }` | `TOKEN_INVALID`, `TOKEN_EXPIRED` |
| `POST` | `/auth/login` | None | `{ email, password }` | `{ access_token, token_type: "bearer", user }` + `Set-Cookie: refresh_token` | `VALIDATION_ERROR`, `INVALID_CREDENTIALS` |
| `POST` | `/auth/refresh` | Cookie | *(none — refresh token sent via httpOnly cookie)* | `{ access_token, token_type: "bearer" }` + `Set-Cookie: new_refresh_token` | `REFRESH_TOKEN_EXPIRED`, `TOKEN_INVALID` |
| `POST` | `/auth/logout` | Bearer | *(none)* | `{ message: "Logged out" }` | `UNAUTHORIZED` |
| `POST` | `/auth/forgot-password` | None | `{ email }` | `{ message: "If the email exists, a reset link has been sent" }` | `VALIDATION_ERROR` |
| `POST` | `/auth/reset-password` | None | `{ token, new_password }` | `{ message: "Password reset successful" }` | `TOKEN_INVALID`, `TOKEN_EXPIRED`, `VALIDATION_ERROR` |

### Auth Response Shapes

**Login response `user` object:**
```json
{
  "id": "uuid",
  "full_name": "Arjun Sharma",
  "email": "arjun@university.edu",
  "role": "STUDENT",
  "is_email_verified": true,
  "is_onboarded": true,
  "points_balance": 420,
  "created_at": "2026-01-15T10:00:00Z"
}
```

---

## 2. User Endpoints

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/users/me` | Bearer | — | `User` object (same shape as login response, plus `sap_id` if applicable) | `UNAUTHORIZED` |
| `PATCH` | `/users/me` | Bearer | `{ full_name? }` | Updated `User` object | `UNAUTHORIZED`, `VALIDATION_ERROR` |
| `POST` | `/users/me/onboarding` | Bearer | `{ role, sap_id? }` | Updated `User` object | `UNAUTHORIZED`, `VALIDATION_ERROR`, `SAP_ID_ALREADY_LINKED` |
| `GET` | `/users/me/dashboard` | Bearer | — | `Dashboard` object (see below) | `UNAUTHORIZED` |
| `GET` | `/users/me/achievements` | Bearer | — | `[UserAchievement]` | `UNAUTHORIZED` |
| `GET` | `/users/me/sessions` | Bearer | Query: `?status=`, `?cursor=`, `?per_page=` | Paginated `[DisposalSession]` | `UNAUTHORIZED` |
| `GET` | `/users/me/transactions` | Bearer | Query: `?type=`, `?cursor=`, `?per_page=` | Paginated `[EcopTransaction]` | `UNAUTHORIZED` |
| `POST` | `/users/me/change-password` | Bearer | `{ current_password, new_password }` | `{ message: "Password changed" }` | `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `VALIDATION_ERROR` |

### Dashboard Response Shape

```json
{
  "user": { "id": "uuid", "full_name": "...", "role": "STUDENT", "points_balance": 420 },
  "stats": {
    "total_bottles": 42,
    "plastic_prevented_grams": 756,
    "co2e_avoided_grams": 2268,
    "current_rank": 12,
    "weekly_bottles": [3, 5, 2, 4, 0, 0, 0],
    "weekly_bottles_last": [2, 3, 4, 1, 2, 3, 1]
  },
  "active_session": null,
  "recent_sessions": [
    {
      "id": "uuid",
      "bin_code": "ECOP-BIN-LIBRARY",
      "status": "VERIFIED",
      "start_time": "2026-07-28T15:30:00Z",
      "points_awarded": 10
    }
  ],
  "recent_achievements": [
    { "key": "FIRST_BOTTLE", "name": "First Bottle", "unlocked_at": "2026-07-15T10:00:00Z" }
  ],
  "next_reward": {
    "name": "Coffee Voucher",
    "points_required": 500,
    "points_remaining": 80,
    "progress_percent": 84
  },
  "leaderboard_preview": [
    { "rank": 1, "full_name": "User A", "points": 550 }
  ],
  "nearby_bins": [
    { "bin_code": "ECOP-BIN-LIBRARY", "location": "Main Library Entrance", "status": "ACTIVE" }
  ]
}
```

---

## 3. Bin Endpoints

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/bins` | Bearer | Query: `?status=`, `?cursor=`, `?per_page=` | Paginated `[Bin]` | `UNAUTHORIZED` |
| `GET` | `/bins/:bin_code` | Bearer | — | `Bin` object | `UNAUTHORIZED`, `BIN_NOT_FOUND` |

### Bin Response Shape

```json
{
  "id": "uuid",
  "bin_code": "ECOP-BIN-LIBRARY",
  "description": "Recycling bin at the main library entrance",
  "location": "Main Library, Ground Floor",
  "status": "ACTIVE",
  "latitude": null,
  "longitude": null
}
```

---

## 4. Session Endpoints

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `POST` | `/sessions` | Bearer | `{ bin_code }` | `DisposalSession` object | `UNAUTHORIZED`, `BIN_NOT_FOUND`, `BIN_INACTIVE`, `BIN_BUSY`, `RATE_LIMIT_EXCEEDED`, `DAILY_LIMIT_EXCEEDED` |
| `GET` | `/sessions/:session_id` | Bearer (owner) | — | `DisposalSession` object | `UNAUTHORIZED`, `SESSION_NOT_FOUND` |

### Session Creation Response

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "bin_id": "uuid",
  "bin_code": "ECOP-BIN-LIBRARY",
  "start_time": "2026-07-28T15:30:00Z",
  "expiry_time": "2026-07-28T15:31:00Z",
  "status": "WAITING",
  "countdown_seconds": 60
}
```

### `BIN_BUSY` Error Response (409)

```json
{
  "data": null,
  "meta": null,
  "error": {
    "code": "BIN_BUSY",
    "message": "This bin has an active session. Please wait.",
    "details": {
      "remaining_seconds": 35
    }
  }
}
```

---

## 5. Waste Events Endpoint (Awareness Engine Webhook)

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `POST` | `/waste-events` | HMAC-SHA256 (`X-EcoP-Signature` header) | `WasteEvent` payload | `{ message: "Event processed", session_status }` | `INVALID_SIGNATURE`, `VALIDATION_ERROR`, `SESSION_NOT_FOUND`, `SESSION_EXPIRED`, `DUPLICATE_EVENT` |

### Request Payload

```json
{
  "session_id": "uuid",
  "bin_id": "ECOP-BIN-LIBRARY",
  "timestamp": "2026-07-28T15:30:25Z",
  "confidence": 0.94,
  "verification_result": "VERIFIED"
}
```

### HMAC Signature Verification

The `X-EcoP-Signature` header contains: `sha256=<hex-digest>` where the digest is `HMAC-SHA256(secret, request_body_bytes)`.

### Response Contract for Awareness Engine

| HTTP Status | Meaning | Engine Action |
|------------|---------|---------------|
| `200` | Event accepted and processed | No retry |
| `409` (`DUPLICATE_EVENT`) | Event already processed for this session | No retry (idempotent) |
| `400` | Validation error (malformed payload) | No retry (log error) |
| `401` | Invalid HMAC signature | No retry (log + alert) |
| `404` | Session not found | No retry |
| `410` | Session already expired | No retry |
| `500` | Internal server error | Retry with backoff |
| `503` | Service unavailable | Retry with backoff |

### Retry Policy (Awareness Engine Side)

- **Retries:** 3 attempts maximum.
- **Backoff:** Exponential — 1s, 4s, 16s.
- **After 3 failures:** Dead-letter the event. Backend records it in `failed_events` table if the event reached the server but processing failed. If the engine cannot reach the server at all, the engine logs it locally.

---

## 6. Rewards Endpoints

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/rewards` | Bearer | Query: `?active_only=true`, `?cursor=`, `?per_page=` | Paginated `[Reward]` (includes user-specific state) | `UNAUTHORIZED` |
| `GET` | `/rewards/:reward_id` | Bearer | — | `Reward` object | `UNAUTHORIZED`, `REWARD_NOT_FOUND` |
| `POST` | `/rewards/:reward_id/redeem` | Bearer | *(none)* | `RewardRedemption` object | `UNAUTHORIZED`, `REWARD_NOT_FOUND`, `INSUFFICIENT_POINTS`, `REWARD_OUT_OF_STOCK`, `REWARD_ALREADY_REDEEMED` |

### Reward Response Shape (includes user context)

```json
{
  "id": "uuid",
  "name": "Coffee Voucher",
  "description": "Free coffee at the campus café",
  "image_url": "https://...",
  "points_required": 100,
  "quantity_remaining": 45,
  "one_per_user": false,
  "is_active": true,
  "user_can_redeem": true,
  "user_has_redeemed": false
}
```

---

## 7. Achievements Endpoints

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/achievements` | Bearer | — | `[Achievement]` with user unlock status | `UNAUTHORIZED` |

### Achievement Response Shape

```json
{
  "key": "BOTTLES_50",
  "name": "50 Bottles",
  "description": "Recycle 50 plastic bottles",
  "icon_url": "https://...",
  "threshold": 50,
  "threshold_type": "bottle_count",
  "is_unlocked": false,
  "unlocked_at": null,
  "progress": 25,
  "progress_percent": 50
}
```

---

## 8. Leaderboard Endpoints

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/leaderboard` | Bearer | Query: `?segment=STUDENTS`, `?period=WEEKLY`, `?cursor=`, `?per_page=20` | `{ rankings: [LeaderboardEntry], user_rank: LeaderboardEntry }` | `UNAUTHORIZED` |

### Leaderboard Response Shape

```json
{
  "rankings": [
    { "rank": 1, "user_id": "uuid", "full_name": "User A", "points": 550, "bottle_count": 55 },
    { "rank": 2, "user_id": "uuid", "full_name": "User B", "points": 480, "bottle_count": 48 }
  ],
  "user_rank": {
    "rank": 12, "user_id": "uuid", "full_name": "Arjun Sharma", "points": 180, "bottle_count": 18
  },
  "segment": "STUDENTS",
  "period": "WEEKLY",
  "computed_at": "2026-07-28T15:15:00Z"
}
```

---

## 9. Statistics Endpoints

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/statistics` | None (public) | — | `Statistics` object | *(none — always succeeds)* |

### Statistics Response Shape

```json
{
  "total_bottles_recycled": 12450,
  "total_plastic_prevented_grams": 224100,
  "total_co2e_avoided_grams": 672300,
  "active_users": 312,
  "today_collections": 87,
  "weekly_collections": 523,
  "monthly_collections": 2104,
  "cached_at": "2026-07-28T15:25:00Z"
}
```

---

## 10. SSE Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/sse/user` | Bearer | Stream of events for the authenticated user (point updates, achievement unlocks) |
| `GET` | `/sse/sessions/:session_id` | Bearer (owner) | Stream of status changes for a specific disposal session |

### SSE Event Format

```
event: session.status_changed
data: {"session_id":"uuid","status":"PROCESSING","countdown_seconds":42}

event: session.verified
data: {"session_id":"uuid","points_awarded":10,"new_balance":430}

event: achievement.unlocked
data: {"achievement_key":"BOTTLES_10","name":"10 Bottles","unlocked_at":"2026-07-28T15:30:45Z"}

event: points.updated
data: {"new_balance":430}
```

---

## 11. Admin Endpoints

All admin endpoints require Bearer auth with `UserRole.ADMIN`.

### Users

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/users` | Admin | Query: `?role=`, `?flagged=`, `?search=`, `?cursor=`, `?per_page=` | Paginated `[AdminUser]` | `FORBIDDEN` |
| `GET` | `/admin/users/:user_id` | Admin | — | `AdminUser` (extended detail) | `FORBIDDEN`, `USER_NOT_FOUND` |
| `PATCH` | `/admin/users/:user_id` | Admin | `{ role?, is_active? }` | Updated `AdminUser` | `FORBIDDEN`, `USER_NOT_FOUND`, `VALIDATION_ERROR` |

### Bins

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/bins` | Admin | Query: `?status=`, `?cursor=`, `?per_page=` | Paginated `[Bin]` | `FORBIDDEN` |
| `POST` | `/admin/bins` | Admin | `{ bin_code, description, location, latitude?, longitude? }` | `Bin` object | `FORBIDDEN`, `VALIDATION_ERROR` |
| `PATCH` | `/admin/bins/:bin_id` | Admin | `{ description?, location?, status?, latitude?, longitude? }` | Updated `Bin` | `FORBIDDEN`, `BIN_NOT_FOUND`, `VALIDATION_ERROR` |

### Cameras

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/cameras` | Admin | Query: `?status=`, `?cursor=`, `?per_page=` | Paginated `[Camera]` | `FORBIDDEN` |
| `POST` | `/admin/cameras` | Admin | `{ camera_code, bin_id }` | `Camera` object (includes generated `hmac_secret`) | `FORBIDDEN`, `VALIDATION_ERROR` |
| `PATCH` | `/admin/cameras/:camera_id` | Admin | `{ bin_id?, status? }` | Updated `Camera` | `FORBIDDEN`, `VALIDATION_ERROR` |
| `POST` | `/admin/cameras/:camera_id/heartbeat` | HMAC | `{ status, error_log? }` | `{ message: "OK" }` | `INVALID_SIGNATURE` |

### Sessions

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/sessions` | Admin | Query: `?status=`, `?bin_id=`, `?user_id=`, `?cursor=`, `?per_page=` | Paginated `[DisposalSession]` | `FORBIDDEN` |
| `GET` | `/admin/sessions/:session_id` | Admin | — | `DisposalSession` (with waste event details) | `FORBIDDEN`, `SESSION_NOT_FOUND` |

### Manual Review

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/review` | Admin | Query: `?cursor=`, `?per_page=` | Paginated `[ReviewableSession]` | `FORBIDDEN` |
| `POST` | `/admin/review/:session_id` | Admin | `{ action: "APPROVE" \| "REJECT" }` | Updated `DisposalSession` | `FORBIDDEN`, `SESSION_NOT_FOUND`, `VALIDATION_ERROR` |

### Waste Events

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/events` | Admin | Query: `?cursor=`, `?per_page=` | Paginated `[WasteEvent]` | `FORBIDDEN` |
| `GET` | `/admin/failed-events` | Admin | Query: `?resolved=`, `?cursor=`, `?per_page=` | Paginated `[FailedEvent]` | `FORBIDDEN` |
| `PATCH` | `/admin/failed-events/:event_id` | Admin | `{ resolved: true }` | Updated `FailedEvent` | `FORBIDDEN`, `VALIDATION_ERROR` |

### Rewards

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/rewards` | Admin | Query: `?active=`, `?cursor=`, `?per_page=` | Paginated `[Reward]` | `FORBIDDEN` |
| `POST` | `/admin/rewards` | Admin | `{ name, description, image_url, points_required, quantity_total, one_per_user }` | `Reward` object | `FORBIDDEN`, `VALIDATION_ERROR` |
| `PATCH` | `/admin/rewards/:reward_id` | Admin | `{ name?, description?, image_url?, points_required?, quantity_total?, quantity_remaining?, one_per_user?, is_active? }` | Updated `Reward` | `FORBIDDEN`, `REWARD_NOT_FOUND`, `VALIDATION_ERROR` |
| `GET` | `/admin/rewards/:reward_id/redemptions` | Admin | Query: `?status=`, `?cursor=`, `?per_page=` | Paginated `[RewardRedemption]` | `FORBIDDEN`, `REWARD_NOT_FOUND` |
| `PATCH` | `/admin/rewards/redemptions/:redemption_id` | Admin | `{ status }` | Updated `RewardRedemption` | `FORBIDDEN`, `VALIDATION_ERROR` |

### Point Rules

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/point-rules` | Admin | — | `[PointRule]` | `FORBIDDEN` |
| `PATCH` | `/admin/point-rules/:rule_id` | Admin | `{ points_per_event }` | Updated `PointRule` + new `PointRule` row | `FORBIDDEN`, `VALIDATION_ERROR` |

### Settings

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/settings` | Admin | — | `[AdminSetting]` | `FORBIDDEN` |
| `PATCH` | `/admin/settings/:key` | Admin | `{ value }` | Updated `AdminSetting` | `FORBIDDEN`, `VALIDATION_ERROR` |

### Analytics

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/analytics/overview` | Admin | Query: `?period=daily\|weekly\|monthly` | `AnalyticsOverview` object | `FORBIDDEN` |
| `GET` | `/admin/analytics/disposal-trends` | Admin | Query: `?from=`, `?to=`, `?granularity=daily\|weekly` | `[{ date, count }]` | `FORBIDDEN` |
| `GET` | `/admin/analytics/user-growth` | Admin | Query: `?from=`, `?to=` | `[{ date, new_users, cumulative }]` | `FORBIDDEN` |

### Flagged Users

| Method | Path | Auth | Request Body | Response (`data`) | Error Codes |
|--------|------|------|-------------|-------------------|-------------|
| `GET` | `/admin/flags` | Admin | Query: `?cursor=`, `?per_page=` | Paginated `[FlaggedUser]` | `FORBIDDEN` |
| `POST` | `/admin/flags/:user_id/clear` | Admin | *(none)* | `{ message: "Flag cleared" }` | `FORBIDDEN`, `USER_NOT_FOUND` |

---

## 12. Health Check

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/health` | None | `{ status: "healthy", version: "1.0.0", timestamp: "ISO-8601" }` |
