# fx/AnimatedIcon

Reusable animated line-icon (doc 11). Used across feature lists, "What We Do",
the pillars, and stat rows. One pipeline for the whole site: **Lottie**
(`@lottiefiles/dotlottie-web`) — draw-on-scroll + hover replay.

## Usage

```astro
---
import AnimatedIcon from "@/components/fx/AnimatedIcon/AnimatedIcon.astro";
---
<AnimatedIcon
  src="/src/assets/lottie/hands-heart.lottie"
  label="Compassion"
  trigger="both"          {/* "scroll" | "hover" | "both" (default) */}
  size={56}               {/* px, default 56 */}
  disc={true}             {/* light-green disc behind the icon, default true */}
  fallbackSrc="/src/assets/svg/hands-heart.svg"  {/* shown if .lottie fails */}
/>
```

`label` is required (accessible name). `fallbackSrc`/`staticMode` come from the
shared `FxComponentProps` contract (doc 00 §6).

## Dependencies

```
pnpm add @lottiefiles/dotlottie-web
```

Consumes Motion Core (doc 01): `prefersReducedMotion`, `onEnterViewport`.
Does NOT register GSAP plugins or create a Lenis instance. The disc's entrance
(`data-inview="scale-in"`) is animated by the Scroll Reveal system (doc 08) so
the disc and icon arrive together.

## Assets (doc 14)

`assets/lottie/{smart-matching,emotional-journey,hands-heart,brain,ai-chip,lotus,globe,shield,growth-chart}.lottie`
— authored in MoodScale greens, line weight matching the leaflet.

## Acceptance criteria

- [ ] Each icon draws once when scrolled into view, inside its green disc.
- [ ] Hover replays/plays a small purposeful animation; it returns to rest after.
- [ ] Icon family is visually consistent (one pipeline, matching line weight + greens).
- [ ] Reduced motion → static resting icon, no playback.
- [ ] Correct accessible label on every icon.
- [ ] No continuous looping that competes with reading.
