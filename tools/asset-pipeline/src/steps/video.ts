import { spawnSync } from "node:child_process";
import path from "node:path";
import { ASSETS_ROOT } from "../config.js";
import { ensureDir } from "../util/fs.js";

export function ffmpegAvailable(): boolean {
  const r = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  return r.status === 0;
}

function run(args: string[]): void {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ffmpeg ${args.join(" ")}`);
}

export function makeAmbientLoop(
  stillPng: string,
  webmRel: string,
  mp4Rel: string,
  seconds = 6,
): { webm: string; mp4: string } {
  const fps = 25;
  const frames = seconds * fps;
  const webmOut = path.join(ASSETS_ROOT, webmRel);
  const mp4Out = path.join(ASSETS_ROOT, mp4Rel);
  ensureDir(path.dirname(webmOut));

  const zoom = `zoompan=z='1.0+0.04*sin(2*PI*on/${frames})':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${fps}`;
  const common = ["-loop", "1", "-i", stillPng, "-t", String(seconds), "-an", "-vf", zoom];

  run([
    ...common,
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "36",
    "-pix_fmt",
    "yuv420p",
    webmOut,
  ]);
  run([
    ...common,
    "-c:v",
    "libx264",
    "-crf",
    "26",
    "-preset",
    "slow",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4Out,
  ]);

  return { webm: webmRel, mp4: mp4Rel };
}
