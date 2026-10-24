# EcoP 2.0

EcoP turns verified bottle disposal and refill actions into a transparent rewards workflow. It pairs a Next.js application with Supabase and a pinned companion Awareness Engine. The release focuses on safe attribution, evidence receipts, human review, reward integrity and a material chain of custody.

## What is included

- Proof of disposal: QR-bound sessions, signed device events, temporal tracking evidence, optional beam/load sensor fusion, replay prevention and device/boot/track deduplication.
- Fair rewards: an append-only points ledger, atomic reward redemption, cancellation refund, operator fulfillment, appeal requests and conflict-of-interest checks for reviewers.
- Recycling traceability: a verified receipt can be assigned once to a collection batch; collection and recycler acceptance require separate operator actions.
- Personal guidance: receipt-based guidance that never treats an uncertain result as a penalty.
- Refill/reuse: separate refill sessions and rewards with daily and rolling limits. Refill activity is never counted as recovered recycling material.
- A responsive user experience: station discovery, action sessions, receipts, appeal/review workspace, reward receipts, privacy settings and an explicit simulation lab.

## Truthful operating modes

`ECOP_DEMO_MODE=true` is an isolated local simulation workspace using sample data. It does not use live Supabase records, device ingestion, cameras or physical sensors. It is visibly labelled and must not be used for real rewards.

When demo mode is disabled, EcoP never converts missing auth, a database failure or unavailable hardware into a successful demo action. A live device event requires a per-device HMAC secret and a matching session, device, bin, time window and track identity.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

For a no-hardware UI walkthrough, set `ECOP_DEMO_MODE=true` in `.env.local`. The browser opens at `http://localhost:3000`.

## Local live AI demonstration

The protected [Live AI Demo](/demo/live) is separate from `/lab`: it streams one real, local Awareness Engine camera pipeline and displays its actual YOLO11n/ByteTrack overlays and events. It is observation-only. It does not call a reward API, create a QR session, or change a balance.

1. Provision the private companion locally and set its `ENGINE_API_KEY` and `MODEL_PATH` in `companion/awareness-engine/.env`.
2. Put the same API key in the ignored root `.env.local` as `ECOP_AWARENESS_ENGINE_API_KEY`, set `ECOP_AWARENESS_ENGINE_URL=http://127.0.0.1:8000`, and set `ECOP_LIVE_DEMO_LOCAL=true` only for local development.
3. Start the engine on loopback with `cd companion/awareness-engine && .venv/bin/python -m uvicorn awareness_engine.api.main:app --host 127.0.0.1 --port 8000`.
4. Start EcoP with `ECOP_DEMO_MODE=true npm run dev -- --port 3100`, then open `http://localhost:3100/demo/live`.

Only the Next.js server reads the engine API key. Outside that explicit local mode, live-demo routes require an authenticated EcoP administrator. A registered station's signed v2 publisher remains a separate pathway: it binds a track to a QR session, retries via its SQLite outbox, and lets the EcoP database adjudicate before any credit or review update.

Run the release checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright test
```

The browser suite expects a local app at `http://localhost:3100`; the exact tested command is in [the test report](docs/release/TEST_REPORT.md). The companion’s simulation tests need its test dependencies as described in [the deployment guide](docs/release/DEPLOYMENT.md).

## Production deployment

Read [the deployment guide](docs/release/DEPLOYMENT.md) before connecting a Supabase project or edge device. Apply migrations in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_ecop_2.sql`
3. `supabase/migrations/0003_reward_fulfillment.sql`
4. `supabase/seed.sql` only if its sample bins and rewards are appropriate for the environment.

Do not apply migrations, provision secrets, send mail, deploy or enable stations directly from this repository without change approval. The application has not modified a production service.

## Key routes

- `POST /api/session/start` starts an authenticated station session.
- `POST /api/disposal/verify` and `POST /api/refill/verify` receive signed v2 edge evidence.
- `POST /api/device/session` lets a signed device discover only its bin’s current pending session before it tracks an object.
- `GET/POST /api/impact` reads evidence and handles appeals, reviews and batch actions.
- `POST /api/reward/redeem` and `POST /api/reward/resolve` create and resolve auditable reward receipts.

The v2 device contract is implemented in `src/lib/device-gateway.ts` and the companion publisher at `companion/awareness-engine/awareness_engine/integration/ecop_webhook.py`. It replaces the prior bin-only webhook convention.

## Documentation

- [Deployment guide](docs/release/DEPLOYMENT.md)
- [Test report](docs/release/TEST_REPORT.md)
- [Model evaluation and benchmark gate](docs/release/MODEL_EVALUATION.md)
- [Release notes](docs/release/RELEASE_NOTES.md)
- [Initial audit/work log](docs/release/WORKLOG.md)

`docs/spec` captures the earlier product planning material. The release docs and the code/migrations are authoritative where the older planning specification differs.
