/**
 * Billing workspace API wrappers — /admin/billing.
 *
 * Kept out of components/admin/api.ts on purpose: that file is the shared
 * admin surface and this one owns the four money backends behind the billing
 * screen. Same conventions — typed interfaces beside the functions, every call
 * takes an ADMIN/SUPER_ADMIN bearer token, errors surface as ApiError so the
 * UI can print the server's own refusal text.
 *
 * Shapes verified live against http://localhost:4000/api/v1 (2026-08-31):
 *   GET  /admin/invoices            invoices.controller.ts
 *   GET  /admin/credit-notes        credit-notes.controller.ts
 *   GET  /finance/receipts          finance-ar.controller.ts
 *   GET  /admin/payments            payments.controller.ts
 *
 * MONEY: every Decimal(12,2) column arrives as a *string* ("1575", "52.5") and
 * is already in AED. Never divide, never parseInt — format with `formatAed`.
 */
import { apiGet, apiPost } from "@/lib/api";

/** Decimal(12,2) AED as the API sends it: a decimal string, sometimes a number. */
export type MoneyAed = string | number;

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** "AED 1,575.00" — thousands separators, Latin digits, never divided by 100. */
export function formatAed(value: MoneyAed | null | undefined, locale = "en"): string {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `AED ${new Intl.NumberFormat(`${locale}-u-nu-latn`, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe)}`;
}

/** Decimal-string arithmetic guard — the allocation editor sums user input. */
export function toAmount(value: MoneyAed | null | undefined): number {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

/* ------------------------------------------------------------------ */
/* Invoices — admin/invoices                                           */
/* ------------------------------------------------------------------ */

export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "PAID", "VOID"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_KINDS = ["SUBSCRIPTION", "BOOST_TOPUP", "OTHER"] as const;
export type InvoiceKind = (typeof INVOICE_KINDS)[number];

export const VAT_CATEGORIES = ["S", "Z", "E", "O"] as const;
export type VatCategory = (typeof VAT_CATEGORIES)[number];

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: MoneyAed;
  unitPriceAed: MoneyAed;
  discountAed: MoneyAed;
  lineNetAed: MoneyAed;
  vatRate: MoneyAed;
  vatAmountAed: MoneyAed;
  totalAed: MoneyAed;
  vatCategoryCode: string;
  unitCode: string;
  sortOrder: number;
}

export interface VatBreakdownRow {
  rate: string;
  taxAmount: string;
  categoryCode: string;
  taxableAmount: string;
  exemptionReasonCode: string | null;
  exemptionReasonText: string | null;
}

/** GET /admin/invoices item. `number` is null until issuance allocates one. */
export interface InvoiceRow {
  id: string;
  number: string | null;
  series: string | null;
  status: InvoiceStatus;
  kind: InvoiceKind;
  currency: string;
  dealerId: string;
  subtotalAed: MoneyAed;
  vatTotalAed: MoneyAed;
  grandTotalAed: MoneyAed;
  creditedTotalAed?: MoneyAed;
  issueDate: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  buyerTrn: string | null;
  dealer: { id: string; name: string } | null;
  emirate: { name: string } | null;
  _count?: { lines: number; creditNotes: number };
}

export interface InvoiceDetail extends InvoiceRow {
  uuid: string | null;
  sellerTrn: string | null;
  sellerName: string | null;
  buyerName: string | null;
  notes: string | null;
  voidReason: string | null;
  payableAed: MoneyAed;
  prepaidAed: MoneyAed;
  vatBreakdown: VatBreakdownRow[] | null;
  /** grandTotal − creditedTotal, pre-computed by the service for the UI. */
  remainingCreditableAed: string;
  lines: InvoiceLine[];
  creditNotes: { id: string; number: string | null; status: string; grandTotalAed: MoneyAed }[];
}

export interface DraftInvoiceLineInput {
  description: string;
  quantity?: number;
  unitPriceAed: number;
  discountAed?: number;
  vatRate?: number;
  vatCategoryCode?: VatCategory;
  vatExemptionReasonCode?: string;
}

