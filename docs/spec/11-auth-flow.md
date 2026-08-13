# 11 — Authentication Flow

> **Spec file:** `11-auth-flow.md`  
> **Enums referenced:** `UserRole`, `AuthProvider`, `ErrorCode` — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)  
> **API endpoints:** See [10-api-design.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/10-api-design.md) §1  
> **Database tables:** `users`, `sap_profiles`, `auth_providers` — see [09-database-schema.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/09-database-schema.md)

---

## 1. Registration Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant EM as Email Service

    U->>FE: Fill registration form (name, email, password)
    FE->>FE: Client-side validation (Zod schema)
    FE->>BE: POST /api/v1/auth/register {full_name, email, password}
    
    BE->>BE: Validate input (Pydantic)
    BE->>DB: Check email uniqueness
    alt Email already exists
        BE-->>FE: 409 {error: EMAIL_ALREADY_EXISTS}
        FE-->>U: "This email is already registered"
    end
    
    BE->>BE: Hash password (Argon2id)
    BE->>DB: INSERT INTO users (full_name, email, password_hash, is_email_verified=false, is_onboarded=false)
    BE->>DB: INSERT INTO auth_providers (user_id, provider='EMAIL_PASSWORD', provider_uid=email)
    BE->>BE: Generate email verification JWT (24h expiry, contains user_id)
    BE->>EM: Send verification email with link: {APP_URL}/verify-email?token={jwt}
    BE-->>FE: 201 {user_id, email, message: "Verification email sent"}
    FE-->>U: Show "Check your email for a verification link" screen
```

### Registration Validation Rules

| Field | Rule |
|-------|------|
| `full_name` | Required, 2–100 characters, trimmed |
| `email` | Required, valid email format, lowercase, trimmed |
| `password` | Required, ≥8 characters, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special character (`!@#$%^&*()-_+=`) |

---

## 2. Email Verification Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL

    U->>FE: Click verification link in email
    FE->>FE: Extract token from URL query param
    FE->>BE: POST /api/v1/auth/verify-email {token}
    
    BE->>BE: Decode and validate JWT
    alt Token expired (>24h)
        BE-->>FE: 401 {error: TOKEN_EXPIRED}
        FE-->>U: "Verification link expired. Please register again."
    end
    alt Token invalid
        BE-->>FE: 401 {error: TOKEN_INVALID}
        FE-->>U: "Invalid verification link."
    end
    
    BE->>DB: UPDATE users SET is_email_verified=true WHERE id=token.user_id
    BE-->>FE: 200 {message: "Email verified"}
    FE-->>U: "Email verified! You can now log in." + redirect to /login
```

---

## 3. Login Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL

    U->>FE: Submit login form (email, password)
    FE->>BE: POST /api/v1/auth/login {email, password}
    
    BE->>DB: SELECT user WHERE email = :email
    alt User not found
        BE-->>FE: 401 {error: INVALID_CREDENTIALS}
    end
    alt Email not verified
        BE-->>FE: 401 {error: INVALID_CREDENTIALS, message: "Please verify your email first"}
    end
    
    BE->>BE: Verify password against hash (Argon2id)
    alt Password mismatch
        BE-->>FE: 401 {error: INVALID_CREDENTIALS}
    end
    
    BE->>BE: Generate JWT access token (15 min expiry)
    BE->>BE: Generate refresh token (7 day, includes jti for rotation tracking)
    BE-->>FE: 200 {access_token, user} + Set-Cookie: refresh_token (httpOnly, Secure, SameSite=Strict, Path=/api/v1/auth)
    
    FE->>FE: Store access_token in Zustand authStore (memory only)
    FE->>FE: Store user in Zustand authStore
    
    alt User not onboarded (is_onboarded=false)
        FE->>FE: Redirect to /onboarding
    else User onboarded
        FE->>FE: Redirect to /dashboard (or ?redirect= param)
    end
```

