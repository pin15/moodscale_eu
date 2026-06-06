import { gsap, SplitText } from "@/components/motion/gsap.client";
import { prefersReducedMotion } from "@/components/motion/reducedMotion";
import type { FxInit } from "@/lib/types";

type RevealKind = "lines" | "quote" | "fade" | "checklist";

const EASE_SETTLE = "power3.out";
const EASE_GENTLE = "power2.out";

export const initTextReveal: FxInit = (root: HTMLElement) => {
  const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
  if (targets.length === 0) return () => {};

  if (prefersReducedMotion()) {
    targets.forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    return () => {
      targets.forEach((el) => {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
      });
    };
  }

  const splits: SplitText[] = [];

  const ctx = gsap.context(() => {
    targets.forEach((el) => {
      const kind = (el.dataset.reveal || "fade") as RevealKind;
      const scrollTrigger = { trigger: el, start: "top 82%", once: true } as const;

      switch (kind) {
        case "lines":
        case "quote": {
          const isQuote = kind === "quote";

          let revealed = false;

          const split = SplitText.create(el, {
            type: "lines",
            linesClass: "ms-line",
            autoSplit: true,
            onSplit: (self) => {
              if (revealed) return;
              return gsap.from(self.lines, {
                yPercent: 110,
                opacity: 0,
                duration: isQuote ? 1.3 : 1.0,
                ease: EASE_SETTLE,
                stagger: isQuote ? 0.18 : 0.12,
                scrollTrigger,
                onComplete: () => {
                  revealed = true;
                },
              });
            },
          });
          splits.push(split);
          break;
        }

        case "fade": {
          gsap.from(el, {
            y: 24,
            opacity: 0,
            duration: 1.0,
            ease: EASE_GENTLE,
            scrollTrigger,
          });
          break;
        }

        case "checklist": {
          const items = el.querySelectorAll<HTMLElement>("li");
          if (items.length === 0) break;
          const checks = el.querySelectorAll<SVGPathElement>("li svg path");

          const tl = gsap.timeline({ scrollTrigger });
          tl.from(items, {
            x: -16,
            opacity: 0,
            duration: 0.7,
            ease: EASE_GENTLE,
            stagger: 0.09,
          });
          if (checks.length > 0) {
            tl.from(
              checks,
              {
                drawSVG: "0%",
                duration: 0.5,
                ease: EASE_GENTLE,
                stagger: 0.09,
              },
              0.15,
            );
          }
          break;
        }
      }
    });
  }, root);

  return () => {
    splits.forEach((s) => s.revert());
    ctx.revert();
  };
};
