/**
 * Sitemap index — task P1-12 ("/sitemap.xml", API-route-style page).
 *
 * Emits a <sitemapindex> pointing at:
 *   /sitemaps/static.xml         core static routes
 *   /sitemaps/landing.xml        make/model/emirate SEO landings (P1-06)
 *   /sitemaps/vs.xml             /vs hub + curated "X vs Y" pairs (P6-03)
 *   /sitemaps/listings-{n}.xml   live listings, SITEMAP_PAGE_SIZE per sheet
 *
 * The listings sheet count comes from one cheap search call (limit 1 ->
 * total). If the backend is unreachable the index still renders with one
 * listings sheet + a short cache TTL so crawlers never see a 500.
 * Referenced from public/robots.txt.
 */
import type { GetServerSideProps } from "next";
import {
  listingsSheetCount,
  sitemapCacheHeader,
  sitemapIndexXml,
} from "@/components/seo/sitemap";
import { SITE_URL } from "@/components/seo/site-url";
import { searchListings } from "@/lib/marketplace-api";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let total: number | null = null;
  try {
    const search = await searchListings({
      vehicleType: "CAR",
      sort: "newest",
      limit: 1,
    });
    total = search.total;
  } catch {
    total = null; // degraded: assume one sheet, cache briefly
  }

  const lastmod = new Date().toISOString();
  const sheets = [
    { loc: `${SITE_URL}/sitemaps/static.xml`, lastmod },
    { loc: `${SITE_URL}/sitemaps/landing.xml`, lastmod },
    { loc: `${SITE_URL}/sitemaps/vs.xml`, lastmod },
    ...Array.from({ length: listingsSheetCount(total ?? 1) }, (_, i) => ({
      loc: `${SITE_URL}/sitemaps/listings-${i + 1}.xml`,
      lastmod,
    })),
  ];

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", sitemapCacheHeader(total === null));
  res.write(sitemapIndexXml(sheets));
  res.end();
  return { props: {} };
};

/** Never rendered — getServerSideProps writes the XML response directly. */
export default function SitemapIndex() {
  return null;
}
