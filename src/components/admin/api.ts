/**
 * Admin moderation API wrappers — task P1-11 FE.
 *
 * Lives under components/admin (admin-lane ownership) rather than in
 * marketplace-api.ts, which belongs to the customer-facing lanes. All calls
 * require an ADMIN/SUPER_ADMIN Bearer token (RolesGuard on the backend).
 *
 * Response shapes verified against Backend listings.service.ts
 * `moderationQueue()`: full Listing rows + user/make/model selects + ordered
 * media rows (variants may be null while the pipeline is processing).
 */
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { MediaVariants, SpecGroups } from "@/lib/marketplace-api";

export interface ModerationMedia {
  id: string;
  s3Key: string;
  variants: MediaVariants | null;
  sortOrder: number;
  isCover: boolean;
  scanStatus: string;
  width: number | null;
  height: number | null;
}

export interface ModerationSeller {
  id: string;
  name: string;
  email: string;
}

/** GET /moderation/listings/queue item — PENDING_REVIEW rows, oldest first. */
export interface ModerationQueueItem {
  id: string;
  slug: string;
  sellerType: string;
  vehicleType: string;
  condition: string;
  year: number;
  priceAed: number;
  isNegotiable: boolean;
  mileageKm: number;
  regionalSpec: string;
  fuelType: string;
  transmission: string;
  cylinders: number | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  vin: string | null;
  status: string;
  specsSnapshot: SpecGroups | null;
  badges: string[];
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: ModerationSeller | null;
  make: { name: string };
  model: { name: string };
  media: ModerationMedia[];
  descriptions?: { locale: string; text: string }[];
  /** Non-blocking auto-check hits (P4-02). */
  moderationFlags?: { rule: string; detail: string }[] | null;
  /** Pre-edit LIVE values when a private-seller edit re-entered moderation. */
  lastLiveSnapshot?: Record<string, unknown> | null;
}

export function getModerationQueue(
  accessToken: string,
  params: { limit?: number; offset?: number } = {},
): Promise<{ items: ModerationQueueItem[]; total: number; limit: number; offset: number }> {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiGet(`/moderation/listings/queue${suffix}`, { token: accessToken });
}

export function bulkModerate(
  action: "approve" | "reject",
  ids: string[],
  reason: string | undefined,
  accessToken: string,
): Promise<{ done: string[]; failed: { id: string; reason: string }[] }> {
  return apiPost(
    `/moderation/listings/bulk-${action}`,
    action === "reject" ? { ids, reason } : { ids },
    { token: accessToken },
  );
}

export function approveListing(
  id: string,
  accessToken: string,
): Promise<{ id: string; status: string }> {
  return apiPost(`/moderation/listings/${encodeURIComponent(id)}/approve`, {}, {
    token: accessToken,
  });
}

/** Backend DTO: reason 5–500 chars — mirrored client-side in the dialog. */
export function rejectListing(
  id: string,
  reason: string,
  accessToken: string,
): Promise<{ id: string; status: string }> {
  return apiPost(
    `/moderation/listings/${encodeURIComponent(id)}/reject`,
    { reason },
    { token: accessToken },
  );
}

/** Featured toggle → drives FR-S3 pinning until P3-08 boosts supersede it. */
export function setListingFeatured(
  id: string,
  featured: boolean,
  accessToken: string,
): Promise<{ id: string; badges: string[] }> {
  return apiPost(
    `/moderation/listings/${encodeURIComponent(id)}/feature`,
    { featured },
    { token: accessToken },
  );
}

/* Dealer verification queue — task P3-01 (minimal screen; full queue in P4-03) */

export interface VerificationQueueItem {
  id: string;
  slug: string;
  name: string;
  trn: string | null;
  tradeLicenseKey: string | null;
  verificationStatus: string;
  updatedAt: string;
  createdAt: string;
}

export function getVerificationQueue(
  accessToken: string,
  params: { limit?: number; offset?: number } = {},
): Promise<{ items: VerificationQueueItem[]; total: number; limit: number; offset: number }> {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiGet(`/admin/dealer-verification/queue${suffix}`, { token: accessToken });
}

export function getLicenceUrl(
  dealerId: string,
  accessToken: string,
): Promise<{ url: string; expiresIn: number }> {
  return apiGet(
    `/admin/dealer-verification/${encodeURIComponent(dealerId)}/licence-url`,
    { token: accessToken },
  );
}

export function approveDealerVerification(
  dealerId: string,
  accessToken: string,
): Promise<{ verificationStatus: string }> {
  return apiPost(
    `/admin/dealer-verification/${encodeURIComponent(dealerId)}/approve`,
    {},
    { token: accessToken },
  );
}

export function rejectDealerVerification(
  dealerId: string,
  reason: string,
  accessToken: string,
): Promise<{ verificationStatus: string }> {
  return apiPost(
    `/admin/dealer-verification/${encodeURIComponent(dealerId)}/reject`,
    { reason },
    { token: accessToken },
  );
}

