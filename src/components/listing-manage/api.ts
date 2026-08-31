/**
 * Local API seam for the listing-management screens (/listings/[id]/edit and
 * /listings/[id]/photos).
 *
 * Everything here exists because of a gap in the shared client
 * (src/lib/marketplace-api.ts), which is owned elsewhere and must not be
 * edited from this workstream:
 *
 * 1. There is no `updateListing` helper, even though `PATCH /listings/:id` has
 *    existed since P1. `patchListing` below is that call.
 *
 * 2. The four media endpoints return a BARE ARRAY, not `{ items: [...] }`.
 *    Verified against the running backend on 2026-08-31:
 *      GET    /listings/:id/media                  -> ListingMediaRow[]
 *      PATCH  /listings/:id/media/order            -> ListingMediaRow[]
 *      PATCH  /listings/:id/media/:mediaId/cover   -> ListingMediaRow[]
 *      DELETE /listings/:id/media/:mediaId         -> ListingMediaRow[]
 *    `getListingMedia` & friends declare `Promise<{ items: ListingMediaRow[] }>`,
 *    so every consumer would read `undefined`. `toMediaItems` accepts both
 *    shapes, which keeps this UI correct now and after the type is fixed.
 *
 * 3. There is NO owner-scoped `GET /listings/:id`. `GET /listings/:slug` is the
 *    only single-listing read, so `loadOwnedListing` resolves by slug and falls
 *    back to a bounded dealer-inventory scan when it is handed a raw id.
 */
import { ApiError, apiGet, apiPatch } from "@/lib/api";
import {
  getDealerInventory,
  getMyDealer,
  type ListingDescription,
  type ListingMediaRow,
} from "@/lib/marketplace-api";

/* ------------------------------------------------------------------ */
/* Statuses                                                           */
/* ------------------------------------------------------------------ */

/** Backend FROZEN_STATUSES — `assertEditable` rejects edits, uploads and reorders. */
export const FROZEN_STATUSES = ["SOLD", "EXPIRED", "ARCHIVED"] as const;

/** Backend PHOTO_FLOOR_STATUSES — the photo set may not drop below MIN_PHOTOS. */
export const PHOTO_FLOOR_STATUSES = ["PENDING_REVIEW", "LIVE"] as const;

/** Statuses `submit()` accepts (backend TRANSITIONS map). */
export const SUBMITTABLE_STATUSES = ["DRAFT", "REJECTED"] as const;

export const MIN_LISTING_PHOTOS = 3;
export const MAX_LISTING_PHOTOS = 30;

export function isFrozen(status: string): boolean {
  return (FROZEN_STATUSES as readonly string[]).includes(status);
}

export function hasPhotoFloor(status: string): boolean {
  return (PHOTO_FLOOR_STATUSES as readonly string[]).includes(status);
}

export function isSubmittable(status: string): boolean {
  return (SUBMITTABLE_STATUSES as readonly string[]).includes(status);
}

/* ------------------------------------------------------------------ */
/* Enum option sets — mirrored from Backend listing.dto.ts             */
/* ------------------------------------------------------------------ */

export const CONDITIONS = ["USED", "NEW"] as const;
export const REGIONAL_SPECS = [
  "GCC",
  "AMERICAN",
  "JAPANESE",
  "EUROPEAN",
  "KOREAN",
  "CANADIAN",
  "OTHER",
] as const;
export const FUEL_TYPES = [
  "PETROL",
  "DIESEL",
  "HYBRID",
  "PLUGIN_HYBRID",
  "ELECTRIC",
  "OTHER",
] as const;
export const TRANSMISSIONS = [
  "AUTOMATIC",
  "MANUAL",
  "CVT",
  "DCT",
  "OTHER",
] as const;

/** DTO bounds, so the form can refuse locally what the server would refuse anyway. */
export const LIMITS = {
  year: { min: 1950, max: 2030 },
  priceAed: { min: 1_000, max: 50_000_000 },
  mileageKm: { min: 0, max: 2_000_000 },
  cylinders: { min: 1, max: 16 },
  colorLength: 40,
  vinLength: 20,
  description: { min: 20, max: 4000 },
} as const;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * The raw listing row as the backend returns it from `GET /listings/:slug`,
 * `GET /listings/mine` and `GET /dealers/:id/listings`. Deliberately NOT
 * `ListingDetail`: that shape drops the foreign keys (`emirateId`,
 * `bodyTypeId`, `trimId`) the edit form has to round-trip.
 */
export interface OwnedListing {
  id: string;
  slug: string;
  status: string;
  sellerType: string;
  dealerId: string | null;
  vehicleType: string;
  condition: string;
  makeId: string;
  modelId: string;
  trimId: string | null;
  year: number;
  priceAed: number;
  isNegotiable: boolean;
  mileageKm: number;
  regionalSpec: string;
  bodyTypeId: string | null;
  bikeTypeId: string | null;
  fuelType: string | null;
  transmission: string | null;
  cylinders: number | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  emirateId: string;
  vin: string | null;
  publishedAt: string | null;
  expiresAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  make?: { name: string } | null;
  model?: { name: string } | null;
  trim?: { name: string } | null;
  emirate?: { name: string } | null;
  descriptions?: ListingDescription[];
}

