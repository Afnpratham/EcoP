# EcoP

EcoP is a responsive sustainability rewards platform for plastic-bottle disposal. Users scan a bin QR code, start a disposal session, let the Awareness Engine verify the bottle disposal, and receive Eco Points that can be tracked on a dashboard, compared on leaderboards, and redeemed for rewards.

The app is built with Next.js, React, TypeScript, Tailwind CSS, Supabase, and Vitest.

## Functionality

- QR/bin disposal sessions with session expiry, cooldowns, and rate limits.
- HMAC-protected Awareness Engine webhook for service-to-service disposal verification.
- Automatic point awards through a Supabase `SECURITY DEFINER` function.
- Append-only transaction ledger for Eco Points.
- Dashboard with points, disposal totals, impact stats, recent activity, and achievements.
- Reward catalogue and redemption flow.
- Leaderboard views for ranking users by Eco Points.
- Authentication-ready registration, login, forgot-password, and profile screens.
- Demo mode backed by `data/demo-store.json` when Supabase is unavailable or no user is signed in.
- Full V1 product, architecture, database, API, security, and deployment specification under `docs/spec`.

## Core Flow

1. A user opens `/ecop/bin/[binId]` after scanning a bin QR code.
2. EcoP creates a pending session through `POST /api/session/start`.
3. The Awareness Engine watches the bin, detects a plastic bottle, and decides whether disposal was correct.
4. The engine calls `POST /api/disposal/verify` with an HMAC signature.
5. EcoP verifies the signature, resolves the pending session, awards points once, and updates the user's dashboard.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- Radix UI primitives
- React Query
- Zod validation
- Vitest

## Getting Started

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Fill in the Supabase and webhook values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AWARENESS_ENGINE_WEBHOOK_SECRET=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

The initial database schema lives in:

```text
supabase/migrations/0001_init.sql
```

Seed data lives in:

```text
supabase/seed.sql
```

The schema creates profiles, bins, sessions, disposals, transactions, rewards, redemptions, achievements, a leaderboard view, row-level security policies, and the `award_points_for_session` function used by the Awareness Engine webhook.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:watch
npm run typecheck
```

## API Routes

- `POST /api/session/start` - starts a pending disposal session for a bin.
- `POST /api/disposal/verify` - HMAC-protected endpoint called by the Awareness Engine.
- `POST /api/disposal-success` - demo/local disposal award endpoint.
- `GET /api/dashboard` - dashboard data.
- `GET /api/leaderboard` - leaderboard data.
- `GET /api/rewards` - reward catalogue.
- `POST /api/reward/redeem` - redeem a reward with Eco Points.

## Awareness Engine Integration

EcoP expects the Awareness Engine to call:

```text
POST /api/disposal/verify
```

The request body contains either a `sessionId` or `binId`, a `result`, a confidence score, and a timestamp. The raw JSON body must be signed with `AWARENESS_ENGINE_WEBHOOK_SECRET` and sent in the `X-Signature` header.

For the matching computer vision service, see the companion repository:

```text
https://github.com/Afnpratham/Awareness-Engine
```

The detailed integration contract is documented in `docs/spec/13-awareness-engine-integration.md`.

## Project Structure

```text
src/app          Next.js pages, layouts, and API routes
src/components   Shared UI, layout, and landing/dashboard components
src/lib          Validation, Supabase clients, HMAC helpers, demo store, utilities
src/types        Database types
supabase         SQL migration and seed data
docs/spec        Product and system specification
data             Local demo-store state
```

## Notes

- `.env.local`, build output, local caches, and `node_modules` are intentionally ignored.
- `data/demo-store.json` is included so the app can show a working demo path without a live Supabase session.
- Real point awards should go through `POST /api/disposal/verify`; the direct demo endpoint is for local demos and hardware integration experiments.
