import { PALETTE } from "../config.js";

const svg = (
  attrs: { viewBox: string; width?: number; height?: number },
  inner: string,
  title?: string,
) => {
  const titleEl = title ? `\n  <title>${title}</title>` : "";
  const wh = attrs.width && attrs.height ? ` width="${attrs.width}" height="${attrs.height}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${attrs.viewBox}"${wh} fill="none" role="img">${titleEl}\n${inner}\n</svg>\n`;
};

export function headSilhouette(): string {
  const d = [
    "M 980 120",
    "C 1180 150 1320 320 1330 560",
    "C 1334 690 1300 800 1250 900",
    "C 1300 940 1330 1010 1300 1070",
    "C 1270 1130 1180 1150 1120 1170",
    "C 1110 1280 1130 1380 1180 1460",
    "C 1060 1470 920 1470 820 1465",
    "C 815 1380 818 1300 815 1230",
    "C 700 1210 600 1150 560 1040",
    "C 520 930 540 820 590 740",
    "C 540 700 470 690 470 640",
    "C 470 600 520 585 560 580",
    "C 545 540 540 500 560 470",
    "C 470 455 430 430 470 390",
    "C 510 360 560 360 600 380",
    "C 600 320 605 270 640 230",
    "C 700 150 840 100 980 120",
    "Z",
  ].join(" ");
  const inner = `  <defs>
    <mask id="ms-head-mask" maskUnits="userSpaceOnUse">
      <rect width="1600" height="2000" fill="black"/>
      <use href="#ms-head-path" fill="white"/>
    </mask>
  </defs>
  <path id="ms-head-path" d="${d}" fill="${PALETTE.forest}"/>`;
  return svg({ viewBox: "0 0 1600 2000" }, inner, "Profile silhouette");
}

function cursivePath(text: string, opts?: { unit?: number; amp?: number }): { d: string; w: number } {
  const unit = opts?.unit ?? 46;
  const amp = opts?.amp ?? 34;
  const baseline = 90;
  const startX = 20;
  const chars = [...text];
  let x = startX;
  let d = `M ${x} ${baseline}`;
  let i = 0;
  for (const ch of chars) {
    if (ch === " ") {
      x += unit * 0.7;
      d += ` L ${round(x)} ${baseline}`;
      i = 0;
      continue;
    }
    const up = i % 2 === 0;
    const dir = up ? -1 : 1;
    const peak = baseline + dir * amp;
    const c1x = x + unit * 0.25;
    const c2x = x + unit * 0.75;
    const nx = x + unit;
    const wobble = ((i % 3) - 1) * 6;
    d += ` C ${round(c1x)} ${round(peak + wobble)} ${round(c2x)} ${round(peak - wobble)} ${round(nx)} ${baseline}`;
    x = nx;
    i++;
  }
  return { d, w: Math.ceil(x + startX) };
}

const round = (n: number) => Math.round(n * 10) / 10;

export function scriptWord(word: string): string {
  const label = word.replace(/-/g, " ");
  const { d, w } = cursivePath(label);
  const height = 180;
  const inner = `  <path id="ms-script-${word}" d="${d}"
    fill="none" stroke="currentColor" stroke-width="7"
    stroke-linecap="round" stroke-linejoin="round"/>
  <!-- DRAFT centerline: structurally a true single stroke (DrawSVG-ready).
       Replace d="" with the traced brand lettering for "${label}". -->`;
  return svg({ viewBox: `0 0 ${w} ${height}` }, inner, label);
}

function leaf(cx: number, cy: number, angle: number, scale = 1): string {
  const w = 26 * scale;
  const h = 54 * scale;
  const leafPath = `M 0 ${-h / 2} C ${w} ${-h / 6} ${w} ${h / 6} 0 ${h / 2} C ${-w} ${h / 6} ${-w} ${-h / 6} 0 ${-h / 2} Z`;
  const vein = `M 0 ${-h / 2} L 0 ${h / 2}`;
  return `    <g class="leaf" transform="translate(${cx} ${cy}) rotate(${angle})">
      <path d="${leafPath}" fill="${PALETTE.leaf}"/>
      <path d="${vein}" stroke="${PALETTE.pine}" stroke-width="1.5" fill="none"/>
    </g>`;
}

export function branch(id: string, mirror: boolean): string {
  const dirX = mirror ? -1 : 1;
  const sx = mirror ? 360 : 0;
  const stem = `M ${sx} 0 C ${sx + dirX * 90} 60 ${sx + dirX * 150} 150 ${sx + dirX * 230} 300`;
  const leaves: string[] = [];
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    const x = sx + dirX * (90 * t + 230 * t * t);
    const y = 60 * t + 300 * t * t;
    const ang = (mirror ? -1 : 1) * (35 + i * 8) * (i % 2 === 0 ? -1 : 1);
    leaves.push(leaf(x, y, ang, 1 - t * 0.4));
  }
  const inner = `  <g id="${id}">
    <path d="${stem}" stroke="${PALETTE.moss}" stroke-width="4" fill="none" stroke-linecap="round"/>
${leaves.join("\n")}
  </g>`;
  return svg({ viewBox: "0 0 360 360" }, inner, "Leaf branch");
}

