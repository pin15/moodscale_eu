import { prefersReducedMotion, onEnterViewport } from "@/components/motion/reducedMotion";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  highlight: boolean;
  glow: number;
}

interface Pulse {
  ox: number;
  oy: number;
  radius: number;
}

function readRGB(styles: CSSStyleDeclaration, varName: string, fallback: string): string {
  const raw = styles.getPropertyValue(varName).trim() || fallback;
  if (raw.startsWith("#")) {
    const hex = raw.slice(1);
    const n =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const int = parseInt(n, 16);
    return `${(int >> 16) & 255},${(int >> 8) & 255},${int & 255}`;
  }
  return raw;
}

export function initNeuralNodes(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>("canvas");
  const ctx = canvas?.getContext("2d") ?? null;
  if (!canvas || !ctx) return () => {};

  const reduced = prefersReducedMotion() || root.dataset.fxStatic === "1";

  const styles = getComputedStyle(root);
  const LEAF = readRGB(styles, "--ms-leaf", "#9CBE84");
  const MIST = readRGB(styles, "--ms-mist", "#CFE0C8");
  const SAGE = readRGB(styles, "--ms-sage", "#7C9A6E");

  const NODE_ALPHA = 0.7;
  const LINK_MAX_ALPHA = 0.25;
  const DRIFT_MIN = 6;
  const DRIFT_MAX = 12;
  const PULSE_INTERVAL = 5;
  const PULSE_SPEED = 130;
  const PULSE_BAND = 46;
  const PULSE_STRENGTH = 0.9;

  let width = 0;
  let height = 0;
  let maxDist = 120;
  let nodes: Node[] = [];
  let pulses: Pulse[] = [];
  let raf = 0;
  let running = false;
  let lastT = 0;
  let pulseTimer = PULSE_INTERVAL * 0.5;

  function nodeCount(): number {
    const target = Math.round((width * height) / 9000);
    return Math.max(40, Math.min(70, target));
  }

  function makeNodes(): Node[] {
    const count = nodeCount();
    const out: Node[] = [];
    for (let i = 0; i < count; i++) {
      const speed = DRIFT_MIN + rand() * (DRIFT_MAX - DRIFT_MIN);
      const ang = rand() * Math.PI * 2;
      out.push({
        x: rand() * width,
        y: rand() * height,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        r: 1.5 + rand() * 1.5,
        highlight: rand() < 0.18,
        glow: 0,
      });
    }
    return out;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = root.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);

    if (nodes.length && width > 0 && height > 0) {
      const sx = w / width;
      const sy = h / height;
      for (const n of nodes) {
        n.x *= sx;
        n.y *= sy;
      }
    }

    width = w;
    height = h;
    canvas!.width = Math.round(w * dpr);
    canvas!.height = Math.round(h * dpr);
    canvas!.style.width = `${w}px`;
    canvas!.style.height = `${h}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    maxDist = Math.max(80, Math.min(width, height) * 0.32);

    if (!nodes.length) nodes = makeNodes();

    if (!running) drawStaticFrame();
  }

  function step(dt: number) {
    for (const n of nodes) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < 0) {
        n.x = 0;
        n.vx = -n.vx;
      } else if (n.x > width) {
        n.x = width;
        n.vx = -n.vx;
      }
      if (n.y < 0) {
        n.y = 0;
        n.vy = -n.vy;
      } else if (n.y > height) {
        n.y = height;
        n.vy = -n.vy;
      }
      n.glow *= 0.9;
    }

    pulseTimer -= dt;
    if (pulseTimer <= 0 && nodes.length) {
      pulseTimer += PULSE_INTERVAL;
      const origin = nodes[(rand() * nodes.length) | 0];
      pulses.push({ ox: origin.x, oy: origin.y, radius: 0 });
    }
    const diag = Math.hypot(width, height);
    for (const p of pulses) {
      p.radius += PULSE_SPEED * dt;
      for (const n of nodes) {
        const d = Math.hypot(n.x - p.ox, n.y - p.oy);
        const band = Math.abs(d - p.radius);
        if (band < PULSE_BAND) {
          const add = PULSE_STRENGTH * (1 - band / PULSE_BAND);
          if (add > n.glow) n.glow = add;
        }
      }
    }
    pulses = pulses.filter((p) => p.radius < diag + PULSE_BAND);
  }

  function draw() {
    ctx!.clearRect(0, 0, width, height);

    ctx!.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist >= maxDist) continue;
        const fade = 1 - dist / maxDist;
        const pulse = Math.max(a.glow, b.glow);
        const alpha = Math.min(
          LINK_MAX_ALPHA * fade + pulse * 0.18,
          LINK_MAX_ALPHA + 0.18,
        );
        ctx!.strokeStyle = `rgba(${SAGE},${alpha})`;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }
    }

    for (const n of nodes) {
      const color = n.highlight ? MIST : LEAF;
      const alpha = Math.min(NODE_ALPHA + n.glow * 0.3, 1);
      if (n.highlight || n.glow > 0.02) {
        const haloR = n.r * (2.4 + n.glow * 2.2);
        const g = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
        g.addColorStop(0, `rgba(${color},${0.22 + n.glow * 0.4})`);
        g.addColorStop(1, `rgba(${color},0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, haloR, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.fillStyle = `rgba(${color},${alpha})`;
      ctx!.beginPath();
      ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function drawStaticFrame() {
    for (const n of nodes) n.glow = 0;
    pulses = [];
    draw();
  }

  function frame(t: number) {
    if (!running) return;
    const dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 0;
    lastT = t;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    lastT = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  let entered = false;
  const off = onEnterViewport(root, () => {
    entered = true;
    if (reduced) {
      drawStaticFrame();
      return;
    }
    if (!document.hidden) start();
  });

  const onVisibility = () => {
    if (reduced || !entered) return;
    if (document.hidden) stop();
    else start();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    stop();
    off();
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

function rand(): number {
  return Math.random();
}
