# 12 — Disposal Session Flow

> **Spec file:** `12-disposal-session-flow.md`  
> **Enums referenced:** `SessionStatus`, `VerificationResult`, `BinStatus`, `ErrorCode`, `AchievementKey`, `TransactionType` — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)  
> **API endpoints:** See [10-api-design.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/10-api-design.md) §4–5  
> **Database tables:** `disposal_sessions`, `waste_events` — see [09-database-schema.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/09-database-schema.md)

---

## 1. Session State Machine

```mermaid
stateDiagram-v2
    [*] --> WAITING : QR scanned, session created

    WAITING --> PROCESSING : Awareness Engine detects activity
    WAITING --> EXPIRED : 60s countdown reaches 0, no activity detected

    PROCESSING --> VERIFIED : confidence ≥ 0.85
    PROCESSING --> FAILED : confidence < 0.50
    PROCESSING --> MANUAL_REVIEW : confidence ≥ 0.50 AND < 0.85
    PROCESSING --> EXPIRED : 90s grace window from start_time, no engine response

    MANUAL_REVIEW --> VERIFIED : Admin approves
    MANUAL_REVIEW --> FAILED : Admin rejects

    VERIFIED --> [*]
    FAILED --> [*]
    EXPIRED --> [*]
```

### Transition Details

| From | To | Trigger | Actor | Side Effects |
|------|----|---------|-------|-------------|
| `[*]` | `WAITING` | User scans QR code, `POST /sessions` | User | Create session row; start 60s countdown; SSE: `session.status_changed` |
| `WAITING` | `PROCESSING` | Waste event received from Awareness Engine | Engine (webhook) | Update session status; SSE: `session.status_changed` |
| `WAITING` | `EXPIRED` | 60s countdown elapses with no engine event | Expiry sweep job (runs every 30s) | Set `end_time`, update status; SSE: `session.status_changed` |
| `PROCESSING` | `VERIFIED` | Engine reports confidence ≥ 0.85 | Engine (webhook) | Award points, create transaction, check achievements; SSE: `session.verified` + `achievement.unlocked` (if applicable) |
| `PROCESSING` | `FAILED` | Engine reports confidence < 0.50 | Engine (webhook) | Set `end_time`; SSE: `session.status_changed` |
| `PROCESSING` | `MANUAL_REVIEW` | Engine reports confidence ≥ 0.50 and < 0.85 | Engine (webhook) | Add to admin review queue; SSE: `session.status_changed` |
| `PROCESSING` | `EXPIRED` | 90s grace window from `start_time` elapses, no conclusive engine response | Expiry sweep job | Set `end_time`; SSE: `session.status_changed` |
| `MANUAL_REVIEW` | `VERIFIED` | Admin clicks "Approve" in review queue | Admin | Award points, create transaction, check achievements; SSE: `session.verified` |
| `MANUAL_REVIEW` | `FAILED` | Admin clicks "Reject" in review queue | Admin | Set `end_time`; SSE: `session.status_changed` |

### Terminal States

`VERIFIED`, `FAILED`, and `EXPIRED` are terminal — no further transitions are possible. `MANUAL_REVIEW` is a holding state that eventually transitions to `VERIFIED` or `FAILED`.

---