export interface CreateInvoiceInput {
  dealerId: string;
  emirateId: string;
  kind?: InvoiceKind;
  dueDate?: string;
  notes?: string;
  lines: DraftInvoiceLineInput[];
}

export function listInvoices(
  accessToken: string,
  params: {
    status?: InvoiceStatus;
    dealerId?: string;
    overdueOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {},
): Promise<Page<InvoiceRow>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.dealerId) query.set("dealerId", params.dealerId);
  if (params.overdueOnly) query.set("overdueOnly", "true");
  query.set("limit", String(params.limit ?? 25));
  query.set("offset", String(params.offset ?? 0));
  return apiGet<Page<InvoiceRow>>(`/admin/invoices?${query.toString()}`, { token: accessToken });
}

export function getInvoice(id: string, accessToken: string): Promise<InvoiceDetail> {
  return apiGet<InvoiceDetail>(`/admin/invoices/${id}`, { token: accessToken });
}

export function createInvoiceDraft(
  input: CreateInvoiceInput,
  accessToken: string,
): Promise<InvoiceRow> {
  return apiPost<InvoiceRow>("/admin/invoices", input, { token: accessToken });
}

/** Irreversible: validates PINT AE and burns the next gap-free series number. */
export function issueInvoice(id: string, accessToken: string): Promise<InvoiceRow> {
  return apiPost<InvoiceRow>(`/admin/invoices/${id}/issue`, {}, { token: accessToken });
}

/** DRAFT only — an issued invoice is corrected with a credit note, never voided. */
export function voidInvoiceDraft(
  id: string,
  reason: string,
  accessToken: string,
): Promise<InvoiceRow> {
  return apiPost<InvoiceRow>(`/admin/invoices/${id}/void`, { reason }, { token: accessToken });
}

export function markInvoicePaid(
  id: string,
  input: { paidAt?: string; paymentMethod?: string; paymentRef?: string; note?: string },
  accessToken: string,
): Promise<InvoiceRow> {
  return apiPost<InvoiceRow>(`/admin/invoices/${id}/mark-paid`, input, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Credit notes — admin/credit-notes (maker–checker)                   */
/* ------------------------------------------------------------------ */

export const CREDIT_NOTE_STATUSES = ["DRAFT", "PENDING_APPROVAL", "ISSUED", "REJECTED"] as const;
export type CreditNoteStatus = (typeof CREDIT_NOTE_STATUSES)[number];

export const CREDIT_NOTE_REASONS = [
  "CANCELLATION",
  "DOWNGRADE",
  "DISCOUNT",
  "BILLING_ERROR",
  "BAD_DEBT",
] as const;
export type CreditNoteReason = (typeof CREDIT_NOTE_REASONS)[number];

export interface CreditNoteRow {
  id: string;
  number: string | null;
  status: CreditNoteStatus;
  reason: CreditNoteReason;
  reasonText: string | null;
  invoiceId: string;
  originalNumber: string | null;
  subtotalAed: MoneyAed;
  vatAmountAed: MoneyAed;
  grandTotalAed: MoneyAed;
  issueDate: string | null;
  createdAt: string;
  /** Maker–checker trail. The API returns actor ids only, never names. */
  submittedById: string | null;
  submittedAt: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedById: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  invoice: { number: string | null } | null;
  dealer: { id: string; name: string } | null;
  _count?: { lines: number };
}

export interface CreateCreditNoteInput {
  invoiceId: string;
  reason: CreditNoteReason;
  reasonText?: string;
  lines: { description?: string; quantity?: number; unitPriceAed: number; vatRate?: number }[];
}

export function listCreditNotes(
  accessToken: string,
  params: { status?: CreditNoteStatus; invoiceId?: string; limit?: number; offset?: number } = {},
): Promise<Page<CreditNoteRow>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.invoiceId) query.set("invoiceId", params.invoiceId);
  query.set("limit", String(params.limit ?? 25));
  query.set("offset", String(params.offset ?? 0));
  return apiGet<Page<CreditNoteRow>>(`/admin/credit-notes?${query.toString()}`, {
    token: accessToken,
  });
}

