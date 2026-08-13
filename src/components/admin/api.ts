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
  /** Not included by the current queue payload — kept optional and rendered
   *  defensively so the UI lights up if the backend adds the relation. */
  descriptions?: { locale: string; text: string }[];
}

export function getModerationQueue(
  accessToken: string,
): Promise<ModerationQueueItem[]> {
  return apiGet<ModerationQueueItem[]>("/moderation/listings/queue", {
    token: accessToken,
  });
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
