# 08 — Backend Architecture

> **Spec file:** `08-backend-architecture.md`  
> **Enums referenced:** All enums — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)  
> **Database schema:** See [09-database-schema.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/09-database-schema.md)  
> **API design:** See [10-api-design.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/10-api-design.md)

---

## 1. Tech Stack (Pinned Versions)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.12+ | Runtime |
| FastAPI | 0.115.x | Web framework (async, OpenAPI auto-docs) |
| Uvicorn | 0.32.x | ASGI server |
| Pydantic | 2.x | Data validation, serialization, settings |
| SQLAlchemy | 2.0.x (async) | ORM (async engine + sessions) |
| Alembic | 1.14.x | Database migrations |
| asyncpg | 0.30.x | PostgreSQL async driver |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Rate limiting, caching, SSE pub/sub |
| passlib[argon2] | 1.7.x | Password hashing (Argon2id) |
| python-jose[cryptography] | 3.3.x | JWT token handling |
| httpx | 0.28.x | Async HTTP client (for testing) |
| sse-starlette | 2.x | Server-Sent Events support |
| APScheduler | 3.10.x | Scheduled jobs (leaderboard precompute, stats cache) |
| structlog | 24.x | Structured JSON logging |
| alembic | 1.14.x | Database migrations |

---

## 2. Folder Structure

```
ecop-backend/
├── alembic/                      — Alembic migration configuration
│   ├── env.py
│   ├── script.py.mako
│   └── versions/                 — Migration scripts
│       └── 001_initial_schema.py
│
├── src/
│   ├── main.py                   — FastAPI app factory, startup/shutdown events
│   ├── config.py                 — Pydantic Settings (env-based configuration)
│   │
│   ├── core/                     — Cross-cutting concerns
│   │   ├── __init__.py
│   │   ├── database.py           — SQLAlchemy async engine, session factory
│   │   ├── redis.py              — Redis connection pool
│   │   ├── security.py           — Password hashing, JWT encode/decode
│   │   ├── dependencies.py       — FastAPI dependencies (get_db, get_current_user)
│   │   ├── middleware.py         — CORS, rate limiting, request logging
│   │   ├── exceptions.py         — Custom exception classes + handlers
│   │   ├── enums.py              — Python enums mirroring spec
│   │   ├── pagination.py         — Cursor pagination utilities
│   │   └── response.py           — Standard response envelope builder
│   │
│   ├── auth/                     — Auth domain module
│   │   ├── __init__.py
│   │   ├── router.py             — Auth routes (login, register, refresh, etc.)
│   │   ├── service.py            — Auth business logic
│   │   ├── schemas.py            — Pydantic request/response models
│   │   └── dependencies.py       — Auth-specific dependencies
│   │
│   ├── users/                    — Users domain module
│   │   ├── __init__.py
│   │   ├── router.py             — User routes (me, profile, dashboard)
│   │   ├── service.py            — User business logic
│   │   ├── schemas.py
│   │   └── models.py             — SQLAlchemy models: User, SapProfile, AuthProvider
│   │
│   ├── bins/                     — Bins domain module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── schemas.py
│   │   └── models.py             — SQLAlchemy models: Bin, Camera
│   │
│   ├── sessions/                 — Disposal sessions domain module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py            — Session creation, state transitions, expiry
│   │   ├── schemas.py
│   │   ├── models.py             — SQLAlchemy models: DisposalSession
│   │   └── sse.py                — SSE event publisher for session updates
│   │
│   ├── waste_events/             — Waste events domain module
│   │   ├── __init__.py
│   │   ├── router.py             — Webhook endpoint (POST /waste-events)
│   │   ├── service.py            — Event processing, point awarding, idempotency
│   │   ├── schemas.py
│   │   ├── models.py             — SQLAlchemy models: WasteEvent, FailedEvent
│   │   └── webhook.py            — HMAC signature verification
│   │
│   ├── points/                   — Points & transactions domain module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py            — Point awarding, balance calculation
│   │   ├── schemas.py
│   │   └── models.py             — SQLAlchemy models: EcopTransaction, PointRule
│   │
│   ├── rewards/                  — Rewards domain module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py            — Redemption logic, stock management
│   │   ├── schemas.py
│   │   └── models.py             — SQLAlchemy models: Reward, RewardRedemption
│   │
│   ├── achievements/             — Achievements domain module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py            — Achievement check, unlock logic
│   │   ├── schemas.py
│   │   └── models.py             — SQLAlchemy models: Achievement, UserAchievement
│   │
│   ├── leaderboard/              — Leaderboard domain module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py            — Leaderboard query, precompute job
│   │   ├── schemas.py
│   │   └── models.py             — SQLAlchemy models: LeaderboardSnapshot
│   │
│   ├── statistics/               — Public statistics domain module
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py            — Aggregation queries, caching
│   │   └── schemas.py
│   │
│   ├── admin/                    — Admin domain module
│   │   ├── __init__.py
│   │   ├── router.py             — Admin-only routes
│   │   ├── service.py            — Admin operations, manual review, settings
│   │   ├── schemas.py
│   │   └── models.py             — SQLAlchemy models: AdminSetting, AdminAuditLog
│   │
│   ├── sse/                      — SSE infrastructure
│   │   ├── __init__.py
│   │   ├── router.py             — SSE connection endpoints
│   │   ├── manager.py            — Connection manager (Redis pub/sub backed)
│   │   └── events.py             — Event type definitions
│   │
│   └── tasks/                    — Scheduled/background tasks
│       ├── __init__.py
│       ├── scheduler.py          — APScheduler configuration
│       ├── leaderboard_job.py    — Precompute leaderboards (every 15 min)
│       ├── stats_cache_job.py    — Refresh statistics cache (every 5 min)
│       ├── session_expiry_job.py — Expire stale sessions (every 30s)
│       └── anomaly_detection_job.py — Flag anomalous users (every hour)
│
├── tests/
│   ├── conftest.py               — Fixtures: test DB, client, auth helpers
│   ├── test_auth/
│   ├── test_sessions/
│   ├── test_waste_events/
│   ├── test_rewards/
│   ├── test_leaderboard/
│   └── test_admin/
│
├── alembic.ini                   — Alembic configuration
├── pyproject.toml                — Project dependencies, tool configuration
├── Dockerfile                    — Multi-stage Docker build
├── docker-compose.yml            — Local dev: API + PostgreSQL + Redis
├── .env.example                  — Template for required env vars
└── Makefile                      — Common commands (dev, test, migrate, lint)
```

