# WavyDivider — Wavy Section Dividers (SVG Morph)

Organic green section edges that become liquid hand-offs between story beats.
The wave morphs slowly (ambient) or reshapes on scroll (scroll mode).

Built per `MD EU/10-wavy-dividers-morph.md` and the Foundation contract
(`MD EU/00`) + Motion Core (`MD EU/01`).

## Files
- `WavyDivider.astro` — markup, scoped styles, per-page mount/teardown.
- `wavyDivider.ts` — `initWavyDivider` (`FxInit`): the GSAP morph logic.

## Usage
```astro
import WavyDivider from "@/components/fx/WavyDivider/WavyDivider.astro";

<!-- bridge the previous section INTO a forest block -->
<WavyDivider mode="ambient" fill="var(--ms-forest)" />

<!-- upward hill -->
<WavyDivider mode="ambient" fill="var(--ms-moss)" flip />

<!-- reshape on scroll (use sparingly) -->
<WavyDivider mode="scroll" fill="var(--ms-cream)" />
```

### Props
| Prop | Type | Default | Notes |
|---|---|---|---|
| `mode` | `"ambient" \| "scroll"` | `"ambient"` | Ambient morph loop vs scroll-scrubbed reshape. |
| `fill` | `string` | `var(--ms-forest)` | Wave color — match the section it bridges INTO. |
| `height` | `number` (px) | `120` | Divider band height. |
| `flip` | `boolean` | `false` | Solid fill on top, wave dips down. |
| `staticMode` | `boolean` | `false` | Force the static wave (editor preview). |
| `className` | `string` | — | Extra class on the root. |

`fallbackSrc` (from `FxComponentProps`) is unused — the static SVG itself is
the reduced-motion fallback.

## Demo
`src/pages/_demos/wavy-divider.astro` — all modes + flip + static, bridging
real token-colored sections.

## Acceptance criteria
- [ ] Divider wave shifts shape slowly and smoothly (ambient) or reshapes on scroll (scroll mode).
- [ ] Wave spans full width responsively with no gaps at the seam between sections.
- [ ] Fill color correctly bridges the two adjacent section backgrounds.
- [ ] Reduced motion → static wave.
- [ ] Decorative, `aria-hidden`.

## Notes / gotchas
- All three morph shapes share the same command structure (`M → C → L → L → Z`)
  and point count, so MorphSVG produces clean intermediate frames.
- Amplitude is intentionally small — a barely-moving wave reads as "alive".
- `preserveAspectRatio="none"` stretches the SVG full-width; `line-height:0` +
  `margin: -1px` at the seam edge prevent inline-svg and sub-pixel gaps.
- Each divider scopes its `querySelector` to its own root (class, not id), so
  multiple dividers coexist on one page.
- Ambient loops pause when offscreen or the tab is hidden, and tear down
  cleanly (`ctx.revert()` + observers/listeners removed) on view transitions.
