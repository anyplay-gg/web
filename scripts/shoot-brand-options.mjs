// SPDX-License-Identifier: AGPL-3.0-only
// Photographs the three brand directions of checkpoint 1 from the running dev server, at
// 1440x900 and 390x844, into the owner's notes folder. The canvas is photographed live (after its
// first frame), so what is on the screenshot is what a visitor sees.
//
//   node scripts/shoot-brand-options.mjs [baseUrl] [outDir]
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://127.0.0.1:4400";
const out = process.argv[3] ?? "C:/Users/alec/Desktop/AnyPlay/notes/web-screens/brand-options";
mkdirSync(out, { recursive: true });

const sizes = [
  { name: "1440x900", width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: "390x844", width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

const browser = await chromium.launch({ channel: "chrome" });
for (const d of ["a", "b", "c"]) {
  for (const s of sizes) {
    const ctx = await browser.newContext({
      viewport: { width: s.width, height: s.height },
      deviceScaleFactor: s.deviceScaleFactor,
      isMobile: s.isMobile,
      hasTouch: s.hasTouch,
    });
    const page = await ctx.newPage();
    await page.goto(`${base}/?direction=${d}`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page
      .waitForSelector('.network-map[data-live="true"]', { timeout: 8000 })
      .catch(() => console.warn(`direction ${d} ${s.name}: the canvas never went live`));
    await page.waitForTimeout(1600); // entrance and fade settle, pulses in flight
    await page.screenshot({ path: `${out}/direction-${d}-${s.name}.png` });
    console.log("shot", d, s.name);
    await ctx.close();
  }
}
await browser.close();
