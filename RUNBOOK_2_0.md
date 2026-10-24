# EcoP 2.0 runbook — operational boundaries
Worktree: ~/Desktop/EcoP, branch feat/ecop-verified-impact.
Launch demo: ECOP_DEMO_MODE=true npm run dev; open http://localhost:3000/impact.
The lab uses data/impact-demo.json, is shared across visitors, and **never** updates production Supabase balances. Disable for public deployment with ECOP_DEMO_MODE=false.
The real signed /api/disposal/verify endpoint now deliberately returns 202 inconclusive for CV-only success; production points are not issued without verified independent sensor inputs. It also rejects unmatched sessions, wrong bins and stale timestamps.
Physical sensors have NOT been installed or paired. To ship a real production system, implement device-specific auth for IR/load-cell input, hardware timestamp calibration, active session binding, atomic proof ledger and replay constraints in Supabase, controlled admin/appeals, authenticated recycler custody signatures and privacy/security tests. Do not interpret the simulator's points as transferable Eco Points.
Run npm run typecheck; npm run test; npm run build. Review and apply SQL changes on a staging database first. Next.js 16 recommends proxy.ts rather than middleware.ts.
