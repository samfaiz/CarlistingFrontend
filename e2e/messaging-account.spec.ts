/**
 * Messaging, leads and the account area — tasks P2-02 / P2-03 / P2-05.
 *
 * Guard: skips when the API is unreachable (needs the real backend + seeded
 * listings). Login-dependent specs are desktop-pinned — /auth/login is rate
 * limited per IP, so running them across viewport projects trips 429.
 *
 * The buyer is registered fresh per run: conversation state (unread counts,
 * "first message") is only deterministic for a brand-new account.
 */
import { test, expect, type Page } from "@playwright/test";

const HEALTH_URL = "http://localhost:4000/health";
const API = "http://localhost:4000/api/v1";
const SELLER = { email: "e2e@carsens.test", password: "E2eStr0ngPass" };

let backendUp = false;
/** Slug of a LIVE listing owned by the seed seller — the chat counterpart. */
let sellerListingSlug = "";

test.beforeAll(async () => {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
    backendUp = res.ok;
    if (!backendUp) return;

    const login = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(SELLER),
    });
    const { accessToken } = await login.json();
    const mine = await fetch(`${API}/listings/mine?status=LIVE&limit=1`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const page = await mine.json();
    sellerListingSlug = page.items?.[0]?.slug ?? "";
  } catch {
    backendUp = false;
  }
});

test.beforeEach(({}, testInfo) => {
  test.skip(!backendUp, `Backend health check (${HEALTH_URL}) unreachable — skipping P2 E2E`);
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "Login-dependent flow pinned to desktop (auth rate limit per IP)",
  );
});

test.describe.configure({ mode: "serial" });

/** One fresh buyer per run, registered through the UI-facing API. */
const buyer = {
  email: `p2-e2e-${Date.now()}@carsens.test`,
  password: "BuyerStr0ngPass1",
  name: "P2 E2E Buyer",
};
let buyerCookies: Awaited<ReturnType<ReturnType<Page["context"]>["cookies"]>> | null = null;

async function loginAsBuyer(page: Page) {
  if (buyerCookies) {
    await page.context().addCookies(buyerCookies);
    await page.goto("/account");
    if (!/\/login/.test(page.url())) return;
    buyerCookies = null;
  }
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(buyer.email);
  await page.locator("#password").fill(buyer.password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/account(\?|$)/, { timeout: 30_000 });
  buyerCookies = await page.context().cookies();
}

test.beforeAll(async () => {
  if (!backendUp) return;
  await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...buyer, locale: "en" }),
  });
});

test("contact details are absent from the page source until the user asks (FR-D6)", async ({
  page,
}) => {
  test.skip(!sellerListingSlug, "No LIVE listing owned by the seed seller");

  await page.goto(`/cars/${sellerListingSlug}`);
  await page.getByRole("button", { name: /accept|decline/i }).first().click({ trial: true }).catch(() => {});

  // Nothing phone-shaped in the delivered HTML.
  const html = await page.content();
  expect(html).not.toContain("tel:");
  expect(html).not.toMatch(/\+9715\d{8}/);

  // The mockup detail page labels this button with the MASKED number
  // ("050 ••• 9842") rather than "Show number", so match the hook.
  await page.getByTestId("reveal-phone").click();

  /*
   * The mockup detail page reveals the number INTO the button (a second tap
   * dials it) rather than swapping in an <a href="tel:">. What FR-D6 actually
   * requires is that the number is absent from the source until asked for,
   * which the assertion above covers, and present afterwards — which is this.
   */
  const revealed = page.getByTestId("reveal-phone");
  await expect(revealed).toContainText(/\d{3}/, { timeout: 15_000 });
  await expect(revealed).not.toContainText("•");
});

