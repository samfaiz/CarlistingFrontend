/**
 * Sitemap sheets — task P1-12 ("/sitemaps/*.xml", API-route-style page).
 *
 * One dynamic segment serves the three sheet families (Pages Router cannot
 * express a `listings-[n].xml` filename pattern, so the whole "listings-1.xml"
 * filename IS the dynamic segment, validated here; anything else 404s):
 *
 *   /sitemaps/static.xml       core public routes (/, /cars — the /used-cars
 *                              hub lives in landing.xml with its matrix)
 *   /sitemaps/landing.xml      P1-06 landing matrix from live taxonomy:
 *                              hub + makes + make/model combos + emirates
 *   /sitemaps/listings-N.xml   LIVE listings via the search API,
 *                              SITEMAP_PAGE_SIZE URLs per sheet
 *
 * Every URL carries the 4-locale + x-default xhtml alternate cluster. Cache:
 * s-maxage 3600 (short TTL when a sheet is partial so it self-heals).
 *
 * Listings walk: the search API caps limit=50/call, page<=200, 60 req/min —
 * sheet N maps to search pages (N-1)*20+1 .. N*20, fetched with small
 * concurrency using sort=year_desc (offset paging is a no-op for
 * sort=newest — see the deviation notes in src/components/seo/sitemap.ts,
 * plus the page-size rationale + the TODO on the future backend bulk feed).
 * An upstream failure mid-walk emits the URLs gathered so far as a valid
 * (partial) sheet; slugs are deduped since concurrent inserts can shift
 * offset boundaries mid-walk.
 */
import type { GetServerSideProps } from "next";
import {
  listingsSheetCount,
  SEARCH_API_MAX_LIMIT,
  SEARCH_API_MAX_PAGE,
  SITEMAP_PAGE_SIZE,
  sitemapCacheHeader,
  urlsetXml,
  type SitemapUrl,
} from "@/components/seo/sitemap";
import {
  getMakes,
  getModels,
  getTaxonomyMeta,
  searchListings,
} from "@/lib/marketplace-api";

const LISTINGS_SHEET_RE = /^listings-([1-9]\d*)\.xml$/;
/** Search pages per listings sheet (1000 / 50 = 20). */
const SEARCH_PAGES_PER_SHEET = SITEMAP_PAGE_SIZE / SEARCH_API_MAX_LIMIT;
const FETCH_CONCURRENCY = 5;
/**
 * Offset-paged sort for the walk. NOT "newest": the backend keyset-pages that
 * sort and ignores `page` entirely (every offset call returns the same first
 * 50 — verified live), which would fill every sheet with duplicates of page 1.
 */
const SITEMAP_WALK_SORT = "year_desc" as const;

/* ------------------------------------------------------------------ */
/* Sheet builders — each returns {urls, degraded}                     */
/* ------------------------------------------------------------------ */

function staticSheet(): { urls: SitemapUrl[]; degraded: boolean } {
  return {
    urls: [{ path: "/" }, { path: "/cars" }],
    degraded: false,
  };
}

async function landingSheet(): Promise<{ urls: SitemapUrl[]; degraded: boolean }> {
  const [makes, meta] = await Promise.all([getMakes("CAR"), getTaxonomyMeta()]);
  const urls: SitemapUrl[] = [{ path: "/used-cars" }];
  let degraded = false;

  for (const make of makes) {
    urls.push({ path: `/used-cars/${make.slug}` });
    try {
      const models = await getModels(make.id);
      for (const model of models) {
        urls.push({ path: `/used-cars/${make.slug}/${model.slug}` });
      }
    } catch {
      degraded = true; // make landing stays listed; models heal on next build
    }
  }
  for (const emirate of meta.emirates) {
    urls.push({ path: `/used-cars/emirate/${emirate.slug}` });
  }
  return { urls, degraded };
}

async function listingsSheet(
  sheetNumber: number,
): Promise<{ urls: SitemapUrl[]; degraded: boolean } | null> {
  // Bounds check needs the live total (one cheap call).
  const head = await searchListings({
    vehicleType: "CAR",
    sort: SITEMAP_WALK_SORT,
    limit: 1,
  });
  if (sheetNumber > listingsSheetCount(head.total)) return null;

  const firstPage = (sheetNumber - 1) * SEARCH_PAGES_PER_SHEET + 1;
  const lastPage = Math.min(
    sheetNumber * SEARCH_PAGES_PER_SHEET,
    SEARCH_API_MAX_PAGE,
    Math.ceil(head.total / SEARCH_API_MAX_LIMIT),
  );
  const pages: number[] = [];
  for (let p = firstPage; p <= lastPage; p++) pages.push(p);

  const results: { page: number; urls: SitemapUrl[] }[] = [];
  let degraded = false;
  let cursor = 0;

  // Small worker pool — bursts stay well under the 60 req/min search budget.
  async function worker() {
    while (cursor < pages.length && !degraded) {
      const page = pages[cursor++];
      try {
        const res = await searchListings({
          vehicleType: "CAR",
          sort: SITEMAP_WALK_SORT,
          limit: SEARCH_API_MAX_LIMIT,
          page,
          facets: false,
        });
        results.push({
          page,
          urls: res.items.map((item) => ({
            path: `/cars/${item.slug}`,
            lastmod: item.publishedAt ?? undefined,
          })),
        });
      } catch {
        // Partial sheet: stop the walk, serve what we have with a short TTL.
        degraded = true;
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(FETCH_CONCURRENCY, pages.length) }, worker),
  );

  // Dedupe on path: concurrent listing inserts/expiries can shift offset
  // boundaries between page fetches, repeating a row across two pages.
  const seen = new Set<string>();
  const urls = results
    .sort((a, b) => a.page - b.page)
    .flatMap((r) => r.urls)
    .filter((url) => {
      if (seen.has(url.path)) return false;
      seen.add(url.path);
      return true;
    });
  return { urls, degraded };
}

/* ------------------------------------------------------------------ */
/* Route                                                              */
/* ------------------------------------------------------------------ */

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const sheet = typeof params?.sheet === "string" ? params.sheet : "";

  try {
    let built: { urls: SitemapUrl[]; degraded: boolean } | null = null;

    if (sheet === "static.xml") {
      built = staticSheet();
    } else if (sheet === "landing.xml") {
      built = await landingSheet();
    } else {
      const match = LISTINGS_SHEET_RE.exec(sheet);
      if (!match) return { notFound: true };
      built = await listingsSheet(Number(match[1]));
      if (!built) return { notFound: true }; // beyond the last sheet
    }

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", sitemapCacheHeader(built.degraded));
    res.write(urlsetXml(built.urls));
    res.end();
    return { props: {} };
  } catch {
    // Backend fully unreachable: empty-but-valid sheet, short TTL, no 500s.
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.write(urlsetXml([]));
    res.end();
    return { props: {} };
  }
};

/** Never rendered — getServerSideProps writes the XML response directly. */
export default function SitemapSheet() {
  return null;
}
