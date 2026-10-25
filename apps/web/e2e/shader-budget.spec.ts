// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from "@playwright/test";

/**
 * The sign-in backdrop sits in an aside that is hidden below the lg breakpoint, so a phone must not
 * pay for a canvas, a WebGL context or a shader compile it can never show.
 */
test.describe("sign-in backdrop", () => {
  test.describe("at 390px", () => {
    test.use({ viewport: { width: 390, height: 800 } });
    test("mounts no canvas", async ({ page }) => {
      await page.goto("/sign-in");
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(1000);
      await expect(page.locator("canvas")).toHaveCount(0);
    });
  });

  test.describe("at 1280px", () => {
    test.use({ viewport: { width: 1280, height: 900 } });
    test("mounts one canvas", async ({ page }) => {
      await page.goto("/sign-in");
      await expect(page.locator("canvas")).toHaveCount(1);
    });
  });
});
