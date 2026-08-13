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
import { apiGet, apiPost } from "@/lib/api";
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
