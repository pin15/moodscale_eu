# WaterShimmer (doc 05)

A subtle, almost-subliminal ripple confined to a lake / water region. Reinforces the
"nature heals" theme. Overlays the `lake` layer from doc 04.

## Approach

v1 SVG displacement filter (recommended by the spec — no WebGL):

- A duplicate of the water image carries an animated `feTurbulence` + `feDisplacementMap`
  filter and is stacked over an untouched static base image.
- A vertical CSS gradient mask fades the rippling overlay out toward the top, so **far
  water (top) ripples less than near water (bottom)** — the depth cue.
- If the filter fails to render, the overlay degrades to the static base: no breakage.

Upgrade to the GLSL plane (v2) only if the SVG filter ever looks too "rubbery".

## Usage

```astro
---
import WaterShimmer from "@/components/fx/WaterShimmer/WaterShimmer.astro";
---
<WaterShimmer fallbackSrc="/assets/images/bonn/lake.avif" scale={6} duration={14} nearStart={0.45} />
```

| prop          | default | notes                                                            |
| ------------- | ------- | ---------------------------------------------------------------- |
| `fallbackSrc` | —       | static water image; base layer + graceful fallback (required)    |
| `alt`         | `""`    | empty ⇒ decorative (`aria-hidden`)                               |
| `scale`       | `6`     | ripple strength fed to `feDisplacementMap`; keep subtle (4–8)    |
| `duration`    | `14`    | drift loop length in seconds                                     |
| `nearStart`   | `0.45`  | fraction down where the near-water ripple starts fading in       |
| `staticMode`  | `false` | force a static frame (editor preview) — no overlay, no animation |
| `id`          | auto    | explicit root + filter id; auto-generated per instance otherwise |

## Acceptance criteria

- [ ] Water surface drifts/ripples slowly and subtly; you notice it only if you look.
- [ ] Effect is confined to the water region; surrounding scene is untouched.
- [ ] Far water ripples less than near water (depth cue).
- [ ] Reduced motion → completely static.
- [ ] No measurable scroll-fps drop.

## Notes / gotchas

- Too much `scale` = nauseating "funhouse mirror." Stay subtle (4–8).
- Keep the filtered element to the actual water bbox, not the whole scene (perf).
- SMIL drift pauses when offscreen, when the tab is hidden, and under reduced motion.
- On Safari, sanity-check `feDisplacementMap` performance on large areas; if it stutters,
  switch that scene to the GLSL plane (v2).
