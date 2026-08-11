/**
 * Search filter panel — task P1-05 (FR-S1 filter set, FR-S6 URL-driven state).
 *
 * Rendered twice on /cars: inside the desktop sidebar and inside the mobile
 * slide-over Dialog (pass a distinct `idPrefix` so form-control ids never
 * collide). The panel is fully controlled: committed changes bubble up through
 * `onChange` as a partial SearchFilters patch and the page owns the URL/query
 * plumbing. Text/number fields debounce TEXT_FILTER_DEBOUNCE_MS (400 ms);
 * discrete controls (selects, chips, checkboxes) commit immediately.
 *
 * Facet counts (makes, bodyTypes, fuelTypes, emirates) render next to their
 * options when the current search response provided them.
 */
import * as React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  Facets,
  TaxonomyMake,
  TaxonomyMeta,
  TaxonomyModel,
  TaxonomyTrim,
} from "@/lib/marketplace-api";
import {
  FUEL_TYPES,
  REGIONAL_SPECS,
  SELLER_TYPES,
  TEXT_FILTER_DEBOUNCE_MS,
  TRANSMISSIONS,
  formatNumber,
  termLabel,
  type SearchFilters,
} from "@/components/search/filter-state";

export interface FilterPanelProps {
  filters: SearchFilters;
  facets: Facets | null;
  makes: TaxonomyMake[];
  meta: TaxonomyMeta | null;
  models: TaxonomyModel[];
  trims: TaxonomyTrim[];
  onChange: (patch: Partial<SearchFilters>) => void;
  /** Unique per rendered instance (desktop/mobile) — keeps input ids unique. */
  idPrefix: string;
  className?: string;
}

/** Radix Select forbids empty-string item values — sentinel for "no filter". */
const ALL = "all";

