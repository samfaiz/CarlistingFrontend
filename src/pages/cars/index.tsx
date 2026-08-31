/**
 * /cars — search. The mockup's page-search design (`.mk` layer), wired to the
 * real search API: SSR results + facet counts, URL-driven filters, sort and
 * pagination. Copy stays in the mk-search i18n namespace (EN/AR/ES/FR + RTL).
 *
 * Every filter the backend accepts is a URL param and nothing else, so a
 * refined search is shareable, the back button undoes exactly one step, and
 * `SaveSearchButton` can serialize the search by reading the query alone.
 * `components/search/filter-state.ts` is the only place that query is read or
 * written — parse on the server, serialize on the client, one shape both ways.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { BannerSlot } from "@/components/marketplace/banner-slot";
import { AssistantWidget } from "@/components/marketplace/assistant-widget";
import { MarketplaceCard } from "@/components/marketplace/listing-card";
import { SaveSearchButton } from "@/components/saved/save-search-button";
import { MkFilterPanel } from "@/components/search/mk-filter-panel";
import { MkActiveFilters } from "@/components/search/mk-active-filters";
import { getCarModels } from "@/components/search/taxonomy-cascade";
import {
  PAGE_SIZE,
  SORT_OPTIONS,
  countActiveFilters,
  parseSearchQuery,
  serializeSearchQuery,
  toApiParams,
  type SearchFilters,
} from "@/components/search/filter-state";
import {
  getMakes,
  getTaxonomyMeta,
  getTrims,
  searchListings,
  type Card,
  type Facets,
  type SearchSort,
  type TaxonomyMake,
  type TaxonomyModel,
  type TaxonomyTerm,
  type TaxonomyTrim,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

interface Props {
  items: Card[];
  total: number;
  page: number;
  facets: Facets;
  makes: TaxonomyMake[];
  models: TaxonomyModel[];
  trims: TaxonomyTrim[];
  bodyTypes: TaxonomyTerm[];
  emirates: TaxonomyTerm[];
  query: Record<string, string>;
}

const PRICE_BANDS: [string, string, string][] = [
  ["", "", "any"], ["", "30000", "u30"], ["30000", "60000", "30_60"],
  ["60000", "120000", "60_120"], ["120000", "250000", "120_250"], ["250000", "", "250p"],
];

export default function MksearchPage({
  items, total, page, facets, makes, models: ssrModels, trims: ssrTrims,
  bodyTypes, emirates, query,
}: Props) {
  const { t } = useTranslation("mk-search");
  const router = useRouter();

  // The URL is the state. Parsing it here means the panel, the chips and the
  // API call all read one object instead of three ad-hoc query lookups.
  const state = React.useMemo(() => parseSearchQuery(query), [query]);
  const filters = state.filters;

  /**
   * The search to remember when "Save search" is used. The URL *is* the query
   * on this page — every filter control pushes it — so the params are the
   * honest serialization. `page` is dropped: a saved search is a standing
   * interest, not a position in a result list.
   */
  const savedSearchQuery = React.useMemo(() => {
    const q = serializeSearchQuery({ ...state, page: 1 });
    delete q.page;
    return q;
  }, [state]);

  const [kw, setKw] = React.useState(filters.q ?? "");
  // Keeps the box honest when the keyword is dropped from elsewhere (its chip,
  // "Reset all", the back button).
  React.useEffect(() => setKw(filters.q ?? ""), [filters.q]);

  /*
   * On a phone the filter panel is ~700px tall and was always expanded, so the
   * first car sat about 1000px down the page — a search results page where you
   * cannot see a result. It now collapses behind a summary button that reports
   * how many filters are active, and opens on demand. Desktop is unchanged:
   * CSS keeps the panel open above the phone breakpoint.
   */
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const activeFilterCount = countActiveFilters(filters);

  /*
   * Cascade lists. SSR seeds them so a shared ?makeId=X&modelId=Y link paints
   * its selects correctly on the first byte and with JS off; the client tops
   * them up on change so the Model select is usable before the navigation
   * round-trip returns.
   */
  const [models, setModels] = React.useState<TaxonomyModel[]>(ssrModels);
  const [trims, setTrims] = React.useState<TaxonomyTrim[]>(ssrTrims);
  React.useEffect(() => setModels(ssrModels), [ssrModels]);
  React.useEffect(() => setTrims(ssrTrims), [ssrTrims]);
  // A slow response for the previous make must not repopulate the select after
  // a newer one landed — the user would pick a model the make does not have.
  const latestMakeRef = React.useRef<string | undefined>(filters.makeId);
  const latestModelRef = React.useRef<string | undefined>(filters.modelId);

  const push = (q: Record<string, string>) => {
    // scroll:false — without it every checkbox tick throws a phone user back
    // to the top of the page, above the panel they are still using.
    void router.push({ pathname: "/cars", query: q }, undefined, { scroll: false });
  };

  const scrollToResults = () => {
    document.getElementById("results")?.scrollIntoView({ block: "start" });
  };

  /** Patch the filters and re-navigate. Any filter change resets to page 1. */
  const apply = (patch: Partial<SearchFilters>) => {
    if ("makeId" in patch && patch.makeId !== filters.makeId) {
      const makeId = patch.makeId;
      latestMakeRef.current = makeId;
      setModels([]);
      setTrims([]);
      if (makeId) {
        void getCarModels(makeId)
          .then((list) => { if (latestMakeRef.current === makeId) setModels(list); })
          .catch(() => { /* SSR props will fill the select a moment later. */ });
      }
    }
    if ("modelId" in patch && patch.modelId !== filters.modelId) {
      const modelId = patch.modelId;
      latestModelRef.current = modelId;
      setTrims([]);
      if (modelId) {
        void getTrims(modelId)
          .then((list) => { if (latestModelRef.current === modelId) setTrims(list); })
          .catch(() => { /* SSR props will fill the select a moment later. */ });
      }
    }
    push(serializeSearchQuery({ filters: { ...filters, ...patch }, sort: state.sort, page: 1 }));
  };

  const applySort = (sort: SearchSort) => {
    push(serializeSearchQuery({ ...state, sort, page: 1 }));
  };

  const goToPage = (next: number) => {
    push(serializeSearchQuery({ ...state, page: next }));
    scrollToResults();
  };

  const reset = () => {
    void router.push("/cars", undefined, { scroll: false });
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Head>
        <title>{`${t("meta.title")} — Carsens`}</title>
        <meta name="description" content={t("meta.title")} />
      </Head>
      <MockupLayout>
        <main id="page-search" className="page">
          <div className="listings-wrap">
            <div className="container">
              <BannerSlot slot="SEARCH_TOP" className="banner-slot banner-search-top" />
              <div className="breadcrumb">
                <Link href="/">{t("breadcrumb.home")}</Link><span className="sep">›</span>
                <Link href="/cars">{t("breadcrumb.usedCars")}</Link><span className="sep">›</span>
                <span className="current">{t("breadcrumb.uae")}</span>
              </div>

              <div className="title-row">
                <div>
                  <h1>{t("title.heading")} <span className="count">{total.toLocaleString()}</span></h1>
                  <p className="results-meta">
                    {t("title.showing", {
                      from: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
                      to: Math.min(page * PAGE_SIZE, total),
                      total: total.toLocaleString(),
                    })}
                  </p>
                </div>
                <SaveSearchButton query={savedSearchQuery} className="save-search-btn" />
              </div>

              {/* COMPACT SEARCH — the mockup's 6-column grid: five fields and
                  the button. Model was the field it always had room for. */}
              <div className="compact-search" role="search" aria-label={t("compact.landmark")}>
                <div className="compact-field">
                  <label htmlFor="index-compact-makeLabel">{t("compact.makeLabel")}</label>
                  <select
                    id="index-compact-makeLabel"
                    value={filters.makeId ?? ""}
                    onChange={(e) =>
                      apply({ makeId: e.target.value || undefined, modelId: undefined, trimId: undefined })
                    }
                  >
                    <option value="">{t("compact.makeOpt0")}</option>
                    {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="compact-field">
                  <label htmlFor="index-compact-modelLabel">{t("compact.modelLabel")}</label>
                  <select
                    id="index-compact-modelLabel"
                    value={filters.modelId ?? ""}
                    disabled={!filters.makeId}
                    onChange={(e) => apply({ modelId: e.target.value || undefined, trimId: undefined })}
                  >
                    <option value="">{t("compact.modelOpt0")}</option>
                    {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="compact-field">
                  <label htmlFor="index-compact-priceLabel">{t("compact.priceLabel")}</label>
                  <select id="index-compact-priceLabel"
                    value={`${filters.priceMin ?? ""}_${filters.priceMax ?? ""}`}
                    onChange={(e) => {
                      const [min, max] = e.target.value.split("_");
                      apply({
                        priceMin: min ? Number(min) : undefined,
                        priceMax: max ? Number(max) : undefined,
                      });
                    }}
                  >
                    {PRICE_BANDS.map(([min, max, key]) => (
                      <option key={key} value={`${min}_${max}`}>{t(`compact.price.${key}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="compact-field">
                  <label htmlFor="index-compact-yearLabel">{t("compact.yearLabel")}</label>
                  <select id="index-compact-yearLabel" value={filters.yearMin ?? ""} onChange={(e) => apply({ yearMin: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">{t("compact.yearOpt0")}</option>
                    {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => <option key={y} value={y}>{y}+</option>)}
                  </select>
                </div>
                <div className="compact-field">
                  <label htmlFor="index-compact-emirateLabel">{t("compact.emirateLabel")}</label>
                  <select id="index-compact-emirateLabel" value={filters.emirateId ?? ""} onChange={(e) => apply({ emirateId: e.target.value || undefined })}>
                    <option value="">{t("compact.emirateOpt0")}</option>
                    {emirates.map((em) => <option key={em.id} value={em.id}>{em.name}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary btn-lg" type="button" onClick={() => apply({ q: kw || undefined })}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  {t("compact.update")}
                </button>
              </div>

              <div className="search-grid">
                <MkFilterPanel
                  filters={filters}
                  facets={facets}
                  makes={makes}
                  models={models}
                  trims={trims}
                  bodyTypes={bodyTypes}
                  emirates={emirates}
                  keyword={kw}
                  onKeywordChange={setKw}
                  total={total}
                  activeCount={activeFilterCount}
                  open={filtersOpen}
                  onToggleOpen={() => setFiltersOpen((v) => !v)}
                  onPatch={apply}
                  onReset={reset}
                  onShowResults={() => { setFiltersOpen(false); scrollToResults(); }}
                />

                {/* RESULTS */}
                <div className="results" id="results">
                  <MkActiveFilters
                    filters={filters}
                    makes={makes}
                    models={models}
                    trims={trims}
                    bodyTypes={bodyTypes}
                    emirates={emirates}
                    onPatch={apply}
                    onReset={reset}
                  />

                  <div className="result-head">
                    <div className="result-count"><strong>{total.toLocaleString()}</strong> {t("results.match")}</div>
                    <div className="result-tools">
                      {/* Was a <span>, so the select had no accessible name —
                          axe flagged it critical. */}
                      <label className="sort-label" htmlFor="sort-select">{t("results.sortBy")}</label>
                      <select id="sort-select" className="sort-select" value={state.sort} onChange={(e) => applySort(e.target.value as SearchSort)}>
                        {SORT_OPTIONS.map((s) => <option key={s} value={s}>{t(`results.sort.${s}`)}</option>)}
                      </select>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <p className="results-empty" style={{ padding: "48px 0", textAlign: "center", color: "var(--text-3)" }}>{t("results.empty")}</p>
                  ) : (
                    /* data-testid is the E2E hook for the results grid; the
                       mockup port dropped it, which broke three search specs. */
                    <div className="result-grid" data-testid="search-results">
                      {items.map((car) => <MarketplaceCard key={car.id} car={car} />)}
                    </div>
                  )}

                  {pages > 1 && (
                    <div className="pagination">
                      <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}>‹</button>
                      {Array.from({ length: Math.min(pages, 6) }, (_, i) => i + 1).map((n) => (
                        <button key={n} type="button" className={n === page ? "active" : ""} onClick={() => goToPage(n)}>{n}</button>
                      ))}
                      <button type="button" disabled={page >= pages} onClick={() => goToPage(page + 1)}>›</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <AssistantWidget />
      </MockupLayout>
    </>
  );
}

const EMPTY_FACETS: Facets = { makes: [], bodyTypes: [], fuelTypes: [], emirates: [] };

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, query }) => {
  const state = parseSearchQuery(query);

  // Taxonomy first (Redis-cached, fast) so human-readable deep-links from the
  // home page — ?make=toyota, ?bodyType=suv — resolve to the ids the search
  // filters actually use. Without this those shortcut links silently no-op.
  const [meta, makes] = await Promise.all([
    getTaxonomyMeta().catch(() => ({ bodyTypes: [], bikeTypes: [], emirates: [], specGroups: [] })),
    getMakes("CAR").catch(() => []),
  ]);
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const alias = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : undefined);
  const makeAlias = alias("make");
  const bodyAlias = alias("bodyType");
  if (!state.filters.makeId && makeAlias) {
    state.filters.makeId = makes.find(
      (m) => m.slug === norm(makeAlias) || norm(m.name) === norm(makeAlias),
    )?.id;
  }
  if (!state.filters.bodyTypeId && bodyAlias) {
    state.filters.bodyTypeId = meta.bodyTypes.find(
      (b) => b.slug === norm(bodyAlias) || norm(b.name) === norm(bodyAlias),
    )?.id;
  }

  // The cascade lists are part of the first paint: without them a shared
  // ?makeId=X&modelId=Y link renders an empty Model select showing no value.
  const [res, models, trims] = await Promise.all([
    searchListings(toApiParams(state, PAGE_SIZE)).catch(() => ({
      items: [], total: 0, hasMore: false, facets: undefined,
    })),
    state.filters.makeId ? getCarModels(state.filters.makeId).catch(() => []) : Promise.resolve([]),
    state.filters.modelId ? getTrims(state.filters.modelId).catch(() => []) : Promise.resolve([]),
  ]);

  return {
    props: {
      items: res.items,
      total: res.total,
      page: state.page,
      facets: res.facets ?? EMPTY_FACETS,
      makes,
      models,
      trims,
      bodyTypes: meta.bodyTypes,
      emirates: meta.emirates,
      /*
       * The canonical serialization, not the raw query. Reflecting the raw
       * query kept `?make=toyota` alongside the resolved `makeId`, so picking
       * BMW produced `?make=toyota&makeId=<bmw>` and a later "clear make"
       * silently fell back to Toyota.
       */
      query: serializeSearchQuery(state),
      ...(await serverSideTranslations(
        locale ?? nextI18NextConfig.i18n.defaultLocale,
        // `listings` carries the fuel/transmission/spec enum labels the filter
        // panel and the chip row read; without it they render raw keys.
        ["common", "mk-search", "mk-assistant", "listings"],
        nextI18NextConfig,
      )),
    },
  };
};
