# 14 — Admin Console Design

> **Spec file:** `14-admin-console.md`  
> **Enums referenced:** `UserRole`, `SessionStatus`, `BinStatus`, `CameraStatus`, `RedemptionStatus`, `ManualReviewAction`, `ErrorCode` — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)  
> **API endpoints:** See [10-api-design.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/10-api-design.md) §11  
> **Component tree:** See [06-component-hierarchy.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/06-component-hierarchy.md) §8

---

## 1. Access Control

| Requirement | Detail |
|-------------|--------|
| Required role | `ADMIN` (single admin role for V1, per assumption A16) |
| Route prefix | `/admin/*` |
| Backend enforcement | `require_role(UserRole.ADMIN)` dependency on all `/api/v1/admin/*` endpoints |
| Frontend enforcement | `AdminGuard` component + middleware redirect for non-admin users |
| Audit logging | All admin write operations logged in `admin_audit_log` table |

---

## 2. Admin Dashboard (`/admin`)

### Overview Widgets

| Widget | Data Source | Refresh |
|--------|-----------|---------|
| Today's Disposals | Count of sessions with `start_time` today | 1 min |
| Pending Reviews | Count of sessions with `status = MANUAL_REVIEW` | 1 min |
| Active Cameras | Count of cameras with `status = ONLINE` | 5 min |
| Offline Cameras | Count with `status = OFFLINE` | 5 min |
| Flagged Users | Count of users flagged for anomaly | 1 hour |
| Today's Points Awarded | Sum of `ecop_transactions.amount` where type=`AWARD` today | 5 min |
| Active Users (7d) | Distinct users with sessions in last 7 days | 15 min |
| Failed Events | Count of unresolved `failed_events` | 5 min |

### Quick Actions

- **Review Queue** → `/admin/review` (badge showing pending count)
- **Camera Health** → `/admin/cameras`
- **Flagged Users** → `/admin/flags`

### Recent Activity Feed

Last 10 admin-relevant events: new registrations, verified disposals, manual reviews, reward redemptions, failed events.

---

## 3. User Management (`/admin/users`)

### Features

| Feature | Description |
|---------|-------------|
| Search | By name, email, or SAP ID (partial match) |
| Filter | By `UserRole`, flagged status, active/inactive |
| Sort | By name, created_at, total bottles, total points |
| Pagination | Cursor-based, 20 per page |

### User Table Columns

| Column | Source |
|--------|--------|
| Full Name | `users.full_name` |
| Email | `users.email` |
| Role | `users.role` (`UserRole` badge) |
| SAP ID | `sap_profiles.sap_id` (if applicable) |
| Total Bottles | Count of `VERIFIED` sessions |
| Points Balance | `users.points_balance` |
| 🚩 Flagged | Anomaly flag indicator |
| Status | Active/Inactive badge |
| Joined | `users.created_at` |

### User Actions

| Action | Effect | Audit Logged |
|--------|--------|-------------|
| View Details | Open detail drawer with full user profile + history | No |
| Deactivate | Set `users.is_active = false` | Yes |
| Reactivate | Set `users.is_active = true` | Yes |
| Grant Admin | Set `users.role = 'ADMIN'` | Yes |
| Revoke Admin | Set `users.role` back to previous role | Yes |
| Clear Flag | Remove anomaly flag | Yes |

---

## 4. Bin Management (`/admin/bins`)

### Bin Table Columns

| Column | Source |
|--------|--------|
| Bin Code | `bins.bin_code` |
| Description | `bins.description` |
| Location | `bins.location` |
| Status | `bins.status` (`BinStatus` badge) |
| Camera | Associated camera code + status |
| Total Sessions | Count of sessions for this bin |
| Today's Sessions | Count today |

### Bin Actions

| Action | Effect | Audit Logged |
|--------|--------|-------------|
| Create Bin | Insert new bin with code, description, location | Yes |
| Edit Bin | Update description, location, lat/lng | Yes |
| Set Active | `bins.status = 'ACTIVE'` | Yes |
| Set Inactive | `bins.status = 'INACTIVE'` | Yes |
| Set Maintenance | `bins.status = 'MAINTENANCE'` | Yes |

