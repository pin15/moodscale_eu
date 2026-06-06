import sharp from "sharp";
import { PALETTE } from "../config.js";

type RGBA = { r: number; g: number; b: number; alpha?: number };

function hex(h: string, alpha = 1): RGBA {
  const n = parseInt(h.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, alpha };
}

function sceneSvg(
  w: number,
  h: number,
  topHex: string,
  botHex: string,
  label: string,
  opts: { transparentTop?: boolean; band?: { y: number; hex: string } } = {},
): Buffer {
  const band = opts.band
    ? `<rect x="0" y="${opts.band.y}" width="${w}" height="${h - opts.band.y}" fill="${opts.band.hex}" opacity="0.92"/>`
    : "";
  const topOpacity = opts.transparentTop ? 0 : 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${topHex}" stop-opacity="${topOpacity}"/>
      <stop offset="1" stop-color="${botHex}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  ${band}
  <text x="${w / 2}" y="${h / 2}" font-family="sans-serif" font-size="${Math.round(h / 16)}"
    fill="#ffffff" fill-opacity="0.35" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`;
  return Buffer.from(svg);
}

function layerAppearance(layer: string, scene: string) {
  const map: Record<string, { top: string; bot: string; transparentTop?: boolean }> = {
    sky: { top: PALETTE.haze, bot: PALETTE.mist },
    mountains: { top: PALETTE.sage, bot: PALETTE.moss, transparentTop: true },
    hills: { top: PALETTE.moss, bot: PALETTE.pine, transparentTop: true },
    lake: { top: PALETTE.mist, bot: PALETTE.sage, transparentTop: true },
    foreground: { top: PALETTE.pine, bot: PALETTE.forest, transparentTop: true },
    figures: { top: PALETTE.forest, bot: PALETTE.ink, transparentTop: true },
    _flat: { top: PALETTE.haze, bot: PALETTE.forest },
    head: { top: PALETTE.haze, bot: PALETTE.pine },
    "lake-vista": { top: PALETTE.haze, bot: PALETTE.moss },
    "head-fallback": { top: PALETTE.haze, bot: PALETTE.pine },
    india: { top: PALETTE.mist, bot: PALETTE.sage },
  };
  return map[layer] ?? { top: PALETTE.mist, bot: PALETTE.pine };
}

export async function placeholderScene(
  w: number,
  h: number,
  layer: string,
  scene: string,
): Promise<Buffer> {
  const a = layerAppearance(layer, scene);
  const label = `${scene}/${layer}`;
  const svg = sceneSvg(w, h, a.top, a.bot, label, { transparentTop: a.transparentTop });
  return sharp(svg).png().toBuffer();
}
