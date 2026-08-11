/**
 * Playwright configuration — task P0-13 (Acceptance-Annex §5 foundations).
 *
 * Two mandatory projects (plan P0-13: "desktop + mobile viewport projects"):
 *  - desktop-chromium: 1280x800
 *  - mobile-chromium:  Pixel-class 393x851, touch enabled
 *
 * The webServer block boots `npm run dev` automatically when nothing is
 * listening on :3000, and reuses an already-running dev server otherwise —
 * so `npm run e2e` works both locally (server up) and cold (server down).
 */
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  /**
   * Locally the dev box also runs Postgres, Redis, MinIO, the API and the queue
   * worker; unbounded parallelism starves the Next server and produces timeouts
   * that look like product bugs. Two workers keeps runs fast and deterministic.
   */
  workers: process.env.CI ? 2 : 2,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  // Dev-mode first compiles of a route can be slow; keep generous budgets.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      // Pixel 5 descriptor: 393x851, isMobile, hasTouch, mobile Chrome UA.
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
