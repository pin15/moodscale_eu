import sharp from "sharp";

export type AiProvider = "local" | "replicate";

export function provider(): AiProvider {
  return (process.env.MS_AI_PROVIDER as AiProvider) || "local";
}

export interface UpscaleOpts {
  targetWidth: number;
  targetHeight?: number;
}
export async function upscale(input: Buffer, opts: UpscaleOpts): Promise<Buffer> {
  if (provider() === "replicate") return replicateUpscale(input, opts);
  const pipe = sharp(input).resize({
    width: opts.targetWidth,
    height: opts.targetHeight,
    fit: opts.targetHeight ? "cover" : "inside",
    position: "centre",
    kernel: "lanczos3",
    withoutEnlargement: false,
  });
  return pipe.median(1).sharpen({ sigma: 0.6 }).png({ compressionLevel: 9 }).toBuffer();
}

export interface DepthOpts {
  width: number;
  height: number;
}
export async function estimateDepth(
  input: Buffer | null,
  opts: DepthOpts,
): Promise<Buffer> {
  if (provider() === "replicate" && input) return replicateDepth(input, opts);
  const { width, height } = opts;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000"/>
      <stop offset="0.55" stop-color="#3a3a3a"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#d)"/>
  </svg>`;
  return sharp(Buffer.from(svg))
    .grayscale()
    .blur(2)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

export interface SegmentResult {
  layers: Record<string, Buffer>;
}
export async function segment(
  _input: Buffer,
  _layers: string[],
): Promise<SegmentResult | null> {
  if (provider() === "replicate") {
    throw new Error(
      "Replicate SAM-2 slicing not configured. Provide REPLICATE_API_TOKEN and a SAM-2 deployment, or drop pre-sliced layers into assets/<scene>/ and re-run.",
    );
  }
  return null;
}

async function replicateUpscale(_input: Buffer, _opts: UpscaleOpts): Promise<Buffer> {
  throw new Error("replicate upscale: set REPLICATE_API_TOKEN and implement the prediction call.");
}
async function replicateDepth(_input: Buffer, _opts: DepthOpts): Promise<Buffer> {
  throw new Error("replicate depth: set REPLICATE_API_TOKEN and implement the prediction call.");
}
