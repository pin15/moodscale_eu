import { optimize, type Config } from "svgo";

export function optimizeSvg(
  source: string,
  protectedIds: string[] = [],
): { data: string; keptIds: string[]; missingIds: string[] } {
  const config: Config = {
    multipass: true,
    js2svg: { pretty: false, indent: 0 },
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            cleanupIds: false,
            removeViewBox: false,
            removeTitle: false,
            removeHiddenElems: false,
            removeUselessDefs: false,
            convertShapeToPath: false,
            mergePaths: false,
            inlineStyles: false,
          },
        },
      },
    ],
  };

  const result = optimize(source, config);
  const data = result.data;
  const kept: string[] = [];
  const missing: string[] = [];
  for (const id of protectedIds) {
    if (new RegExp(`id="${escapeRe(id)}"`).test(data)) kept.push(id);
    else missing.push(id);
  }
  return { data, keptIds: kept, missingIds: missing };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