export function sprig(id: string): string {
  const stem = "M 60 110 C 70 80 80 50 90 20";
  const leaves = [leaf(72, 78, 50, 0.7), leaf(80, 52, -50, 0.7), leaf(88, 28, 40, 0.6)].join("\n");
  const inner = `  <g id="${id}">
    <path d="${stem}" stroke="${PALETTE.moss}" stroke-width="3" fill="none" stroke-linecap="round"/>
${leaves}
  </g>`;
  return svg({ viewBox: "0 0 120 120" }, inner, "Leaf sprig");
}

export function bird(): string {
  const inner = `  <g id="ms-bird" stroke="${PALETTE.pine}" stroke-width="4" fill="none" stroke-linecap="round">
    <path d="M 6 28 Q 26 6 48 24"/>
    <path d="M 48 24 Q 70 6 90 28"/>
  </g>`;
  return svg({ viewBox: "0 0 96 40" }, inner, "Bird");
}

export function indiaOutline(): string {
  const d = [
    "M 300 90",
    "C 360 70 430 80 470 120",
    "C 520 110 560 140 560 190",
    "C 600 210 620 260 600 300",
    "C 640 340 650 410 610 470",
    "C 600 560 560 660 520 760",
    "C 500 860 470 980 430 1080",
    "C 410 1130 380 1140 360 1090",
    "C 330 1000 300 900 280 800",
    "C 230 760 190 700 200 640",
    "C 150 600 120 540 150 480",
    "C 130 420 150 360 200 330",
    "C 210 270 240 210 290 180",
    "C 270 140 280 110 300 90",
    "Z",
  ].join(" ");
  const inner = `  <path id="ms-india-outline" d="${d}"
    fill="${PALETTE.mist}" stroke="${PALETTE.pine}" stroke-width="4"/>
  <!-- DRAFT simplified outline. Replace with a licensed/accurate India border. -->`;
  return svg({ viewBox: "0 0 760 1180" }, inner, "India");
}

export function worldDotted(): string {
  const continents = [
    "M 120 150 C 220 110 360 120 420 180 C 470 230 440 320 360 350 C 250 380 140 340 110 270 C 90 230 90 180 120 150 Z",
    "M 300 380 C 360 360 420 400 430 470 C 440 560 400 660 340 690 C 290 700 270 620 280 540 C 285 470 280 410 300 380 Z",
    "M 560 160 C 660 130 760 150 800 210 C 830 260 800 330 720 350 C 620 370 540 330 530 260 C 525 210 530 180 560 160 Z",
    "M 820 200 C 980 170 1180 190 1280 250 C 1330 290 1300 360 1180 380 C 1000 400 860 360 820 290 C 805 250 805 220 820 200 Z",
    "M 640 420 C 720 400 800 440 810 520 C 820 610 770 700 690 720 C 630 725 615 640 625 560 C 630 490 625 450 640 420 Z",
    "M 1180 560 C 1280 540 1360 580 1370 640 C 1380 700 1330 740 1250 740 C 1180 740 1150 690 1160 630 C 1163 600 1165 575 1180 560 Z",
  ];
  const paths = continents
    .map((d, i) => `    <path d="${d}" fill="url(#ms-dot-pattern)" data-continent="${i}"/>`)
    .join("\n");
  const inner = `  <defs>
    <pattern id="ms-dot-pattern" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle id="ms-dot" cx="6" cy="6" r="3" fill="${PALETTE.sage}"/>
    </pattern>
  </defs>
  <g id="ms-world">
${paths}
  </g>`;
  return svg({ viewBox: "0 0 1440 800" }, inner, "World map");
}

export function waterMask(): string {
  const d = "M 0 900 C 640 860 1280 940 1920 900 C 2240 880 2560 920 2560 920 L 2560 1440 L 0 1440 Z";
  const inner = `  <mask id="ms-water-mask" maskUnits="userSpaceOnUse">
    <rect width="2560" height="1440" fill="black"/>
    <path id="ms-water-region" d="${d}" fill="white"/>
  </mask>
  <path d="${d}" fill="${PALETTE.moss}" mask="url(#ms-water-mask)" opacity="0.5"/>`;
  return svg({ viewBox: "0 0 2560 1440" }, inner, "Water region mask");
}
