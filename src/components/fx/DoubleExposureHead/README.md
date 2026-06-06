# DoubleExposureHead (doc 02) ★ FLAGSHIP

Depth-map WebGL parallax: the MoodScale profile silhouette filled with a living
inner world. One base scene + one grayscale depth map, UVs displaced in a
fragment shader by an eased pointer (and a little scroll), masked to the
silhouette via an alpha texture. **Exactly one instance per page** (the hero).

## Files
- `DoubleExposureHead.astro` — wrapper. Renders the static fallback `<img>`
  immediately (`fetchpriority="high"`) and mounts the island `client:visible`.
- `Scene.tsx` — the R3F island: capability guard, lazy-mount, the displaced
  full-screen quad (`ScreenQuad` + custom GLSL), eased uniforms, fade-in,
  context-loss fallback.
- `DoubleExposureHead.module.css` — stacks the canvas over the `<img>`.

## Props (extends `FxComponentProps`)
| prop | type | default | notes |
|---|---|---|---|
| `fallbackSrc` | `string` | — | static composite (`head-fallback.avif`) |
| `staticMode?` | `boolean` | `false` | skip the island entirely |
| `className?` | `string` | — | |
| `sceneSrc` | `string` | — | inner scene (`head-scene.avif`) |
| `depthSrc` | `string` | — | depth map (`head-scene-depth.png`), white=near |
| `maskSrc` | `string` | — | silhouette alpha texture, alpha=inside |
| `intensity?` | `number` | `0.06` | displacement strength — keep subtle |
| `facing?` | `"left"\|"right"` | `"left"` | mirrors to match the leaflet |
| `alt?` | `string` | … | description for the fallback image |

## Behaviour / contract
- Pointer is **eased** (`damp`, λ≈3), never 1:1 — liquid, not twitchy.
- Idle `sin/cos` "breathing" drift (amplitude ≈0.15) so it lives without input.
- `uScroll` binds to a ScrollTrigger if Motion Core is present; pointer
  parallax works standalone if it isn't.
- Lazy-mounts on `onEnterViewport`; `useFrame` early-outs when offscreen or
  `document.hidden`. dpr `[1,2]`, single draw call, no postprocessing.
- Reduced motion / `staticMode` / no WebGL → island renders nothing; the
  `<img>` is the final state. WebGL context loss → permanently fall back to it.
- Camera never moves — we displace UVs only (motion-sickness safe).

## Assets (doc 14)
`head-scene.avif`, `head-scene-depth.png` (pixel-aligned to the scene),
`head-silhouette` alpha PNG, `head-fallback.avif`. Depth via Depth Anything V2.

## Demo
`src/pages/_demos/double-exposure-head.astro`.

## Acceptance criteria
- [ ] Static `<img>` visible instantly (no flash of empty canvas); canvas fades in over it.
- [ ] Cursor produces smooth, *lagged* parallax inside the head; far moves less than near.
- [ ] Masked precisely to the silhouette; soft alpha edges, no hard rectangle.
- [ ] Idle breathing drift continues with no pointer input.
- [ ] Reduced motion / no WebGL → identical static composite, zero JS animation.
- [ ] 60fps on a mid laptop; GPU memory released on unmount; no context-loss crash.