---

## 3. Application Architecture

```mermaid
flowchart TB
    subgraph Client["Clients"]
        WEB[EcoP Website]
        MOBILE[Future Mobile App]
        ENGINE[Awareness Engine]
    end

    subgraph API["FastAPI Application"]
        ROUTER[Routers]
        MIDDLEWARE[Middleware Layer]
        DEPS[Dependencies]
        
        subgraph Modules["Domain Modules"]
            AUTH_MOD[Auth]
            USER_MOD[Users]
            BIN_MOD[Bins]
            SESS_MOD[Sessions]
            EVENT_MOD[Waste Events]
            PTS_MOD[Points]
            RWD_MOD[Rewards]
            ACH_MOD[Achievements]
            LB_MOD[Leaderboard]
            STAT_MOD[Statistics]
            ADM_MOD[Admin]
        end
        
        subgraph Services["Cross-Cutting"]
            SEC[Security]
            SSE_MGR[SSE Manager]
            SCHED[Scheduler]
        end
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL)]
        REDIS[(Redis)]
    end

    WEB --> MIDDLEWARE
    MOBILE --> MIDDLEWARE
    ENGINE --> MIDDLEWARE
    MIDDLEWARE --> ROUTER
    ROUTER --> Modules
    Modules --> PG
    Modules --> REDIS
    SSE_MGR --> REDIS
    SCHED --> PG
```

---

## 4. Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant MW as Middleware
    participant R as Router
    participant D as Dependencies
    participant S as Service
    participant DB as PostgreSQL
    participant RD as Redis

    C->>MW: HTTP Request
    MW->>MW: CORS check
    MW->>MW: Request logging (structlog)
    MW->>RD: Rate limit check (token bucket)
    MW->>R: Route dispatch
    R->>D: Resolve dependencies
    D->>D: get_db() → async session
    D->>D: get_current_user() → JWT validation
    D->>D: require_role(ADMIN) → role check
    R->>S: Call service method
    S->>DB: Query/mutate via SQLAlchemy
    S->>RD: Cache read/write (if applicable)
    S-->>R: Return domain result
    R-->>C: Standard response envelope (200/4xx/5xx)
