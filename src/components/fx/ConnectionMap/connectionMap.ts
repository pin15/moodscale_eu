import { gsap, ScrollTrigger } from "@/components/motion/gsap.client";
import { prefersReducedMotion } from "@/components/motion/reducedMotion";
import type { FxInit } from "@/lib/types";

export const initConnectionMap: FxInit = (root) => {
  const arc = root.querySelector<SVGPathElement>("#ms-arc");
  const flow = root.querySelector<SVGPathElement>(".ms-arc-flow");
  const pins = Array.from(root.querySelectorAll<SVGGElement>(".ms-pin__anim"));

  const reduced = prefersReducedMotion() || root.dataset.static === "true";
  if (reduced) {
    if (arc) gsap.set(arc, { drawSVG: "100%" });
    if (flow) gsap.set(flow, { opacity: 1 });
    gsap.set(pins, { opacity: 1, scale: 1, y: 0 });
    root.classList.remove("is-onscreen"); // keep all loops parked
    return () => {};
  }

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top 80%", once: true },
    });

    tl.from(pins, {
      opacity: 0,
      y: -14,
      scale: 0.6,
      transformOrigin: "center bottom",
      duration: 0.6,
      ease: "power3.out",
      stagger: 0.2,
    });

    if (arc) {
      gsap.set(arc, { drawSVG: "0%" });
      tl.to(arc, { drawSVG: "100%", duration: 1.2, ease: "power1.inOut" }, "-=0.1");
    }
    if (flow) tl.to(flow, { opacity: 1, duration: 0.6, ease: "power1.out" }, "-=0.2");

    ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => root.classList.toggle("is-onscreen", self.isActive),
    });
  }, root);

  return () => ctx.revert();
};

export default initConnectionMap;
