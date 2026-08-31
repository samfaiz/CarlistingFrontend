/**
 * Search page filter state — task P1-05 (FR-S6 URL-driven state).
 *
 * Single source of truth for the /cars search page: every filter maps 1:1 to
 * a URL query param (same names as the backend API), so back/forward, reload
 * and shared links all reproduce the exact search. `parseSearchQuery` and
 * `serializeSearchQuery` are inverses; `canonicalKey` gives a stable string
 * identity used to decide whether a client-side refetch is needed.
 */
import type { ParsedUrlQuery } from "querystring";
import type { SearchListingsParams, SearchSort } from "@/lib/marketplace-api";

/**
 * Results per page. /cars paginates by offset for every sort, so this is also
 * the divisor its pagination math uses — one home for the number instead of a
 * page-local copy that could drift from what the API was asked for.
 */
export const PAGE_SIZE = 12;

export const FUEL_TYPES = [
  "PETROL",
  "DIESEL",
  "HYBRID",
  "ELECTRIC",
  "PLUGIN_HYBRID",
] as const;

export const TRANSMISSIONS = [
  "AUTOMATIC",
  "MANUAL",
  "CVT",
  "SEMI_AUTOMATIC",
] as const;

export const REGIONAL_SPECS = [
  "GCC",
  "AMERICAN",
  "EUROPEAN",
  "JAPANESE",
  "CANADIAN",
  "KOREAN",
  "CHINESE",
  "OTHER",
] as const;

export const SELLER_TYPES = ["PRIVATE", "DEALER"] as const;

/** Prisma VehicleCondition. Single-select: a car is one or the other. */
export const CONDITIONS = ["USED", "NEW"] as const;

export const SORT_OPTIONS = [
  "newest",
  "price_asc",
  "price_desc",
  "mileage_asc",
  "mileage_desc",
  "year_desc",
  "year_asc",
] as const satisfies readonly SearchSort[];

export interface SearchFilters {
  makeId?: string;
  modelId?: string;
  trimId?: string;
  bodyTypeId?: string;
  emirateId?: string;
  sellerType?: string;
  condition?: string;
  /**
   * Dealer stock scoping (FR-DP8). Carried through the URL so a link from a
   * dealer profile keeps its scope, but deliberately given no control on /cars
   * and excluded from the active-filter count — picking a dealership is a
   * different feature with a different data source.
   */
  dealerId?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMax?: number;
  fuelType: string[];
  transmission: string[];
  regionalSpec: string[];
  q?: string;
}

export interface SearchPageState {
  filters: SearchFilters;
  sort: SearchSort;
  /**
   * 1-based offset page, serialized for every sort so the URL reports what the
   * user asked for. NOTE: the backend applies OFFSET only for non-"newest"
   * sorts — `newest` is keyset-paged and ignores `page` (search.service.ts:34).
   * /cars has always sent it regardless; the control is a no-op on the default
   * sort until the cursor is plumbed through. Not this feature's fix.
   */
  page: number;
}

export function emptyFilters(): SearchFilters {
  return { fuelType: [], transmission: [], regionalSpec: [] };
}

