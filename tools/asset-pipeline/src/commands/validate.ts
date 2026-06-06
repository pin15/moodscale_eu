import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";
import { ASSETS_ROOT } from "../config.js";
import { MANIFEST, type AssetSpec } from "../manifest.js";
import { exists, readText } from "../util/fs.js";
import { log } from "../util/log.js";

interface Check {
  ok: boolean;
  msg: string;
  warn?: boolean;
}

async function dims(abs: string): Promise<{ w: number; h: number }> {
  const m = await sharp(abs).metadata();
  return { w: m.width ?? 0, h: m.height ?? 0 };
}

export async function validate(): Promise<boolean> {
  const checks: Check[] = [];
  const abs = (rel: string) => path.join(ASSETS_ROOT, rel);

  for (const spec of MANIFEST) {
    const present = exists(abs(spec.path));
    if (present) {
      checks.push({ ok: true, msg: `exists: ${spec.path}` });
    } else {
      checks.push({
        ok: !!spec.optional,
        warn: spec.optional,
        msg: `${spec.optional ? "optional missing" : "MISSING"}: ${spec.path} (doc ${spec.doc})`,
      });
    }
  }

  for (const spec of MANIFEST.filter((a) => a.kind === "depth")) {
    if (!exists(abs(spec.path))) continue;
    const d = await dims(abs(spec.path));
    const aligned = d.w === spec.width && d.h === spec.height;
    checks.push({
      ok: aligned,
      msg: `depth aligned: ${spec.path} ${d.w}×${d.h} (expected ${spec.width}×${spec.height})`,
    });
    const paired = MANIFEST.find(
      (a) => a.kind === "raster" && a.scene === spec.scene && !a.layer,
    );
    if (paired && exists(abs(paired.path))) {
      const pd = await dims(abs(paired.path));
      checks.push({
        ok: pd.w === d.w && pd.h === d.h,
        msg: `depth↔scene match: ${spec.scene} (${pd.w}×${pd.h} vs ${d.w}×${d.h})`,
      });
    }
  }

  const scenes = [...new Set(MANIFEST.filter((a) => a.layer && a.layer !== "_flat").map((a) => a.scene))];
  for (const sc of scenes) {
    const flat = `images/${sc}/_flat.avif`;
    checks.push({ ok: exists(abs(flat)), msg: `sliced scene has _flat: ${sc}` });
  }

  for (const spec of MANIFEST.filter((a) => a.kind === "svg" && a.preserveIds?.length)) {
    if (!exists(abs(spec.path))) continue;
    const txt = readText(abs(spec.path));
    const missing = spec.preserveIds!.filter((id) => !txt.includes(`id="${id}"`));
    checks.push({
      ok: missing.length === 0,
      msg: missing.length
        ? `IDs STRIPPED in ${spec.path}: ${missing.join(", ")}`
        : `IDs preserved: ${spec.path} (${spec.preserveIds!.join(", ")})`,
    });
  }

  for (const spec of MANIFEST.filter((a) => a.doc === "06")) {
    if (!exists(abs(spec.path))) continue;
    const txt = readText(abs(spec.path));
    const isStroke = /fill="none"/.test(txt) && /stroke="currentColor"/.test(txt);
    checks.push({ ok: isStroke, msg: `script is stroke centerline: ${spec.path}` });
  }

  const world = MANIFEST.find((a) => a.path === "svg/world-dotted.svg");
  if (world && exists(abs(world.path))) {
    const txt = readText(abs(world.path));
    const circles = (txt.match(/<circle/g) ?? []).length;
    checks.push({
      ok: /<pattern/.test(txt) && circles <= 2,
      msg: `world uses pattern (circles=${circles}, expect ≤2): svg/world-dotted.svg`,
    });
  }

  for (const spec of MANIFEST.filter((a) => a.kind === "lottie")) {
    if (!exists(abs(spec.path))) continue;
    const head = fs.readFileSync(abs(spec.path)).subarray(0, 2).toString("latin1");
    checks.push({ ok: head === "PK", msg: `valid dotLottie zip: ${spec.path}` });
  }

  const webm = MANIFEST.find((a) => a.path.endsWith(".webm"));
  const mp4 = MANIFEST.find((a) => a.path.endsWith(".mp4"));
  if (webm && mp4) {
    const both = exists(abs(webm.path)) && exists(abs(mp4.path));
    checks.push({
      ok: true,
      warn: !both,
      msg: both ? "video loop is dual-format (webm+mp4)" : "optional video loop not generated",
    });
  }

  log.step("✓", "Acceptance criteria");
  let failed = 0;
  for (const c of checks) {
    if (c.ok && !c.warn) log.ok(c.msg);
    else if (c.warn) log.warn(c.msg);
    else {
      log.err(c.msg);
      failed++;
    }
  }
  const pass = failed === 0;
  console.log("");
  if (pass) log.done(`PASS — ${checks.length} checks, 0 failures.`);
  else log.err(`FAIL — ${failed} of ${checks.length} checks failed.`);
  return pass;
}
