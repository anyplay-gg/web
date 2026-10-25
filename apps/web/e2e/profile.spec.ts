import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

// The mock (packages/api-client/src/mock) plays the cloud. "riley" is the signed-in player; "mira"
// shows everything to everyone, "lena" shows her text and favourites to friends only, "kenji" shows
// nothing. Title IDs are invented (GAME#####).

const shots = process.env.SHOTS;
async function shoot(page: Page, name: string) {
  if (shots) await page.screenshot({ path: `${shots}/${name}-${page.viewportSize()!.width}.png`, fullPage: true });
}

async function noViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test.describe("public profile /u/{handle}", () => {
  test("everything visible: about, favourites and connections", async ({ page }) => {
    await page.goto("/u/mira");
    await expect(page.getByRole("heading", { level: 1, name: "mira" })).toBeVisible();
    await expect(page.getByText("Speedruns on weekends, cozy games on weeknights.")).toBeVisible();

    const favourites = page.getByRole("region", { name: "Favourite games" });
    await expect(favourites.getByRole("listitem")).toHaveText(["GameGAME01234", "GameGAME04550"]);

    const connections = page.getByRole("region", { name: "Connections" });
    await expect(connections.getByText("Discord", { exact: true })).toBeVisible();
    await expect(connections.getByText("Steam", { exact: true })).toBeVisible();
    await expect(connections.getByRole("link", { name: /Open profile on Steam/ })).toHaveAttribute(
      "href",
      "https://steamcommunity.com/profiles/76561198000000000",
    );
    // No Discord profile page is known, so there is no link to it
    await expect(connections.getByRole("link", { name: /Discord/ })).toHaveCount(0);

    // Neither game art nor names: the web only knows the title ID
    await expect(page.locator("main img")).toHaveCount(0);
    await noViolations(page);
    await shoot(page, "public-visible");
  });

  test("parts hidden: a signed-out visitor sees only what lena shows", async ({ page }) => {
    await page.goto("/u/lena?mock=signedout");
    await expect(page.getByRole("heading", { level: 1, name: "lena" })).toBeVisible();
    await expect(page.getByText("Collecting every ending.")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Favourite games" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Trophies" })).toHaveCount(0);
    // The hidden parts leave no trace: no "private" notice either
    await expect(page.getByText(/private/i)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Connections" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in to add lena" })).toBeVisible();
    await noViolations(page);
    await shoot(page, "public-hidden");
  });

  test("empty: nothing set shows no empty cards", async ({ page }) => {
    await page.goto("/u/riley?mock=empty");
    await expect(page.getByRole("heading", { level: 1, name: "riley" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Favourite games" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Connections" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Edit your profile" })).toBeVisible();
    await shoot(page, "public-empty");
  });

  test("a player who shows nothing but connections", async ({ page }) => {
    await page.goto("/u/kenji?mock=signedout");
    await expect(page.getByRole("heading", { level: 1, name: "kenji" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Favourite games" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Connections" })).toBeVisible();
  });

  test("unknown player", async ({ page }) => {
    await page.goto("/u/nobody-here");
    await expect(page.getByRole("heading", { name: "No player named nobody-here" })).toBeVisible();
  });

  test("error: says so and offers to try again", async ({ page }) => {
    await page.goto("/u/mira?mock=error");
    await expect(page.locator("main [role=alert]")).toContainText("problem");
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await shoot(page, "public-error");
  });
});

test.describe("edit /account/profile", () => {
  test("edits the text and the favourite games", async ({ page }) => {
    await page.goto("/account/profile");
    await expect(page.getByRole("heading", { level: 1, name: "Profile" })).toBeVisible();

    const card = page.getByRole("region", { name: "Favourite games" });
    const list = card.getByRole("list", { name: "Your favourite games" });
    await expect(list.getByRole("listitem")).toHaveText(["GAME01234", "GAME04550"]);
    const save = card.getByRole("button", { name: "Save" });
    await expect(save).toBeDisabled();

    // Bad input stays on the field and adds nothing
    const field = card.getByLabel("Title ID");
    await field.fill("not a title");
    await card.getByRole("button", { name: "Add game" }).click();
    await expect(card.getByText("Use only letters, numbers, hyphens and underscores.")).toBeVisible();
    await field.fill("GAME01234");
    await card.getByRole("button", { name: "Add game" }).click();
    await expect(card.getByText("GAME01234 is on the list already.")).toBeVisible();

    // A third game fills the list; then the field is off
    await field.fill("GAME00001");
    await field.press("Enter");
    await expect(list.getByRole("listitem")).toHaveCount(3);
    await expect(field).toBeDisabled();
    await expect(card.getByText("You have 3 games. Remove one to add another.")).toBeVisible();

    await card.getByRole("button", { name: "Remove GAME04550" }).click();
    await expect(field).toBeEnabled();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(card.getByRole("status")).toHaveText("Saved");
    await expect(list.getByRole("listitem")).toHaveText(["GAME01234", "GAME00001"]);
    await shoot(page, "account-profile");

    const about = page.getByRole("region", { name: "About" });
    await about.getByLabel("About").fill("Night owl.");
    await about.getByRole("button", { name: "Save" }).click();
    await expect(about.getByRole("status")).toHaveText("Saved");
    await noViolations(page);
  });

  test("empty: asks for a first game", async ({ page }) => {
    await page.goto("/account/profile?mock=empty");
    const card = page.getByRole("region", { name: "Favourite games" });
    await expect(card.getByText("No favourite games yet. Add a title ID below.")).toBeVisible();
    await shoot(page, "account-profile-empty");
    await card.getByLabel("Title ID").fill("GAME00001");
    await card.getByRole("button", { name: "Add game" }).click();
    await card.getByRole("button", { name: "Save" }).click();
    await expect(card.getByRole("status")).toHaveText("Saved");
  });

  test("signed out: goes to the sign-in", async ({ page }) => {
    await page.goto("/account/profile?mock=signedout");
    await page.waitForURL("**/sign-in");
  });

  test("error: offers to try again", async ({ page }) => {
    await page.goto("/account/profile?mock=error");
    await expect(page.locator("main [role=alert]")).toContainText("problem");
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await shoot(page, "account-profile-error");
  });
});
