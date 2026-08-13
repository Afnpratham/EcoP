# 05 — UX Wireframes & UI Specification

> **Spec file:** `05-ux-wireframes.md`  
> **Enums referenced:** `SessionStatus`, `BinStatus`, `UserRole`, `AchievementKey`, `LeaderboardSegment`, `LeaderboardPeriod`, `RedemptionStatus` — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)  
> **Design tokens:** See [15-design-system.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/15-design-system.md) for colors, typography, and spacing values.

---

## 1. Landing Page (`/`)

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVBAR: Logo | How It Works | About | Impact | [Log In] [Sign Up] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        HERO SECTION                             │
│     "Rewarding Sustainable Behaviour Through AI"                │
│     Subheading: brief mission + privacy-first messaging         │
│     [Get Started] [Learn More]                                  │
│     Animated hero illustration (eco/recycling theme)            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                   LIVE STATISTICS BAR                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 12,450   │ │ 224.1kg  │ │ 672.3kg  │ │  312     │          │
│  │ Bottles  │ │ Plastic  │ │ CO₂e     │ │ Active   │          │
│  │ Recycled │ │ Saved    │ │ Avoided  │ │ Users    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  (Animated counters, numbers tick up on scroll-into-view)       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                   HOW ECOP WORKS                                │
│  Step 1: Scan QR       Step 2: Dispose       Step 3: Earn      │
│  [icon + brief desc]   [icon + brief desc]   [icon + brief desc]│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ABOUT THE AI (Privacy-First)                       │
│  "Our AI verifies your disposal — it never identifies you."     │
│  • No face recognition — ever                                  │
│  • No images stored or transmitted                              │
│  • Your identity is linked only through the QR session you      │
│    voluntarily create                                           │
│  [illustrated privacy diagram or icon set]                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│             ENVIRONMENTAL IMPACT                                │
│  Large animated counter showing cumulative campus impact         │
│  Visual comparison (e.g., "equivalent to X trees planted")      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│               REWARDS PREVIEW                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │
│  │ ☕   │ │ 🎒   │ │ 🎫   │ │ 🎁   │                         │
│  │Coffee│ │Merch │ │Event │ │ ...  │                         │
│  │100pt │ │500pt │ │300pt │ │      │                         │
│  └──────┘ └──────┘ └──────┘ └──────┘                         │
│  [View All Rewards →]                                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│            LEADERBOARD PREVIEW                                  │
│  Top 5 users with avatar, name, points                          │
│  [View Full Leaderboard →]                                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│            CALL TO ACTION                                       │
│  "Join EcoP today and make every bottle count."                 │
│  [Create Account]                                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER: Links | Privacy | Terms | © 2026 EcoP                  │
└─────────────────────────────────────────────────────────────────┘
```

### Interactions
- Stat counters animate (tick up) when scrolled into viewport (IntersectionObserver trigger).
- Hero CTA "Get Started" → `/register`. "Learn More" → scrolls to "How It Works."
- Smooth scroll between sections.
- Responsive: sections stack vertically on mobile; stat bar becomes a 2×2 grid.

---

## 2. Registration Page (`/register`)

### Layout

```
┌─────────────────────────────────────────┐
│            [EcoP Logo]                   │
│                                         │
│         Create Your Account             │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Full Name          [___________]  │  │
│  │ Email              [___________]  │  │
│  │ Password           [___________]  │  │
│  │ Confirm Password   [___________]  │  │
│  │                                   │  │
│  │ ☐ I agree to the Terms of        │  │
│  │   Service and Privacy Policy      │  │
│  │                                   │  │
│  │ [Create Account]                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Already have an account? [Log In]      │
│                                         │
│  ─────── Future Providers ───────       │
│  [G] Sign up with Google (disabled V1)  │
│  [🏫] University SSO (disabled V1)     │
└─────────────────────────────────────────┘
```

### Validation
- Full Name: required, 2–100 characters.
- Email: required, valid email format, unique (real-time check on blur → `EMAIL_ALREADY_EXISTS`).
- Password: ≥8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special. Strength indicator bar (weak/medium/strong).
- Confirm Password: must match Password.
- Terms checkbox: required.
- Submit disabled until all validations pass.
- On success: show "Check your email for a verification link" screen.

---

## 3. Login Page (`/login`)

### Layout

```
┌─────────────────────────────────────────┐
│            [EcoP Logo]                   │
│                                         │
│           Welcome Back                  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Email              [___________]  │  │
│  │ Password           [___________]  │  │
│  │                                   │  │
│  │ [Forgot Password?]               │  │
│  │                                   │  │
│  │ [Log In]                          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Don't have an account? [Sign Up]       │
└─────────────────────────────────────────┘
```

### Behavior
- Invalid credentials → generic error: "Invalid email or password" (never reveal which is wrong).
- On success: redirect to `/dashboard` (or `redirect` query param if present).
- First login (no role set): redirect to `/onboarding`.

---

## 4. Onboarding Page (`/onboarding`) — First Login Only

### Layout

```
┌─────────────────────────────────────────┐
│            [EcoP Logo]                   │
│                                         │
│       Welcome to EcoP, {name}!          │
│    Let's set up your profile.           │
│                                         │
│       Who are you?                      │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ │
│  │ 🎓      │ │ 👩‍🏫     │ │ 👋       │ │
│  │ Student │ │ Faculty │ │ Visitor  │ │
│  └─────────┘ └─────────┘ └──────────┘ │
│                                         │
│  ── If Student or Faculty selected ──   │
│                                         │
│  SAP ID (University ID):               │
│  [___________________________]          │
│  "Your university enrollment/employee   │
│   ID. This helps us verify your campus  │
│   affiliation."                         │
│                                         │
│  [Continue to Dashboard →]              │
└─────────────────────────────────────────┘
```

### Behavior
- Role selection: exactly one required. Clicking a card highlights it.
- `EXTERNAL_VISITOR`: SAP ID field is hidden; continue immediately.
- `STUDENT` / `FACULTY`: SAP ID field appears; required, non-empty, max 50 chars.
- On submit: role and SAP profile saved, user redirected to `/dashboard`.
- This page is shown only once; subsequent logins go directly to `/dashboard`.

---

## 5. Dashboard (`/dashboard`)

### Desktop Layout (Grid)

```
┌─────────────────────────────────────────────────────────────────┐
│ SIDEBAR │                    MAIN CONTENT                       │
│         │                                                       │
│ (nav)   │  ┌─ Profile Card ──┐  ┌─ Points ────────┐           │
│         │  │ Avatar + Name   │  │ 420 EcoP Points  │           │
│         │  │ Role badge      │  │ [+10 latest]     │           │
│         │  │ Member since    │  │ Progress to next │           │
│         │  └─────────────────┘  │ reward: ████░ 80%│           │
│         │                       └──────────────────┘           │
│         │                                                       │
│         │  ┌─ Environmental Impact ──────────────────┐         │
│         │  │ 🌿 42 bottles │ 756g plastic │ 2.27kg CO₂│         │
│         │  └─────────────────────────────────────────┘         │
│         │                                                       │
│         │  ┌─ Active Session ─┐  ┌─ Weekly Progress ─┐        │
│         │  │ (if any active   │  │ Bar chart: Mon-Sun │        │
│         │  │  session, show   │  │ this week vs last  │        │
│         │  │  live status +   │  └────────────────────┘        │
│         │  │  countdown via   │                                 │
│         │  │  SSE)            │  ┌─ Leaderboard Preview ┐      │
│         │  └─────────────────┘  │ Your rank: #12       │      │
│         │                       │ Top 5 list           │      │
│         │  ┌─ Recent History ─┐  │ [View Full →]        │      │
│         │  │ Last 5 disposals │  └─────────────────────┘      │
│         │  │ Time, bin, pts   │                                 │
│         │  └─────────────────┘  ┌─ Achievements ──────┐       │
│         │                       │ Latest 3 badges      │       │
│         │  ┌─ Nearby Bins ───┐  │ [View All →]         │       │
│         │  │ Static list of   │  └─────────────────────┘       │
│         │  │ bin names + codes│                                 │
│         │  └─────────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Single Column Stack)

