# 02 — Functional & Non-Functional Requirements

> **Spec file:** `02-requirements.md`  
> **Enums referenced:** `UserRole`, `SessionStatus`, `BinStatus`, `ErrorCode`, `AchievementKey`, `LeaderboardSegment`, `LeaderboardPeriod`, `TransactionType`, `RedemptionStatus` — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)

---

## 1. Functional Requirements

### FR-1: User Registration & Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Users register with Full Name, Email, and Password | Must |
| FR-1.2 | Email verified via confirmation link (signed JWT, 24h expiry) | Must |
| FR-1.3 | Password must meet complexity: ≥8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char | Must |
| FR-1.4 | Password hashed with Argon2id (bcrypt fallback) | Must |
| FR-1.5 | Login returns JWT access token (15 min expiry) + refresh token (7 day, httpOnly cookie) | Must |
| FR-1.6 | Refresh token rotated on each use; old token invalidated | Must |
| FR-1.7 | First login triggers onboarding: role selection (Student/Faculty/External Visitor) | Must |
| FR-1.8 | Student/Faculty role prompts for SAP ID, stored in `sap_profiles` | Must |
| FR-1.9 | Password reset via emailed link (signed JWT, 1h expiry, single-use) | Must |
| FR-1.10 | `auth_providers` table supports future OAuth/SSO/OTP providers without schema changes | Must |
| FR-1.11 | `ADMIN` role never self-selectable; granted by existing admin | Must |

### FR-2: Bin Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Each bin has a unique code (e.g., `ECOP-BIN-LIBRARY`) and a `BinStatus` | Must |
| FR-2.2 | QR code encodes only the bin code, never a user identifier | Must |
| FR-2.3 | Scanning a QR resolves to a bin lookup; non-existent or non-`ACTIVE` bins return an error | Must |
| FR-2.4 | Admins can create, update, activate, deactivate, and set bins to maintenance | Must |
| FR-2.5 | Bins store optional `latitude`/`longitude` for future geofencing (nullable in V1) | Should |

### FR-3: Disposal Sessions

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | QR scan creates a `disposal_session` with `SessionStatus.WAITING` and a 60s countdown | Must |
| FR-3.2 | A bin can have at most one session in `WAITING` or `PROCESSING` at a time; second scan returns `BIN_BUSY` (409) with remaining seconds | Must |
| FR-3.3 | Session follows the full state machine: `WAITING → PROCESSING → VERIFIED/FAILED/MANUAL_REVIEW`, `WAITING → EXPIRED`, `PROCESSING → EXPIRED` | Must |
| FR-3.4 | `EXPIRED` transition occurs at 90s from `start_time` if no Engine response | Must |
| FR-3.5 | UI displays live countdown and status via SSE | Must |
| FR-3.6 | `VERIFIED` triggers celebration animation and instant point award | Must |
| FR-3.7 | Exactly one reward per session, enforced by DB unique constraint on `waste_events.session_id` | Must |
| FR-3.8 | Rate limited: max 10 sessions/user/hour, max 20/day (configurable) | Must |

### FR-4: Awareness Engine Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Engine sends structured JSON payload to `POST /api/v1/waste-events` (HMAC-SHA256 signed) | Must |
| FR-4.2 | Payload contains: `session_id`, `bin_id`, `timestamp`, `confidence`, `verification_result` | Must |
| FR-4.3 | Confidence ≥ 0.85 → `VERIFIED`; 0.5–0.85 → `MANUAL_REVIEW`; < 0.5 → `FAILED` | Must |
| FR-4.4 | Thresholds stored in `admin_settings`, editable by admin | Must |
| FR-4.5 | Idempotent on `session_id`; duplicate events do not double-award points | Must |
| FR-4.6 | Retry policy: 3 retries, exponential backoff, then dead-letter to `failed_events` table | Must |
| FR-4.7 | Engine never performs face recognition, never stores identifiable imagery, never transmits images | Must |

### FR-5: Points & Transactions

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Points awarded per `point_rules` table; V1: `PLASTIC_BOTTLE` = 10 points | Must |
| FR-5.2 | `ecop_transactions` ledger is append-only; past transactions never mutated | Must |
| FR-5.3 | Corrections use offsetting transactions (`REVERSAL` type) | Must |
| FR-5.4 | Admin can edit `points_per_event` in `point_rules`; changes apply prospectively | Must |
| FR-5.5 | User's current balance derived from `SUM(amount)` of their transactions (or a cached balance column updated transactionally) | Must |

### FR-6: Reward Store

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Rewards have: image, description, required points, quantity (or unlimited), `one_per_user` flag | Must |
| FR-6.2 | Redemption deducts points and creates a `reward_redemptions` record with `RedemptionStatus.PENDING` | Must |
| FR-6.3 | Redemption fails with appropriate `ErrorCode` if: insufficient points, out of stock, or already redeemed (when `one_per_user`) | Must |
| FR-6.4 | Admin manages reward catalogue: create, edit, deactivate rewards | Must |
| FR-6.5 | Admin can update `RedemptionStatus` to `FULFILLED` or `CANCELLED` | Must |

