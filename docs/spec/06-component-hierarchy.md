# 06 — Component Hierarchy

> **Spec file:** `06-component-hierarchy.md`  
> **Enums referenced:** `SessionStatus`, `UserRole`, `LeaderboardSegment`, `LeaderboardPeriod`, `AchievementKey`, `RedemptionStatus`, `CameraStatus`, `BinStatus` — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)  
> **UI specs:** See [05-ux-wireframes.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/05-ux-wireframes.md) for visual layout references.

---

## 1. Shared/Global Components

These components are used across multiple pages and live in a shared `components/` directory.

```
components/
├── layout/
│   ├── RootLayout              — HTML head, metadata, font loading, theme provider
│   ├── PublicLayout             — Navbar + footer for unauthenticated pages
│   ├── AuthLayout               — Centered card layout for login/register/reset
│   ├── AppLayout                — Sidebar + main content for authenticated pages
│   └── AdminLayout              — Admin sidebar + main content for admin pages
│
├── navigation/
│   ├── PublicNavbar             — Logo, nav links, Login/Signup buttons
│   ├── AppSidebar               — Authenticated user sidebar (desktop)
│   ├── BottomTabBar             — Authenticated user bottom nav (mobile)
│   ├── AdminSidebar             — Admin console sidebar
│   ├── NavLink                  — Single navigation link with active state
│   └── UserMenu                 — Avatar dropdown (profile, logout)
│
├── ui/  (shadcn/ui primitives + custom)
│   ├── Button                   — Primary, secondary, ghost, destructive variants
│   ├── Card                     — Container with header, content, footer slots
│   ├── Input                    — Text input with label, error state, helper text
│   ├── Select                   — Dropdown select with search
│   ├── Badge                    — Status/role badges with color coding
│   ├── Avatar                   — User avatar with initials fallback
│   ├── Dialog                   — Modal dialog
│   ├── Toast                    — Notification toasts (success, error, info)
│   ├── Tooltip                  — Hover tooltip
│   ├── Progress                 — Linear and circular progress indicators
│   ├── Skeleton                 — Loading skeleton placeholders
│   ├── DataTable                — Sortable, filterable table with pagination
│   ├── EmptyState               — Illustrated empty state with action CTA
│   └── ConfirmDialog            — Confirmation modal with cancel/confirm
│
├── feedback/
│   ├── LoadingSpinner           — Page/section loading indicator
│   ├── ErrorBoundary            — React error boundary with fallback UI
│   ├── ErrorMessage             — Inline error display
│   └── SuccessAnimation         — Check mark animation for success states
│
├── data-display/
│   ├── StatCard                 — Number + label + optional trend indicator
│   ├── AnimatedCounter          — Number that ticks up/down on value change
│   ├── PointsBadge              — "+10 EcoP Points" styled badge
│   ├── EnvironmentalImpact      — Plastic/CO₂ impact display with icons
│   ├── CountdownTimer           — Circular countdown ring (used in sessions)
│   ├── StatusDot                — Colored dot for status indication
│   └── DateDisplay              — Formatted date/time with relative option
│
└── effects/
    ├── ConfettiOverlay          — Full-screen confetti burst (canvas-based)
    ├── AchievementUnlock        — Badge reveal animation (scale + glow)
    └── PageTransition           — Framer Motion page enter/exit wrapper
```

---

## 2. Landing Page Component Tree

