/**
 * /bikes — bikes vertical wired to live data (P6-01). The mockup's bikes hero
 * (`.mk` layer, mk-bikes i18n ×4 + RTL) over a real vehicleType=BIKE search:
 * bike-type chips, make/price filters, URL-driven results + pagination.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { MarketplaceCard } from "@/components/marketplace/listing-card";
import {
  getMakes,
  getTaxonomyMeta,
  searchListings,
  type Card,
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
  makes: TaxonomyMake[];
  bikeTypes: TaxonomyTerm[];
  query: Record<string, string>;
}

export default function BikesPage({ items, total, page, makes, bikeTypes, query }: Props) {
  const { t } = useTranslation("mk-bikes");
  const router = useRouter();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const apply = (patch: Record<string, string | undefined>, resetPage = true) => {
    const next: Record<string, string> = { ...query };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") delete next[k];
      else next[k] = v;
    }
    if (resetPage) delete next.page;
    void router.push({ pathname: "/bikes", query: next });
  };

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-bikes" className="page">
          {/* Hero (mockup chrome) */}
          <div className="news-hero">
            <div className="container">
              <h1>{t("hero.title")}</h1>
              <p>{t("hero.sub")}</p>
            </div>
          </div>

          <div className="listings-wrap">
            <div className="container">
              {/* Bike-type chips */}
              <div className="news-tabs-bar" style={{ position: "static", marginBottom: 16 }}>
                <nav className="news-tabs">
                  <button type="button" className={`ntab${!query.bikeTypeId ? " active" : ""}`} onClick={() => apply({ bikeTypeId: undefined })}>
                    {t("hero.tabs.all")}
                  </button>
                  {bikeTypes.map((bt) => (
                    <button
                      key={bt.id}
                      type="button"
                      className={`ntab${query.bikeTypeId === bt.id ? " active" : ""}`}
                      onClick={() => apply({ bikeTypeId: bt.id })}
                    >
                      {bt.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Compact filters */}
              <div className="compact-search">
                <div className="compact-field">
                  <label htmlFor="index-filters-make">{t("filters.make")}</label>
                  <select id="index-filters-make" value={query.makeId ?? ""} onChange={(e) => apply({ makeId: e.target.value })}>
                    <option value="">{t("filters.anyMake")}</option>
                    {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="compact-field">
                  <label htmlFor="index-filters-price">{t("filters.price")}</label>
                  <select id="index-filters-price"
                    value={`${query.priceMin ?? ""}_${query.priceMax ?? ""}`}
                    onChange={(e) => {
                      const [min, max] = e.target.value.split("_");
                      apply({ priceMin: min || undefined, priceMax: max || undefined });
                    }}
                  >
                    <option value="_">{t("filters.anyPrice")}</option>
                    <option value="_20000">{t("filters.priceUnder20")}</option>
                    <option value="20000_50000">{t("filters.price2050")}</option>
                    <option value="50000_100000">{t("filters.price50100")}</option>
                    <option value="100000_">{t("filters.price100plus")}</option>
                  </select>
                </div>
                <div className="compact-field">
                  <label htmlFor="index-results-sortLabel">{t("results.sortLabel", { defaultValue: "Sort" })}</label>
                  <select id="index-results-sortLabel" value={query.sort ?? "newest"} onChange={(e) => apply({ sort: e.target.value }, false)}>
                    <option value="newest">{t("sort.newest", { defaultValue: "Newest" })}</option>
                    <option value="price_asc">{t("sort.priceAsc", { defaultValue: "Price: low to high" })}</option>
                    <option value="price_desc">{t("sort.priceDesc", { defaultValue: "Price: high to low" })}</option>
                    <option value="mileage_asc">{t("sort.mileageAsc", { defaultValue: "Mileage: lowest" })}</option>
                  </select>
                </div>
              </div>

              <p className="results-meta" style={{ margin: "10px 0 16px" }}>
                {t("results.count", { count: total, defaultValue: `${total.toLocaleString()} bikes for sale` })}
              </p>

              {/* Results */}
              {items.length === 0 ? (
                <p style={{ padding: "48px 0", textAlign: "center", color: "var(--text-3)" }}>
                  {t("results.empty", { defaultValue: "No bikes match your filters." })}
                </p>
              ) : (
                <div className="cards">
                  {items.map((car) => <MarketplaceCard key={car.id} car={car} hrefBase="/bikes" />)}
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="pagination" style={{ marginTop: 18 }}>
                  <button type="button" className={page <= 1 ? "disabled" : ""} disabled={page <= 1} onClick={() => apply({ page: String(page - 1) }, false)}>‹</button>
                  {Array.from({ length: Math.min(6, pages) }, (_, i) => i + 1).map((p) => (
                    <button key={p} type="button" className={p === page ? "active" : ""} onClick={() => apply({ page: String(p) }, false)}>{p}</button>
                  ))}
                  <button type="button" className={page >= pages ? "disabled" : ""} disabled={page >= pages} onClick={() => apply({ page: String(page + 1) }, false)}>›</button>
                </div>
              )}

              <p style={{ marginTop: 24, fontSize: 13 }}>
                <Link href="/sell" style={{ color: "var(--brand)" }}>{t("cta.sell", { defaultValue: "Selling a bike? List it free →" })}</Link>
              </p>
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, query }) => {
  const q = query as Record<string, string>;
  const page = Math.max(1, Number(q.page) || 1);
  const [res, makes, meta] = await Promise.all([
    searchListings({
      vehicleType: "BIKE",
      makeId: q.makeId,
      bikeTypeId: q.bikeTypeId,
      priceMin: q.priceMin ? Number(q.priceMin) : undefined,
      priceMax: q.priceMax ? Number(q.priceMax) : undefined,
      sort: (q.sort as SearchSort) || undefined,
      page,
      limit: PAGE_SIZE,
    }).catch(() => ({ items: [], total: 0, hasMore: false })),
    getMakes("BIKE").catch(() => []),
    getTaxonomyMeta().catch(() => ({ bodyTypes: [], bikeTypes: [], emirates: [], specGroups: [] })),
  ]);
  return {
    props: {
      items: res.items,
      total: res.total,
      page,
      makes,
      bikeTypes: meta.bikeTypes,
      query: Object.fromEntries(Object.entries(q).filter(([, v]) => typeof v === "string")) as Record<string, string>,
      ...(await serverSideTranslations(locale ?? nextI18NextConfig.i18n.defaultLocale, ["common", "mk-bikes"], nextI18NextConfig)),
    },
  };
};
