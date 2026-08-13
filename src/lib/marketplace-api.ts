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
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

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
  /** Present on owner-scoped reads (/listings/mine); null before publication. */
  expiresAt?: string | null;
  dealerId?: string | null;
  userId?: string | null;
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
  dealerId?: string;
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

export type UploadContentType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";

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

export interface MyListingsPage {
  items: ListingDetail[];
  total: number;
  limit: number;
  offset: number;
}

export function myListings(
  accessToken: string,
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<MyListingsPage> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiGet<MyListingsPage>(`/listings/mine${suffix}`, {
    token: accessToken,
  });
}

/* ------------------------------------------------------------------ */
/* Saved cars & saved searches — task P1-09 (FR-U1, FR-S5)            */
/* ------------------------------------------------------------------ */

/**
 * Card-ish listing embedded in GET /saved/cars rows. Narrower than the
 * search `Card` shape (no badges/_count/publishedAt/sellerType), verified
 * against the live backend.
 */
export interface SavedCarListing {
  id: string;
  slug: string;
  status: string;
  year: number;
  priceAed: number;
  mileageKm: number;
  fuelType: string | null;
  transmission: string | null;
  make: { name: string };
  model: { name: string };
  trim: { name: string } | null;
  emirate: { name: string };
  media: { variants: MediaVariants }[];
}

/** Row of GET /saved/cars. */
export interface SavedCar {
  savedAt: string;
  priceAedAtSave: number;
  priceDropped: boolean;
  priceDropAed: number;
  stillLive: boolean;
  listing: SavedCarListing;
}

export type SavedSearchFrequency = "INSTANT" | "DAILY" | "WEEKLY" | "OFF";

/** Row of GET /saved/searches. `query` is the /cars query-param object. */
export interface SavedSearch {
  id: string;
  name: string;
  query: Record<string, string>;
  frequency: SavedSearchFrequency;
  lastRunAt: string | null;
  createdAt: string;
}

export function getSavedCars(accessToken: string): Promise<SavedCar[]> {
  return apiGet<SavedCar[]>("/saved/cars", { token: accessToken });
}

export function saveCar(
  listingId: string,
  accessToken: string,
): Promise<{ id: string; listingId: string; priceAedAtSave: number }> {
  return apiPost(`/saved/cars/${encodeURIComponent(listingId)}`, {}, {
    token: accessToken,
  });
}

export function unsaveCar(
  listingId: string,
  accessToken: string,
): Promise<unknown> {
  return apiDelete(`/saved/cars/${encodeURIComponent(listingId)}`, {
    token: accessToken,
  });
}

export function getSavedSearches(accessToken: string): Promise<SavedSearch[]> {
  return apiGet<SavedSearch[]>("/saved/searches", { token: accessToken });
}

/** `query` must be an object (the serialized /cars params), not a string. */
export function createSavedSearch(
  input: {
    name: string;
    query: Record<string, string>;
    frequency?: SavedSearchFrequency;
  },
  accessToken: string,
): Promise<SavedSearch> {
  return apiPost<SavedSearch>("/saved/searches", input, { token: accessToken });
}

export function deleteSavedSearch(
  id: string,
  accessToken: string,
): Promise<unknown> {
  return apiDelete(`/saved/searches/${encodeURIComponent(id)}`, {
    token: accessToken,
  });
}

/* ------------------------------------------------------------------ */
/* Missing-trim request — task P1-03 (FR-VS4)                         */
/* ------------------------------------------------------------------ */

/**
 * Free-form payload for POST /taxonomy/trim-requests — the backend stores it as
 * JSON for admin curation (FR-VS4), so trim/year are optional: a seller may only
 * know make + model.
 */
export interface TrimRequestDetails {
  make: string;
  model: string;
  trim?: string;
  year?: number;
}

