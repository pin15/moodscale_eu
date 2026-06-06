import { gsap, ScrollTrigger } from "@/components/motion/gsap.client";
import { prefersReducedMotion } from "@/components/motion/reducedMotion";

export type LayerName = "sky" | "mountains" | "hills" | "lake" | "foreground" | "figures";

const DEPTH: Record<LayerName, number> = {
  sky: 0.02,
  mountains: 0.08,
  hills: 0.16,
  lake: 0.1,
  foreground: 0.42,
  figures: 0.3,
};

const OVERSCALE_MARGIN = 0.06;

const SUN_RISE = 0.06;

export function initLandscapeParallax(root: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {};

  const intensity = Number(root.dataset.intensity) || 1;
  const mode = root.dataset.mode === "depth" ? "depth" : "sliced";

  let depthTeardown: (() => void) | null = null;

  const ctx = gsap.context(() => {
    const layers = root.querySelectorAll<HTMLElement>("[data-layer]");
    layers.forEach((el) => {
      const key = el.dataset.layer as LayerName;
      const depth = DEPTH[key];
      if (depth == null) return;

      const travel = depth * 100 * intensity;
      const overscale = 1 + travel / 100 + OVERSCALE_MARGIN;

      gsap.set(el, { scale: overscale, yPercent: travel / 2, transformOrigin: "center center" });
      gsap.to(el, {
        yPercent: -travel / 2,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            el.style.willChange = self.isActive ? "transform" : "auto";
          },
        },
      });
    });

    const sun = root.querySelector<HTMLElement>(".ms-sun");
    if (sun) {
      const half = () => (SUN_RISE * root.offsetHeight * intensity) / 2;
      gsap.fromTo(
        sun,
        { y: half },
        {
          y: () => -half(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "center center",
            scrub: true,
            invalidateOnRefresh: true,
            onToggle: (self) => {
              sun.style.willChange = self.isActive ? "transform" : "auto";
            },
          },
        },
      );
    }
  }, root);

  if (mode === "depth") {
    const canvas = root.querySelector<HTMLCanvasElement>("[data-depth-canvas]");
    if (canvas) {
      import("./depthPlane")
        .then(({ mountDepthPlane }) => {
          if (!canvas.isConnected) return;
          depthTeardown = mountDepthPlane(canvas, root, intensity);
        })
        .catch(() => {
        });
    }
  }

  return () => {
    depthTeardown?.();
    ctx.revert();
    ScrollTrigger.refresh();
  };
}
