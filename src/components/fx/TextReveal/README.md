# TextReveal — Text Reveal System (doc 07)

The reusable typographic-motion utility. Tag markup with `data-reveal` and a
single initializer applies the matching preset. Used by nearly every section.

## Usage

```astro
import TextReveal from "@/components/fx/TextReveal/TextReveal.astro";

<TextReveal>
  <h2 data-reveal="lines">Our Story</h2>
  <p  data-reveal="fade">As technology reshapes how we live…</p>
  <blockquote data-reveal="quote">When we heal people, we heal communities…</blockquote>
  <ul data-reveal="checklist">
    <li><svg class="ms-check">…</svg> Track emotional patterns</li>
    <li><svg class="ms-check">…</svg> Build self-awareness</li>
  </ul>
</TextReveal>
```

Or drive a section root yourself:

```ts
import { initTextReveal } from "@/components/fx/TextReveal/textReveal";
const teardown = initTextReveal(sectionRoot); // call teardown() on unmount/swap
```

## Presets

| `data-reveal` | Use for      | Motion                                            |
| ------------- | ------------ | ------------------------------------------------- |
| `lines`       | headings     | line-mask slide-up, stagger 0.12, 1.0s            |
| `quote`       | finale quote | line-mask slide-up, slow stagger 0.18, 1.3s       |
| `fade`        | body copy    | fade-up 24px, 1.0s                                |
| `checklist`   | bullet lists | per-item slide-in + DrawSVG check draw, stagger 0.09 |

`checklist` draws the first `<path>` inside each `<li>`'s inline `<svg>`; omit
the SVG and the items simply slide in.

## Notes / accessibility

- CSS never hides `[data-reveal]`; the hidden "from" state is set only by GSAP,
  so no-JS and reduced-motion users always see the text.
- Splitting runs after `document.fonts.ready`; SplitText `autoSplit` re-splits
  on resize/font swap and won't re-hide an already-revealed heading.
- `.ms-line` is a global class (SplitText applies it at runtime) with vertical
  padding so descenders aren't clipped by the mask.
- SplitText preserves the original accessible text. If splitting confuses a
  screen reader on a heading, add an explicit `aria-label`.

## Files

- `textReveal.ts` — `initTextReveal(root): teardown`, the core logic.
- `TextReveal.astro` — drop-in wrapper (boots after fonts ready, tears down on swap).
- `TextReveal.css` — global `.ms-line` mask + visibility-safe defaults.
- `index.ts` — re-exports.
- Demo: `src/pages/_demos/text-reveal.astro`.

## Acceptance criteria (doc 07)

- [ ] Headings reveal line-by-line with a clean mask (no descenders clipped — check line-height/padding).
- [ ] Finale quote reveals noticeably slower and more deliberately than headings.
- [ ] Checklist items stagger in with their check-marks drawing.
- [ ] Body copy fades up gently.
- [ ] Reduced motion / no-JS → all text fully visible and readable.
- [ ] Re-splitting on resize doesn't double-animate or break layout.
