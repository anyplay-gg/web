// SPDX-License-Identifier: AGPL-3.0-only
import { defineConfig } from "@playwright/test";

/**
 * The browser tests run against `next dev`, where the in-memory mock stands in for the cloud
 * (src/lib/api.ts), so they need no backend. `?mock=signedout`, `?mock=error` and friends pick the
 * scenario. `E2E_PORT` moves the server when 4400 is taken; `E2E_BROWSER=chrome` uses the Chrome
 * that is installed when Playwright's own build is not; `SHOTS=<folder>` saves screenshots for review.
 */
const port = Number(process.env.E2E_PORT ?? 4400);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    ...(process.env.E2E_BROWSER ? { channel: process.env.E2E_BROWSER } : {}),
  },
  webServer: {
    command: `pnpm exec next dev --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/sign-in`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
