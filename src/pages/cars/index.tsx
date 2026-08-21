/**
 * /cars — search. The mockup's page-search design (`.mk` layer), wired to the
 * real search API: SSR results + facet counts, URL-driven filters, sort and
 * pagination. Copy stays in the mk-search i18n namespace (EN/AR/ES/FR + RTL).
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
import {
  getMakes,
  getTaxonomyMeta,
  searchListings,
  type Card,
  type FacetCount,
  type SearchSort,
  type TaxonomyMake,
  type TaxonomyTerm,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 12;

interface Props {
  items: Card[];
  total: number;
  page: number;
  facets: { makes: FacetCount[]; bodyTypes: FacetCount[]; emirates: FacetCount[] };
  makes: TaxonomyMake[];
  bodyTypes: TaxonomyTerm[];
  emirates: TaxonomyTerm[];
  query: Record<string, string>;
}

const SORTS = ["newest", "price_asc", "price_desc", "mileage_asc", "year_desc"] as const;
const PRICE_BANDS: [string, string, string][] = [
  ["", "", "any"], ["", "30000", "u30"], ["30000", "60000", "30_60"],
  ["60000", "120000", "60_120"], ["120000", "250000", "120_250"], ["250000", "", "250p"],
];

export default function MksearchPage({
  items, total, page, facets, makes, bodyTypes, emirates, query,
}: Props) {
  const { t } = useTranslation("mk-search");
  const router = useRouter();
  const [kw, setKw] = React.useState(query.q ?? "");

  // Push a new query — SSR re-runs and the URL is shareable/bookmarkable.
  const apply = (patch: Record<string, string | undefined>, resetPage = true) => {
    const next: Record<string, string> = { ...query };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") delete next[k];
      else next[k] = v;
    }
    if (resetPage) delete next.page;
    void router.push({ pathname: "/cars", query: next });
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
                <button className="save-search-btn" type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                  {t("title.saveSearch")}
                </button>
              </div>

              {/* COMPACT SEARCH */}
              <div className="compact-search">
                <div className="compact-field">
                  <label htmlFor="index-compact-makeLabel">{t("compact.makeLabel")}</label>
                  <select id="index-compact-makeLabel" value={query.makeId ?? ""} onChange={(e) => apply({ makeId: e.target.value, modelId: undefined })}>
                    <option value="">{t("compact.makeOpt0")}</option>
                    {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="compact-field">
                  <label htmlFor="index-compact-priceLabel">{t("compact.priceLabel")}</label>
                  <select id="index-compact-priceLabel"
                    value={`${query.priceMin ?? ""}_${query.priceMax ?? ""}`}
                    onChange={(e) => {
                      const [min, max] = e.target.value.split("_");
                      apply({ priceMin: min || undefined, priceMax: max || undefined });
                    }}
                  >
                    {PRICE_BANDS.map(([min, max, key]) => (
                      <option key={key} value={`${min}_${max}`}>{t(`compact.price.${key}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="compact-field">
                  <label htmlFor="index-compact-yearLabel">{t("compact.yearLabel")}</label>
                  <select id="index-compact-yearLabel" value={query.yearMin ?? ""} onChange={(e) => apply({ yearMin: e.target.value })}>
                    <option value="">{t("compact.yearOpt0")}</option>
                    {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => <option key={y} value={y}>{y}+</option>)}
                  </select>
                </div>
                <div className="compact-field">
                  <label htmlFor="index-compact-emirateLabel">{t("compact.emirateLabel")}</label>
                  <select id="index-compact-emirateLabel" value={query.emirateId ?? ""} onChange={(e) => apply({ emirateId: e.target.value })}>
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
                {/* FILTERS */}
                <aside className="filters-card">
                  <div className="filters-head">
                    <h3>{t("filters.title")}</h3>
                    <button className="reset" type="button" onClick={() => router.push("/cars")}>{t("filters.reset")}</button>
                  </div>
                  <div className="filters-body">
                    <div className="fgroup">
                      <h4>{t("fg.keyword.title")}</h4>
                      <div className="fbody">
                        <input
                          className="f-input"
                          placeholder={t("fg.keyword.placeholder")}
                          value={kw}
                          onChange={(e) => setKw(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") apply({ q: kw || undefined }); }}
                        />
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("fg.body.title")}</h4>
                      <div className="fbody">
                        <div className="chips">
                          <span className={`chip${!query.bodyTypeId ? " active" : ""}`} onClick={() => apply({ bodyTypeId: undefined })}>{t("fg.body.all")}</span>
                          {bodyTypes.map((bt) => (
                            <span key={bt.id} className={`chip${query.bodyTypeId === bt.id ? " active" : ""}`} onClick={() => apply({ bodyTypeId: bt.id })}>{bt.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("fg.make.title")}</h4>
                      <div className="fbody">
                        <div className="check-list">
                          {(facets.makes.length ? facets.makes : makes.map((m) => ({ id: m.id, name: m.name, count: 0 }))).slice(0, 9).map((mk) => (
                            <label className="check-row" key={mk.id}>
                              <input type="checkbox" checked={query.makeId === mk.id} onChange={(e) => apply({ makeId: e.target.checked ? mk.id : undefined })} />
                              {" "}{mk.name} <span className="cnt">{mk.count.toLocaleString()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("fg.price.title")}</h4>
                      <div className="fbody">
                        <div className="range-row">
                          <input className="f-input" placeholder={t("fg.price.min")} defaultValue={query.priceMin ?? ""} onBlur={(e) => apply({ priceMin: e.target.value || undefined })} />
                          <span>–</span>
                          <input className="f-input" placeholder={t("fg.price.max")} defaultValue={query.priceMax ?? ""} onBlur={(e) => apply({ priceMax: e.target.value || undefined })} />
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* RESULTS */}
                <div className="results">
                  <div className="result-head">
                    <div className="result-count"><strong>{total.toLocaleString()}</strong> {t("results.match")}</div>
                    <div className="result-tools">
                      <span className="sort-label">{t("results.sortBy")}</span>
                      <select className="sort-select" value={query.sort ?? "newest"} onChange={(e) => apply({ sort: e.target.value }, false)}>
                        {SORTS.map((s) => <option key={s} value={s}>{t(`results.sort.${s}`)}</option>)}
                      </select>
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <p className="results-empty" style={{ padding: "48px 0", textAlign: "center", color: "var(--text-3)" }}>{t("results.empty")}</p>
                  ) : (
                    <div className="result-grid">
                      {items.map((car) => <MarketplaceCard key={car.id} car={car} />)}
                    </div>
                  )}

                  {pages > 1 && (
                    <div className="pagination">
                      <button type="button" disabled={page <= 1} onClick={() => apply({ page: String(page - 1) }, false)}>‹</button>
                      {Array.from({ length: Math.min(pages, 6) }, (_, i) => i + 1).map((n) => (
                        <button key={n} type="button" className={n === page ? "active" : ""} onClick={() => apply({ page: String(n) }, false)}>{n}</button>
                      ))}
                      <button type="button" disabled={page >= pages} onClick={() => apply({ page: String(page + 1) }, false)}>›</button>
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

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, query }) => {
  const q = query as Record<string, string>;
  const page = Math.max(1, Number(q.page) || 1);

  // Taxonomy first (Redis-cached, fast) so human-readable deep-links from the
  // home page — ?make=toyota, ?bodyType=suv — resolve to the ids the search
  // filters actually use. Without this those shortcut links silently no-op.
  const [meta, makes] = await Promise.all([
    getTaxonomyMeta().catch(() => ({ bodyTypes: [], bikeTypes: [], emirates: [], specGroups: [] })),
    getMakes("CAR").catch(() => []),
  ]);
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const makeId =
    q.makeId ??
    (q.make ? makes.find((m) => m.slug === norm(q.make) || norm(m.name) === norm(q.make))?.id : undefined);
  const bodyTypeId =
    q.bodyTypeId ??
    (q.bodyType ? meta.bodyTypes.find((b) => b.slug === norm(q.bodyType) || norm(b.name) === norm(q.bodyType))?.id : undefined);

  const params = {
    q: q.q, makeId, modelId: q.modelId, bodyTypeId,
    emirateId: q.emirateId,
    priceMin: q.priceMin ? Number(q.priceMin) : undefined,
    priceMax: q.priceMax ? Number(q.priceMax) : undefined,
    yearMin: q.yearMin ? Number(q.yearMin) : undefined,
    sort: (q.sort as SearchSort) || undefined,
    page, limit: PAGE_SIZE, facets: true,
  };

  const res = await searchListings(params).catch(() => ({ items: [], total: 0, hasMore: false, facets: undefined }));

  return {
    props: {
      items: res.items,
      total: res.total,
      page,
      facets: {
        makes: res.facets?.makes ?? [],
        bodyTypes: res.facets?.bodyTypes ?? [],
        emirates: res.facets?.emirates ?? [],
      },
      makes,
      bodyTypes: meta.bodyTypes,
      emirates: meta.emirates,
      // Reflect resolved ids back to the UI so the matching facet shows selected.
      query: {
        ...(Object.fromEntries(Object.entries(q).filter(([, v]) => typeof v === "string")) as Record<string, string>),
        ...(makeId ? { makeId } : {}),
        ...(bodyTypeId ? { bodyTypeId } : {}),
      },
      ...(await serverSideTranslations(
        locale ?? nextI18NextConfig.i18n.defaultLocale,
        ["common", "mk-search", "mk-assistant"],
        nextI18NextConfig,
      )),
    },
  };
};
