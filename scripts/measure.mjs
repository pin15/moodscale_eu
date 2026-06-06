import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.goto(process.argv[2] || "http://localhost:4499/", { waitUntil: "networkidle" });
const bb = await page.evaluate(() => {
  const path = document.querySelector('.ms-indiamap svg path');
  const b = path.getBBox();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
const sx0 = 0.1 * bb.x;
const sx1 = 0.1 * (bb.x + bb.width);
const sy0 = 1024 - 0.1 * (bb.y + bb.height);
const sy1 = 1024 - 0.1 * bb.y;
console.log("path bbox:", JSON.stringify(bb));
console.log("screen bbox:", { minX: sx0, maxX: sx1, minY: sy0, maxY: sy1 });
await browser.close();