Cards stack vertically in this order:
1. Profile Card (compact)
2. Points + Reward Progress
3. Active Session (if any — promoted to top when active)
4. Environmental Impact
5. Weekly Progress
6. Recent History (last 3)
7. Leaderboard Preview
8. Achievements (last 2)
9. Nearby Bins (collapsible)

### Interactions
- Points counter animates when new points are awarded (SSE push).
- Active Session widget shows live countdown timer and status transitions.
- "Recent History" rows link to session details.
- Environmental impact values update in real time with animated counters.
- Pull-to-refresh on mobile for manual data refresh.

---

## 6. QR Scan & Active Session (`/scan`, `/session/:id`)

### Scan View

```
┌─────────────────────────────────────────┐
│          Scan a Bin QR Code             │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │      [Camera Viewfinder]          │  │
│  │      (browser camera API)         │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  — OR —                                 │
│                                         │
│  Enter bin code manually:               │
│  [ECOP-BIN-____________] [Submit]       │
│                                         │
│  Note: Position the QR code within      │
│  the viewfinder frame                   │
└─────────────────────────────────────────┘
```

### Active Session View

```
┌─────────────────────────────────────────┐
│          Active Disposal Session        │
│                                         │
│     Bin: ECOP-BIN-LIBRARY               │
│     Location: Main Library Entrance     │
│                                         │
│           ┌──────────────┐              │
│           │              │              │
│           │    00:47      │              │
│           │  (countdown)  │              │
│           │              │              │
│           └──────────────┘              │
│     (Circular progress ring, animated)  │
│                                         │
│  Status: ● WAITING                      │
│  "Drop your plastic bottle in the bin"  │
│                                         │
│  ── Status transitions (SSE) ──         │
│                                         │
│  WAITING → "Drop your bottle now!"      │
│  PROCESSING → "Verifying..." (spinner)  │
│  VERIFIED → 🎉 Confetti + "+10 pts"    │
│  FAILED → ❌ "Verification failed"     │
│  MANUAL_REVIEW → ⏳ "Under review"     │
│  EXPIRED → ⏰ "Session expired"         │
│                                         │
│  [Back to Dashboard]                    │
└─────────────────────────────────────────┘
```

