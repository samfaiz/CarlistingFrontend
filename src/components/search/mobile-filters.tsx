/**
 * Mobile filters — task P1-05: "Filters" button (with active-count Badge)
 * opening the full FilterPanel in a slide-over Dialog anchored to the end
 * edge (logical — flips sides automatically in RTL).
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FilterPanel,
  type FilterPanelProps,
} from "@/components/search/filter-panel";

export interface MobileFiltersProps
  extends Omit<FilterPanelProps, "idPrefix" | "className"> {
  /** countActiveFilters(filters) — shown as a Badge on the trigger. */
  activeCount: number;
  onClear: () => void;
  className?: string;
}

export function MobileFilters({
  activeCount,
  onClear,
  className,
  ...panelProps
}: MobileFiltersProps) {
  const { t } = useTranslation("search");
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <SlidersHorizontal aria-hidden />
          {t("filters.title")}
          {activeCount > 0 && (
            <Badge
              variant="solid"
              aria-label={t("filters.activeCount", { count: activeCount })}
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="inset-y-0 end-0 start-auto h-dvh w-[min(90vw,22rem)] max-w-none translate-x-0 translate-y-0 rounded-none p-4 rtl:translate-x-0 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("filters.title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("filters.dialogHint")}
          </DialogDescription>
        </DialogHeader>

        <FilterPanel idPrefix="mobile" {...panelProps} />

        <div className="sticky bottom-0 mt-5 flex gap-2 border-t border-line bg-card pt-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClear}
            disabled={activeCount === 0}
          >
            {t("filters.clear")}
          </Button>
          <DialogClose asChild>
            <Button className="flex-1">{t("filters.showResults")}</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
