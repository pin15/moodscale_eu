# ConnectionMap (doc 13)

Two related map visuals shipped together:

- **`variant="world"`** (Contact / "Build a Happier World") — dotted world map; Pune
  and Bonn pins drop in, then a shallow arc draws between them. A faint dash drift
  travels along the arc to suggest connection.
- **`variant="india"`** (Our Story) — India outline with a single founding-location
  pin (Pune) that blooms a 3-ring radar pulse on scroll-in, then settles.

## Usage

```astro
---
import ConnectionMap from "@/components/fx/ConnectionMap/ConnectionMap.astro";
---
<ConnectionMap variant="world" fallbackSrc="/src/assets/svg/world-dotted.svg" />
<ConnectionMap variant="india" fallbackSrc="/src/assets/svg/india.svg" />
```

Props extend `FxComponentProps` (`fallbackSrc`, `staticMode?`, `className?`) plus
`variant?: "world" | "india"`. The component self-initializes via its inline
`<script>` (consuming the shared Motion Core); no wiring is required at the call
site. Maps are inline SVG so DrawSVG can target `#ms-arc` and brand tokens cascade.

## Files
- `ConnectionMap.astro` — markup (both variants) + mount/teardown script.
- `connectionMap.ts` — `initConnectionMap(root)` entrance choreography (returns teardown).
- `ConnectionMap.css` — global styles (pins, radar rings, dash drift). Tokens only.
- Assets: `src/assets/svg/world-dotted.svg`, `src/assets/svg/india.svg`.
- Demo: `src/pages/_demos/connection-map.astro`.

## Implementation notes
- Dotted world = a dot `<pattern>` clipped to simplified continent paths — **not**
  thousands of `<circle>`s (doc 13 gotcha).
- Pin positions are hand-placed equirectangular (`x=(lng+180)/360·1000`,
  `y=(90−lat)/180·500`); lat/lng/city stored as data attributes. The outer
  `.ms-pin` keeps its SVG `translate()`; GSAP only animates the inner `.ms-pin__anim`.
- Radar rings are real SVG `<circle>`s (CSS `::after` does not render on SVG `<g>`),
  scaled from their own centre via `transform-box: fill-box`.
- Ambient loops (radar + dash drift) are CSS keyframes, `animation-play-state:
  paused` until the `is-onscreen` class is toggled by a ScrollTrigger — so nothing
  runs offscreen.

## Acceptance criteria
- [x] World: pins drop in, then arc draws Pune→Bonn; subtle dash drift suggests connection.
- [x] India: radar pin blooms from the founding location on entry, then settles.
- [x] Both read clearly as "our two homes," not as a generic data map.
- [x] Reduced motion → arc drawn, pins placed, no looping pulses (also honoured by `staticMode`).
- [x] Accessible labels present (`role="img"` + `aria-label`); office city names are real text nearby.