### Create/Edit Bin Form

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Bin Code | Text | Yes (create only, immutable) | Format: `ECOP-BIN-{IDENTIFIER}`, unique |
| Description | Text | No | Max 255 chars |
| Location | Text | No | Max 255 chars |
| Latitude | Decimal | No | -90 to 90 |
| Longitude | Decimal | No | -180 to 180 |
| Status | Select | Yes | `BinStatus` enum |

---

## 5. Camera Health (`/admin/cameras`)

### Display Format: Card Grid

Each camera displayed as a card:

```
┌────────────────────────────────┐
│  CAM-LIBRARY-01                │
│  Bin: ECOP-BIN-LIBRARY         │
│                                │
│  Status: ● ONLINE              │
│  Last Heartbeat: 2 min ago     │
│                                │
│  Errors: None                  │
└────────────────────────────────┘
```

### Status Colors

| `CameraStatus` | Color | Icon |
|----------------|-------|------|
| `ONLINE` | Green | ● |
| `DEGRADED` | Amber/Yellow | ⚠ |
| `OFFLINE` | Red | ✕ |

### Camera Actions

| Action | Effect |
|--------|--------|
| View Details | Show heartbeat history, error log |
| Register Camera | Create new camera entry, auto-generate `hmac_secret` (displayed once) |
| Edit Camera | Change associated bin |

---

## 6. Manual Review Queue (`/admin/review`)

### Queue Display

List of sessions with `SessionStatus.MANUAL_REVIEW`, ordered by `created_at` ascending (oldest first).

### Review Card

```
┌────────────────────────────────────────────────────┐
│  Session: 550e8400-...                              │
│  User: Arjun Sharma (arjun@university.edu)          │
│  Bin: ECOP-BIN-LIBRARY                              │
│  Time: Jul 28, 2026, 15:30:25                       │
│                                                     │
│  Confidence: 0.72                                   │
│  ████████████████████████░░░░░░░░  72%              │
│                                                     │
│  Thresholds: VERIFIED ≥ 0.85 | FAILED < 0.50       │
│  This score: BORDERLINE (manual review required)    │
│                                                     │
│  [✓ Approve]  [✕ Reject]                            │
└────────────────────────────────────────────────────┘
```

### Review Actions

| Action | API Call | Effect |
|--------|----------|--------|
| Approve | `POST /admin/review/:session_id {action: "APPROVE"}` | Session → `VERIFIED`, points awarded, user notified via SSE |
| Reject | `POST /admin/review/:session_id {action: "REJECT"}` | Session → `FAILED`, no points |

Both actions are audit-logged with the admin's `actor_id` and the session's before/after state.

---

## 7. Waste Events (`/admin/events`)

### Event Table

| Column | Source |
|--------|--------|
| Session ID | `waste_events.session_id` |
| Bin | `waste_events.bin_id` |
| Confidence | `waste_events.confidence` (with color coding) |
| Result | `waste_events.verification_result` (badge) |
| Timestamp | `waste_events.event_timestamp` |
| Created | `waste_events.created_at` |

### Filters

- By `VerificationResult`
- By bin code
- By date range

---

## 8. Failed Events (`/admin/failed-events`)

### Failed Event Table

| Column | Source |
|--------|--------|
| Session ID | `failed_events.session_id` |
| Error | `failed_events.error_message` (truncated, expand on click) |
| Retry Count | `failed_events.retry_count` |
| Resolved | `failed_events.resolved` (badge) |
| Created | `failed_events.created_at` |

### Actions

| Action | Effect |
|--------|--------|
| View Payload | Show raw JSON payload in modal |
| Mark Resolved | Set `resolved = true` |

---

## 9. Reward Management (`/admin/rewards`)

### Reward Table