### Interactions
- Countdown: circular progress ring depletes from 60→0, color shifts from green→yellow→red.
- Status dot color: green (WAITING), blue-pulse (PROCESSING), green-check (VERIFIED), red (FAILED), amber (MANUAL_REVIEW/EXPIRED).
- On `VERIFIED`: full-screen confetti burst (1.5s), points ticker animation, achievement unlock animation if applicable.
- On `EXPIRED` or `FAILED`: muted animation, "Try Again" button → `/scan`.
- On `MANUAL_REVIEW`: "We'll notify you when review is complete. Points will be awarded if approved."

---

## 7. Leaderboard Page (`/leaderboard`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    Leaderboards                              │
│                                                             │
│  Segment: [Overall ▾] [Students] [Faculty] [Visitors]       │
│  Period:  [Weekly ▾] [Monthly] [All-Time]                   │
│                                                             │
│  ┌─ Podium (Top 3) ──────────────────────────────────────┐ │
│  │    🥈           🥇           🥉                       │ │
│  │  2nd Place    1st Place    3rd Place                   │ │
│  │  Avatar+Name  Avatar+Name  Avatar+Name                │ │
│  │  380 pts      420 pts      350 pts                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Rankings Table ──────────────────────────────────────┐ │
│  │ Rank │ User          │ Bottles │ Points │             │ │
│  │ 4    │ User D        │ 32      │ 320    │             │ │
│  │ 5    │ User E        │ 30      │ 300    │             │ │
│  │ ...  │ ...           │ ...     │ ...    │             │ │
│  │ 12   │ ★ You         │ 18      │ 180    │ (highlighted) │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Your Stats (Pinned) ─────────────────────────────────┐ │
│  │ Your Rank: #12 │ Points: 180 │ Bottles: 18            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Load More]                                                │
└─────────────────────────────────────────────────────────────┘
```

### Behavior
- Segment tabs filter by `LeaderboardSegment` enum; current user's segment pre-selected on load.
- Period pills switch between `LeaderboardPeriod` enum values.
- User's own row highlighted with accent color and pinned at bottom if outside visible range.
- Podium top 3 shown with elevated cards and medal icons.
- Data sourced from precomputed `leaderboard_snapshots` (refreshed every 15 min per assumption A8).

---

## 8. Reward Store (`/rewards`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                     Reward Store                             │
│                                                             │
│  Your Balance: 420 EcoP Points                              │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ [img]  │ │ [img]  │ │ [img]  │ │ [img]  │              │
│  │ Coffee │ │ Sticker│ │ T-Shirt│ │ Event  │              │
│  │ Voucher│ │ Pack   │ │        │ │ Pass   │              │
│  │        │ │        │ │        │ │        │              │
│  │ 100 pt │ │ 50 pt  │ │ 500 pt │ │ 300 pt │              │
│  │ [✓ Rdm]│ │ [✓ Rdm]│ │ [🔒]  │ │ [✓ Rdm]│              │
│  │ 45 left│ │ ∞      │ │ 12 left│ │ 0 left │              │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
│                                                             │
│  ✓ Rdm = Redeem (enabled)                                  │
│  🔒 = Insufficient points (disabled, shows "Need 80 more") │
│  Out of Stock = button disabled, grayed out                 │
└─────────────────────────────────────────────────────────────┘
```

### Redemption Modal

```
┌─────────────────────────────────────────┐
│         Confirm Redemption              │
│                                         │
│  [Reward Image]                         │
│  Coffee Voucher                         │
│  100 EcoP Points                        │
│                                         │
│  Your balance: 420 → 320 EcoP Points    │
│                                         │
│  [Cancel]  [Confirm Redemption]         │
└─────────────────────────────────────────┘
```

