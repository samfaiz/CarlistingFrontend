/**
 * SEO redirect table seam — task P1-06 item 3 (§13.1 canonical discipline).
 *
 * When taxonomy slugs are renamed or merged (e.g. two make spellings unified),
 * the old landing URL must 301 to the new one so link equity follows. This map
 * is checked FIRST in /used-cars/[[...segments]].tsx getServerSideProps and
 * served as a real 301 via the getServerSideProps `redirect` result
 * (statusCode 301 — NOT `permanent: true`, which emits a 308).
 *
 * Contract:
 *  - Keys and values are UN-localized, lower-case site-relative paths.
 *    Locale prefixes are re-applied by the redirect handler, so one entry
 *    covers all four locales.
 *  - Entries must point at a live destination (never chain two entries).
 *
 * TODO(P1-06 follow-up / P4): plan row P1-06 calls for an ADMIN-MANAGED
 * redirect table + middleware. This static map is the v1 seam; the admin CRUD
 * + Next middleware lookup replace it when the internal workspace lands.
 * Site-wide static path renames (non-taxonomy) belong in next.config.ts
 * `redirects()` instead.
 */
export const REDIRECTS: Record<string, string> = {
  // Test entry documenting the pattern (safe: "example-merged-make" can never
  // collide with a real make slug). Verifiable by hand:
  //   curl -sI http://localhost:3000/used-cars/example-merged-make   -> 301 /used-cars/toyota
  //   curl -sI http://localhost:3000/ar/used-cars/example-merged-make -> 301 /ar/used-cars/toyota
  "/used-cars/example-merged-make": "/used-cars/toyota",
};

/** Case-insensitive lookup; returns the un-localized destination path. */
export function findRedirect(path: string): string | undefined {
  return REDIRECTS[path.toLowerCase()];
}
