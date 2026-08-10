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
 * All cases are test.fixme() until P1 auth lands (login flow + seeded test
 * users are prerequisites — plan P0-13 dependency on seeded test DB, P1 auth).
 */
import { test } from "@playwright/test";

test.describe("E2E-14: RBAC denial matrix (skeleton — grows every phase)", () => {
  test.describe("guest (unauthenticated)", () => {
    test.fixme(
      "guest visiting /account is redirected to login (never sees User-area content)",
      async () => {
        // Arrives with P1 auth: goto /account → expect redirect to /login?next=/account.
      },
    );
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
    test.fixme("user cannot access /admin (company-internal workspace)", async () => {
      // Seeded user fixture logs in → goto /admin → expect denial, zero admin content in DOM.
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
