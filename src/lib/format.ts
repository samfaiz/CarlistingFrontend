/**
 * Locale-aware display formatters (shared marketplace foundation).
 *
 * PRD FR-I5: prices and figures always render with Western (Latin) digits in
 * every locale — enforced via the `-u-nu-latn` Unicode extension so grouping
 * separators still localize (e.g. fr "149 000") while digits stay 0-9.
 */

/** Force Latin digits regardless of the locale's default numbering system. */
function latn(locale: string): string {
  return `${locale}-u-nu-latn`;
}

/**
 * "AED 149,000" — whole dirhams, Western digits in all locales (FR-I5).
 * The currency label is the ISO code (AED) on the start side in LTR and RTL.
 */
export function formatPrice(aed: number, locale: string = "en"): string {
  const digits = new Intl.NumberFormat(latn(locale), {
    maximumFractionDigits: 0,
  }).format(aed);
  return `AED ${digits}`;
}

/** "21,000 km" — localized unit label, Western digits (FR-I5). */
export function formatMileage(km: number, locale: string = "en"): string {
  return new Intl.NumberFormat(latn(locale), {
    style: "unit",
    unit: "kilometer",
    unitDisplay: "short",
    maximumFractionDigits: 0,
  }).format(km);
}

const RELATIVE_STEPS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 31536000 },
  { unit: "month", seconds: 2592000 },
  { unit: "week", seconds: 604800 },
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
];

/**
 * "3 days ago" / "il y a 3 jours" / "قبل 3 أيام" — localized via
 * Intl.RelativeTimeFormat (numeric: "auto" gives "yesterday"-style phrasing).
 * Anything under a minute renders as "now" in the locale's own words.
 */
export function formatRelativeTime(
  date: string | number | Date,
  locale: string = "en",
): string {
  const then = date instanceof Date ? date : new Date(date);
  const rtf = new Intl.RelativeTimeFormat(latn(locale), { numeric: "auto" });
  const deltaSeconds = (then.getTime() - Date.now()) / 1000;
  const magnitude = Math.abs(deltaSeconds);

  for (const { unit, seconds } of RELATIVE_STEPS) {
    if (magnitude >= seconds) {
      return rtf.format(Math.trunc(deltaSeconds / seconds), unit);
    }
  }
  // < 1 minute — "in 0 seconds" reads badly; "now" via numeric:auto second 0.
  return rtf.format(0, "second");
}

/**
 * Join a media variant key (e.g. `media/card/<id>/<file>.webp`) onto
 * NEXT_PUBLIC_MEDIA_BASE. Returns the public image URL.
 */
export function mediaUrl(variantKey: string): string {
  const base = (
    process.env.NEXT_PUBLIC_MEDIA_BASE ?? "http://localhost:9100/carsens-media"
  ).replace(/\/+$/, "");
  return `${base}/${variantKey.replace(/^\/+/, "")}`;
}
