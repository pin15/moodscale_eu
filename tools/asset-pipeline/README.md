# MoodScale EU — Asset Preparation Pipeline

Implementation of **doc 14 — Asset Preparation Pipeline**. Turns print artwork
into the web-ready, animation-ready asset contract that visual components
(docs 02–13) consume from `src/assets/` (Foundation §9).

> This is the "process spec, run as its own session" from doc 14, made
> executable. It produces the **entire** asset folder, validates it against the
> doc-14 acceptance criteria, and unblocks every downstream component session by
> guaranteeing every referenced filename exists with the exact path/name.

## Commands

```bash
cd tools/asset-pipeline
pnpm install

pnpm assets build         # full pipeline; uses real artwork in /assets where mapped, else placeholders
pnpm assets placeholders  # complete contract as offline, deterministic stand-ins
pnpm assets validate      # check doc-14 acceptance criteria against src/assets/
pnpm assets manifest      # print the asset contract (the single source of truth)
```

`build` and `placeholders` both end by running `validate` and exit non-zero on
any failure, so they're CI-safe.

## How it maps to doc 14's seven steps

| Doc 14 step | Where | Default (offline) | Hosted upgrade |
|---|---|---|---|
| 1 Upscale & clean | `adapters/ai.ts` `upscale()` | sharp Lanczos + denoise/sharpen → lossless PNG | Real-ESRGAN / Topaz / Magnific |
| 2 Depth maps | `adapters/ai.ts` `estimateDepth()` | synthetic landscape ramp (white=near, black=far), pixel-aligned | Depth Anything V2 (Replicate) |
| 3 Layer slicing | `adapters/ai.ts` `segment()` + `commands/generate.ts` | pre-sliced layers if present, else per-layer placeholders + `_flat` | SAM 2 + generative inpaint |
| 4 Vectorize | `generators/svg.ts` + `util/svgo.ts` | authored centerline/grouped SVGs, SVGO with **ids locked** | Recraft / vectorizer.ai trace |
| 5 Lottie | `generators/lottie.ts` + `util/zip.ts` | valid dotLottie line icons w/ `draw`+`hover` markers | After Effects / LottieFiles |
| 6 Image-to-video | `steps/video.ts` (ffmpeg) | seamless 6s breathing loop, WebM(VP9)+MP4(H264) | Luma Ray3 / Runway / Kling |
| 7 Optimize & deliver | `steps/optimize.ts` (sharp) | AVIF + WebP + responsive srcset, exact names | — |

### Switching on the hosted AI models

```bash
export MS_AI_PROVIDER=replicate
export REPLICATE_API_TOKEN=...
pnpm assets build
```

The Replicate code paths in `adapters/ai.ts` are wired but intentionally throw
until you implement the prediction call + token, so an offline/CI run never
silently depends on the network.

### Using real artwork

Drop source art into the repo `assets/` folder and re-run `build`:

- **Whole stills** — `assets/hero-original.png` is already mapped onto
  `hero/_flat`, `lake-vista`, `head-scene`, `head-fallback`.
- **Pre-sliced layers** — drop `assets/<scene>/<layer>.png` (e.g.
  `assets/hero/mountains.png`) and the pipeline uses them verbatim instead of
  placeholders. This is the "source layers exist → export directly" path (Step 3).

## The asset contract

`src/manifest.ts` is the single source of truth: every output file, its
consuming doc, optional flag, target dimensions, and the SVG `id`s that GSAP /
DrawSVG / `<mask>` / `<pattern>` target. Add or rename an asset **here only**.

## The two locked gotchas (doc 14)

1. **SVGO must never strip targeted `id`s.** `util/svgo.ts` disables
   `cleanupIds` (and `mergePaths`/`convertShapeToPath`/`removeHiddenElems`) and
   the build *asserts* every `preserveIds` survived — failure aborts the build.
2. **Script words are true centerline strokes**, not filled letterforms
   (`fill:none; stroke:currentColor`, point order left→right), so DrawSVG
   "writes" them. The validator enforces this.

## Output

```
src/assets/
  images/   AVIF (+ WebP + -<w>w srcset) scenes & sliced layers
  depth/    grayscale depth PNGs (white=near, black=far), pixel-aligned
  svg/      head silhouette, script words, leaves, birds, india, world (pattern)
  lottie/   dotLottie line icons (draw + hover markers)
  video/    seamless ambient loop (webm + mp4)
  ASSETS.json   delivery report (provider, encode settings, full manifest)
```

## Status of generated artwork

The SVGs marked **DRAFT** (script words, india outline, dotted world) and all
raster/depth placeholders are *structurally correct and animate/encode exactly
as the real assets will* — they exist so component sessions are never blocked.
Replace them with traced brand lettering / real segmented layers / model outputs
by dropping real sources in `assets/` (or enabling `MS_AI_PROVIDER=replicate`)
and re-running `pnpm assets build`. The script-word centerlines are the
highest-priority real-art swap (doc 14: "the single biggest quality risk").
