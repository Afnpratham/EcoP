# EcoP Specification — Master Index

> **Version:** 1.0.0-draft  
> **Last Updated:** 2026-07-28  
> **Status:** Complete Specification for V1

---

## Table of Contents

| #  | File                                                                                  | Contents                                              |
| -- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 00 | [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)           | TOC, shared enums, assumptions log, open questions     |
| 01 | [01-prd.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/01-prd.md)               | Product Requirements Document                          |
| 02 | [02-requirements.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/02-requirements.md) | Functional + non-functional requirements           |
| 03 | [03-personas-journeys.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/03-personas-journeys.md) | User personas + user journeys                |
| 04 | [04-information-architecture.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/04-information-architecture.md) | Site map, page hierarchy            |
| 05 | [05-ux-wireframes.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/05-ux-wireframes.md) | UI/UX spec + wireframe descriptions            |
| 06 | [06-component-hierarchy.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/06-component-hierarchy.md) | Component tree per major page              |
| 07 | [07-frontend-architecture.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/07-frontend-architecture.md) | Frontend architecture + state management |
| 08 | [08-backend-architecture.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/08-backend-architecture.md) | Backend architecture + folder structure    |
| 09 | [09-database-schema.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/09-database-schema.md) | Full schema + ER diagram                       |
| 10 | [10-api-design.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/10-api-design.md) | Full REST API design                                   |
| 11 | [11-auth-flow.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/11-auth-flow.md)   | Authentication flow                                    |
| 12 | [12-disposal-session-flow.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/12-disposal-session-flow.md) | Disposal session + end-to-end flow         |
| 13 | [13-awareness-engine-integration.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/13-awareness-engine-integration.md) | Awareness Engine contract    |
| 14 | [14-admin-console.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/14-admin-console.md) | Admin Console design                             |
| 15 | [15-design-system.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/15-design-system.md) | Design system, animations, responsive rules    |
| 16 | [16-deployment-architecture.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/16-deployment-architecture.md) | Deployment architecture              |
| 17 | [17-security.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/17-security.md)     | Security design                                        |
| 18 | [18-roadmap.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/18-roadmap.md)       | Future roadmap (V2+)                                   |

---

## Shared Enums

All enums are defined **exclusively here**. Every other spec file references these by name (e.g., "see `UserRole` enum in 00-index.md") and **must not redefine** them.

### `UserRole`

| Value              | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `STUDENT`          | Enrolled university student, has SAP ID                                     |
| `FACULTY`          | University faculty/staff member, has SAP ID                                 |
| `EXTERNAL_VISITOR` | Non-campus visitor, no SAP ID, excluded from campus-specific leaderboards   |
| `ADMIN`            | Platform administrator; never self-selectable at signup, granted by an existing admin |

### `AuthProvider`

| Value              | V1 Status   | Description                              |
| ------------------ | ----------- | ---------------------------------------- |
| `EMAIL_PASSWORD`   | Implemented | Standard email + password authentication |
| `GOOGLE_OAUTH`     | Stub only   | Google OAuth 2.0 (V2)                    |
| `UNIVERSITY_SSO`   | Stub only   | SAML/OIDC university SSO (V2)            |
| `OTP`              | Stub only   | One-time password via SMS/email (V2)     |

### `BinStatus`

| Value         | Description                                    |
| ------------- | ---------------------------------------------- |
| `ACTIVE`      | Bin is operational and accepting sessions       |
| `INACTIVE`    | Bin is decommissioned or not yet deployed       |
| `MAINTENANCE` | Bin is temporarily offline for maintenance      |

### `SessionStatus`

| Value            | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `WAITING`        | Session created, waiting for user to deposit bottle (60s countdown) |
| `PROCESSING`     | Awareness Engine has detected activity and is analyzing             |
| `VERIFIED`       | Disposal confirmed with confidence ≥ 0.85                          |
| `FAILED`         | Disposal rejected with confidence < 0.5                            |
| `MANUAL_REVIEW`  | Confidence between 0.5 and 0.85, awaiting admin review             |
| `EXPIRED`        | Timeout — no disposal detected or no engine response               |

### `VerificationResult`

| Value            | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| `VERIFIED`       | Awareness Engine confirms plastic bottle disposal (confidence ≥ 0.85) |
| `FAILED`         | Awareness Engine rejects disposal (confidence < 0.5)                  |
| `MANUAL_REVIEW`  | Borderline confidence (0.5–0.85), needs admin decision                |

### `CameraStatus`

| Value      | Description                                            |
| ---------- | ------------------------------------------------------ |
| `ONLINE`   | Camera reported a heartbeat within the last 5 minutes  |
| `OFFLINE`  | No heartbeat for > 10 minutes                          |
| `DEGRADED` | Heartbeat received but camera reported errors/warnings |

