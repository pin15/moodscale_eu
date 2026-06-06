# StatCounter (doc 12 — Stat Counters & Badges)

Numbers roll up to their value when scrolled into view; the surrounding badge
scales in alongside (doc 08 `scale-in`). Used in "At a Glance", the footer badge
strip, and "Women Leading Change".

## Files
- `format.ts` — GSAP-free formatter (year-bug guard); used by both server render and client tween.
- `statCounter.ts` — `initStatCounter(root)`: per-stat GSAP count-up on ScrollTrigger; returns teardown.
- `StatCounter.astro` — renders the row; server-renders the true final value; wires client init.
- `StatCounter.module.css` — tabular-nums, on-dark variant, screen-reader value helper.
- Demo: `src/pages/_demos/stat-counter.astro`.

## Usage
```astro
import StatCounter, { type Stat } from "@/components/fx/StatCounter/StatCounter.astro";
const stats: Stat[] = [
  { to: 80, suffix: "%+", label: "Women-Led Team" },
  { to: 2023, format: "plain", label: "Founded in India" }, // "plain" → no comma
];
---
<StatCounter stats={stats} />
<StatCounter stats={stats} onDark />        {/* footer badge strip */}
<StatCounter stats={stats} staticMode />    {/* editor preview, no animation */}
```
- `format: "plain"` → no thousands separators (years). Default → locale-grouped.
- `suffix` / `prefix` for "%", "+", "k", etc.

## Prereqs (separate sessions — not built here)
- doc 00 Foundation: `@/lib/types`, design tokens.
- doc 01 Motion Core: `@/components/motion/gsap.client` (`gsap`, ScrollTrigger registered) and `@/components/motion/reducedMotion` (`prefersReducedMotion`).

## Acceptance criteria
- [ ] Numbers count from 0 to target over ~1.6s when scrolled into view, once.
- [ ] Years render without separators (2023, not 2,023); percentages keep their suffix.
- [ ] No layout shift as digits change (tabular-nums / reserved width).
- [ ] Reduced motion / no-JS → correct final number shown, no animation.
- [ ] Screen readers announce the final value, not the ticking.

## Notes
- The true value is server-rendered into the markup → correct with no JS and under
  reduced motion. JS resets to 0 and counts up only when motion is allowed.
- The ticking number is `aria-hidden`; a visually-hidden static copy carries the
  settled value to screen readers (no `aria-live` on the ticking number).
- One tween per stat, `once: true`. Scope each init to its `[data-fx="stat-counter"]`
  root; cleaned up on `astro:before-swap`.