```
LandingPage
├── PublicLayout
│   ├── PublicNavbar
│   │   ├── Logo
│   │   ├── NavLink × 4 (How It Works, About, Impact, CTA)
│   │   ├── Button (Log In)
│   │   └── Button (Sign Up)
│   │
│   ├── HeroSection
│   │   ├── HeroHeading ("Rewarding Sustainable Behaviour Through AI")
│   │   ├── HeroSubheading
│   │   ├── Button (Get Started → /register)
│   │   ├── Button (Learn More → scroll)
│   │   └── HeroIllustration (animated SVG/illustration)
│   │
│   ├── LiveStatsBar
│   │   ├── StatCard (Total Bottles) + AnimatedCounter
│   │   ├── StatCard (Plastic Saved) + AnimatedCounter
│   │   ├── StatCard (CO₂ Avoided) + AnimatedCounter
│   │   └── StatCard (Active Users) + AnimatedCounter
│   │
│   ├── HowItWorksSection
│   │   ├── StepCard (1: Scan QR) — icon, title, description
│   │   ├── StepCard (2: Dispose) — icon, title, description
│   │   └── StepCard (3: Earn) — icon, title, description
│   │
│   ├── AboutAISection
│   │   ├── SectionHeading
│   │   ├── PrivacyPoint × 3 (no face rec, no images, session-linked only)
│   │   └── PrivacyIllustration
│   │
│   ├── EnvironmentalImpactSection
│   │   ├── AnimatedCounter (cumulative impact)
│   │   └── ImpactComparison (visual analogy)
│   │
│   ├── RewardsPreviewSection
│   │   ├── SectionHeading
│   │   ├── RewardPreviewCard × 4
│   │   └── Button (View All → /rewards)
│   │
│   ├── LeaderboardPreviewSection
│   │   ├── SectionHeading
│   │   ├── LeaderboardRow × 5
│   │   └── Button (View Full → /leaderboard)
│   │
│   ├── CTASection
│   │   ├── CTAHeading
│   │   └── Button (Create Account → /register)
│   │
│   └── Footer
│       ├── FooterLinks (Privacy, Terms, About)
│       └── Copyright
```

---

## 3. Dashboard Component Tree

```
DashboardPage
├── AppLayout
│   ├── AppSidebar (desktop) / BottomTabBar (mobile)
│   │
│   └── DashboardContent
│       ├── ProfileCard
│       │   ├── Avatar
│       │   ├── UserName
│       │   ├── Badge (role)
│       │   └── MemberSince (DateDisplay)
│       │
│       ├── PointsCard
│       │   ├── AnimatedCounter (current balance)
│       │   ├── PointsBadge (latest award, if recent)
│       │   └── RewardProgress
│       │       ├── Progress (bar toward next reward threshold)
│       │       └── Label ("80 points to Coffee Voucher")
│       │
│       ├── EnvironmentalImpactCard
│       │   ├── EnvironmentalImpact
│       │   │   ├── StatCard (bottles recycled)
│       │   │   ├── StatCard (plastic prevented, g)
│       │   │   └── StatCard (CO₂e avoided, g)
│       │
│       ├── ActiveSessionCard (conditional: shown only if session active)
│       │   ├── BinInfo (code + location)
│       │   ├── CountdownTimer (circular, SSE-driven)
│       │   ├── StatusDot + StatusLabel
│       │   └── ConfettiOverlay (triggered on VERIFIED)
│       │
│       ├── WeeklyProgressCard
│       │   └── BarChart (7 bars, Mon–Sun, this week vs. last)
│       │
│       ├── RecentHistoryCard
│       │   ├── HistoryRow × 5
│       │   │   ├── DateDisplay
│       │   │   ├── BinCode
│       │   │   ├── Badge (status)
│       │   │   └── PointsBadge (if verified)
│       │   └── Button (View All → /history)
│       │
│       ├── LeaderboardPreviewCard
│       │   ├── StatCard (Your Rank: #12)
│       │   ├── LeaderboardRow × 5
│       │   └── Button (View Full → /leaderboard)
│       │
│       ├── AchievementsPreviewCard
│       │   ├── AchievementBadge × 3 (latest unlocked)
│       │   └── Button (View All → /achievements)
│       │
│       └── NearbyBinsCard
│           ├── BinListItem × N
│           │   ├── BinCode
│           │   ├── BinLocation (description)
│           │   └── StatusDot (BinStatus)
│           └── Note ("V2: Map view coming soon")
```

---

## 4. QR Scan & Session Component Tree

