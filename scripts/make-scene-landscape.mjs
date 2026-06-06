import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";

const SRC = "assets/hero-original.png";
const OUT = "public/assets/images/scene-landscape";

const src = sharp(SRC);
const { width, height } = await src.metadata();

const cropW = Math.round(width * 0.42);

const base = sharp(SRC).extract({ left: 0, top: 0, width: cropW, height });

await base.clone().resize(1400).avif({ quality: 62 }).toFile(`${OUT}.avif`);
await base.clone().resize(1400).webp({ quality: 70 }).toFile(`${OUT}.webp`);
await base.clone().resize(1100).png().toFile("/tmp/scene-landscape.png");

console.log(`cropped ${cropW}x${height} -> ${OUT}.avif/.webp`);