/* Staff WebAuthn (P4-01, AC-AUTH-04) — enrolment + step-up */

export interface WebAuthnCredentialRow {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export function getWebAuthnCredentials(
  accessToken: string,
): Promise<WebAuthnCredentialRow[]> {
  return apiGet("/auth/webauthn/credentials", { token: accessToken });
}

export function getRegistrationOptions(accessToken: string): Promise<unknown> {
  return apiPost("/auth/webauthn/registration/options", {}, { token: accessToken });
}

export function verifyRegistration(
  response: unknown,
  label: string,
  accessToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  return apiPost(
    "/auth/webauthn/registration/verify",
    { response, label },
    { token: accessToken },
  );
}

export function getAuthenticationOptions(accessToken: string): Promise<unknown> {
  return apiPost("/auth/webauthn/authentication/options", {}, { token: accessToken });
}

export function verifyAuthentication(
  response: unknown,
  accessToken: string,
): Promise<{ verified: boolean; accessToken: string; refreshToken: string }> {
  return apiPost(
    "/auth/webauthn/authentication/verify",
    { response },
    { token: accessToken },
  );
}

/**
 * Decode the backend access token's payload (amr/wvat) without verifying —
 * the API is the enforcement point; this only decides which screen to show.
 */
export function decodeStaffStepUp(accessToken: string | undefined): {
  isSteppedUp: boolean;
  hasWebAuthnAmr: boolean;
} {
  if (!accessToken) return { isSteppedUp: false, hasWebAuthnAmr: false };
  try {
    const payload = JSON.parse(
      atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { amr?: string[]; wvat?: number };
    const hasAmr = payload.amr?.includes("webauthn") ?? false;
    // Mirror of the backend's 12h max age — the guard is authoritative.
    const fresh =
      typeof payload.wvat === "number" &&
      Date.now() / 1000 - payload.wvat < 12 * 3600;
    return { isSteppedUp: hasAmr && fresh, hasWebAuthnAmr: hasAmr };
  } catch {
    return { isSteppedUp: false, hasWebAuthnAmr: false };
  }
}

/* Users + listings managers — task P4-03 (FR-AD2/AD3) */

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  locale: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  _count: { listings: number; sessions: number };
}

export function getAdminUsers(
  accessToken: string,
  params: { search?: string; role?: string; status?: string; limit?: number; offset?: number } = {},
): Promise<{ items: AdminUserRow[]; total: number }> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") qs.set(key, String(value));
  }
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiGet(`/admin/users${suffix}`, { token: accessToken });
}

export function setAdminUserStatus(
  id: string,
  action: "suspend" | "ban" | "reinstate",
  reason: string | undefined,
  accessToken: string,
): Promise<{ id: string; status: string; sessionsRevoked: number }> {
  return apiPost(
    `/admin/users/${encodeURIComponent(id)}/${action}`,
    reason ? { reason } : {},
    { token: accessToken },
  );
}

export function impersonateUser(
  id: string,
  accessToken: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  target: { id: string; email: string; name: string };
  expiresInMinutes: number;
}> {
  return apiPost(`/admin/users/${encodeURIComponent(id)}/impersonate`, {}, { token: accessToken });
}

export interface AdminListingRow {
  id: string;
  slug: string;
  year: number;
  priceAed: number;
  status: string;
  sellerType: string;
  badges: string[];
  publishedAt: string | null;
  updatedAt: string;
  make: { name: string };
  model: { name: string };
  user: { id: string; email: string } | null;
  dealer: { id: string; name: string } | null;
}

export function getAdminListings(
  accessToken: string,
  params: { search?: string; status?: string; limit?: number; offset?: number } = {},
): Promise<{ items: AdminListingRow[]; total: number }> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") qs.set(key, String(value));
  }
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiGet(`/admin/listings${suffix}`, { token: accessToken });
}

export function setAdminListingPaused(
  id: string,
  paused: boolean,
  reason: string | undefined,
  accessToken: string,
): Promise<{ id: string; status: string }> {
  return apiPost(
    `/admin/listings/${encodeURIComponent(id)}/${paused ? "pause" : "unpause"}`,
    reason ? { reason } : {},
    { token: accessToken },
  );
}

/* Reports + support inbox — task P4-04 (FR-AD5/AD8) */

export interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  listing: { id: string; slug: string; year: number; status: string; make: { name: string }; model: { name: string } } | null;
}

export function getReports(
  accessToken: string,
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<{ items: ReportRow[]; total: number }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") qs.set(k, String(v));
  return apiGet(`/admin/reports${qs.toString() ? `?${qs}` : ""}`, { token: accessToken });
}

export function resolveReport(
  id: string,
  status: "RESOLVED" | "DISMISSED",
  resolution: string | undefined,
  accessToken: string,
): Promise<{ id: string; status: string }> {
  return apiPost(`/admin/reports/${encodeURIComponent(id)}/resolve`, { status, resolution }, { token: accessToken });
}

