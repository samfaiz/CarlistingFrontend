/**
 * Absolute-URL helpers for SEO surfaces (canonical tags, hreflang alternates,
 * JSON-LD `url` fields, sitemaps) — tasks P1-06 / P1-12.
 *
 * All SEO URLs are built from NEXT_PUBLIC_SITE_URL (falls back to the local
 * dev origin). Locale routing follows the Next.js i18n convention configured
 * in next-i18next.config.js: the default locale (en) is unprefixed, every
 * other locale is path-prefixed (/ar, /es, /fr).
 */
import { i18n } from "../../../next-i18next.config.js";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const LOCALES: readonly string[] = i18n.locales;
export const DEFAULT_LOCALE: string = i18n.defaultLocale;

/**
 * Locale-prefix a site-relative path ("/used-cars/toyota") per the Next i18n
 * routing rules. The default locale stays unprefixed; "/" collapses cleanly
 * ("/ar" not "/ar/").
 */
export function localizedPath(path: string, locale: string): string {
  const clean = path === "/" ? "" : path;
  if (locale === DEFAULT_LOCALE) return clean === "" ? "/" : clean;
  return `/${locale}${clean}`;
}

/** Absolute URL for a site-relative path, optionally locale-prefixed. */
export function absoluteUrl(path: string, locale?: string): string {
  return `${SITE_URL}${locale ? localizedPath(path, locale) : path === "/" ? "" : path}` || SITE_URL;
}

/**
 * The hreflang alternate cluster for one un-localized path: all four locales
 * plus x-default (which points at the default-locale URL, §13.1).
 */
export function hreflangAlternates(
  path: string,
): { hrefLang: string; href: string }[] {
  return [
    ...LOCALES.map((locale) => ({
      hrefLang: locale,
      href: absoluteUrl(path, locale),
    })),
    { hrefLang: "x-default", href: absoluteUrl(path, DEFAULT_LOCALE) },
  ];
}
