// Renders every card side for each person to a 300 dpi PNG with 0.125in bleed.
// Usage: node business-cards/export.js   (needs Playwright + Chromium)
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const OUT = path.join(__dirname, "exports");
const PAGE = "file://" + path.join(__dirname, "index.html");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  // CSS px are 1/96 in, so 300/96 gives 300 dpi output
  const page = await browser.newPage({ deviceScaleFactor: 300 / 96, viewport: { width: 1200, height: 4000 } });
  for (const person of ["rob", "dave"]) {
    await page.goto(`${PAGE}?export=1&person=${person}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    for (const card of await page.$$("[data-export]")) {
      const name = await card.getAttribute("data-export");
      const [option, side] = name.split("-");
      // Clip to exactly 3.75 x 2.25 in so the file is 1125 x 675 px
      const box = await card.boundingBox();
      await page.screenshot({ path: path.join(OUT, `${option}-${side}-${person}.png`), clip: { x: Math.round(box.x), y: Math.round(box.y), width: 360, height: 216 } });
    }
  }
  await browser.close();
  console.log("Exported to", OUT);
})();
