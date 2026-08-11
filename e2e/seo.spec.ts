/**
 * SEO landing + structured data + sitemap E2E — tasks P1-06 / P1-12.
 *
 * Guard: the whole file skips when http://localhost:4000/health is
 * unreachable — landings resolve slugs against the live taxonomy and the
 * sitemap index counts the live dataset.
 *
 * Covers: /used-cars/toyota (H1 + listing grid + canonical tag),
 * /used-cars/toyota/land-cruiser (model scope shows results), the detail
 * page's Vehicle JSON-LD (parseable, correct @type), the redirect-table 301
 * seam, and /sitemap.xml returning 200 XML.
 */
import { test, expect, type Page } from "@playwright/test";

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
  test.skip(
    !backendUp,
    `Backend health check (${HEALTH_URL}) unreachable — skipping SEO E2E`,
  );
});

/** Listing-card links inside the landing grid (excludes interlink chips). */
function resultCards(page: Page) {
  return page.getByTestId("landing-results").locator("a[href*='/cars/']");
}

test.describe("SEO landing routes (P1-06)", () => {
  test("/used-cars/toyota renders H1, grid and canonical tag", async ({
    page,
  }) => {
    await page.goto("/used-cars/toyota");

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Toyota");

    await expect
      .poll(() => resultCards(page).count(), { timeout: 20_000 })
      .toBeGreaterThan(0);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    expect(await canonical.getAttribute("href")).toMatch(
      /\/used-cars\/toyota$/,
    );

    // hreflang cluster: 4 locales + x-default (§13.1).
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(5);
  });

  test("/used-cars/toyota/land-cruiser shows model-scoped results", async ({
    page,
  }) => {
    await page.goto("/used-cars/toyota/land-cruiser");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Land Cruiser",
    );
    await expect
      .poll(() => resultCards(page).count(), { timeout: 20_000 })
      .toBeGreaterThan(0);
  });

  test("unknown make slug 404s and redirect-table entry 301s", async ({
    page,
  }) => {
    const missing = await page.request.get("/used-cars/not-a-real-make", {
      maxRedirects: 0,
    });
    expect(missing.status()).toBe(404);

    // Documented test entry in src/lib/redirects.ts.
    const redirected = await page.request.get("/used-cars/example-merged-make", {
      maxRedirects: 0,
    });
    expect(redirected.status()).toBe(301);
    expect(redirected.headers()["location"]).toBe("/used-cars/toyota");
  });
});

test.describe("Structured data + sitemaps (P1-12)", () => {
  test("detail page carries parseable Vehicle JSON-LD", async ({ page }) => {
    // Any live listing works — take the newest from the live API.
    const res = await fetch(`${API}/search/listings?limit=1&sort=newest`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as { items: { slug: string }[] };
    const slug = body.items[0]?.slug;
    expect(slug, "search API must return at least one listing").toBeTruthy();

    await page.goto(`/cars/${slug}`);

    const scripts = page.locator('script[type="application/ld+json"]');
    await expect.poll(() => scripts.count()).toBeGreaterThan(0);

    const raw = (await scripts.allTextContents()).find((text) =>
      text.includes('"@type":"Vehicle"'),
    );
    expect(raw, "one JSON-LD block must be a Vehicle").toBeTruthy();

    const parsed = JSON.parse(raw!) as {
      "@type": string;
      offers: { "@type": string; priceCurrency: string; price: number };
    };
    expect(parsed["@type"]).toBe("Vehicle");
    expect(parsed.offers["@type"]).toBe("Offer");
    expect(parsed.offers.priceCurrency).toBe("AED");
    expect(parsed.offers.price).toBeGreaterThan(0);
  });

  test("/sitemap.xml returns 200 XML with listings sheets", async ({
    page,
  }) => {
    const res = await page.request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");

    const xml = await res.text();
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("/sitemaps/landing.xml");
    expect(xml).toContain("/sitemaps/static.xml");
    expect(xml).toContain("/sitemaps/listings-1.xml");

    // One sheet-level check that costs zero upstream search calls (keeps the
    // suite clear of the 60 req/min throttle): static.xml is a valid urlset
    // with the 4-locale + x-default alternate cluster on every entry.
    const staticRes = await page.request.get("/sitemaps/static.xml");
    expect(staticRes.status()).toBe(200);
    const staticXml = await staticRes.text();
    expect(staticXml).toContain("<urlset");
    for (const hreflang of ["en", "ar", "es", "fr", "x-default"]) {
      expect(staticXml).toContain(`hreflang="${hreflang}"`);
    }
  });
});
