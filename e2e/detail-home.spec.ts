/**
 * Home + car detail E2E — tasks P1-07 / P1-08.
 *
 * These tests drive the real seeded backend (no mocks), so the whole file is
 * skip-guarded: when the API is unreachable — or reachable but empty — every
 * test skips instead of failing, keeping the suite green on machines without
 * the docker stack up.
 *
 * Coverage per the task's mandatory E2E:
 *  1. home renders the localized hero + a newly-listed rail with cards,
 *  2. navigating a rail card lands on the detail page with the price panel
 *     and the specifications section,
 *  3. axe gate (serious/critical) on both pages.
 */
import { test, expect } from "@playwright/test";
import arHome from "../public/locales/ar/mk-home.json";
import enHome from "../public/locales/en/mk-home.json";
import enDetail from "../public/locales/en/detail.json";
import enMkDetail from "../public/locales/en/mk-detail.json";
import { expectNoA11yViolations } from "./helpers/axe";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface RailItem {
  id: string;
  slug: string;
}

/* ------------------------------------------------------------------ */
/* Skip-guard: probe the live API once per worker                     */
/* ------------------------------------------------------------------ */

let apiUp = false;
let railItems: RailItem[] = [];
/** Slug of a rail listing whose detail carries a specs snapshot, if any. */
let specsSlug: string | null = null;

test.beforeAll(async () => {
  try {
    // Same query the home page issues — the rail the tests will click through.
    const res = await fetch(`${API_BASE}/search/listings?limit=8&sort=newest`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return;
    const body = (await res.json()) as { items?: RailItem[] };
    railItems = body.items ?? [];
    apiUp = railItems.length > 0;

    // Find a rail card whose detail page will render the specs section.
    for (const item of railItems) {
      const detailRes = await fetch(
        `${API_BASE}/listings/${encodeURIComponent(item.slug)}`,
        { signal: AbortSignal.timeout(5_000) },
      );
      if (!detailRes.ok) continue;
      const detail = (await detailRes.json()) as {
        specsSnapshot: { groups: unknown[] } | null;
      };
      if (detail.specsSnapshot && detail.specsSnapshot.groups.length > 0) {
        specsSlug = item.slug;
        break;
      }
    }
  } catch {
    apiUp = false;
  }
});

test.beforeEach(() => {
  test.skip(
    !apiUp,
    "Live backend API (with seeded listings) is not reachable — skipping home/detail E2E",
  );
});

/* ------------------------------------------------------------------ */
/* Home (P1-08)                                                       */
/* ------------------------------------------------------------------ */

test.describe("home page", () => {
  test("renders the localized hero and a newly-listed rail with cards, passes axe", async ({
    page,
  }) => {
    await page.goto("/");

    // Hero copy comes from the catalog, not hardcoded strings.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      enHome.hero.title,
    );
    await expect(page.getByRole("search")).toBeVisible();

    /*
     * The newly-listed rail. Located by its heading rather than by
     * aria-labelledby: the home page is layout-driven now, so the section
     * order is data, and the heading is the stable anchor in both the stock
     * page and a published layout.
     */
    const rail = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: enHome.fresh.title }) });
    await expect(rail.first()).toBeVisible();
    const cards = rail.first().locator('a[href*="/cars/"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);

    await expectNoA11yViolations(page);
  });

  test("arabic locale renders the hero RTL from the ar catalog", async ({ page }) => {
    await page.goto("/ar");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      arHome.hero.title,
    );
  });
});

/* ------------------------------------------------------------------ */
/* Home -> detail (P1-07)                                             */
/* ------------------------------------------------------------------ */

test.describe("car detail page", () => {
  test("navigating a rail card shows the price panel and specifications, passes axe", async ({
    page,
  }) => {
    test.skip(
      !specsSlug,
      "No LIVE listing with a specs snapshot among the newest 8 — cannot exercise the specs section",
    );
    const slug = specsSlug as string;

    await page.goto("/");

    const rail = page.locator('section[aria-labelledby="newly-listed-heading"]');
    const card = rail.locator(`a[href*="/cars/${slug}"]`).first();
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await page.waitForURL(`**/cars/${slug}`);

    // Price panel: vehicle title is the h1, price renders via formatPrice.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/^AED [\d,.   ]+$/).first()).toBeVisible();

    // P2-03: contact actions are live, and the number is fetched on interaction
    // only — nothing phone-shaped may be in the delivered HTML (FR-D6).
    await expect(
      page.getByRole("button", { name: enDetail.contact.chat }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: enDetail.contact.showNumber }),
    ).toBeEnabled();
    expect(await page.content()).not.toContain("tel:");

    // Specifications section rendered from the specs snapshot.
    await expect(
      page.getByRole("heading", { name: enDetail.specs.heading }),
    ).toBeVisible();

    await expectNoA11yViolations(page);
  });
});

/* ------------------------------------------------------------------ */
/* Full specification sheet                                            */
/* ------------------------------------------------------------------ */

test.describe("specification sheet", () => {
  /*
   * Deliberately NOT gated on specsSlug. The section used to render only from
   * listing.specsSnapshot, which one seeded listing has, so it was invisible on
   * every other car — and the old test skipped rather than catching it. The
   * sheet now resolves from the trim catalogue too, so ANY listing must show it.
   */
  test("renders the whole catalogue, collapses advanced groups and says 'Not specified'", async ({
    page,
  }) => {
    const slug = railItems[0]?.slug;
    test.skip(!slug, "no rail listing to open");

    await page.goto(`/cars/${slug}`);

    const heading = page.getByRole("heading", {
      name: enMkDetail.specs.title,
      exact: true,
    });
    await expect(heading).toBeVisible({ timeout: 20_000 });

    // "N of M specifications listed" — M is the catalogue, not what is filled.
    const coverage = page.locator(".spec-coverage");
    await expect(coverage).toBeVisible();
    const total = Number((await coverage.textContent())?.match(/of (\d+)/)?.[1] ?? 0);
    expect(total).toBeGreaterThanOrEqual(90);

    const toggles = page.locator(".spec-group-toggle");
    expect(await toggles.count()).toBeGreaterThanOrEqual(8);

    // An unknown value reads "Not specified". Rendering "No" would be a claim
    // about someone's car that nobody made.
    const empties = page.locator(".spec-value-empty");
    expect(await empties.count()).toBeGreaterThan(0);
    await expect(empties.first()).toHaveText(enMkDetail.specs.notSpecified);

    /*
     * Advanced groups start closed and open on click.
     *
     * Anchored on the panel id, not on [aria-expanded="false"]: that selector
     * stops matching the moment the button is clicked, so a locator built from
     * it silently re-resolves to some OTHER still-collapsed group and the
     * assertion measures the wrong element.
     */
    const collapsed = page.locator('.spec-group-toggle[aria-expanded="false"]').first();
    await expect(collapsed).toBeVisible();
    const panelId = await collapsed.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const toggle = page.locator(`[aria-controls="${panelId}"]`);
    const panel = page.locator(`#${panelId}`);

    // Collapsed: the panel is not in the DOM at all, so aria-controls dangles
    // only while there is nothing to point at.
    await expect(panel).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();
    expect(await panel.locator(".spec-row").count()).toBeGreaterThan(0);

    // And it closes again.
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toHaveCount(0);

    await expectNoA11yViolations(page);
  });
});
