/**
 * Monthly-payment calculator + pre-approval lead (market gap #3).
 *
 * The arithmetic runs locally via `computeQuote`, a port of the server's
 * `MarketService.quote()`. That is what makes it safe to recalculate on every
 * slider tick: dragging costs zero requests, so it cannot trip the global
 * 120/min throttle. The server is still the authority — POST
 * /market/finance/leads re-runs the quote and persists ITS figures, and the
 * confirmation below prints the server's monthly, so a drift between the two
 * implementations is visible the first time anyone submits.
 *
 * Markup uses the `.finance-card` / `.fin-row` / `.fin-result` design the
 * mockup already ships (marketplace-mockup.css) — with one deliberate change:
 * the mockup's `.fin-label`s are <div>s, and every control here carries a real
 * <label htmlFor>. Unnamed controls are an axe-critical failure and this page
 * has two axe gates on it.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { formatPrice } from "@/lib/format";
import {
  computeQuote,
  createFinanceLead,
  type CalculatorConfig,
  type FinanceQuote,
} from "@/lib/market-api";
import styles from "./market.module.css";

/** Down-payment slider granularity — coarse enough to drag with a thumb. */
const DOWN_STEP = 500;

export function FinanceCalculator({
  listingId,
  priceAed,
  config,
  accessToken,
  locale = "en",
}: {
  listingId: string;
  priceAed: number;
  config: CalculatorConfig;
  accessToken?: string;
  locale?: string;
}) {
  const { t } = useTranslation("market");
  const uid = React.useId();
  const ids = {
    downNum: `${uid}-down-amount`,
    down: `${uid}-down`,
    term: `${uid}-term`,
    rate: `${uid}-rate`,
    name: `${uid}-name`,
    phone: `${uid}-phone`,
    email: `${uid}-email`,
    form: `${uid}-form`,
  };

  // The server's quote() rejects a non-positive price outright; here the whole
  // card would just divide by zero, so it stays away instead.
  const usable = priceAed > 0;
  const minDown = Math.ceil((priceAed * (100 - config.maxLtvPct)) / 100);

  /*
   * The deposit is held as TEXT, not a number. A buyer usually knows their
   * deposit to the dirham and a range alone cannot express it on a phone, so
   * the field is typable — and a typed field has to survive being empty
   * mid-edit, which a numeric state cannot (it would snap to 0 under the
   * cursor). The quote clamps whatever is in here, and onBlur writes the
   * clamped figure back so the field never lies about what was used.
   */
  const [downText, setDownText] = React.useState(() =>
    String(Math.max(minDown, Math.round((priceAed * config.defaultDownPct) / 100))),
  );
  const down = Number(downText) || 0;
  const [term, setTerm] = React.useState(config.defaultTermMonths);
  const [rate, setRate] = React.useState(config.defaultRatePct);

  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState<FinanceQuote | null>(null);

  // After the hooks, never before them.
  if (!usable) return null;

  const quote = computeQuote(
    { priceAed, downPaymentAed: down, termMonths: term, ratePct: rate },
    config,
  );

  // 12, 24, 36 … up to the bank cap. Built from config rather than hardcoded
  // so a PlatformSetting change moves the UI with it. The cap and the default
  // are forced into the list: a `finance.calculator` override that puts either
  // off the 12-month grid would otherwise leave the select with no matching
  // option and render blank.
  const termSet = new Set<number>([config.maxTermMonths, config.defaultTermMonths]);
  for (let m = config.minTermMonths; m <= config.maxTermMonths; m += 12) termSet.add(m);
  const terms = [...termSet].sort((a, b) => a - b);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    try {
      const res = await createFinanceLead(
        {
          listingId,
          name: String(form.get("name") ?? "").trim(),
          phone: String(form.get("phone") ?? "").trim(),
          ...(email ? { email } : {}),
          priceAed,
          // The DTO wants integers; the slider already gives them, but the
          // rate is a float and must stay one.
          downPaymentAed: Math.round(quote.downPaymentAed),
          termMonths: quote.termMonths,
          ratePct: quote.ratePct,
        },
        accessToken,
      );
      setConfirmed(res.quote);
    } catch {
      setError(t("finance.leadError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-sidebar finance-card" id="finance-calculator">
      <h3>{t("finance.title")}</h3>
      <p className="muted">{t("finance.subtitle")}</p>

      {/* Price is a fact about the listing, not an input — no control here. */}
      <div className="fin-row">
        <div className="fin-label">
          <span>{t("finance.vehiclePrice")}</span>
        </div>
        <div className="fin-val">{formatPrice(priceAed, locale)}</div>
      </div>

      <div className="fin-row">
        <label className="fin-label" htmlFor={ids.downNum}>
          <span>{t("finance.downPayment")}</span>
          <span className="dim">
            {/* The percentage tracks the CLAMPED figure, so a deposit below the
                bank's LTV floor is visibly corrected while it is being typed. */}
            <b>{Math.round((quote.downPaymentAed / priceAed) * 100)}%</b>
          </span>
        </label>
        <input
          id={ids.downNum}
          className={`f-input ${styles.downAmount}`}
          type="number"
          inputMode="numeric"
          min={minDown}
          max={priceAed}
          step={100}
          value={downText}
          onChange={(e) => setDownText(e.target.value)}
          onBlur={() => setDownText(String(quote.downPaymentAed))}
        />
        <input
          id={ids.down}
          type="range"
          min={minDown}
          max={priceAed}
          step={DOWN_STEP}
          /* The slider cannot leave the legal range even while the number
             field is mid-edit outside it. */
          value={Math.min(Math.max(down, minDown), priceAed)}
          aria-label={t("finance.downPaymentSlider")}
          aria-valuetext={formatPrice(quote.downPaymentAed, locale)}
          onChange={(e) => setDownText(e.target.value)}
        />
      </div>

      <div className="fin-row">
        <label className="fin-label" htmlFor={ids.term}>
          <span>{t("finance.loanTerm")}</span>
        </label>
        <select
          id={ids.term}
          className="f-select"
          value={term}
          onChange={(e) => setTerm(Number(e.target.value))}
        >
          {terms.map((m) => (
            <option key={m} value={m}>
              {t("finance.termOption", { count: m })}
            </option>
          ))}
        </select>
      </div>

      <div className="fin-row">
        <label className="fin-label" htmlFor={ids.rate}>
          <span>{t("finance.interestRate")}</span>
          <span className="dim">
            <b>{quote.ratePct.toFixed(2)}%</b>
          </span>
        </label>
        <input
          id={ids.rate}
          type="range"
          min={1}
          max={15}
          step={0.25}
          value={rate}
          aria-valuetext={t("finance.ratePercent", { pct: quote.ratePct.toFixed(2) })}
          onChange={(e) => setRate(Number(e.target.value))}
        />
      </div>

      {/* Announced on change so dragging a slider is usable without sight. */}
      <div className="fin-result" aria-live="polite">
        <div className="fin-result-row primary">
          <span>{t("finance.monthlyPayment")}</span>
          <strong data-testid="finance-monthly">
            {formatPrice(quote.monthlyAed, locale)}
          </strong>
        </div>
        <div className="fin-result-row">
          <span>{t("finance.loanAmount")}</span>
          <span>{formatPrice(quote.principalAed, locale)}</span>
        </div>
        <div className="fin-result-row">
          <span>{t("finance.totalInterest")}</span>
          <span>{formatPrice(quote.costOfCreditAed, locale)}</span>
        </div>
        <div className="fin-result-row">
          <span>{t("finance.totalCost")}</span>
          <span>{formatPrice(quote.totalPayableAed, locale)}</span>
        </div>
      </div>

      {confirmed ? (
        <p className={styles.ok} role="status">
          {t("finance.leadSuccess", {
            // The SERVER's monthly, deliberately: if it ever disagrees with the
            // figure above, the buyer sees the truth rather than our estimate.
            monthly: formatPrice(confirmed.monthlyAed, locale),
          })}
        </p>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-primary btn-block"
            aria-expanded={open}
            /* Only while the form exists — aria-controls pointing at a missing
               id is an axe finding in its own right. */
            aria-controls={open ? ids.form : undefined}
            onClick={() => setOpen((v) => !v)}
          >
            {t("finance.preApproved")}
          </button>

          {open && (
            <form className={styles.leadForm} id={ids.form} onSubmit={onSubmit}>
              <p className="muted" style={{ margin: 0 }}>
                {t("finance.leadTitle")}
              </p>
              {error && (
                <p className={styles.err} role="alert">
                  {error}
                </p>
              )}
              <div className={styles.leadField}>
                <label htmlFor={ids.name}>{t("finance.leadName")}</label>
                <input
                  id={ids.name}
                  name="name"
                  className="f-input"
                  autoComplete="name"
                  maxLength={120}
                  required
                />
              </div>
              <div className={styles.leadField}>
                <label htmlFor={ids.phone}>{t("finance.leadPhone")}</label>
                <input
                  id={ids.phone}
                  name="phone"
                  className="f-input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  /* Mirrors FinanceLeadDto's PHONE regex so a bad number is
                     caught before it becomes a 400 the buyer cannot read. */
                  pattern="\+?[0-9\s-]{7,20}"
                  required
                />
              </div>
              <div className={styles.leadField}>
                <label htmlFor={ids.email}>{t("finance.leadEmail")}</label>
                <input
                  id={ids.email}
                  name="email"
                  className="f-input"
                  type="email"
                  autoComplete="email"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {busy ? t("finance.leadSending") : t("finance.leadSubmit")}
              </button>
            </form>
          )}
        </>
      )}

      <p className={styles.disclaimer}>
        {t("finance.disclaimer", { downPct: 100 - config.maxLtvPct })}
      </p>
    </div>
  );
}

/**
 * "or AED 1,240 / mo" under the sidebar price, anchored to the calculator.
 * Same `computeQuote` call, so the two figures can never disagree.
 */
export function MonthlyFromPrice({
  priceAed,
  config,
  locale = "en",
}: {
  priceAed: number;
  config: CalculatorConfig;
  locale?: string;
}) {
  const { t } = useTranslation("market");
  if (priceAed <= 0) return null;
  const quote = computeQuote({ priceAed }, config);
  return (
    <a className={styles.monthlyLink} href="#finance-calculator">
      {t("finance.fromMonthly", {
        monthly: formatPrice(quote.monthlyAed, locale),
        months: quote.termMonths,
      })}
    </a>
  );
}
