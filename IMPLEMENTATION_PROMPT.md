# EcoP 2.0 — Implementation Prompt & Acceptance Contract

Act as principal full-stack engineer, product designer, security engineer, and applied CV systems architect. Upgrade the existing EcoP Next.js + Supabase application and companion Python Awareness Engine into a credible, elegant, working demo of a privacy-preserving circular-economy platform.

## Objectives
1. **Proof of Disposal:** Bind an active user-owned bin session to a single signed vision observation and independent infrared break-beam evidence; optional positive load change corroborates. Require temporal tracking plus beam before any automatic reward. Missing or conflicting evidence => INCONCLUSIVE review, not reward; obvious misplaced item => SUSPECTED_INCORRECT with guidance, never an automatic fine. Unique event IDs and transactions must reject replay.
2. **Fair outcomes:** VERIFIED, SUSPECTED_INCORRECT, INCONCLUSIVE, with human review/appeals and transparent explanations. Do not levy government/campus penalties automatically.
3. **Downstream traceability:** Collection batches with unique IDs, origins, measured mass, custody handoffs, contamination observations, and separately recorded recycler acceptance. Never label merely collected material as recycled.
4. **Learning:** Transparent personalized tip selection based on recurring errors, an intervention event log, and experiment-ready metrics. Avoid unsubstantiated claims of causal impact.
5. **Waste prevention:** Separate refill/reuse participation from verified disposals; do not grant unlimited points for discarded bottles. Prevented waste stays an estimate until supported by independently verified measurements.

## Engineering rules
- Preserve existing project functionality; build actual runnable backend endpoints and polished responsive user-facing UI, not nonfunctional mock buttons.
- Use Zod validation, authorize every mutable route, and keep Supabase RLS/privileged operations safe.
- Demo mode must be explicitly segregated from production, use deterministic representative data, and explain simulated sensor signals.
- Do not persist photographs of users or build face recognition. Record event metadata only.
- Do not fabricate impact/CO2 statistics or certified recycling claims.
- Keep existing working YOLO11 inference unless a newer model is benchmarked on the user's actual hardware and dataset; research alternatives and document choice.
- Include developer setup instructions and reproducible automated checks. Make no external purchases or deployment mutations without explicit permission.
- Deliver clean, cinematic design: emerald and slate dark palette, crisp typography, legible charts, clear states and motion, mobile responsiveness.
- No credentials in source or commits.

## Acceptance checks
- 83 existing tests continue to pass, typecheck and build pass.
- Vision alone never awards points. Beam with temporally valid vision awards exactly once; replay awards zero.
- Ambiguous events create review data; confirmed misuse produces guidance not automatic fines.
- Distinguish disposal, collected mass, recycler-confirmed mass, estimated waste avoidance.
- Endpoints enforce auth/HMAC and role checks; demo interactions visibly operate end-to-end.
- Document limitations: physical IR/load-cell and recycler records cannot be independently verified without connected hardware and partners.

## Execution strategy
1. Repair existing build, migration, authorization, demo isolation, and anti-replay defects.
2. Add production- and demo-compatible proof adjudication and append-only event receipts.
3. Build cohesive interactive command-center pages for verification, learning, refill and batch traceability.
4. Integrate companion engine adapter/documentation, tests and quality gates.
5. Verify before claiming completion.
