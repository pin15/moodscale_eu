#!/usr/bin/env -S npx tsx
import { generateAll } from "./commands/generate.js";
import { validate } from "./commands/validate.js";
import { MANIFEST } from "./manifest.js";
import { log } from "./util/log.js";

async function main() {
  const cmd = process.argv[2] ?? "build";

  switch (cmd) {
    case "build": {
      log.done("MoodScale asset pipeline — BUILD (real inputs where present)");
      await generateAll({ useRealInputs: true });
      const ok = await validate();
      process.exit(ok ? 0 : 1);
      break;
    }
    case "placeholders": {
      log.done("MoodScale asset pipeline — PLACEHOLDERS (offline stand-ins)");
      await generateAll({ useRealInputs: false });
      const ok = await validate();
      process.exit(ok ? 0 : 1);
      break;
    }
    case "validate": {
      const ok = await validate();
      process.exit(ok ? 0 : 1);
      break;
    }
    case "manifest": {
      const rows = MANIFEST.map((a) => ({
        path: a.path,
        kind: a.kind,
        doc: a.doc,
        optional: a.optional ? "opt" : "req",
        ids: (a.preserveIds ?? []).join(",") || "",
      }));
      console.table(rows);
      console.log(`\n${MANIFEST.length} assets (${MANIFEST.filter((a) => !a.optional).length} required).`);
      break;
    }
    default:
      console.log("Unknown command. Use: build | placeholders | validate | manifest");
      process.exit(2);
  }
}

main().catch((err) => {
  log.err(String(err?.stack ?? err));
  process.exit(1);
});