```
ScanPage
├── AppLayout
│   └── ScanContent
│       ├── QRScanner
│       │   ├── CameraViewfinder (browser MediaDevices API)
│       │   ├── ScanOverlay (targeting frame)
│       │   └── ScanFeedback (haptic/visual on code detected)
│       │
│       ├── ManualEntryForm
│       │   ├── Input (bin code, prefilled from ?bin= query param)
│       │   └── Button (Submit)
│       │
│       └── ErrorMessage (BIN_NOT_FOUND, BIN_INACTIVE, BIN_BUSY, RATE_LIMIT_EXCEEDED)

SessionPage (after session created)
├── AppLayout
│   └── SessionContent
│       ├── BinInfoHeader
│       │   ├── BinCode
│       │   └── BinLocation
│       │
│       ├── CountdownTimer (circular progress ring)
│       │   ├── TimeRemaining (seconds, large font)
│       │   └── ProgressRing (SVG, depletes clockwise)
│       │
│       ├── SessionStatusDisplay
│       │   ├── StatusDot (colored per SessionStatus)
│       │   ├── StatusLabel (human-readable text)
│       │   └── StatusInstructions (contextual guidance)
│       │
│       ├── ResultOverlay (shown on terminal state)
│       │   ├── ConfettiOverlay (VERIFIED only)
│       │   ├── PointsBadge ("+10 EcoP Points", VERIFIED only)
│       │   ├── AchievementUnlock (if new achievement, VERIFIED only)
│       │   ├── ErrorMessage (FAILED / EXPIRED)
│       │   └── ReviewMessage (MANUAL_REVIEW)
│       │
│       └── ActionButtons
│           ├── Button (Back to Dashboard)
│           └── Button (Scan Another, on terminal states)
```

---

## 5. Leaderboard Component Tree

```
LeaderboardPage
├── AppLayout
│   └── LeaderboardContent
│       ├── SegmentTabs
│       │   └── Tab × 4 (Overall, Students, Faculty, Visitors)
│       │
│       ├── PeriodPills
│       │   └── Pill × 3 (Weekly, Monthly, All-Time)
│       │
│       ├── PodiumDisplay (top 3)
│       │   ├── PodiumCard (2nd place)
│       │   ├── PodiumCard (1st place, elevated)
│       │   └── PodiumCard (3rd place)
│       │
│       ├── RankingsTable
│       │   └── DataTable
│       │       ├── RankingRow × N
│       │       │   ├── RankNumber
│       │       │   ├── Avatar + UserName
│       │       │   ├── BottleCount
│       │       │   └── PointsTotal
│       │       └── CursorPagination
│       │
│       └── UserRankCard (pinned at bottom)
│           ├── RankNumber
│           ├── PointsTotal
│           └── BottleCount
```

---

## 6. Reward Store Component Tree

```
RewardsPage
├── AppLayout
│   └── RewardsContent
│       ├── BalanceHeader
│       │   └── AnimatedCounter (current points balance)
│       │
│       ├── RewardsGrid
│       │   └── RewardCard × N
│       │       ├── RewardImage
│       │       ├── RewardName
│       │       ├── RewardDescription
│       │       ├── PointsCost
│       │       ├── AvailabilityBadge (quantity or "Unlimited")
│       │       ├── StatusBadge (Out of Stock / Already Redeemed)
│       │       └── Button (Redeem / Disabled states)
│       │
│       └── RedemptionDialog
│           ├── RewardImage
│           ├── RewardDetails
│           ├── BalancePreview ("420 → 320 EcoP Points")
│           ├── Button (Cancel)
│           └── Button (Confirm Redemption)
```

---

## 7. Auth Pages Component Tree

