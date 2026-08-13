# 18 — Future Roadmap

> **Spec file:** `18-roadmap.md`  
> **Current scope (V1):** See [01-prd.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/01-prd.md) §4

---

## 1. Release Timeline (Indicative)

| Version | Target | Theme |
|---------|--------|-------|
| **V1.0** | Current | Core platform — plastic bottles, web-only, email auth |
| **V1.1** | V1 + 2 months | Polish, bug fixes, performance optimization |
| **V2.0** | V1 + 6 months | Multi-waste, rotating QR, OAuth/SSO |
| **V2.1** | V2 + 3 months | Native mobile app |
| **V3.0** | V2 + 6 months | Advanced analytics, gamification v2, campus ecosystem integration |

---

## 2. V1.1 — Polish & Hardening

| Feature | Description | Extension Point |
|---------|-------------|----------------|
| Performance optimization | Optimize slow queries (leaderboards, analytics), add DB indexes | Query profiling in production |
| Error handling refinement | Improve error messages, add retry UI for failed sessions | `ErrorCode` enum (add new codes) |
| Email templates | Branded HTML email templates for verification, password reset, notifications | Email service module |
| Notification system (in-app) | Toast notifications for manual review outcomes, achievement unlocks when offline | SSE events + notification store |
| PWA support | Service worker for offline landing page, push notifications | Next.js PWA plugin |
| Accessibility audit | Full WCAG AA audit and remediation | Design system |

---

## 3. V2.0 — Multi-Waste & Enhanced Security

### 3.1 Additional Waste Categories

| Feature | Description | Extension Point |
|---------|-------------|----------------|
| Cans | Add `CAN` to `WasteType` enum, new `point_rules` row | `WasteType` enum, `point_rules` table |
| Paper | Add `PAPER` to `WasteType` enum | Same |
| Cardboard | Add `CARDBOARD` to `WasteType` enum | Same |
| Food waste | Add `FOOD_WASTE` to `WasteType` enum (different verification model) | Same + new Engine model |
| Multi-type bins | Allow bins to accept multiple waste types, detection model classifies type | `bins` table: add `accepted_types` column |
| Waste event type | Add `waste_type` to `waste_events` payload | `waste_events` table: add `waste_type` column |

**Schema impact:** The `waste_events` table gains a `waste_type` column. The `point_rules` table already supports multiple waste types — each type gets its own row with its own `points_per_event`. The Awareness Engine's CV model is retrained or extended for multi-class detection.

### 3.2 Rotating Signed QR Codes

| Feature | Description | Extension Point |
|---------|-------------|----------------|
| Rotating QR tokens | QR code content changes every N minutes (e.g., 5 min). Payload: `{bin_code, timestamp, signature}` | Bin hardware: e-ink/small display at the bin |
| HMAC-signed QR payload | `signature = HMAC-SHA256(bin_secret, bin_code + timestamp)` | `bins` table: add `qr_secret` column |
| Backend verification | On session creation, verify QR signature and timestamp freshness | `sessions` service: add signature verification |
| QR display hardware | Small e-ink tag or LED display at each bin, refreshed by the edge device | Edge device software |

**Known V1 risk mitigated:** V1 uses static QR codes, which can be photographed and shared. V2 rotating codes make off-site scans useless after the rotation window.

### 3.3 OAuth & SSO Authentication

| Feature | Description | Extension Point |
|---------|-------------|----------------|
| Google OAuth 2.0 | "Sign in with Google" on login/register pages | `auth_providers` table, `AuthProvider` enum |
| University SSO (SAML/OIDC) | "Sign in with University" via SAML or OIDC | Same |
| OTP login | One-time password via SMS or email | Same |
| Account linking | Existing users can link additional auth providers to their account | `auth_providers`: multiple rows per user |

**Schema readiness:** The `auth_providers` table is already designed with `(user_id, provider, provider_uid)`. V2 implementation requires:
1. New router handlers for each provider's callback flow.
2. Provider-specific configuration (client ID, client secret, SAML metadata).
3. UI: new buttons on login/register pages (currently shown as disabled/greyed out).

### 3.4 Geofencing