/* ------------------------------------------------------------------ */
/* Parsing helpers                                                    */
/* ------------------------------------------------------------------ */

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function id(v: string | string[] | undefined): string | undefined {
  const s = first(v)?.trim();
  return s ? s : undefined;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = first(v);
  if (!s) return undefined;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function oneOf<T extends string>(
  v: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const s = first(v);
  return s && (allowed as readonly string[]).includes(s) ? (s as T) : undefined;
}

/** CSV param -> validated array (unknown values are dropped, order normalized). */
function csv(
  v: string | string[] | undefined,
  allowed: readonly string[],
): string[] {
  const s = first(v);
  if (!s) return [];
  const selected = new Set(s.split(",").map((x) => x.trim()).filter(Boolean));
  return allowed.filter((a) => selected.has(a));
}

export function parseSearchQuery(query: ParsedUrlQuery): SearchPageState {
  const sort: SearchSort = oneOf(query.sort, SORT_OPTIONS) ?? "newest";
  return {
    filters: {
      makeId: id(query.makeId),
      modelId: id(query.modelId),
      trimId: id(query.trimId),
      bodyTypeId: id(query.bodyTypeId),
      emirateId: id(query.emirateId),
      sellerType: oneOf(query.sellerType, SELLER_TYPES),
      condition: oneOf(query.condition, CONDITIONS),
      dealerId: id(query.dealerId),
      priceMin: num(query.priceMin),
      priceMax: num(query.priceMax),
      yearMin: num(query.yearMin),
      yearMax: num(query.yearMax),
      mileageMax: num(query.mileageMax),
      fuelType: csv(query.fuelType, FUEL_TYPES),
      transmission: csv(query.transmission, TRANSMISSIONS),
      regionalSpec: csv(query.regionalSpec, REGIONAL_SPECS),
      q: (first(query.q) ?? "").trim() || undefined,
    },
    sort,
    page: Math.max(1, num(query.page) ?? 1),
  };
}

/* ------------------------------------------------------------------ */
/* Serialization                                                      */
/* ------------------------------------------------------------------ */

/** Fixed key order so JSON.stringify of the result is a stable identity. */
export function serializeSearchQuery(state: SearchPageState): Record<string, string> {
  const q: Record<string, string> = {};
  const f = state.filters;
  if (f.q) q.q = f.q;
  if (f.makeId) q.makeId = f.makeId;
  if (f.modelId) q.modelId = f.modelId;
  if (f.trimId) q.trimId = f.trimId;
  if (f.bodyTypeId) q.bodyTypeId = f.bodyTypeId;
  if (f.priceMin !== undefined) q.priceMin = String(f.priceMin);
  if (f.priceMax !== undefined) q.priceMax = String(f.priceMax);
  if (f.yearMin !== undefined) q.yearMin = String(f.yearMin);
  if (f.yearMax !== undefined) q.yearMax = String(f.yearMax);
  if (f.mileageMax !== undefined) q.mileageMax = String(f.mileageMax);
  if (f.fuelType.length > 0) q.fuelType = f.fuelType.join(",");
  if (f.transmission.length > 0) q.transmission = f.transmission.join(",");
  if (f.regionalSpec.length > 0) q.regionalSpec = f.regionalSpec.join(",");
  if (f.emirateId) q.emirateId = f.emirateId;
  if (f.sellerType) q.sellerType = f.sellerType;
  if (f.condition) q.condition = f.condition;
  if (f.dealerId) q.dealerId = f.dealerId;
  if (state.sort !== "newest") q.sort = state.sort;
  if (state.page > 1) q.page = String(state.page);
  return q;
}

/** Stable identity of a search (used to skip redundant refetches). */
export function canonicalKey(state: SearchPageState): string {
  return JSON.stringify(serializeSearchQuery(state));
}

/** Map page state to GET /search/listings params (always CAR, always facets). */
export function toApiParams(
  state: SearchPageState,
  pageSize: number = PAGE_SIZE,
): SearchListingsParams {
  const f = state.filters;
  return {
    vehicleType: "CAR",
    makeId: f.makeId,
    modelId: f.modelId,
    trimId: f.trimId,
    bodyTypeId: f.bodyTypeId,
    emirateId: f.emirateId,
    sellerType: f.sellerType,
    condition: f.condition,
    dealerId: f.dealerId,
    priceMin: f.priceMin,
    priceMax: f.priceMax,
    yearMin: f.yearMin,
    yearMax: f.yearMax,
    mileageMax: f.mileageMax,
    fuelType: f.fuelType.length > 0 ? f.fuelType : undefined,
    transmission: f.transmission.length > 0 ? f.transmission : undefined,
    regionalSpec: f.regionalSpec.length > 0 ? f.regionalSpec : undefined,
    q: f.q,
    sort: state.sort,
    page: state.page > 1 ? state.page : undefined,
    limit: pageSize,
    facets: true,
  };
}

/** Applied-filter count for the mobile "Filters" button badge. */
export function countActiveFilters(f: SearchFilters): number {
  let n = 0;
  if (f.makeId) n++;
  if (f.modelId) n++;
  if (f.trimId) n++;
  if (f.bodyTypeId) n++;
  if (f.emirateId) n++;
  if (f.sellerType) n++;
  if (f.condition) n++;
  if (f.q) n++;
  if (f.priceMin !== undefined || f.priceMax !== undefined) n++;
  if (f.yearMin !== undefined || f.yearMax !== undefined) n++;
  if (f.mileageMax !== undefined) n++;
  n += f.fuelType.length + f.transmission.length + f.regionalSpec.length;
  return n;
}

/* ------------------------------------------------------------------ */
/* Display helpers (local to the search surface)                      */
/* ------------------------------------------------------------------ */

/** Grouped integer with Western digits in every locale (PRD FR-I5). */
export function formatNumber(n: number, locale: string = "en"): string {
  return new Intl.NumberFormat(`${locale}-u-nu-latn`, {
    maximumFractionDigits: 0,
  }).format(n);
}

/** Localized taxonomy term label with a safe fallback to the base name. */
export function termLabel(
  term: { name: string; i18n: Record<string, string> | null },
  locale: string,
): string {
  return term.i18n?.[locale] ?? term.name;
}
