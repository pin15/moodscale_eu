# LandscapeParallax (doc 04)

Layered nature-scene background with depth parallax + a soft sun glow. The
site's workhorse "calm immersion" backdrop, reused in hero scenes, "Our Story",
and the footer.

## Files
- `LandscapeParallax.astro` — markup + asset resolution + client island.
- `landscapeParallax.ts` — `initLandscapeParallax(root)` (parallax + sun rise).
- `depthPlane.ts` — lazy WebGL depth-displacement for Mode B (graceful fallback).
- `LandscapeParallax.module.css` — layer/sun styles (compositor-only).

## Props (extends `FxComponentProps`)
| prop          | type                   | default    | notes |
|---------------|------------------------|------------|-------|
| `scene`       | `string`               | —          | folder under `src/assets/images/<scene>/` (Mode A) / file stem (Mode B) |
| `mode`        | `"sliced" \| "depth"`  | `"sliced"` | Mode B only if a depth map exists, else falls back to flat |
| `height`      | `string`               | `"100vh"`  | e.g. `"70vh"` |
| `sun`         | `boolean`              | `true`     | render the sun glow |
| `intensity`   | `number`               | `1`        | parallax strength multiplier |
| `fallbackSrc` | `string` (FxComponent) | —          | static composite if assets are missing |
| `staticMode`  | `boolean`              | `false`    | editor preview: flat composite, no init |

## Assets
Mode A: `src/assets/images/<scene>/{sky,mountains,hills,lake,foreground,figures}.avif`
(`lake` + `figures` optional) plus `_flat.avif` fallback. Layers absent on disk
are skipped; if none resolve, the flat composite renders.
Mode B: `src/assets/images/<scene>.avif` + `src/assets/depth/<scene>-depth.png`.

If a scene includes water, the lake layer stays flat here — doc 05 adds shimmer.

## Demo
`src/pages/_demos/landscape-parallax.astro` — isolated, with a CSS-gradient
placeholder stack (no prepared assets needed) to verify motion before merge.

## Acceptance criteria
- [ ] Distinct, believable depth: foreground clearly outpaces background on scroll.
- [ ] No edge gaps revealed during parallax (per-layer overscale derives from its travel).
- [ ] Sun glow breathes slowly and lifts gently on entry.
- [ ] Reduced motion → static composited scene, no scrubbing.
- [ ] 60fps while scrolling; no layout thrash (scrub uses transforms only).
