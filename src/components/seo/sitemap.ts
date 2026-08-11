/**
 * Sitemap XML builders + upstream paging math — task P1-12.
 *
 * Consumed by the API-route-style pages /sitemap.xml (index) and
 * /sitemaps/[sheet] (listings-N.xml / landing.xml / static.xml). Every <url>
 * entry carries the full xhtml:link alternate cluster for the four locales +
 * x-default (§13.1).
 *
 * Listings paging reality check (documented deviations from the nominal 5000
 * URLs/page "newest" walk in the task spec):
 *
 *  1. SORT — `sort=newest` is KEYSET-paged by the backend and silently
 *     ignores `page` (verified live: 46 offset "pages" all returned the
 *     identical first 50 items). The walk therefore uses `year_desc`, the
 *     offset-paged sort closest to recency (verified live: repeat calls are
 *     identical, adjacent pages are disjoint).
 *  2. SIZE — the public search API caps `limit` at 50 per call and `page` at
 *     200, and is throttled at 60 req/min. A 5000-URL sheet would need 100
 *     upstream calls — over the throttle budget — so SITEMAP_PAGE_SIZE is
 *     1000: one sheet build is 21 calls (head + 20 pages), leaving ~2/3 of
 *     the budget for concurrent SSR traffic. A crawler fetching several
 *     sheets inside one minute still degrades the later ones to partial
 *     sheets with a short TTL (they self-heal; production CDN caching
 *     absorbs repeat hits).
 *
 * The `page` cap bounds the crawlable window to the 10,000 highest-year
 * listings.
 * TODO(P1-12 BE follow-up): expose a bulk slug feed (one call per 5000) on the
 * backend, then restore SITEMAP_PAGE_SIZE = 5000, walk true recency and drop
 * the window cap.
 */
import { hreflangAlternates } from "@/components/seo/site-url";

/** URLs per listings sitemap sheet (see paging note above). */
export const SITEMAP_PAGE_SIZE = 1000;
/** Search API hard caps (Backend search.service.ts). */
export const SEARCH_API_MAX_LIMIT = 50;
export const SEARCH_API_MAX_PAGE = 200;
/** Deepest listing reachable through offset paging: 200 pages x 50. */
export const SITEMAP_REACHABLE_LISTINGS =
  SEARCH_API_MAX_PAGE * SEARCH_API_MAX_LIMIT;

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface SitemapUrl {
  /** Un-localized site-relative path, e.g. "/cars/toyota-camry-…". */
  path: string;
  /** ISO date string, optional. */
  lastmod?: string;
}

/** One <url> entry with the 4-locale + x-default alternate cluster. */
function urlEntry(url: SitemapUrl): string {
  const alternates = hreflangAlternates(url.path)
    .map(
      (alt) =>
        `<xhtml:link rel="alternate" hreflang="${xmlEscape(alt.hrefLang)}" href="${xmlEscape(alt.href)}"/>`,
    )
    .join("");
  const loc = hreflangAlternates(url.path)[0]; // en/default entry
  const lastmod = url.lastmod
    ? `<lastmod>${xmlEscape(url.lastmod.slice(0, 10))}</lastmod>`
    : "";
  return `<url><loc>${xmlEscape(loc.href)}</loc>${lastmod}${alternates}</url>`;
}

/** A complete <urlset> document. */
export function urlsetXml(urls: SitemapUrl[]): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">` +
    urls.map(urlEntry).join("") +
    `</urlset>`
  );
}

/** A complete <sitemapindex> document (absolute sitemap URLs). */
export function sitemapIndexXml(
  sitemaps: { loc: string; lastmod?: string }[],
): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    sitemaps
      .map(
        (s) =>
          `<sitemap><loc>${xmlEscape(s.loc)}</loc>${
            s.lastmod
              ? `<lastmod>${xmlEscape(s.lastmod.slice(0, 10))}</lastmod>`
              : ""
          }</sitemap>`,
      )
      .join("") +
    `</sitemapindex>`
  );
}

/**
 * Cache headers per task spec (s-maxage 3600). `degraded` selects a short TTL
 * so a partially-built sheet (upstream hiccup mid-walk) heals quickly instead
 * of being cached for an hour.
 */
export function sitemapCacheHeader(degraded = false): string {
  return degraded
    ? "public, s-maxage=300, stale-while-revalidate=3600"
    : "public, s-maxage=3600, stale-while-revalidate=86400";
}

/** Number of listings sitemap sheets for a given search total. */
export function listingsSheetCount(total: number): number {
  const reachable = Math.min(total, SITEMAP_REACHABLE_LISTINGS);
  return Math.max(1, Math.ceil(reachable / SITEMAP_PAGE_SIZE));
}
