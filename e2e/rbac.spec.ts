/**
 * E2E-14 — RBAC denial matrix (SKELETON) — task P0-13.
 *
 * Acceptance-Annex mandatory E2E: every role must be DENIED every surface it
 * does not own (two-sides rule, PRD §1.4: customer-facing product vs
 * company-internal workspace). This file is the seam that grows every phase —
 * each auth/portal task (P1 auth, Dealer Portal, Admin, Super Admin, /crm/*)
 * converts its fixme rows into real assertions and ADDS new rows for the
 * surfaces it introduces. Do not delete rows; only promote them.
 *
 * Remaining cases are test.fixme() until their surface lands. P0-05 promoted
 * the two auth-dependent guest/user rows (login flow + seeded e2e user now
 * exist); portal/admin/CRM rows arrive with their phases.
 */
import { test, expect, request as pwRequest } from "@playwright/test";
import enAuth from "../public/locales/en/auth.json";

const API_HEALTH_URL = "http://localhost:4000/health";
const SEEDED_USER = { email: "e2e@carsens.test", password: "E2eStr0ngPass" };

/** Rows that must log in first need the backend; frontend-only rows never skip. */
async function isApiUp(): Promise<boolean> {
  const ctx = await pwRequest.newContext();
  try {
    const res = await ctx.get(API_HEALTH_URL, { timeout: 3_000 });
    return res.ok();
  } catch {
    return false;
  } finally {
    await ctx.dispose();
  }
}

test.describe("E2E-14: RBAC denial matrix (skeleton — grows every phase)", () => {
  test.describe("guest (unauthenticated)", () => {
    // Promoted by P0-05: SSR guard (getServerSession) — works without JS.
    test("guest visiting /account is redirected to login (never sees User-area content)", async ({
      page,
    }) => {
      await page.goto("/account");
      await page.waitForURL(/\/login\?next=/);
      await expect(
        page.getByRole("heading", { name: enAuth.login.title }),
      ).toBeVisible();
      // Zero User-area content ever rendered.
      await expect(
        page.getByRole("heading", { name: enAuth.account.title }),
      ).toHaveCount(0);
    });
    test.fixme("guest visiting /dealer is redirected to login", async () => {
      // Arrives with Dealer Portal phase.
    });
    test.fixme("guest visiting /admin gets denied (404/redirect — surface not even revealed)", async () => {
      // Arrives with Admin workspace phase. Two-sides rule: internal surface must not leak.
    });
    test.fixme("guest visiting /crm gets denied", async () => {
      // Arrives with CRM phase.
    });
  });

  test.describe("authenticated user (customer)", () => {
    // Promoted by P0-05: the /admin surface does not exist for customers — a
    // logged-in USER gets a plain 404 (two-sides rule: internal surfaces are
    // never even revealed). Grows into a real workspace denial in the Admin phase.
    test("user cannot access /admin (company-internal workspace)", async ({ page }) => {
      test.skip(
        test.info().project.name !== "desktop-chromium",
        "Login-based rows run on desktop-chromium only — /auth/login is rate-limited to 10/min per IP.",
      );
      test.skip(
        !(await isApiUp()),
        `Backend API is not running (${API_HEALTH_URL}) — login-based RBAC rows need it.`,
      );
      await page.goto("/login");
      await page.getByLabel(enAuth.fields.email).fill(SEEDED_USER.email);
      await page.locator("#password").fill(SEEDED_USER.password);
      await page.getByRole("button", { name: enAuth.login.submit }).click();
      await page.waitForURL("**/account");

      const response = await page.goto("/admin");
      expect(response?.status()).toBe(404);
      await expect(
        page.getByRole("heading", { name: enAuth.account.title }),
      ).toHaveCount(0);
    });
    test.fixme("user cannot access /crm/*", async () => {});
    test.fixme("user cannot access another user's dealer portal", async () => {});
  });

  test.describe("dealer", () => {
    test.fixme("dealer cannot access /admin", async () => {});
    test.fixme("dealer cannot access /crm/*", async () => {});
    test.fixme("dealer staff role cannot reach dealer-owner-only settings", async () => {});
  });

  test.describe("admin (company staff)", () => {
    test.fixme("admin cannot access Super Admin-only surfaces", async () => {});
    test.fixme("admin role without finance permission cannot access finance CRM views", async () => {});
  });
});
