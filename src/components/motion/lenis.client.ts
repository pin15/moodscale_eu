import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap.client";
import { prefersReducedMotion } from "./reducedMotion";

let lenis: Lenis | null = null;
let tickerFn: ((time: number) => void) | null = null;

export function initLenis(): Lenis | null {
  if (lenis) return lenis;
  if (prefersReducedMotion()) return null;

  const instance = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.4,
  });
  lenis = instance;

  instance.on("scroll", ScrollTrigger.update);
  tickerFn = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(tickerFn);
  gsap.ticker.lagSmoothing(0);
  return instance;
}

export function getLenis() { return lenis; }

export function destroyLenis() {
  if (tickerFn) { gsap.ticker.remove(tickerFn); tickerFn = null; }
  lenis?.destroy();
  lenis = null;
}
