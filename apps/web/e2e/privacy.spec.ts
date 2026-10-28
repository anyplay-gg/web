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

test.describe("/account/privacy people you played with", () => {
  const remember = (page: Page) => page.getByRole("switch", { name: "Remember people I play with" });

  test("load: on by default, with its explanation", async ({ page }) => {
    await page.goto("/account/privacy");
    await expect(remember(page)).toBeChecked();
    await expect(page.getByText("Only you see the list.")).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("turning it off moves the switch", async ({ page }) => {
    await page.goto("/account/privacy");
    await page.getByText("Remember people I play with", { exact: true }).click();
    await expect(remember(page)).not.toBeChecked();
  });

  test("clearing asks first, and Cancel changes nothing", async ({ page }) => {
    await page.goto("/account/privacy");
    await page.getByRole("button", { name: "Clear the list" }).click();
    const dialog = page.getByRole("dialog", { name: "Clear the list?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("The list is empty.")).toHaveCount(0);

    await page.getByRole("button", { name: "Clear the list" }).click();
    await page.getByRole("dialog", { name: "Clear the list?" }).getByRole("button", { name: "Clear the list" }).click();
    await expect(page.getByText("The list is empty.")).toBeVisible();
  });

  test("error: a failed save puts the switch back and says so", async ({ page }) => {
    await page.goto("/account/privacy?mock=nosave");
    await page.getByText("Remember people I play with", { exact: true }).click();
    await expect(page.locator("main [role=alert]")).toContainText("problem");
    await expect(remember(page)).toBeChecked();
  });
});

test.describe("/account/privacy leaderboard scores", () => {
  const scores = (page: Page) => page.getByRole("group", { name: "Who sees: leaderboard scores" });

  test("load: at friends, with the wording of the privacy notice", async ({ page }) => {
    await page.goto("/account/privacy");
    await expect(page.getByRole("heading", { level: 2, name: "Scores" })).toBeVisible();
    await expect(scores(page).getByLabel("Friends")).toBeChecked();
    await expect(page.getByText("Friends see your entry and your rank.")).toBeVisible();
    await expect(page.getByText("including people who are not signed in")).toHaveCount(0);
    const { violations } = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    await shoot(page, "scores-load");
  });

  test("everyone says that people who are not signed in see it, and the choice survives leaving the page", async ({ page }) => {
    await page.goto("/account/privacy");
    await scores(page).getByText("Everyone", { exact: true }).click();
    await expect(scores(page).getByLabel("Everyone")).toBeChecked();
    await expect(page.getByText("Anyone sees your entry, including people who are not signed in")).toBeVisible();
    await shoot(page, "scores-everyone");
    await page.getByRole("link", { name: "Overview", exact: true }).first().click();
    await page.getByRole("link", { name: "Privacy", exact: true }).first().click();
    await expect(scores(page).getByLabel("Everyone")).toBeChecked();
  });

  test("nobody works with the keyboard", async ({ page }) => {
    await page.goto("/account/privacy");
    await scores(page).getByLabel("Friends").focus();
    await page.keyboard.press("ArrowRight");
    await expect(scores(page).getByLabel("Only me")).toBeChecked();
    await expect(page.getByText("Only you see your entry.")).toBeVisible();
    // Not disabled while it saves: the next key press still lands on the group.
    await page.keyboard.press("ArrowLeft");
    await expect(scores(page).getByLabel("Friends")).toBeChecked();
  });

  test("error: a failed save puts the choice back and says so", async ({ page }) => {
    await page.goto("/account/privacy?mock=nosave");
    await scores(page).getByText("Only me", { exact: true }).click();
    await expect(page.locator("main [role=alert]").last()).toContainText("problem");
    await expect(scores(page).getByLabel("Friends")).toBeChecked();
    await expect(page.getByText("Friends see your entry and your rank.")).toBeVisible();
    await shoot(page, "scores-save-error");
  });
});
