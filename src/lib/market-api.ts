/**
 * Market signals API — deal rating, price history, days on market and the
 * finance calculator (Backend/src/market, `MarketPublicController`).
 *
 * Kept out of marketplace-api.ts on purpose: that file is the shared
 * search/listing/lead layer that most of the site imports, and these four
 * endpoints are a self-contained bounded context with their own rules about
 * what may honestly be shown to a buyer.
 *
 * Every route here is `@Public()` on the backend, but it authenticates
 * opportunistically (P2 runtime fact), so pass the session token when there is
 * one and a signed-in buyer's finance lead carries their userId.
 */
import { apiGet, apiPost } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Types — verified against Backend/src/market/market.service.ts       */
/* ------------------------------------------------------------------ */

/** `enum DealRating` (prisma/schema.prisma). NO_DATA = fewer than 6 comparables. */
export type DealRating = "GREAT" | "GOOD" | "FAIR" | "HIGH" | "NO_DATA";

export interface PricePoint {
  priceAed: number;
  /** Change against the previous point; 0 on the first (publication) point. */
  deltaAed: number;
  at: string;
}

/** GET /market/listings/:id/price-signal — takes the listing **id**, not the slug. */
export interface PriceSignal {
  listingId: string;
  priceAed: number;
  daysOnMarket: number;
  /** null on the ~93% of listings the nightly rating cron has not reached. */
  dealRating: DealRating | null;
  /** Already `Number()`-ed server-side; the column itself is a Prisma Decimal. */
  dealDeltaPct: number | null;
  marketMedianAed: number | null;
  priceDrop: { amountAed: number; at: string; daysAgo: number } | null;
  totalChangeAed: number;
  history: PricePoint[];
}

/** GET /market/finance/config — overridable via PlatformSetting `finance.calculator`. */
export interface CalculatorConfig {
  defaultRatePct: number;
  defaultTermMonths: number;
  defaultDownPct: number;
  minTermMonths: number;
  maxTermMonths: number;
  /** Bank loan-to-value cap; the down payment is clamped up to satisfy it. */
  maxLtvPct: number;
}

export interface FinanceQuote {
  priceAed: number;
  downPaymentAed: number;
  minDownPaymentAed: number;
  principalAed: number;
  termMonths: number;
  ratePct: number;
  monthlyAed: number;
  totalPayableAed: number;
  costOfCreditAed: number;
  ltvPct: number;
  /**
   * Present only on server responses, and hardcoded English — the UI renders
   * the translated `finance.disclaimer` key instead and never prints this.
   */
  note?: string;
}

export interface FinanceLeadInput {
  listingId?: string;
  name: string;
  phone: string;
  email?: string;
  /** All four money/term fields are `@IsInt` on FinanceLeadDto except ratePct. */
  priceAed: number;
  downPaymentAed?: number;
  termMonths?: number;
  ratePct?: number;
}

export interface FinanceLeadResult {
  lead: { id: string };
  /** The server re-runs quote() and stores ITS numbers — never the client's. */
  quote: FinanceQuote;
}

/* ------------------------------------------------------------------ */
/* Calls                                                              */
/* ------------------------------------------------------------------ */

export function getPriceSignal(listingId: string): Promise<PriceSignal> {
  return apiGet<PriceSignal>(
    `/market/listings/${encodeURIComponent(listingId)}/price-signal`,
  );
}

export function getFinanceConfig(): Promise<CalculatorConfig> {
  return apiGet<CalculatorConfig>("/market/finance/config");
}

export function createFinanceLead(
  input: FinanceLeadInput,
  accessToken?: string,
): Promise<FinanceLeadResult> {
  return apiPost<FinanceLeadResult>("/market/finance/leads", input, {
    token: accessToken,
  });
}

/* ------------------------------------------------------------------ */
/* Honesty guard                                                      */
/* ------------------------------------------------------------------ */

/**
 * May we show this rating as a verdict about the price on screen?
 *
 * `priceSignal()` does not return `dealRatedAt` (it is not in its select), so
 * we cannot ask how old the rating is. What we CAN check is that it is still
 * internally consistent with the price being displayed: DealRatingService
 * stores `deltaPct = ((priceAed - marketMedianAed) / marketMedianAed) * 100`
 * rounded to two decimals. If the seller has changed the price since the
 * nightly pass, the stored delta no longer describes the price the buyer is
 * looking at, and a coloured badge would be a verdict on a number nobody is
 * being offered. In that case we say nothing rather than something wrong.
 *
 * NO_DATA and null are handled here too, so callers have one question to ask.
 */
export function isRatingCurrent(signal: PriceSignal | null | undefined): boolean {
  if (!signal) return false;
  const { dealRating, dealDeltaPct, marketMedianAed, priceAed } = signal;
  if (!dealRating || dealRating === "NO_DATA") return false;
  if (dealDeltaPct === null || marketMedianAed === null || marketMedianAed <= 0) {
    return false;
  }
  const expected = ((priceAed - marketMedianAed) / marketMedianAed) * 100;
  // 0.02 absorbs the server's 2-decimal rounding. A real price edit moves this
  // by whole percentage points, so the tolerance can afford to be tight.
  return Math.abs(expected - dealDeltaPct) <= 0.02;
}

/* ------------------------------------------------------------------ */
/* Client-side quote                                                  */
/* ------------------------------------------------------------------ */

/**
 * Line-for-line port of `MarketService.quote()`
 * (Backend/src/market/market.service.ts) — EDIT THE TWO TOGETHER.
 *
 * The calculator recomputes on every slider tick, so doing it locally keeps
 * dragging off the network entirely (and off the 120/min global throttle).
 * Correctness is not at stake: `createFinanceLead()` re-runs the server quote
 * and persists its own figures, and the confirmation prints the server's
 * monthly, so any drift between these two implementations shows up
 * immediately instead of hiding.
 *
 * The `Math.round` on the monthly happens BEFORE the total is derived, exactly
 * as the server does it — otherwise the totals disagree by a few dirhams and
 * the confirmation contradicts the calculator the buyer just used.
 */
export function computeQuote(
  input: {
    priceAed: number;
    downPaymentAed?: number;
    termMonths?: number;
    ratePct?: number;
  },
  config: CalculatorConfig,
): FinanceQuote {
  const term = Math.min(
    Math.max(input.termMonths ?? config.defaultTermMonths, config.minTermMonths),
    config.maxTermMonths,
  );
  const ratePct = input.ratePct ?? config.defaultRatePct;
  const minDown = Math.ceil((input.priceAed * (100 - config.maxLtvPct)) / 100);
  const requestedDown =
    input.downPaymentAed ?? Math.round((input.priceAed * config.defaultDownPct) / 100);
  const downPayment = Math.max(minDown, Math.min(requestedDown, input.priceAed));
  const principal = input.priceAed - downPayment;

  const monthlyRate = ratePct / 100 / 12;
  const monthly =
    monthlyRate === 0
      ? principal / term
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
  const monthlyAed = Math.round(monthly);
  const totalPayable = monthlyAed * term + downPayment;

  return {
    priceAed: input.priceAed,
    downPaymentAed: downPayment,
    minDownPaymentAed: minDown,
    principalAed: principal,
    termMonths: term,
    ratePct,
    monthlyAed,
    totalPayableAed: totalPayable,
    costOfCreditAed: totalPayable - input.priceAed,
    ltvPct: Math.round((principal / input.priceAed) * 1000) / 10,
  };
}
