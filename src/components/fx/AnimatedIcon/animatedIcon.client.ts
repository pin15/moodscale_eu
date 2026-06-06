import { DotLottie } from "@lottiefiles/dotlottie-web";
import { prefersReducedMotion, onEnterViewport } from "@/components/motion/reducedMotion";
import type { FxInit } from "@/lib/types";

export const initAnimatedIcon: FxInit = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>("canvas");
  const fallback = root.querySelector<HTMLImageElement>("[data-fallback]");
  const src = root.dataset.src;
  const trigger = (root.dataset.trigger ?? "both") as "scroll" | "hover" | "both";

  if (!canvas || !src) {
    showFallback();
    return () => {};
  }

  const reduced = prefersReducedMotion() || root.dataset.staticMode === "true";
  const wantsDraw = trigger === "scroll" || trigger === "both";
  const wantsHover = trigger === "hover" || trigger === "both";

  let dot: DotLottie | null = null;
  let loaded = false;
  let drewOnce = false;
  let destroyed = false;

  function showFallback() {
    if (fallback) fallback.removeAttribute("hidden");
    canvas?.setAttribute("hidden", "");
  }

  function sizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const css = canvas.getBoundingClientRect();
    const w = Math.round((css.width || canvas.clientWidth) * dpr);
    const h = Math.round((css.height || canvas.clientHeight) * dpr);
    if (w > 0 && h > 0) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function ensureLottie(): DotLottie {
    if (dot) return dot;
    sizeCanvas();
    dot = new DotLottie({ canvas: canvas!, src, autoplay: false, loop: false });
    dot.addEventListener("load", () => {
      loaded = true;
      if (destroyed) return;
      if (reduced) dot!.setFrame(Math.max(0, dot!.totalFrames - 1));
    });
    dot.addEventListener("loadError", showFallback);
    return dot;
  }

  function play() {
    const d = ensureLottie();
    if (reduced) return;
    if (loaded) {
      d.stop();
      d.play();
    } else {
      d.play();
    }
  }

  const teardowns: Array<() => void> = [];

  if (reduced) {
    const off = onEnterViewport(root, () => {
      if (!destroyed) ensureLottie();
    });
    return () => {
      destroyed = true;
      off();
      dot?.destroy();
      dot = null;
    };
  }

  if (wantsDraw) {
    const off = onEnterViewport(root, () => {
      if (drewOnce || destroyed) return;
      drewOnce = true;
      play();
    });
    teardowns.push(off);
  } else {
    const off = onEnterViewport(root, () => {
      if (!destroyed) ensureLottie();
    });
    teardowns.push(off);
  }

  if (wantsHover) {
    const onEnter = () => {
      if (!destroyed) play();
    };
    root.addEventListener("pointerenter", onEnter);
    teardowns.push(() => root.removeEventListener("pointerenter", onEnter));
  }

  return () => {
    destroyed = true;
    for (const t of teardowns) t();
    dot?.destroy();
    dot = null;
  };
};