## 2. End-to-End Disposal Flow (Happy Path)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant RD as Redis
    participant AE as Awareness Engine

    U->>FE: Scan QR code on bin → reads "ECOP-BIN-LIBRARY"
    FE->>BE: POST /api/v1/sessions {bin_code: "ECOP-BIN-LIBRARY"}
    
    BE->>DB: SELECT bin WHERE bin_code = 'ECOP-BIN-LIBRARY'
    BE->>BE: Validate bin status = ACTIVE
    BE->>DB: Check no active session on this bin (partial unique index)
    BE->>RD: Check rate limits (sessions/hour, sessions/day for user)
    
    BE->>DB: INSERT disposal_session (user_id, bin_id, status='WAITING', start_time=NOW(), expiry_time=NOW()+60s)
    BE-->>FE: 201 {session object with countdown_seconds=60}
    
    FE->>FE: Open SSE connection: GET /api/v1/sse/sessions/{session_id}
    FE->>FE: Start visual countdown (60→0)
    FE-->>U: Show "Drop your plastic bottle in the bin" + countdown

    Note over U: User drops bottle in bin
    
    AE->>AE: Detect bottle via computer vision
    AE->>AE: Track disposal behavior
    AE->>AE: Calculate confidence: 0.94
    AE->>AE: Determine result: VERIFIED (0.94 ≥ 0.85)
    AE->>AE: Sign payload with HMAC-SHA256
    
    AE->>BE: POST /api/v1/waste-events {session_id, bin_id, timestamp, confidence: 0.94, verification_result: "VERIFIED"}
    
    BE->>BE: Verify HMAC signature (X-EcoP-Signature header)
    BE->>DB: Check waste_events for duplicate session_id (idempotency)
    BE->>DB: INSERT INTO waste_events
    BE->>DB: UPDATE disposal_sessions SET status='VERIFIED', end_time=NOW()
    
    Note over BE: Award points
    BE->>DB: SELECT point_rules WHERE waste_type='PLASTIC_BOTTLE' AND active
    BE->>DB: INSERT INTO ecop_transactions (user_id, type='AWARD', amount=10, reference_id=session_id)
    BE->>DB: UPDATE users SET points_balance = points_balance + 10
    
    Note over BE: Check achievements
    BE->>DB: SELECT COUNT(*) FROM waste_events JOIN disposal_sessions WHERE user_id AND status='VERIFIED'
    BE->>BE: Compare count against achievement thresholds
    alt New achievement unlocked
        BE->>DB: INSERT INTO user_achievements
        BE->>RD: PUBLISH sse:user:{user_id} → achievement.unlocked event
    end
    
    BE->>RD: PUBLISH sse:user:{user_id} → session.verified event
    BE-->>AE: 200 {message: "Event processed", session_status: "VERIFIED"}
    
    Note over FE: SSE events received
    FE->>FE: Receive session.verified event
    FE->>FE: Trigger confetti animation
    FE->>FE: Animate points counter (+10)
    FE->>FE: Show achievement unlock (if applicable)
    FE-->>U: 🎉 Celebration! "+10 EcoP Points"
```

---

## 3. Failure Path: Session Expired (No Disposal)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant CRON as Expiry Sweep Job

    U->>FE: Scan QR → Session created (WAITING)
    FE-->>U: Show 60s countdown

    Note over U: User does NOT dispose bottle within 60s
    
    FE->>FE: Countdown reaches 0 → show "Session may expire"
    
    Note over CRON: Runs every 30s
    CRON->>DB: SELECT sessions WHERE status IN ('WAITING','PROCESSING') AND start_time + 90s < NOW()
    CRON->>DB: UPDATE session SET status='EXPIRED', end_time=NOW()
    CRON->>BE: Publish SSE event: session.status_changed → EXPIRED
    
    FE->>FE: Receive EXPIRED event via SSE
    FE-->>U: "Session expired. No disposal was detected."
    FE-->>U: [Scan Again] button
```

---

## 4. Failure Path: Low Confidence (FAILED)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend API
    participant AE as Awareness Engine

    U->>FE: Scan QR → Session starts (WAITING)
    Note over U: User drops non-bottle item (or unclear disposal)
    
    AE->>AE: Detect with confidence: 0.32
    AE->>BE: POST /waste-events {confidence: 0.32, verification_result: "FAILED"}
    
    BE->>BE: Verify HMAC, validate payload
    BE->>BE: Update session: WAITING → PROCESSING → FAILED
    BE->>BE: No points awarded
    BE->>BE: Publish SSE: session.status_changed → FAILED
    
    FE->>FE: Receive FAILED event
    FE-->>U: "Verification failed. Please ensure you're disposing a plastic bottle."
    FE-->>U: [Try Again] button
