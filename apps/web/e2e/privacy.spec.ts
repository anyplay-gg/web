import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

// The mock (packages/api-client/src/mock) plays the cloud. Everything starts at "friends".
// `?mock=error` fails the load, `?mock=nosave` fails saving.

const shots = process.env.SHOTS;
async function shoot(page: Page, name: string) {
  if (shots) await page.screenshot({ path: `${shots}/${name}-${page.viewportSize()!.width}.png`, fullPage: true });
}

const activity = (page: Page) => page.getByRole("group", { name: "Who sees: Activity" });

test.describe("/account/privacy", () => {
  test("load: the activity row sits beside the profile rows, at friends", async ({ page }) => {
    await page.goto("/account/privacy");
    await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
    for (const part of ["Trophies", "Playtime", "About", "Favourite games", "Picture"]) {
      await expect(page.getByRole("group", { name: `Who sees: ${part}` })).toBeVisible();
    }
    await expect(activity(page).getByRole("radio")).toHaveCount(3);
    await expect(activity(page).getByLabel("Friends")).toBeChecked();
    await shoot(page, "privacy-load");
    const { violations } = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("change: choosing Only me moves the choice and leaves the other rows alone", async ({ page }) => {
    await page.goto("/account/privacy");
    await activity(page).getByText("Only me").click();
    await expect(activity(page).getByLabel("Only me")).toBeChecked();
    await expect(page.getByRole("group", { name: "Who sees: Trophies" }).getByLabel("Friends")).toBeChecked();
    await expect(page.locator("main [role=alert]")).toHaveCount(0);
    await shoot(page, "privacy-changed");

    // Another part saves the whole object: the activity choice stays
    await page.getByRole("group", { name: "Who sees: Trophies" }).getByText("Everyone").click();
    await expect(page.getByRole("group", { name: "Who sees: Trophies" }).getByLabel("Everyone")).toBeChecked();
    await expect(activity(page).getByLabel("Only me")).toBeChecked();
  });

  test("save: the choice is still there after the page is opened again", async ({ page }) => {
    await page.goto("/account/privacy");
    await activity(page).getByText("Everyone").click();
    await expect(activity(page).getByLabel("Everyone")).toBeChecked();
    // Client-side navigation keeps the mock's memory; coming back reads the saved value
    await page.getByRole("link", { name: "Profile", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Profile" })).toBeVisible();
    await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
    await expect(activity(page).getByLabel("Everyone")).toBeChecked();
  });

  test("error: a failed save puts the choice back and says so", async ({ page }) => {
    await page.goto("/account/privacy?mock=nosave");
    await activity(page).getByText("Only me").click();
    await expect(page.locator("main [role=alert]")).toContainText("problem");
    await expect(activity(page).getByLabel("Friends")).toBeChecked();
    await page.waitForTimeout(400);
    await shoot(page, "privacy-save-error");
  });

  test("error: a failed load offers to try again", async ({ page }) => {
    await page.goto("/account/privacy?mock=error");
    await expect(page.locator("main [role=alert]")).toContainText("problem");
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await shoot(page, "privacy-load-error");
  });
});
