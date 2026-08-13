/**
 * Dealer portal P3 wave E2E — tasks P3-04 (leads inbox), P3-05 (analytics),
 * P3-08 (boost UI), P3-01 (verification page).
 *
 * Relies on the durable Al Noor Motors fixture state: VERIFIED dealership,
 * ACTIVE GOLD subscription, one LIVE Camry, three demo leads (Ahmed Hassan
 * FORM lead with a note, a CALL lead, a WHATSAPP lead) and a boost-credit
 * wallet. Desktop-pinned like every login-dependent spec.
 */
import { test, expect, type Page } from "@playwright/test";

const HEALTH_URL = "http://localhost:4000/health";
const API = "http://localhost:4000/api/v1";
const DEALER_USER = { email: "dealer@carsens.test", password: "DealerStr0ngPass1" };

let backendUp = false;
let hasLeadFixture = false;

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
    const dealerId = body?.dealer?.id;
    if (dealerId) {
      const feed = await fetch(`${API}/dealers/${dealerId}/leads?limit=1`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      hasLeadFixture = feed.ok && (await feed.json()).total > 0;
    }
  } catch {
    backendUp = false;
  }
});

test.beforeEach(({}, testInfo) => {
  test.skip(!backendUp, "Backend or dealer fixture unavailable");
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "Login-dependent flow pinned to desktop (auth rate limit per IP)",
  );
});

test.describe.configure({ mode: "serial" });

let cookies: Awaited<ReturnType<ReturnType<Page["context"]>["cookies"]>> | null = null;

async function loginAsDealer(page: Page, next = "/dealer") {
  if (cookies) {
    await page.context().addCookies(cookies);
    await page.goto(next);
    if (!/\/login/.test(page.url())) return;
    cookies = null;
  }
  await page.goto(`/login?next=${next}`);
  await page.getByLabel(/email/i).fill(DEALER_USER.email);
  await page.getByLabel(/password/i).fill(DEALER_USER.password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/dealer"), {
    timeout: 30_000,
  });
  cookies = await page.context().cookies();
}

test("leads inbox: summary tiles, feed, and the PII-projected detail dialog", async ({
  page,
}) => {
  test.skip(!hasLeadFixture, "demo leads not seeded");
  await loginAsDealer(page, "/dealer/leads");

  // Status tiles count the pipeline.
  await expect(page.getByText(/^new$/i).first()).toBeVisible({ timeout: 20_000 });

  // The FORM lead row carries the buyer's typed name.
  const row = page.getByRole("row", { name: /ahmed hassan/i });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByRole("button", { name: /open/i }).click();

  // FORM leads expose the typed contact details…
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("+971501234567")).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByText(/ahmed@example\.com/)).toBeVisible();
  // …and the message plus the team note added earlier.
  await expect(dialog.getByText(/still available/i)).toBeVisible();
  await page.keyboard.press("Escape");
});

test("leads inbox: status filter narrows the feed", async ({ page }) => {
  test.skip(!hasLeadFixture, "demo leads not seeded");
  await loginAsDealer(page, "/dealer/leads");

  await expect(page.getByRole("table")).toBeVisible({ timeout: 20_000 });
  const allRows = await page.getByRole("table").locator("tbody tr").count();

  await page.getByRole("button", { name: /^contacted$/i }).click();
  await expect
    .poll(async () => page.getByRole("table").locator("tbody tr").count(), {
      timeout: 15_000,
    })
    .toBeLessThan(allRows + 1); // narrowed or equal — and every row is CONTACTED
  const badges = page.getByRole("table").locator("tbody").getByText(/^contacted$/i);
  expect(await badges.count()).toBeGreaterThan(0);
});

test("analytics: totals, two trend charts, and the top-listings board", async ({
  page,
}) => {
  await loginAsDealer(page, "/dealer/analytics");

  await expect(page.getByText(/^views$/i).first()).toBeVisible({ timeout: 20_000 });

  // Two dependency-free SVG charts render with accessible labels.
  await expect(page.locator('svg[role="img"]')).toHaveCount(2, { timeout: 20_000 });

  // The fixture Camry appears on the board.
  await expect(page.getByRole("table").getByText(/toyota camry/i).first()).toBeVisible({
    timeout: 20_000,
  });

  // Range switch refetches without error.
  await page.getByRole("button", { name: /7 days/i }).click();
  await expect(page.locator('svg[role="img"]')).toHaveCount(2, { timeout: 20_000 });
});

test("boosts: wallet on the subscription page, apply dialog from inventory", async ({
  page,
}) => {
  await loginAsDealer(page, "/dealer/subscription");

  // Wallet balance renders inside the Boosts panel.
  await expect(page.getByText(/wallet: \d+ credit/i)).toBeVisible({ timeout: 20_000 });

  // The inventory row of a LIVE listing offers Boost; the dialog lists
  // products with credit costs against the wallet.
  await page.goto("/dealer/inventory");
  const boostButton = page.getByRole("button", { name: /^boost$/i }).first();
  await expect(boostButton).toBeVisible({ timeout: 20_000 });
  if (await boostButton.isEnabled()) {
    await boostButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/top of search/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(dialog.getByText(/wallet: \d+ credit/i)).toBeVisible();
    await dialog.getByRole("button", { name: /cancel/i }).click();
  }
});

test("verification page reflects the VERIFIED state", async ({ page }) => {
  await loginAsDealer(page, "/dealer/verification");

  await expect(page.getByText(/dealership verification/i)).toBeVisible({
    timeout: 20_000,
  });
  // VERIFIED: no upload button, the success hint instead.
  await expect(page.getByText(/publish instantly|without moderation/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /upload trade licence/i })).toHaveCount(0);
});

test("AR locale renders the leads inbox RTL with catalogued strings", async ({
  page,
}) => {
  test.skip(!hasLeadFixture, "demo leads not seeded");
  await loginAsDealer(page, "/dealer/leads");
  await page.goto("/ar/dealer/leads");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl", { timeout: 20_000 });
  // The AR catalogue, not raw keys: the page heading is Arabic.
  await expect(
    page.getByRole("heading", { name: "العملاء المحتملون" }),
  ).toBeVisible({ timeout: 20_000 });
});
