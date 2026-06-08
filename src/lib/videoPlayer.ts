/**
 * Cross-browser ambient video initialiser.
 *
 * Handles:
 *  - Safari (macOS + iOS): playsinline, webkit-playsinline, muted autoplay
 *  - Firefox: muted autoplay, error fallback
 *  - Chrome/Edge: standard muted autoplay + IntersectionObserver
 *  - Data-saver / slow connections: skip video entirely
 *  - prefers-reduced-motion: freeze on poster
 *  - Autoplay blocked: hide video, show poster behind it
 *  - Network / codec errors: hide video gracefully
 *  - View transitions: full cleanup to prevent listener accumulation
 */

interface VideoOptions {
  threshold?: number;   // IntersectionObserver threshold (0–1)
  playbackRate?: number;
}

export function initVideo(video: HTMLVideoElement, opts: VideoOptions = {}): () => void {
  const { threshold = 0, playbackRate = 1 } = opts;

  // Old iOS Safari needs the webkit- prefixed attribute set in JS too
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  if (playbackRate !== 1) {
    video.playbackRate = playbackRate;
  }

  // --- Data-saver / slow connection: skip video entirely ---
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
    video.removeAttribute('autoplay');
    video.preload = 'none';
    return () => {};
  }

  // --- Reduced motion: stay on poster ---
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) {
    video.pause();
    video.removeAttribute('autoplay');
    video.load(); // forces poster frame to paint
    return () => {};
  }

  let inView = false;
  let destroyed = false;

  const tryPlay = () => {
    if (destroyed) return;
    if (inView && !document.hidden) {
      video.play().catch(() => {
        // Autoplay blocked (e.g. Safari strict policy, low-power mode)
        // Hide the video — the CSS poster / section background shows through
        video.style.opacity = '0';
      });
    } else {
      video.pause();
    }
  };

  // Graceful error fallback (codec missing, network error, 404)
  const onError = () => { video.style.opacity = '0'; };
  video.addEventListener('error', onError);

  // IntersectionObserver — play only while visible
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { inView = e.isIntersecting; tryPlay(); }),
    { threshold },
  );
  io.observe(video);

  // Tab visibility
  const onVisibility = () => tryPlay();
  document.addEventListener('visibilitychange', onVisibility);

  // Cleanup — called on astro:before-swap to prevent listener accumulation
  return () => {
    destroyed = true;
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    video.removeEventListener('error', onError);
    video.pause();
  };
}
