/**
 * G4-01/02 Design Studio in the real browser (AC-ST-01, AC-ST-03).
 *
 * Same fixture pattern as admin-security.spec.ts: a fresh staff account is
 * registered, promoted with the studio permissions via psql, and stepped up
 * through the CDP virtual authenticator. Then the canvas is exercised for
 * real — layers added, dragged, saved as a version, and rendered server-side.
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

const email = `e2e-studio-${Date.now()}@carsens.test`;
const password = "StudioStr0ngPass1";
let backendUp = false;

test.beforeAll(async () => {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
    backendUp = res.ok;
    if (!backendUp) return;
    const reg = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "E2E Studio", locale: "en" }),
    });
    if (!reg.ok) {
      backendUp = false;
      return;
    }
    // SUPER_ADMIN: the studio permissions are superAdminOnly-registered.
    sql(`update "User" set role='SUPER_ADMIN', "emailVerifiedAt"=now() where email='${email}'`);
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

test("studio canvas: add layers, save a version, render server-side", async ({ page }) => {
  // Registered first so nothing is missed: a runtime error raises the Next dev
  // overlay, which silently eats every subsequent click.
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });

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

  await page.goto("/login?next=/admin/studio");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => url.pathname === "/admin/security", { timeout: 30_000 });
  await page.getByLabel(/passkey name/i).fill("Studio virtual key");
  await page.getByRole("button", { name: /create passkey/i }).click();
  await page.waitForURL((url) => url.pathname === "/admin/studio", { timeout: 30_000 });

  // The Konva stage mounts (client-only, dynamic import).
  const stage = page.getByTestId("studio-stage");
  await expect(stage).toBeVisible({ timeout: 20_000 });
  await expect(stage.locator("canvas").first()).toBeVisible({ timeout: 20_000 });

  // Artboard preset drives the stage size (Meta feed 1080×1080 default).
  const canvasBox = await stage.locator("canvas").first().boundingBox();
  expect(canvasBox?.width).toBeGreaterThan(200);

  // Page load races the step-up: the first loader pass runs with the
  // pre-passkey token and 403s, then re-runs once NextAuth swaps the token in.
  // Assert on the interaction phase only — from here on nothing may fail.
  const failuresBeforeInteraction = failedRequests.length;

  // Add three layer kinds; the layer list reflects each one.
  await page.getByRole("button", { name: "+ Rect" }).click();
  await page.waitForTimeout(800);
  // A JS exception raises the Next dev overlay, which swallows every later
  // click — fail loudly with the message rather than on a mystery timeout.
  expect(pageErrors, `runtime errors: ${pageErrors.join(" | ")}`).toHaveLength(0);
  await page.getByRole("button", { name: "+ Text" }).click();
  await page.getByRole("button", { name: "+ Circle" }).click();
  // exact: the row shows the layer NAME ("Circle") and a type badge ("circle").
  const layerList = page.getByTestId("layer-list");
  await expect(layerList.getByText("Rectangle", { exact: true })).toBeVisible();
  await expect(layerList.getByText("Circle", { exact: true })).toBeVisible();
  await expect(layerList.getByText("Text", { exact: true })).toBeVisible();

  // Drag the top layer — Konva must accept pointer interaction on the stage.
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.55, { steps: 8 });
  await page.mouse.up();

  // Save → the button shows the new version number.
  await page.getByTestId("save-scene").click();
  await expect(page.getByTestId("save-scene")).toContainText(/v\d+/, { timeout: 20_000 });

  // Undo/redo are wired and do not throw.
  await page.getByRole("button", { name: /^Undo$/ }).click();
  await page.getByRole("button", { name: /^Redo$/ }).click();

  // Server render: the scene we just saved comes back as a real raster.
  const renderResponse = page.waitForResponse(
    (res) => res.url().includes("/studio/scenes/") && res.url().endsWith("/render") && res.status() === 201,
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: /server render/i }).click();
  const rendered = await renderResponse;
  const body = (await rendered.json()) as { s3Key: string; width: number; height: number; sizeBytes: number };
  expect(body.s3Key).toMatch(/^studio\/renders\/.+\.png$/);
  expect(body.width).toBe(2160); // 1080 × scale 2
  expect(body.sizeBytes).toBeGreaterThan(1000);

  // Nothing threw, and no studio API or asset request failed along the way.
  expect(pageErrors, `runtime errors: ${pageErrors.join(" | ")}`).toHaveLength(0);
  const studioFailures = failedRequests
    .slice(failuresBeforeInteraction)
    .filter((r) => /\/studio\/|:9100\//.test(r));
  expect(studioFailures, `failed studio requests: ${studioFailures.join(" | ")}`).toHaveLength(0);
  // And the pre-interaction 403s really were only the token swap, nothing else.
  expect(
    failedRequests.slice(0, failuresBeforeInteraction).filter((r) => !r.startsWith("403")),
  ).toHaveLength(0);
});