export function createCreditNote(
  input: CreateCreditNoteInput,
  accessToken: string,
): Promise<CreditNoteRow> {
  return apiPost<CreditNoteRow>("/admin/credit-notes", input, { token: accessToken });
}

/** Maker step. */
export function submitCreditNote(id: string, accessToken: string): Promise<CreditNoteRow> {
  return apiPost<CreditNoteRow>(`/admin/credit-notes/${id}/submit`, {}, { token: accessToken });
}

/** Checker step — the backend refuses when the approver is the submitter. */
export function approveCreditNote(id: string, accessToken: string): Promise<CreditNoteRow> {
  return apiPost<CreditNoteRow>(`/admin/credit-notes/${id}/approve`, {}, { token: accessToken });
}

export function rejectCreditNote(
  id: string,
  reason: string,
  accessToken: string,
): Promise<CreditNoteRow> {
  return apiPost<CreditNoteRow>(
    `/admin/credit-notes/${id}/reject`,
    { reason },
    { token: accessToken },
  );
}

/* ------------------------------------------------------------------ */
/* Receipts — finance/receipts                                         */
/* ------------------------------------------------------------------ */

export const RECEIPT_STATUSES = ["PENDING_APPROVAL", "RECORDED", "REJECTED"] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export const RECEIPT_METHODS = ["BANK_TRANSFER", "CHEQUE", "CASH", "CARD", "OTHER"] as const;
export type ReceiptMethod = (typeof RECEIPT_METHODS)[number];

export interface ReceiptAllocation {
  id: string;
  invoiceId: string;
  amountAed: MoneyAed;
}

export interface ReceiptRow {
  id: string;
  number: string | null;
  status: ReceiptStatus;
  method: string;
  amountAed: MoneyAed;
  receivedAt: string;
  reference: string | null;
  note: string | null;
  createdById: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedById: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  allocations: ReceiptAllocation[];
  dealer: { name: string } | null;
}

export interface CreateReceiptInput {
  dealerId: string;
  method: ReceiptMethod;
  amountAed: number;
  receivedAt: string;
  reference?: string;
  note?: string;
  /** No bank evidence → PENDING_APPROVAL for a second approver (FR-FN11). */
  manualMarkPaid?: boolean;
  allocations: { invoiceId: string; amountAed: number }[];
}

export function listReceipts(
  accessToken: string,
  params: { status?: ReceiptStatus; dealerId?: string; limit?: number; offset?: number } = {},
): Promise<Page<ReceiptRow>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.dealerId) query.set("dealerId", params.dealerId);
  query.set("limit", String(params.limit ?? 25));
  query.set("offset", String(params.offset ?? 0));
  return apiGet<Page<ReceiptRow>>(`/finance/receipts?${query.toString()}`, { token: accessToken });
}

/**
 * Records a receipt and splits it across invoices. The backend refuses an
 * over-allocation with `ALLOCATION_OVERPAYS: invoice INV-… has N AED
 * outstanding, allocation is M AED` — show that text verbatim.
 */
export function createReceipt(
  input: CreateReceiptInput,
  accessToken: string,
): Promise<ReceiptRow> {
  return apiPost<ReceiptRow>("/finance/receipts", input, { token: accessToken });
}

export function approveReceipt(id: string, accessToken: string): Promise<ReceiptRow> {
  return apiPost<ReceiptRow>(`/finance/receipts/${id}/approve`, {}, { token: accessToken });
}

export function rejectReceipt(
  id: string,
  reason: string,
  accessToken: string,
): Promise<ReceiptRow> {
  return apiPost<ReceiptRow>(
    `/finance/receipts/${id}/reject`,
    { reason },
    { token: accessToken },
  );
}

/* ------------------------------------------------------------------ */
/* Payments — admin/payments                                           */
/* ------------------------------------------------------------------ */