/** "PLUGIN_HYBRID" -> "Plugin hybrid" — last-resort label for unknown enums. */
function humanize(value: string): string {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Lenient numeric parse for user input ("100,000" -> 100000). */
function parseNum(value: string): number | undefined {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/* ------------------------------------------------------------------ */
/* Debounced input (FR-S6: text/number filters commit after 400 ms)   */
/* ------------------------------------------------------------------ */

type DebouncedInputProps = Omit<InputProps, "value" | "onChange"> & {
  value: string;
  onCommit: (value: string) => void;
};

function DebouncedInput({ value, onCommit, ...props }: DebouncedInputProps) {
  const [draft, setDraft] = React.useState(value);
  const commitRef = React.useRef(onCommit);
  const committedRef = React.useRef(value);

  React.useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  // External resets (clear all, back/forward) overwrite the local draft.
  React.useEffect(() => {
    if (value !== committedRef.current) {
      committedRef.current = value;
      setDraft(value);
    }
  }, [value]);

  React.useEffect(() => {
    if (draft === committedRef.current) return;
    const timer = setTimeout(() => {
      committedRef.current = draft;
      commitRef.current(draft);
    }, TEXT_FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft]);

  return (
    <Input value={draft} onChange={(e) => setDraft(e.target.value)} {...props} />
  );
}

/* ------------------------------------------------------------------ */
/* Checkbox group                                                     */
/* ------------------------------------------------------------------ */

interface CheckboxOption {
  value: string;
  label: string;
  count?: number;
}

function CheckboxGroup({
  legend,
  idPrefix,
  options,
  selected,
  onToggle,
  locale,
}: {
  legend: string;
  idPrefix: string;
  options: CheckboxOption[];
  selected: string[];
  onToggle: (value: string) => void;
  locale: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-col">
        {options.map((opt) => {
          const id = `${idPrefix}-${opt.value}`;
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink"
            >
              <input
                id={id}
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => onToggle(opt.value)}
                className="size-4 shrink-0 cursor-pointer accent-brand"
              />
              <span className="flex-1">{opt.label}</span>
              {opt.count !== undefined && (
                <span className="text-xs text-muted">
                  {formatNumber(opt.count, locale)}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                              */
/* ------------------------------------------------------------------ */

export function FilterPanel({
  filters,
  facets,
  makes,
  meta,
  models,
  trims,
  onChange,
  idPrefix,
  className,
}: FilterPanelProps) {
  const { t } = useTranslation("search");
  const { t: tListings } = useTranslation("listings");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const tEnum = (group: "fuel" | "transmission" | "spec", value: string) =>
    tListings(`enum.${group}.${value}`, { defaultValue: humanize(value) });

  const makeCounts = React.useMemo(
    () => new Map((facets?.makes ?? []).map((f) => [f.id, f.count])),
    [facets],
  );
  const bodyTypeCounts = React.useMemo(
    () => new Map((facets?.bodyTypes ?? []).map((f) => [f.id, f.count])),
    [facets],
  );
  const fuelCounts = React.useMemo(
    () => new Map((facets?.fuelTypes ?? []).map((f) => [f.value, f.count])),
    [facets],
  );
  const emirateCounts = React.useMemo(
    () => new Map((facets?.emirates ?? []).map((f) => [f.id, f.count])),
    [facets],
  );

  const withCount = (label: string, count: number | undefined) =>
    count !== undefined ? `${label} (${formatNumber(count, locale)})` : label;

  const toggle = (
    group: "fuelType" | "transmission" | "regionalSpec",
    value: string,
  ) => {
    const current = filters[group];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    onChange({ [group]: next } as Partial<SearchFilters>);
  };

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* Make -> model -> trim cascade */}
      <div>
        <Label htmlFor={`${idPrefix}-make`}>{t("filters.make.label")}</Label>
        <Select
          value={filters.makeId ?? ALL}
          onValueChange={(v) =>
            onChange({
              makeId: v === ALL ? undefined : v,
              modelId: undefined,
              trimId: undefined,
            })
          }
        >
          <SelectTrigger id={`${idPrefix}-make`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.make.all")}</SelectItem>
            {makes.map((make) => (
              <SelectItem key={make.id} value={make.id}>
                {withCount(termLabel(make, locale), makeCounts.get(make.id))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-model`}>{t("filters.model.label")}</Label>
        <Select
          value={filters.modelId ?? ALL}
          onValueChange={(v) =>
            onChange({ modelId: v === ALL ? undefined : v, trimId: undefined })
          }
          disabled={!filters.makeId}
        >
          <SelectTrigger id={`${idPrefix}-model`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.model.all")}</SelectItem>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {termLabel(model, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-trim`}>{t("filters.trim.label")}</Label>
        <Select
          value={filters.trimId ?? ALL}
          onValueChange={(v) => onChange({ trimId: v === ALL ? undefined : v })}
          disabled={!filters.modelId}
        >
          <SelectTrigger id={`${idPrefix}-trim`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.trim.all")}</SelectItem>
            {trims.map((trim) => (
              <SelectItem key={trim.id} value={trim.id}>
                {termLabel(trim, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Body type chips (single-select toggle) */}
      {meta && meta.bodyTypes.length > 0 && (
        <div role="group" aria-label={t("filters.bodyType.label")}>
          <p className="mb-1.5 text-sm font-semibold text-ink">
            {t("filters.bodyType.label")}
          </p>
          <div className="flex flex-wrap gap-2">
            {meta.bodyTypes.map((bt) => {
              const isSelected = filters.bodyTypeId === bt.id;
              const count = bodyTypeCounts.get(bt.id);
              return (
                <button
                  key={bt.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    onChange({ bodyTypeId: isSelected ? undefined : bt.id })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    isSelected
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-card text-muted-strong hover:border-brand-border hover:text-brand",
                  )}
                >
                  {termLabel(bt, locale)}
                  {count !== undefined && (
                    <span
                      className={cn(
                        "ms-1 font-normal",
                        isSelected ? "text-white/80" : "text-muted",
                      )}
                    >
                      {formatNumber(count, locale)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price range */}
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-ink">
          {t("filters.price.label")}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <DebouncedInput
            id={`${idPrefix}-price-min`}
            inputMode="numeric"
            aria-label={t("filters.price.min")}
            placeholder={t("filters.price.min")}
            value={filters.priceMin?.toString() ?? ""}
            onCommit={(v) => onChange({ priceMin: parseNum(v) })}
          />
          <DebouncedInput
            id={`${idPrefix}-price-max`}
            inputMode="numeric"
            aria-label={t("filters.price.max")}
            placeholder={t("filters.price.max")}
            value={filters.priceMax?.toString() ?? ""}
            onCommit={(v) => onChange({ priceMax: parseNum(v) })}
          />
        </div>
      </fieldset>

      {/* Max mileage */}
      <div>
        <Label htmlFor={`${idPrefix}-mileage`}>{t("filters.mileage.label")}</Label>
        <DebouncedInput
          id={`${idPrefix}-mileage`}
          inputMode="numeric"
          placeholder={t("filters.mileage.placeholder")}
          value={filters.mileageMax?.toString() ?? ""}
          onCommit={(v) => onChange({ mileageMax: parseNum(v) })}
        />
      </div>

      {/* Year range */}
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-ink">
          {t("filters.year.label")}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <DebouncedInput
            id={`${idPrefix}-year-min`}
            inputMode="numeric"
            aria-label={t("filters.year.min")}
            placeholder={t("filters.year.min")}
            value={filters.yearMin?.toString() ?? ""}
            onCommit={(v) => onChange({ yearMin: parseNum(v) })}
          />
          <DebouncedInput
            id={`${idPrefix}-year-max`}
            inputMode="numeric"
            aria-label={t("filters.year.max")}
            placeholder={t("filters.year.max")}
            value={filters.yearMax?.toString() ?? ""}
            onCommit={(v) => onChange({ yearMax: parseNum(v) })}
          />
        </div>
      </fieldset>

      {/* Fuel type (facet counts when available) */}
      <CheckboxGroup
        legend={t("filters.fuelType.label")}
        idPrefix={`${idPrefix}-fuel`}
        options={FUEL_TYPES.map((v) => ({
          value: v,
          label: tEnum("fuel", v),
          count: fuelCounts.get(v),
        }))}
        selected={filters.fuelType}
        onToggle={(v) => toggle("fuelType", v)}
        locale={locale}
      />

      {/* Transmission */}
      <CheckboxGroup
        legend={t("filters.transmission.label")}
        idPrefix={`${idPrefix}-transmission`}
        options={TRANSMISSIONS.map((v) => ({
          value: v,
          label: tEnum("transmission", v),
        }))}
        selected={filters.transmission}
        onToggle={(v) => toggle("transmission", v)}
        locale={locale}
      />

      {/* Regional spec */}
      <CheckboxGroup
        legend={t("filters.regionalSpec.label")}
        idPrefix={`${idPrefix}-spec`}
        options={REGIONAL_SPECS.map((v) => ({
          value: v,
          label: tEnum("spec", v),
        }))}
        selected={filters.regionalSpec}
        onToggle={(v) => toggle("regionalSpec", v)}
        locale={locale}
      />

      {/* Emirate */}
      <div>
        <Label htmlFor={`${idPrefix}-emirate`}>{t("filters.emirate.label")}</Label>
        <Select
          value={filters.emirateId ?? ALL}
          onValueChange={(v) => onChange({ emirateId: v === ALL ? undefined : v })}
        >
          <SelectTrigger id={`${idPrefix}-emirate`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.emirate.all")}</SelectItem>
            {(meta?.emirates ?? []).map((emirate) => (
              <SelectItem key={emirate.id} value={emirate.id}>
                {withCount(termLabel(emirate, locale), emirateCounts.get(emirate.id))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Seller type */}
      <div>
        <Label htmlFor={`${idPrefix}-seller`}>{t("filters.sellerType.label")}</Label>
        <Select
          value={filters.sellerType ?? ALL}
          onValueChange={(v) => onChange({ sellerType: v === ALL ? undefined : v })}
        >
          <SelectTrigger id={`${idPrefix}-seller`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("filters.sellerType.all")}</SelectItem>
            {SELLER_TYPES.map((v) => (
              <SelectItem key={v} value={v}>
                {t(`filters.sellerType.${v}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Keyword */}
      <div>
        <Label htmlFor={`${idPrefix}-keyword`}>{t("filters.keyword.label")}</Label>
        <DebouncedInput
          id={`${idPrefix}-keyword`}
          type="search"
          placeholder={t("filters.keyword.placeholder")}
          value={filters.q ?? ""}
          onCommit={(v) => onChange({ q: v.trim() || undefined })}
        />
      </div>
    </div>
  );
}
