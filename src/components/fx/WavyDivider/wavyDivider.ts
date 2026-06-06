import { gsap, ScrollTrigger } from "@/components/motion/gsap.client";
import { prefersReducedMotion } from "@/components/motion/reducedMotion";
import type { FxInit } from "@/lib/types";

const SHAPES = [
  "M0,40 C360,90 1080,0 1440,50 L1440,120 L0,120 Z",
  "M0,55 C420,10 1020,100 1440,40 L1440,120 L0,120 Z",
  "M0,35 C360,70 1080,30 1440,60 L1440,120 L0,120 Z",
] as const;

export const initWavyDivider: FxInit = (root) => {
  const path = root.querySelector<SVGPathElement>(".ms-divider__wave");
  if (!path) return () => {};

  if (prefersReducedMotion() || root.dataset.static === "true") return () => {};

  const scrollMode = root.dataset.mode === "scroll";
  let io: IntersectionObserver | null = null;
  let onVisibility: (() => void) | null = null;

  const ctx = gsap.context(() => {
    if (scrollMode) {
      gsap.to(path, {
        morphSVG: SHAPES[1],
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      return;
    }

    const tl = gsap.timeline({
      repeat: -1,
      yoyo: true,
      defaults: { ease: "sine.inOut" },
    });
    tl.to(path, { morphSVG: SHAPES[1], duration: 7 }).to(path, {
      morphSVG: SHAPES[2],
      duration: 8,
    });

    let onscreen = true;
    const apply = () => (onscreen && !document.hidden ? tl.play() : tl.pause());

    io = new IntersectionObserver(
      ([entry]) => {
        onscreen = entry.isIntersecting;
        apply();
      },
      { rootMargin: "100px 0px" }
    );
    io.observe(root);

    onVisibility = apply;
    document.addEventListener("visibilitychange", onVisibility);
  }, root);

  return () => {
    io?.disconnect();
    if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
    ScrollTrigger.getAll()
      .filter((t) => t.trigger === root)
      .forEach((t) => t.kill());
    ctx.revert();
  };
};