| Feature | Description | Extension Point |
|---------|-------------|----------------|
| User GPS validation | On session creation, compare user's GPS coordinates with bin's lat/lng | `bins` table: `latitude`, `longitude` (already present, nullable) |
| Configurable radius | Admin sets max distance (e.g., 50m) for a valid session | `admin_settings`: add `geofence_radius_meters` |
| Graceful degradation | If user denies GPS permission, session proceeds with a note (not blocked) | Middleware hook |

---

## 4. V2.1 — Native Mobile App

| Feature | Description | Extension Point |
|---------|-------------|----------------|
| iOS app | Native iOS app (Swift/SwiftUI or React Native) | API: zero new endpoints needed (by design) |
| Android app | Native Android app (Kotlin or React Native) | Same |
| Push notifications | Firebase Cloud Messaging for disposal results, achievement unlocks | Backend: push notification service |
| Native QR scanner | Native camera-based QR scanning (faster, more reliable than web) | Same session creation API |
| Biometric auth | Face ID / fingerprint for quick login | New `AuthProvider`: `BIOMETRIC` |
| Offline support | Cache dashboard data, queue session creation for when back online | Local storage + sync |

**API readiness:** The V1 API is designed with mobile in mind:
- All state and logic in the backend (not in the frontend).
- Standard REST API with JSON responses.
- SSE works in native apps via standard HTTP.
- Token-based auth works identically on mobile.
- No web-specific dependencies in the API layer.

---

## 5. V3.0 — Advanced Platform

| Feature | Description |
|---------|-------------|
| **Advanced analytics dashboard** | AI-generated insights, trend predictions, campus sustainability reports |
| **Team/group challenges** | Create teams (dorm, department), compete on group leaderboards |
| **Streak system** | Daily/weekly streaks with bonus points |
| **Social sharing** | Share achievements on social media with generated cards |
| **Campus ecosystem integration** | Integrate with university LMS, campus card system, cafeteria |
| **Real-money rewards** | Partner with local businesses for redeemable vouchers with actual monetary value |
| **Multi-campus** | Support multiple campuses/organizations with tenant isolation |
| **Carbon credit tracking** | Formal carbon credit calculation and reporting |
| **API marketplace** | Public API for third-party integrations |
| **Advanced fraud detection** | ML-based anomaly detection (beyond percentile flagging) |

---

## 6. Technical Debt & Improvements

| Item | Priority | Description |
|------|----------|-------------|
| Database read replicas | High | Route analytics and leaderboard queries to read replicas |
| Caching layer | High | Application-level caching for frequently accessed data (user profiles, rewards) |
| WebSocket upgrade | Medium | Consider WebSocket for bidirectional communication if mobile needs it |
| Event sourcing | Low | Consider event sourcing for the transaction ledger if audit requirements grow |
| GraphQL API | Low | Consider GraphQL for mobile clients if data fetching becomes complex |
| Microservices split | Low | Split auth, rewards, and sessions into separate services if scale demands |

---

## 7. Extension Points Summary

For the implementing agent's reference, these are the **clean extension points** designed into V1 that V2+ features will use:

| Extension Point | V1 State | V2+ Usage |
|----------------|----------|-----------|
| `WasteType` enum | Only `PLASTIC_BOTTLE` | Add new waste types |
| `point_rules` table | One row | Multiple rows per waste type |
| `auth_providers` table | One row per user (`EMAIL_PASSWORD`) | Multiple rows per user for OAuth/SSO/OTP |
| `AuthProvider` enum | Only `EMAIL_PASSWORD` implemented | New providers |
| `bins.latitude/longitude` | Nullable | Geofencing |
| `UserRole` enum | 4 roles | Sub-admin roles |
| QR code content | Plain bin code string | HMAC-signed payload with timestamp |
| `waste_events.waste_type` | Not present (implied `PLASTIC_BOTTLE`) | Explicit waste type per event |
| `admin_settings` | Confidence thresholds, rate limits | Geofence radius, new thresholds |
| SSE events | Session + achievement | Push notification triggers |
| API versioning (`/api/v1/`) | V1 endpoints | V2 prefix for breaking changes |
