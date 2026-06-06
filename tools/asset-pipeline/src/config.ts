import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

export const RAW_DIR = path.join(REPO_ROOT, "assets");

export const ASSETS_ROOT = path.join(REPO_ROOT, "src", "assets");

export const DIRS = {
  images: path.join(ASSETS_ROOT, "images"),
  depth: path.join(ASSETS_ROOT, "depth"),
  svg: path.join(ASSETS_ROOT, "svg"),
  lottie: path.join(ASSETS_ROOT, "lottie"),
  video: path.join(ASSETS_ROOT, "video"),
};

export const PALETTE = {
  forest: "#1E3A2B",
  pine: "#2F5740",
  moss: "#4E7355",
  sage: "#7C9A6E",
  leaf: "#9CBE84",
  mist: "#CFE0C8",
  haze: "#E7EFE0",
  cream: "#F6F3EA",
  paper: "#FBFAF5",
  ink: "#243027",
  inkSoft: "#4A5A4D",
  onDark: "#EEF3E8",
} as const;

export const SRCSET_WIDTHS = [640, 960, 1280, 1920, 2560];

export const ENCODE = {
  avifQuality: 58,
  avifEffort: 5,
  webpQuality: 80,
  pngCompression: 9,
} as const;

export const MAX_RASTER_WIDTH = 2560;