export const PAYMENT_STATUSES = [
  "REQUIRES_ACTION",
  "PENDING_CONFIRMATION",
  "PROCESSING",
  "SETTLED",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "BLOCKED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = [
  "manual",
  "sandbox",
  "telr",
  "paytabs",
  "stripe",
  "network_international",
] as const;
export type PaymentProviderName = (typeof PAYMENT_PROVIDERS)[number];

export interface PaymentRow {
  id: string;
  reference: string;
  status: PaymentStatus;
  provider: string;
  method: string;
  amountAed: MoneyAed;
  currency: string;
  providerRef: string | null;
  declaredRef: string | null;
  declaredAt: string | null;
  failureCode: string | null;
  expiresAt: string | null;
  settledAt: string | null;
  receiptId: string | null;
  createdAt: string;
  dealer: { id: string; name: string; slug: string } | null;
  invoice: { number: string | null; grandTotalAed: MoneyAed; status: string } | null;
}

/**
 * GET /admin/payments/provider. `credentials` is PRESENCE ONLY — booleans.
 * There is no route that returns a secret value and the UI must not pretend
 * otherwise. `blockedReason` set means the platform cannot take payment.
 */
export interface PaymentProviderStatus {
  provider: PaymentProviderName;
  implemented: boolean;
  canCharge: boolean;
  blockedReason: string | null;
  credentials: { apiKey: boolean; webhookSecret: boolean };
  available: PaymentProviderName[];
}

export function listPayments(
  accessToken: string,
  params: { status?: PaymentStatus; limit?: number; offset?: number } = {},
): Promise<Page<PaymentRow>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  query.set("limit", String(params.limit ?? 25));
  query.set("offset", String(params.offset ?? 0));
  return apiGet<Page<PaymentRow>>(`/admin/payments?${query.toString()}`, { token: accessToken });
}

export function getPaymentProvider(accessToken: string): Promise<PaymentProviderStatus> {
  return apiGet<PaymentProviderStatus>("/admin/payments/provider", { token: accessToken });
}

export function setPaymentProvider(
  provider: PaymentProviderName,
  accessToken: string,
): Promise<PaymentProviderStatus> {
  return apiPost<PaymentProviderStatus>(
    "/admin/payments/provider",
    { provider },
    { token: accessToken },
  );
}

/** Real money: writes the receipt and settles the invoice. */
export function confirmPayment(id: string, accessToken: string): Promise<PaymentRow> {
  return apiPost<PaymentRow>(`/admin/payments/${id}/confirm`, {}, { token: accessToken });
}

export function rejectPayment(
  id: string,
  reason: string,
  accessToken: string,
): Promise<PaymentRow> {
  return apiPost<PaymentRow>(`/admin/payments/${id}/reject`, { reason }, { token: accessToken });
}

/* ------------------------------------------------------------------ */
/* Reference data for the pickers                                      */
/* ------------------------------------------------------------------ */

export interface BillingDealerOption {
  id: string;
  name: string;
  slug: string;
  /** Issuance hard-fails without a buyer TRN (Art. 59 / BT-48). */
  trn: string | null;
  status: string;
}

export function listBillingDealers(
  accessToken: string,
  params: { search?: string; limit?: number } = {},
): Promise<Page<BillingDealerOption>> {
  const query = new URLSearchParams();
  // The directory matches name / slug / TRN on `q`, and caps limit at 100.
  if (params.search) query.set("q", params.search);
  query.set("sort", "name");
  query.set("limit", String(Math.min(params.limit ?? 100, 100)));
  return apiGet<Page<BillingDealerOption>>(`/admin/dealers?${query.toString()}`, {
    token: accessToken,
  });
}

export interface EmirateOption {
  id: string;
  slug: string;
  name: string;
}

/** Emirate of supply drives the VAT201 Box 1 breakdown, so it is mandatory. */
export function listEmirates(): Promise<EmirateOption[]> {
  return apiGet<{ emirates: EmirateOption[] }>("/taxonomy/meta").then((meta) => meta.emirates ?? []);
}
