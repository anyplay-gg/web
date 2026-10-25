// SPDX-License-Identifier: AGPL-3.0-only
import { type Page, expect, test } from "@playwright/test";

/** The mock refuses 000000 as a wrong code and takes any other six digits (packages/api-client/src/mock/adapter.ts). */
const WRONG = "000000";
const RIGHT = "123456";

async function toCodeStep(page: Page) {
  await page.goto("/sign-in?mock=signedout");
  await page.getByLabel("E-mail address").fill("mira@example.com");
  await page.getByRole("button", { name: "Send code" }).click();
  const code = page.getByLabel("Code", { exact: true });
  await expect(code).toBeVisible();
  return code;
}

test.describe("sign-in code step", () => {
  test("a wrong code keeps the focus on the field, announces the problem and takes the next try without a tap", async ({ page }) => {
    const code = await toCodeStep(page);
    await code.focus();
    await page.keyboard.type(WRONG);

    const alert = page.getByRole("alert").filter({ hasText: "That code is wrong" });
    await expect(alert).toHaveCount(1);
    await expect(code).toBeFocused();
    await expect(code).toHaveValue("");
    await expect(code).toHaveAttribute("aria-invalid", "true");
    await expect(code).not.toBeDisabled();
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("INPUT");

    // No click in between: the keyboard is still where the person left it.
    await page.keyboard.type(RIGHT);
    await expect(page.getByRole("heading", { level: 1, name: "You’re signed in" })).toBeVisible();
  });

  test("the alert is in the page, empty, before the problem is", async ({ page }) => {
    const code = await toCodeStep(page);
    // Inside the form: Next adds its own route announcer, which is an alert too.
    const alerts = page.locator("form").getByRole("alert");
    await expect(alerts).toHaveCount(1);
    await expect(alerts).toHaveText("");
    await code.focus();
    await page.keyboard.type(WRONG);
    await expect(alerts).toContainText("That code is wrong");
  });
});
