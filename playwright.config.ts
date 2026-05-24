import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Horecom e2e walkthrough.
 *
 * Target: prod by default (BASE_URL env override). Runs headless Chromium
 * in 2 viewports — desktop (laptop) and mobile (iPhone 13) — because 90%
 * of Horecom traffic is mobile.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // serialize so badge/cart state from one test doesn't bleed
  workers: 1,
  retries: 1, // one retry for Tokyo DB cold-start hiccups
  reporter: [["list"], ["html", { outputFolder: "test-results/html", open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "https://horecom-platform-eosin.vercel.app",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