export function createTrimRequest(
  details: TrimRequestDetails,
  accessToken: string,
): Promise<{ id: string; status: string }> {
  return apiPost(`/taxonomy/trim-requests`, { details }, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Messaging — task P2-01/P2-02 (FR-U3)                               */
/* ------------------------------------------------------------------ */

export interface ConversationSummary {
  id: string;
  listing: {
    id: string;
    slug: string;
    year: number;
    priceAed: number;
    make: { name: string };
    model: { name: string };
    media: { variants: unknown }[];
  };
  counterpart: { id: string; name: string };
  role: "BUYER" | "SELLER";
  lastMessage: { id: string; body: string; senderId: string; createdAt: string } | null;
  lastMessageAt: string | null;
  unread: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  attachmentKey: string | null;
  createdAt: string;
  readAt: string | null;
}

export function openConversation(
  listingId: string,
  accessToken: string,
): Promise<{ id: string; listingId: string; buyerId: string; sellerId: string }> {
  return apiPost("/conversations", { listingId }, { token: accessToken });
}

export function getConversations(accessToken: string): Promise<ConversationSummary[]> {
  return apiGet<ConversationSummary[]>("/conversations", { token: accessToken });
}

export function getUnreadMessageCount(
  accessToken: string,
): Promise<{ unread: number }> {
  return apiGet("/conversations/unread-count", { token: accessToken });
}

export function getMessages(
  conversationId: string,
  accessToken: string,
): Promise<{ conversationId: string; messages: ChatMessage[] }> {
  return apiGet(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
    token: accessToken,
  });
}

export function sendMessage(
  conversationId: string,
  body: string,
  accessToken: string,
): Promise<ChatMessage> {
  return apiPost(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { body },
    { token: accessToken },
  );
}

export function markConversationRead(
  conversationId: string,
  accessToken: string,
): Promise<{ read: boolean }> {
  return apiPost(
    `/conversations/${encodeURIComponent(conversationId)}/read`,
    {},
    { token: accessToken },
  );
}

export function blockUser(
  userId: string,
  accessToken: string,
  reason?: string,
): Promise<unknown> {
  return apiPost("/conversations/block", { userId, reason }, { token: accessToken });
}

export function unblockUser(userId: string, accessToken: string): Promise<unknown> {
  return apiPost("/conversations/unblock", { userId }, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Leads — task P2-03 (FR-D2)                                         */
/* ------------------------------------------------------------------ */

export interface RevealedContact {
  type: "CALL" | "WHATSAPP";
  phone: string | null;
  whatsappUrl: string | null;
  sellerName: string | null;
}

/**
 * Contact details are fetched on interaction only — they must never appear in
 * the rendered HTML (FR-D6). Works signed-out; the token, when present, lets
 * the backend dedupe repeat taps by the same person.
 */
export function revealContact(
  listingId: string,
  type: "CALL" | "WHATSAPP",
  opts: { accessToken?: string; source?: string } = {},
): Promise<RevealedContact> {
  return apiPost(
    `/listings/${encodeURIComponent(listingId)}/reveal-contact`,
    { type, source: opts.source },
    { token: opts.accessToken },
  );
}

export function submitLeadForm(
  listingId: string,
  input: { name: string; email?: string; phone?: string; message?: string; source?: string },
  accessToken?: string,
): Promise<{ submitted: boolean }> {
  return apiPost(
    `/listings/${encodeURIComponent(listingId)}/lead-form`,
    input,
    { token: accessToken },
  );
}

/* ------------------------------------------------------------------ */
/* Notifications — task P2-04 (FR-U4)                                 */
/* ------------------------------------------------------------------ */

export interface NotificationRow {
  id: string;
  type: string;
  payload: Record<string, string> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  event: string;
  mandatory: boolean;
  channels: { channel: "IN_APP" | "EMAIL"; enabled: boolean }[];
}

export function getNotifications(accessToken: string): Promise<NotificationRow[]> {
  return apiGet<NotificationRow[]>("/notifications", { token: accessToken });
}

export function getUnreadNotificationCount(
  accessToken: string,
): Promise<{ unread: number }> {
  return apiGet("/notifications/unread-count", { token: accessToken });
}

export function markNotificationsRead(accessToken: string): Promise<{ read: boolean }> {
  return apiPost("/notifications/read-all", {}, { token: accessToken });
}

export function getNotificationPreferences(
  accessToken: string,
): Promise<NotificationPreference[]> {
  return apiGet<NotificationPreference[]>("/notifications/preferences", {
    token: accessToken,
  });
}

export function setNotificationPreference(
  input: { event: string; channel: "IN_APP" | "EMAIL"; enabled: boolean },
  accessToken: string,
): Promise<NotificationPreference[]> {
  return apiPost<NotificationPreference[]>("/notifications/preferences", input, {
    token: accessToken,
  });
}

/* ------------------------------------------------------------------ */
/* My listings actions — task P2-05 (FR-U5, FR-L1)                    */
/* ------------------------------------------------------------------ */

export function pauseListing(id: string, accessToken: string): Promise<unknown> {
  return apiPost(`/listings/${encodeURIComponent(id)}/pause`, {}, { token: accessToken });
}

export function resumeListing(id: string, accessToken: string): Promise<unknown> {
  return apiPost(`/listings/${encodeURIComponent(id)}/resume`, {}, { token: accessToken });
}

export function markListingSold(id: string, accessToken: string): Promise<unknown> {
  return apiPost(`/listings/${encodeURIComponent(id)}/sold`, {}, { token: accessToken });
}

export function renewListing(id: string, accessToken: string): Promise<unknown> {
  return apiPost(`/listings/${encodeURIComponent(id)}/renew`, {}, { token: accessToken });
}

export function getListingLeadStats(
  id: string,
  accessToken: string,
): Promise<Record<string, number>> {
  return apiGet(`/listings/${encodeURIComponent(id)}/lead-stats`, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Profile + PDPL rights — task P2-05 (PRD §13.4)                     */
/* ------------------------------------------------------------------ */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  locale: string;
  role: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export function getProfile(accessToken: string): Promise<UserProfile> {
  return apiGet<UserProfile>("/users/me", { token: accessToken });
}

export function updateProfile(
  input: { name?: string; phone?: string; locale?: string },
  accessToken: string,
): Promise<UserProfile> {
  return apiPatch<UserProfile>("/users/me", input, { token: accessToken });
}

export function exportMyData(accessToken: string): Promise<Record<string, unknown>> {
  return apiGet("/users/me/export", { token: accessToken });
}

export function deleteMyAccount(
  confirmEmail: string,
  accessToken: string,
): Promise<{ deleted: boolean }> {
  return apiDelete("/users/me", { token: accessToken, body: { confirmEmail } });
}

/** One-click unsubscribe target — signed link from an email, no session needed. */
export function unsubscribeAllEmail(u: string, t: string): Promise<{ unsubscribed: boolean }> {
  return apiPost("/notifications/unsubscribe", { u, t });
}

/* ------------------------------------------------------------------ */
/* Compare v2 — task P2-06 (FR-CV2–CV4, CV6)                          */
/* ------------------------------------------------------------------ */

export type ComparePriority =
  | "price"
  | "fuelEconomy"
  | "performance"
  | "space"
  | "tech"
  | "resale";

export const COMPARE_PRIORITIES: ComparePriority[] = [
  "price",
  "fuelEconomy",
  "performance",
  "space",
  "tech",
  "resale",
];

export interface CompareMember {
  kind: "LISTING" | "MODEL";
  listingSlug?: string;
  trimId?: string;
  year?: number;
  regionalSpec?: string;
}

export interface CompareColumn {
  kind: "LISTING" | "MODEL";
  key: string;
  title: string;
  slug: string | null;
  listingId: string | null;
  trimId: string | null;
  year: number;
  priceAed: number | null;
  mileageKm: number | null;
  coverKey: string | null;
  liveCount?: number;
}

export interface CompareRow {
  key: string;
  group: string;
  label: string;
  unit: string | null;
  values: (string | null)[];
  winners: number[];
  identical: boolean;
}

export interface CompareScores {
  weights: Record<ComparePriority, number>;
  breakdown: Record<string, (number | null)[]>;
  totals: (number | null)[];
  winner: number;
}

export interface CompareResult {
  mode: "LISTING" | "MODEL" | "MIXED";
  columns: CompareColumn[];
  rows: CompareRow[];
  scores: CompareScores;
  sharedSlug?: string;
}

export function buildCompare(
  members: CompareMember[],
  weights?: Record<string, number>,
): Promise<CompareResult> {
  return apiPost<CompareResult>("/compare/build", { members, weights });
}

export interface QuizAnswers {
  vehicleType?: "CAR" | "BIKE";
  bodyTypeId?: string;
  budgetMin?: number;
  budgetMax?: number;
  seats?: number;
  usage?: string[];
  priorityRanking?: string[];
}

export interface QuizResponse {
  weights: Record<ComparePriority, number>;
  suggestions: { slug: string; title: string; score: number }[];
  quizResultId: string | null;
}

export function submitQuiz(
  answers: QuizAnswers,
  accessToken?: string,
): Promise<QuizResponse> {
  return apiPost<QuizResponse>("/compare/quiz", answers, { token: accessToken });
}

export function saveCompareSet(
  members: CompareMember[],
  weights?: Record<string, number>,
  accessToken?: string,
): Promise<{ id: string; sharedSlug: string; mode: string; createdAt: string }> {
  return apiPost("/compare/sets", { members, weights }, { token: accessToken });
}

export function getCompareSet(slug: string): Promise<CompareResult & { sharedSlug: string }> {
  return apiGet(`/compare/sets/${encodeURIComponent(slug)}`);
}

/* ------------------------------------------------------------------ */
/* Dealer portal — tasks P3-01/02/03/06/09                            */
/* ------------------------------------------------------------------ */

export type DealerMemberRole = "OWNER" | "MANAGER" | "SALES";

export interface DealerPermissions {
  dealerId: string;
  role: DealerMemberRole | null;
  isStaff: boolean;
  canSeeAllLeads: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;
}

export interface DealerBranch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  hours: Record<string, string> | null;
  emirate: { name: string; slug?: string };
}

export interface DealerMemberRow {
  id: string;
  role: DealerMemberRole;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface DealerProfile {
  id: string;
  slug: string;
  name: string;
  aboutI18n: Record<string, string> | null;
  logoKey: string | null;
  coverKey: string | null;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verificationNote?: string | null;
  brands: string[];
  services: string[];
  createdAt: string;
  branches: DealerBranch[];
  members?: DealerMemberRow[];
}

export interface DealerContextResponse {
  dealer: DealerProfile | null;
  role?: DealerMemberRole | null;
  permissions?: DealerPermissions;
}

export function getMyDealer(
  accessToken: string,
  dealerId?: string,
): Promise<DealerContextResponse> {
  const suffix = dealerId ? `?dealerId=${encodeURIComponent(dealerId)}` : "";
  return apiGet<DealerContextResponse>(`/dealers/me${suffix}`, { token: accessToken });
}

export function getPublicDealer(
  slug: string,
): Promise<DealerProfile & { liveListings: number; _count: { listings: number } }> {
  return apiGet(`/dealers/by-slug/${encodeURIComponent(slug)}`);
}

export function createDealer(
  input: { name: string; about?: string; trn?: string; brands?: string[] },
  accessToken: string,
): Promise<DealerProfile> {
  return apiPost<DealerProfile>("/dealers", input, { token: accessToken });
}

export function updateDealer(
  dealerId: string,
  input: Partial<{
    name: string;
    about: string;
    trn: string;
    brands: string[];
    services: string[];
    logoKey: string;
    coverKey: string;
  }>,
  accessToken: string,
): Promise<DealerProfile> {
  return apiPatch<DealerProfile>(`/dealers/${encodeURIComponent(dealerId)}`, input, {
    token: accessToken,
  });
}

export function getDealerMembers(
  dealerId: string,
  accessToken: string,
): Promise<DealerMemberRow[]> {
  return apiGet<DealerMemberRow[]>(
    `/dealers/${encodeURIComponent(dealerId)}/members`,
    { token: accessToken },
  );
}

export function setDealerMemberRole(
  dealerId: string,
  memberId: string,
  role: DealerMemberRole,
  accessToken: string,
): Promise<DealerMemberRow> {
  return apiPatch(
    `/dealers/${encodeURIComponent(dealerId)}/members/${encodeURIComponent(memberId)}`,
    { role },
    { token: accessToken },
  );
}

export function removeDealerMember(
  dealerId: string,
  memberId: string,
  accessToken: string,
): Promise<{ removed: boolean }> {
  return apiDelete(
    `/dealers/${encodeURIComponent(dealerId)}/members/${encodeURIComponent(memberId)}`,
    { token: accessToken },
  );
}

export function addDealerBranch(
  dealerId: string,
  input: {
    name: string;
    emirateId: string;
    address?: string;
    phone?: string;
    hours?: Record<string, string>;
  },
  accessToken: string,
): Promise<DealerBranch> {
  return apiPost(`/dealers/${encodeURIComponent(dealerId)}/branches`, input, {
    token: accessToken,
  });
}

export function removeDealerBranch(
  dealerId: string,
  branchId: string,
  accessToken: string,
): Promise<{ deleted: boolean }> {
  return apiDelete(
    `/dealers/${encodeURIComponent(dealerId)}/branches/${encodeURIComponent(branchId)}`,
    { token: accessToken },
  );
}

/* Subscription + quota */

export interface QuotaState {
  dealerId: string;
  subscriptionId: string | null;
  status: string | null;
  quota: number;
  occupied: number;
  remaining: number;
  canPublish: boolean;
  reason?: "NO_SUBSCRIPTION" | "SUBSCRIPTION_IN_GRACE" | "QUOTA_EXCEEDED";
}

export interface SubscriptionRow {
  id: string;
  status: "PENDING_PAYMENT" | "ACTIVE" | "GRACE" | "EXPIRED" | "CANCELLED";
  startsAt: string;
  endsAt: string;
  graceEndsAt: string | null;
  quotaGraceEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  terms: {
    tier: string;
    name: string;
    listingQuota: number;
    boostCredits: number;
    priceAed: number;
    termMonths: number;
  } | null;
  package: { tier: string; name: string; priceAed?: number };
}

export interface DealerInvoiceRow {
  id: string;
  number: string | null;
  status: "ISSUED" | "PAID";
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  grandTotalAed: string;
  creditedTotalAed: string;
  paidAt: string | null;
  pdfKey: string | null;
}

export function getDealerQuota(
  dealerId: string,
  accessToken: string,
): Promise<QuotaState> {
  return apiGet(`/dealers/${encodeURIComponent(dealerId)}/subscription/quota`, {
    token: accessToken,
  });
}

export function getDealerSubscription(
  dealerId: string,
  accessToken: string,
): Promise<{ current: SubscriptionRow | null; history: SubscriptionRow[]; quota: QuotaState }> {
  return apiGet(`/dealers/${encodeURIComponent(dealerId)}/subscription`, {
    token: accessToken,
  });
}

export function getDealerInvoices(
  dealerId: string,
  accessToken: string,
  params: { limit?: number; offset?: number } = {},
): Promise<{ items: DealerInvoiceRow[]; total: number; limit: number; offset: number }> {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiGet(
    `/dealers/${encodeURIComponent(dealerId)}/subscription/invoices${suffix}`,
    { token: accessToken },
  );
}

export interface PackageRow {
  id: string;
  tier: string;
  name: string;
  listingQuota: number;
  boostCredits: number;
  priceAed: number;
  termMonths: number;
}

export function getPackages(): Promise<PackageRow[]> {
  return apiGet<PackageRow[]>("/packages");
}

/* ------------------------------------------------------------------ */
/* Dealer leads inbox — task P3-04 (FR-DP4)                           */
/* ------------------------------------------------------------------ */

export type LeadStatus = "NEW" | "CONTACTED" | "WON" | "LOST";
export type LeadType = "CALL" | "WHATSAPP" | "CHAT" | "FORM";

/** Allowed moves per status — mirrors the backend LEAD_TRANSITIONS map. */
export const LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CONTACTED", "WON", "LOST"],
  CONTACTED: ["WON", "LOST", "NEW"],
  WON: ["CONTACTED"],
  LOST: ["CONTACTED"],
};

export interface LeadBuyer {
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
}

export interface LeadListingRef {
  id: string;
  slug: string;
  year: number;
  priceAed: number;
  make: { name: string };
  model: { name: string };
}

export interface LeadRow {
  id: string;
  type: LeadType;
  status: LeadStatus;
  source: string;
  createdAt: string;
  statusChangedAt: string | null;
  assigneeId: string | null;
  listing: LeadListingRef | null;
  buyer: LeadBuyer;
  noteCount: number;
}

export interface LeadNoteRow {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null };
}

export interface LeadDetail extends Omit<LeadRow, "noteCount"> {
  notes: LeadNoteRow[];
}

export interface LeadFeedParams {
  status?: LeadStatus;
  type?: LeadType;
  assigneeId?: string;
  listingId?: string;
  limit?: number;
  offset?: number;
}

const leadQs = (params: LeadFeedParams) => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.type) qs.set("type", params.type);
  if (params.assigneeId) qs.set("assigneeId", params.assigneeId);
  if (params.listingId) qs.set("listingId", params.listingId);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  return qs.toString() ? `?${qs}` : "";
};

export function getLeadSummary(
  dealerId: string,
  accessToken: string,
): Promise<Record<LeadStatus, number>> {
  return apiGet(`/dealers/${encodeURIComponent(dealerId)}/leads/summary`, {
    token: accessToken,
  });
}

export function getLeadFeed(
  dealerId: string,
  params: LeadFeedParams,
  accessToken: string,
): Promise<{ items: LeadRow[]; total: number; limit: number; offset: number }> {
  return apiGet(
    `/dealers/${encodeURIComponent(dealerId)}/leads${leadQs(params)}`,
    { token: accessToken },
  );
}

export function getLead(
  dealerId: string,
  leadId: string,
  accessToken: string,
): Promise<LeadDetail> {
  return apiGet(
    `/dealers/${encodeURIComponent(dealerId)}/leads/${encodeURIComponent(leadId)}`,
    { token: accessToken },
  );
}

export function setLeadStatus(
  dealerId: string,
  leadId: string,
  status: LeadStatus,
  accessToken: string,
): Promise<LeadDetail> {
  return apiPatch(
    `/dealers/${encodeURIComponent(dealerId)}/leads/${encodeURIComponent(leadId)}/status`,
    { status },
    { token: accessToken },
  );
}

export function assignLead(
  dealerId: string,
  leadId: string,
  assigneeId: string | null,
  accessToken: string,
): Promise<LeadDetail> {
  return apiPatch(
    `/dealers/${encodeURIComponent(dealerId)}/leads/${encodeURIComponent(leadId)}/assign`,
    { assigneeId },
    { token: accessToken },
  );
}

export function addLeadNote(
  dealerId: string,
  leadId: string,
  body: string,
  accessToken: string,
): Promise<LeadNoteRow> {
  return apiPost(
    `/dealers/${encodeURIComponent(dealerId)}/leads/${encodeURIComponent(leadId)}/notes`,
    { body },
    { token: accessToken },
  );
}

/**
 * CSV export needs the Authorization header, so it cannot be a plain <a href>.
 * Fetch the blob and hand it to the browser as a download.
 */
export async function downloadLeadsCsv(
  dealerId: string,
  params: LeadFeedParams,
  accessToken: string,
): Promise<Blob> {
  const { API_BASE_URL } = await import("@/lib/api");
  const res = await fetch(
    `${API_BASE_URL}/dealers/${encodeURIComponent(dealerId)}/leads/export.csv${leadQs(params)}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`CSV export failed (${res.status})`);
  return res.blob();
}

/* ------------------------------------------------------------------ */
/* Boosts — task P3-08 (FR-DP6)                                       */
/* ------------------------------------------------------------------ */

export interface BoostProductRow {
  id: string;
  key: string;
  name: string;
  slot: "TOP_OF_SEARCH" | "HOME_FEATURED" | "HIGHLIGHT";
  durationDays: number;
  creditCost: number;
}

export interface BoostRow {
  id: string;
  listingId: string;
  slot: BoostProductRow["slot"];
  status: "SCHEDULED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  startsAt: string;
  endsAt: string;
  product: { key: string; name: string; slot: BoostProductRow["slot"] };
  listing: {
    slug: string;
    year: number;
    make: { name: string };
    model: { name: string };
  };
}

export interface BoostCreditLotRow {
  id: string;
  source: string;
  remaining: number;
  expiresAt: string | null;
}

export function getBoostProducts(): Promise<BoostProductRow[]> {
  return apiGet<BoostProductRow[]>("/boost-products");
}

export function getDealerBoosts(
  dealerId: string,
  accessToken: string,
): Promise<{ boosts: BoostRow[]; balance: number; lots: BoostCreditLotRow[] }> {
  return apiGet(`/dealers/${encodeURIComponent(dealerId)}/boosts`, {
    token: accessToken,
  });
}

export function applyBoost(
  dealerId: string,
  input: { listingId: string; productKey: string; startsAt?: string },
  accessToken: string,
): Promise<BoostRow> {
  return apiPost(`/dealers/${encodeURIComponent(dealerId)}/boosts`, input, {
    token: accessToken,
  });
}

export function cancelBoost(
  dealerId: string,
  boostId: string,
  accessToken: string,
): Promise<BoostRow> {
  return apiPost(
    `/dealers/${encodeURIComponent(dealerId)}/boosts/${encodeURIComponent(boostId)}/cancel`,
    {},
    { token: accessToken },
  );
}

/* ------------------------------------------------------------------ */
/* Dealer analytics — task P3-05 (FR-DP5)                             */
/* ------------------------------------------------------------------ */

export interface DealerAnalytics {
  rangeDays: number;
  totals: { views: number; leads: number; liveListings: number };
  viewsSeries: { date: string; views: number }[];
  leadsSeries: { date: string; leads: number }[];
  sourceSplit: { type: string; count: number }[];
  topListings: {
    id: string;
    slug: string;
    year: number;
    makeName: string;
    modelName: string;
    priceAed: number;
    status: string;
    views: number;
    leads: number;
  }[];
}

export function getDealerAnalytics(
  dealerId: string,
  days: number,
  accessToken: string,
): Promise<DealerAnalytics> {
  return apiGet(
    `/dealers/${encodeURIComponent(dealerId)}/analytics?days=${days}`,
    { token: accessToken },
  );
}

/* ------------------------------------------------------------------ */
/* Dealer verification — task P3-01 (FR-DP9)                          */
/* ------------------------------------------------------------------ */

/** Submit an uploaded licence key; the backend ClamAV-gates it synchronously. */
export function submitDealerVerification(
  dealerId: string,
  tradeLicenseKey: string,
  accessToken: string,
): Promise<{ verificationStatus: string; scanVerdict: string }> {
  return apiPost(
    `/dealers/${encodeURIComponent(dealerId)}/verification`,
    { tradeLicenseKey },
    { token: accessToken },
  );
}
