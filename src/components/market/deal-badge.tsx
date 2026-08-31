/**
 * Deal-rating badge — the CarGurus-style "Great price" signal, backed by
 * `DealRatingService` (median of mileage/year-adjusted comparables, minimum 6).
 *
 * The whole point of this component is what it REFUSES to draw. About 93% of
 * listings have no rating at all, and the ones that do can be stale. So:
 *
 *   - no rating yet          → nothing at all (an empty badge is worse than none)
 *   - NO_DATA                → a plain sentence saying we cannot judge the price
 *   - rating no longer matching the displayed price → the same plain sentence
 *
 * NO_DATA is never dressed up as "average" or "fair". It means the comparable
 * set was too thin to make a claim, and it says so.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { isRatingCurrent, type PriceSignal } from "@/lib/market-api";
import styles from "./market.module.css";

const CHIP_CLASS: Record<string, string> = {
  GREAT: styles.chipGreat,
  GOOD: styles.chipGood,
  FAIR: styles.chipFair,
  HIGH: styles.chipHigh,
};

export function DealBadge({
  signal,
  size = "md",
}: {
  /** `undefined` = the page never fetched it; `null` = the fetch failed. */
  signal?: PriceSignal | null;
  /** "sm" stays silent when there is nothing trustworthy to say. */
  size?: "sm" | "md";
}) {
  const { t } = useTranslation("market");

  if (!signal || !signal.dealRating) return null;

  if (!isRatingCurrent(signal)) {
    // NO_DATA, or a rating that no longer describes the price on screen.
    return size === "sm" ? null : <p className={styles.dealNone}>{t("deal.noData")}</p>;
  }

  const rating = signal.dealRating;
  // Literal t() calls, one per branch, so the catalogue guard can see them.
  const label =
    rating === "GREAT"
      ? t("deal.great")
      : rating === "GOOD"
        ? t("deal.good")
        : rating === "FAIR"
          ? t("deal.fair")
          : t("deal.high");

  // Rounded to whole percent: the underlying estimate is a mileage-adjusted
  // median, and a decimal point would imply a precision it does not have.
  const pct = Math.round(Math.abs(signal.dealDeltaPct ?? 0));
  const delta =
    pct === 0
      ? null
      : (signal.dealDeltaPct ?? 0) < 0
        ? t("deal.below", { pct })
        : t("deal.above", { pct });

  // The wrapper owns the spacing so callers can drop the badge straight into a
  // price block without knowing whether it decided to render anything.
  return (
    <span className={styles.badgeRow}>
      <span className={`${styles.chip} ${CHIP_CLASS[rating]}`} title={t("deal.explain")}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
        </svg>
        {label}
        {size === "md" && delta && <span className={styles.chipDelta}>{delta}</span>}
      </span>
    </span>
  );
}
