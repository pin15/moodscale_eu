# NeuralNodes — Neural-Node Particle Network (doc 03)

A calm, living brain-constellation: sparse nodes drift, whisper-thin links fade
with distance, and a soft pulse travels the network every ~5s. Confined to a
head silhouette via CSS `mask-image` (the mask hides any edge overflow).
Hand-rolled canvas2D for precise control of the calm aesthetic.

## Files
- `NeuralNodes.astro` — markup + island script; exposes the prop interface.
- `neuralNodes.ts` — the hand-rolled canvas2D engine (`initNeuralNodes`).
- `NeuralNodes.module.css` — layout + silhouette mask + blend mode.
- Demo: `src/pages/_demos/neural-nodes.astro`.
- Mask asset: `src/assets/svg/head-silhouette.svg` (shared with doc 02).

## Props
| prop | default | notes |
|---|---|---|
| `fallbackSrc?` | — | static image (doc 14) shown if canvas/JS unavailable |
| `staticMode?` | `false` | force the resting frame (editor preview) |
| `maskSrc?` | `/assets/svg/head-silhouette.svg` | silhouette mask URL |
| `blendMode?` | `"screen"` | `screen`/`lighten` to glow over the head (doc 02) |
| `class?` | — | extra class on the root |

## Tuning (the calm levers, in `neuralNodes.ts`)
- `LINK_MAX_ALPHA` (0.25) — **the #1 lever** between "elegant" and "spiderweb".
  Keep it tiny.
- Node count auto-scales by area, clamped to **40–70** (sparse).
- Drift **6–12 px/s**; node radius **1.5–3 px**.
- Pulse every **~5 s**, expands at `PULSE_SPEED`, band width `PULSE_BAND`.

## Integration with the Double-Exposure Head (doc 02)
Place this canvas absolutely over the head container, same bounding box,
`pointer-events:none`, same silhouette mask, `blendMode="screen"`. The two
components stay fully independent (own root, own teardown).

## Acceptance criteria (from the spec — Definition of Done)
- [ ] Sparse, slow-drifting node network confined exactly to the silhouette
      (no square edges).
- [ ] Links fade with distance; overall effect is a quiet glow, not a busy mesh.
- [ ] Pulse wave is subtle and infrequent (~5s).
- [ ] Reduced motion → one static frame, loop never starts.
- [ ] Loop pauses offscreen and when the tab is hidden; clean teardown.
- [ ] Tokens only (no hardcoded hex/duration); typecheck + lint clean; no
      console errors.

## Contract notes (doc 00 §5)
- Self-contained: reads Motion Core helpers (`prefersReducedMotion`,
  `onEnterViewport`); does **not** create Lenis or register GSAP plugins.
- Scoped to `[data-fx="neural-nodes"]`; single rAF; paused offscreen +
  `document.hidden`; teardown cancels rAF and removes all listeners.
- Palette read live from `--ms-leaf` / `--ms-mist` / `--ms-sage` (tokens.css).
- Decorative → `aria-hidden="true"`.
