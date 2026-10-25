import { defineConfig, devices } from "@playwright/test";

/**
 * The browser tests run against `next dev`, where the app talks to the in-memory mock instead of
 * a cloud (`?mock=signedout`, `?mock=empty`, `?mock=error`; see the README). Two widths: a phone
 * and a desktop.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4410", trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 800 } } },
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: "pnpm exec next dev --hostname 127.0.0.1 --port 4410",
    url: "http://127.0.0.1:4410",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
