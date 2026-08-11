/**
 * Sell wizard stepper header (task P1-02) — 1 Vehicle · 2 Specs & price ·
 * 3 Photos · 4 Review · 5 Done. Circles always visible (fit mobile);
 * labels appear from md up, with a "Step X of 5 — <label>" line for mobile.
 */
import { Check } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";

const STEP_KEYS = ["vehicle", "specs", "photos", "review", "done"] as const;

export function Stepper({ current }: { current: number }) {
  const { t } = useTranslation("sell");

  return (
    <nav aria-label={t("stepLabel", { current, total: STEP_KEYS.length })}>
      <ol className="flex items-center">
        {STEP_KEYS.map((key, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber < current;
          const isCurrent = stepNumber === current;
          return (
            <li
              key={key}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center",
                index > 0 && "flex-1",
              )}
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-1 h-px flex-1 sm:mx-2",
                    isDone || isCurrent ? "bg-brand" : "bg-line",
                  )}
                />
              )}
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    isDone || isCurrent
                      ? "bg-brand text-white"
                      : "bg-divider text-muted",
                  )}
                >
                  {isDone ? <Check className="size-4" aria-hidden /> : stepNumber}
                </span>
                <span
                  className={cn(
                    "hidden whitespace-nowrap text-xs font-semibold md:block",
                    isCurrent ? "text-brand" : "text-muted",
                  )}
                >
                  {t(`steps.${key}`)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs font-semibold text-muted md:hidden">
        {t("stepLabel", { current, total: STEP_KEYS.length })}
        {" — "}
        {t(`steps.${STEP_KEYS[Math.min(current, STEP_KEYS.length) - 1]}`)}
      </p>
    </nav>
  );
}
