/**
 * Accessibility helper — task P0-13 (wired per P0-08's "axe-core in Playwright" gate).
 *
 * Runs the full axe-core ruleset against the current page state, attaches the
 * complete results JSON to the test report (all impacts, for triage), and
 * fails the test only on `serious` and `critical` violations — the WCAG 2.1 AA
 * blocking bar from the Acceptance-Annex. Minor/moderate findings stay visible
 * in the attachment without blocking the suite.
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const BLOCKING_IMPACTS = new Set(["serious", "critical"]);

export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();

  await test.info().attach("axe-results.json", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });

  const blocking = results.violations.filter(
    (v) => v.impact !== undefined && v.impact !== null && BLOCKING_IMPACTS.has(v.impact),
  );

  const summary = blocking
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})\n` +
        v.nodes
          .slice(0, 5)
          .map((n) => `    ${n.target.join(" ")}`)
          .join("\n"),
    )
    .join("\n");

  expect(
    blocking,
    `Expected no serious/critical axe violations, found ${blocking.length}:\n${summary}`,
  ).toEqual([]);
}
