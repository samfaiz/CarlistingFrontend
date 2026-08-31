/**
 * The AI verdict, as a conversation (FR-CV4/CV5).
 *
 * Four short questions — budget, what they will use it for, what matters most,
 * deal-breakers — then one recommendation that names a single car, explains it
 * in the shopper's own terms and states what they are giving up. The guided
 * quiz this replaced asked the same things and then handed back a weight
 * vector nobody could read; here the weights are a side-effect (the table
 * re-scores against them) and the answer is the product.
 *
 * The pick, the reasons and the trade-offs are computed from the comparison
 * itself. The model writes only the paragraph, so when it is unavailable the
 * panel says so and shows the same recommendation without prose — it never
 * invents one.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { useSession } from "next-auth/react";
import {
  ADVISOR_MUST_HAVE_OPTIONS,
  ADVISOR_USAGE_OPTIONS,
  COMPARE_PRIORITIES,
  askCompareAdvisor,
  type AdvisorAnswers,
  type AdvisorMustHave,
  type AdvisorPoint,
  type AdvisorResult,
  type AdvisorUsage,
  type CompareMember,
  type ComparePriority,
} from "@/lib/marketplace-api";
import { formatPrice } from "@/lib/format";
import { useCompareLabels } from "./use-compare-labels";
import styles from "./advisor-panel.module.css";

const STEPS = ["budget", "usage", "priority", "mustHaves"] as const;
type Step = (typeof STEPS)[number];

export interface AdvisorPanelProps {
  members: CompareMember[];
  locale: string;
  /** Applied to the compare table so the score and the verdict agree. */
  onWeights: (weights: Record<string, number>) => void;
  onClose: () => void;
}

