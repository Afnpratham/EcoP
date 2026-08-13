# 03 — User Personas & Journeys

> **Spec file:** `03-personas-journeys.md`  
> **Enums referenced:** `UserRole`, `SessionStatus`, `AchievementKey`, `LeaderboardSegment` — defined in [00-index.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/00-index.md)

---

## 1. Personas

### Persona 1: Arjun — The Eco-Conscious Student

| Attribute | Detail |
|-----------|--------|
| **Role** | `STUDENT` |
| **Age** | 20 |
| **Context** | 2nd-year engineering student at a large Indian university. Disposes 2–4 plastic bottles daily between classes. Uses his phone constantly. Competitive — already tracks fitness and study streaks. Has a SAP ID from enrollment. |
| **Goals** | Earn rewards while doing something good. Compete with friends on leaderboards. Build a visible track record of sustainability. Unlock all achievements. |
| **Pain Points** | Recycling feels invisible — no feedback, no proof he did it. Campus bins are unlabeled, and he doesn't know which ones are for recycling. He's skeptical about whether recyclables actually get recycled. |
| **How EcoP Serves Him** | QR scan takes <10 seconds between classes. Instant verification + point award provides immediate gratification. Leaderboard competition with peers drives daily engagement. Achievement badges give him bragging rights. Dashboard shows tangible environmental impact ("You've prevented 540g of plastic waste"). |
| **Leaderboard Visibility** | Appears in: `OVERALL`, `STUDENTS` segments. Eligible for `CAMPUS_CHAMPION` achievement. |

### Persona 2: Dr. Priya — The Sustainability-Minded Faculty

| Attribute | Detail |
|-----------|--------|
| **Role** | `FACULTY` |
| **Age** | 38 |
| **Context** | Associate professor in Environmental Science. Disposes 1–2 bottles per day (refill habit, lower volume). Deeply cares about sustainability but has limited free time. Wants to set an example for students. Has a SAP ID as a faculty member. |
| **Goals** | Model sustainable behavior for students. Track the campus's collective environmental impact. Use EcoP data in her sustainability course as a case study. Redeem rewards as a secondary benefit. |
| **Pain Points** | Feels the university's sustainability initiatives lack measurability. Doesn't have time for complex apps — needs a frictionless experience. Worries about student data privacy in any campus tech system. |
| **How EcoP Serves Her** | Simple, fast disposal flow respects her time. Dashboard's environmental impact metrics give her real data for classes. Privacy-first architecture (no face recognition, no imagery stored) addresses her concerns directly. Faculty leaderboard segment lets her engage without competing against students' higher volume. |
| **Leaderboard Visibility** | Appears in: `OVERALL`, `FACULTY` segments. |

### Persona 3: Rahul — The Campus Visitor

| Attribute | Detail |
|-----------|--------|
| **Role** | `EXTERNAL_VISITOR` |
| **Age** | 28 |
| **Context** | Visiting the university for a conference. No campus familiarity. No SAP ID. Has a plastic bottle from the campus canteen. Sees a QR code on a recycling bin and is curious. |
| **Goals** | Dispose his bottle properly. Understand what EcoP is. Maybe sign up if it's quick. Not interested in long onboarding or campus-specific features. |
| **Pain Points** | Unfamiliar with campus layout — doesn't know where recycling bins are. Doesn't want to create an account just to throw away a bottle (but needs to for the reward system). Doesn't have a SAP ID and doesn't know what one is. |
| **How EcoP Serves Him** | QR code on the bin draws attention. Registration is quick (email + password, no SAP ID required for visitors). Role selection skips the SAP ID step entirely. He gets points, sees his impact, and might continue using EcoP on return visits. Visitors segment keeps him visible without competing with regular campus users. |
| **Leaderboard Visibility** | Appears in: `OVERALL`, `VISITORS` segments. **Excluded** from `STUDENTS` and `FACULTY` segments. Not eligible for `CAMPUS_CHAMPION` achievement. |

---

## 2. User Journeys

### Journey 1: Arjun's First Disposal (New User)

```mermaid
journey
    title Arjun's First Disposal — New Student User
    section Discovery
      Sees QR code on campus bin: 3: Arjun
      Scans QR with phone camera: 4: Arjun
      Redirected to EcoP landing page: 4: Arjun
    section Registration
      Clicks "Sign Up": 4: Arjun
      Enters name, email, password: 3: Arjun
      Receives confirmation email: 3: Arjun
      Clicks confirmation link: 4: Arjun
      Logs in: 4: Arjun
    section Onboarding (First Login)
      Selects role "Student": 5: Arjun
      Enters SAP ID: 3: Arjun
      Arrives at dashboard: 5: Arjun
    section First Disposal
      Scans bin QR code again: 4: Arjun
      Sees 60-second countdown: 4: Arjun
      Drops bottle in bin: 5: Arjun
      AI verifies disposal: 5: Arjun
      Confetti animation + "+10 EcoP Points": 5: Arjun
      "First Bottle" achievement unlocks: 5: Arjun
      Dashboard updates with points and impact: 5: Arjun
    section Engagement
      Checks leaderboard rank: 4: Arjun
      Browses reward store: 4: Arjun
      Plans next disposal: 4: Arjun
```

