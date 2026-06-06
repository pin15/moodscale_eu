const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

export const log = {
  step(n: number | string, title: string) {
    console.log(`\n${c.bold}${c.cyan}▌ Step ${n} — ${title}${c.reset}`);
  },
  info(msg: string) {
    console.log(`  ${msg}`);
  },
  ok(msg: string) {
    console.log(`  ${c.green}✓${c.reset} ${msg}`);
  },
  warn(msg: string) {
    console.log(`  ${c.yellow}⚠${c.reset} ${msg}`);
  },
  err(msg: string) {
    console.log(`  ${c.red}✗${c.reset} ${msg}`);
  },
  dim(msg: string) {
    console.log(`  ${c.dim}${msg}${c.reset}`);
  },
  done(msg: string) {
    console.log(`${c.bold}${c.green}${msg}${c.reset}`);
  },
};