```

---

## 5. Key Architectural Decisions

### 5.1 Domain Module Organization

Each module encapsulates its own routes, services, schemas, and models. Cross-module dependencies flow through service interfaces, not direct model imports. Example: `waste_events.service` calls `points.service.award_points()`, not `EcopTransaction` model directly.

### 5.2 Async Everything

All database operations use SQLAlchemy 2.0 async API (`AsyncSession`, `async_sessionmaker`). All HTTP calls (e.g., in tests) use `httpx.AsyncClient`. This enables high concurrency under load without thread-pool overhead.

### 5.3 Dependency Injection

FastAPI's `Depends()` mechanism provides:
- `get_db` → yields an `AsyncSession`, auto-commits/rollbacks.
- `get_current_user` → validates JWT, returns `User` object.
- `require_role(UserRole.ADMIN)` → raises 403 if user role doesn't match.
- `get_current_active_user` → `get_current_user` + checks user is not deactivated.

### 5.4 Error Handling

- Custom `AppException` base class with `error_code` (from `ErrorCode` enum), `message`, and `http_status`.
- Registered as a FastAPI exception handler that formats all errors into the standard response envelope.
- Unhandled exceptions caught by a global handler, logged with full traceback, returned as `INTERNAL_ERROR`.

### 5.5 Configuration

Pydantic `BaseSettings` class reads from environment variables (with `.env` file fallback for local dev):

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_URL` | str | — | PostgreSQL async connection string |
| `REDIS_URL` | str | `redis://localhost:6379` | Redis connection string |
| `SECRET_KEY` | str | — | JWT signing secret |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | int | `15` | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | int | `7` | Refresh token lifetime |
| `CORS_ORIGINS` | list[str] | `["http://localhost:3000"]` | Allowed origins |
| `AWARENESS_ENGINE_SECRETS` | dict | — | `{engine_id: hmac_secret}` mapping |
| `MAX_SESSIONS_PER_HOUR` | int | `10` | Default rate limit |
| `MAX_SESSIONS_PER_DAY` | int | `20` | Default daily limit |
| `SESSION_TIMEOUT_SECONDS` | int | `60` | User-facing countdown |
| `SESSION_GRACE_SECONDS` | int | `90` | Total session lifetime before expiry |

### 5.6 Database Connection Pool

- SQLAlchemy async engine with `asyncpg` driver.
- Pool size: `pool_size=20`, `max_overflow=10` (configurable).
- Connection health checks enabled (`pool_pre_ping=True`).

### 5.7 Redis Usage

| Purpose | Key Pattern | TTL |
|---------|------------|-----|
| Rate limiting (sessions/hour) | `rate:session:user:{user_id}:hourly` | 1 hour |
| Rate limiting (sessions/day) | `rate:session:user:{user_id}:daily` | 24 hours |
| API rate limiting | `rate:api:{ip}:{endpoint}` | 1 minute |
| Statistics cache | `cache:stats:public` | 5 minutes |
| SSE pub/sub channel | `sse:user:{user_id}` | — (pub/sub) |
| Refresh token blacklist | `blacklist:refresh:{jti}` | 7 days |

### 5.8 SSE Architecture

```mermaid
flowchart LR
    subgraph Backend["Backend Instance"]
        WE[Waste Event Handler]
        SSE_PUB[SSE Publisher]
        SSE_ENDPOINT[SSE Endpoint]
    end
    
    REDIS_PS[(Redis Pub/Sub)]
    CLIENT[Frontend SSE Client]
    
    WE -->|"publish event"| SSE_PUB
    SSE_PUB -->|"PUBLISH"| REDIS_PS
    REDIS_PS -->|"SUBSCRIBE"| SSE_ENDPOINT
    SSE_ENDPOINT -->|"event stream"| CLIENT
```

- **Why Redis Pub/Sub for SSE:** Multiple backend instances behind a load balancer need to broadcast events to any connected client, regardless of which instance processed the waste event. Redis Pub/Sub decouples event production from consumption.
- **Channel per user:** `sse:user:{user_id}` — the SSE endpoint subscribes to the logged-in user's channel.
- **Event format:** Standard SSE with `event:` and `data:` fields, JSON-encoded payload.

### 5.9 Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `leaderboard_precompute` | Every 15 minutes | Recompute rankings for all segment×period combinations, write to `leaderboard_snapshots` |
| `stats_cache_refresh` | Every 5 minutes | Refresh materialized statistics (total bottles, plastic, CO₂, active users) |
| `session_expiry_sweep` | Every 30 seconds | Find sessions past `grace_seconds` still in `WAITING`/`PROCESSING`, transition to `EXPIRED` |
| `anomaly_detection` | Every 1 hour | Calculate 95th percentile of verified events per user over 7-day rolling window, flag outliers |

---

## 6. Environment Variables

```bash
# .env.example
DATABASE_URL=postgresql+asyncpg://ecop:ecop@localhost:5432/ecop
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:3000"]
AWARENESS_ENGINE_SECRETS={"engine-01":"hmac-secret-1"}
LOG_LEVEL=INFO
ENVIRONMENT=development
```