### `RedemptionStatus`

| Value       | Description                                |
| ----------- | ------------------------------------------ |
| `PENDING`   | Redemption request submitted, awaiting fulfillment |
| `FULFILLED` | Reward delivered to user                    |
| `CANCELLED` | Redemption cancelled (by admin or system)   |

### `TransactionType`

| Value             | Description                                        |
| ----------------- | -------------------------------------------------- |
| `AWARD`           | Points awarded for a verified disposal              |
| `REDEMPTION`      | Points deducted for reward redemption               |
| `ADJUSTMENT`      | Manual admin adjustment (positive or negative)      |
| `REVERSAL`        | Offsetting entry to correct a prior transaction     |

### `WasteType`

| Value            | V1 Status   | Description      |
| ---------------- | ----------- | ---------------- |
| `PLASTIC_BOTTLE` | Active      | Plastic bottles   |
| `CAN`            | V2+         | Aluminum cans     |
| `PAPER`          | V2+         | Paper products    |
| `CARDBOARD`      | V2+         | Cardboard         |
| `FOOD_WASTE`     | V2+         | Organic food waste|

### `AchievementKey`

| Value              | Unlock Threshold                | Repeatable |
| ------------------ | ------------------------------- | ---------- |
| `FIRST_BOTTLE`     | 1 verified disposal             | No         |
| `BOTTLES_10`       | 10 verified disposals           | No         |
| `BOTTLES_50`       | 50 verified disposals           | No         |
| `BOTTLES_100`      | 100 verified disposals          | No         |
| `ECO_BEGINNER`     | 5 verified disposals            | No         |
| `PLASTIC_HERO`     | 25 verified disposals           | No         |
| `GREEN_GUARDIAN`    | 75 verified disposals           | No         |
| `CAMPUS_CHAMPION`  | #1 on any weekly leaderboard    | No         |
| `ECO_LEGEND`       | 200 verified disposals          | No         |

### `ManualReviewAction`

| Value      | Description                                      |
| ---------- | ------------------------------------------------ |
| `APPROVE`  | Admin confirms the disposal as valid              |
| `REJECT`   | Admin rejects the disposal                        |

### `ErrorCode`

| Code                      | HTTP Status | Description                                              |
| ------------------------- | ----------- | -------------------------------------------------------- |
| `VALIDATION_ERROR`        | 400         | Request body/params failed validation                     |
| `INVALID_CREDENTIALS`     | 401         | Email or password incorrect                               |
| `TOKEN_EXPIRED`           | 401         | JWT access token has expired                              |
| `TOKEN_INVALID`           | 401         | JWT is malformed or signature invalid                     |
| `REFRESH_TOKEN_EXPIRED`   | 401         | Refresh token has expired                                 |
| `UNAUTHORIZED`            | 401         | Authentication required but not provided                  |
| `FORBIDDEN`               | 403         | Authenticated but insufficient permissions                |
| `USER_NOT_FOUND`          | 404         | User ID does not exist                                    |
| `BIN_NOT_FOUND`           | 404         | Bin code does not exist                                   |
| `SESSION_NOT_FOUND`       | 404         | Disposal session ID does not exist                        |
| `REWARD_NOT_FOUND`        | 404         | Reward ID does not exist                                  |
| `BIN_INACTIVE`            | 409         | Bin exists but is not in `ACTIVE` status                  |
| `BIN_BUSY`                | 409         | Bin already has an active session (WAITING/PROCESSING)    |
| `SESSION_EXPIRED`         | 410         | Session has expired and can no longer be used             |
| `INSUFFICIENT_POINTS`     | 422         | User does not have enough points for redemption           |
| `REWARD_OUT_OF_STOCK`     | 422         | Reward has no remaining inventory                         |
| `REWARD_ALREADY_REDEEMED` | 422         | One-per-user reward already redeemed by this user         |
| `REWARD_ALREADY_GRANTED`  | 409         | Points already awarded for this session                   |
| `RATE_LIMIT_EXCEEDED`     | 429         | User exceeded max sessions/hour or request rate limit     |
| `DAILY_LIMIT_EXCEEDED`    | 429         | User exceeded max sessions/day                            |
| `DUPLICATE_EVENT`         | 409         | Waste event for this session already processed            |
| `INVALID_SIGNATURE`       | 401         | HMAC signature on webhook is invalid                      |
| `EMAIL_ALREADY_EXISTS`    | 409         | Registration email already in use                         |
| `SAP_ID_ALREADY_LINKED`   | 409         | SAP ID already linked to another user                     |
| `INTERNAL_ERROR`          | 500         | Unexpected server error                                   |

