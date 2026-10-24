# EcoP 2.0 release notes

## Security and integrity

- Replaced permissive demo fallbacks with an explicitly marked simulation runtime.
- Moved session creation, event crediting, redemption, review, traceability and reward resolution into locked PostgreSQL functions.
- Prevented self-assigned admin roles; restricted table grants; added RLS policies and least-privilege function grants.
- Added per-device HMAC verification, event size limits, strict schemas, origin checks, replay window checks, content-security headers and safe post-login redirects.
- Added redemption idempotency, cancellation refunds, operator fulfillment and append-only fulfillment records.

## Product capability

- Added station discovery and polished responsive flows for disposal and refill sessions.
- Added evidence receipts, appeals, auditable human review and practical personalized guidance.
- Added collection batches and independent recycler acceptance for material traceability.
- Added a distinct refill/reuse pathway with conservative limits and separate accounting.

## Awareness Engine

- Pinned the private companion source at its audited upstream commit and kept it local; no remote repository was changed.
- Added a v2 signed event contract, durable edge outbox, session discovery/binding, stricter temporal criteria and conservative rim-crossing proof adapter.
- Retained YOLO11 + ByteTrack pending a valid same-device benchmark; no unmeasured model replacement was made.

## UX and quality

- Reworked the visual system, navigation, mobile layout, action states, offline behavior and policy pages.
- Expanded the TypeScript, companion-pipeline and browser workflows; the exact locally executed counts are recorded in `TEST_REPORT.md`.
- Resolved the initial `npm audit` findings; final audit reports zero known vulnerabilities.
