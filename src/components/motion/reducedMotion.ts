const mq = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

export function prefersReducedMotion(): boolean {
  return !!mq?.matches;
}

export function onEnterViewport(
  el: Element, cb: () => void, rootMargin = "200px 0px"
): () => void {
  if (!("IntersectionObserver" in window)) { cb(); return () => {}; }
  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) if (e.isIntersecting) { cb(); obs.disconnect(); }
  }, { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}
