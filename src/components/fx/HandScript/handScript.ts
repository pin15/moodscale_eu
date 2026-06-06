import { gsap } from "@/components/motion/gsap.client";
import { prefersReducedMotion } from "@/components/motion/reducedMotion";

export function initHandScript(root: HTMLElement): () => void {
  const paths = root.querySelectorAll<SVGPathElement>("path");
  if (!paths.length) return () => {};

  if (root.dataset.static !== undefined || prefersReducedMotion()) {
    gsap.set(paths, { drawSVG: "100%" });
    return () => {};
  }

  const ctx = gsap.context(() => {
    gsap.set(paths, { drawSVG: "0%" });
    gsap.to(paths, {
      drawSVG: "100%",
      duration: Number(root.dataset.duration ?? 1.4),
      ease: "power1.inOut",
      stagger: 0.15,
      scrollTrigger: {
        trigger: root,
        start: root.dataset.start ?? "top 80%",
        once: true,
      },
    });
  }, root);

  return () => ctx.revert();
}
