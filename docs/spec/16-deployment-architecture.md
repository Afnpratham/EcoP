# 16 — Deployment Architecture

> **Spec file:** `16-deployment-architecture.md`  
> **Backend architecture:** See [08-backend-architecture.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/08-backend-architecture.md)  
> **Frontend architecture:** See [07-frontend-architecture.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/07-frontend-architecture.md)

---

## 1. System Overview

```mermaid
flowchart TB
    subgraph Internet["Public Internet"]
        USER[User Browser]
    end

    subgraph CDN_LB["Edge / Load Balancer"]
        CDN[CDN / Edge Cache]
        LB[Load Balancer / Reverse Proxy]
    end

    subgraph Platform["EcoP Platform (Frontend)"]
        NEXT_1[Next.js Instance 1]
        NEXT_2[Next.js Instance 2]
    end

    subgraph Backend["EcoP Backend API"]
        API_1[FastAPI Instance 1]
        API_2[FastAPI Instance 2]
    end

    subgraph Data["Data Stores"]
        PG[(PostgreSQL 15+)]
        REDIS[(Redis 7+)]
    end

    subgraph Edge["Bin Edge Devices"]
        BIN_1[Edge Device 1 + Camera]
        BIN_2[Edge Device 2 + Camera]
        BIN_N[Edge Device N + Camera]
    end

    USER --> CDN
    CDN --> LB
    LB --> NEXT_1
    LB --> NEXT_2
    NEXT_1 --> API_1
    NEXT_2 --> API_2
    API_1 --> PG
    API_1 --> REDIS
    API_2 --> PG
    API_2 --> REDIS

    BIN_1 --> LB
    BIN_2 --> LB
    BIN_N --> LB
```

---

## 2. Environments

| Environment | Purpose | URL Pattern | Database | Deployment |
|-------------|---------|-------------|----------|------------|
| **Development** | Local developer workstation | `localhost:3000` (FE), `localhost:8000` (BE) | Local PostgreSQL + Redis via Docker Compose | Manual / hot-reload |
| **Staging** | Pre-production testing | `staging.ecop.dev` | Shared staging DB (sanitized data) | Automatic on `develop` branch merge |
| **Production** | Live application | `ecop.dev` (FE), `api.ecop.dev` (BE) | Production DB (managed) | Manual trigger after staging approval |

---

## 3. Local Development Setup

### Docker Compose Services

```
docker-compose.yml
├── postgres          — PostgreSQL 15, port 5432
├── redis             — Redis 7, port 6379
├── api               — FastAPI (Uvicorn), port 8000, hot-reload
└── web               — Next.js dev server, port 3000, hot-reload
```

### Developer Workflow

```
# Start infrastructure
docker compose up -d postgres redis

# Run backend (with hot-reload)
cd ecop-backend
make dev          # uvicorn src.main:app --reload --port 8000

# Run frontend (with hot-reload)
cd ecop-platform
npm run dev       # next dev --port 3000

# Run migrations
cd ecop-backend
make migrate      # alembic upgrade head

# Seed database
make seed         # python scripts/seed.py
```

---

## 4. Docker Configuration

### Backend Dockerfile (Multi-Stage)

```
# Stage 1: Dependencies
FROM python:3.12-slim as builder
- Install build dependencies
- pip install into a virtual environment

# Stage 2: Runtime
FROM python:3.12-slim as runtime
- Copy virtual environment from builder
- Copy application source
- Non-root user (ecop:ecop)
- Health check: curl http://localhost:8000/api/v1/health
- CMD: uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Dockerfile (Multi-Stage)

```
# Stage 1: Dependencies
FROM node:20-alpine as deps
- npm ci (install locked dependencies)

# Stage 2: Build
FROM node:20-alpine as builder
- Copy deps + source
- next build (production build)

# Stage 3: Runtime
FROM node:20-alpine as runner
- Copy standalone Next.js output
- Non-root user
- CMD: node server.js
```

---

## 5. Infrastructure Components

### PostgreSQL

| Config | Development | Staging | Production |
|--------|------------|---------|------------|
| Version | 15 (Docker) | 15 (Managed) | 15+ (Managed: RDS/Cloud SQL/Supabase) |
| Connection pool | 5 | 20 | 50 (pool_size) + 10 (overflow) |
| Backups | None | Daily | Continuous (point-in-time recovery) |
| Replicas | None | None | 1 read replica (leaderboard/analytics queries) |
| SSL | None | Required | Required |

### Redis

| Config | Development | Staging | Production |
|--------|------------|---------|------------|
| Version | 7 (Docker) | 7 (Managed) | 7+ (Managed: ElastiCache/Memorystore) |
| Persistence | None | RDB snapshots | AOF + RDB |
| Memory | 64MB | 256MB | 1GB+ |
| Eviction | `allkeys-lru` | `allkeys-lru` | `allkeys-lru` |

---

## 6. CI/CD Pipeline

```mermaid
flowchart LR
    subgraph PR["Pull Request"]
        LINT[Lint + Format Check]
        TYPE[Type Check]
        TEST[Unit + Integration Tests]
        BUILD[Build Check]
    end

    subgraph Merge_Develop["Merge to develop"]
        STAGING_BUILD[Build Docker Images]
        STAGING_PUSH[Push to Container Registry]
        STAGING_DEPLOY[Deploy to Staging]
        STAGING_TEST[Run E2E Tests]
    end

    subgraph Release["Release to Production"]
        APPROVAL[Manual Approval]
        PROD_DEPLOY[Deploy to Production]
        SMOKE[Smoke Tests]
        MONITOR[Monitor Metrics]
    end

    PR --> Merge_Develop
    Merge_Develop --> Release
