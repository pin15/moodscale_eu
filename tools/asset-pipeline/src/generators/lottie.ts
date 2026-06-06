import { makeZip } from "../util/zip.js";
import { PALETTE } from "../config.js";

function hexToLottieColor(h: string): [number, number, number, number] {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

function bodymovin(name: string): object {
  const [r, g, b] = hexToLottieColor(PALETTE.pine);
  const size = 120;
  return {
    v: "5.7.6",
    fr: 30,
    ip: 0,
    op: 60,
    w: size,
    h: size,
    nm: name,
    ddd: 0,
    assets: [],
    markers: [
      { tm: 0, cm: "draw", dr: 40 },
      { tm: 42, cm: "hover", dr: 18 },
    ],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: `${name} stroke`,
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [size / 2, size / 2, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            nm: "icon",
            it: [
              {
                ty: "el",
                nm: "ring",
                p: { a: 0, k: [0, 0] },
                s: { a: 0, k: [72, 72] },
                d: 1,
              },
              {
                ty: "tm",
                nm: "draw",
                s: { a: 0, k: 0 },
                e: {
                  a: 1,
                  k: [
                    { t: 0, s: [0], h: 0, i: { x: [0.4], y: [1] }, o: { x: [0.2], y: [0] } },
                    { t: 40, s: [100] },
                  ],
                },
                o: { a: 0, k: 0 },
                m: 1,
              },
              {
                ty: "st",
                nm: "stroke",
                c: { a: 0, k: [r, g, b, 1] },
                o: { a: 0, k: 100 },
                w: { a: 0, k: 6 },
                lc: 2,
                lj: 2,
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 },
              },
            ],
          },
        ],
        ip: 0,
        op: 60,
        st: 0,
        bm: 0,
      },
    ],
  };
}

export function lottiePlaceholder(name: string): Buffer {
  const anim = bodymovin(name);
  const manifest = {
    version: "1.0.0",
    author: "MoodScale",
    generator: "ms-asset-pipeline",
    animations: [{ id: name, speed: 1, loop: false, themeColor: PALETTE.pine }],
  };
  return makeZip([
    { name: "manifest.json", data: Buffer.from(JSON.stringify(manifest)) },
    { name: `animations/${name}.json`, data: Buffer.from(JSON.stringify(anim)) },
  ]);
}
