// SPDX-License-Identifier: AGPL-3.0-only
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

/** The mock's codes (packages/api-client/src/mock/adapter.ts): a game, a party, one that ran out. */
const SESSION = "ember23456";
const PARTY = "party23456";
const EXPIRED = "expired234";

const SHOTS = process.env.SHOTS;
const SIZES = { phone: { width: 375, height: 760 }, desktop: { width: 1280, height: 800 } } as const;

async function shoot(page: Page, name: string) {
  if (!SHOTS) return;
  for (const [label, size] of Object.entries(SIZES)) {
    await page.setViewportSize(size);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${SHOTS}/${name}-${label}.png` });
  }
}

async function axeClean(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" ")}`)).toEqual([]);
}

test.describe("join page", () => {
  test("a signed-in visitor sees who invites, the game and the players, and two actions", async ({ page }) => {
    await page.goto(`/join/${SESSION}`);
    await expect(page.getByRole("heading", { level: 1, name: "mira invited you" })).toBeVisible();
    await expect(page.getByText("Into the Ember")).toBeVisible();
    await expect(page.getByText("2 of 4 players")).toBeVisible();
    const open = page.getByRole("link", { name: "Open in AnyPlay" });
    await expect(open).toHaveAttribute("href", `anyps5://v1/join/${SESSION}`);
    await expect(page.getByRole("link", { name: "Get AnyPlay" })).toHaveAttribute("href", /github\.com\/anyplaynet\/launcher\/releases/);
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveCount(0);
    await axeClean(page);
    await shoot(page, "session-signed-in");
  });

  test("a party is shown as a party, with no game", async ({ page }) => {
    await page.goto(`/join/${PARTY}`);
    await expect(page.getByText("An AnyPlay party")).toBeVisible();
    await expect(page.getByText("3 of 8 players")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open in AnyPlay" })).toHaveAttribute("href", `anyps5://v1/join/${PARTY}`);
    await axeClean(page);
    await shoot(page, "party-signed-in");
  });

  test("a code in capitals works and is passed on in lower case", async ({ page }) => {
    await page.goto(`/join/${SESSION.toUpperCase()}`);
    await expect(page.getByRole("link", { name: "Open in AnyPlay" })).toHaveAttribute("href", `anyps5://v1/join/${SESSION}`);
  });

  test("a visitor without a session is asked to sign in or create an account, and comes back", async ({ page }) => {
    await page.goto(`/join/${SESSION}?mock=signedout`);
    await expect(page.getByRole("heading", { level: 1, name: "mira invited you" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open in AnyPlay" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", `/create?next=%2Fjoin%2F${SESSION}`);
    await axeClean(page);
    await shoot(page, "session-signed-out");

    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(`/sign-in?next=%2Fjoin%2F${SESSION}`);
    await page.getByLabel("E-mail address").fill("riley@example.com");
    await page.getByRole("button", { name: "Send code" }).click();
    await page.getByLabel("Code").fill("123456");
    await expect(page).toHaveURL(`/join/${SESSION}`);
    await expect(page.getByRole("link", { name: "Open in AnyPlay" })).toBeVisible();
  });

  test("the way back survives the switch between sign-in and create", async ({ page }) => {
    await page.goto(`/sign-in?next=/join/${SESSION}&mock=signedout`);
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", `/create?next=%2Fjoin%2F${SESSION}`);
  });

  test("a way back that is not a join page is dropped", async ({ page }) => {
    await page.goto("/sign-in?next=https://evil.example/join/ember23456&mock=signedout");
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/create");
  });

  test("an invitation that is gone shows a calm expired page", async ({ page }) => {
    await page.goto(`/join/${EXPIRED}`);
    await expect(page.getByRole("heading", { level: 1, name: "This invitation has expired" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get AnyPlay" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to the start" }).last()).toHaveAttribute("href", "/");
    await axeClean(page);
    await shoot(page, "expired");
  });

  test("a code that cannot be one is answered without asking the cloud", async ({ page }) => {
    const asked: string[] = [];
    page.on("request", (r) => asked.push(r.url()));
    await page.goto("/join/not-a-code");
    await expect(page.getByRole("heading", { level: 1, name: "This invitation has expired" })).toBeVisible();
    expect(asked.filter((u) => u.includes("/web/api"))).toEqual([]);
  });

  test("a failure shows a retry", async ({ page }) => {
    await page.goto(`/join/${SESSION}?mock=error`);
    await expect(page.getByRole("heading", { level: 1, name: "Can’t reach AnyPlay" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await axeClean(page);
    await shoot(page, "error");
  });

  test("the page asks search engines and referrers to leave it out", async ({ page }) => {
    await page.goto(`/join/${SESSION}`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
  });
});
