// SPDX-License-Identifier: AGPL-3.0-only
// Renders the poster images of the network map: the same scene and the same shaders as the live
// canvas, drawn once at a fixed time and saved as WebP with alpha, so the first paint and the live
// canvas show the same picture and the canvas can fade in without a jump.
//
// The page is opened with ?map=still, which makes the component draw one frame into a canvas that
// keeps its buffer and publish it through window.__mapStill. The browser is the installed Chrome
// (no download); WebGL runs on whatever GPU or software renderer it has, which is fine for a still.
//
//   node scripts/render-stills.mjs [baseUrl]
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://127.0.0.1:4400";
const out = fileURLToPath(new URL("../apps/web/public/map/", import.meta.url));
mkdirSync(out, { recursive: true });

const views = [
  { orient: "landscape", width: 1440, height: 900 },
  { orient: "portrait", width: 390, height: 844 },
];

const browser = await chromium.launch({ channel: "chrome" });
for (const direction of ["a", "b", "c"]) {
  for (const v of views) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`${base}/?direction=${direction}&map=still`, { waitUntil: "load" });
    await page.waitForFunction(() => window.__mapStill?.ready === true, undefined, { timeout: 15000 });
    const data = await page.evaluate(async () => {
      const url = await window.__mapStill.toBlob("image/webp", 0.7);
      const s = window.__anyplayMap.stats;
      return { url, width: s.width, height: s.height, renderer: s.renderer };
    });
    const bytes = Buffer.from(data.url.split(",")[1], "base64");
    writeFileSync(`${out}${direction}-${v.orient}.webp`, bytes);
    console.log(`${direction}-${v.orient}.webp`, `${data.width}x${data.height}`, `${(bytes.length / 1024).toFixed(1)} KB`, data.renderer);
    await ctx.close();
  }
}
await browser.close();