### FR-7: Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Dashboard displays: current points, total bottles recycled, weekly/monthly progress | Must |
| FR-7.2 | Environmental impact widget: plastic waste prevented (g), CO₂e avoided (g) | Must |
| FR-7.3 | Impact constants: 1 bottle = 18g plastic, 54g CO₂e (configurable in `admin_settings`) | Must |
| FR-7.4 | Current rank, achievements, recent disposal history | Must |
| FR-7.5 | Active disposal session with live status (SSE) | Must |
| FR-7.6 | Reward progress toward next redeemable item | Should |
| FR-7.7 | Leaderboard preview (top 5 of user's segment) | Should |
| FR-7.8 | Nearby EcoP Bins (V1: static list; V2: map view) | Should |

### FR-8: Leaderboards

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8.1 | Segments: `OVERALL`, `STUDENTS`, `FACULTY`, `VISITORS` (per `LeaderboardSegment` enum) | Must |
| FR-8.2 | Periods: `WEEKLY`, `MONTHLY`, `ALL_TIME` (per `LeaderboardPeriod` enum) | Must |
| FR-8.3 | External Visitors excluded from `STUDENTS` and `FACULTY` segments | Must |
| FR-8.4 | Logged-in user's row always visible (pinned, even if outside top N) | Must |
| FR-8.5 | Precomputed every 15 minutes into `leaderboard_snapshots` table | Must |

### FR-9: Achievements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-9.1 | Achievements unlock per thresholds in `AchievementKey` enum (all one-time, non-repeatable) | Must |
| FR-9.2 | Achievement check runs after every `VERIFIED` session | Must |
| FR-9.3 | Unlock triggers animation in UI | Must |
| FR-9.4 | Achievements stored in `user_achievements` with `unlocked_at` timestamp | Must |

### FR-10: Landing Page

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10.1 | Sections: Hero, How EcoP Works, About the AI, Environmental Impact, Rewards Preview, Leaderboard Preview, Live Statistics, CTA, Footer | Must |
| FR-10.2 | Live statistics: total bottles, plastic prevented, CO₂ reduced, active users, daily/weekly/monthly collections | Must |
| FR-10.3 | Statistics cached and refreshed every 5 minutes (materialized view or application cache) | Must |

### FR-11: Admin Console

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-11.1 | Manage: Users, Rewards, Point Values, Bins, Cameras, Waste Events, Disposal Sessions, Achievements, Analytics | Must |
| FR-11.2 | Manual review queue for `MANUAL_REVIEW` sessions (approve/reject) | Must |
| FR-11.3 | Camera health monitoring (per-camera `CameraStatus`, last heartbeat) | Must |
| FR-11.4 | User anomaly flags (users with activity > 95th percentile in 7-day window) | Must |
| FR-11.5 | Gated by `ADMIN` role (single admin role for V1) | Must |
| FR-11.6 | Failed events table (dead-lettered webhook deliveries) visible in console | Must |

### FR-12: Anti-Fraud

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-12.1 | Rate limit: max N sessions/user/hour (configurable, default 10) | Must |
| FR-12.2 | Rate limit: max N sessions/user/day (configurable, default 20) | Must |
| FR-12.3 | Anomaly flagging: users with verified events > 95th percentile over 7-day rolling window | Must |
| FR-12.4 | Flagged users surfaced in admin console for review (not auto-blocked) | Must |
| FR-12.5 | Geofencing stub: `bins` table stores lat/lng; backend middleware hook for V2 GPS comparison | Should |

---

## 2. Non-Functional Requirements

| ID | Requirement | Concrete Criterion |
|----|-------------|-------------------|
| NFR-1 | **Scalable** | Stateless API instances behind a load balancer; session and rate-limit state in Redis, not in-process. Horizontal scaling by adding API instances. |
| NFR-2 | **Modular** | Backend organized by domain module (auth, sessions, rewards, admin), not by technical layer (routes, models, services in flat directories). Each module encapsulates its own routes, services, and schemas. |
| NFR-3 | **Production-ready** | Structured JSON logging, health check endpoint (`GET /api/v1/health`), graceful shutdown, database connection pooling, environment-based configuration. |
| NFR-4 | **Maintainable** | TypeScript strict mode on frontend; Pydantic v2 models with full type hints on backend; comprehensive API documentation via OpenAPI/Swagger auto-generated from FastAPI. |
| NFR-5 | **Responsive** | UI functional and visually coherent from 320px to 2560px viewport width. See breakpoints in [15-design-system.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/15-design-system.md). |
| NFR-6 | **Accessible** | WCAG AA compliance: all interactive elements keyboard-navigable, minimum 4.5:1 contrast ratio for text, proper ARIA labels, focus indicators. |
| NFR-7 | **Privacy-first** | No facial recognition, no user-identifying imagery stored or transmitted, no PII in logs, privacy philosophy enforced at architecture level. |
| NFR-8 | **Cloud-ready** | Dockerized services, environment-variable configuration, no filesystem dependencies for state. Deployable to any container orchestration platform (K8s, ECS, Cloud Run). |
| NFR-9 | **Future-mobile-ready** | API designed so a native mobile app requires zero new backend endpoints. All state and business logic in the backend, not in the frontend. |
| NFR-10 | **Performance** | API p95 response time < 200ms for non-aggregation endpoints. Landing page Time to Interactive < 3s on 4G. |
| NFR-11 | **Reliability** | 99.5% uptime target. Disposal sessions degrade gracefully if Awareness Engine is temporarily unreachable (session expires, user notified, no data loss). |
| NFR-12 | **Auditability** | Append-only transaction ledger. All admin actions logged with actor, timestamp, and before/after values. |
