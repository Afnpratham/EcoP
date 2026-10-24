# EcoP 2.0 test report

Run date: 24 October 2026. All results below are local checks, using isolated synthetic data where noted. No production service, physical camera or sensor was accessed.

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | Pass | `npm run typecheck` |
| Lint | Pass | `npm run lint` |
| Unit and database integration | Pass — 109 tests | `npm run test`; includes PGlite execution of all three migrations |
| Companion pipeline | Pass — 33 tests | `.venv/bin/python -m pytest companion/awareness-engine/tests -q` |
| Browser end-to-end | Pass — 7 workflows | `npx playwright test` on `ECOP_DEMO_MODE=true`, port 3100 |
| Production build | Pass | `npm run build`; 33 app routes generated/validated |
| Dependency audit | Pass | `npm audit --json` reported 0 vulnerabilities |
| Python syntax / benchmark gate | Pass | `py_compile` and synthetic scorer fixture; scorer correctly refuses field eligibility |

## Coverage exercised

The database suite executes the PostgreSQL migration logic with separate authenticated, anonymous, service-role and two admin identities. It verifies signup role hardening; direct ledger, profile-role, session and redemption writes; row isolation; repeated session starts; expiry; event duplicate/payload collision protection; device/bin mismatch; replay freshness; track uniqueness; uncalibrated/fused proof policies; owner-only appeals; self-review prohibition; one-time review credit; atomic redemption, cancellation/refund and stock handling; refill rate limits; and dual-operator material acceptance.

The API suite rejects bad signatures, stale events, malformed/oversized requests, unknown fields, old bin-only payloads and cross-origin state changes. It verifies explicit demo isolation, safe redirect paths, inconclusive evidence, refill validation and no fabricated reward on a database conflict.

Browser workflows load the main pages without client errors, check a 390px viewport for horizontal overflow, start and replay-protect a simulation session, disable action start offline, exercise simulation proof/appeal/review/collection/accept/refill records, verify headers/input validation, and capture desktop/mobile screenshots. The sample action flow is intentionally simulation-only.

Companion tests cover conservative geometry, time ordering, transition rules, durable outbox retries, response validation, event expiry, HMAC signing, session binding across two users, duplicate publishing, and the model-comparison gate. The image API is syntax-compiled only; it is not started because real validated model weights are absent.

## Not executed — release gates

- Staging Supabase migration and live Auth/RLS/realtime validation: no staging credentials were supplied.
- Real camera, break-beam, load-cell, refill-meter and station calibration: no physical hardware was supplied.
- YOLO11/YOLO26/RF-DETR comparative inference: no EcoP-labelled held-out footage, target edge device or candidate weights were supplied.
- Load, penetration, accessibility-assistive-technology and cross-browser device-lab testing: no deployment environment/device lab was supplied.

These are not passing results. Follow [DEPLOYMENT.md](DEPLOYMENT.md) and [MODEL_EVALUATION.md](MODEL_EVALUATION.md) before enabling automatic live rewards.
