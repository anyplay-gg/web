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
    await expect(activity(page).getByRole("radio")).toHaveCount(2);
    await expect(activity(page).getByLabel("Everyone")).toHaveCount(0);
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
    await activity(page).getByText("Only me").click();
    await expect(activity(page).getByLabel("Only me")).toBeChecked();
    // Client-side navigation keeps the mock's memory; coming back reads the saved value
    await page.getByRole("link", { name: "Profile", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Profile" })).toBeVisible();
    await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
    await expect(activity(page).getByLabel("Only me")).toBeChecked();
  });

  test("older data: a stored everyone shows as Friends", async ({ page }) => {
    await page.goto("/account/privacy?mock=oldfeed");
    await expect(activity(page).getByLabel("Friends")).toBeChecked();
    await expect(activity(page).getByLabel("Everyone")).toHaveCount(0);
    await shoot(page, "privacy-older-data");
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

test.describe("/account/privacy appear offline", () => {
  const offline = (page: Page) => page.getByRole("switch", { name: "Appear offline" });
  // the whole row is the target; the real checkbox is visually hidden under it
  const toggle = (page: Page) => page.getByText("Appear offline", { exact: true }).click();

  test("load: off by default, with its one-line explanation", async ({ page }) => {
    await page.goto("/account/privacy");
    await expect(offline(page)).not.toBeChecked();
    await expect(page.getByText("Friends see you as offline. You can still play, chat and join.")).toBeVisible();
    await shoot(page, "appear-offline-load");
    const { violations } = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("turning it on moves the switch, shows on the overview and leaves privacy alone", async ({ page }) => {
    await page.goto("/account/privacy");
    await toggle(page);
    await expect(offline(page)).toBeChecked();
    await expect(page.locator("main [role=alert]")).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Who sees: Trophies" }).getByLabel("Friends")).toBeChecked();
    await shoot(page, "appear-offline-on");

    // Client-side navigation keeps the mock's memory: the overview now says it, and the page reads it back
    await page.getByRole("link", { name: "Overview", exact: true }).first().click();
    await expect(page.getByRole("region", { name: "Your account" }).getByText("Appearing offline")).toBeVisible();
    await shoot(page, "appear-offline-overview");
    await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
    await expect(offline(page)).toBeChecked();

    await toggle(page);
    await expect(offline(page)).not.toBeChecked();
  });

  test("keyboard: Space toggles it", async ({ page }) => {
    await page.goto("/account/privacy");
    await offline(page).focus();
    await page.keyboard.press("Space");
    await expect(offline(page)).toBeChecked();
  });

  test("error: a failed save puts the switch back and says so", async ({ page }) => {
    await page.goto("/account/privacy?mock=nosave");
    await toggle(page);
    await expect(page.locator("main [role=alert]")).toContainText("problem");
    await expect(offline(page)).not.toBeChecked();
    await page.waitForTimeout(400);
    await shoot(page, "appear-offline-save-error");
  });
});
