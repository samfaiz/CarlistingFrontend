/**
 * /cars filter sidebar — the mockup's `.mk` panel, extended from four groups
 * to the full set of filters `SearchQueryDto` already accepts. Everything the
 * user picks goes straight into the URL (the parent owns `router.push`), so a
 * refined search stays shareable and the back button undoes one filter.
 *
 * Design layer: `.mk` classes only. The classes below (`.f-select`,
 * `.check-list`, `.range-row`, `.more-link`, `.fgroup.collapsed`) all shipped
 * with the mockup port and were never rendered — this is what they were for.
 */
import * as React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  CONDITIONS,
  FUEL_TYPES,
  REGIONAL_SPECS,
  SELLER_TYPES,
  TRANSMISSIONS,
  formatNumber,
  termLabel,
  type SearchFilters,
} from "@/components/search/filter-state";
import type {
  Facets,
  TaxonomyMake,
  TaxonomyModel,
  TaxonomyTerm,
  TaxonomyTrim,
} from "@/lib/marketplace-api";

/** Makes shown before the "show more" link. The mockup's own cut-off. */
const MAKE_PREVIEW = 9;

export interface MkFilterPanelProps {
  filters: SearchFilters;
  facets: Facets;
  makes: TaxonomyMake[];
  models: TaxonomyModel[];
  trims: TaxonomyTrim[];
  bodyTypes: TaxonomyTerm[];
  emirates: TaxonomyTerm[];
  /** Live keyword box, lifted so the compact bar's Update button can commit it. */
  keyword: string;
  onKeywordChange(value: string): void;
  total: number;
  activeCount: number;
  /** Phone-only accordion state; CSS keeps the panel open above the breakpoint. */
  open: boolean;
  onToggleOpen(): void;
  onPatch(patch: Partial<SearchFilters>): void;
  onReset(): void;
  onShowResults(): void;
}

/*
 * `.mk .fgroup h4` is already the flex row with the chevron, but nothing in
 * the mockup CSS styles a button inside it — and the heading has to BE a
 * button, or the collapse is mouse-only and axe/keyboard users lose fourteen
 * groups. These reset the UA button chrome without touching the stylesheet.
 */
const headButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  padding: 0,
  border: 0,
  background: "none",
  font: "inherit",
  color: "inherit",
  textAlign: "start",
  cursor: "pointer",
};

/* `.mk .more-link` / `.clear-all` were written for spans. They have to be
   buttons to be reachable by keyboard, so only the UA chrome is reset — the
   class keeps its own size, weight and padding. */
const linkButtonStyle: React.CSSProperties = {
  border: 0,
  background: "none",
  fontFamily: "inherit",
  cursor: "pointer",
};

