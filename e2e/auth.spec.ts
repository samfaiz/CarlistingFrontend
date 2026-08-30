/**
 * Auth flows E2E — task P0-05 (FR-A1–A2).
 *
 * Requires the backend API on http://localhost:4000 (with the seeded E2E user
 * e2e@carsens.test). If the API is down the whole file skips with a clear
 * message so the suite stays green in frontend-only environments.
 *
 * Expectations come from the same locale catalogs the app renders — never
 * hardcoded copy (CLAUDE.md convention #2).
 */
import { test, expect, request as pwRequest } from "@playwright/test";
// The mockup port moved these pages onto the mk-* catalogues; asserting against
// the pre-port auth.json matched nothing on the shipped pages ("Sign in" vs the
// rendered "Log in"), so these flows had not actually been exercised since.
import enLogin from "../public/locales/en/mk-login.json";
import enRegister from "../public/locales/en/mk-register.json";

const API_HEALTH_URL = "http://localhost:4000/health";
const SEEDED_USER = { email: "e2e@carsens.test", password: "E2eStr0ngPass" };

let apiUp = false;

test.beforeAll(async () => {
  const ctx = await pwRequest.newContext();
  try {
    const res = await ctx.get(API_HEALTH_URL, { timeout: 3_000 });
    apiUp = res.ok();
  } catch {
    apiUp = false;
  } finally {
    await ctx.dispose();
  }
});

test.beforeEach(() => {
  test.skip(
    !apiUp,
    `Backend API is not running (${API_HEALTH_URL}) — start Backend/ to run the auth E2E suite.`,
  );
});

/**
 * The backend rate-limits /auth/login to 10 attempts/min per IP. Login flows
 * therefore run on the desktop project only (they are viewport-independent);
 * running them on both projects makes back-to-back suite runs trip the 429.
 */
function desktopOnly() {
  test.skip(
    test.info().project.name !== "desktop-chromium",
    "Login flows run on desktop-chromium only — /auth/login is rate-limited to 10/min per IP.",
  );
}

test.describe("auth flows", () => {
  test("login with the seeded user lands on /account showing the email", async ({
    page,
  }) => {
    desktopOnly();
    await page.goto("/login");
    await page.locator("#email").fill(SEEDED_USER.email);
    await page.locator("#password").fill(SEEDED_USER.password);
    await page.getByRole("button", { name: enLogin.form.submit }).click();

    await page.waitForURL("**/account");
    await expect(page.getByText(SEEDED_USER.email)).toBeVisible();
  });

  test("wrong password shows the localized error and stays on /login", async ({
    page,
  }) => {
    desktopOnly();
    await page.goto("/login");
    // Unknown email → same 401 as a wrong password, without ever touching the
    // seeded user's lockout counter (429 would flake parallel runs).
    await page.locator("#email").fill(`nobody-${Date.now()}@carsens.test`);
    await page.locator("#password").fill("Definitely-Wr0ng");
    await page.getByRole("button", { name: enLogin.form.submit }).click();

    // Next's route announcer is also role=alert — filter to the form banner.
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: enLogin.errors.invalid }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("register with a unique email reaches the check-your-inbox state", async ({
    page,
  }) => {
    // Desktop-only: /auth/register shares the 10/min-per-IP auth throttle, so
    // running it on both viewport projects doubles registrations and trips 429
    // on back-to-back suite runs.
    test.skip(
      test.info().project.name !== "desktop-chromium",
      "Registration pinned to desktop-chromium (auth rate limit 10/min per IP).",
    );
    const uniqueEmail = `e2e-reg-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}@carsens.test`;

    await page.goto("/register");
    await page.getByLabel(enRegister.form.fullName.label).fill("E2E Register Test");
    await page.getByLabel(enRegister.form.email.label).fill(uniqueEmail);
    await page.locator("#regPwd").fill("E2eStr0ngPass");
    // Consent is a required field — without it the browser blocks submit and the
    // success status never renders.
    await page.locator("#register-terms").check();
    await page.getByRole("button", { name: enRegister.form.submit }).click();

    await expect(page.getByRole("status").filter({ hasText: enRegister.success })).toBeVisible();
  });
});
