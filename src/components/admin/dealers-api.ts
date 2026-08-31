/**
 * Admin dealer directory API wrappers — task P4-03 FE (FR-AD2).
 *
 * Sibling of components/admin/api.ts and deliberately its own module: that file
 * is shared by every admin page, this one belongs to /admin/dealers alone.
 *
 * Shapes verified live against Backend `DealerAdminService` on
 * http://localhost:4000/api/v1 (2026-08-31) — directory, detail, suspend and
 * reinstate, including the 400/404/409 envelopes.
 *
 * The two status concepts are NOT interchangeable and are typed separately:
 * `verificationStatus` is about documents, `status` is about whether the
 * dealership may trade today. A VERIFIED dealership can be SUSPENDED.
 */
import { apiGet, apiPost } from "@/lib/api";

export const DEALER_VERIFICATION_STATUSES = [
  "UNVERIFIED",
  "PENDING",
  "VERIFIED",
  "REJECTED",
] as const;
export type DealerVerificationStatus = (typeof DEALER_VERIFICATION_STATUSES)[number];

export const DEALER_TRADING_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type DealerTradingStatus = (typeof DEALER_TRADING_STATUSES)[number];

export const DEALER_DIRECTORY_SORTS = ["recent", "name", "listings"] as const;
export type DealerDirectorySort = (typeof DEALER_DIRECTORY_SORTS)[number];

/** Every listing state the grouped counts can come back keyed by. */
export const LISTING_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "LIVE",
  "PAUSED",
  "SOLD",
  "EXPIRED",
  "REJECTED",
  "ARCHIVED",
] as const;
export type ListingStatusKey = (typeof LISTING_STATUSES)[number];

/** GET /admin/dealers item. */
export interface DealerDirectoryRow {
  id: string;
  slug: string;
  name: string;
  trn: string | null;
  logoKey: string | null;
  verificationStatus: DealerVerificationStatus;
  status: DealerTradingStatus;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  memberCount: number;
  liveListings: number;
}

export interface DealerDirectoryPage {
  items: DealerDirectoryRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface DealerBranch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  emirate: { name: string } | null;
}

export interface DealerMemberRow {
  id: string;
  role: "OWNER" | "MANAGER" | "SALES";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: "ACTIVE" | "SUSPENDED" | "BANNED" | "DELETED";
  };
}

/**
 * `terms` is the package snapshot frozen at purchase — `priceAed` is whole
 * dirhams (Decimal(12,2)), so it arrives as a number or a decimal string and is
 * NEVER divided by anything.
 */
export interface DealerSubscription {
  id: string;
  status: "PENDING_PAYMENT" | "ACTIVE" | "GRACE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
  startsAt: string;
  endsAt: string;
  cancelAtPeriodEnd: boolean;
  graceEndsAt: string | null;
  terms: {
    name?: string;
    tier?: string;
    priceAed?: number | string;
    termMonths?: number;
    listingQuota?: number;
    boostCredits?: number;
  } | null;
  package: { id: string; name: string } | null;
}

/** GET /admin/dealers/:dealerId — the full profile row plus its relations. */
export interface DealerDetail {
  id: string;
  slug: string;
  name: string;
  trn: string | null;
  logoKey: string | null;
  coverKey: string | null;
  aboutI18n: Record<string, string> | null;
  brands: string[];
  services: string[];
  leadVisibility: string;
  verificationStatus: DealerVerificationStatus;
  verificationNote: string | null;
  tradeLicenseKey: string | null;
  status: DealerTradingStatus;
  suspendedAt: string | null;
  suspensionReason: string | null;
  suspendedById: string | null;
  suspendedBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  branches: DealerBranch[];
  members: DealerMemberRow[];
  subscriptions: DealerSubscription[];
  /** Sparse: statuses with zero listings are absent from the map entirely. */
  listingCounts: Partial<Record<ListingStatusKey, number>>;
}

export interface SuspendResult {
  id: string;
  status: DealerTradingStatus;
  suspendedAt: string | null;
  suspensionReason: string | null;
  listingsPaused: number;
}

export interface ReinstateResult {
  id: string;
  status: DealerTradingStatus;
  listingsRestored: number;
}

export interface DealerDirectoryParams {
  /** Matches name, slug, or TRN by prefix. */
  q?: string;
  verificationStatus?: DealerVerificationStatus;
  status?: DealerTradingStatus;
  sort?: DealerDirectorySort;
  limit?: number;
  offset?: number;
}

export function getDealerDirectory(
  accessToken: string,
  params: DealerDirectoryParams = {},
): Promise<DealerDirectoryPage> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.verificationStatus) qs.set("verificationStatus", params.verificationStatus);
  if (params.status) qs.set("status", params.status);
  if (params.sort) qs.set("sort", params.sort);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiGet(`/admin/dealers${suffix}`, { token: accessToken });
}

export function getDealerDetail(
  dealerId: string,
  accessToken: string,
): Promise<DealerDetail> {
  return apiGet(`/admin/dealers/${encodeURIComponent(dealerId)}`, { token: accessToken });
}

/**
 * Pauses the dealership's LIVE stock, blocks publishing and notifies the
 * owners. `reason` is shown to them verbatim (3–500 chars, enforced server-side).
 */
export function suspendDealer(
  dealerId: string,
  reason: string,
  accessToken: string,
): Promise<SuspendResult> {
  return apiPost(
    `/admin/dealers/${encodeURIComponent(dealerId)}/suspend`,
    { reason },
    { token: accessToken },
  );
}

/** Restores exactly the listings the suspension paused — nothing else. */
export function reinstateDealer(
  dealerId: string,
  accessToken: string,
): Promise<ReinstateResult> {
  return apiPost(
    `/admin/dealers/${encodeURIComponent(dealerId)}/reinstate`,
    {},
    { token: accessToken },
  );
}
