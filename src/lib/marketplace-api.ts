/**
 * Typed marketplace API layer over the base fetch helper (src/lib/api.ts).
 *
 * Shared foundation for the search page (P1-05), listing detail (P1-07),
 * home rails (P1-08) and the sell wizard (P1-02). All response shapes were
 * verified against the live backend (GET /search/listings, /listings/:slug,
 * /taxonomy/*).
 *
 * NOTE — rate limits: /search/listings is 60 req/min. Debounce any
 * filter-driven calls (300 ms+) in the consuming UI.
 */
import { apiGet, apiPost } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface MediaVariants {
  thumb: string;
  card: string;
  detail: string;
}

/** Media as returned on search cards (cover only, may be empty for bulk-seeded rows). */
export interface CardMedia {
  s3Key: string;
  variants: MediaVariants;
}

/** Full media row on the listing detail. */
export interface ListingMedia extends CardMedia {
  sortOrder: number;
  isCover: boolean;
  scanStatus: string;
  width: number | null;
  height: number | null;
}

/** Search result card — GET /search/listings items[]. */
export interface Card {
  id: string;
  slug: string;
  year: number;
  priceAed: number;
  isNegotiable: boolean;
  mileageKm: number;
  fuelType: string | null;
  transmission: string | null;
  regionalSpec: string | null;
  badges: string[];
  publishedAt: string | null;
  sellerType: string;
  make: { name: string; slug: string };
  model: { name: string; slug: string };
  trim: { name: string } | null;
  emirate: { name: string; slug: string };
  media: CardMedia[];
  _count: { media: number };
}

export interface SpecField {
  key: string;
  name: string;
  i18n: Record<string, string> | null;
  unit: string | null;
  value: string;
  source: string;
  confidence: string;
}

export interface SpecGroup {
  key: string;
  name: string;
  i18n: Record<string, string> | null;
  fields: SpecField[];
}

/** Spec snapshot groups — shared by listing detail and /taxonomy/trims/:id/spec. */
export interface SpecGroups {
  trimSpecId: string;
  version: number;
  groups: SpecGroup[];
}

export interface ListingDescription {
  locale: string;
  text: string;
  source: string;
}

/** GET /listings/:slug — 404 unless LIVE (owner sees own). */
export interface ListingDetail extends Omit<Card, "media"> {
  media: ListingMedia[];
  descriptions: ListingDescription[];
  specsSnapshot: SpecGroups | null;
  bodyType: { id: string; name: string; slug: string } | null;
  viewCount: number;
  status: string;
  vehicleType: string;
  condition: string;
  exteriorColor: string | null;
  interiorColor: string | null;
  cylinders: number | null;
  vin: string | null;
  createdAt: string;
}

export interface FacetCount {
  id: string;
  name: string;
  count: number;
}

export interface Facets {
  makes: FacetCount[];
  bodyTypes: FacetCount[];
  fuelTypes: { value: string; count: number }[];
  emirates: FacetCount[];
}

export type SearchSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "mileage_asc"
  | "mileage_desc"
  | "year_desc"
  | "year_asc";

export interface SearchListingsParams {
  vehicleType?: string;
  makeId?: string;
  modelId?: string;
  trimId?: string;
  bodyTypeId?: string;
  emirateId?: string;
  sellerType?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMax?: number;
  /** CSV filters — pass an array, it is joined for you. */
  fuelType?: string[] | string;
  transmission?: string[] | string;
  regionalSpec?: string[] | string;
  q?: string;
  sort?: SearchSort;
  cursor?: string;
  page?: number;
  limit?: number;
  facets?: boolean;
}

export interface SearchListingsResponse {
  items: Card[];
  total: number;
  nextCursor?: string;
  hasMore: boolean;
  facets?: Facets;
}

/** Taxonomy shapes (GET /taxonomy/*). */
export interface TaxonomyMake {
  id: string;
  slug: string;
  name: string;
  i18n: Record<string, string> | null;
  logoKey: string | null;
  vehicleTypes: string[];
}

export interface TaxonomyModel {
  id: string;
  slug: string;
  name: string;
  i18n: Record<string, string> | null;
}

export interface TaxonomyTrim {
  id: string;
  slug: string;
  name: string;
  i18n: Record<string, string> | null;
}

