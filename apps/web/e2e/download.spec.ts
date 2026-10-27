import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The page asks GitHub for the latest release. Whether GitHub answers or not, every download must be
// a real link, so these checks hold in both cases.

test("the download page offers every system and has no accessibility violations", async ({ page }) => {
  await page.goto("/download");
  await expect(page.getByRole("heading", { level: 1, name: "Get the launcher" })).toBeVisible();
  const files = page.locator("#files");
  for (const name of ["Windows installer", "macOS", "Linux AppImage"]) {
    await expect(files.getByRole("heading", { name })).toBeVisible();
  }
  const links = files.getByRole("link", { name: /^Download / });
  expect(await links.count()).toBe(6);
  for (const href of await links.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href))) {
    expect(href).toMatch(/^https:\/\/github\.com\/anyplaynet\/launcher\/releases\//);
  }
  const { violations } = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test("a phone is told the launcher is for computers instead of being offered a download", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 800 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
  });
  const page = await context.newPage();
  await page.goto("/download");
  await expect(page.getByText("The launcher runs on a computer.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download for Windows" })).toHaveCount(0);
  await context.close();
});
