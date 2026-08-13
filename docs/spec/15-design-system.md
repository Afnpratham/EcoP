# 15 — Design System

> **Spec file:** `15-design-system.md`  
> **Component tree:** See [06-component-hierarchy.md](file:///Users/prathambhat/Desktop/EcoP/docs/spec/06-component-hierarchy.md)

---

## 1. Brand Identity

| Attribute | Value |
|-----------|-------|
| Name | **EcoP** |
| Tagline | *Rewarding Sustainable Behaviour Through AI* |
| Tone | Modern, minimal, premium, environment-focused |
| Style | Clean lines, rounded components, soft shadows, nature-inspired palette |
| Logo | "EcoP" wordmark — geometric sans-serif, with the "E" accented in primary green. Compact leaf icon variant for small contexts. |

---

## 2. Color Palette

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#16A34A` | Primary green — buttons, links, active states |
| `--color-primary-hover` | `#15803D` | Primary hover state |
| `--color-primary-light` | `#DCFCE7` | Primary background tint (badges, highlights) |
| `--color-primary-dark` | `#166534` | Primary emphasis (headings on green sections) |
| `--color-secondary` | `#F0FDF4` | Light green background for cards, sections |
| `--color-accent` | `#A16207` | Earth-tone accent — warm amber for special elements |
| `--color-accent-light` | `#FEF9C3` | Accent background tint |
| `--color-accent-hover` | `#854D0E` | Accent hover state |
| `--color-success` | `#16A34A` | Success states (same as primary) |
| `--color-warning` | `#EAB308` | Warning states |
| `--color-error` | `#DC2626` | Error states, destructive actions |
| `--color-info` | `#2563EB` | Informational states |
| `--color-background` | `#FFFFFF` | Page background |
| `--color-surface` | `#F9FAFB` | Card/panel background |
| `--color-surface-elevated` | `#FFFFFF` | Elevated card with shadow |
| `--color-border` | `#E5E7EB` | Default borders |
| `--color-border-subtle` | `#F3F4F6` | Subtle dividers |
| `--color-text-primary` | `#111827` | Primary text |
| `--color-text-secondary` | `#6B7280` | Secondary/muted text |
| `--color-text-tertiary` | `#9CA3AF` | Placeholder, disabled text |
| `--color-text-on-primary` | `#FFFFFF` | Text on primary-colored backgrounds |

### Dark Mode

| Token | Hex (Dark) | Mapping |
|-------|-----------|---------|
| `--color-primary` | `#22C55E` | Brighter green for dark backgrounds |
| `--color-primary-hover` | `#16A34A` | |
| `--color-primary-light` | `#052E16` | Dark green tint |
| `--color-primary-dark` | `#4ADE80` | |
| `--color-secondary` | `#0A1F0D` | Very dark green |
| `--color-accent` | `#D97706` | Brighter amber |
| `--color-accent-light` | `#451A03` | |
| `--color-background` | `#0F172A` | Slate-900 |
| `--color-surface` | `#1E293B` | Slate-800 |
| `--color-surface-elevated` | `#334155` | Slate-700 |
| `--color-border` | `#334155` | |
| `--color-border-subtle` | `#1E293B` | |
| `--color-text-primary` | `#F1F5F9` | |
| `--color-text-secondary` | `#94A3B8` | |
| `--color-text-tertiary` | `#64748B` | |

### Semantic Status Colors

| Status | Light | Dark | Used For |
|--------|-------|------|----------|
| `ACTIVE` / `ONLINE` / `VERIFIED` | `#16A34A` | `#22C55E` | Success states |
| `WAITING` | `#2563EB` | `#3B82F6` | In-progress/pending |
| `PROCESSING` | `#7C3AED` | `#8B5CF6` | Active processing |
| `MANUAL_REVIEW` | `#EAB308` | `#FACC15` | Needs attention |
| `DEGRADED` / `WARNING` | `#F59E0B` | `#FBBF24` | Warning |
| `FAILED` / `OFFLINE` / `INACTIVE` | `#DC2626` | `#EF4444` | Error/inactive |
| `EXPIRED` | `#6B7280` | `#9CA3AF` | Neutral/past |
| `MAINTENANCE` | `#06B6D4` | `#22D3EE` | Special state |

---

## 3. Typography

### Font Pairing

| Role | Font Family | Weight | Source |
|------|-------------|--------|--------|
| Headings | **Outfit** | 600 (SemiBold), 700 (Bold) | Google Fonts |
| Body | **Inter** | 400 (Regular), 500 (Medium), 600 (SemiBold) | Google Fonts |
| Mono (code/IDs) | **JetBrains Mono** | 400 | Google Fonts |

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|------------|--------|-------|
| `--text-display` | 48px / 3rem | 1.1 | Outfit 700 | Hero headline |
| `--text-h1` | 36px / 2.25rem | 1.2 | Outfit 700 | Page titles |
| `--text-h2` | 30px / 1.875rem | 1.25 | Outfit 600 | Section headings |
| `--text-h3` | 24px / 1.5rem | 1.3 | Outfit 600 | Card headings |
| `--text-h4` | 20px / 1.25rem | 1.35 | Inter 600 | Sub-headings |
| `--text-body` | 16px / 1rem | 1.5 | Inter 400 | Default body text |
| `--text-body-sm` | 14px / 0.875rem | 1.5 | Inter 400 | Secondary text |
| `--text-caption` | 12px / 0.75rem | 1.4 | Inter 500 | Captions, labels |
| `--text-stat` | 32px / 2rem | 1.1 | Outfit 700 | Dashboard stat numbers |
| `--text-stat-lg` | 48px / 3rem | 1.0 | Outfit 700 | Landing page stat counters |

---

## 4. Spacing System

8px base grid.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing (icon gaps) |
| `--space-2` | 8px | Compact spacing |
| `--space-3` | 12px | Default inner padding |
| `--space-4` | 16px | Standard padding, gaps |
| `--space-5` | 20px | Medium spacing |
| `--space-6` | 24px | Card inner padding |
| `--space-8` | 32px | Section spacing |
| `--space-10` | 40px | Large section gaps |
| `--space-12` | 48px | Page section separators |
| `--space-16` | 64px | Major section breaks |
| `--space-20` | 80px | Landing page section padding |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Small elements (badges, chips) |
| `--radius-md` | 8px | Inputs, small cards |
| `--radius-lg` | 12px | Cards, panels |
| `--radius-xl` | 16px | Large cards, modals |
| `--radius-2xl` | 24px | Feature cards, hero elements |
| `--radius-full` | 9999px | Circular elements (avatars, round buttons) |

---

## 6. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | Cards |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Elevated cards, modals |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | Dialogs, dropdowns |
| `--shadow-glow-green` | `0 0 20px rgba(22, 163, 74, 0.3)` | Achievement unlock, success glow |
| `--shadow-glow-amber` | `0 0 20px rgba(161, 98, 7, 0.3)` | Accent glow |

---

## 7. Component Styling

### Buttons

| Variant | Background | Text | Border | Hover | Active |
|---------|-----------|------|--------|-------|--------|
| Primary | `--color-primary` | White | None | `--color-primary-hover` | Darken 5% |
| Secondary | `--color-surface` | `--color-text-primary` | `--color-border` | `--color-surface-elevated` | — |
| Ghost | Transparent | `--color-primary` | None | `--color-primary-light` | — |
| Destructive | `--color-error` | White | None | Darken 10% | — |
| Disabled | `--color-border` | `--color-text-tertiary` | None | *(no hover)* | — |

All buttons: `border-radius: --radius-md`, `padding: --space-2 --space-4`, `font: Inter 500 14px`.
Transition: `all 150ms ease-in-out`.

### Cards

- Background: `--color-surface-elevated`
- Border: 1px `--color-border-subtle`
- Border-radius: `--radius-lg`
- Shadow: `--shadow-md`
- Padding: `--space-6`
- Hover (interactive cards): `--shadow-lg` + subtle translate-y(-2px)

### Inputs

- Background: `--color-background`
- Border: 1px `--color-border`
- Border-radius: `--radius-md`
- Padding: `--space-2 --space-3`
- Focus: 2px ring `--color-primary` with 2px offset
- Error: border color `--color-error`, ring `--color-error`

### Badges

- Border-radius: `--radius-full`
- Padding: `--space-1 --space-2`
- Font: `--text-caption`, weight 500
- Variants by status color (see §2 semantic colors)

---

## 8. Animations

### Library Assignments

| Animation Type | Library | Reason |
|---------------|---------|--------|
| Page transitions | Framer Motion | Smooth enter/exit with layout animations |
| UI micro-interactions | Framer Motion | Hover, tap, scale effects |
| Stat counter tick-up | Framer Motion `useMotionValue` + `useSpring` | Smooth number interpolation |
| Confetti celebration | canvas-confetti | Lightweight, canvas-based, no DOM overhead |
| Achievement unlock | Framer Motion | Scale + rotate + glow keyframes |
| Countdown ring | SVG + Framer Motion | Animated SVG stroke-dashoffset |
| Skeleton loading | CSS keyframes | Shimmer effect, no JS needed |
| Progress bars | Framer Motion `animate` | Width transition with spring physics |

### Specific Animation Specs

**Page Transitions:**
- Enter: fade in + slide up 20px, duration 300ms, ease-out.
- Exit: fade out + slide down 10px, duration 200ms, ease-in.

**Stat Counter (AnimatedCounter):**
- Spring animation from previous to current value.
- Duration: ~800ms with spring damping.
- Triggered on value change or scroll-into-view.

**Confetti (Disposal Verified):**
- Full-screen burst from center-bottom.
- Particle count: 100.
- Duration: 1.5s.
- Colors: `['#16A34A', '#22C55E', '#A16207', '#D97706', '#F0FDF4']`.
- Gravity: 0.8.
- Triggered immediately on `session.verified` SSE event.

**Achievement Unlock:**
- Scale from 0.5 → 1.1 → 1.0 (bounce).
- Rotate -5° → 5° → 0° (wobble).
- Golden glow ring expands (box-shadow animation).
- Duration: 800ms.
- Triggered after confetti (200ms delay).

**Countdown Ring:**
- SVG circle with `stroke-dasharray` = circumference.
- `stroke-dashoffset` animates from 0 to circumference over 60s.
- Color transitions: green (60–20s) → yellow (20–10s) → red (10–0s).
- Pulse animation in last 10s.

**Hover Effects:**
- Cards: translateY(-2px) + shadow increase, 150ms.
- Buttons: background darken + subtle scale(1.02), 100ms.
- Nav links: underline slides in from left, 200ms.

**Loading Skeletons:**
- CSS shimmer: gradient animation left-to-right, 1.5s infinite.
- Background: `--color-surface` with `--color-border-subtle` gradient.

---

## 9. Responsive Design

### Breakpoints

| Name | Width | Tailwind Class | Description |
|------|-------|---------------|-------------|
| Mobile (default) | 0–639px | default | Single column, bottom tab bar |
| Tablet | 640–1023px | `sm:` and `md:` | 2-column grid, collapsible sidebar |
| Desktop | 1024–1279px | `lg:` | Full sidebar, 2–3 column grid |
| Wide Desktop | 1280–1535px | `xl:` | 3-column grid, wider content |
| Ultra Wide | 1536px+ | `2xl:` | Max-width container, centered |

### Tailwind Config Breakpoints

```
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px'
}
```

### Layout Rules

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Navigation | Bottom tab bar (4 tabs + "More") | Collapsible sidebar | Fixed sidebar (240px) |
| Dashboard grid | 1 column | 2 columns | 3 columns |
| Stat cards | 2×2 grid | 4 columns | 4 columns |
| Reward cards | 1 column | 2 columns | 3–4 columns |
| Leaderboard | Full width | Full width | Side panel layout |
| Admin sidebar | Hamburger overlay | Collapsible | Fixed (280px) |
| Data tables | Horizontal scroll | Responsive | Full width |
| Modals | Full screen | Centered, 480px max | Centered, 480px max |

### Container Max Width

```
max-width: 1280px (xl breakpoint)
margin: 0 auto
padding: 0 16px (mobile) / 0 24px (tablet) / 0 32px (desktop)
```

---

## 10. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| WCAG Level | AA compliance minimum |
| Color contrast | ≥4.5:1 for normal text, ≥3:1 for large text (all palette colors verified) |
| Focus indicators | 2px solid `--color-primary` ring with 2px offset, visible in both light and dark mode |
| Keyboard navigation | All interactive elements reachable via Tab; logical tab order; Enter/Space to activate |
| Screen readers | All images have `alt` text; icons have `aria-label`; dynamic content uses `aria-live` regions |
| Reduced motion | `prefers-reduced-motion: reduce` disables confetti, page transitions, and counter animations |
| Labels | All form inputs have visible `<label>` elements + `htmlFor` association |
| Error messages | Associated with inputs via `aria-describedby`; error states announced to screen readers |
| Skip link | "Skip to main content" link visible on focus |
| Color independence | Status is never conveyed by color alone — always paired with text labels or icons |

---

## 11. Illustration Style

| Attribute | Guideline |
|-----------|-----------|
| Style | Flat illustration with soft gradients, no hard outlines |
| Colors | Use palette colors (greens, earth tones, neutrals) |
| Subjects | Nature scenes, recycling motifs, sustainability imagery |
| People | Inclusive, diverse, stylized (not photorealistic) |
| Icons | Line icons (Lucide React set — included with shadcn/ui) |
| Empty states | Custom illustrations with action-oriented messaging |
