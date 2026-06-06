import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:4499/";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

async function shoot(selector, file) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await el.screenshot({ path: file });
  console.log("shot", selector, "->", file);
}


await shoot("#top", "/tmp/hero.png");

await browser.close();
console.log("done");