```
RegisterPage / LoginPage / ForgotPasswordPage / ResetPasswordPage
├── AuthLayout
│   ├── Logo
│   ├── FormHeading
│   ├── AuthForm
│   │   ├── Input × N (per form requirements)
│   │   ├── PasswordStrengthIndicator (register only)
│   │   ├── Checkbox (terms agreement, register only)
│   │   ├── Button (submit)
│   │   └── ErrorMessage
│   ├── AuthLink (switch between login/register)
│   └── FutureProviders (disabled OAuth/SSO buttons, register/login only)

OnboardingPage
├── AuthLayout (simplified, no nav)
│   ├── WelcomeHeading
│   ├── RoleSelector
│   │   └── RoleCard × 3 (Student, Faculty, Visitor)
│   │       ├── RoleIcon
│   │       ├── RoleLabel
│   │       └── RoleDescription
│   ├── SAPIDInput (conditional: shown for Student/Faculty only)
│   └── Button (Continue to Dashboard)
```

---

## 8. Admin Console Component Tree

```
AdminLayout
├── AdminSidebar
│   ├── Logo (EcoP Admin)
│   ├── NavLink × 14 (all admin routes)
│   ├── Button (Back to Platform)
│   └── Button (Log Out)
│
└── AdminContent
    ├── AdminDashboardPage
    │   ├── StatCard (Today's Sessions)
    │   ├── StatCard (Pending Reviews)
    │   ├── StatCard (Active Cameras)
    │   ├── StatCard (Flagged Users)
    │   ├── RecentActivityFeed
    │   └── QuickActions (Review Queue, Camera Health)
    │
    ├── AdminUsersPage
    │   ├── SearchInput
    │   ├── FilterBar (role, flagged status)
    │   ├── DataTable (users)
    │   │   └── UserRow (name, email, role, bottles, points, flagged badge)
    │   └── UserDetailDrawer (expanded view of user + actions)
    │
    ├── AdminBinsPage
    │   ├── DataTable (bins)
    │   │   └── BinRow (code, location, status, camera, session count)
    │   ├── BinFormDialog (create/edit)
    │   └── BinStatusToggle
    │
    ├── AdminCamerasPage
    │   ├── CameraGrid
    │   │   └── CameraCard × N
    │   │       ├── CameraID
    │   │       ├── StatusDot (CameraStatus)
    │   │       ├── LastHeartbeat (DateDisplay)
    │   │       ├── AssociatedBin
    │   │       └── ErrorLog (if DEGRADED)
    │
    ├── AdminReviewPage
    │   ├── ReviewQueue
    │   │   └── ReviewCard × N
    │   │       ├── SessionInfo (ID, bin, user, timestamp)
    │   │       ├── ConfidenceScore
    │   │       ├── Button (Approve)
    │   │       └── Button (Reject)
    │
    ├── AdminRewardsPage
    │   ├── DataTable (rewards)
    │   ├── RewardFormDialog (create/edit)
    │   └── RedemptionHistory (per reward)
    │
    ├── AdminPointRulesPage
    │   ├── DataTable (point_rules)
    │   └── PointRuleEditForm
    │
    ├── AdminAnalyticsPage
    │   ├── DisposalTrendChart (line chart, daily/weekly/monthly)
    │   ├── UserGrowthChart
    │   ├── RedemptionRateChart
    │   ├── TopBinsChart (bar chart)
    │   └── PeakHoursHeatmap
    │
    ├── AdminSettingsPage
    │   ├── SettingsForm
    │   │   ├── Input (confidence_threshold_verified)
    │   │   ├── Input (confidence_threshold_manual_review)
    │   │   ├── Input (max_sessions_per_hour)
    │   │   ├── Input (max_sessions_per_day)
    │   │   ├── Input (plastic_grams_per_bottle)
    │   │   ├── Input (co2e_grams_per_bottle)
    │   │   └── Button (Save Settings)
    │
    ├── AdminFailedEventsPage
    │   ├── DataTable (failed_events)
    │   │   └── FailedEventRow (session_id, bin_id, error, timestamp, retry count)
    │   └── Button (Retry / Dismiss per event)
    │
    └── AdminFlaggedUsersPage
        ├── DataTable (flagged users)
        │   └── FlaggedUserRow (name, verified count, percentile, review status)
        └── Button (Clear Flag / Review)
```
