import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import sharp from "sharp";
import { ASSETS_ROOT, DIRS, RAW_DIR, ENCODE } from "../config.js";
import { MANIFEST, type AssetSpec } from "../manifest.js";
import { firstExisting, writeBytes, writeText, ensureDir } from "../util/fs.js";
import { log } from "../util/log.js";
import { optimizeSvg } from "../util/svgo.js";
import { upscale, estimateDepth, provider } from "../adapters/ai.js";
import { deliverRaster } from "../steps/optimize.js";
import { makeAmbientLoop, ffmpegAvailable } from "../steps/video.js";
import { lottiePlaceholder } from "../generators/lottie.js";
import { placeholderScene } from "../generators/raster.js";
import {
  headSilhouette,
  scriptWord,
  branch,
  sprig,
  bird,
  indiaOutline,
  worldDotted,
  waterMask,
} from "../generators/svg.js";

export interface GenerateOpts {
  useRealInputs: boolean;
}

function svgSourceFor(relPath: string): string | null {
  if (relPath === "svg/head-silhouette.svg") return headSilhouette();
  if (relPath === "svg/hero-water-mask.svg") return waterMask();
  if (relPath === "svg/india.svg") return indiaOutline();
  if (relPath === "svg/world-dotted.svg") return worldDotted();
  if (relPath === "svg/birds/bird.svg") return bird();
  if (relPath === "svg/leaves/branch-tl.svg") return branch("ms-branch-tl", false);
  if (relPath === "svg/leaves/branch-tr.svg") return branch("ms-branch-tr", true);
  if (relPath === "svg/leaves/sprig-1.svg") return sprig("ms-sprig-1");
  if (relPath === "svg/leaves/sprig-2.svg") return sprig("ms-sprig-2");
  const m = relPath.match(/^svg\/script\/(.+)\.svg$/);
  if (m) return scriptWord(m[1]);
  return null;
}

function realSourceFor(spec: AssetSpec, useRealInputs: boolean): string | null {
  if (!useRealInputs) return null;
  const hero = path.join(RAW_DIR, "hero-original.png");
  if (spec.scene && spec.layer) {
    const sliced = firstExisting(
      path.join(RAW_DIR, spec.scene, `${spec.layer}.png`),
      path.join(RAW_DIR, spec.scene, `${spec.layer}.jpg`),
    );
    if (sliced) return sliced;
  }
  const realMap: Record<string, string> = {
    "images/hero/_flat.avif": hero,
    "images/lake-vista.avif": hero,
    "images/head-scene.avif": hero,
    "images/head-fallback.avif": hero,
  };
  return firstExisting(realMap[spec.path] ?? "");
}

async function buildRaster(spec: AssetSpec, opts: GenerateOpts): Promise<string> {
  const w = spec.width ?? 2560;
  const h = spec.height ?? 1440;
  const real = realSourceFor(spec, opts.useRealInputs);

  let cleanPng: Buffer;
  if (real) {
    const src = await sharp(real).png().toBuffer();
    cleanPng = await upscale(src, { targetWidth: w, targetHeight: h });
  } else {
    cleanPng = await placeholderScene(w, h, spec.layer ?? path.basename(spec.path, ".avif"), spec.scene ?? "scene");
  }

  const r = await deliverRaster(spec.path, cleanPng, !!spec.responsive);
  return real
    ? `${spec.path} (from real source${r.srcset.length ? `, +${r.srcset.length / 2} srcset` : ""})`
    : `${spec.path} (placeholder${r.srcset.length ? `, +${r.srcset.length / 2} srcset` : ""})`;
}

async function buildDepth(spec: AssetSpec, opts: GenerateOpts): Promise<string> {
  const w = spec.width ?? 2560;
  const h = spec.height ?? 1440;
  let input: Buffer | null = null;
  if (provider() === "replicate") {
    const still = realSourceFor({ ...spec, path: `images/${spec.scene}.avif` }, opts.useRealInputs);
    if (still) input = await sharp(still).png().toBuffer();
  }
  const depth = await estimateDepth(input, { width: w, height: h });
  const target = path.join(ASSETS_ROOT, spec.path);
  writeBytes(target, depth);
  return `${spec.path} (${w}×${h}, white=near/black=far)`;
}

async function buildSvg(spec: AssetSpec): Promise<string> {
  const raw = svgSourceFor(spec.path);
  if (!raw) throw new Error(`No SVG generator registered for ${spec.path}`);
  const { data, keptIds, missingIds } = optimizeSvg(raw, spec.preserveIds ?? []);
  if (missingIds.length) {
    throw new Error(`SVGO stripped protected ids on ${spec.path}: ${missingIds.join(", ")}`);
  }
  writeText(path.join(ASSETS_ROOT, spec.path), data);
  const idNote = keptIds.length ? ` [ids kept: ${keptIds.join(", ")}]` : "";
  return `${spec.path}${idNote}`;
}

function buildLottie(spec: AssetSpec): string {
  const name = path.basename(spec.path, ".lottie");
  writeBytes(path.join(ASSETS_ROOT, spec.path), lottiePlaceholder(name));
  return `${spec.path} (dotLottie: draw+hover markers)`;
}

export async function generateAll(opts: GenerateOpts): Promise<void> {
  for (const d of Object.values(DIRS)) ensureDir(d);

  log.step(1, `Upscale & clean — provider: ${provider()}`);
  log.step("2–4 / 7", "Generate & deliver assets");

  const rasters = MANIFEST.filter((a) => a.kind === "raster");
  for (const spec of rasters) log.ok(await buildRaster(spec, opts));

  const depths = MANIFEST.filter((a) => a.kind === "depth");
  for (const spec of depths) log.ok(await buildDepth(spec, opts));

  log.step(4, "Vectorize (SVGO ID-preserving)");
  const svgs = MANIFEST.filter((a) => a.kind === "svg");
  for (const spec of svgs) log.ok(await buildSvg(spec));

  log.step(5, "Lottie icons");
  const lotties = MANIFEST.filter((a) => a.kind === "lottie");
  for (const spec of lotties) log.ok(buildLottie(spec));

  log.step(6, "Ambient video loop (optional)");
  await buildVideos();

  writeText(
    path.join(ASSETS_ROOT, "ASSETS.json"),
    JSON.stringify(
      { generatedBy: "ms-asset-pipeline", provider: provider(), encode: ENCODE, assets: MANIFEST },
      null,
      2,
    ),
  );
  log.ok("Wrote src/assets/ASSETS.json (delivery report)");
}

async function buildVideos(): Promise<void> {
  const videos = MANIFEST.filter((a) => a.kind === "video");
  if (!videos.length) return;
  if (!ffmpegAvailable()) {
    log.warn("ffmpeg not found — skipping optional video loops.");
    return;
  }
  const stillAvif = path.join(ASSETS_ROOT, "images/lake-vista.avif");
  const stillPng = path.join(os.tmpdir(), `ms-lake-vista-still-${process.pid}.png`);
  await sharp(stillAvif).png().toFile(stillPng);

  const webm = videos.find((v) => v.path.endsWith(".webm"));
  const mp4 = videos.find((v) => v.path.endsWith(".mp4"));
  try {
    if (webm && mp4) {
      makeAmbientLoop(stillPng, webm.path, mp4.path, 6);
      log.ok(`${webm.path} + ${mp4.path} (seamless 6s loop, muted, dual-format)`);
    }
  } finally {
    fs.rmSync(stillPng, { force: true });
  }
}