export interface TaxonomyTerm {
  id: string;
  slug: string;
  name: string;
  i18n: Record<string, string> | null;
  iconKey?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface TaxonomyMeta {
  bodyTypes: TaxonomyTerm[];
  bikeTypes: TaxonomyTerm[];
  emirates: TaxonomyTerm[];
  specGroups: TaxonomyTerm[];
}

/** POST /listings body (CreateListingDto). */
export interface CreateListingInput {
  vehicleType: string;
  makeId: string;
  modelId: string;
  trimId?: string;
  year: number;
  priceAed: number;
  isNegotiable?: boolean;
  mileageKm: number;
  regionalSpec?: string;
  bodyTypeId?: string;
  fuelType?: string;
  transmission?: string;
  cylinders?: number;
  exteriorColor?: string;
  interiorColor?: string;
  emirateId: string;
  /** 20–4000 chars. */
  description?: string;
  vin?: string;
}

export interface CreatedListing {
  id: string;
  slug: string;
  status: "DRAFT";
}

export interface PresignedUpload {
  key: string;
  uploadUrl: string;
  maxBytes: number;
}

export type UploadContentType = "image/jpeg" | "image/png" | "image/webp";

/* ------------------------------------------------------------------ */
/* Query-string helper                                                */
/* ------------------------------------------------------------------ */

function toQuery(params: SearchListingsParams): string {
  const qs = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null || raw === "") continue;
    const value = Array.isArray(raw) ? raw.join(",") : String(raw);
    if (value === "") continue;
    qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* ------------------------------------------------------------------ */
/* Public (unauthenticated) endpoints                                 */
/* ------------------------------------------------------------------ */

export function searchListings(
  params: SearchListingsParams = {},
): Promise<SearchListingsResponse> {
  return apiGet<SearchListingsResponse>(`/search/listings${toQuery(params)}`);
}

export function getListing(slug: string): Promise<ListingDetail> {
  return apiGet<ListingDetail>(`/listings/${encodeURIComponent(slug)}`);
}

export function getMakes(vehicleType?: string): Promise<TaxonomyMake[]> {
  const suffix = vehicleType
    ? `?vehicleType=${encodeURIComponent(vehicleType)}`
    : "";
  return apiGet<TaxonomyMake[]>(`/taxonomy/makes${suffix}`);
}

export function getModels(makeId: string): Promise<TaxonomyModel[]> {
  return apiGet<TaxonomyModel[]>(
    `/taxonomy/makes/${encodeURIComponent(makeId)}/models`,
  );
}

export function getTrims(modelId: string): Promise<TaxonomyTrim[]> {
  return apiGet<TaxonomyTrim[]>(
    `/taxonomy/models/${encodeURIComponent(modelId)}/trims`,
  );
}

export function getTaxonomyMeta(): Promise<TaxonomyMeta> {
  return apiGet<TaxonomyMeta>("/taxonomy/meta");
}

export function getTrimSpec(
  trimId: string,
  year: number,
  regionalSpec: string,
): Promise<SpecGroups | null> {
  return apiGet<SpecGroups | null>(
    `/taxonomy/trims/${encodeURIComponent(trimId)}/spec?year=${year}&regionalSpec=${encodeURIComponent(regionalSpec)}`,
  );
}

/* ------------------------------------------------------------------ */
/* Authenticated endpoints (Bearer session.accessToken)               */
/* ------------------------------------------------------------------ */

export function createListing(
  dto: CreateListingInput,
  accessToken: string,
): Promise<CreatedListing> {
  return apiPost<CreatedListing>("/listings", dto, { token: accessToken });
}

/**
 * Step 1 of the upload flow: get a presigned PUT URL, then HTTP PUT the file
 * bytes to `uploadUrl` with the same Content-Type header, then attachMedia().
 */
export function presignUpload(
  contentType: UploadContentType,
  accessToken: string,
): Promise<PresignedUpload> {
  return apiPost<PresignedUpload>(
    "/media/presign",
    { contentType },
    { token: accessToken },
  );
}

export function attachMedia(
  listingId: string,
  key: string,
  accessToken: string,
): Promise<ListingMedia> {
  return apiPost<ListingMedia>(
    `/listings/${encodeURIComponent(listingId)}/media`,
    { key },
    { token: accessToken },
  );
}

/** 400 if fewer than 3 photos; 409 on quota / VIN duplicate. */
export function submitListing(
  listingId: string,
  accessToken: string,
): Promise<{ id: string; status: "PENDING_REVIEW" }> {
  return apiPost<{ id: string; status: "PENDING_REVIEW" }>(
    `/listings/${encodeURIComponent(listingId)}/submit`,
    {},
    { token: accessToken },
  );
}

export function myListings(accessToken: string): Promise<ListingDetail[]> {
  return apiGet<ListingDetail[]>("/listings/mine", { token: accessToken });
}
