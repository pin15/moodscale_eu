import path from "node:path";
import sharp from "sharp";
import { ASSETS_ROOT, ENCODE, SRCSET_WIDTHS } from "../config.js";
import { writeBytes } from "../util/fs.js";

export interface DeliverResult {
  primary: string;
  webp: string | null;
  srcset: string[];
}

export async function deliverRaster(
  relPath: string,
  png: Buffer,
  responsive: boolean,
): Promise<DeliverResult> {
  const target = path.join(ASSETS_ROOT, relPath);
  const dir = path.dirname(target);
  const base = path.basename(relPath, ".avif");

  const meta = await sharp(png).metadata();

  const avif = await sharp(png)
    .avif({ quality: ENCODE.avifQuality, effort: ENCODE.avifEffort })
    .toBuffer();
  writeBytes(target, avif);

  const result: DeliverResult = { primary: relPath, webp: null, srcset: [] };
  if (!responsive) return result;

  const webp = await sharp(png).webp({ quality: ENCODE.webpQuality }).toBuffer();
  writeBytes(path.join(dir, `${base}.webp`), webp);
  result.webp = relPath.replace(/\.avif$/, ".webp");

  const srcW = meta.width ?? SRCSET_WIDTHS[SRCSET_WIDTHS.length - 1];
  for (const w of SRCSET_WIDTHS) {
    if (w > srcW) continue;
    const resized = sharp(png).resize({ width: w, withoutEnlargement: true });
    const a = await resized
      .clone()
      .avif({ quality: ENCODE.avifQuality, effort: ENCODE.avifEffort })
      .toBuffer();
    const wp = await resized.clone().webp({ quality: ENCODE.webpQuality }).toBuffer();
    writeBytes(path.join(dir, `${base}-${w}w.avif`), a);
    writeBytes(path.join(dir, `${base}-${w}w.webp`), wp);
    result.srcset.push(`${base}-${w}w.avif`, `${base}-${w}w.webp`);
  }
  return result;
}
