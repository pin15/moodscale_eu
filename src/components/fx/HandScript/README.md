# HandScript — SVG handwriting draw (doc 06)

The script accent words ("Empathy", "Together", "fulfilling lives", "happier
future") draw themselves left-to-right as they scroll into view, like a hand
writing in real time. SVG stroke-path animation via GSAP DrawSVG.

## Usage

```astro
---
import HandScript from "@/components/fx/HandScript/HandScript.astro";
---
<h2>Discover your <HandScript src="/src/assets/svg/script/empathy.svg" /></h2>
```

## Props (`extends FxComponentProps`)

| Prop         | Type     | Default          | Notes                                        |
|--------------|----------|------------------|----------------------------------------------|
| `src`        | string   | —                | Path to the single-stroke script SVG.        |
| `label`      | string   | filename         | Accessible name (the word) for screen readers. |
| `color`      | string   | `var(--ms-moss)` | Ink colour (any CSS colour / token).         |
| `duration`   | number   | `1.4`            | Handwriting pace, seconds.                   |
| `start`      | string   | `"top 80%"`      | ScrollTrigger start.                         |
| `staticMode` | boolean  | `false`          | Render fully written, no animation.          |
| `className`  | string   | —                | Extra class on the wrapper.                  |

## Contract notes
- Consumes Motion Core (`@/components/motion/gsap.client`, `reducedMotion`).
  Does **not** register GSAP plugins or create a Lenis instance.
- Scoped to its root via `gsap.context`; returns a teardown (`ctx.revert()`),
  torn down on `astro:before-swap`.
- Assets are inlined at build time (`set:html`) so DrawSVG can query real
  `<path>` nodes; they inherit `currentColor`.

## Assets
`src/assets/svg/script/{empathy,together,fulfilling-lives,happier-future}.svg`
— **single-stroke centerline** paths (`fill:none; stroke:currentColor`),
authored to read left→right. The committed files are credible placeholders;
doc 14 (asset pipeline) replaces them with the traced brand lettering. DrawSVG
needs real strokes — a filled-letter SVG would "wipe" oddly, not "write."

## Acceptance criteria
- [ ] Each script word draws left-to-right like handwriting when scrolled into view, once.
- [ ] Stroke weight/feel matches the printed leaflet lettering.
- [ ] Reduced motion → word appears fully written, instantly.
- [ ] Word is announced correctly by screen readers.
- [ ] Reusable: dropping in a new `<HandScript src=... />` "just works."

Demo: `src/pages/_demos/hand-script.astro`.