### States
- Insufficient points: button disabled, tooltip "Need X more points."
- Out of stock: card visually muted, "Out of Stock" badge.
- Already redeemed (`one_per_user`): "Already Redeemed" badge, button disabled.
- On successful redemption: success animation, balance updates, card state updates.

---

## 9. Achievements Page (`/achievements`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    My Achievements                           │
│                                                             │
│  Progress: 4 / 9 unlocked                                   │
│  ████████████░░░░░░░░░ 44%                                  │
│                                                             │
│  ── Unlocked ──                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ 🏆     │ │ 🏆     │ │ 🏆     │ │ 🏆     │              │
│  │ First  │ │ 10     │ │ Eco    │ │ Plastic│              │
│  │ Bottle │ │ Bottles│ │Beginner│ │ Hero   │              │
│  │ ✓      │ │ ✓      │ │ ✓      │ │ ✓      │              │
│  │ Jul 15 │ │ Jul 20 │ │ Jul 18 │ │ Jul 25 │              │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
│                                                             │
│  ── Locked ──                                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ 🔒     │ │ 🔒     │ │ 🔒     │ │ 🔒     │ │ 🔒     │  │
│  │ 50     │ │ 100    │ │ Green  │ │ Campus │ │ Eco    │  │
│  │Bottles │ │Bottles │ │Guardian│ │Champion│ │ Legend │  │
│  │ 25/50  │ │ 25/100 │ │ 25/75  │ │ ★      │ │ 25/200 │  │
│  │ █████░ │ │ ██░░░░ │ │ ███░░░ │ │ —      │ │ █░░░░░ │  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Behavior
- Unlocked badges shown in full color with unlock date.
- Locked badges shown grayscale with progress bar toward threshold.
- `CAMPUS_CHAMPION` shows "Reach #1 on weekly leaderboard" instead of a numeric progress.
- On unlock (triggered during disposal flow), achievement card flips/scales with a golden glow animation.

---

## 10. Profile Page (`/profile`)

### Layout

```
┌─────────────────────────────────────────┐
│              My Profile                 │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [Avatar/Initials]               │    │
│  │ Full Name: [_______________]    │    │
│  │ Email: user@example.com (✓)     │    │
│  │ Role: Student                   │    │
│  │ SAP ID: 2024XXXX (if applicable)│    │
│  │ Member Since: Jan 2026          │    │
│  │                                 │    │
│  │ [Save Changes]                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─ Security ─────────────────────┐    │
│  │ [Change Password]              │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌─ Statistics ───────────────────┐    │
│  │ Total Disposals: 42            │    │
│  │ Total Points Earned: 420       │    │
│  │ Points Redeemed: 100           │    │
│  │ Current Balance: 320           │    │
│  │ Achievements Unlocked: 4/9     │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌─ Redemption History ──────────┐     │
│  │ Date | Reward | Points | Status│     │
│  │ ...  │ ...    │ ...    │ ...   │     │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## 11. Disposal History Page (`/history`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│                   Disposal History                           │
│                                                             │
│  Filter: [All ▾] [Verified] [Failed] [Under Review]        │
│  Date Range: [Start] — [End]                                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Date/Time     │ Bin           │ Status    │ Points    │ │
│  │ Jul 28, 15:30 │ BIN-LIBRARY   │ ✓ Verified│ +10      │ │
│  │ Jul 28, 12:15 │ BIN-CAFETERIA │ ✓ Verified│ +10      │ │
│  │ Jul 27, 18:00 │ BIN-HOSTEL-A  │ ⏳ Review │ —        │ │
│  │ Jul 27, 14:22 │ BIN-001       │ ❌ Failed │ —        │ │
│  │ Jul 26, 09:45 │ BIN-LIBRARY   │ ✓ Verified│ +10      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Load More]                                                │
└─────────────────────────────────────────────────────────────┘
```

### Behavior
- Cursor-paginated, 20 items per page.
- Clicking a row expands to show session details (session ID, duration, confidence if available).
- Filter by `SessionStatus` values and date range.

---

## 12. Admin Console Overview

See [14-admin-console.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/14-admin-console.md) for full admin UI specification. The admin console uses the admin sidebar navigation and a content-area layout with data tables, forms, and analytics charts.

Key admin views:
- **Dashboard**: Summary stats (today's sessions, pending reviews, active cameras, flagged users).
- **Manual Review Queue**: List of `MANUAL_REVIEW` sessions with approve/reject actions.
- **User Management**: Searchable user table with role, status, flag indicators.
- **Bin Management**: CRUD for bins with status toggles.
- **Camera Health**: Grid showing each camera's `CameraStatus`, last heartbeat, bin association.
- **Reward Management**: CRUD for reward catalogue.
- **Analytics**: Charts for disposal trends, user growth, reward redemption rates.