### Journey 2: Dr. Priya's Routine Disposal (Returning User)

```mermaid
journey
    title Dr. Priya's Quick Disposal — Returning Faculty
    section Quick Disposal
      Walks to office bin after lunch: 3: Priya
      Scans QR code (already logged in): 5: Priya
      Session starts, 60s countdown: 4: Priya
      Drops bottle in bin: 5: Priya
      AI verifies — "VERIFIED": 5: Priya
      Points awarded, brief celebration: 5: Priya
    section Dashboard Check
      Views weekly progress: 4: Priya
      Notes cumulative impact stats: 5: Priya
      Sees faculty leaderboard rank: 4: Priya
    section Reward
      Has accumulated 500 points: 4: Priya
      Redeems a campus coffee voucher: 5: Priya
```

### Journey 3: Rahul's Visitor Experience

```mermaid
journey
    title Rahul's Visitor Experience — First & Only Visit
    section Discovery
      Finishes water bottle at conference: 3: Rahul
      Sees EcoP QR code on nearby bin: 4: Rahul
      Scans QR code: 4: Rahul
    section Quick Registration
      Redirected to landing page: 3: Rahul
      Clicks "Sign Up": 3: Rahul
      Enters name, email, password: 3: Rahul
      Verifies email: 3: Rahul
      Logs in: 4: Rahul
    section Onboarding
      Selects "External Visitor": 5: Rahul
      No SAP ID prompt — skipped: 5: Rahul
      Arrives at dashboard: 4: Rahul
    section Disposal
      Scans bin QR again: 4: Rahul
      60-second countdown: 3: Rahul
      Drops bottle: 5: Rahul
      Verified — "+10 EcoP Points": 5: Rahul
      Sees impact: "18g plastic waste prevented": 4: Rahul
    section Departure
      Checks visitor leaderboard — ranked #1: 5: Rahul
      May return in future visits: 3: Rahul
```

### Journey 4: Failed Disposal — Expired Session

```mermaid
journey
    title Failed Disposal — Session Expires
    section Start
      Scans QR code: 4: User
      Session starts with countdown: 4: User
    section Delay
      Gets distracted by a phone call: 2: User
      Countdown reaches 0: 1: User
      Session status → EXPIRED: 1: User
    section Recovery
      UI shows "Session expired" message: 3: User
      Prompt to scan QR again for new session: 4: User
      Scans again, new session starts: 4: User
      Disposes bottle successfully this time: 5: User
```

### Journey 5: Manual Review Flow

```mermaid
journey
    title Manual Review — Borderline Confidence
    section Disposal
      User scans QR and disposes bottle: 4: User
      AI detects with confidence 0.72: 3: User
      Session status → MANUAL_REVIEW: 3: User
    section User Experience
      UI shows "Under review" status: 3: User
      User continues their day: 3: User
    section Admin Review
      Admin sees session in review queue: 4: Admin
      Watches event metadata: 4: Admin
      Approves the disposal: 5: Admin
    section Resolution
      Session status → VERIFIED: 5: System
      Points awarded to user: 5: System
      User receives notification on dashboard: 5: User
```

### Journey 6: Admin Managing Rewards

```mermaid
journey
    title Admin — Managing the Reward Catalogue
    section Access
      Admin logs into platform: 4: Admin
      Navigates to Admin Console: 4: Admin
    section Reward Management
      Opens Rewards section: 4: Admin
      Creates new reward — "Campus Coffee Voucher": 5: Admin
      Sets: 100 points, 50 quantity, image, description: 4: Admin
      Saves reward: 5: Admin
    section Monitoring
      Checks redemption analytics: 4: Admin
      Sees voucher is popular — adds 50 more: 5: Admin
      Reviews manual-review queue: 4: Admin
      Approves 3 borderline disposals: 5: Admin
    section Health Check
      Views camera health dashboard: 4: Admin
      Notices one camera is DEGRADED: 3: Admin
      Creates maintenance ticket: 4: Admin
```

---

## 3. Persona–Feature Matrix

| Feature | Arjun (Student) | Dr. Priya (Faculty) | Rahul (Visitor) |
|---------|:---:|:---:|:---:|
| Email registration | ✅ | ✅ | ✅ |
| SAP ID onboarding | ✅ | ✅ | ❌ (skipped) |
| QR disposal flow | ✅ | ✅ | ✅ |
| Points earning | ✅ | ✅ | ✅ |
| Reward redemption | ✅ | ✅ | ✅ |
| Student leaderboard | ✅ | ❌ | ❌ |
| Faculty leaderboard | ❌ | ✅ | ❌ |
| Visitor leaderboard | ❌ | ❌ | ✅ |
| Overall leaderboard | ✅ | ✅ | ✅ |
| Campus Champion achievement | ✅ | ✅ | ❌ |
| All other achievements | ✅ | ✅ | ✅ |
| Dashboard environmental impact | ✅ | ✅ | ✅ |
| Admin console | ❌ | ❌ | ❌ |
