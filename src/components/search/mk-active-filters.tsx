/**
 * Applied-filter summary for /cars — the mockup's `.active-filters` row,
 * which shipped with the CSS but was never rendered.
 *
 * With fourteen controls in the sidebar the applied set stops being legible
 * from the panel alone, and every id in the URL (`makeId`, `emirateId`, …) is
 * meaningless to a human. This is the one place those ids are resolved back to
 * names, and the only way to drop a single filter without hunting for the
 * control that set it.
 */
import * as React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  formatNumber,
  termLabel,
  type SearchFilters,
} from "@/components/search/filter-state";
import type {
  TaxonomyMake,
  TaxonomyModel,
  TaxonomyTerm,
  TaxonomyTrim,
} from "@/lib/marketplace-api";

export interface MkActiveFiltersProps {
  filters: SearchFilters;
  makes: TaxonomyMake[];
  models: TaxonomyModel[];
  trims: TaxonomyTrim[];
  bodyTypes: TaxonomyTerm[];
  emirates: TaxonomyTerm[];
  onPatch(patch: Partial<SearchFilters>): void;
  onReset(): void;
}

interface Chip {
  /** Stable key AND the URL param the chip stands for. */
  id: string;
  label: string;
  patch: Partial<SearchFilters>;
}

/* `.mk .more-link` / `.clear-all` were written for spans. They have to be
   buttons to be reachable by keyboard, so only the UA chrome is reset — the
   class keeps its own size, weight and padding. */
const linkButtonStyle: React.CSSProperties = {
  border: 0,
  background: "none",
  fontFamily: "inherit",
  cursor: "pointer",
};

function humanize(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function MkActiveFilters({
  filters,
  makes,
  models,
  trims,
  bodyTypes,
  emirates,
  onPatch,
  onReset,
}: MkActiveFiltersProps) {
  const { t } = useTranslation("mk-search");
  const { t: tListings } = useTranslation("listings");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const tEnum = (group: "fuel" | "transmission" | "spec", value: string) =>
    tListings(`enum.${group}.${value}`, { defaultValue: humanize(value) });

  const chips = React.useMemo<Chip[]>(() => {
    const out: Chip[] = [];
    const name = (
      list: { id: string; name: string; i18n: Record<string, string> | null }[],
      id: string,
    ) => {
      const found = list.find((x) => x.id === id);
      // An id with no taxonomy row (stale link, deleted term) still gets a
      // chip so the user can see something is filtering and remove it.
      return found ? termLabel(found, locale) : id;
    };

    if (filters.q) {
      out.push({ id: "q", label: t("active.keyword", { value: filters.q }), patch: { q: undefined } });
    }
    if (filters.condition) {
      out.push({
        id: "condition",
        label: t(`fg.condition.${filters.condition}`),
        patch: { condition: undefined },
      });
    }
    if (filters.bodyTypeId) {
      out.push({
        id: "bodyTypeId",
        label: name(bodyTypes, filters.bodyTypeId),
        patch: { bodyTypeId: undefined },
      });
    }
    if (filters.makeId) {
      // Dropping the make invalidates everything below it in the cascade.
      out.push({
        id: "makeId",
        label: name(makes, filters.makeId),
        patch: { makeId: undefined, modelId: undefined, trimId: undefined },
      });
    }
    if (filters.modelId) {
      out.push({
        id: "modelId",
        label: name(models, filters.modelId),
        patch: { modelId: undefined, trimId: undefined },
      });
    }
    if (filters.trimId) {
      out.push({ id: "trimId", label: name(trims, filters.trimId), patch: { trimId: undefined } });
    }
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const min = filters.priceMin !== undefined ? formatNumber(filters.priceMin, locale) : "";
      const max = filters.priceMax !== undefined ? formatNumber(filters.priceMax, locale) : "";
      const label =
        min && max
          ? t("active.priceRange", { min, max })
          : min
            ? t("active.priceFrom", { min })
            : t("active.priceTo", { max });
      out.push({ id: "price", label, patch: { priceMin: undefined, priceMax: undefined } });
    }
    if (filters.yearMin !== undefined || filters.yearMax !== undefined) {
      const min = filters.yearMin !== undefined ? String(filters.yearMin) : "";
      const max = filters.yearMax !== undefined ? String(filters.yearMax) : "";
      const label =
        min && max
          ? t("active.yearRange", { min, max })
          : min
            ? t("active.yearFrom", { min })
            : t("active.yearTo", { max });
      out.push({ id: "year", label, patch: { yearMin: undefined, yearMax: undefined } });
    }
    if (filters.mileageMax !== undefined) {
      out.push({
        id: "mileageMax",
        label: t("active.mileageTo", { max: formatNumber(filters.mileageMax, locale) }),
        patch: { mileageMax: undefined },
      });
    }
    for (const value of filters.fuelType) {
      out.push({
        id: `fuelType:${value}`,
        label: tEnum("fuel", value),
        patch: { fuelType: filters.fuelType.filter((x) => x !== value) },
      });
    }
    for (const value of filters.transmission) {
      out.push({
        id: `transmission:${value}`,
        label: tEnum("transmission", value),
        patch: { transmission: filters.transmission.filter((x) => x !== value) },
      });
    }
    for (const value of filters.regionalSpec) {
      out.push({
        id: `regionalSpec:${value}`,
        label: tEnum("spec", value),
        patch: { regionalSpec: filters.regionalSpec.filter((x) => x !== value) },
      });
    }
    if (filters.emirateId) {
      out.push({
        id: "emirateId",
        label: name(emirates, filters.emirateId),
        patch: { emirateId: undefined },
      });
    }
    if (filters.sellerType) {
      out.push({
        id: "sellerType",
        label: t(`fg.seller.${filters.sellerType}`),
        patch: { sellerType: undefined },
      });
    }
    return out;
    // `tEnum`/`t` are stable enough for this list; the filters are what move it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, makes, models, trims, bodyTypes, emirates, locale, t]);

  if (chips.length === 0) return null;

  return (
    <div className="active-filters" role="group" aria-label={t("active.title")}>
      {chips.map((chip) => (
        <span className="filter-chip" key={chip.id}>
          {chip.label}
          <button
            type="button"
            aria-label={t("active.removeLabel", { label: chip.label })}
            onClick={() => onPatch(chip.patch)}
          >
            ×
          </button>
        </span>
      ))}
      <button type="button" className="clear-all" style={linkButtonStyle} onClick={onReset}>
        {t("active.clearAll")}
      </button>
    </div>
  );
}
