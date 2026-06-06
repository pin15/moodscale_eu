export type AssetKind = "raster" | "depth" | "svg" | "lottie" | "video";

export interface AssetSpec {
  path: string;
  kind: AssetKind;
  doc: string;
  optional?: boolean;
  scene?: string;
  layer?: string;
  responsive?: boolean;
  preserveIds?: string[];
  width?: number;
  height?: number;
  note?: string;
}

const SCENE_DIM = { width: 2560, height: 1440 };

function slicedScene(
  scene: string,
  layers: { layer: string; optional?: boolean }[],
): AssetSpec[] {
  const specs: AssetSpec[] = layers.map(({ layer, optional }) => ({
    path: `images/${scene}/${layer}.avif`,
    kind: "raster",
    doc: "04",
    scene,
    layer,
    optional,
    responsive: true,
    ...SCENE_DIM,
  }));
  specs.push({
    path: `images/${scene}/_flat.avif`,
    kind: "raster",
    doc: "04",
    scene,
    layer: "_flat",
    responsive: true,
    ...SCENE_DIM,
    note: "Flattened composite fallback (reduced-motion / asset failure).",
  });
  return specs;
}

export const MANIFEST: AssetSpec[] = [
  {
    path: "images/head-scene.avif",
    kind: "raster",
    doc: "02",
    scene: "head",
    responsive: true,
    width: 1600,
    height: 2000,
    note: "Inner landscape/scene, full-bleed within head bbox.",
  },
  {
    path: "depth/head-scene-depth.png",
    kind: "depth",
    doc: "02",
    scene: "head",
    width: 1600,
    height: 2000,
    note: "Grayscale depth of the INNER scene. white=near, black=far. Pixel-aligned to head-scene.",
  },
  {
    path: "svg/head-silhouette.svg",
    kind: "svg",
    doc: "02/03",
    preserveIds: ["ms-head-path", "ms-head-mask"],
    width: 1600,
    height: 2000,
    note: "Single closed path. Alpha mask (doc 02) / CSS mask (doc 03). Shared.",
  },
  {
    path: "images/head-fallback.avif",
    kind: "raster",
    doc: "02",
    scene: "head",
    responsive: true,
    width: 1600,
    height: 2000,
    note: "Flattened static composite (reduced-motion / no-WebGL).",
  },

  ...slicedScene("hero", [
    { layer: "sky" },
    { layer: "mountains" },
    { layer: "hills" },
    { layer: "lake", optional: true },
    { layer: "foreground" },
    { layer: "figures", optional: true },
  ]),
  ...slicedScene("our-story", [
    { layer: "sky" },
    { layer: "mountains" },
    { layer: "hills" },
    { layer: "foreground" },
  ]),

  {
    path: "images/lake-vista.avif",
    kind: "raster",
    doc: "04",
    scene: "lake-vista",
    responsive: true,
    ...SCENE_DIM,
    note: "Single image for the WebGL depth-displacement showcase scene.",
  },
  {
    path: "depth/lake-vista-depth.png",
    kind: "depth",
    doc: "04",
    scene: "lake-vista",
    ...SCENE_DIM,
    note: "Depth map for mode-B plane. Pixel-aligned. white=near, black=far.",
  },

  {
    path: "svg/hero-water-mask.svg",
    kind: "svg",
    doc: "05",
    optional: true,
    preserveIds: ["ms-water-mask", "ms-water-region"],
    note: "Confines the shimmer filter to the water region when it isn't a clean rect.",
  },

  ...["empathy", "together", "fulfilling-lives", "happier-future"].map(
    (word): AssetSpec => ({
      path: `svg/script/${word}.svg`,
      kind: "svg",
      doc: "06",
      preserveIds: [`ms-script-${word}`],
      note: "TRUE centerline stroke (fill:none; stroke:currentColor). Author point order left→right for DrawSVG.",
    }),
  ),

  {
    path: "svg/leaves/branch-tl.svg",
    kind: "svg",
    doc: "09",
    preserveIds: ["ms-branch-tl"],
    note: "Top-left branch cluster; each leaf in its own <g class=\"leaf\">.",
  },
  {
    path: "svg/leaves/branch-tr.svg",
    kind: "svg",
    doc: "09",
    preserveIds: ["ms-branch-tr"],
    note: "Top-right branch cluster.",
  },
  {
    path: "svg/leaves/sprig-1.svg",
    kind: "svg",
    doc: "09",
    optional: true,
    preserveIds: ["ms-sprig-1"],
  },
  {
    path: "svg/leaves/sprig-2.svg",
    kind: "svg",
    doc: "09",
    optional: true,
    preserveIds: ["ms-sprig-2"],
  },
  {
    path: "svg/birds/bird.svg",
    kind: "svg",
    doc: "09",
    preserveIds: ["ms-bird"],
    note: "Simple 2-stroke gull; tiny 2-frame wing flap possible.",
  },

  ...[
    "smart-matching",
    "emotional-journey",
    "hands-heart",
    "brain",
    "ai-chip",
    "lotus",
    "globe",
    "shield",
    "growth-chart",
  ].map(
    (icon): AssetSpec => ({
      path: `lottie/${icon}.lottie`,
      kind: "lottie",
      doc: "11",
      note: "dotLottie. MoodScale greens, print line weight. enter/draw + hover segments.",
    }),
  ),

  {
    path: "svg/india.svg",
    kind: "svg",
    doc: "13",
    preserveIds: ["ms-india-outline"],
    note: "India outline; raster companion images/india.avif optional.",
  },
  {
    path: "images/india.avif",
    kind: "raster",
    doc: "13",
    optional: true,
    responsive: true,
    width: 1200,
    height: 1400,
    note: "Optional watercolor raster companion to india.svg.",
  },
  {
    path: "svg/world-dotted.svg",
    kind: "svg",
    doc: "13",
    preserveIds: ["ms-dot", "ms-dot-pattern"],
    note: "Dotted world as a <pattern> (NOT thousands of <circle>s).",
  },

  {
    path: "video/lake-vista.webm",
    kind: "video",
    doc: "04/14",
    optional: true,
    scene: "lake-vista",
    note: "Seamless breathing loop, VP9/AV1. Alternate background under doc 04.",
  },
  {
    path: "video/lake-vista.mp4",
    kind: "video",
    doc: "04/14",
    optional: true,
    scene: "lake-vista",
    note: "H.264 fallback for the ambient loop.",
  },
];

export const byKind = (k: AssetKind) => MANIFEST.filter((a) => a.kind === k);
export const requiredAssets = () => MANIFEST.filter((a) => !a.optional);
export const sceneNames = () =>
  [...new Set(MANIFEST.map((a) => a.scene).filter(Boolean))] as string[];
