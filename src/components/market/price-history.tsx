/**
 * Price history — an inline SVG sparkline plus the same points as readable
 * text. Drawn by hand rather than with a charting library: this is one
 * polyline on a page whose LCP is a release gate, and a chart bundle for it
 * would cost more than the feature.
 *
 * The list is not a fallback for the chart, it IS the accessible version of
 * it: the sparkline is aria-hidden and the rows carry the numbers. A screen
 * reader gets the facts, a sighted reader gets the shape, and neither is
 * asked to trust a picture with no labels on it.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import type { PricePoint } from "@/lib/market-api";
import styles from "./market.module.css";

const W = 300;
const H = 64;
const PAD = 6;

/** Newest first, and never more than this many rows — the sidebar is narrow. */
const MAX_ROWS = 5;

export function PriceHistory({
  points,
  locale = "en",
}: {
  points: PricePoint[];
  locale?: string;
}) {
  const { t } = useTranslation("market");

  // One point is a publication price, not a history. Nothing to show.
  if (points.length < 2) return null;

  const values = points.map((p) => p.priceAed);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat line still has to render somewhere, so never divide by zero.
  const span = max - min || 1;

  const coords = points.map((p, i) => ({
    x: PAD + (i / (points.length - 1)) * (W - 2 * PAD),
    y: PAD + (1 - (p.priceAed - min) / span) * (H - 2 * PAD),
  }));
  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const last = coords[coords.length - 1];

  // Arabic reads end-to-start, so a left-to-right timeline points the wrong
  // way. Mirroring the whole graphic is safe because it carries no text.
  const rtl = locale === "ar";

  const rows = [...points].reverse().slice(0, MAX_ROWS);

  return (
    <div className={styles.history}>
      <h3 className={styles.historyTitle}>{t("history.title")}</h3>

      <svg
        className={styles.spark}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        style={rtl ? { transform: "scaleX(-1)" } : undefined}
      >
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last.x} cy={last.y} r="3.5" fill="currentColor" />
      </svg>

      <ul className={styles.historyList}>
        {rows.map((p, i) => (
          <li className={styles.historyRow} key={`${p.at}-${i}`}>
            <span>{formatRelativeTime(p.at, locale)}</span>
            <span>
              {formatPrice(p.priceAed, locale)}
              {p.deltaAed !== 0 && (
                <span className={p.deltaAed < 0 ? styles.down : styles.up}>
                  {" "}
                  {p.deltaAed < 0 ? "−" : "+"}
                  {formatPrice(Math.abs(p.deltaAed), locale)}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