### `LeaderboardSegment`

| Value       | Description                                        |
| ----------- | -------------------------------------------------- |
| `OVERALL`   | All users (Students + Faculty + External Visitors)  |
| `STUDENTS`  | Students only                                       |
| `FACULTY`   | Faculty only                                        |
| `VISITORS`  | External Visitors only                              |

### `LeaderboardPeriod`

| Value      | Description       |
| ---------- | ----------------- |
| `WEEKLY`   | Current week       |
| `MONTHLY`  | Current month      |
| `ALL_TIME` | All time           |

---

## Standard Response Envelope

All API responses use this envelope:

```json
{
  "data": "<payload or array>",
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "next_cursor": "abc123"
  },
  "error": {
    "code": "ERROR_CODE_ENUM_VALUE",
    "message": "Human-readable explanation",
    "details": {}
  }
}
```

- On success: `data` is populated, `error` is `null`.
- On error: `data` is `null`, `error` is populated.
- `meta` is present only on paginated list endpoints.
- Pagination uses **cursor-based pagination** (decision logged below).

---

## Assumptions & Resolved Ambiguities

Every time the source brief was ambiguous, the resolution is logged here. These are **design defaults**, not guesses — each is the smallest reasonable decision.

| # | Ambiguity | Resolution | Rationale |
|---|-----------|-----------|-----------|
| A1 | **SAP ID meaning** | Assumed to be the university's SAP-ERP-issued enrollment/employee ID, common at Indian institutions. Treated as an opaque string (non-empty, max 50 chars), stored in `sap_profiles`, never used as a login credential. | The brief referenced "SAP ID" without definition; this is the most common interpretation at Indian universities. |
| A2 | **Email verification method** | Email verification via a **confirmation link** (signed JWT token in URL, 24h expiry), not OTP. | Confirmation links are more standard for web-only V1; OTP is better suited for mobile which is V2. |
| A3 | **Password complexity rules** | Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character (`!@#$%^&*()-_+=`). | Industry-standard baseline that balances security and usability. |
| A4 | **Pagination style** | Cursor-based pagination using an opaque `next_cursor` token. | Cursor pagination performs better at scale than offset-based and doesn't suffer from row-shift issues on inserts. |
| A5 | **Real-time updates mechanism** | **Server-Sent Events (SSE)** for dashboard and session live updates, not WebSocket. | SSE is simpler, unidirectional (server→client, which matches our need), works through HTTP/2, requires less infrastructure, and auto-reconnects. WebSocket is overkill when the client never sends data over the real-time channel. |
| A6 | **External Visitors on leaderboards** | External Visitors appear in a separate `VISITORS` leaderboard segment and the `OVERALL` segment, but are **excluded** from `STUDENTS` and `FACULTY` segments. | Mixing visitors with campus members distorts campus-specific competition. A separate segment still motivates visitors. |
| A7 | **State management (frontend)** | **Zustand** for client/UI state + **TanStack Query (React Query)** for server state/caching. | Zustand is lightweight, minimal boilerplate, TypeScript-native. TanStack Query handles caching, deduplication, and background refetching for API data. This separation avoids conflating server cache with UI state. |
| A8 | **Leaderboard computation** | Leaderboards are **precomputed** via a scheduled job (every 15 minutes) into a `leaderboard_snapshots` table, not live-queried. | Live-querying rankings on every request is expensive. Precomputing handles read-heavy load efficiently. 15-minute staleness is acceptable for leaderboards. |
| A9 | **Password hashing algorithm** | **Argon2id** via `passlib` (with bcrypt as fallback). | Argon2id is the preferred choice per the spec; memory-hard algorithms resist GPU/ASIC attacks better than bcrypt. |
| A10 | **Session grace window** | 90 seconds from session `start_time`. If the Awareness Engine hasn't responded by then, the session transitions to `EXPIRED`. | The brief suggested 90s as an example; this provides 30s buffer beyond the 60s user-facing countdown for engine processing latency. |
| A11 | **Rate limit: max sessions per user per hour** | Default: **10** (configurable via admin settings). | Matches the brief's suggestion. Prevents QR code photo-sharing abuse while allowing legitimate high-frequency users. |
| A12 | **Rate limit: max sessions per user per day** | Default: **20** (configurable via admin settings). | Matches the brief's suggestion. |
| A13 | **Anomaly detection threshold** | Flag (don't auto-block) users whose verified events in a rolling 7-day window exceed the **95th percentile** of all users' activity in the same window. | Per the brief; flagging rather than blocking avoids punishing legitimate power users. |
| A14 | **Environmental impact constants** | 1 plastic bottle = ~18g plastic = ~54g CO₂e avoided (based on PET lifecycle analysis averages). Configurable in admin settings. | Published PET recycling LCA data. Displayed as "~Xg plastic waste prevented" and "~Xg CO₂e avoided." |
| A15 | **Live statistics cache refresh** | Materialized view or cache entry refreshed every **5 minutes**. | Balances freshness with DB load for public-facing read-heavy endpoint. |
| A16 | **Admin sub-roles** | V1 uses a **single `ADMIN` role** with full access to all admin console sections. Sub-roles (e.g., `ADMIN_VIEWER`, `ADMIN_MODERATOR`) are deferred to V2. | Keeps V1 simple. The `UserRole` enum and RBAC middleware are designed to accommodate additional roles without schema changes. |
| A17 | **Camera heartbeat intervals** | Cameras send heartbeat every **2 minutes**. `ONLINE` = heartbeat within last 5 min. `OFFLINE` = no heartbeat for > 10 min. `DEGRADED` = heartbeat received but with error flags. | Standard IoT monitoring intervals. |
| A18 | **Confidence thresholds source** | Stored in an `admin_settings` table (key-value), not hardcoded. Keys: `confidence_threshold_verified` (default 0.85), `confidence_threshold_manual_review` (default 0.50). | The brief explicitly requires these to be admin-configurable, not hardcoded. |
| A19 | **Reward one-per-user restriction** | Each reward has a boolean `one_per_user` flag. If true, a user can redeem it only once. Enforced by a DB unique constraint on `(user_id, reward_id)` when applicable. | Common pattern for promotional rewards; avoids abuse. |
| A20 | **Password reset token** | Signed JWT with 1-hour expiry, single-use (invalidated on use via a `password_reset_tokens` table or a `password_changed_at` timestamp check). | Standard secure password reset flow. |
| A21 | **QR code content format** | Plain text containing only the bin code (e.g., `ECOP-BIN-LIBRARY`). V2 will add HMAC-signed rotating payloads. | Simplest V1 approach per the brief; spoofing risk is mitigated by rate limits. |

---

## Open Questions for the Human

These items require **business or legal input** and cannot be resolved by design alone:

| # | Question | Impact | Default If Unanswered |
|---|----------|--------|-----------------------|
| Q1 | **What is the real point-to-reward exchange rate?** E.g., how many EcoP Points for a coffee voucher, a merchandise item? | Determines reward store pricing. | Use placeholder values (e.g., 100 points = small reward, 500 = medium, 1000 = large). |
| Q2 | **What specific rewards will be offered at launch?** Physical items, digital vouchers, campus perks? | Determines reward catalogue seed data. | Spec defines the framework; seed data TBD. |
| Q3 | **Legal data retention duration?** How long must disposal session data, user data, and transaction logs be retained? | Affects database archival strategy and privacy policy. | Default to 3 years, with a note to verify with legal counsel. |
| Q4 | **Actual bin locations and codes?** How many bins at launch, and their campus locations? | Determines seed data for bins table. | Use example codes (ECOP-BIN-001 through ECOP-BIN-005) as placeholders. |
| Q5 | **University branding requirements?** Does the university require co-branding, specific logos, or approval for the UI? | Affects design system and landing page. | Design as EcoP-branded only; co-branding can be layered on. |
| Q6 | **GDPR/Indian DPDP Act compliance requirements?** Specific consent flows, data processing agreements, DPO requirements? | Affects registration flow and privacy policy content. | Design with consent checkboxes at registration; actual legal text TBD. |
| Q7 | **Camera hardware model and deployment details?** Specific camera models at bins, connectivity (WiFi/Ethernet/LTE), edge compute capability? | Affects Awareness Engine deployment architecture. | Assume commodity IP camera + edge compute device (e.g., Jetson Nano or equivalent). |
| Q8 | **Anomaly flagging notification channel?** Should admin be notified via email, in-app alert, or both when a user is flagged? | Affects admin notification system design. | In-app admin console alert only for V1. |

---

## Conventions Used Across All Spec Files

- **Database entities** → Markdown tables: Column | Type | Constraints | Notes
- **REST endpoints** → Markdown tables: Method | Path | Auth Required | Request Body | Response | Error Codes
- **Flows and state machines** → Mermaid diagrams (`sequenceDiagram`, `stateDiagram-v2`, `erDiagram`)
- **Folder/file layouts** → Fenced text trees
- **Enum references** → Always reference by name (e.g., "`SessionStatus` enum") pointing back to this file
- **Timestamps** → ISO 8601 UTC (`2026-07-28T10:00:00Z`)
- **IDs** → UUIDv4 unless stated otherwise
- **Monetary/point values** → Integer (no decimals for EcoP Points)