test("buyer starts a conversation from the listing and the seller receives it", async ({
  page,
}) => {
  test.skip(!sellerListingSlug, "No LIVE listing owned by the seed seller");

  await loginAsBuyer(page);
  await page.goto(`/cars/${sellerListingSlug}`);

  // The mockup detail page calls this "Send a message", not "Chat".
  await page.getByTestId("start-chat").click();
  await page.waitForURL(/\/account\/messages\?c=/, { timeout: 30_000 });

  const body = `E2E hello ${Date.now()}`;
  await page.getByLabel(/write a message/i).fill(body);
  await page.getByRole("button", { name: /send/i }).click();

  // Scoped to the bubble: after a reload the same text also appears as the
  // thread-list preview, which would make a bare getByText ambiguous.
  const bubble = page.locator("p.whitespace-pre-wrap", { hasText: body });
  await expect(bubble).toBeVisible({ timeout: 15_000 });

  // And it must survive a reload — i.e. it was persisted, not just rendered.
  await page.reload();
  await expect(page.locator("p.whitespace-pre-wrap", { hasText: body })).toBeVisible({
    timeout: 15_000,
  });

  // The safety notice is permanent, not dismissible (anti-fraud, PRD §13).
  await expect(page.getByText(/never send money/i)).toBeVisible();
});

test("account hub links to every user-area surface", async ({ page }) => {
  await loginAsBuyer(page);
  await page.goto("/account");

  for (const name of [/my listings/i, /messages/i, /saved cars/i, /notifications/i]) {
    await expect(page.getByRole("link", { name })).toBeVisible();
  }
});

test("notification preferences persist across a reload", async ({ page }) => {
  await loginAsBuyer(page);
  await page.goto("/account/notifications");

  const table = page.getByRole("table");
  await expect(table).toBeVisible({ timeout: 20_000 });

  // Every event starts opted IN (the backend stores opt-OUTs).
  const boxes = table.getByRole("checkbox");
  const count = await boxes.count();
  expect(count).toBeGreaterThan(0);

  const first = boxes.first();
  await expect(first).toBeChecked();
  await first.uncheck();

  await page.reload();
  await expect(page.getByRole("table").getByRole("checkbox").first()).not.toBeChecked({
    timeout: 20_000,
  });

  // Restore so re-runs start from the documented default.
  await page.getByRole("table").getByRole("checkbox").first().check();
});

test("my listings paginates and filters without a 500", async ({ page }) => {
  // The seller owns the seeded inventory — this is the page that used to blow
  // past Postgres's bind-parameter limit when it was unbounded.
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(SELLER.email);
  await page.locator("#password").fill(SELLER.password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/account(\?|$)/, { timeout: 30_000 });

  await page.goto("/account/listings");
  await expect(page.getByRole("heading", { name: /my listings/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /\d{4}\s+\w+/ }).first()).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: /^live$/i }).click();
  await expect(page.getByText(/^Live$/).first()).toBeVisible({ timeout: 20_000 });
});

test("unsubscribe page refuses a forged signature", async ({ page }) => {
  await page.goto("/unsubscribe?u=not-a-real-user&t=deadbeef");
  await page.getByRole("button", { name: /unsubscribe me/i }).click();
  await expect(page.getByText(/not valid|expired/i)).toBeVisible({ timeout: 15_000 });
});

/* ------------------------------------------------------------------ */
/* Compare v2 — task P2-06 (FR-CV2–CV4, CV6)                          */
/* ------------------------------------------------------------------ */

/** Seeds the compare tray directly: the add-to-compare journey is P1-10's spec. */
async function seedCompareTray(page: Page, count = 2) {
  await page.goto("/");
  const entries = await page.evaluate(async (n) => {
    const res = await fetch(
      "http://localhost:4000/api/v1/search/listings?limit=6&yearMin=2024&yearMax=2024&regionalSpec=GCC&q=land%20cruiser",
    );
    const { items } = await res.json();
    const picked = items.slice(0, n).map((i: Record<string, never>) => i);
    localStorage.setItem(
      "carsens.compare.v1",
      JSON.stringify(
        picked.map((i: Record<string, never>) => ({
          id: i.id,
          slug: i.slug,
          title: `${i.year} ${(i.make as unknown as { name: string }).name}`,
          year: i.year,
          priceAed: i.priceAed,
          thumb: null,
        })),
      ),
    );
    return picked.length;
  }, count);
  expect(entries).toBe(count);
}

