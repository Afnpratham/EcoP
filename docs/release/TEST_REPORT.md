# EcoP 2.0 test report

Run date: 25 October 2026. All results below are local checks, using isolated synthetic data where noted. No production service, Supabase project, reward balance, device publisher, or sensor was modified.

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | Pass | `npm run typecheck` |
| Lint | Pass | `npm run lint` |
| Unit and database integration | Pass — 112 tests | `npm run test`; includes PGlite execution of all three migrations and live-demo proxy configuration tests |
| Companion pipeline | Pass — 47 tests | `.venv/bin/python -m pytest tests -q`; includes live event de-duplication, camera allow-list, stream buffering, camera-disconnect status, API-key and rate-limiter tests |
| Browser end-to-end | Pass — 7 workflows | `npx playwright test` on `ECOP_DEMO_MODE=true`, port 3100; includes `/demo/live` rendering and responsive coverage |
| Production build | Pass | `npm run build`; generated and validated `/demo/live` plus four protected live-demo API routes |
| Dependency audit | Pass | `npm audit --json` reported 0 vulnerabilities |
| Python runtime dependency integrity | Pass | `.venv/bin/python -m pip check` reported no broken requirements |
| Live camera/proxy smoke test | Pass — real camera frames | Local engine on `127.0.0.1:8000`, EcoP on `localhost:3100`; authenticated control, MJPEG proxy, SSE proxy and start/stop UI were exercised |
| Live stream secrets/auth boundaries | Pass | Engine returned `401` without its API key; hostile cross-origin camera control returned `403`; browser-visible page/status responses contained neither the engine host nor its API key |

## Coverage exercised

The database suite executes the PostgreSQL migration logic with separate authenticated, anonymous, service-role and two admin identities. It verifies signup role hardening; direct ledger, profile-role, session and redemption writes; row isolation; repeated session starts; expiry; event duplicate/payload collision protection; device/bin mismatch; replay freshness; track uniqueness; uncalibrated/fused proof policies; owner-only appeals; self-review prohibition; one-time review credit; atomic redemption, cancellation/refund and stock handling; refill rate limits; and dual-operator material acceptance.

The API suite rejects bad signatures, stale events, malformed/oversized requests, unknown fields, old bin-only payloads and cross-origin state changes. It verifies explicit demo isolation, safe redirect paths, inconclusive evidence, refill validation and no fabricated reward on a database conflict.

Browser workflows load the main pages without client errors, check a 390px viewport for horizontal overflow, start and replay-protect a simulation session, disable action start offline, exercise simulation proof/appeal/review/collection/accept/refill records, verify headers/input validation, and capture desktop/mobile screenshots. The sample action flow is intentionally simulation-only. The Live AI Demo route renders in that same isolated mode but starts no camera unless its separate local gate is configured.

Companion tests cover conservative geometry, time ordering, transition rules, durable outbox retries, response validation, event expiry, HMAC signing, session binding across two users, duplicate publishing, the model-comparison gate, and new live-stream event/authorization behavior. The API runs with a single preloaded YOLO11n model shared between `/detect` and the live camera worker.

## Actual local live-stream observation

This is a real hardware observation, not a fixture. The configured MacBook camera opened through EcoP's protected `POST /api/demo/live/control` route. EcoP then read actual frames through its MJPEG proxy and actual status over its SSE proxy; the browser UI was used to stop and restart the one shared pipeline.

One sample status during the run reported camera FPS **29.4**, inference FPS **18.4**, and average end-to-end latency **144 ms**. The open scene contained no bottle, so there were no YOLO bottle detections, ByteTrack IDs, zone transitions, terminal candidate events, session submissions, review updates, or points. The status explicitly remained `sessionVerification: not_submitted` and `pointsAwarded: 0`.

## Not executed — release gates

- Staging Supabase migration and live Auth/RLS/realtime validation: no staging credentials were supplied.
- A physical bottle-disposal trial through a calibrated rim/zone, break-beam, load-cell or refill meter: not performed. The live camera stream proves camera/proxy operation only; it does not validate a disposal outcome.
- YOLO11/YOLO26/RF-DETR comparative inference: no EcoP-labelled held-out footage, target edge device or candidate weights were supplied.
- Load, penetration, accessibility-assistive-technology and cross-browser device-lab testing: no deployment environment/device lab was supplied.

These are not passing results. Follow [DEPLOYMENT.md](DEPLOYMENT.md) and [MODEL_EVALUATION.md](MODEL_EVALUATION.md) before enabling automatic live rewards.
