/**
 * Staff subscriptions API wrappers — /admin/subscriptions.
 *
 * Shapes verified live against the running backend (2026-08-31), not against a
 * brief: Backend `SubscriptionsAdminController` + `SubscriptionRequestsService`.
 * Two facts the types below encode because the screen depends on them:
 *
 *  - `terms` is the PRICE SNAPSHOT taken at assignment (FR-SA3 grandfathering).
 *    It is what the dealership actually owes; the live Package row is not. It
 *    is `null` on rows seeded before snapshotting existed, so every reader must
 *    tolerate that.
 *  - Money is Decimal(12,2) AED. It arrives as a JSON number today but a
 *    decimal string is equally valid over the wire, hence `number | string`.
 *    These are whole dirhams — never divide.
 *
 * The dealer directory read lives here too: assigning a package needs a
 * dealership picker, and that list is `marketplace.dealers.view` while this
 * page is `billing.subscriptions.view`, so the call can legitimately 403 for
 * finance-only staff and the UI has to survive it.
 */
import { apiGet, apiPost } from "@/lib/api";

/** Money as the API sends it: whole AED, number or decimal string. */
export type AedAmount = number | string;

export const SUBSCRIPTION_STATUSES = [
  "PENDING_PAYMENT",
  "ACTIVE",
  "GRACE",
  "EXPIRED",
  "CANCELLED",
  "SUSPENDED",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "DECLINED",
  "WITHDRAWN",
] as const;
export type SubscriptionRequestStatus = (typeof SUBSCRIPTION_REQUEST_STATUSES)[number];

/** The snapshot written into `Subscription.terms` at assignment time. */
export interface SubscriptionTerms {
  tier: string;
  name: string;
  listingQuota: number;
  boostCredits: number;
  priceAed: AedAmount;
  termMonths: number;
  features: unknown;
  snapshotAt: string;
}

export interface AdminSubscription {
  id: string;
  dealerId: string;
  packageId: string;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string;
  activatedAt: string | null;
  activationInvoiceId: string | null;
  graceEndsAt: string | null;
  quotaGraceEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  suspendedAt: string | null;
  /** Null on legacy rows assigned before the snapshot existed. */
  terms: SubscriptionTerms | null;
  createdAt: string;
  updatedAt: string;
  dealer: { id: string; name: string };
  package: { tier: string; name: string };
}

export interface AdminSubscriptionRequest {
  id: string;
  dealerId: string;
  packageId: string;
  requestedById: string;
  status: SubscriptionRequestStatus;
  note: string | null;
  decidedById: string | null;
  decidedAt: string | null;
  declineReason: string | null;
  subscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
  dealer: { id: string; name: string; slug: string; verificationStatus: string };
  package: { id: string; tier: string; name: string; priceAed: AedAmount };
}

export interface SalePackage {
  id: string;
  tier: string;
  name: string;
  i18n: unknown;
  listingQuota: number;
  boostCredits: number;
  priceAed: AedAmount;
  termMonths: number;
  features: unknown;
}

export interface DealerDirectoryRow {
  id: string;
  slug: string;
  name: string;
  trn: string | null;
  verificationStatus: string;
  status: string;
  memberCount: number;
  liveListings: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface AssignPackageInput {
  dealerId: string;
  packageId: string;
  /** ISO date-time. Defaults to now server-side. */
  startsAt?: string;
  /** 1–60. Overrides the package's own term length. */
  termMonths?: number;
  /** Whole AED. Snapshotted into `terms` — a later re-price never touches it. */
  priceAedOverride?: number;
}

/** Approving may grant different terms than the ones asked for. */
export type ApproveRequestInput = Omit<AssignPackageInput, "dealerId">;

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/* ── Subscriptions ────────────────────────────────────────────────────────── */

/** GET /admin/subscriptions — soonest to expire first. */
export function listSubscriptions(
  accessToken: string,
  params: { status?: SubscriptionStatus | ""; limit?: number; offset?: number } = {},
): Promise<Page<AdminSubscription>> {
  return apiGet(`/admin/subscriptions${qs(params)}`, { token: accessToken });
}

/**
 * POST /admin/subscriptions — creates the term in PENDING_PAYMENT (which grants
 * NO quota until an invoice is paid) and snapshots the price.
 */
export function assignPackage(
  input: AssignPackageInput,
  accessToken: string,
): Promise<AdminSubscription> {
  return apiPost("/admin/subscriptions", input, { token: accessToken });
}

/**
 * POST /admin/subscriptions/:id/cancel.
 * `atPeriodEnd: true` keeps serving until `endsAt`; `false` stops now and
 * pauses the dealership's live inventory (the response carries how many).
 */
export function cancelSubscription(
  id: string,
  atPeriodEnd: boolean,
  accessToken: string,
): Promise<AdminSubscription & { listingsPaused?: number }> {
  return apiPost(`/admin/subscriptions/${id}/cancel`, { atPeriodEnd }, { token: accessToken });
}

/* ── Plan requests ────────────────────────────────────────────────────────── */

/** GET /admin/subscriptions/requests — a queue: longest-waiting first. */
export function listSubscriptionRequests(
  accessToken: string,
  params: { status?: SubscriptionRequestStatus | ""; limit?: number; offset?: number } = {},
): Promise<Page<AdminSubscriptionRequest>> {
  return apiGet(`/admin/subscriptions/requests${qs(params)}`, { token: accessToken });
}

/** POST /admin/subscriptions/requests/:id/approve — grants the term. */
export function approveSubscriptionRequest(
  id: string,
  input: ApproveRequestInput,
  accessToken: string,
): Promise<{ request: unknown; subscription: AdminSubscription }> {
  return apiPost(`/admin/subscriptions/requests/${id}/approve`, input, { token: accessToken });
}

/** POST /admin/subscriptions/requests/:id/decline — the reason reaches the dealership. */
export function declineSubscriptionRequest(
  id: string,
  reason: string,
  accessToken: string,
): Promise<AdminSubscriptionRequest> {
  return apiPost(
    `/admin/subscriptions/requests/${id}/decline`,
    { reason },
    { token: accessToken },
  );
}

/* ── Supporting reads ─────────────────────────────────────────────────────── */

/** GET /packages — the tiers on sale, cheapest first. */
export function listSalePackages(accessToken: string): Promise<SalePackage[]> {
  return apiGet("/packages", { token: accessToken });
}

/** GET /admin/dealers — dealership picker for the assign form. */
export function searchDealers(
  accessToken: string,
  params: { q?: string; limit?: number } = {},
): Promise<Page<DealerDirectoryRow>> {
  return apiGet(`/admin/dealers${qs({ sort: "name", ...params })}`, { token: accessToken });
}
