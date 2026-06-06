import type { FxInit } from "@/lib/types";
import { prefersReducedMotion } from "@/components/motion/reducedMotion";

export const initWaterShimmer: FxInit = (root) => {
  const svg = root.querySelector<SVGSVGElement>(".ms-water__defs");

  if (!svg || root.hasAttribute("data-static")) return () => {};

  let reduced = prefersReducedMotion();
  let onScreen = false;

  const evaluate = () => {
    if (reduced || !onScreen || document.hidden) svg.pauseAnimations();
    else svg.unpauseAnimations();
  };

  const io = new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      evaluate();
    },
    { rootMargin: "120px" }
  );
  io.observe(root);

  const onVisibility = () => evaluate();
  document.addEventListener("visibilitychange", onVisibility);

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMotionPref = () => {
    reduced = prefersReducedMotion();
    evaluate();
  };
  mq.addEventListener("change", onMotionPref);

  svg.pauseAnimations();
  evaluate();

  return () => {
    io.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    mq.removeEventListener("change", onMotionPref);
    svg.unpauseAnimations();
  };
};
