# EcoP 2.0 release work

Backup: `codex/backup-ecop-20261024` at `ee6327c` includes all initial tracked and untracked source changes. Ignored local environment/configuration and runtime data remain untouched. Working branch: `codex/ecop-2-release`.

## Initial audit
- Existing typecheck, lint and 89 unit tests pass. No database/API/browser tests existed.
- APIs silently fall back to shared demo data on auth/database failure.
- Signup metadata can create administrators; direct session/redemption inserts bypass business rules.
- Legacy verification cannot award a successful disposal, does not persist review evidence, and bin-only matching risks attribution.
- Companion sends seconds, backend interprets milliseconds; publisher mistakes any 200/409 for a reward.
- Missing password-reset and auth callback routes; login accepts an unchecked redirect.
- Five innovations exist only in a shared local simulation lab.
- npm audit initially reports 17 advisories (3 critical, 8 high, 6 moderate).

## Release boundaries
No production migrations, provisioning, emails, deployments, or remote source writes are authorized or performed. Tests use isolated local data. Real camera, calibrated sensors, labeled site footage and staging Supabase validation are release gates, not assumed successes.
