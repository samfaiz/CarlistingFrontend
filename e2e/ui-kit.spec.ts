/**
 * UI-kit E2E — task P0-13.
 *
 * Exercises the P0-08 component acceptance criteria on the living showcase at
 * /dev/ui-kit: keyboard-only dialog operation (open with Tab+Enter, focus
 * trapped inside, close with Escape), toast firing, and the axe
 * serious/critical bar for the whole page.
 *
 * Note: /dev/ui-kit is an internal reference page with intentionally hardcoded
 * copy (it showcases components, it is not a product surface), so locators may
 * match its literal labels.
 */
import { test, expect, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers/axe";

/** Tab through the page until `selector`'s element owns focus (keyboard-only nav). */
async function tabUntilFocused(page: Page, selector: string, maxTabs = 100): Promise<void> {
  for (let i = 0; i < maxTabs; i++) {
    const focused = await page.evaluate(
      (sel) => document.activeElement === document.querySelector(sel),
      selector,
    );
    if (focused) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Element ${selector} did not receive focus within ${maxTabs} Tab presses`);
}

test.describe("ui-kit: dialog, toast, a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/ui-kit");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("dialog opens via keyboard, traps focus, and closes with Escape", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open dialog" });
    await expect(trigger).toBeVisible();

    // Reach the trigger with the keyboard alone, then activate it with Enter.
    const triggerSelector = await trigger.evaluate((el) => {
      el.setAttribute("data-e2e-target", "dialog-trigger");
      return '[data-e2e-target="dialog-trigger"]';
    });
    await tabUntilFocused(page, triggerSelector);
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Delete this listing?")).toBeVisible();

    // Focus must start inside the dialog…
    await expect
      .poll(() =>
        page.evaluate(() => {
          const d = document.querySelector('[role="dialog"]');
          return !!d && !!document.activeElement && d.contains(document.activeElement);
        }),
      )
      .toBe(true);

    // …and stay trapped inside while tabbing forward past every tabbable
    // (Cancel, Delete, X close → cycles back around).
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      const inDialog = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        return !!d && !!document.activeElement && d.contains(document.activeElement);
      });
      expect(inDialog, `focus escaped the dialog on Tab press #${i + 1}`).toBe(true);
    }

    // Escape closes the dialog and focus returns to the trigger.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("toast fires and appears", async ({ page }) => {
    await page.getByRole("button", { name: "Success toast" }).click();
    // Radix mirrors toast content into a visually-hidden live region → use first().
    await expect(page.getByText("Listing published").first()).toBeVisible();
  });

  test("has no blocking a11y violations", async ({ page }) => {
    await expectNoA11yViolations(page);
  });
});
