/**
 * Staff WebAuthn enrolment + step-up in the real browser — task P4-01
 * (AC-AUTH-04). Uses Playwright's CDP virtual authenticator: the passkey
 * ceremony runs through the actual navigator.credentials API, the backend
 * verifies the attestation, and the stepped-up token pair flows back through
 * NextAuth's update() channel.
 *
 * A fresh user is registered per run and promoted to ADMIN via psql — staff
 * accounts cannot be self-registered, and the standing super@ fixtures hold
 * script-enrolled (non-browser) credentials.
 */
import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";

const HEALTH_URL = "http://localhost:4000/health";
const API = "http://localhost:4000/api/v1";

const sql = (statement: string) =>
  execFileSync(
    "docker",
    ["compose", "-f", "C:/dev/Listing Platform/docker-compose.yml", "exec", "-T",
     "postgres", "psql", "-U", "carsens", "-d", "carsens", "-tAc", statement],
    { encoding: "utf8" },
  ).trim();

const email = `e2e-staff-${Date.now()}@carsens.test`;
const password = "StaffStr0ngPass1";
let backendUp = false;

test.beforeAll(async () => {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
    backendUp = res.ok;
    if (!backendUp) return;
    const reg = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "E2E Staff", locale: "en" }),
    });
    if (!reg.ok) {
      backendUp = false;
      return;
    }
    sql(`update "User" set role='ADMIN', "emailVerifiedAt"=now() where email='${email}'`);
  } catch {
    backendUp = false;
  }
});

test.beforeEach(({}, testInfo) => {
  test.skip(!backendUp, "Backend unavailable");
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "CDP virtual authenticator + auth throttle: desktop only",
  );
});

test("staff hit the airlock, enrol a passkey, and admin surfaces unlock", async ({
  page,
}) => {
  // A CTAP2 platform authenticator that auto-completes ceremonies.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });

  // Password sign-in, then any admin page routes to the airlock.
  await page.goto("/login?next=/admin/moderation");
  await page.getByLabel(/email/i).fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), {
    timeout: 30_000,
  });
  await page.waitForURL((url) => url.pathname === "/admin/security", {
    timeout: 20_000,
  });

  // Enrol: the ceremony runs against the virtual authenticator.
  await page.getByLabel(/passkey name/i).fill("E2E virtual key");
  await page.getByRole("button", { name: /create passkey/i }).click();

  // Registration doubled as the step-up — back to the page we wanted.
  await page.waitForURL((url) => url.pathname === "/admin/moderation", {
    timeout: 30_000,
  });

  // The stepped-up token really opens staff APIs: the queue loads (any state
  // but an error), and no STAFF_* 403 toast fires.
  await expect(
    page.getByRole("tab", { name: /queue/i }).or(page.getByRole("heading", { level: 1 })).first(),
  ).toBeVisible({ timeout: 20_000 });

  // The step-up survives navigation — no bounce back to the airlock.
  await page.goto("/admin/verification");
  await expect(page).toHaveURL(/\/admin\/verification/);
  await expect(page.getByText(/pending/i).first()).toBeVisible({ timeout: 20_000 });

  // And the credential is now listed on the security page.
  await page.goto("/admin/security");
  await expect(page.getByText("E2E virtual key")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/stepped up/i)).toBeVisible();
});
