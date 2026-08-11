/**
 * Human-readable summary of a saved search's query object — task P1-09.
 *
 * Best-effort: keyword, resolvable taxonomy ids (make / body type / emirate,
 * via the one-shot lists the page already fetches), numeric ranges and enum
 * CSVs become labeled parts; anything unresolvable (modelId/trimId or ids
 * missing from the current taxonomy) is folded into a "+N more filters"
 * suffix instead of leaking raw ids.
 */
import type { TaxonomyMake, TaxonomyMeta } from "@/lib/marketplace-api";
import { formatNumber, termLabel } from "@/components/search/filter-state";

/** Minimal t() shape — avoids coupling to a specific i18next TFunction type. */
type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface SummaryContext {
  /** "saved" namespace t(). */
  t: Translate;
  /** "listings" namespace t() (enum.* labels). */
  tListings: Translate;
  locale: string;
  makes: TaxonomyMake[];
  meta: TaxonomyMeta | null;
}

const IGNORED_KEYS = new Set(["sort", "page", "vehicleType", "limit", "facets"]);

function enumLabels(
  csv: string,
  group: "fuel" | "transmission" | "spec",
  tListings: Translate,
): string {
  return csv
    .split(",")
    .filter(Boolean)
    .map((v) => tListings(`enum.${group}.${v}`, { defaultValue: v }))
    .join(", ");
}

export function summarizeSavedSearchQuery(
  query: Record<string, string>,
  ctx: SummaryContext,
): string {
  const { t, tListings, locale, makes, meta } = ctx;
  const parts: string[] = [];
  let unresolved = 0;
  const handled = new Set<string>(IGNORED_KEYS);

  const take = (key: string): string | undefined => {
    handled.add(key);
    const value = query[key];
    return typeof value === "string" && value !== "" ? value : undefined;
  };

  const q = take("q");
  if (q) parts.push(t("searches.summary.keyword", { keyword: q }));

  const makeId = take("makeId");
  if (makeId) {
    const make = makes.find((m) => m.id === makeId);
    if (make) parts.push(termLabel(make, locale));
    else unresolved++;
  }
  const modelId = take("modelId");
  if (modelId) unresolved++;
  const trimId = take("trimId");
  if (trimId) unresolved++;

  const bodyTypeId = take("bodyTypeId");
  if (bodyTypeId) {
    const bodyType = meta?.bodyTypes.find((b) => b.id === bodyTypeId);
    if (bodyType) parts.push(termLabel(bodyType, locale));
    else unresolved++;
  }

  const emirateId = take("emirateId");
  if (emirateId) {
    const emirate = meta?.emirates.find((e) => e.id === emirateId);
    if (emirate) parts.push(termLabel(emirate, locale));
    else unresolved++;
  }

  const priceMin = take("priceMin");
  const priceMax = take("priceMax");
  if (priceMin && priceMax) {
    parts.push(
      t("searches.summary.priceRange", {
        min: formatNumber(Number(priceMin), locale),
        max: formatNumber(Number(priceMax), locale),
      }),
    );
  } else if (priceMin) {
    parts.push(
      t("searches.summary.priceFrom", {
        min: formatNumber(Number(priceMin), locale),
      }),
    );
  } else if (priceMax) {
    parts.push(
      t("searches.summary.priceUpTo", {
        max: formatNumber(Number(priceMax), locale),
      }),
    );
  }

  const yearMin = take("yearMin");
  const yearMax = take("yearMax");
  if (yearMin && yearMax) {
    parts.push(t("searches.summary.yearRange", { min: yearMin, max: yearMax }));
  } else if (yearMin) {
    parts.push(t("searches.summary.yearFrom", { min: yearMin }));
  } else if (yearMax) {
    parts.push(t("searches.summary.yearUpTo", { max: yearMax }));
  }

  const mileageMax = take("mileageMax");
  if (mileageMax) {
    parts.push(
      t("searches.summary.mileageUpTo", {
        max: formatNumber(Number(mileageMax), locale),
      }),
    );
  }

  const fuelType = take("fuelType");
  if (fuelType) parts.push(enumLabels(fuelType, "fuel", tListings));
  const transmission = take("transmission");
  if (transmission) parts.push(enumLabels(transmission, "transmission", tListings));
  const regionalSpec = take("regionalSpec");
  if (regionalSpec) parts.push(enumLabels(regionalSpec, "spec", tListings));

  const sellerType = take("sellerType");
  if (sellerType) {
    parts.push(
      t(`searches.summary.seller.${sellerType}`, { defaultValue: sellerType }),
    );
  }

  // Anything the shape above didn't recognize (future filters) counts too.
  for (const key of Object.keys(query)) {
    if (!handled.has(key) && query[key] !== "") unresolved++;
  }

  if (parts.length === 0 && unresolved === 0) {
    return t("searches.summary.allCars");
  }
  if (unresolved > 0) {
    parts.push(t("searches.summary.moreFilters", { count: unresolved }));
  }
  return parts.join(" · ");
}