test("compare shows aligned rows, per-row winners and a match score", async ({ page }) => {
  await seedCompareTray(page);
  // Full load: the provider hydrates from storage once, on mount.
  await page.goto("/compare");

  // The mockup port renders the comparison as a CSS grid, not a <table>: the
  // pre-port selectors (table / tbody tr / td.bg-success-soft) match nothing on
  // the shipped page, which is why this asserted against a DOM that no longer exists.
  await expect(page.locator(".cmp-table").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/best overall/i).first()).toBeVisible();

  // At least one value is marked as winning its row.
  await expect(page.locator(".cmp-val.winner").first()).toBeVisible({ timeout: 20_000 });

  const allRows = await page.locator(".cmp-row").count();
  await page.getByRole("checkbox").first().check();
  await expect
    .poll(async () => page.locator(".cmp-row").count(), { timeout: 10_000 })
    .toBeLessThan(allRows);
});

test("the AI advisor asks four questions and recommends one of the cars", async ({
  page,
}) => {
  await seedCompareTray(page);
  await page.goto("/compare");

  // Replaces the guided-quiz test. The quiz is gone — its four questions are
  // now the advisor's, feeding the SAME weights, so the table score and the
  // spoken recommendation can never disagree. Asserting the advisor is
  // therefore the honest successor to asserting the quiz.
  await expect(page.getByText(/best overall/i).first()).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: /help me choose/i }).click();
  const panel = page.getByTestId("compare-advisor");
  await expect(panel).toBeVisible({ timeout: 20_000 });

  // 1: budget. 2: usage. 3: the single priority that sets the weights.
  await panel.getByLabel(/maximum price/i).fill("400000");
  await panel.getByRole("button", { name: /^next$/i }).click();
  await panel.getByRole("button", { name: /^family car$/i }).click();
  await panel.getByRole("button", { name: /^next$/i }).click();
  await panel.getByRole("button", { name: /^space$/i }).click();
  await panel.getByRole("button", { name: /^next$/i }).click();

  // 4: deal-breakers are optional — submitting none must still produce a pick.
  await panel.getByRole("button", { name: /show my recommendation/i }).click();

  const result = page.getByTestId("compare-advisor-result");
  await expect(result).toBeVisible({ timeout: 60_000 });
  await expect(result.getByText(/our pick for you/i)).toBeVisible();

  // The pick must be one of the cars on the table, not prose about a car that
  // is not in the comparison.
  const titles = await page.locator(".cmp-car h4").allTextContents();
  const pick = (await result.textContent()) ?? "";
  expect(titles.length).toBeGreaterThan(0);
  expect(titles.some((tt) => tt.trim() && pick.includes(tt.trim()))).toBe(true);
});

test("a shared compare link opens for a signed-out visitor", async ({ page, context }) => {
  await seedCompareTray(page);
  await page.goto("/compare");
  // Grid, not <table> — see the note on the comparison test above.
  await expect(page.locator(".cmp-table").first()).toBeVisible({ timeout: 20_000 });

  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await page.getByRole("button", { name: /share/i }).first().click();

  const shareLine = page.locator("main p", { hasText: /\/compare\?set=/ });
  await expect(shareLine).toBeVisible({ timeout: 20_000 });
  const url = (await shareLine.textContent())?.trim().replace(/^.*?(http)/, "$1") ?? "";
  expect(url).toMatch(/\/compare\?set=/);

  // Open it in a clean context: a share link must not depend on local state.
  const fresh = await context.browser()!.newContext();
  const freshPage = await fresh.newPage();
  await freshPage.goto(url);
  await expect(freshPage.locator(".cmp-table").first()).toBeVisible({ timeout: 20_000 });
  // Two columns rendered from the saved set, not from the visitor's own tray.
  await expect(freshPage.getByText(/best overall/i).first()).toBeVisible();
  await fresh.close();
});
