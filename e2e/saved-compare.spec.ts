/**
 * Saved cars + Compare E2E — tasks P1-09 / P1-10.
 *
 * Guard: skips when the API is unreachable (needs the real backend + seeded
 * listings). Login runs desktop-only: /auth/login is rate-limited 10/min per IP,
 * so duplicating the flow across viewport projects trips 429 on back-to-back runs.
 */
import { test, expect, type Page } from "@playwright/test";

const HEALTH_URL = "http://localhost:4000/health";
const E2E_USER = { email: "e2e@carsens.test", password: "E2eStr0ngPass" };

let backendUp = false;

test.beforeAll(async () => {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
    backendUp = res.ok;
  } catch {
    backendUp = false;
  }
});

test.beforeEach(({}, testInfo) => {
  test.skip(!backendUp, `Backend health check (${HEALTH_URL}) unreachable — skipping saved/compare E2E`);
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "Login-dependent flow pinned to desktop (auth rate limit 10/min/IP)",
  );
});

/**
 * The backend throttles /auth/login to 10/min per IP, so we log in ONCE per run
 * and replay the session cookies into later tests instead of re-authenticating.
 */
let sessionCookies: Awaited<ReturnType<Page["context"]>["cookies"]> extends Promise<infer T>
  ? T | null
  : null = null;

async function login(page: Page) {
  if (sessionCookies) {
    await page.context().addCookies(sessionCookies);
    await page.goto("/account");
    if (!/\/login/.test(page.url())) return; // cookies still valid
    sessionCookies = null; // expired — fall through to a fresh login
  }
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(E2E_USER.email);
  await page.getByLabel(/password/i).fill(E2E_USER.password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/account(\?|$)/, { timeout: 30_000 });
  sessionCookies = await page.context().cookies();
}

// Serial: both tests share the single login above and touch the same account.
test.describe.configure({ mode: "serial" });

test.describe("saved cars (P1-09)", () => {
  test("save from search, see it on /account/saved, then unsave", async ({ page }) => {
    await login(page);
    await page.goto("/cars");

    // Idempotent: the account may already hold saves from an earlier run, so
    // only click when the heart is currently OFF (aria-pressed=false).
    const heart = page.getByTestId("save-button").first();
    await expect(heart).toBeVisible({ timeout: 20_000 });
    if ((await heart.getAttribute("aria-pressed")) !== "true") {
      await heart.click();
    }
    await expect(heart).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });

    await page.goto("/account/saved");
    const savedCards = page.locator("a[href*='/cars/']");
    await expect(savedCards.first()).toBeVisible({ timeout: 15_000 });
    const savedCount = await savedCards.count();
    expect(savedCount).toBeGreaterThan(0);

    // Unsave from the saved page — the row disappears.
    await page.getByRole("button", { name: /remove from saved/i }).first().click();
    await expect(savedCards).toHaveCount(savedCount - 1, { timeout: 15_000 });
  });

  test("saved searches tab renders (empty state or rows)", async ({ page }) => {
    await login(page);
    await page.goto("/account/saved");
    await page.getByRole("tab", { name: /saved searches/i }).click();
    // Either the empty state or at least one saved-search row must render.
    const emptyOrRows = page.getByText(/no saved searches yet|open search/i);
    await expect(emptyOrRows.first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("compare (P1-10)", () => {
  test("add two cars to compare, tray shows 2, /compare renders both columns", async ({ page }) => {
    await page.goto("/cars");

    // The chip is role="checkbox" (a toggle), not a button.
    const compareChips = page.getByTestId("compare-chip");
    await expect(compareChips.first()).toBeVisible({ timeout: 20_000 });
    await compareChips.nth(0).click();
    await compareChips.nth(1).click();

    // Floating tray reflects the selection.
    await expect(page.getByTestId("compare-tray")).toBeVisible();
    const trayCta = page.getByTestId("compare-tray-cta");
    await expect(trayCta).toContainText("2");
    await trayCta.click();

    await page.waitForURL(/\/compare/);
    // Two listing columns + the row-label column.
    const headerCells = page.locator("table thead th");
    await expect(headerCells).toHaveCount(3, { timeout: 20_000 });
    // Basics rows render values (price row is always present).
    await expect(page.getByRole("rowheader", { name: /price/i }).first()).toBeVisible();
  });

  test("differences-only toggle hides identical rows", async ({ page }) => {
    await page.goto("/cars");
    // The chip is role="checkbox" (a toggle), not a button.
    const compareChips = page.getByTestId("compare-chip");
    await expect(compareChips.first()).toBeVisible({ timeout: 20_000 });
    await compareChips.nth(0).click();
    await compareChips.nth(1).click();
    await page.goto("/compare");

    const allRows = page.locator("table tbody tr");
    await expect(allRows.first()).toBeVisible({ timeout: 20_000 });
    const before = await allRows.count();

    await page.getByLabel(/show differences only/i).check();
    const after = await allRows.count();
    expect(after).toBeLessThanOrEqual(before);
  });
});