/** Enum value with no catalogue entry — "PLUGIN_HYBRID" -> "Plugin hybrid". */
function humanize(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function MkFilterPanel({
  filters,
  facets,
  makes,
  models,
  trims,
  bodyTypes,
  emirates,
  keyword,
  onKeywordChange,
  total,
  activeCount,
  open,
  onToggleOpen,
  onPatch,
  onReset,
  onShowResults,
}: MkFilterPanelProps) {
  const { t } = useTranslation("mk-search");
  // Enum VALUE labels are already translated once, for the listing cards and
  // the detail page. Re-translating them into mk-search would let the two
  // drift apart.
  const { t: tListings } = useTranslation("listings");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const tEnum = (group: "fuel" | "transmission" | "spec", value: string) =>
    tListings(`enum.${group}.${value}`, { defaultValue: humanize(value) });

  /*
   * Fourteen groups fully expanded is a panel taller than any viewport. The
   * six a car buyer starts with stay open; the rest collapse unless the URL
   * already carries a value for them, which is identical on the server and on
   * the first client render, so hydration matches.
   */
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(
    () => ({
      trim: !filters.trimId,
      year: filters.yearMin === undefined && filters.yearMax === undefined,
      mileage: filters.mileageMax === undefined,
      fuel: filters.fuelType.length === 0,
      transmission: filters.transmission.length === 0,
      regional: filters.regionalSpec.length === 0,
      location: !filters.emirateId,
      seller: !filters.sellerType,
    }),
  );
  const toggleGroup = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const [showAllMakes, setShowAllMakes] = React.useState(false);

  const makeCounts = React.useMemo(
    () => new Map(facets.makes.map((f) => [f.id, f.count])),
    [facets.makes],
  );
  const fuelCounts = React.useMemo(
    () => new Map(facets.fuelTypes.map((f) => [f.value, f.count])),
    [facets.fuelTypes],
  );
  const emirateCounts = React.useMemo(
    () => new Map(facets.emirates.map((f) => [f.id, f.count])),
    [facets.emirates],
  );

  /*
   * Ordered by how many cars each make has under the OTHER filters (the facet
   * dimension self-excludes, so picking Toyota still returns every make), with
   * the selected make pinned first — otherwise choosing a long-tail make hides
   * the only ticked box behind "show more".
   */
  const makeRows = React.useMemo(() => {
    const rows = makes.map((m) => ({
      id: m.id,
      name: termLabel(m, locale),
      count: makeCounts.get(m.id),
    }));
    rows.sort((a, b) => {
      if (a.id === filters.makeId) return -1;
      if (b.id === filters.makeId) return 1;
      const diff = (b.count ?? 0) - (a.count ?? 0);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
    return rows;
  }, [makes, makeCounts, filters.makeId, locale]);

  const visibleMakes = showAllMakes ? makeRows : makeRows.slice(0, MAKE_PREVIEW);
  const hiddenMakeCount = Math.max(0, makeRows.length - MAKE_PREVIEW);

  /** Multi-select CSV filters: tick adds, untick removes. */
  const toggleValue = (
    group: "fuelType" | "transmission" | "regionalSpec",
    value: string,
  ) => {
    const current = filters[group];
    onPatch({
      [group]: current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value],
    } as Partial<SearchFilters>);
  };

  /**
   * Numeric boxes commit on blur and on Enter, never per keystroke: every
   * commit is a full SSR round-trip against a route throttled at 60/min, and
   * a debounced five-digit mileage entry burns several of those a second.
   */
  const commitNumber = (key: keyof SearchFilters, raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    const value = digits ? Number.parseInt(digits, 10) : undefined;
    onPatch({ [key]: value } as Partial<SearchFilters>);
  };

  const numberProps = (key: "priceMin" | "priceMax" | "yearMin" | "yearMax" | "mileageMax") => ({
    className: "f-input",
    type: "text" as const,
    inputMode: "numeric" as const,
    /* Remount when the applied value changes so "Reset all" and chip removal
       actually empty the box — a bare defaultValue keeps the stale text. */
    key: `${key}-${filters[key] ?? ""}`,
    defaultValue: filters[key] !== undefined ? String(filters[key]) : "",
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => commitNumber(key, e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNumber(key, e.currentTarget.value);
      }
    },
  });

  /** One collapsible group. `titleId` labels the selects that follow it. */
  const group = (
    key: string,
    title: string,
    children: React.ReactNode,
    alwaysOpen = false,
  ) => {
    const isCollapsed = !alwaysOpen && collapsed[key] === true;
    return (
      <div className={isCollapsed ? "fgroup collapsed" : "fgroup"} key={key}>
        <h4>
          <button
            type="button"
            style={headButtonStyle}
            aria-expanded={!isCollapsed}
            aria-controls={`fgroup-${key}`}
            onClick={() => toggleGroup(key)}
          >
            <span id={`fgroup-${key}-title`}>{title}</span>
            <svg
              className="chev"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </h4>
        <div className="fbody" id={`fgroup-${key}`}>
          {children}
        </div>
      </div>
    );
  };

  const withCount = (label: string, count: number | undefined) =>
    count === undefined ? label : `${label} (${formatNumber(count, locale)})`;

  return (
    <aside className={open ? "filters-card is-open" : "filters-card"}>
      {/* Mobile-only summary toggle; CSS hides it above the phone breakpoint. */}
      <button
        type="button"
        className="filters-toggle"
        aria-expanded={open}
        aria-controls="filters-body"
        onClick={onToggleOpen}
      >
        <span>
          {t("filters.title")}
          {activeCount > 0 ? <span className="filters-count">{activeCount}</span> : null}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className="filters-head">
        <h3>{t("filters.title")}</h3>
        <button className="reset" type="button" onClick={onReset}>
          {t("filters.reset")}
        </button>
      </div>

      <div className="filters-body" id="filters-body">
        {group(
          "keyword",
          t("fg.keyword.title"),
          <input
            className="f-input"
            aria-label={t("fg.keyword.title")}
            placeholder={t("fg.keyword.placeholder")}
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onPatch({ q: keyword || undefined });
              }
            }}
            onBlur={() => {
              if ((filters.q ?? "") !== keyword) onPatch({ q: keyword || undefined });
            }}
          />,
          true,
        )}

        {group(
          "condition",
          t("fg.condition.title"),
          <div className="chips" role="group" aria-label={t("fg.condition.title")}>
            <button
              type="button"
              className={`chip${!filters.condition ? " active" : ""}`}
              aria-pressed={!filters.condition}
              onClick={() => onPatch({ condition: undefined })}
            >
              {t("fg.condition.all")}
            </button>
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip${filters.condition === c ? " active" : ""}`}
                aria-pressed={filters.condition === c}
                onClick={() => onPatch({ condition: filters.condition === c ? undefined : c })}
              >
                {t(`fg.condition.${c}`)}
              </button>
            ))}
          </div>,
          true,
        )}

        {group(
          "body",
          t("fg.body.title"),
          <div className="chips" role="group" aria-label={t("fg.body.title")}>
            <button
              type="button"
              className={`chip${!filters.bodyTypeId ? " active" : ""}`}
              aria-pressed={!filters.bodyTypeId}
              onClick={() => onPatch({ bodyTypeId: undefined })}
            >
              {t("fg.body.all")}
            </button>
            {bodyTypes.map((bt) => (
              <button
                key={bt.id}
                type="button"
                className={`chip${filters.bodyTypeId === bt.id ? " active" : ""}`}
                aria-pressed={filters.bodyTypeId === bt.id}
                onClick={() =>
                  onPatch({ bodyTypeId: filters.bodyTypeId === bt.id ? undefined : bt.id })
                }
              >
                {termLabel(bt, locale)}
              </button>
            ))}
          </div>,
          true,
        )}

        {group(
          "make",
          t("fg.make.title"),
          <>
            <div className="check-list" role="group" aria-label={t("fg.make.title")}>
              {visibleMakes.map((mk) => (
                <label className="check-row" key={mk.id}>
                  <input
                    type="checkbox"
                    checked={filters.makeId === mk.id}
                    onChange={(e) =>
                      // Single-select: the DTO takes one makeId, so a second
                      // tick replaces the first. Changing make invalidates the
                      // model and trim below it.
                      onPatch({
                        makeId: e.target.checked ? mk.id : undefined,
                        modelId: undefined,
                        trimId: undefined,
                      })
                    }
                  />{" "}
                  {mk.name}
                  {mk.count !== undefined ? (
                    <span className="cnt">{formatNumber(mk.count, locale)}</span>
                  ) : null}
                </label>
              ))}
            </div>
            {hiddenMakeCount > 0 ? (
              <button
                type="button"
                className="more-link"
                style={linkButtonStyle}
                onClick={() => setShowAllMakes((v) => !v)}
              >
                {showAllMakes
                  ? t("fg.make.showLess")
                  : t("fg.make.showMore", { n: hiddenMakeCount })}
              </button>
            ) : null}
          </>,
          true,
        )}

        {group(
          "model",
          t("fg.model.title"),
          <select
            className="f-select"
            aria-labelledby="fgroup-model-title"
            value={filters.modelId ?? ""}
            disabled={!filters.makeId}
            onChange={(e) =>
              onPatch({ modelId: e.target.value || undefined, trimId: undefined })
            }
          >
            <option value="">
              {filters.makeId ? t("fg.model.all") : t("fg.model.pickMakeFirst")}
            </option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {termLabel(m, locale)}
              </option>
            ))}
          </select>,
          true,
        )}

        {group(
          "trim",
          t("fg.trim.title"),
          <select
            className="f-select"
            aria-labelledby="fgroup-trim-title"
            value={filters.trimId ?? ""}
            disabled={!filters.modelId}
            onChange={(e) => onPatch({ trimId: e.target.value || undefined })}
          >
            <option value="">
              {filters.modelId ? t("fg.trim.all") : t("fg.trim.pickModelFirst")}
            </option>
            {trims.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {termLabel(tr, locale)}
              </option>
            ))}
          </select>,
        )}

        {group(
          "price",
          t("fg.price.title"),
          <div className="range-row">
            <input
              {...numberProps("priceMin")}
              aria-label={t("fg.price.minLabel")}
              placeholder={t("fg.price.min")}
            />
            <span aria-hidden="true">–</span>
            <input
              {...numberProps("priceMax")}
              aria-label={t("fg.price.maxLabel")}
              placeholder={t("fg.price.max")}
            />
          </div>,
          true,
        )}

        {group(
          "year",
          t("fg.year.title"),
          <div className="range-row">
            <input
              {...numberProps("yearMin")}
              aria-label={t("fg.year.minLabel")}
              placeholder={t("fg.year.min")}
            />
            <span aria-hidden="true">–</span>
            <input
              {...numberProps("yearMax")}
              aria-label={t("fg.year.maxLabel")}
              placeholder={t("fg.year.max")}
            />
          </div>,
        )}

        {group(
          "mileage",
          t("fg.mileage.title"),
          <input
            {...numberProps("mileageMax")}
            aria-label={t("fg.mileage.maxLabel")}
            placeholder={t("fg.mileage.placeholder")}
          />,
        )}

        {group(
          "fuel",
          t("fg.fuel.title"),
          <div className="check-list" role="group" aria-label={t("fg.fuel.title")}>
            {FUEL_TYPES.map((value) => (
              <label className="check-row" key={value}>
                <input
                  type="checkbox"
                  checked={filters.fuelType.includes(value)}
                  onChange={() => toggleValue("fuelType", value)}
                />{" "}
                {tEnum("fuel", value)}
                {fuelCounts.has(value) ? (
                  <span className="cnt">{formatNumber(fuelCounts.get(value)!, locale)}</span>
                ) : null}
              </label>
            ))}
          </div>,
        )}

        {group(
          "transmission",
          t("fg.transmission.title"),
          <div className="check-list" role="group" aria-label={t("fg.transmission.title")}>
            {TRANSMISSIONS.map((value) => (
              <label className="check-row" key={value}>
                <input
                  type="checkbox"
                  checked={filters.transmission.includes(value)}
                  onChange={() => toggleValue("transmission", value)}
                />{" "}
                {tEnum("transmission", value)}
              </label>
            ))}
          </div>,
        )}

        {group(
          "regional",
          t("fg.regional.title"),
          <div className="check-list" role="group" aria-label={t("fg.regional.title")}>
            {REGIONAL_SPECS.map((value) => (
              <label className="check-row" key={value}>
                <input
                  type="checkbox"
                  checked={filters.regionalSpec.includes(value)}
                  onChange={() => toggleValue("regionalSpec", value)}
                />{" "}
                {tEnum("spec", value)}
              </label>
            ))}
          </div>,
        )}

        {group(
          "location",
          t("fg.location.title"),
          <select
            className="f-select"
            aria-labelledby="fgroup-location-title"
            value={filters.emirateId ?? ""}
            onChange={(e) => onPatch({ emirateId: e.target.value || undefined })}
          >
            <option value="">{t("fg.location.all")}</option>
            {emirates.map((em) => (
              <option key={em.id} value={em.id}>
                {withCount(termLabel(em, locale), emirateCounts.get(em.id))}
              </option>
            ))}
          </select>,
        )}

        {group(
          "seller",
          t("fg.seller.title"),
          <div className="chips" role="group" aria-label={t("fg.seller.title")}>
            <button
              type="button"
              className={`chip${!filters.sellerType ? " active" : ""}`}
              aria-pressed={!filters.sellerType}
              onClick={() => onPatch({ sellerType: undefined })}
            >
              {t("fg.seller.all")}
            </button>
            {SELLER_TYPES.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip${filters.sellerType === s ? " active" : ""}`}
                aria-pressed={filters.sellerType === s}
                onClick={() => onPatch({ sellerType: filters.sellerType === s ? undefined : s })}
              >
                {t(`fg.seller.${s}`)}
              </button>
            ))}
          </div>,
        )}

        {/*
          Phone only — `open` can only ever be true below the breakpoint,
          because `.filters-toggle` is the sole way to set it and CSS hides it
          on desktop. Kept in normal flow rather than pinned: the phone layout
          already has a bottom-fixed stack (consent banner, assistant FAB) and
          a sticky bar here would land under it.
        */}
        {open ? (
          <div
            className="fgroup"
            style={{ display: "flex", gap: 8, alignItems: "center", borderBlockEnd: 0 }}
          >
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={onShowResults}
            >
              {t("filters.showResults", { n: formatNumber(total, locale) })}
            </button>
            <button type="button" className="clear-all" style={linkButtonStyle} onClick={onReset}>
              {t("filters.clearAll")}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
