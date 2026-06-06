# MoodScale EU

MoodScale EU is a mental well-being initiative that ties emotional health to climate resilience and community care. It began in India in 2023 as a women-led team, and the EU chapter brings that work to civil society and non-profit partners across Europe. The team will be at the Bonn Climate Conference 2026.

This repository holds the website: a single long-scroll page built with Astro.

## What the site covers

The homepage reads as one continuous story, split into a few beats:

- Hero, with an ambient dawn video behind the headline
- Our Story, on how MoodScale started and who runs it
- What we do: understand emotions, support people, strengthen communities, reconnect with nature
- Technology with empathy, on how the tech helps people without replacing human care
- Impact, and the UN Sustainable Development Goals the initiative backs
- Mental health and climate
- Connect, with a few stats, a Pune to Bonn map, and contact details

Motion is kept calm and honours the "reduce motion" setting. Background videos only play while they are on screen.

## Tech

- Astro 5 for the pages and the build
- A small React island (three.js with react-three-fiber) for the double-exposure head near the hero. React only ships to the routes that actually use it.
- GSAP and Lenis for the scroll and reveal animations
- dotLottie for the animated icons, and dotted-map for the world map

Astro is pinned to the 5.x line on purpose. The dev machine runs Node 20, and Astro 6 needs Node 22.12 or newer, so do not bump the major version unless Node is upgraded first.

## Running it locally

You need Node 20 and pnpm.

```
pnpm install
pnpm dev
```

Then open http://localhost:4321.

Other scripts:

```
pnpm build      # static build into dist/
pnpm preview    # serve the built site
pnpm check      # astro and type check
```

## Project layout

```
src/
  pages/index.astro      the homepage; composes the sections in order
  layouts/Base.astro     the page shell (head, fonts, motion setup)
  components/sections/    one file per section of the page
  components/fx/          reusable effects (text reveal, stat counter, maps, and so on)
  styles/                 design tokens, reset, fonts
  assets/                 source assets the components import
public/
  assets/                 served copy of the assets, reached through /assets/... URLs
tools/asset-pipeline/     turns raw artwork into optimised files under src/assets
scripts/                  screenshot and measurement helpers
```

A note on assets. Components reference public paths such as `/assets/video/hero-bg.mp4`, so `public/assets` is kept as a copy of `src/assets`. Two effects (the hand-script and the landscape parallax) read straight from `src/assets` instead. If you regenerate assets with the pipeline, copy them back into `public/assets` or the public URLs will go stale. Raw source artwork lives in the top-level `assets/` folder, which is the input the pipeline reads from.

The `@/` import alias points at `src/` and is defined once in `tsconfig.json`. Astro applies it automatically, so there is no second copy in `astro.config.mjs`.

## Contact

- Web: moodscale.eu
- Email: contact@moodscale.eu
- Offices: Bonn, Germany and Pune, India

## Credits

Crafted by Koush Solanki (koush93@gmail.com), 3rd to 6th June 2026.
