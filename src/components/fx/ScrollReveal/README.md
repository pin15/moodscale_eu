# ScrollReveal — 08 Scroll Reveal System

The reusable "fade / slide / scale in on scroll" engine for all **non-text** blocks
(images, seated-people scenes, cards, UN SDG tiles, icon discs). Text reveals are
doc 07 (`TextReveal`); this is everything else.

## API (declarative, attribute-driven)

Wrap content in the scoped root (`<ScrollReveal>` or any `data-fx="scroll-reveal"`
element) and tag children:

| attribute | motion | typical use |
|---|---|---|
| `data-inview="fade-up"` | opacity 0→1, y 32→0 | images, people scenes, paragraph blocks |
| `data-inview="scale-in"` | opacity 0→1, scale .92→1 | icon discs, badges, avatars |
| `data-inview="fade"` | opacity only | maps, large flat art |
| `data-inview="group"` + `data-inview-item` children | staggered fade-up | SDG tiles, stat rows, card grids |
| `data-stagger="0.08"` (on a `group`) | overrides stagger (default 0.1) | SDG tile cascade |
| `data-inview-idle` (on a `fade-up`) | adds a subtle breathe after settling | seated-people scenes |

```ts
import { initScrollReveal } from "@/components/fx/ScrollReveal/ScrollReveal";
const teardown = initScrollReveal(rootEl); // returns () => void
```

Or use the Astro wrapper `ScrollReveal.astro`, which self-inits and tears down on
view transitions.

## Special cases (per spec)

- **Seated-people scenes:** `fade-up` + `data-inview-idle` → a ~2px translateY breathe
  over 8s once settled, so they feel present, not frozen. Disabled on reduced motion.
- **SDG tiles:** `group` with `data-stagger="0.08"` for a satisfying cascade. Tiles are
  external brand assets — only the entrance is animated.
- **Icon discs:** `scale-in`, pairs with the icon's own Lottie/draw (doc 11) at the same time.

## Acceptance criteria

- [ ] Blocks fade/slide/scale in once on entry with consistent, calm timing across the site.
- [ ] Grouped grids (SDG tiles, stat rows) cascade with a pleasing stagger.
- [ ] People scenes feel gently alive (subtle idle), not static screenshots.
- [ ] Reduced motion / no-JS → all blocks visible immediately.
- [ ] No double-animation when sections re-enter; clean teardown on view-transition.

## Notes

- Hidden start state is set in **JS only** (`gsap.from`) — never in CSS — so a
  JS-disabled visitor never sees a blank page.
- `once: true` everywhere; `transform`/`opacity` only. Prefer `group` over dozens of
  individual triggers on long grids.
- Consumes the shared Motion Core (`gsap.client`, `reducedMotion`) — never registers
  plugins or instantiates Lenis itself (doc 00 §5).