export interface TicketRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: string;
  staffNote: string | null;
  createdAt: string;
}

export function getTickets(
  accessToken: string,
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<{ items: TicketRow[]; total: number }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") qs.set(k, String(v));
  return apiGet(`/admin/support${qs.toString() ? `?${qs}` : ""}`, { token: accessToken });
}

export function updateTicket(
  id: string,
  input: { status?: string; staffNote?: string },
  accessToken: string,
): Promise<{ id: string; status: string }> {
  return apiPost(`/admin/support/${encodeURIComponent(id)}`, input, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Content CMS — admin (P4-05, FR-N1–N3, FR-H1–H2)                    */
/* ------------------------------------------------------------------ */

export interface CmsTranslation {
  locale: string;
  title: string;
  excerpt?: string | null;
  markdown: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface CmsArticleRow {
  id: string;
  kind: "NEWS" | "HELP";
  slug: string;
  status: string;
  category: string | null;
  featured: boolean;
  publishedAt: string | null;
  scheduledFor: string | null;
  updatedAt: string;
  author: { name: string } | null;
  translations: { locale: string; title: string }[];
}

export interface CmsArticleFull extends CmsArticleRow {
  coverImageUrl: string | null;
  sortOrder: number;
  translations: (CmsTranslation & { locale: string; title: string; bodyHtml?: string | null })[];
}

export interface UpsertArticleInput {
  kind: "NEWS" | "HELP";
  slug: string;
  category?: string;
  coverImageUrl?: string;
  featured?: boolean;
  sortOrder?: number;
  translations: { locale: string; title: string; excerpt?: string; markdown: string; seoTitle?: string; seoDescription?: string }[];
}

export function getCmsArticles(
  accessToken: string,
  params: { kind?: string; status?: string; category?: string; limit?: number; offset?: number } = {},
): Promise<{ items: CmsArticleRow[]; total: number }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") qs.set(k, String(v));
  return apiGet(`/admin/content/articles${qs.toString() ? `?${qs}` : ""}`, { token: accessToken });
}

export function getCmsArticle(id: string, accessToken: string): Promise<CmsArticleFull> {
  return apiGet(`/admin/content/articles/${encodeURIComponent(id)}`, { token: accessToken });
}

export function createCmsArticle(input: UpsertArticleInput, accessToken: string): Promise<{ id: string }> {
  return apiPost(`/admin/content/articles`, input, { token: accessToken });
}

export function updateCmsArticle(id: string, input: UpsertArticleInput, accessToken: string): Promise<{ id: string }> {
  return apiPut(`/admin/content/articles/${encodeURIComponent(id)}`, input, { token: accessToken });
}

export function setCmsArticleStatus(
  id: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED",
  accessToken: string,
  scheduledFor?: string,
): Promise<{ id: string; status: string }> {
  return apiPost(`/admin/content/articles/${encodeURIComponent(id)}/status`, { status, scheduledFor }, { token: accessToken });
}

export function deleteCmsArticle(id: string, accessToken: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/admin/content/articles/${encodeURIComponent(id)}`, { token: accessToken });
}

export interface LegalDocRow {
  id: string;
  key: string;
  version: number;
  effectiveAt: string | null;
  updatedAt: string;
  translations: { locale: string; title?: string; bodyHtml?: string }[];
}

export function getLegalDocs(accessToken: string): Promise<LegalDocRow[]> {
  return apiGet(`/admin/content/legal`, { token: accessToken });
}

export function getLegalDocAdmin(key: string, accessToken: string): Promise<LegalDocRow & { translations: { locale: string; title: string; bodyHtml: string }[] }> {
  return apiGet(`/admin/content/legal/${encodeURIComponent(key)}`, { token: accessToken });
}

export function upsertLegalDoc(
  key: string,
  input: { effectiveAt?: string; bumpVersion?: boolean; translations: { locale: string; title: string; markdown: string }[] },
  accessToken: string,
): Promise<LegalDocRow> {
  return apiPut(`/admin/content/legal/${encodeURIComponent(key)}`, input, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Banners — admin (P4-06, FR-AD7)                                    */
/* ------------------------------------------------------------------ */

export type BannerSlot = "HOME_HERO" | "HOME_STRIP" | "SEARCH_TOP" | "DETAIL_SIDEBAR";

export interface BannerRow {
  id: string;
  name: string;
  slot: BannerSlot;
  imageUrl: string;
  targetUrl: string;
  locale: string | null;
  emirateId: string | null;
  emirate: { name: string; slug: string } | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  priority: number;
  impressions: number;
  clicks: number;
}

export interface BannerInput {
  name: string;
  slot: BannerSlot;
  imageUrl: string;
  targetUrl: string;
  locale?: string | null;
  emirateId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
  priority?: number;
}

export function getBanners(accessToken: string, params: { slot?: string; active?: boolean } = {}): Promise<BannerRow[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") qs.set(k, String(v));
  return apiGet(`/admin/banners${qs.toString() ? `?${qs}` : ""}`, { token: accessToken });
}

export function createBanner(input: BannerInput, accessToken: string): Promise<BannerRow> {
  return apiPost(`/admin/banners`, input, { token: accessToken });
}

export function updateBanner(id: string, input: BannerInput, accessToken: string): Promise<BannerRow> {
  return apiPut(`/admin/banners/${encodeURIComponent(id)}`, input, { token: accessToken });
}

export function setBannerActive(id: string, active: boolean, accessToken: string): Promise<BannerRow> {
  return apiPost(`/admin/banners/${encodeURIComponent(id)}/active`, { active }, { token: accessToken });
}

export function deleteBanner(id: string, accessToken: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/admin/banners/${encodeURIComponent(id)}`, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Super Admin suite + audit viewer (P4-07)                           */
/* ------------------------------------------------------------------ */

export interface AuditRow {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ip: string | null;
  createdAt: string;
  before?: unknown;
  after?: unknown;
}

export function getAuditLog(
  accessToken: string,
  params: { action?: string; entityType?: string; cursor?: string; limit?: number } = {},
): Promise<{ items: AuditRow[]; nextCursor: string | null }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") qs.set(k, String(v));
  return apiGet(`/admin/audit${qs.toString() ? `?${qs}` : ""}`, { token: accessToken });
}

export interface StaffRow {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: string;
  permissions: string[];
  createdAt: string;
}

export function getPermissionCatalogue(accessToken: string): Promise<string[]> {
  return apiGet(`/super-admin/permissions`, { token: accessToken });
}
export function getStaff(accessToken: string): Promise<StaffRow[]> {
  return apiGet(`/super-admin/staff`, { token: accessToken });
}
export function createStaff(input: { email: string; name: string; role: "ADMIN" | "SUPER_ADMIN"; permissions?: string[] }, accessToken: string): Promise<StaffRow & { mustResetPassword: boolean }> {
  return apiPost(`/super-admin/staff`, input, { token: accessToken });
}
export function setStaffRole(id: string, role: "USER" | "ADMIN" | "SUPER_ADMIN", accessToken: string): Promise<{ id: string; role: string }> {
  return apiPost(`/super-admin/staff/${encodeURIComponent(id)}/role`, { role }, { token: accessToken });
}
export function setStaffPermissions(id: string, permissions: string[], accessToken: string): Promise<{ id: string; permissions: string[] }> {
  return apiPost(`/super-admin/staff/${encodeURIComponent(id)}/permissions`, { permissions }, { token: accessToken });
}

export interface PackageRow {
  id: string;
  tier: string;
  name: string;
  listingQuota: number;
  boostCredits: number;
  priceAed: number;
  termMonths: number;
  isActive: boolean;
  activeSubscriptions: number;
}
export interface PackageInput {
  id?: string;
  tier: string;
  name: string;
  listingQuota: number;
  boostCredits: number;
  priceAed: number;
  termMonths: number;
  isActive: boolean;
}
export function getPackages(accessToken: string): Promise<PackageRow[]> {
  return apiGet(`/super-admin/packages`, { token: accessToken });
}
export function upsertPackage(input: PackageInput, accessToken: string): Promise<PackageRow> {
  return apiPut(`/super-admin/packages`, input, { token: accessToken });
}

export interface SettingRow { key: string; value: unknown; category: string; updatedAt: string; updatedBy: string | null; }
export function getSettings(accessToken: string): Promise<SettingRow[]> {
  return apiGet(`/super-admin/settings`, { token: accessToken });
}
export function upsertSetting(key: string, value: Record<string, unknown>, category: string, accessToken: string): Promise<SettingRow> {
  return apiPut(`/super-admin/settings/${encodeURIComponent(key)}`, { value, category }, { token: accessToken });
}

export interface TranslationRow { namespace: string; key: string; values: Record<string, string>; }
export function getTranslationNamespaces(accessToken: string): Promise<string[]> {
  return apiGet(`/super-admin/translations/namespaces`, { token: accessToken });
}
export function getTranslations(namespace: string, accessToken: string): Promise<TranslationRow[]> {
  return apiGet(`/super-admin/translations?namespace=${encodeURIComponent(namespace)}`, { token: accessToken });
}
export function upsertTranslation(input: { namespace: string; key: string; values: Record<string, string> }, accessToken: string): Promise<TranslationRow> {
  return apiPut(`/super-admin/translations`, input, { token: accessToken });
}

export interface SystemHealth {
  database: { status: string };
  queues: { media: Record<string, number> | null; email: Record<string, number> | null };
  counts: { users: number; listings: number; dealers: number; liveListings: number; pendingReview: number };
}
export function getSystemHealth(accessToken: string): Promise<SystemHealth> {
  return apiGet(`/super-admin/health`, { token: accessToken });
}

export interface AdminTaxonomy {
  makes: { id: string; slug: string; name: string; isActive: boolean; vehicleTypes: string[]; sortOrder: number; _count: { models: number; listings: number } }[];
  emirates: { id: string; slug: string; name: string }[];
  bodyTypes: { id: string; slug: string; name: string }[];
}
export function getAdminTaxonomy(accessToken: string): Promise<AdminTaxonomy> {
  return apiGet(`/taxonomy/admin/all`, { token: accessToken });
}
export function upsertMake(input: { id?: string; slug: string; name: string; vehicleTypes: string[]; isActive: boolean; sortOrder?: number }, accessToken: string): Promise<{ id: string; slug: string }> {
  return apiPut(`/taxonomy/admin/makes`, input, { token: accessToken });
}
export function renameEmirate(id: string, name: string, accessToken: string): Promise<{ id: string; name: string }> {
  return apiPut(`/taxonomy/admin/emirates/${encodeURIComponent(id)}`, { name }, { token: accessToken });
}
export function reindexMake(id: string, accessToken: string): Promise<{ reindexed: number }> {
  return apiPost(`/taxonomy/admin/makes/${encodeURIComponent(id)}/reindex`, {}, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Spec DB curation workbench (P4-08, FR-VS7/VS2b)                    */
/* ------------------------------------------------------------------ */

export interface SpecCoverage {
  trimsTotal: number;
  trimsWithSpecs: number;
  coveragePct: number;
  publishedSpecs: number;
  draftSpecs: number;
  fields: { VERIFIED: number; HIGH: number; LOW: number };
  openRequests: number;
  byMake: { make: string; trims: number; covered: number }[];
}
export interface ReviewSpec {
  id: string;
  year: number;
  regionalSpec: string;
  status: string;
  trim: string;
  model: string;
  make: string;
  lowFields: { fieldKey: string; value: string; source: string; confidence: string }[];
  lowCount: number;
}
export interface TrimRequestRow {
  id: string;
  userId: string | null;
  details: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export function getSpecCoverage(accessToken: string): Promise<SpecCoverage> {
  return apiGet(`/admin/spec-workbench/coverage`, { token: accessToken });
}
export function getSpecReviewQueue(accessToken: string, params: { confidence?: string; limit?: number; offset?: number } = {}): Promise<{ items: ReviewSpec[]; total: number }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") qs.set(k, String(v));
  return apiGet(`/admin/spec-workbench/review-queue${qs.toString() ? `?${qs}` : ""}`, { token: accessToken });
}
export function getSpecRequests(accessToken: string, params: { status?: string; limit?: number; offset?: number } = {}): Promise<{ items: TrimRequestRow[]; total: number }> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") qs.set(k, String(v));
  return apiGet(`/admin/spec-workbench/requests${qs.toString() ? `?${qs}` : ""}`, { token: accessToken });
}
export function verifyTrimSpec(id: string, opts: { confidence?: string; publish?: boolean }, accessToken: string): Promise<{ id: string; published: boolean }> {
  return apiPost(`/admin/spec-workbench/trim-specs/${encodeURIComponent(id)}/verify`, opts, { token: accessToken });
}
export function bulkVerifySpecs(ids: string[], accessToken: string): Promise<{ verified: number }> {
  return apiPost(`/admin/spec-workbench/bulk-verify`, { ids }, { token: accessToken });
}
export function resolveTrimRequest(id: string, status: "APPROVED" | "REJECTED", accessToken: string): Promise<{ id: string; status: string }> {
  return apiPost(`/admin/spec-workbench/requests/${encodeURIComponent(id)}/resolve`, { status }, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Analytics dashboards + weekly report (P4-09, FR-SA8)               */
/* ------------------------------------------------------------------ */

export interface AnalyticsReport {
  from: string;
  to: string;
  days: number;
  totals: { newUsers: number; newListings: number; liveListings: number; newDealers: number; leads: number; invoicesIssued: number; revenueAed: number };
  series: { date: string; users: number; listings: number; leads: number }[];
  topMakes: { make: string; listings: number }[];
}
export function getAnalytics(days: number, accessToken: string): Promise<AnalyticsReport> {
  return apiGet(`/super-admin/analytics?days=${days}`, { token: accessToken });
}
export function runWeeklyReport(accessToken: string): Promise<{ week: string; recipients: number; pdfBytes: number }> {
  return apiPost(`/super-admin/analytics/weekly-report/run`, {}, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Secrets vault + AI config (P5-01) — SUPER_ADMIN                     */
/* ------------------------------------------------------------------ */

export interface SecretRow { key: string; hint: string; category: string; updatedBy: string | null; updatedAt: string; configured: boolean; }
export function getSecrets(accessToken: string): Promise<SecretRow[]> {
  return apiGet(`/super-admin/secrets`, { token: accessToken });
}
export function setSecret(key: string, value: string, category: string, accessToken: string): Promise<SecretRow> {
  return apiPut(`/super-admin/secrets/${encodeURIComponent(key)}`, { value, category }, { token: accessToken });
}
export function deleteSecret(key: string, accessToken: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/super-admin/secrets/${encodeURIComponent(key)}`, { token: accessToken });
}

export interface AiConfig {
  flags: Record<string, boolean>;
  caps: { perUserPerDay: number; globalPerDay: number };
  providerConfigured: boolean;
}
export interface AiUsageRow { feature: string; provider: string; calls: number; inputTokens: number; outputTokens: number; costUsd: number; }
export function getAiConfig(accessToken: string): Promise<AiConfig> {
  return apiGet(`/super-admin/ai/config`, { token: accessToken });
}
export function setAiFlag(feature: string, enabled: boolean, accessToken: string): Promise<{ feature: string; enabled: boolean }> {
  return apiPut(`/super-admin/ai/flags/${encodeURIComponent(feature)}`, { enabled }, { token: accessToken });
}
export function setAiCaps(caps: { perUserPerDay: number; globalPerDay: number }, accessToken: string): Promise<{ perUserPerDay: number; globalPerDay: number }> {
  return apiPut(`/super-admin/ai/caps`, caps, { token: accessToken });
}
export function getAiUsage(days: number, accessToken: string): Promise<AiUsageRow[]> {
  return apiGet(`/super-admin/ai/usage?days=${days}`, { token: accessToken });
}
export function testAiProvider(accessToken: string): Promise<{ ok: boolean; provider: string; model?: string; detail?: string }> {
  return apiPost(`/super-admin/ai/test-provider`, {}, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* "X vs Y" pair curation — P6-03 (FR-CV7)                            */
/* ------------------------------------------------------------------ */

export interface VsPairRow {
  id: string;
  slug: string;
  title: string;
  source: "CURATED" | "AUTO";
  indexable: boolean;
  intro: Record<string, string> | null;
  compareCount: number;
  viewCount: number;
  updatedAt: string;
}

export function adminListVsPairs(accessToken: string): Promise<{ items: VsPairRow[]; total: number }> {
  return apiGet(`/admin/vs-pairs?limit=200`, { token: accessToken });
}

export function adminCreateVsPair(
  input: { modelAId: string; modelBId: string; indexable?: boolean; intro?: Record<string, string> },
  accessToken: string,
): Promise<VsPairRow> {
  return apiPost(`/admin/vs-pairs`, input, { token: accessToken });
}

export function adminUpdateVsPair(
  id: string,
  input: { indexable?: boolean; intro?: Record<string, string>; source?: "CURATED" | "AUTO" },
  accessToken: string,
): Promise<VsPairRow> {
  return apiPut(`/admin/vs-pairs/${encodeURIComponent(id)}`, input, { token: accessToken });
}

export function adminDeleteVsPair(id: string, accessToken: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/admin/vs-pairs/${encodeURIComponent(id)}`, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* RBAC v2 — G1-01 (FR-RB2..RB7)                                      */
/* ------------------------------------------------------------------ */

export interface RbacPermissionDef {
  key: string;
  label: string;
  superAdminOnly?: boolean;
}

export interface RbacModuleDef {
  key: string;
  label: string;
  permissions: RbacPermissionDef[];
}

export interface RbacRole {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  permissions: string[];
  dataScopes: Record<string, unknown> | null;
  isTemplate: boolean;
  assignedUsers: number;
}

export interface RbacStaffMember {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SUPER_ADMIN";
  status: string;
  permissions: string[];
  permissionDenials: string[];
  dataScopes: Record<string, unknown> | null;
  staffRole: { id: string; name: string; slug: string } | null;
  permissionGrants: { id: string; permission: string; expiresAt: string; reason: string | null }[];
}

export function rbacMatrix(accessToken: string): Promise<{ modules: RbacModuleDef[]; roles: RbacRole[] }> {
  return apiGet(`/admin/rbac/matrix`, { token: accessToken });
}

export function rbacCreateRole(
  input: { name: string; description?: string; permissions: string[]; cloneFromId?: string; dataScopes?: Record<string, unknown> },
  accessToken: string,
): Promise<RbacRole> {
  return apiPost(`/admin/rbac/roles`, input, { token: accessToken });
}

export function rbacUpdateRole(
  id: string,
  input: { name?: string; description?: string; permissions?: string[]; dataScopes?: Record<string, unknown> },
  accessToken: string,
): Promise<RbacRole> {
  return apiPut(`/admin/rbac/roles/${encodeURIComponent(id)}`, input, { token: accessToken });
}

export function rbacDeleteRole(id: string, accessToken: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/admin/rbac/roles/${encodeURIComponent(id)}`, { token: accessToken });
}

export function rbacStaff(accessToken: string): Promise<{ items: RbacStaffMember[] }> {
  return apiGet(`/admin/rbac/staff`, { token: accessToken });
}

export function rbacUpdateStaff(
  userId: string,
  input: { staffRoleId?: string | null; grants?: string[]; denials?: string[]; dataScopes?: Record<string, unknown> | null },
  accessToken: string,
): Promise<unknown> {
  return apiPut(`/admin/rbac/staff/${encodeURIComponent(userId)}`, input, { token: accessToken });
}

export function rbacAddGrant(
  userId: string,
  input: { permission: string; expiresAt: string; reason?: string },
  accessToken: string,
): Promise<unknown> {
  return apiPost(`/admin/rbac/staff/${encodeURIComponent(userId)}/grants`, input, { token: accessToken });
}

export function rbacRevokeGrant(grantId: string, accessToken: string): Promise<unknown> {
  return apiDelete(`/admin/rbac/grants/${encodeURIComponent(grantId)}`, { token: accessToken });
}

export function rbacMe(accessToken: string): Promise<{ permissions: string[]; dataScopes: Record<string, unknown> }> {
  return apiGet(`/admin/rbac/me`, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Sales CRM — G1-02/03 (FR-SC1..SC3)                                 */
/* ------------------------------------------------------------------ */

export interface CrmAccountRow {
  id: string;
  kind: "DEALER" | "PROSPECT";
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  sourceDetail: string | null;
  dedupeStatus: string;
  owner: { id: string; name: string } | null;
  dealer: { slug: string; verificationStatus: string } | null;
  _count?: { contacts: number };
  updatedAt: string;
}

export interface CrmStageCol {
  id: string;
  slug: string;
  name: string;
  kind: "OPEN" | "WON" | "LOST";
  probability: number;
  rules: { requireNote?: boolean; requireReason?: boolean } | null;
  deals: CrmDealCard[];
}

export interface CrmDealCard {
  id: string;
  title: string;
  valueAed: number;
  status: "OPEN" | "WON" | "LOST";
  probability: number | null;
  expectedCloseAt: string | null;
  account: { id: string; name: string };
  package: { id: string; tier: string; name: string } | null;
  outcomeReason: { slug: string; label: string } | null;
}

export interface CrmBoard {
  pipeline: { id: string; slug: string; name: string };
  stages: CrmStageCol[];
  totals: { open: number; won: number };
}

export interface CrmOutcomeReason {
  id: string;
  kind: "WON" | "LOST";
  slug: string;
  label: string;
}

export function crmListAccounts(accessToken: string, params: { search?: string; limit?: number } = {}): Promise<{ items: CrmAccountRow[]; total: number }> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  qs.set("limit", String(params.limit ?? 50));
  return apiGet(`/crm/accounts?${qs}`, { token: accessToken });
}

export function crmBoard(pipeline: string, accessToken: string): Promise<CrmBoard> {
  return apiGet(`/crm/board?pipeline=${encodeURIComponent(pipeline)}`, { token: accessToken });
}

export function crmPipelines(accessToken: string): Promise<{ id: string; slug: string; name: string }[]> {
  return apiGet(`/crm/pipelines`, { token: accessToken });
}

export function crmOutcomeReasons(accessToken: string): Promise<CrmOutcomeReason[]> {
  return apiGet(`/crm/outcome-reasons`, { token: accessToken });
}

export function crmCreateDeal(
  input: { accountId: string; title: string; valueAed?: number; packageId?: string; expectedCloseAt?: string },
  accessToken: string,
): Promise<CrmDealCard> {
  return apiPost(`/crm/deals`, input, { token: accessToken });
}

export function crmMoveDeal(
  dealId: string,
  input: { stageId: string; sortIndex?: number; note?: string; reasonId?: string },
  accessToken: string,
): Promise<unknown> {
  return apiPost(`/crm/deals/${encodeURIComponent(dealId)}/move`, input, { token: accessToken });
}

// ─────────────────────── G4 Studio + Ads Manager ───────────────────────

export interface StudioPreset {
  key: string;
  label: string;
  width: number;
  height: number;
}

export interface StudioLayer {
  id: string;
  type: "rect" | "circle" | "text" | "image";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  align?: string;
  s3Key?: string;
  role?: string;
  name?: string;
  visible?: boolean;
}

export interface StudioScene {
  id: string;
  versionGroupId: string;
  version: number;
  name: string;
  kind: string;
  presetKey: string;
  width: number;
  height: number;
  scene: { layers: StudioLayer[] };
  brief?: string | null;
  locale?: string;
  updatedAt: string;
  versions?: { id: string; version: number; createdAt: string }[];
}

export interface StudioAssetRow {
  id: string;
  versionGroupId: string;
  version: number;
  name: string;
  kind: string;
  tags: string[];
  mimeType: string;
  s3Key: string;
  origin: string;
  createdAt: string;
  versions?: { id: string; version: number; s3Key: string; createdAt: string }[];
  usedInCampaigns?: { id: string; name: string; platform: string; status: string }[];
}

export interface FalModelRow {
  key: string;
  label: string;
  costUsd: number;
  tier: string;
}

export function studioPresets(accessToken: string): Promise<StudioPreset[]> {
  return apiGet(`/studio/presets`, { token: accessToken });
}

export function studioScenes(accessToken: string, kind = "AD"): Promise<StudioScene[]> {
  return apiGet(`/studio/scenes?kind=${encodeURIComponent(kind)}`, { token: accessToken });
}

export function studioScene(id: string, accessToken: string): Promise<StudioScene> {
  return apiGet(`/studio/scenes/${encodeURIComponent(id)}`, { token: accessToken });
}

export function studioSaveScene(
  input: {
    name: string;
    presetKey: string;
    scene: { layers: StudioLayer[] };
    kind?: string;
    versionGroupId?: string;
    locale?: string;
    dealerId?: string;
  },
  accessToken: string,
): Promise<StudioScene> {
  return apiPost(`/studio/scenes`, input, { token: accessToken });
}

export function studioRenderScene(
  id: string,
  input: { format?: "svg" | "png" | "jpg"; scale?: number; register?: boolean },
  accessToken: string,
): Promise<{ s3Key: string; mimeType: string; sizeBytes: number; width: number; height: number }> {
  return apiPost(`/studio/scenes/${encodeURIComponent(id)}/render`, input, { token: accessToken });
}

export function studioAiModels(accessToken: string): Promise<FalModelRow[]> {
  return apiGet(`/studio/ai/models`, { token: accessToken });
}

export function studioGenerateImage(
  input: { modelKey: string; prompt: string; width?: number; height?: number },
  accessToken: string,
): Promise<{ s3Key: string; mimeType: string; provider: string; costUsd: number }> {
  return apiPost(`/studio/ai/image`, input, { token: accessToken });
}

export function studioGenerateLayout(
  input: { brief: string; presetKey: string; locale?: string; tone?: string; generateImagery?: boolean },
  accessToken: string,
): Promise<{ scene: StudioScene; copy: { headline: string; body: string; cta: string } }> {
  return apiPost(`/studio/ai/layout`, input, { token: accessToken });
}

export function studioGenerateCopy(
  input: { brief: string; platform: string; tone?: string; locales?: string[] },
  accessToken: string,
): Promise<{
  platform: string;
  tone: string;
  limits: { headline: number; primary: number; cta: number };
  variants: Record<string, { headline: string; primary: string; cta: string; withinLimits: boolean }>;
}> {
  return apiPost(`/studio/ai/copy`, input, { token: accessToken });
}

export function studioAssets(
  accessToken: string,
  params: { q?: string; kind?: string; tag?: string } = {},
): Promise<{ items: StudioAssetRow[]; total: number }> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.kind) qs.set("kind", params.kind);
  if (params.tag) qs.set("tag", params.tag);
  return apiGet(`/studio/assets${qs.toString() ? `?${qs.toString()}` : ""}`, { token: accessToken });
}

export function studioAsset(id: string, accessToken: string): Promise<StudioAssetRow> {
  return apiGet(`/studio/assets/${encodeURIComponent(id)}`, { token: accessToken });
}

export function studioRegisterAsset(
  input: { name: string; s3Key: string; mimeType: string; kind?: string; tags?: string[]; sizeBytes?: number; versionGroupId?: string },
  accessToken: string,
): Promise<StudioAssetRow> {
  return apiPost(`/studio/assets`, input, { token: accessToken });
}

export interface AdCampaignRow {
  id: string;
  name: string;
  platform: string;
  objective: string;
  status: string;
  budgetAed: string | number;
  spendAed?: number;
  utmUrl?: string | null;
  creativeCount?: number;
  attribution?: { leads: number; conversions: number; cplAed: number | null; costPerConversionAed: number | null };
  creatives?: {
    id: string;
    asset?: { id: string; name: string; s3Key: string; mimeType: string } | null;
    scene?: { id: string; name: string; presetKey: string } | null;
  }[];
}

export function adsCampaigns(accessToken: string): Promise<AdCampaignRow[]> {
  return apiGet(`/ads/campaigns`, { token: accessToken });
}

export function adsCampaign(id: string, accessToken: string): Promise<AdCampaignRow> {
  return apiGet(`/ads/campaigns/${encodeURIComponent(id)}`, { token: accessToken });
}

export function adsCreateCampaign(
  input: { name: string; platform: string; objective?: string; budgetAed?: number; landingPath?: string; utmContent?: string },
  accessToken: string,
): Promise<AdCampaignRow> {
  return apiPost(`/ads/campaigns`, input, { token: accessToken });
}

export function adsSetCampaignStatus(id: string, status: string, accessToken: string): Promise<AdCampaignRow> {
  return apiPut(`/ads/campaigns/${encodeURIComponent(id)}/status`, { status }, { token: accessToken });
}

export function adsLinkCreative(
  id: string,
  input: { assetId?: string; sceneId?: string; note?: string },
  accessToken: string,
): Promise<unknown> {
  return apiPost(`/ads/campaigns/${encodeURIComponent(id)}/creatives`, input, { token: accessToken });
}

export function adsRecordSpend(id: string, input: { day: string; spendAed: number }, accessToken: string): Promise<unknown> {
  return apiPost(`/ads/campaigns/${encodeURIComponent(id)}/spend`, input, { token: accessToken });
}
