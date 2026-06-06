import { gsap } from "@/components/motion/gsap.client";
import { prefersReducedMotion } from "@/components/motion/reducedMotion";
import type { FxInit } from "@/lib/types";

export const IDLE_CLASS = "ms-sr-breathe";

const REVEAL_DUR = 1.0;
const FADE_DUR = 1.1;
const GROUP_DUR = 0.9;
const SCALE_DUR = 0.9;
const DEFAULT_STAGGER = 0.1;

export const initScrollReveal: FxInit = (root: HTMLElement) => {
  if (prefersReducedMotion()) {
    root
      .querySelectorAll<HTMLElement>("[data-inview],[data-inview-item]")
      .forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    return () => {};
  }

  const ctx = gsap.context(() => {
    root.querySelectorAll<HTMLElement>("[data-inview]").forEach((el) => {
      const kind = el.dataset.inview;
      const st = {
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      };

      if (kind === "group") {
        const items = el.querySelectorAll<HTMLElement>("[data-inview-item]");
        gsap.from(items, {
          opacity: 0,
          y: 28,
          duration: GROUP_DUR,
          ease: "power2.out",
          stagger: Number(el.dataset.stagger ?? DEFAULT_STAGGER),
          ...st,
        });
      } else if (kind === "fade-up") {
        const idle = el.dataset.inviewIdle !== undefined;
        gsap.from(el, {
          opacity: 0,
          y: 32,
          duration: REVEAL_DUR,
          ease: "power3.out",
          ...st,
          onComplete: idle
            ? () => {
                gsap.set(el, { clearProps: "transform" });
                el.classList.add(IDLE_CLASS);
              }
            : undefined,
        });
      } else if (kind === "scale-in") {
        gsap.from(el, {
          opacity: 0,
          scale: 0.92,
          duration: SCALE_DUR,
          ease: "power3.out",
          transformOrigin: "center",
          ...st,
        });
      } else {
        gsap.from(el, {
          opacity: 0,
          duration: FADE_DUR,
          ease: "power2.out",
          ...st,
        });
      }
    });
  }, root);

  return () => ctx.revert();
};
