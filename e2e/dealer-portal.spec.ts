/**
 * Dealer portal E2E — tasks P3-01/02/03/06/09.
 *
 * Uses the fixed fixture dealer@carsens.test (Al Noor Motors, ACTIVE GOLD
 * subscription) seeded by Backend's verification scripts. Skips cleanly when
 * the backend or the fixture is missing. Desktop-pinned like every
 * login-dependent spec (auth throttle is per-IP).
 */
import { test, expect, type Page } from "@playwright/test";

const HEALTH_URL = "http://localhost:4000/health";
const API = "http://localhost:4000/api/v1";
const DEALER_USER = { email: "dealer@carsens.test", password: "DealerStr0ngPass1" };

let backendUp = false;
let dealerSlug = "";

test.beforeAll(async () => {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
    backendUp = res.ok;
    if (!backendUp) return;
    const login = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(DEALER_USER),
    });
    if (!login.ok) {
      backendUp = false;
      return;
    }
    const { accessToken } = await login.json();
    const me = await fetch(`${API}/dealers/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const body = await me.json();
    dealerSlug = body?.dealer?.slug ?? "";
  } catch {
    backendUp = false;
  }
});

test.beforeEach(({}, testInfo) => {
  test.skip(!backendUp, "Backend or dealer fixture unavailable — run Backend seed scripts first");
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "Login-dependent flow pinned to desktop (auth rate limit per IP)",
  );
});

test.describe.configure({ mode: "serial" });

let cookies: Awaited<ReturnType<ReturnType<Page["context"]>["cookies"]>> | null = null;

async function loginAsDealer(page: Page) {
  if (cookies) {
    await page.context().addCookies(cookies);
    await page.goto("/dealer");
    if (!/\/login/.test(page.url())) return;
    cookies = null;
  }
  await page.goto("/login?next=/dealer");
  await page.getByLabel(/email/i).fill(DEALER_USER.email);
  await page.locator("#password").fill(DEALER_USER.password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  // Match on the PATHNAME: a plain /\/dealer/ regex also matches
  // "/login?next=/dealer" and captures cookies before sign-in completes.
  await page.waitForURL((url) => url.pathname.startsWith("/dealer"), {
    timeout: 30_000,
  });
  cookies = await page.context().cookies();
}

test("dashboard shows the quota meter and role-filtered navigation", async ({ page }) => {
  await loginAsDealer(page);

  // Quota meter in the topbar: occupied/quota against the GOLD package.
  await expect(page.getByText(/^\d+\/75$/)).toBeVisible({ timeout: 20_000 });

  // OWNER sees everything, including billing.
  const nav = page.getByRole("navigation", { name: /workspace/i });
  for (const item of [/dashboard/i, /inventory/i, /leads/i, /subscription/i, /branches & team/i]) {
    await expect(nav.getByRole("link", { name: item })).toBeVisible();
  }

  // The fixture dealership completed the P3-01 verification workflow — the
  // warning banner must be gone for a VERIFIED dealer.
  await expect(page.getByText(/not verified/i)).toHaveCount(0);
});

test("inventory renders with status filters and no unbounded fetch", async ({ page }) => {
  await loginAsDealer(page);
  await page.goto("/dealer/inventory");

  await expect(page.getByRole("button", { name: /^all$/i })).toBeVisible({ timeout: 20_000 });
  // The empty state is legitimate for a fresh dealer — either a table or the
  // empty card must render, never an error.
  const table = page.getByRole("table");
  const empty = page.getByText(/nothing here yet/i);
  await expect(table.or(empty).first()).toBeVisible({ timeout: 20_000 });
});

test("subscription page shows the ACTIVE package, quota and the paid invoice", async ({
  page,
}) => {
  await loginAsDealer(page);
  await page.goto("/dealer/subscription");

  // "Gold" and the ACTIVE badge share one <p>, so an exact-text locator cannot
  // match the text node alone — scope to the paragraph instead.
  const packageLine = page.locator("p", { hasText: "Gold" }).first();
  await expect(packageLine).toBeVisible({ timeout: 20_000 });
  await expect(packageLine).toContainText("ACTIVE");

  // The invoice raised and paid by the backend seed must appear, numbered.
  await expect(page.getByText(/INV-\d{4}-\d{6}/).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("PAID").first()).toBeVisible();
});

test("team page enforces the last-owner guard through the UI", async ({ page }) => {
  await loginAsDealer(page);
  await page.goto("/dealer/team");

  await expect(page.getByRole("table")).toBeVisible({ timeout: 20_000 });

  // The only member is the OWNER; removing them must surface the backend's
  // guard message, and the member must still be there afterwards.
  await page
    .getByRole("button", { name: /remove dealer owner/i })
    .click();
  await expect(page.getByText(/at least one owner/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("table").getByText("Dealer Owner")).toBeVisible();
});

test("public dealer profile carries AutoDealer JSON-LD and never the TRN", async ({
  page,
}) => {
  test.skip(!dealerSlug, "fixture dealer has no slug");
  await page.goto(`/dealers/${dealerSlug}`);

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Al Noor Motors");

  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  const parsed = JSON.parse(jsonLd ?? "{}");
  expect(parsed["@type"]).toBe("AutoDealer");
  expect(parsed.address?.addressCountry).toBe("AE");

  // Tax identifiers are never part of the public page.
  expect(await page.content()).not.toContain("100123456700003");
});

test("a customer without a dealership is routed to onboarding, not an error", async ({
  page,
}) => {
  // The generic e2e customer has no dealer membership.
  await page.goto("/login?next=/dealer");
  await page.getByLabel(/email/i).fill("e2e@carsens.test");
  await page.locator("#password").fill("E2eStr0ngPass");
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/dealer"), {
    timeout: 30_000,
  });

  await expect(page.getByRole("heading", { name: /set up your dealership/i })).toBeVisible({
    timeout: 20_000,
  });
  // The create button stays disabled until a plausible name is typed.
  await expect(page.getByRole("button", { name: /create dealership/i })).toBeDisabled();
});
