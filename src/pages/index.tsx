/**
 * Home page — task P1-08 (full replacement of the P0 scaffold page).
 *
 * Hero (headline + keyword search → /cars?q= + body-type quick chips),
 * "Newly listed" rail, logo-less "Browse by make" grid (top makes come from
 * the facets of an empty search) and the sell-your-car CTA panel.
 *
 * Data strategy: translations render statically (getStaticProps); the dynamic
 * sections hydrate from exactly two client requests — one
 * /search/listings?limit=8&facets=true call feeds BOTH the rail and the make
 * grid, one /taxonomy/meta call feeds the hero chips (rate-limit friendly,
 * and the build never depends on a running backend).
 */
import * as React from "react";
import Head from "next/head";
import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { BrowseByMake } from "@/components/home/browse-by-make";
import { HomeHero } from "@/components/home/home-hero";
import { NewlyListedSection } from "@/components/home/newly-listed-section";
import { SellCta } from "@/components/home/sell-cta";
import { SiteHeader } from "@/components/home/site-header";
import {
  getTaxonomyMeta,
  searchListings,
  type Card,
  type FacetCount,
  type TaxonomyTerm,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../next-i18next.config.js";

interface HomeData {
  items: Card[];
  makes: FacetCount[];
}

export default function HomePage() {
  const { t } = useTranslation("home");

  const [data, setData] = React.useState<HomeData | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [bodyTypes, setBodyTypes] = React.useState<TaxonomyTerm[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    searchListings({ limit: 8, sort: "newest", facets: true })
      .then((res) => {
        if (cancelled) return;
        setData({ items: res.items, makes: res.facets?.makes ?? [] });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    getTaxonomyMeta()
      .then((meta) => {
        if (!cancelled) setBodyTypes(meta.bodyTypes);
      })
      .catch(() => {
        // Chips simply stay hidden — the hero search still works.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Head>
        <title>{t("seo.title")}</title>
        <meta name="description" content={t("seo.description")} />
      </Head>

      <SiteHeader />

      <main>
        <HomeHero bodyTypes={bodyTypes} />
        <NewlyListedSection
          items={data?.items ?? []}
          loading={!data && !failed}
          failed={failed}
        />
        <BrowseByMake makes={data?.makes ?? []} />
        <SellCta />
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "home", "listings"],
      nextI18NextConfig,
    )),
  },
});
