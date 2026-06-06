import { gsap } from "@/components/motion/gsap.client";
import { prefersReducedMotion } from "@/components/motion/reducedMotion";
import { formatStatValue, readStatFormatOptions } from "./format";
import type { FxInit } from "@/lib/types";

export const initStatCounter: FxInit = (root) => {
  const numEl = root.querySelector<HTMLElement>(".ms-stat__num");
  if (!numEl) return () => {};

  const to = Number(numEl.dataset.to);
  if (!Number.isFinite(to)) return () => {};

  const opts = readStatFormatOptions(numEl);
  const fmt = (v: number) => formatStatValue(v, opts);

  const staticMode = root.dataset.static === "true";
  if (staticMode || prefersReducedMotion()) {
    numEl.textContent = fmt(to);
    return () => {};
  }

  const ctx = gsap.context(() => {
    const counter = { v: 0 };
    numEl.textContent = fmt(0);
    gsap.to(counter, {
      v: to,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => {
        numEl.textContent = fmt(counter.v);
      },
      scrollTrigger: {
        trigger: root,
        start: "top 85%",
        once: true,
      },
    });
  }, root);

  return () => ctx.revert();
};
