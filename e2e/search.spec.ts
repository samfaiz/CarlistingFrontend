/**
 * Search page E2E — task P1-05 (/cars against the live seeded backend).
 *
 * Guard: the whole file skips when http://localhost:4000/health is
 * unreachable — these tests need the real API + 100K dataset, not mocks.
 *
 * Covers: page loads with >0 results, make filter applied via URL (makeId
 * resolved dynamically from /taxonomy/makes joined with live facet counts)
 * with results + URL staying in sync, keyword search ("patrol"), and the
 * axe serious/critical accessibility gate.
 */
import { test, expect, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers/axe";

const API = "http://localhost:4000/api/v1";
const HEALTH_URL = "http://localhost:4000/health";

let backendUp = false;

test.beforeAll(async () => {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
    backendUp = res.ok;
  } catch {
    backendUp = false;
  }
});

test.beforeEach(() => {
  test.skip(!backendUp, `Backend health check (${HEALTH_URL}) unreachable — skipping search E2E`);
});

/** Listing-card links inside the results grid (excludes header/nav links). */
function resultCards(page: Page) {
  return page.getByTestId("search-results").locator("a[href*='/cars/']");
}

async function expectSomeResults(page: Page) {
  await expect
    .poll(() => resultCards(page).count(), { timeout: 20_000 })
    .toBeGreaterThan(0);
}

test.describe("search page /cars", () => {
  test("loads with results from the seeded dataset and passes the axe gate", async ({
    page,
  }) => {
    await page.goto("/cars");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectSomeResults(page);

    await expectNoA11yViolations(page);
  });

  test("applies a make filter via URL and keeps results + URL in sync", async ({
    page,
  }) => {
    // Resolve a makeId dynamically: taxonomy list joined with live facets so
    // the chosen make is guaranteed to have results in the current dataset.
    const searchRes = await fetch(
      `${API}/search/listings?vehicleType=CAR&limit=1&facets=true`,
    );
    expect(searchRes.ok).toBe(true);
    const searchBody = (await searchRes.json()) as {
      facets: { makes: { id: string; name: string; count: number }[] };
    };
    const topMakeFacet = searchBody.facets.makes[0];
    expect(topMakeFacet).toBeTruthy();

    const makesRes = await fetch(`${API}/taxonomy/makes?vehicleType=CAR`);
    expect(makesRes.ok).toBe(true);
    const makes = (await makesRes.json()) as { id: string; name: string }[];
    const make = makes.find((m) => m.id === topMakeFacet.id);
    expect(make, "facet make must exist in /taxonomy/makes").toBeTruthy();

    await page.goto(`/cars?makeId=${make!.id}`);

    await expectSomeResults(page);

    // URL keeps the filter param (FR-S6 URL-driven state).
    expect(page.url()).toContain(`makeId=${make!.id}`);

    // Results reflect the filter: the first card's title carries the make name.
    await expect(resultCards(page).first().getByRole("heading")).toContainText(
      make!.name,
    );
  });

  test('keyword search for "patrol" returns results', async ({ page }) => {
    await page.goto("/cars?q=patrol");

    await expectSomeResults(page);
    expect(page.url()).toContain("q=patrol");
  });
});