```

---

## 5. Borderline Path: Manual Review

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend API
    participant AE as Awareness Engine
    participant AD as Admin

    U->>FE: Scan QR → Session starts
    Note over U: User disposes bottle (partially obstructed view)
    
    AE->>AE: Detect with confidence: 0.72
    AE->>BE: POST /waste-events {confidence: 0.72, verification_result: "MANUAL_REVIEW"}
    
    BE->>BE: Session → MANUAL_REVIEW
    BE->>BE: Publish SSE: session.status_changed → MANUAL_REVIEW
    
    FE-->>U: "Your disposal is under review. You'll be notified of the result."

    Note over AD: Later, admin opens review queue
    AD->>BE: GET /api/v1/admin/review
    BE-->>AD: List of MANUAL_REVIEW sessions with confidence scores
    
    AD->>AD: Reviews session details
    AD->>BE: POST /api/v1/admin/review/{session_id} {action: "APPROVE"}
    
    BE->>BE: Session → VERIFIED
    BE->>BE: Award points (same flow as §2)
    BE->>BE: Publish SSE: session.verified
    
    FE->>FE: If user is online, receive session.verified
    FE-->>U: Dashboard shows updated points + notification
```

---

## 6. Error Path: Bin Busy

```mermaid
sequenceDiagram
    participant U as User B
    participant FE as Frontend
    participant BE as Backend API

    Note over BE: User A already has an active session on this bin

    U->>FE: Scan QR → "ECOP-BIN-LIBRARY"
    FE->>BE: POST /api/v1/sessions {bin_code: "ECOP-BIN-LIBRARY"}
    
    BE->>BE: Check active sessions on bin → found one in WAITING (35s remaining)
    BE-->>FE: 409 {error: {code: "BIN_BUSY", details: {remaining_seconds: 35}}}
    
    FE-->>U: "This bin has an active session. Please wait ~35 seconds and try again."
```

---

## 7. Rate Limit Enforcement

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend API
    participant RD as Redis

    FE->>BE: POST /api/v1/sessions {bin_code: "..."}
    
    BE->>RD: INCR rate:session:user:{user_id}:hourly (EX 3600)
    alt Count > max_sessions_per_hour (default 10)
        BE-->>FE: 429 {error: RATE_LIMIT_EXCEEDED}
    end
    
    BE->>RD: INCR rate:session:user:{user_id}:daily (EX 86400)
    alt Count > max_sessions_per_day (default 20)
        BE-->>FE: 429 {error: DAILY_LIMIT_EXCEEDED}
    end
    
    BE->>BE: Proceed with session creation
```

---

## 8. Points Award Flow (Detail)

This sub-flow runs when a session transitions to `VERIFIED` (either directly from engine response or from admin approval):

```mermaid
flowchart TD
    A[Session → VERIFIED] --> B[Query active point_rules for PLASTIC_BOTTLE]
    B --> C{Rule found?}
    C -->|Yes| D[Create ecop_transaction: AWARD, +10]
    C -->|No| E[Log warning: no active rule, skip award]
    D --> F[Update users.points_balance atomically]
    F --> G[Check achievement thresholds]
    G --> H{New achievement?}
    H -->|Yes| I[Insert user_achievement]
    I --> J[Publish achievement.unlocked SSE event]
    H -->|No| K[Skip]
    J --> L[Publish session.verified SSE event]
    K --> L
    L --> M[Done]
```

### Atomicity

The following operations execute within a **single database transaction**:
1. Insert `waste_events` row.
2. Update `disposal_sessions.status` to `VERIFIED`.
3. Insert `ecop_transactions` row (type=`AWARD`).
4. Update `users.points_balance`.
5. Insert `user_achievements` row(s) if applicable.

If any step fails, the entire transaction rolls back. SSE events are published **after** the transaction commits successfully.

---

## 9. Timing Summary

| Event | Time | Source |
|-------|------|--------|
| Session created | T+0s | User scans QR |
| User-facing countdown expires | T+60s | Frontend timer |
| Typical engine response | T+5s to T+30s | Awareness Engine processing time |
| Grace window expiry (forced) | T+90s | Expiry sweep job |
| Expiry sweep job interval | Every 30s | APScheduler cron |

### Why 90s Grace Window?

The 60s countdown is the **user-facing timer** — it tells the user how long they have to dispose their bottle. The 90s grace window is the **system timer** — it gives the Awareness Engine up to 30 additional seconds to process and respond after the user's countdown ends. This accounts for:
- Network latency between engine and backend.
- Engine processing time (CV inference can take 2–10 seconds).
- Retry attempts if the first webhook delivery fails.

If no engine response arrives by T+90s, the session is expired by the sweep job, and the user sees "Session expired."