| Column | Source |
|--------|--------|
| Name | `rewards.name` |
| Points Required | `rewards.points_required` |
| Stock | `rewards.quantity_remaining` / `rewards.quantity_total` (or "∞") |
| One Per User | `rewards.one_per_user` (Yes/No) |
| Active | `rewards.is_active` (toggle) |
| Redemptions | Count of `reward_redemptions` |
| Created | `rewards.created_at` |

### Create/Edit Reward Form

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | Text | Yes | Max 100 chars |
| Description | Textarea | No | Max 500 chars |
| Image | File upload / URL | No | |
| Points Required | Number | Yes | > 0 |
| Quantity (Total) | Number | No | NULL = unlimited |
| One Per User | Toggle | No | Default: false |
| Active | Toggle | No | Default: true |

### Redemption History

Accessible via reward detail view. Shows all redemptions for that reward:

| Column | Source |
|--------|--------|
| User | `users.full_name` |
| Points Spent | `reward_redemptions.points_spent` |
| Status | `reward_redemptions.status` (`RedemptionStatus` badge) |
| Date | `reward_redemptions.created_at` |

Admin can update redemption status: `PENDING` → `FULFILLED` or `CANCELLED`.

---

## 10. Point Rules (`/admin/points`)

### Display

| Column | Source |
|--------|--------|
| Waste Type | `point_rules.waste_type` |
| Points Per Event | `point_rules.points_per_event` |
| Active From | `point_rules.active_from` |
| Active Until | `point_rules.active_until` (or "Current") |

### Edit Flow

When admin changes `points_per_event`:
1. Current rule gets `active_until = NOW()`.
2. New rule created with `points_per_event = new_value`, `active_from = NOW()`.
3. Historical transactions are never modified — change is prospective only.

---

## 11. Analytics (`/admin/analytics`)

### Charts

| Chart | Type | Data |
|-------|------|------|
| Disposal Trends | Line chart | Daily/weekly disposal count over time |
| User Growth | Area chart | Cumulative user registrations over time |
| Redemption Rates | Bar chart | Rewards redeemed per week |
| Top Bins | Horizontal bar | Bins ranked by session count |
| Peak Hours | Heatmap | Day-of-week × hour-of-day disposal frequency |
| Confidence Distribution | Histogram | Distribution of confidence scores |

### Filters

- Date range picker (preset: last 7 days, 30 days, 90 days, custom)
- Granularity: daily / weekly

---

## 12. System Settings (`/admin/settings`)

### Settings Form

| Setting Key | Label | Input Type | Validation |
|-------------|-------|------------|------------|
| `confidence_threshold_verified` | Verified Threshold | Number (0–1) | 0 < value ≤ 1 |
| `confidence_threshold_manual_review` | Manual Review Threshold | Number (0–1) | 0 < value < verified threshold |
| `max_sessions_per_hour` | Max Sessions/Hour/User | Integer | > 0 |
| `max_sessions_per_day` | Max Sessions/Day/User | Integer | ≥ max sessions/hour |
| `plastic_grams_per_bottle` | Plastic per Bottle (g) | Number | > 0 |
| `co2e_grams_per_bottle` | CO₂e per Bottle (g) | Number | > 0 |
| `session_timeout_seconds` | Session Timeout (s) | Integer | > 0 |
| `session_grace_seconds` | Session Grace Window (s) | Integer | > session_timeout_seconds |
| `anomaly_percentile_threshold` | Anomaly Percentile | Integer (1–99) | Valid percentile |

All changes are audit-logged with before/after values.

---

## 13. Flagged Users (`/admin/flags`)

### Flagged User Table

| Column | Source |
|--------|--------|
| User | `users.full_name` |
| Role | `users.role` |
| 7-Day Verified Events | Count of VERIFIED sessions in last 7 days |
| 95th Percentile | Current 95th percentile value |
| Deviation | How far above percentile |
| Flag Date | When flagged |

### Actions

| Action | Effect |
|--------|--------|
| View Activity | Show detailed session history for investigation |
| Clear Flag | Remove flag (does not block user) |
| Deactivate User | Deactivate user account (separate action, requires confirmation) |

**Design note:** Flagging is advisory only. Admins investigate and decide. Users are never auto-blocked.
