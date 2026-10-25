import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

// The mock plays the cloud. "riley" is the signed-in player (level 19, 3,295 points). "mira" shows
// everything to everyone and has two games with riley (GAME01234, GAME04550); "ines" shows her
// trophies but has no game in common; "kenji" hides his trophies. Title IDs are invented.

const shots = process.env.SHOTS;
async function shoot(page: Page, name: string) {
  if (shots) await page.screenshot({ path: `${shots}/${name}-${page.viewportSize()!.width}.png`, fullPage: true });
}

async function noViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

const card = (page: Page) => page.getByRole("region", { name: "Compare trophies" });

test.describe("level on the profiles", () => {
  test("a public profile shows level and the way to the next", async ({ page }) => {
    await page.goto("/u/mira");
    const trophies = page.getByRole("region", { name: "Trophies" });
    await expect(trophies.getByText(/^Level \d+$/)).toBeVisible();
    await expect(trophies.getByRole("progressbar", { name: /Progress to level \d+/ })).toBeVisible();
    await expect(trophies.getByText(/points to level \d+$/)).toBeVisible();
    await shoot(page, "level-public");
  });

  test("hidden trophies hide the level too, without a trace", async ({ page }) => {
    await page.goto("/u/kenji");
    await expect(page.getByRole("heading", { level: 1, name: "kenji" })).toBeVisible();
    await expect(page.getByText(/^Level \d+$/)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Compare trophies" })).toHaveCount(0);
  });

  test("your own profile and overview show your level", async ({ page }) => {
    await page.goto("/u/riley");
    await expect(page.getByRole("region", { name: "Trophies" }).getByText("Level 19")).toBeVisible();
    await expect(card(page)).toHaveCount(0);
    await page.goto("/account");
    const hero = page.getByRole("region", { name: "Your account" });
    await expect(hero.getByText("Level 19")).toBeVisible();
    await expect(hero.getByText("3,295 points")).toBeVisible();
    await expect(hero.getByText("125 points to level 20")).toBeVisible();
    await shoot(page, "level-overview");
    await page.getByRole("link", { name: "Trophies", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Trophies" })).toBeVisible();
    await expect(page.getByText("Level 19")).toBeVisible();
    await shoot(page, "level-trophies");
    await noViolations(page);
  });

  test("a new account starts at level 1", async ({ page }) => {
    await page.goto("/account?mock=empty");
    await expect(page.getByRole("region", { name: "Your account" }).getByText("Level 1")).toBeVisible();
    await expect(page.getByText("72 points to level 2")).toBeVisible();
  });
});

test.describe("compare on a profile", () => {
  test("two shared games: a summary, per game", async ({ page }) => {
    await page.goto("/u/mira");
    const c = card(page);
    await expect(c.getByRole("heading", { name: "Compare trophies" })).toBeVisible();
    const select = c.getByLabel("Game");
    await expect(select.locator("option")).toHaveText(["GAME01234", "GAME04550"]);

    const table = c.getByRole("table", { name: "Trophies in GAME01234, you next to mira" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "You" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "mira" })).toBeVisible();
    for (const row of ["Trophies", "Platinum", "Gold", "Silver", "Bronze", "Points in this game", "Level overall"]) {
      await expect(table.getByRole("rowheader", { name: row })).toBeVisible();
    }
    // The verdict is in words, and so are the three groups of trophies
    await expect(c.getByText(/ahead by [\d,]+ points? in this game\.|level on points/)).toBeVisible();
    for (const term of ["Earned by both", "Only you", "Only mira"]) await expect(c.getByText(term, { exact: true })).toBeVisible();
    // The riley side is the trophy page's own counts for that game: 1 + 9 + 14 + 22
    await expect(table.getByRole("row", { name: /^Trophies 46 / })).toBeVisible();
    await shoot(page, "compare-two-games");

    await select.selectOption("GAME04550");
    await expect(c.getByRole("table", { name: "Trophies in GAME04550, you next to mira" })).toBeVisible();
    // Never trophy names, texts or art
    await expect(page.locator("main img")).toHaveCount(0);
    await noViolations(page);
  });

  test("one shared game: no choice to make", async ({ page }) => {
    await page.goto("/u/lena");
    const c = card(page);
    await expect(c.getByRole("table", { name: "Trophies in GAME02417, you next to lena" })).toBeVisible();
    await expect(c.getByLabel("Game")).toHaveCount(0);
    await shoot(page, "compare-one-game");
  });

  test("no game in common says so and what to do", async ({ page }) => {
    await page.goto("/u/ines");
    await expect(card(page).getByText("You and ines have no game in common yet.")).toBeVisible();
    await expect(card(page).getByRole("table")).toHaveCount(0);
    await shoot(page, "compare-none");
  });

  test("signed out: the card asks to sign in", async ({ page }) => {
    await page.goto("/u/mira?mock=signedout");
    const link = card(page).getByRole("link", { name: "Sign in to compare trophies" });
    await expect(link).toHaveAttribute("href", "/sign-in");
    await expect(card(page).getByRole("table")).toHaveCount(0);
    await shoot(page, "compare-signed-out");
    await noViolations(page);
  });

  test("signed out and hidden: no card", async ({ page }) => {
    await page.goto("/u/lena?mock=signedout");
    await expect(page.getByRole("heading", { level: 1, name: "lena" })).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });

  test("hidden since the page loaded: says it can't be compared", async ({ page }) => {
    await page.goto("/u/mira?mock=hiddennow");
    await expect(card(page).getByRole("status").filter({ hasText: "aren’t available to compare" })).toBeVisible();
    await shoot(page, "compare-hidden");
  });

  test("error: says so and offers to try again", async ({ page }) => {
    await page.goto("/u/mira?mock=nocompare");
    await expect(card(page).getByRole("alert")).toContainText("problem");
    await expect(card(page).getByRole("button", { name: "Try again" })).toBeVisible();
    await shoot(page, "compare-error");
  });
});
