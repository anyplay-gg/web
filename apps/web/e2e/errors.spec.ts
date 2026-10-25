// SPDX-License-Identifier: AGPL-3.0-only
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * The server for these tests sets NEXT_PUBLIC_E2E=1 (so /e2e-throw crashes on purpose) and a fake
 * NEXT_PUBLIC_SENTRY_DSN on sentry.test, which the tests answer themselves: nothing leaves the machine.
 */
test.describe("error and not-found pages", () => {
  test("an unknown address shows the branded 404, with status 404 and no axe violations", async ({ page }) => {
    const response = await page.goto("/definitely-missing");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "This page does not exist" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to AnyPlay" })).toHaveAttribute("href", "/");
    await expect(page).toHaveTitle(/Page not found/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test("a crash shows the retry screen, sends exactly one event, and Try again recovers", async ({ page }) => {
    const envelopes: string[] = [];
    await page.route("https://sentry.test/**", async (route) => {
      const request = route.request();
      const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
      if (request.method() === "POST") envelopes.push(request.postData() ?? "");
      await route.fulfill({ status: request.method() === "POST" ? 200 : 204, headers: cors, body: request.method() === "POST" ? "{}" : "" });
    });

    await page.goto("/e2e-throw");
    const heading = page.getByRole("heading", { level: 1, name: "Something went wrong" });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.getByRole("alert").filter({ hasText: "This page failed to load" })).toHaveCount(1);
    await expect(page.getByText("secret")).toHaveCount(0);

    await expect.poll(() => envelopes.length).toBe(1);
    expect(envelopes[0]).toContain('"boundary":"route"');
    // Give a stray second event time to show up before calling it exactly one.
    await page.waitForTimeout(1000);
    expect(envelopes).toHaveLength(1);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.evaluate(() => {
      (window as unknown as { __e2eHeal: boolean }).__e2eHeal = true;
    });
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Recovered" })).toBeVisible();
  });

  test("a crash in a Server Component recovers only because Try again refetches", async ({ page, context, baseURL }) => {
    await page.route("https://sentry.test/**", (route) => route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" }, body: "{}" }));
    await page.goto("/e2e-throw/server");
    await expect(page.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeVisible();
    // The server healed meanwhile (the cookie stands in for a transient failure that passed).
    // reset() would re-render the same cached error; only a refetch reaches the server again.
    await context.addCookies([{ name: "e2e-heal", value: "1", url: baseURL ?? "http://localhost:3000" }]);
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Recovered on the server" })).toBeVisible();
  });
});
