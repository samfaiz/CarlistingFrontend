/**
 * Guided discovery quiz (task P2-06, FR-CV4).
 *
 * Five questions, then the backend rule engine returns weights plus 3–4
 * same-category suggestions. The priority step is a reorderable list rather
 * than a drag surface: keyboard users get the same control as pointer users,
 * and rank order is all the engine needs.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { ArrowDown, ArrowUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  COMPARE_PRIORITIES,
  submitQuiz,
  type ComparePriority,
  type QuizResponse,
} from "@/lib/marketplace-api";

const USAGE = ["city", "family", "offroad", "longDistance"] as const;

export interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the engine's weights + suggestions once the quiz completes. */
  onComplete: (result: QuizResponse) => void;
  accessToken?: string;
}

export function QuizDialog({ open, onOpenChange, onComplete, accessToken }: QuizDialogProps) {
  const { t } = useTranslation("compare");

  const [budgetMax, setBudgetMax] = React.useState("");
  const [seats, setSeats] = React.useState("");
  const [usage, setUsage] = React.useState<string[]>([]);
  const [ranking, setRanking] = React.useState<ComparePriority[]>([...COMPARE_PRIORITIES]);
  const [submitting, setSubmitting] = React.useState(false);

  const move = (index: number, direction: -1 | 1) => {
    const next = [...ranking];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRanking(next);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const result = await submitQuiz(
        {
          vehicleType: "CAR",
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          seats: seats ? Number(seats) : undefined,
          usage,
          priorityRanking: ranking,
        },
        accessToken,
      );
      onComplete(result);
      onOpenChange(false);
    } catch {
      toast({ title: t("quiz.failed"), variant: "warning" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("quiz.title")}</DialogTitle>
          <DialogDescription>{t("quiz.intro")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-budget">{t("quiz.budget")}</Label>
              <Input
                id="quiz-budget"
                inputMode="numeric"
                placeholder="150000"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-seats">{t("quiz.seats")}</Label>
              <Input
                id="quiz-seats"
                inputMode="numeric"
                placeholder="5"
                value={seats}
                onChange={(e) => setSeats(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-ink">{t("quiz.usage")}</legend>
            <div className="flex flex-wrap gap-2">
              {USAGE.map((option) => {
                const active = usage.includes(option);
                return (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={active ? "primary" : "outline"}
                    aria-pressed={active}
                    onClick={() =>
                      setUsage((prev) =>
                        prev.includes(option)
                          ? prev.filter((u) => u !== option)
                          : [...prev, option],
                      )
                    }
                  >
                    {t(`quiz.usageOptions.${option}`)}
                  </Button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <p className="text-sm font-semibold text-ink">{t("quiz.priorities")}</p>
            <p className="mt-0.5 text-xs text-muted">{t("quiz.prioritiesHint")}</p>
            <ol className="mt-2 flex flex-col gap-1.5">
              {ranking.map((priority, index) => (
                <li
                  key={priority}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-card border border-line p-2",
                    index === 0 && "border-brand-border bg-brand-surface",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    {t(`quiz.priorityLabels.${priority}`)}
                  </span>
                  <span className="flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={index === 0}
                      aria-label={t("quiz.moveUp", {
                        item: t(`quiz.priorityLabels.${priority}`),
                      })}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={index === ranking.length - 1}
                      aria-label={t("quiz.moveDown", {
                        item: t(`quiz.priorityLabels.${priority}`),
                      })}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="size-4" aria-hidden />
                    </Button>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("quiz.cancel")}
          </Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {t("quiz.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