export interface LoadedListing {
  listing: OwnedListing;
  /**
   * False when the row came from the dealer-inventory fallback and the
   * slug read was refused, so `descriptions` is unknown rather than empty.
   * The description editor has to say so instead of showing a blank box that
   * looks like "there is no description".
   */
  descriptionsLoaded: boolean;
}

/** Fields `PATCH /listings/:id` accepts that this form offers. */
export interface ListingEditPatch {
  year?: number;
  priceAed?: number;
  isNegotiable?: boolean;
  mileageKm?: number;
  condition?: string;
  regionalSpec?: string;
  bodyTypeId?: string;
  fuelType?: string;
  transmission?: string;
  cylinders?: number;
  exteriorColor?: string;
  interiorColor?: string;
  emirateId?: string;
  vin?: string;
  description?: string;
}

/* ------------------------------------------------------------------ */
/* Calls                                                              */
/* ------------------------------------------------------------------ */

/**
 * Normalise the media endpoints' response.
 *
 * The live backend returns a bare array; the shared client's return type says
 * `{ items }`. Accept either so this UI is right whichever one it gets.
 */
export function toMediaItems(response: unknown): ListingMediaRow[] {
  if (Array.isArray(response)) return response as ListingMediaRow[];
  if (response && typeof response === "object") {
    const items = (response as { items?: unknown }).items;
    if (Array.isArray(items)) return items as ListingMediaRow[];
  }
  return [];
}

/** PATCH /listings/:id — partial by design; only send what actually changed. */
export function patchListing(
  id: string,
  patch: ListingEditPatch,
  accessToken: string,
): Promise<OwnedListing> {
  return apiPatch<OwnedListing>(
    `/listings/${encodeURIComponent(id)}`,
    patch,
    { token: accessToken },
  );
}

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && (err.statusCode === 404 || err.statusCode === 410);
}

async function readBySlug(
  slug: string,
  accessToken: string,
): Promise<OwnedListing | null> {
  try {
    return await apiGet<OwnedListing>(
      `/listings/${encodeURIComponent(slug)}`,
      { token: accessToken },
    );
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** Pages a dealership's stock looking for one id. Bounded — see MAX_SCAN_PAGES. */
const SCAN_PAGE_SIZE = 50;
const MAX_SCAN_PAGES = 10;

async function findInDealerInventory(
  id: string,
  accessToken: string,
): Promise<OwnedListing | null> {
  let dealerId: string | null = null;
  try {
    const ctx = await getMyDealer(accessToken);
    dealerId = ctx.dealer?.id ?? null;
  } catch {
    return null;
  }
  if (!dealerId) return null;

  // ARCHIVED is excluded from the unfiltered inventory read, so ask for it by
  // name too — an archived listing still opens read-only here.
  for (const status of [undefined, "ARCHIVED"] as const) {
    for (let page = 0; page < MAX_SCAN_PAGES; page += 1) {
      let batch;
      try {
        batch = await getDealerInventory(dealerId, accessToken, {
          status,
          limit: SCAN_PAGE_SIZE,
          offset: page * SCAN_PAGE_SIZE,
        });
      } catch {
        return null;
      }
      const rows = batch.items as unknown as OwnedListing[];
      const hit = rows.find((row) => row.id === id);
      if (hit) return hit;
      if (page * SCAN_PAGE_SIZE + rows.length >= batch.total) break;
    }
  }
  return null;
}

/**
 * Resolve the listing behind the `[id]` route segment.
 *
 * The segment carries the listing SLUG whenever the link came from a screen we
 * own (/account/listings), because `GET /listings/:slug` is the only
 * single-listing read the backend offers and it returns descriptions and every
 * foreign key the form needs.
 *
 * A link that carries the raw id instead still works: `?slug=` is honoured as a
 * hint, and failing that the caller's dealership stock is paged for the id.
 * That fallback exists only because the backend has no owner-scoped
 * `GET /listings/:id` — see the module header.
 */
export async function loadOwnedListing(
  param: string,
  accessToken: string,
  slugHint?: string,
): Promise<LoadedListing> {
  const candidates = [param, slugHint].filter(
    (value, index, all): value is string =>
      Boolean(value) && all.indexOf(value) === index,
  );

  for (const candidate of candidates) {
    const listing = await readBySlug(candidate, accessToken);
    if (listing) return { listing, descriptionsLoaded: true };
  }

  const row = await findInDealerInventory(param, accessToken);
  if (!row) {
    throw new ApiError(404, "Listing not found", "Not Found");
  }

  // Now that the slug is known, try the richer read once more — it succeeds for
  // live stock and for whoever created the listing.
  const enriched = await readBySlug(row.slug, accessToken);
  return enriched
    ? { listing: enriched, descriptionsLoaded: true }
    : { listing: row, descriptionsLoaded: false };
}

/** The seller-authored English description, or "" when there is none. */
export function currentDescription(listing: OwnedListing): string {
  return listing.descriptions?.find((d) => d.locale === "en")?.text ?? "";
}
