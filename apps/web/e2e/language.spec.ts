import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

// The language of the account pages: ?lang= (the launcher passes its own), then the cookie, then
// Accept-Language, English otherwise. The mock plays the cloud.

const shots = process.env.SHOTS;
async function shoot(page: Page, name: string) {
  if (shots) await page.screenshot({ path: `${shots}/${name}-${page.viewportSize()!.width}.png`, fullPage: true });
}

async function noViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test("an explicit ?lang= wins, is remembered, and sets the document language", async ({ page }) => {
  await page.goto("/sign-in?mock=signedout&lang=de");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page).toHaveTitle(/Anmelden/);
  await shoot(page, "sign-in-de");
  await noViolations(page);
  // The next page, opened without the parameter, keeps German through the cookie.
  await page.goto("/create?mock=signedout");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page).toHaveTitle(/Erstelle dein Konto/);
});

test("Turkish comes out whole, with its own letters", async ({ page }) => {
  await page.goto("/sign-in?mock=signedout&lang=tr");
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page).toHaveTitle(/Giriş yap/);
  await shoot(page, "sign-in-tr");
  await noViolations(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test("without a parameter or cookie the browser's language decides, and English is the fallback", async ({ browser }) => {
  const french = await browser.newContext({ locale: "fr-FR", extraHTTPHeaders: { "accept-language": "fr-FR,fr;q=0.9,en;q=0.5" } });
  const page = await french.newPage();
  await page.goto("/sign-in?mock=signedout");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await french.close();

  const japanese = await browser.newContext({ extraHTTPHeaders: { "accept-language": "ja" } });
  const other = await japanese.newPage();
  await other.goto("/sign-in?mock=signedout");
  await expect(other.locator("html")).toHaveAttribute("lang", "en");
  await expect(other).toHaveTitle(/Sign in/);
  await japanese.close();
});

test("an unknown ?lang= is ignored", async ({ page }) => {
  await page.goto("/sign-in?mock=signedout&lang=xx");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the account area speaks the language too, and the long words fit", async ({ page }) => {
  await page.goto("/account?lang=de");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await shoot(page, "account-de");
  await noViolations(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});
