/**
 * Smoke E2E — task P0-13.
 *
 * Verifies the i18n scaffolding (P0-07) end to end: the localized headline
 * renders from the catalog (no hardcoded strings — expectations come from the
 * same locale JSON the app loads), the Arabic locale flips the document to
 * RTL, and the home page passes the axe serious/critical bar.
 */
import { test, expect } from "@playwright/test";
import enHome from "../public/locales/en/home.json";
import arHome from "../public/locales/ar/home.json";
import { expectNoA11yViolations } from "./helpers/axe";

test.describe("smoke: home page", () => {
  test("renders the localized headline (en) and has no blocking a11y violations", async ({
    page,
  }) => {
    await page.goto("/");

    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline).toContainText(enHome.hero.headline);

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
    await expect(html).toHaveAttribute("dir", "ltr");

    await expectNoA11yViolations(page);
  });

  test("arabic locale renders html[dir=rtl] with the localized headline", async ({
    page,
  }) => {
    await page.goto("/ar");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
    await expect(html).toHaveAttribute("lang", "ar");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(arHome.hero.headline);
  });
});