export function AdvisorPanel({
  members,
  locale,
  onWeights,
  onClose,
}: AdvisorPanelProps) {
  const { t } = useTranslation("mk-compare");
  const { data: session } = useSession();
  const { rowLabel, rowValue } = useCompareLabels(locale);

  /*
   * Advisor points quote the same rows the table shows, so they go through the
   * same label/value formatting — otherwise "Mileage 106000" reads as a
   * different unit of information from "106,000 km" two sections below.
   */
  const asRow = React.useCallback(
    (p: AdvisorPoint) => ({
      key: p.rowKey,
      group: p.group,
      label: p.label,
      labelI18n: p.labelI18n,
      unit: p.unit,
      kind:
        p.group === "basics" || p.group === "ownership"
          ? ("basic" as const)
          : ("spec" as const),
    }),
    [],
  );
  const pointLabel = React.useCallback(
    (p: AdvisorPoint) => {
      const row = asRow(p);
      return `${rowLabel(row)}${row.unit && row.kind === "spec" ? ` (${row.unit})` : ""}`;
    },
    [asRow, rowLabel],
  );
  const pointValue = React.useCallback(
    (p: AdvisorPoint, value: string | null) => rowValue(asRow(p), value) ?? "—",
    [asRow, rowValue],
  );

  const [stepIndex, setStepIndex] = React.useState(0);
  const [budget, setBudget] = React.useState("");
  const [usage, setUsage] = React.useState<AdvisorUsage | undefined>();
  const [priority, setPriority] = React.useState<ComparePriority | undefined>();
  const [mustHaves, setMustHaves] = React.useState<AdvisorMustHave[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [result, setResult] = React.useState<AdvisorResult | null>(null);

  const step: Step = STEPS[stepIndex];
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);

  // Each question is a new heading; moving focus to it is what makes this a
  // conversation for a screen reader instead of a silently mutating form.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex, result]);

  const answers: AdvisorAnswers = React.useMemo(
    () => ({
      budgetAed: budget ? Number(budget) : undefined,
      usage,
      priority,
      mustHaves: mustHaves.length > 0 ? mustHaves : undefined,
    }),
    [budget, usage, priority, mustHaves],
  );

  const submit = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await askCompareAdvisor(
        members,
        answers,
        locale,
        session?.accessToken,
      );
      setResult(res);
      onWeights(res.weights);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setResult(null);
    setStepIndex(0);
    setFailed(false);
  };

  if (result) {
    const pickFit = result.fits[result.pick];
    const runnerTitle =
      result.runnerUp !== null ? result.fits[result.runnerUp]?.title : null;
    return (
      <section
        className={styles.panel}
        aria-label={t("advisor.resultLabel")}
        data-testid="compare-advisor-result"
      >
        <h3 className={styles.heading} tabIndex={-1} ref={headingRef}>
          {t("advisor.pickLabel")}
        </h3>
        <p className={styles.pick}>{result.pickTitle}</p>

        {result.narrative ? (
          <p className={styles.narrative}>{result.narrative}</p>
        ) : (
          <p className={styles.degraded} role="status">
            {t("advisor.degraded")}
          </p>
        )}

        {result.strengths.length > 0 && (
          <div className={styles.block}>
            <h4 className={styles.blockTitle}>{t("advisor.why")}</h4>
            <ul className={styles.points}>
              {result.strengths.map((p) => (
                <li key={`s-${p.rowKey}`}>
                  <span className={styles.pointLabel}>{pointLabel(p)}</span>
                  <span className={styles.pointValue}>
                    {pointValue(p, p.pickValue)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.block}>
          <h4 className={styles.blockTitle}>{t("advisor.tradeoff")}</h4>
          {result.tradeoffs.length === 0 ? (
            <p className={styles.note}>{t("advisor.noTradeoff")}</p>
          ) : (
            <ul className={styles.points}>
              {result.tradeoffs.map((p) => (
                <li key={`t-${p.rowKey}`}>
                  <span className={styles.pointLabel}>{pointLabel(p)}</span>
                  <span className={styles.pointValue}>
                    {t("advisor.versus", {
                      pick: pointValue(p, p.pickValue),
                      rival: pointValue(p, p.rivalValue),
                      rivalTitle:
                        p.rivalIndex !== null
                          ? (result.fits[p.rivalIndex]?.title ?? "")
                          : (runnerTitle ?? ""),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {(pickFit?.overBudget ||
          (pickFit?.unmetMustHaves.length ?? 0) > 0 ||
          (pickFit?.unknownMustHaves.length ?? 0) > 0) && (
          <ul className={styles.warnings}>
            {pickFit.overBudget && pickFit.budgetGapAed !== null && (
              <li>
                {t("advisor.overBudget", {
                  amount: formatPrice(pickFit.budgetGapAed, locale),
                })}
              </li>
            )}
            {pickFit.unmetMustHaves.length > 0 && (
              <li>
                {t("advisor.missingMustHaves", {
                  list: pickFit.unmetMustHaves
                    .map((m) => t(`advisor.mustHaveOptions.${m}`))
                    .join(", "),
                })}
              </li>
            )}
            {pickFit.unknownMustHaves.length > 0 && (
              <li>
                {t("advisor.unknownMustHaves", {
                  list: pickFit.unknownMustHaves
                    .map((m) => t(`advisor.mustHaveOptions.${m}`))
                    .join(", "),
                })}
              </li>
            )}
          </ul>
        )}

        <p className={styles.disclaimer}>{result.disclaimer}</p>

        <div className={styles.actions}>
          <button type="button" className="btn btn-outline" onClick={restart}>
            {t("advisor.restart")}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t("advisor.close")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.panel}
      aria-label={t("advisor.title")}
      data-testid="compare-advisor"
    >
      <p className={styles.progress}>
        {t("advisor.progress", { step: stepIndex + 1, total: STEPS.length })}
      </p>
      <h3 className={styles.heading} tabIndex={-1} ref={headingRef}>
        {t(`advisor.questions.${step}`)}
      </h3>
      <p className={styles.note}>{t(`advisor.hints.${step}`)}</p>

      {step === "budget" && (
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="advisor-budget">
            {t("advisor.budgetLabel")}
          </label>
          <input
            id="advisor-budget"
            inputMode="numeric"
            className={`form-input ${styles.control}`}
            value={budget}
            placeholder={t("advisor.budgetPlaceholder")}
            onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      )}

      {step === "usage" && (
        <div className={styles.chips} role="group" aria-label={t("advisor.questions.usage")}>
          {ADVISOR_USAGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={usage === option}
              className={`${styles.chip} ${usage === option ? styles.chipOn : ""}`}
              onClick={() => setUsage(usage === option ? undefined : option)}
            >
              {t(`advisor.usageOptions.${option}`)}
            </button>
          ))}
        </div>
      )}

      {step === "priority" && (
        <div className={styles.chips} role="group" aria-label={t("advisor.questions.priority")}>
          {COMPARE_PRIORITIES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={priority === option}
              className={`${styles.chip} ${priority === option ? styles.chipOn : ""}`}
              onClick={() => setPriority(priority === option ? undefined : option)}
            >
              {t(`advisor.priorityOptions.${option}`)}
            </button>
          ))}
        </div>
      )}

      {step === "mustHaves" && (
        <div className={styles.chips} role="group" aria-label={t("advisor.questions.mustHaves")}>
          {ADVISOR_MUST_HAVE_OPTIONS.map((option) => {
            const on = mustHaves.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={on}
                className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                onClick={() =>
                  setMustHaves((prev) =>
                    prev.includes(option)
                      ? prev.filter((m) => m !== option)
                      : [...prev, option],
                  )
                }
              >
                {t(`advisor.mustHaveOptions.${option}`)}
              </button>
            );
          })}
        </div>
      )}

      {failed && (
        <p className={styles.degraded} role="status">
          {t("advisor.failed")}
        </p>
      )}

      <div className={styles.actions}>
        {stepIndex > 0 && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setStepIndex((i) => i - 1)}
          >
            {t("advisor.back")}
          </button>
        )}
        {stepIndex < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setStepIndex((i) => i + 1)}
          >
            {t("advisor.next")}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? t("advisor.thinking") : t("advisor.submit")}
          </button>
        )}
        <button type="button" className="btn btn-outline" onClick={onClose}>
          {t("advisor.close")}
        </button>
      </div>
    </section>
  );
}
