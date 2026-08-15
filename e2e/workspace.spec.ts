/**
 * Internal workspace pass — the four new staff surfaces render with live data
 * and their primary controls work (finance, growth, intelligence, studio).
 *
 * Same fixture pattern as admin-security.spec.ts: fresh SUPER_ADMIN + CDP
 * virtual authenticator for the step-up.
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

const email = `e2e-ws-${Date.now()}@carsens.test`;
const password = "WorkspaceStr0ngPass1";
let backendUp = false;

test.beforeAll(async () => {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
    backendUp = res.ok;
    if (!backendUp) return;
    const reg = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "E2E Workspace", locale: "en" }),
    });
    if (!reg.ok) {
      backendUp = false;
      return;
    }
    sql(`update "User" set role='SUPER_ADMIN', "emailVerifiedAt"=now() where email='${email}'`);
  } catch {
    backendUp = false;
  }
});

test.beforeEach(({}, testInfo) => {
  test.skip(!backendUp, "Backend unavailable");
  test.skip(testInfo.project.name !== "desktop-chromium", "CDP virtual authenticator: desktop only");
});

test("the four workspace surfaces load with live data", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

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

  await page.goto("/login?next=/admin/finance");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => url.pathname === "/admin/security", { timeout: 30_000 });
  await page.getByLabel(/passkey name/i).fill("Workspace virtual key");
  await page.getByRole("button", { name: /create passkey/i }).click();
  await page.waitForURL((url) => url.pathname === "/admin/finance", { timeout: 30_000 });

  // ── Finance: KPI tiles carry real numbers, tabs switch to live tables ──
  await expect(page.getByText(/ARR run-rate/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Total AR/i)).toBeVisible();
  await page.getByRole("tab", { name: /collections/i }).click();
  await expect(page.getByText(/Collector workqueue/i)).toBeVisible();
  await expect(page.getByText(/PDC register/i)).toBeVisible();
  await page.getByRole("tab", { name: /period close/i }).click();
  await expect(page.getByText(/sequence audit/i)).toBeVisible();
  // The audit verdict is rendered from the API, so this proves the call worked.
  await expect(page.getByText(/gap-free|Gaps detected/i).first()).toBeVisible({ timeout: 20_000 });

  // ── Growth: three tabs over marketing, campaigns, SEO ──
  await page.goto("/admin/growth");
  await expect(page.getByRole("tab", { name: /marketing leads/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("tab", { name: /campaigns/i }).click();
  await expect(page.getByText(/New campaign/i)).toBeVisible();
  await page.getByRole("tab", { name: /^SEO$/i }).click();
  await expect(page.getByRole("button", { name: /run rank tracking/i })).toBeVisible();

  // ── Intelligence: the persona panel is populated from the seeded defaults ──
  await page.goto("/admin/intelligence");
  await expect(page.getByText(/active personas/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Arabic-first user/i)).toBeVisible();
  await page.getByRole("tab", { name: /flags & experiments/i }).click();
  await expect(page.getByText(/Feature flags/i)).toBeVisible();

  // ── Studio: the canvas still mounts from the nav ──
  await page.goto("/admin/studio");
  await expect(page.getByTestId("studio-stage").locator("canvas").first()).toBeVisible({ timeout: 20_000 });

  expect(pageErrors, `runtime errors: ${pageErrors.join(" | ")}`).toHaveLength(0);
});
