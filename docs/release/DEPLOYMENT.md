# EcoP 2.0 deployment guide

Deploy only after a staging review. Do not point production clients or devices at a new version until the steps below have been checked by the deployment owner.

## 1. Staging database and Auth

1. Create a staging Supabase project with a separate URL, anon key and service-role key.
2. Apply `0001_init.sql`, `0002_ecop_2.sql`, then `0003_reward_fulfillment.sql` in one controlled migration process. Run `seed.sql` only if its sample station/reward data is wanted.
3. Confirm the migrations with a non-admin user, an admin provisioned by a trusted operator, and the service role. Validate that direct table writes are denied and that only the RPC surface succeeds.
4. Configure Supabase Auth redirect URLs for `https://YOUR_HOST/auth/callback` and the password recovery path. Enable email confirmation and choose appropriate SMTP/rate-limit settings in the Supabase console.
5. Create actual `bins` and matching `devices`. A device must reference its bin. Start stations with `proof_mode='review'`; move to `vision` or `fusion` only after field validation. Enable a public leaderboard only for users who opt in.

## 2. Application environment

Set these server/runtime values in the host’s secret manager, never in source control:

```text
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://ecop.example
ECOP_DEMO_MODE=false
ECOP_DEVICE_KEYS={"camera-01":"at-least-32-random-bytes-per-device"}
```

Generate a different device secret for every edge device and rotate a device’s secret by updating the server mapping and the device atomically. Do not set `ECOP_DEMO_MODE=true` on a live host. The service-role key and `ECOP_DEVICE_KEYS` must never enter a client bundle, QR code, analytics system or browser log.

Deploy with `npm ci`, `npm run release:check`, then your managed Next.js start command. The release uses standalone output but does not prescribe a hosting provider. Configure HTTPS at the load balancer and set log retention/redaction before public traffic.

## 3. Edge device setup

Copy the paired source under `companion/awareness-engine` to the trusted edge image. Create an isolated Python environment and install runtime requirements after resolving them for the actual hardware:

```bash
python -m venv .venv
.venv/bin/pip install -r requirements-runtime.txt
```

Set `ECOP_API_URL`, `ECOP_BIN_ID`, `ECOP_DEVICE_ID`, `ECOP_DEVICE_SECRET`, `ECOP_OUTBOX_PATH`, `MODEL_PATH`, and a separate `ENGINE_API_KEY` from `companion/awareness-engine/.env.example`. Provision model weights through the approved model pipeline and record their checksums. The observation API refuses to download missing weights.

Calibrate `ECOP_RIM_RECT` for each camera. It has no default because it is camera-specific. Configure sensor adapters to emit actual `beam` and `load` values; missing hardware must remain `null`. Test the device’s signed `POST /api/device/session` discovery before allowing it to publish events. The outbox holds the exact original body across retries and marks records older than two minutes as expired rather than re-timestamping them.

## 4. Station acceptance checklist

- Capture permission, camera notice, data retention, deployment owner and support contacts in the operator privacy notice.
- Test QR session binding with two people at the same bin, retraction, hand occlusion, side entry, repeat object, no object, network loss and recovery.
- Verify the device refuses an unbound observation and the backend refuses a mismatched bin/device/session, stale timestamp and modified event ID.
- Test physical break-beam/load evidence against calibrated timing. Stay in manual review if false positives/negatives are unresolved.
- Test reward redemption, cancellation/refund, inventory exhaustion and fulfillment by a different operator.
- Test collection/acceptance with different operators, actual mass, recycler identity and a receipt reference.
- Use the benchmark protocol before changing the model or tracker. See [MODEL_EVALUATION.md](MODEL_EVALUATION.md).

## 5. Operations and rollback

Monitor rejected signatures, stale outbox records, inconclusive rates, manual-review queue age, reward reconciliation and device-heartbeat gaps. On uncertainty, change the station to `proof_mode='review'` or set it inactive; do not attempt to compensate by lowering the evidence threshold. Revoke a compromised device secret, deactivate the device and investigate its immutable event receipts.

Database migrations are additive. Back up the database and test restore before release. The supplied code does not include a destructive rollback migration; use a reviewed forward migration or a tested database restore plan.