### JWT Access Token Claims

```json
{
  "sub": "user-uuid",
  "email": "arjun@university.edu",
  "role": "STUDENT",
  "iat": 1722168600,
  "exp": 1722169500,
  "jti": "unique-token-id"
}
```

### Refresh Token Claims

```json
{
  "sub": "user-uuid",
  "jti": "unique-refresh-token-id",
  "iat": 1722168600,
  "exp": 1722773400,
  "type": "refresh"
}
```

### Cookie Properties

| Property | Value |
|----------|-------|
| Name | `ecop_refresh_token` |
| httpOnly | `true` |
| Secure | `true` (HTTPS only) |
| SameSite | `Strict` |
| Path | `/api/v1/auth` (only sent to auth endpoints) |
| Max-Age | `604800` (7 days in seconds) |

---

## 4. Token Refresh Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend API
    participant RD as Redis

    Note over FE: Access token expired (401 on API call)
    
    FE->>BE: POST /api/v1/auth/refresh (cookie: refresh_token)
    
    BE->>BE: Extract refresh token from cookie
    BE->>BE: Decode and validate JWT
    alt Token expired
        BE-->>FE: 401 {error: REFRESH_TOKEN_EXPIRED}
        FE->>FE: authStore.logout() + redirect to /login
    end
    
    BE->>RD: Check if jti is in blacklist (blacklist:refresh:{jti})
    alt Token blacklisted (already used/revoked)
        BE-->>FE: 401 {error: TOKEN_INVALID}
        FE->>FE: authStore.logout() + redirect to /login
    end
    
    BE->>RD: Blacklist current refresh token jti (TTL = remaining lifetime)
    BE->>BE: Generate new access token
    BE->>BE: Generate new refresh token (new jti, fresh 7-day expiry)
    BE-->>FE: 200 {access_token} + Set-Cookie: new_refresh_token
    
    FE->>FE: Update authStore with new access token
    FE->>FE: Retry original failed request
```

### Token Rotation Security

- **One-time use:** Each refresh token can be used exactly once. After use, its `jti` is added to a Redis blacklist.
- **Blacklist TTL:** Set to the remaining lifetime of the token (if a token had 3 days left when used, the blacklist entry lives for 3 days).
- **Stolen token detection:** If a blacklisted `jti` is presented, it means the token was already used — potentially by an attacker. The response is `TOKEN_INVALID` and the user must re-authenticate.

---

## 5. Onboarding Flow (First Login)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL

    Note over FE: User logged in, is_onboarded=false
    FE->>U: Show /onboarding page

    U->>FE: Select role (Student/Faculty/Visitor)
    
    alt Student or Faculty
        U->>FE: Enter SAP ID
        FE->>BE: POST /api/v1/users/me/onboarding {role: "STUDENT", sap_id: "2024XXX"}
        BE->>DB: Check SAP ID uniqueness
        alt SAP ID already linked
            BE-->>FE: 409 {error: SAP_ID_ALREADY_LINKED}
            FE-->>U: "This SAP ID is already linked to another account"
        end
        BE->>DB: UPDATE users SET role='STUDENT', is_onboarded=true
        BE->>DB: INSERT INTO sap_profiles (user_id, sap_id)
    else External Visitor
        FE->>BE: POST /api/v1/users/me/onboarding {role: "EXTERNAL_VISITOR"}
        BE->>DB: UPDATE users SET role='EXTERNAL_VISITOR', is_onboarded=true
    end
    
    BE-->>FE: 200 {updated user object}
    FE->>FE: authStore.completeOnboarding()
    FE->>FE: Redirect to /dashboard
```

---

