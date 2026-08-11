/**
 * "Compare" checkbox chip on listing cards — task P1-10.
 *
 * Floats over the card image (sibling of the stretched card link, never
 * nested inside it — axe nested-interactive). Toggles the listing in the
 * compare tray; a full tray (4) shows a warning toast instead of adding.
 *
 * Copy lives in the "listings" catalog (loaded wherever cards render).
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { Check } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useCompare, type CompareEntry } from "./compare-provider";

export interface CompareChipProps {
  entry: CompareEntry;
  className?: string;
}

export function CompareChip({ entry, className }: CompareChipProps) {
  const { t } = useTranslation("listings");
  const { has, toggle } = useCompare();
  const active = has(entry.id);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const accepted = toggle(entry);
    if (!accepted) {
      toast({ title: t("compare.full"), variant: "warning" });
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      aria-label={t("compare.chipLabel", { title: entry.title })}
      onClick={handleClick}
      data-testid="compare-chip"
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-card/90 py-1 ps-1.5 pe-2.5 text-xs font-semibold shadow-soft",
        "transition-colors hover:bg-card focus-visible:outline-2",
        active ? "text-brand" : "text-ink",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 items-center justify-center rounded-[4px] border transition-colors",
          active ? "border-brand bg-brand text-white" : "border-line bg-card",
        )}
      >
        {active ? <Check className="size-3" /> : null}
      </span>
      {t("compare.chip")}
    </button>
  );
}