```

### PR Checks (Both Repos)

| Check | Command | Blocks Merge |
|-------|---------|-------------|
| Linting (Backend) | `ruff check src/` | Yes |
| Formatting (Backend) | `ruff format --check src/` | Yes |
| Type check (Backend) | `mypy src/` | Yes |
| Unit tests (Backend) | `pytest tests/ -x --cov` | Yes |
| Linting (Frontend) | `eslint .` | Yes |
| Type check (Frontend) | `tsc --noEmit` | Yes |
| Build (Frontend) | `next build` | Yes |

### Deployment Pipeline

| Stage | Trigger | Actions |
|-------|---------|---------|
| **Staging** | Merge to `develop` branch | Build images → Push to registry → Deploy to staging → Run E2E tests |
| **Production** | Manual trigger (after staging approval) | Blue-green deployment → Smoke tests → DNS switch → Monitor |

---

## 7. Hosting Targets

The architecture is **container-based and cloud-agnostic**. Recommended hosting options:

| Component | Option A (AWS) | Option B (GCP) | Option C (Self-Hosted) |
|-----------|---------------|----------------|----------------------|
| Frontend | ECS/Fargate or Vercel | Cloud Run or Firebase Hosting | Docker on VM |
| Backend | ECS/Fargate | Cloud Run | Docker on VM |
| Database | RDS PostgreSQL | Cloud SQL | Docker or managed |
| Redis | ElastiCache | Memorystore | Docker or managed |
| Container Registry | ECR | Artifact Registry | Docker Hub / GHCR |
| CDN | CloudFront | Cloud CDN | Cloudflare |
| DNS | Route 53 | Cloud DNS | Cloudflare |
| Secrets | Secrets Manager | Secret Manager | HashiCorp Vault |
| Monitoring | CloudWatch | Cloud Monitoring | Grafana + Prometheus |

---

## 8. Environment Variables

### Backend Production Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/ecop

# Redis
REDIS_URL=redis://host:6379/0

# Security
SECRET_KEY=<random-256-bit-hex>
CORS_ORIGINS=["https://ecop.dev"]

# Awareness Engine
AWARENESS_ENGINE_SECRETS={"engine-01":"<secret>","engine-02":"<secret>"}

# Application
ENVIRONMENT=production
LOG_LEVEL=INFO
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (for verification + password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@ecop.dev
SMTP_PASSWORD=<secret>
FROM_EMAIL=noreply@ecop.dev
```

### Frontend Production Variables

```bash
NEXT_PUBLIC_API_URL=https://api.ecop.dev/api/v1
NEXT_PUBLIC_SSE_URL=https://api.ecop.dev/api/v1/sse
NEXT_PUBLIC_APP_NAME=EcoP
NEXT_PUBLIC_APP_URL=https://ecop.dev
```

---

## 9. Monitoring & Observability

| Aspect | Tool/Approach | Details |
|--------|--------------|---------|
| **Logging** | structlog (JSON) | Structured JSON logs to stdout; collected by log aggregator |
| **Health check** | `GET /api/v1/health` | Returns status, version, DB connectivity, Redis connectivity |
| **Metrics** | Prometheus-compatible (optional) | Request count, latency p50/p95/p99, error rate |
| **Alerting** | Platform-specific | Alert on: health check failure, error rate > 1%, p95 > 500ms, camera offline |
| **Uptime** | External uptime monitor | Monitor `https://ecop.dev` and `https://api.ecop.dev/api/v1/health` |

---

## 10. Scaling Strategy

| Component | Scaling Method | Trigger |
|-----------|---------------|---------|
| Backend API | Horizontal (add instances) | CPU > 70% or request queue > threshold |
| Frontend | Horizontal (add instances) or CDN edge caching | Request rate |
| PostgreSQL | Vertical (resize) + read replicas | Connection count, query latency |
| Redis | Vertical (resize) | Memory usage > 80% |
| Edge devices | Linear (1 per bin) | Number of bins deployed |

**Stateless design:** The backend API is fully stateless. All shared state (sessions, rate limits, SSE pub/sub) lives in Redis. Any API instance can handle any request. This enables zero-downtime deployments and horizontal scaling.
