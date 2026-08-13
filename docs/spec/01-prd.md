# 01 — Product Requirements Document (PRD)

> **Spec file:** `01-prd.md`  
> **Enums referenced:** `UserRole`, `WasteType`, `BinStatus`, `SessionStatus` — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)

---

## 1. Product Identity

| Field    | Value                                               |
| -------- | --------------------------------------------------- |
| Name     | **EcoP**                                            |
| Tagline  | *Rewarding Sustainable Behaviour Through AI*        |
| Version  | V1                                                  |

## 2. Mission Statement

EcoP is an AI-powered sustainability platform that rewards responsible plastic-bottle disposal using computer vision, behavioral nudges, and gamification. By making recycling immediately rewarding and socially visible, EcoP transforms passive campus waste disposal into an engaging, measurable, and impactful activity.

## 3. Problem Statement

University campuses generate significant plastic bottle waste. Existing recycling infrastructure provides no feedback loop: students dispose of bottles with no visibility into impact, no reward, and no social incentive. This leads to low recycling rates, contaminated waste streams, and missed environmental targets.

**EcoP solves this by:**
1. Verifying correct disposal via AI-powered computer vision (no human identification).
2. Rewarding verified disposals with redeemable points.
3. Creating social engagement via leaderboards, achievements, and visible impact metrics.

## 4. V1 Scope

### 4.1 In Scope

- **Waste type:** Plastic bottles only (single `WasteType`: `PLASTIC_BOTTLE`).
- **Platform:** Responsive web application (no native mobile app).
- **User types:** Student, Faculty, External Visitor, Admin (per `UserRole` enum).
- **Authentication:** Email + password only (`EMAIL_PASSWORD` provider).
- **Disposal flow:** QR scan → session → AI verification → points.
- **Rewards:** Point-based reward store with admin-managed catalogue.
- **Gamification:** Leaderboards (segmented) + achievement badges.
- **Admin console:** Full management of users, bins, rewards, sessions, analytics.
- **Awareness Engine:** Computer vision service for plastic bottle detection and disposal verification.

### 4.2 Non-Goals (Explicitly Out of Scope for V1)

These items are **not designed for** in V1. The architecture leaves clean extension points for them.

| Non-Goal | Target Version | Extension Point |
| -------- | -------------- | --------------- |
| Cans, paper, wrappers, cardboard, food waste | V2+ | `WasteType` enum + `point_rules` table support multiple waste types |
| Native mobile app (iOS/Android) | V2+ | API designed to be consumed by mobile with zero backend changes |
| Payment processing / real-money rewards | V2+ | `reward_redemptions` table has a `fulfillment_type` column (stub) |
| Facial recognition or user-identifying vision | **Permanently out of scope** | Hard constraint in Awareness Engine contract |
| Google OAuth / University SSO / OTP login | V2+ | `auth_providers` table already designed for multiple providers |
| Rotating signed QR codes | V2 | Bin QR content format designed to accept optional signature field |
| Map view of bins | V2+ | Bins store `latitude`/`longitude` (nullable in V1) |
| Sub-admin roles (viewer, moderator) | V2+ | `UserRole` enum extensible; RBAC middleware supports role arrays |

## 5. Privacy Philosophy

> **Non-negotiable. This text must be preserved verbatim in all downstream implementation documents.**

1. **The Awareness Engine never performs face recognition**, never stores images or video containing identifiable people beyond the minimum transient buffer needed to run detection, and **never transmits imagery to the backend** — only the structured Waste Event payload defined in [13-awareness-engine-integration.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/13-awareness-engine-integration.md).
2. **The website/backend, not the AI, owns identity and rewards.**
3. **A verified disposal event is linked to a user only through the Disposal Session the user created by scanning a QR code** — the AI never receives or infers who the user is.

## 6. Three-System Architecture

EcoP is composed of three independent systems, each in its own repository/service:

```
┌─────────────────────────────────────────────────────────┐
│                    EcoP Platform                         │
│          (Next.js responsive web application)            │
│    Future mobile app consumes the same API               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (REST API)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  EcoP Backend API                        │
│       (FastAPI — source of truth for all data)           │
│   Auth, Sessions, Points, Rewards, Admin                 │
└──────────────┬────────────────────────────────┬─────────┘
               │ HTTPS Webhook                   │
               │ (POST /api/v1/waste-events)     │
               ▼                                 │
┌──────────────────────────────┐                 │
│   EcoP Awareness Engine      │                 │
│  (CV service at the bin/edge)│                 │
│  Bottle detection + disposal │                 │
│  verification only           │                 │
│  NO person identification    │                 │
│  NO image transmission       │                 │
└──────────────────────────────┘                 │
                                                 │
                              SSE (real-time)────┘
                              (session updates to frontend)
```

| System | Responsibility | Communicates With |
| ------ | ------------- | ---------------- |
| **EcoP Platform** | User-facing web UI, renders dashboard, handles QR scanning, displays leaderboards/rewards | Backend API (REST + SSE) |
| **EcoP Backend API** | Source of truth: auth, sessions, points ledger, rewards, admin. Exposes REST API + SSE. | Platform (serves API), Awareness Engine (receives webhook) |
| **EcoP Awareness Engine** | Computer vision at the bin: detects bottles, tracks disposal behavior, sends verification result. Runs on edge hardware. | Backend API (sends POST webhook) |

## 7. Success Metrics (V1)

| Metric | Target | Measurement |
| ------ | ------ | ----------- |
| Registered users (first 3 months) | 500+ | `users` table count |
| Daily active disposers | 50+ | Unique `user_id` in `disposal_sessions` per day |
| Disposal verification accuracy | ≥ 90% true positive rate | `waste_events` verified vs. manual-review outcomes |
| Average session completion time | < 30 seconds | `disposal_sessions.end_time - start_time` |
| Reward redemption rate | ≥ 20% of users with sufficient points | `reward_redemptions` / eligible users |
| System uptime | ≥ 99.5% | Monitoring |

## 8. Key User Flows (Summary)

Detailed flows are in [12-disposal-session-flow.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/12-disposal-session-flow.md). Summary:

1. **Registration** → Email + password → email verification → role selection → optional SAP ID → dashboard.
2. **Disposal** → Scan QR → session starts (60s countdown) → dispose bottle → AI verifies → points awarded → celebration animation.
3. **Reward redemption** → Browse store → select reward → confirm → points deducted → redemption recorded.
4. **Leaderboard** → View rankings by segment/period → find own rank → social motivation.
5. **Admin** → Manage bins, rewards, users, review flagged events, monitor cameras.

## 9. Constraints

| Constraint | Detail |
| ---------- | ------ |
| Single active session per bin | A bin can have at most one session in `WAITING` or `PROCESSING` state |
| Rate limits | Max 10 sessions/user/hour, max 20 sessions/user/day (configurable) |
| Points immutability | Historical transactions never mutated; corrections via offsetting entries |
| Privacy | No facial recognition, no user-identifying imagery, no image transmission to backend |
| QR spoofing (known V1 risk) | Mitigated by rate limiting; V2 moves to rotating signed QR tokens |