## 6. Password Reset Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant EM as Email Service

    U->>FE: Click "Forgot Password" on login page
    FE->>FE: Navigate to /forgot-password
    U->>FE: Enter email
    FE->>BE: POST /api/v1/auth/forgot-password {email}
    
    Note over BE: Always return success (don't reveal if email exists)
    BE->>DB: SELECT user WHERE email = :email
    alt User exists and email verified
        BE->>BE: Generate reset JWT (1h expiry, contains user_id, iat)
        BE->>EM: Send reset email with link: {APP_URL}/reset-password?token={jwt}
    end
    BE-->>FE: 200 {message: "If the email exists, a reset link has been sent"}
    FE-->>U: "Check your email for a password reset link"

    Note over U: User clicks reset link in email
    U->>FE: Navigate to /reset-password?token={jwt}
    U->>FE: Enter new password + confirm
    FE->>BE: POST /api/v1/auth/reset-password {token, new_password}
    
    BE->>BE: Decode and validate JWT
    alt Token expired (>1h)
        BE-->>FE: 401 {error: TOKEN_EXPIRED}
    end
    
    BE->>DB: SELECT user WHERE id = token.user_id
    BE->>BE: Check token.iat > user.password_changed_at (ensures single-use)
    alt Token already used (password changed after token issued)
        BE-->>FE: 401 {error: TOKEN_INVALID}
    end
    
    BE->>BE: Hash new password (Argon2id)
    BE->>DB: UPDATE users SET password_hash=:hash, password_changed_at=NOW()
    BE-->>FE: 200 {message: "Password reset successful"}
    FE-->>U: "Password reset! You can now log in." + redirect to /login
```

### Single-Use Enforcement

Instead of maintaining a separate `password_reset_tokens` table, the `password_changed_at` column on `users` is compared against the token's `iat` (issued-at) claim. If `iat < password_changed_at`, the token was issued before the last password change and is no longer valid. This makes reset tokens implicitly single-use without additional storage.

---

## 7. Logout Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend API
    participant RD as Redis

    U->>FE: Click "Log Out"
    FE->>BE: POST /api/v1/auth/logout (with access token)
    
    BE->>BE: Extract jti from refresh token cookie (if present)
    BE->>RD: Blacklist refresh token jti
    BE-->>FE: 200 + Clear-Cookie: refresh_token
    
    FE->>FE: authStore.logout() — clear user, token, all query caches
    FE->>FE: Redirect to /login
```

---

## 8. Auth Provider Extension Points (V2+)

The `auth_providers` table is designed to support multiple authentication providers per user without a schema change:

```mermaid
erDiagram
    users ||--o{ auth_providers : "has many"
    
    auth_providers {
        uuid id PK
        uuid user_id FK
        string provider "EMAIL_PASSWORD | GOOGLE_OAUTH | UNIVERSITY_SSO | OTP"
        string provider_uid "email, Google sub, SSO nameID, phone"
        timestamp created_at
    }
```

**V2 additions require only:**
1. New rows in `auth_providers` for each provider a user connects.
2. New auth route handlers (e.g., `/auth/google/callback`).
3. No schema migration needed for the core `users` table.

**V1 state:** Each user has exactly one `auth_providers` row with `provider='EMAIL_PASSWORD'` and `provider_uid=<their email>`.

---

## 9. Security Summary

| Concern | Implementation |
|---------|---------------|
| Password storage | Argon2id hash via passlib (bcrypt fallback) |
| Access token | JWT, 15 min expiry, Bearer header |
| Refresh token | JWT, 7 day expiry, httpOnly + Secure + SameSite=Strict cookie |
| Token rotation | Refresh tokens are one-time use, blacklisted in Redis after use |
| CSRF protection | SameSite=Strict cookie + token not accessible to JavaScript |
| Brute-force protection | Rate limiting on `/auth/login` (10 attempts/min per IP) |
| Email enumeration | `/forgot-password` always returns success regardless of email existence |
| Password reset | Signed JWT, 1h expiry, implicitly single-use via `password_changed_at` check |
| Role escalation | `ADMIN` role never self-selectable; granted only by existing admin via admin endpoint |
