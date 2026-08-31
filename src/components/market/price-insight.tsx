/**
 * "How this price compares" — the buyer-facing read-out of the market signals
 * on a listing: deal rating, distance from the comparable median, the price
 * drop and the price history. Days on market ships as a separate line
 * (DaysOnMarketLine, below) that sits beside the price.
 *
 * The price drop and the history are OBSERVED facts about this one listing;
 * they need no comparable set and are shown whatever the rating says. The
 * median and the comparison sentence are claims about the market, so they are
 * shown only when the rating is current (see isRatingCurrent) — otherwise the
 * panel is honest about knowing less.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { formatPrice } from "@/lib/format";
import { isRatingCurrent, type PriceSignal } from "@/lib/market-api";
import { DealBadge } from "./deal-badge";
import { PriceHistory } from "./price-history";
import styles from "./market.module.css";

function FactIcon({ path }: { path: string }) {
  return (
    <svg
      className={styles.factIcon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function PriceInsight({
  signal,
  locale = "en",
}: {
  /** `undefined` = never fetched; `null` = the market endpoint was down. */
  signal?: PriceSignal | null;
  locale?: string;
}) {
  const { t } = useTranslation("market");

  if (!signal) return null;

  /*
   * Only open a panel headed "how this price compares" when there is in fact a
   * comparison to make: a rating (including NO_DATA, which is itself a
   * finding), a recorded price drop, or more than one price point. Days on
   * market alone does not earn a section — it lives beside the price instead.
   */
  const hasSomething =
    Boolean(signal.dealRating) ||
    Boolean(signal.priceDrop) ||
    signal.history.length > 1;
  if (!hasSomething) return null;

  const rated = isRatingCurrent(signal);
  const pct = Math.round(Math.abs(signal.dealDeltaPct ?? 0));
  const comparison = !rated
    ? null
    : pct === 0
      ? t("insight.atMarket")
      : (signal.dealDeltaPct ?? 0) < 0
        ? t("insight.below", { pct })
        : t("insight.above", { pct });

  const drop = signal.priceDrop;
  const showMedian = rated && signal.marketMedianAed !== null;

  return (
    <div className="detail-section" id="price-insight">
      <h2>{t("insight.title")}</h2>

      <DealBadge signal={signal} size="md" />
      {comparison && <p>{comparison}</p>}

      {(showMedian || drop) && (
        <ul className={styles.facts}>
          {showMedian && signal.marketMedianAed !== null && (
            <li className={styles.fact}>
              <FactIcon path="M3 3v18h18M7 15l4-4 3 3 5-6" />
              <span>
                {t("insight.median", {
                  amount: formatPrice(signal.marketMedianAed, locale),
                })}
              </span>
            </li>
          )}
          {drop && (
            <li className={styles.fact}>
              <FactIcon path="M12 5v14M19 12l-7 7-7-7" />
              <span>
                {drop.daysAgo === 0
                  ? t("insight.priceDropToday", {
                      amount: formatPrice(drop.amountAed, locale),
                    })
                  : t("insight.priceDrop", {
                      amount: formatPrice(drop.amountAed, locale),
                      count: drop.daysAgo,
                    })}
              </span>
            </li>
          )}
        </ul>
      )}

      <PriceHistory points={signal.history} locale={locale} />
    </div>
  );
}

/**
 * "On the market for 84 days" — an observed fact about this one listing, so it
 * needs no comparable set and is shown whatever the rating says. It sits with
 * the price rather than in the panel above, because that is where a buyer
 * reads it as negotiating room.
 */
export function DaysOnMarketLine({ signal }: { signal?: PriceSignal | null }) {
  const { t } = useTranslation("market");
  if (!signal) return null;
  return (
    <div className="price-sub">
      {t("insight.daysOnMarket", { count: signal.daysOnMarket })}
    </div>
  );
}
