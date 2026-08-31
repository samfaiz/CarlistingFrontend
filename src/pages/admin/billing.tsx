/**
 * /admin/billing — the billing workspace over the four money backends that
 * had no UI: invoices, credit notes, receipts and payments.
 *
 * Two rules from the domain drive the whole screen:
 *
 * 1. An ISSUED invoice is IMMUTABLE. There is no edit control anywhere on this
 *    page for anything past DRAFT, because the backend has no PATCH/PUT to
 *    call — corrections go through a credit note, and that is offered instead.
 * 2. Confirming a payment and approving a receipt move real money. Both are
 *    behind a dialog that names the dealership, the invoice and the amount.
 *
 * Maker–checker (FR-FN11) is surfaced rather than hidden: a credit note or a
 * manual mark-paid you submitted yourself shows a disabled Approve with the
 * reason, so nobody discovers the rule from a 422.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  approveCreditNote,
  approveReceipt,
  confirmPayment,
  createCreditNote,
  createInvoiceDraft,
  createReceipt,
  formatAed,
  getInvoice,
  getPaymentProvider,
  issueInvoice,
  listBillingDealers,
  listCreditNotes,
  listEmirates,
  listInvoices,
  listPayments,
  listReceipts,
  markInvoicePaid,
  rejectCreditNote,
  rejectPayment,
  rejectReceipt,
  setPaymentProvider,
  submitCreditNote,
  toAmount,
  voidInvoiceDraft,
  CREDIT_NOTE_REASONS,
  INVOICE_KINDS,
  PAYMENT_PROVIDERS,
  RECEIPT_METHODS,
  VAT_CATEGORIES,
  type BillingDealerOption,
  type CreditNoteReason,
  type CreditNoteRow,
  type CreditNoteStatus,
  type DraftInvoiceLineInput,
  type EmirateOption,
  type InvoiceDetail,
  type InvoiceKind,
  type InvoiceRow,
  type InvoiceStatus,
  type PaymentProviderName,
  type PaymentProviderStatus,
  type PaymentRow,
  type PaymentStatus,
  type ReceiptMethod,
  type ReceiptRow,
  type ReceiptStatus,
  type VatCategory,
} from "@/components/admin/billing-api";
import { DataTable, StatCard, type Column } from "@/components/workspace/data-table";
import { ApiError } from "@/lib/api";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SurfaceCard } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 25;
const MIN_REASON = 5;

type BadgeTone = NonNullable<BadgeProps["variant"]>;

const INVOICE_TONES: Record<InvoiceStatus, BadgeTone> = {
  DRAFT: "neutral",
  ISSUED: "navy",
  PAID: "green",
  VOID: "red",
};

const CREDIT_NOTE_TONES: Record<CreditNoteStatus, BadgeTone> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "amber",
  ISSUED: "green",
  REJECTED: "red",
};

const RECEIPT_TONES: Record<ReceiptStatus, BadgeTone> = {
  PENDING_APPROVAL: "amber",
  RECORDED: "green",
  REJECTED: "red",
};

const PAYMENT_TONES: Record<PaymentStatus, BadgeTone> = {
  REQUIRES_ACTION: "neutral",
  PENDING_CONFIRMATION: "amber",
  PROCESSING: "navy",
  SETTLED: "green",
  FAILED: "red",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
  BLOCKED: "red",
};

/** A blank line so the draft editor always has something to type into. */
const emptyLine = (): DraftInvoiceLineInput => ({
  description: "",
  quantity: 1,
  unitPriceAed: 0,
  discountAed: 0,
  vatRate: 5,
  vatCategoryCode: "S",
});

const todayIso = () => new Date().toISOString().slice(0, 10);

function shortDate(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

/**
 * Every dropdown on this page. Radix rejects an empty SelectItem value, so an
 * unset picker is `undefined` and the placeholder comes from SelectValue.
 */
function Picker<T extends string>({
  id,
  value,
  placeholder,
  options,
  onChange,
}: {
  id: string;
  value: T | "";
  placeholder?: string;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Select value={value || undefined} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function AdminBillingPage() {
  const { t } = useTranslation("admin-billing");
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";
  const currentUserId = session?.user?.id ?? "";

  /** Every 4xx here carries a specific, useful message — print the server's. */
  const fail = React.useCallback(
    (error: unknown, fallbackKey: string) => {
      const message = error instanceof ApiError ? error.message : "";
      toast({
        title: t(fallbackKey),
        description: message || undefined,
        variant: "error",
      });
    },
    [t],
  );

  /* ---------------------------------------------------------------- */
  /* Reference data + summary                                          */
  /* ---------------------------------------------------------------- */

  const [dealers, setDealers] = React.useState<BillingDealerOption[]>([]);
  const [emirates, setEmirates] = React.useState<EmirateOption[]>([]);
  const [provider, setProvider] = React.useState<PaymentProviderStatus | null>(null);
  const [summary, setSummary] = React.useState({
    overdue: 0,
    drafts: 0,
    paymentsPending: 0,
    creditNotesPending: 0,
    receiptsPending: 0,
  });

  const loadSummary = React.useCallback(async () => {
    if (!token) return;
    try {
      const [overdue, drafts, payments, notes, receipts, providerStatus] = await Promise.all([
        listInvoices(token, { overdueOnly: true, limit: 1 }),
        listInvoices(token, { status: "DRAFT", limit: 1 }),
        listPayments(token, { status: "PENDING_CONFIRMATION", limit: 1 }),
        listCreditNotes(token, { status: "PENDING_APPROVAL", limit: 1 }),
        listReceipts(token, { status: "PENDING_APPROVAL", limit: 1 }),
        getPaymentProvider(token),
      ]);
      setSummary({
        overdue: overdue.total,
        drafts: drafts.total,
        paymentsPending: payments.total,
        creditNotesPending: notes.total,
        receiptsPending: receipts.total,
      });
      setProvider(providerStatus);
    } catch (error) {
      fail(error, "toast.summaryFailed");
    }
  }, [token, fail]);

  React.useEffect(() => {
    if (!token) return;
    void loadSummary();
    listBillingDealers(token)
      .then((page) => setDealers(page.items))
      .catch(() => setDealers([]));
    listEmirates()
      .then(setEmirates)
      .catch(() => setEmirates([]));
  }, [token, loadSummary]);

  const dealerOptions = React.useMemo(
    () => dealers.map((dealer) => ({ value: dealer.id, label: dealer.name })),
    [dealers],
  );

  /**
   * Receipt allocations reference invoices by id only, so numbers are resolved
   * once per id and cached — an operator needs "INV-2026-000107", not a cuid.
   */
  const [invoiceNumbers, setInvoiceNumbers] = React.useState<Record<string, string>>({});
  const rememberNumbers = React.useCallback((rows: InvoiceRow[]) => {
    setInvoiceNumbers((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const row of rows) {
        if (row.number && next[row.id] !== row.number) {
          next[row.id] = row.number;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Invoices                                                          */
  /* ---------------------------------------------------------------- */

  const [invoiceFilter, setInvoiceFilter] = React.useState<"ALL" | InvoiceStatus | "OVERDUE">(
    "ALL",
  );
  const [invoices, setInvoices] = React.useState<InvoiceRow[]>([]);
  const [invoiceTotal, setInvoiceTotal] = React.useState(0);
  const [invoiceOffset, setInvoiceOffset] = React.useState(0);
  const [invoicesLoading, setInvoicesLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const loadInvoices = React.useCallback(async () => {
    if (!token) return;
    setInvoicesLoading(true);
    try {
      const page = await listInvoices(token, {
        limit: PAGE_SIZE,
        offset: invoiceOffset,
        ...(invoiceFilter === "OVERDUE"
          ? { overdueOnly: true }
          : invoiceFilter === "ALL"
            ? {}
            : { status: invoiceFilter }),
      });
      setInvoices(page.items);
      setInvoiceTotal(page.total);
      rememberNumbers(page.items);
    } catch (error) {
      fail(error, "toast.invoicesFailed");
    } finally {
      setInvoicesLoading(false);
    }
  }, [token, invoiceFilter, invoiceOffset, fail, rememberNumbers]);

  React.useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const [issuing, setIssuing] = React.useState<InvoiceRow | null>(null);
  const [voiding, setVoiding] = React.useState<InvoiceRow | null>(null);
  const [voidReason, setVoidReason] = React.useState("");
  const [payingInvoice, setPayingInvoice] = React.useState<InvoiceRow | null>(null);
  const [payForm, setPayForm] = React.useState({
    paidAt: todayIso(),
    paymentMethod: "BANK_TRANSFER",
    paymentRef: "",
    note: "",
  });
  const [detail, setDetail] = React.useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const openDetail = async (row: InvoiceRow) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      setDetail(await getInvoice(row.id, token));
    } catch (error) {
      fail(error, "toast.detailFailed");
    } finally {
      setDetailLoading(false);
    }
  };

  const runInvoiceAction = async (
    id: string,
    action: () => Promise<unknown>,
    successKey: string,
    failKey: string,
  ) => {
    setBusyId(id);
    try {
      await action();
      toast({ title: t(successKey), variant: "success" });
      await Promise.all([loadInvoices(), loadSummary()]);
    } catch (error) {
      fail(error, failKey);
    } finally {
      setBusyId(null);
    }
  };

  const invoiceColumns: Column<InvoiceRow>[] = [
    {
      key: "number",
      header: t("invoices.columns.number"),
      isRowHeader: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => void openDetail(row)}
          className="font-semibold text-brand hover:underline"
        >
          {row.number ?? t("invoices.draftLabel")}
        </button>
      ),
    },
    {
      key: "dealer",
      header: t("invoices.columns.dealer"),
      render: (row) => row.dealer?.name ?? "—",
    },
    {
      key: "status",
      header: t("invoices.columns.status"),
      render: (row) => (
        <span className="flex items-center gap-1.5">
          <Badge variant={INVOICE_TONES[row.status]}>{t(`status.invoice.${row.status}`)}</Badge>
          {row.status !== "DRAFT" && (
            <Lock className="size-3 text-muted" aria-label={t("invoices.immutable")} />
          )}
        </span>
      ),
    },
    {
      key: "total",
      header: t("invoices.columns.total"),
      align: "end",
      render: (row) => <span className="font-semibold">{formatAed(row.grandTotalAed)}</span>,
    },
    {
      key: "issued",
      header: t("invoices.columns.issued"),
      render: (row) => shortDate(row.issueDate),
    },
    {
      key: "due",
      header: t("invoices.columns.due"),
      render: (row) => shortDate(row.dueDate),
    },
    {
      key: "actions",
      header: t("invoices.columns.actions"),
      align: "end",
      render: (row) => (
        <span className="flex justify-end gap-1.5">
          {row.status === "DRAFT" && (
            <>
              <Button size="sm" disabled={busyId === row.id} onClick={() => setIssuing(row)}>
                {t("invoices.actions.issue")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === row.id}
                onClick={() => {
                  setVoidReason("");
                  setVoiding(row);
                }}
              >
                {t("invoices.actions.void")}
              </Button>
            </>
          )}
          {row.status === "ISSUED" && (
            <>
              <Button
                size="sm"
                disabled={busyId === row.id}
                onClick={() => {
                  setPayForm({
                    paidAt: todayIso(),
                    paymentMethod: "BANK_TRANSFER",
                    paymentRef: "",
                    note: "",
                  });
                  setPayingInvoice(row);
                }}
              >
                {t("invoices.actions.markPaid")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => openCreditNoteFor(row)}>
                {t("invoices.actions.creditNote")}
              </Button>
            </>
          )}
          {(row.status === "PAID" || row.status === "VOID") && (
            <Button size="sm" variant="ghost" onClick={() => void openDetail(row)}>
              {t("invoices.actions.view")}
            </Button>
          )}
        </span>
      ),
    },
  ];

  /* ---- Draft creation ---- */

  const [draftOpen, setDraftOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<{
    dealerId: string;
    emirateId: string;
    kind: InvoiceKind;
    dueDate: string;
    notes: string;
    lines: DraftInvoiceLineInput[];
  }>({ dealerId: "", emirateId: "", kind: "SUBSCRIPTION", dueDate: "", notes: "", lines: [emptyLine()] });
  const [draftSaving, setDraftSaving] = React.useState(false);

  const draftTotals = React.useMemo(() => {
    let net = 0;
    let vat = 0;
    for (const line of draft.lines) {
      const lineNet = (line.quantity ?? 1) * (line.unitPriceAed || 0) - (line.discountAed ?? 0);
      net += lineNet;
      if ((line.vatCategoryCode ?? "S") === "S") vat += (lineNet * (line.vatRate ?? 5)) / 100;
    }
    return { net, vat, grand: net + vat };
  }, [draft.lines]);

  const draftValid =
    Boolean(draft.dealerId) &&
    Boolean(draft.emirateId) &&
    draft.lines.length > 0 &&
    draft.lines.every((line) => line.description.trim().length >= 2 && line.unitPriceAed >= 0);

  const selectedDraftDealer = dealers.find((d) => d.id === draft.dealerId);

  const submitDraft = async () => {
    if (!token) return;
    setDraftSaving(true);
    try {
      await createInvoiceDraft(
        {
          dealerId: draft.dealerId,
          emirateId: draft.emirateId,
          kind: draft.kind,
          ...(draft.dueDate ? { dueDate: new Date(draft.dueDate).toISOString() } : {}),
          ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
          lines: draft.lines.map((line) => ({
            description: line.description.trim(),
            quantity: Number(line.quantity ?? 1),
            unitPriceAed: Number(line.unitPriceAed),
            discountAed: Number(line.discountAed ?? 0),
            vatRate: Number(line.vatRate ?? 5),
            vatCategoryCode: line.vatCategoryCode ?? "S",
            ...(line.vatCategoryCode && line.vatCategoryCode !== "S" && line.vatExemptionReasonCode
              ? { vatExemptionReasonCode: line.vatExemptionReasonCode }
              : {}),
          })),
        },
        token,
      );
      toast({ title: t("toast.draftCreated"), variant: "success" });
      setDraftOpen(false);
      setDraft({
        dealerId: "",
        emirateId: "",
        kind: "SUBSCRIPTION",
        dueDate: "",
        notes: "",
        lines: [emptyLine()],
      });
      await Promise.all([loadInvoices(), loadSummary()]);
    } catch (error) {
      fail(error, "toast.draftFailed");
    } finally {
      setDraftSaving(false);
    }
  };

  const patchLine = (index: number, patch: Partial<DraftInvoiceLineInput>) =>
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));

  /* ---------------------------------------------------------------- */
  /* Credit notes                                                      */
  /* ---------------------------------------------------------------- */

  const [noteFilter, setNoteFilter] = React.useState<"ALL" | CreditNoteStatus>("ALL");
  const [notes, setNotes] = React.useState<CreditNoteRow[]>([]);
  const [noteTotal, setNoteTotal] = React.useState(0);
  const [noteOffset, setNoteOffset] = React.useState(0);
  const [notesLoading, setNotesLoading] = React.useState(true);
  const [rejectingNote, setRejectingNote] = React.useState<CreditNoteRow | null>(null);
  const [approvingNote, setApprovingNote] = React.useState<CreditNoteRow | null>(null);
  const [noteReason, setNoteReason] = React.useState("");

  const loadNotes = React.useCallback(async () => {
    if (!token) return;
    setNotesLoading(true);
    try {
      const page = await listCreditNotes(token, {
        limit: PAGE_SIZE,
        offset: noteOffset,
        ...(noteFilter === "ALL" ? {} : { status: noteFilter }),
      });
      setNotes(page.items);
      setNoteTotal(page.total);
    } catch (error) {
      fail(error, "toast.creditNotesFailed");
    } finally {
      setNotesLoading(false);
    }
  }, [token, noteFilter, noteOffset, fail]);

  React.useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const runNoteAction = async (
    id: string,
    action: () => Promise<unknown>,
    successKey: string,
    failKey: string,
  ) => {
    setBusyId(id);
    try {
      await action();
      toast({ title: t(successKey), variant: "success" });
      await Promise.all([loadNotes(), loadInvoices(), loadSummary()]);
    } catch (error) {
      fail(error, failKey);
    } finally {
      setBusyId(null);
    }
  };

  const noteColumns: Column<CreditNoteRow>[] = [
    {
      key: "number",
      header: t("creditNotes.columns.number"),
      isRowHeader: true,
      render: (row) => (
        <span className="font-semibold">{row.number ?? t("creditNotes.draftLabel")}</span>
      ),
    },
    {
      key: "invoice",
      header: t("creditNotes.columns.invoice"),
      render: (row) => row.invoice?.number ?? row.originalNumber ?? "—",
    },
    {
      key: "dealer",
      header: t("creditNotes.columns.dealer"),
      render: (row) => row.dealer?.name ?? "—",
    },
    {
      key: "reason",
      header: t("creditNotes.columns.reason"),
      render: (row) => (
        <span className="flex flex-col">
          <span>{t(`creditNotes.reasons.${row.reason}`)}</span>
          {row.reasonText && <span className="text-xs text-muted">{row.reasonText}</span>}
        </span>
      ),
    },
    {
      key: "total",
      header: t("creditNotes.columns.total"),
      align: "end",
      render: (row) => <span className="font-semibold">{formatAed(row.grandTotalAed)}</span>,
    },
    {
      key: "status",
      header: t("creditNotes.columns.status"),
      render: (row) => (
        <span className="flex flex-col gap-1">
          <Badge variant={CREDIT_NOTE_TONES[row.status]}>
            {t(`status.creditNote.${row.status}`)}
          </Badge>
          {row.submittedAt && (
            <span className="text-xs text-muted">
              {row.submittedById === currentUserId
                ? t("creditNotes.submittedByYou", { date: shortDate(row.submittedAt) })
                : t("creditNotes.submittedOn", { date: shortDate(row.submittedAt) })}
            </span>
          )}
          {row.approvedAt && (
            <span className="text-xs text-muted">
              {t("creditNotes.approvedOn", { date: shortDate(row.approvedAt) })}
            </span>
          )}
          {row.rejectionReason && (
            <span className="text-xs text-danger">{row.rejectionReason}</span>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("creditNotes.columns.actions"),
      align: "end",
      render: (row) => {
        const isSubmitter = Boolean(row.submittedById) && row.submittedById === currentUserId;
        return (
          <span className="flex flex-col items-end gap-1">
            <span className="flex justify-end gap-1.5">
              {row.status === "DRAFT" && (
                <Button
                  size="sm"
                  disabled={busyId === row.id}
                  onClick={() =>
                    void runNoteAction(
                      row.id,
                      () => submitCreditNote(row.id, token),
                      "toast.creditNoteSubmitted",
                      "toast.creditNoteSubmitFailed",
                    )
                  }
                >
                  {t("creditNotes.actions.submit")}
                </Button>
              )}
              {row.status === "PENDING_APPROVAL" && (
                <>
                  <Button
                    size="sm"
                    disabled={busyId === row.id || isSubmitter}
                    onClick={() => setApprovingNote(row)}
                  >
                    {t("creditNotes.actions.approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === row.id}
                    onClick={() => {
                      setNoteReason("");
                      setRejectingNote(row);
                    }}
                  >
                    {t("creditNotes.actions.reject")}
                  </Button>
                </>
              )}
            </span>
            {row.status === "PENDING_APPROVAL" && isSubmitter && (
              <span className="max-w-[15rem] text-end text-xs text-warning-strong">
                {t("creditNotes.makerChecker")}
              </span>
            )}
          </span>
        );
      },
    },
  ];

  /* ---- Credit note creation, from an issued invoice ---- */

  const [noteDraft, setNoteDraft] = React.useState<{
    invoice: InvoiceRow;
    reason: CreditNoteReason;
    reasonText: string;
    description: string;
    amount: number;
    vatRate: number;
  } | null>(null);
  const [noteSaving, setNoteSaving] = React.useState(false);

  const openCreditNoteFor = (invoice: InvoiceRow) =>
    setNoteDraft({
      invoice,
      reason: "BILLING_ERROR",
      reasonText: "",
      description: "",
      amount: 0,
      vatRate: 5,
    });

  const submitNoteDraft = async () => {
    if (!token || !noteDraft) return;
    setNoteSaving(true);
    try {
      await createCreditNote(
        {
          invoiceId: noteDraft.invoice.id,
          reason: noteDraft.reason,
          ...(noteDraft.reasonText.trim() ? { reasonText: noteDraft.reasonText.trim() } : {}),
          lines: [
            {
              ...(noteDraft.description.trim() ? { description: noteDraft.description.trim() } : {}),
              quantity: 1,
              unitPriceAed: Number(noteDraft.amount),
              vatRate: Number(noteDraft.vatRate),
            },
          ],
        },
        token,
      );
      toast({ title: t("toast.creditNoteCreated"), variant: "success" });
      setNoteDraft(null);
      await Promise.all([loadNotes(), loadSummary()]);
    } catch (error) {
      fail(error, "toast.creditNoteCreateFailed");
    } finally {
      setNoteSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Receipts                                                          */
  /* ---------------------------------------------------------------- */

  const [receiptFilter, setReceiptFilter] = React.useState<"ALL" | ReceiptStatus>("ALL");
  const [receipts, setReceipts] = React.useState<ReceiptRow[]>([]);
  const [receiptTotal, setReceiptTotal] = React.useState(0);
  const [receiptOffset, setReceiptOffset] = React.useState(0);
  const [receiptsLoading, setReceiptsLoading] = React.useState(true);
  const [rejectingReceipt, setRejectingReceipt] = React.useState<ReceiptRow | null>(null);
  const [approvingReceipt, setApprovingReceipt] = React.useState<ReceiptRow | null>(null);
  const [receiptReason, setReceiptReason] = React.useState("");

  const loadReceipts = React.useCallback(async () => {
    if (!token) return;
    setReceiptsLoading(true);
    try {
      const page = await listReceipts(token, {
        limit: PAGE_SIZE,
        offset: receiptOffset,
        ...(receiptFilter === "ALL" ? {} : { status: receiptFilter }),
      });
      setReceipts(page.items);
      setReceiptTotal(page.total);
    } catch (error) {
      fail(error, "toast.receiptsFailed");
    } finally {
      setReceiptsLoading(false);
    }
  }, [token, receiptFilter, receiptOffset, fail]);

  React.useEffect(() => {
    void loadReceipts();
  }, [loadReceipts]);

  // Resolve the invoice numbers behind this page's allocations, once each.
  React.useEffect(() => {
    if (!token || receipts.length === 0) return;
    const unknown = Array.from(
      new Set(
        receipts.flatMap((receipt) =>
          receipt.allocations.map((allocation) => allocation.invoiceId),
        ),
      ),
    )
      .filter((id) => !invoiceNumbers[id])
      .slice(0, 40);
    if (unknown.length === 0) return;
    let cancelled = false;
    void Promise.all(
      unknown.map((id) =>
        getInvoice(id, token)
          .then((invoice) => [id, invoice.number ?? id] as const)
          .catch(() => [id, id] as const),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      setInvoiceNumbers((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => {
      cancelled = true;
    };
  }, [token, receipts, invoiceNumbers]);

  const runReceiptAction = async (
    id: string,
    action: () => Promise<unknown>,
    successKey: string,
    failKey: string,
  ) => {
    setBusyId(id);
    try {
      await action();
      toast({ title: t(successKey), variant: "success" });
      await Promise.all([loadReceipts(), loadInvoices(), loadSummary()]);
    } catch (error) {
      fail(error, failKey);
    } finally {
      setBusyId(null);
    }
  };

  const receiptColumns: Column<ReceiptRow>[] = [
    {
      key: "number",
      header: t("receipts.columns.number"),
      isRowHeader: true,
      render: (row) => (
        <span className="font-semibold">{row.number ?? t("receipts.unnumbered")}</span>
      ),
    },
    {
      key: "dealer",
      header: t("receipts.columns.dealer"),
      render: (row) => row.dealer?.name ?? "—",
    },
    {
      key: "amount",
      header: t("receipts.columns.amount"),
      align: "end",
      render: (row) => <span className="font-semibold">{formatAed(row.amountAed)}</span>,
    },
    {
      key: "allocations",
      header: t("receipts.columns.allocations"),
      render: (row) => (
        <span className="flex flex-col gap-0.5 text-xs">
          {row.allocations.length === 0 ? (
            <span className="text-muted">{t("receipts.noAllocations")}</span>
          ) : (
            row.allocations.map((allocation) => (
              <span key={allocation.id} className="text-muted-strong">
                {t("receipts.allocationLine", {
                  amount: formatAed(allocation.amountAed),
                  invoice: invoiceNumbers[allocation.invoiceId] ?? allocation.invoiceId,
                })}
              </span>
            ))
          )}
        </span>
      ),
    },
    {
      key: "method",
      header: t("receipts.columns.method"),
      render: (row) => (
        <span className="flex flex-col">
          <span>{row.method}</span>
          {row.reference && <span className="text-xs text-muted">{row.reference}</span>}
        </span>
      ),
    },
    {
      key: "received",
      header: t("receipts.columns.received"),
      render: (row) => shortDate(row.receivedAt),
    },
    {
      key: "status",
      header: t("receipts.columns.status"),
      render: (row) => (
        <span className="flex flex-col gap-1">
          <Badge variant={RECEIPT_TONES[row.status]}>{t(`status.receipt.${row.status}`)}</Badge>
          {row.rejectionReason && <span className="text-xs text-danger">{row.rejectionReason}</span>}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("receipts.columns.actions"),
      align: "end",
      render: (row) => {
        const isMaker = Boolean(row.createdById) && row.createdById === currentUserId;
        if (row.status !== "PENDING_APPROVAL") return null;
        return (
          <span className="flex flex-col items-end gap-1">
            <span className="flex justify-end gap-1.5">
              <Button
                size="sm"
                disabled={busyId === row.id || isMaker}
                onClick={() => setApprovingReceipt(row)}
              >
                {t("receipts.actions.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === row.id}
                onClick={() => {
                  setReceiptReason("");
                  setRejectingReceipt(row);
                }}
              >
                {t("receipts.actions.reject")}
              </Button>
            </span>
            {isMaker && (
              <span className="max-w-[15rem] text-end text-xs text-warning-strong">
                {t("receipts.makerChecker")}
              </span>
            )}
          </span>
        );
      },
    },
  ];

  /* ---- Record a receipt: the allocation editor ---- */

  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [receiptSaving, setReceiptSaving] = React.useState(false);
  const [receiptError, setReceiptError] = React.useState<string | null>(null);
  const [receiptForm, setReceiptForm] = React.useState<{
    dealerId: string;
    method: ReceiptMethod;
    amountAed: number;
    receivedAt: string;
    reference: string;
    note: string;
    manualMarkPaid: boolean;
  }>({
    dealerId: "",
    method: "BANK_TRANSFER",
    amountAed: 0,
    receivedAt: todayIso(),
    reference: "",
    note: "",
    manualMarkPaid: false,
  });
  /** Outstanding invoices for the chosen dealer, with what is left on each. */
  const [outstanding, setOutstanding] = React.useState<
    { invoice: InvoiceRow; outstandingAed: number }[]
  >([]);
  const [outstandingLoading, setOutstandingLoading] = React.useState(false);
  const [allocation, setAllocation] = React.useState<Record<string, number>>({});

  const loadOutstanding = React.useCallback(
    async (dealerId: string) => {
      if (!token || !dealerId) {
        setOutstanding([]);
        return;
      }
      setOutstandingLoading(true);
      try {
        // The invoice row carries no "already allocated" figure, so derive it
        // from the dealer's receipts. The backend stays authoritative — this
        // only stops the operator over-allocating by accident.
        const [issued, dealerReceipts] = await Promise.all([
          listInvoices(token, { dealerId, status: "ISSUED", limit: 100 }),
          listReceipts(token, { dealerId, limit: 100 }),
        ]);
        const allocated = new Map<string, number>();
        for (const receipt of dealerReceipts.items) {
          if (receipt.status === "REJECTED") continue;
          for (const row of receipt.allocations) {
            allocated.set(
              row.invoiceId,
              (allocated.get(row.invoiceId) ?? 0) + toAmount(row.amountAed),
            );
          }
        }
        setOutstanding(
          issued.items
            .map((invoice) => ({
              invoice,
              outstandingAed:
                Math.round(
                  (toAmount(invoice.grandTotalAed) - (allocated.get(invoice.id) ?? 0)) * 100,
                ) / 100,
            }))
            .filter((entry) => entry.outstandingAed > 0),
        );
      } catch (error) {
        fail(error, "toast.outstandingFailed");
        setOutstanding([]);
      } finally {
        setOutstandingLoading(false);
      }
    },
    [token, fail],
  );

  const allocatedTotal = React.useMemo(
    () => Object.values(allocation).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [allocation],
  );
  const unallocated = Math.round((receiptForm.amountAed - allocatedTotal) * 100) / 100;

  const receiptValid =
    Boolean(receiptForm.dealerId) &&
    receiptForm.amountAed > 0 &&
    allocatedTotal > 0 &&
    Object.values(allocation).every((value) => Number(value) >= 0);

  const submitReceipt = async () => {
    if (!token) return;
    setReceiptSaving(true);
    setReceiptError(null);
    try {
      await createReceipt(
        {
          dealerId: receiptForm.dealerId,
          method: receiptForm.method,
          amountAed: Number(receiptForm.amountAed),
          receivedAt: new Date(receiptForm.receivedAt).toISOString(),
          ...(receiptForm.reference.trim() ? { reference: receiptForm.reference.trim() } : {}),
          ...(receiptForm.note.trim() ? { note: receiptForm.note.trim() } : {}),
          ...(receiptForm.manualMarkPaid ? { manualMarkPaid: true } : {}),
          allocations: Object.entries(allocation)
            .filter(([, value]) => Number(value) > 0)
            .map(([invoiceId, value]) => ({ invoiceId, amountAed: Number(value) })),
        },
        token,
      );
      toast({ title: t("toast.receiptRecorded"), variant: "success" });
      setReceiptOpen(false);
      setAllocation({});
      setOutstanding([]);
      setReceiptForm({
        dealerId: "",
        method: "BANK_TRANSFER",
        amountAed: 0,
        receivedAt: todayIso(),
        reference: "",
        note: "",
        manualMarkPaid: false,
      });
      await Promise.all([loadReceipts(), loadInvoices(), loadSummary()]);
    } catch (error) {
      // ALLOCATION_OVERPAYS names the invoice and its remaining balance —
      // it belongs next to the field, not in a toast that scrolls away.
      setReceiptError(error instanceof ApiError ? error.message : t("toast.receiptFailed"));
    } finally {
      setReceiptSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Payments                                                          */
  /* ---------------------------------------------------------------- */

  const [paymentFilter, setPaymentFilter] = React.useState<"ALL" | PaymentStatus>(
    "PENDING_CONFIRMATION",
  );
  const [payments, setPayments] = React.useState<PaymentRow[]>([]);
  const [paymentTotal, setPaymentTotal] = React.useState(0);
  const [paymentOffset, setPaymentOffset] = React.useState(0);
  const [paymentsLoading, setPaymentsLoading] = React.useState(true);
  const [confirmingPayment, setConfirmingPayment] = React.useState<PaymentRow | null>(null);
  const [rejectingPayment, setRejectingPayment] = React.useState<PaymentRow | null>(null);
  const [paymentReason, setPaymentReason] = React.useState("");
  const [providerChoice, setProviderChoice] = React.useState<PaymentProviderName | "">("");
  const [providerSaving, setProviderSaving] = React.useState(false);

  const loadPayments = React.useCallback(async () => {
    if (!token) return;
    setPaymentsLoading(true);
    try {
      const page = await listPayments(token, {
        limit: PAGE_SIZE,
        offset: paymentOffset,
        ...(paymentFilter === "ALL" ? {} : { status: paymentFilter }),
      });
      setPayments(page.items);
      setPaymentTotal(page.total);
    } catch (error) {
      fail(error, "toast.paymentsFailed");
    } finally {
      setPaymentsLoading(false);
    }
  }, [token, paymentFilter, paymentOffset, fail]);

  React.useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const runPaymentAction = async (
    id: string,
    action: () => Promise<unknown>,
    successKey: string,
    failKey: string,
  ) => {
    setBusyId(id);
    try {
      await action();
      toast({ title: t(successKey), variant: "success" });
      await Promise.all([loadPayments(), loadInvoices(), loadReceipts(), loadSummary()]);
    } catch (error) {
      fail(error, failKey);
    } finally {
      setBusyId(null);
    }
  };

  const applyProvider = async () => {
    if (!token || !providerChoice) return;
    setProviderSaving(true);
    try {
      setProvider(await setPaymentProvider(providerChoice, token));
      toast({ title: t("toast.providerChanged"), variant: "success" });
      setProviderChoice("");
    } catch (error) {
      fail(error, "toast.providerFailed");
    } finally {
      setProviderSaving(false);
    }
  };

  const paymentColumns: Column<PaymentRow>[] = [
    {
      key: "reference",
      header: t("payments.columns.reference"),
      isRowHeader: true,
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-semibold">{row.reference}</span>
          {row.declaredRef && (
            <span className="text-xs text-muted">
              {t("payments.declaredRef", { ref: row.declaredRef })}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "dealer",
      header: t("payments.columns.dealer"),
      render: (row) => row.dealer?.name ?? "—",
    },
    {
      key: "invoice",
      header: t("payments.columns.invoice"),
      render: (row) => row.invoice?.number ?? "—",
    },
    {
      key: "amount",
      header: t("payments.columns.amount"),
      align: "end",
      render: (row) => <span className="font-semibold">{formatAed(row.amountAed)}</span>,
    },
    {
      key: "route",
      header: t("payments.columns.route"),
      render: (row) => (
        <span className="flex flex-col text-xs">
          <span className="text-ink">{row.provider}</span>
          <span className="text-muted">{row.method}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: t("payments.columns.status"),
      render: (row) => (
        <span className="flex flex-col gap-1">
          <Badge variant={PAYMENT_TONES[row.status]}>{t(`status.payment.${row.status}`)}</Badge>
          {row.declaredAt && (
            <span className="text-xs text-muted">
              {t("payments.declaredOn", { date: shortDate(row.declaredAt) })}
            </span>
          )}
          {row.failureCode && <span className="text-xs text-danger">{row.failureCode}</span>}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("payments.columns.actions"),
      align: "end",
      render: (row) =>
        row.status === "PENDING_CONFIRMATION" ? (
          <span className="flex justify-end gap-1.5">
            <Button
              size="sm"
              disabled={busyId === row.id}
              onClick={() => setConfirmingPayment(row)}
            >
              {t("payments.actions.confirm")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === row.id}
              onClick={() => {
                setPaymentReason("");
                setRejectingPayment(row);
              }}
            >
              {t("payments.actions.reject")}
            </Button>
          </span>
        ) : null,
    },
  ];

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const filterChips = <Value extends string>(
    values: readonly Value[],
    active: Value,
    onSelect: (value: Value) => void,
    label: (value: Value) => string,
  ) => (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {values.map((value) => (
        <Button
          key={value}
          size="sm"
          variant={active === value ? "primary" : "outline"}
          aria-pressed={active === value}
          onClick={() => onSelect(value)}
        >
          {label(value)}
        </Button>
      ))}
    </div>
  );

  return (
    <AdminLayout title={t("title")}>
      <p className="mb-4 max-w-3xl text-sm text-muted">{t("subtitle")}</p>

      {/* Summary first: what is waiting on a human, before any list. */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={t("summary.paymentsPending")}
          value={summary.paymentsPending}
          hint={t("summary.paymentsPendingHint")}
          tone={summary.paymentsPending > 0 ? "down" : "neutral"}
        />
        <StatCard
          label={t("summary.overdue")}
          value={summary.overdue}
          hint={t("summary.overdueHint")}
          tone={summary.overdue > 0 ? "down" : "neutral"}
        />
        <StatCard
          label={t("summary.receiptsPending")}
          value={summary.receiptsPending}
          hint={t("summary.receiptsPendingHint")}
        />
        <StatCard
          label={t("summary.creditNotesPending")}
          value={summary.creditNotesPending}
          hint={t("summary.creditNotesPendingHint")}
        />
        <StatCard
          label={t("summary.drafts")}
          value={summary.drafts}
          hint={t("summary.draftsHint")}
        />
      </div>

      {provider && !provider.canCharge && provider.blockedReason && (
        <Card className="mb-4 flex items-start gap-2 border-danger/40 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <span className="text-sm">
            <span className="font-bold text-danger">{t("provider.blockedTitle")}</span>{" "}
            <span className="text-ink">{provider.blockedReason}</span>
          </span>
        </Card>
      )}

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">{t("tabs.invoices")}</TabsTrigger>
          <TabsTrigger value="credit-notes">{t("tabs.creditNotes")}</TabsTrigger>
          <TabsTrigger value="receipts">{t("tabs.receipts")}</TabsTrigger>
          <TabsTrigger value="payments">{t("tabs.payments")}</TabsTrigger>
        </TabsList>

        {/* ---------------- Invoices ---------------- */}
        <TabsContent value="invoices">
          <SurfaceCard className="mb-3 flex items-start gap-2 p-3">
            <Lock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <p className="text-sm text-ink">{t("invoices.immutabilityNote")}</p>
          </SurfaceCard>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            {filterChips(
              ["ALL", "DRAFT", "ISSUED", "PAID", "VOID", "OVERDUE"] as const,
              invoiceFilter,
              (value) => {
                setInvoiceOffset(0);
                setInvoiceFilter(value);
              },
              (value) => t(`invoices.filters.${value}`),
            )}
            <Button size="sm" onClick={() => setDraftOpen(true)}>
              <Plus aria-hidden />
              {t("invoices.newDraft")}
            </Button>
          </div>

          <DataTable
            caption={t("invoices.caption")}
            columns={invoiceColumns}
            rows={invoices}
            rowKey={(row) => row.id}
            loading={invoicesLoading}
            empty={{ title: t("invoices.empty.title"), hint: t("invoices.empty.hint") }}
            pagination={{
              total: invoiceTotal,
              limit: PAGE_SIZE,
              offset: invoiceOffset,
              onChange: setInvoiceOffset,
            }}
          />
        </TabsContent>

        {/* ---------------- Credit notes ---------------- */}
        <TabsContent value="credit-notes">
          <SurfaceCard className="mb-3 flex items-start gap-2 p-3">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <p className="text-sm text-ink">{t("creditNotes.makerCheckerNote")}</p>
          </SurfaceCard>

          {filterChips(
            ["ALL", "DRAFT", "PENDING_APPROVAL", "ISSUED", "REJECTED"] as const,
            noteFilter,
            (value) => {
              setNoteOffset(0);
              setNoteFilter(value);
            },
            (value) => t(`creditNotes.filters.${value}`),
          )}

          <DataTable
            caption={t("creditNotes.caption")}
            columns={noteColumns}
            rows={notes}
            rowKey={(row) => row.id}
            loading={notesLoading}
            empty={{ title: t("creditNotes.empty.title"), hint: t("creditNotes.empty.hint") }}
            pagination={{
              total: noteTotal,
              limit: PAGE_SIZE,
              offset: noteOffset,
              onChange: setNoteOffset,
            }}
          />
        </TabsContent>

        {/* ---------------- Receipts ---------------- */}
        <TabsContent value="receipts">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            {filterChips(
              ["ALL", "PENDING_APPROVAL", "RECORDED", "REJECTED"] as const,
              receiptFilter,
              (value) => {
                setReceiptOffset(0);
                setReceiptFilter(value);
              },
              (value) => t(`receipts.filters.${value}`),
            )}
            <Button
              size="sm"
              onClick={() => {
                setReceiptError(null);
                setAllocation({});
                setOutstanding([]);
                setReceiptOpen(true);
              }}
            >
              <Plus aria-hidden />
              {t("receipts.record")}
            </Button>
          </div>

          <DataTable
            caption={t("receipts.caption")}
            columns={receiptColumns}
            rows={receipts}
            rowKey={(row) => row.id}
            loading={receiptsLoading}
            empty={{ title: t("receipts.empty.title"), hint: t("receipts.empty.hint") }}
            pagination={{
              total: receiptTotal,
              limit: PAGE_SIZE,
              offset: receiptOffset,
              onChange: setReceiptOffset,
            }}
          />
        </TabsContent>

        {/* ---------------- Payments ---------------- */}
        <TabsContent value="payments">
          <Card className="mb-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-ink">
                  <CreditCard className="size-4 text-brand" aria-hidden />
                  {t("provider.title")}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="solid">{provider?.provider ?? "—"}</Badge>
                  <Badge variant={provider?.canCharge ? "green" : "red"}>
                    {provider?.canCharge ? t("provider.canCharge") : t("provider.cannotCharge")}
                  </Badge>
                  <Badge variant={provider?.implemented ? "navy" : "amber"}>
                    {provider?.implemented
                      ? t("provider.implemented")
                      : t("provider.notImplemented")}
                  </Badge>
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted">{t("provider.credentials")}</span>
                  <Badge variant={provider?.credentials.apiKey ? "green" : "neutral"}>
                    {provider?.credentials.apiKey
                      ? t("provider.apiKeyPresent")
                      : t("provider.apiKeyAbsent")}
                  </Badge>
                  <Badge variant={provider?.credentials.webhookSecret ? "green" : "neutral"}>
                    {provider?.credentials.webhookSecret
                      ? t("provider.webhookPresent")
                      : t("provider.webhookAbsent")}
                  </Badge>
                </p>
                <p className="mt-1.5 text-xs text-muted">{t("provider.presenceOnly")}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="billing-provider">{t("provider.change")}</Label>
                <span className="flex w-72 gap-2">
                  <Picker
                    id="billing-provider"
                    value={providerChoice}
                    placeholder={t("provider.choosePlaceholder")}
                    options={PAYMENT_PROVIDERS.map((name) => ({
                      value: name,
                      label: provider?.available.includes(name)
                        ? name
                        : `${name} — ${t("provider.noAdapter")}`,
                    }))}
                    onChange={setProviderChoice}
                  />
                  <Button
                    size="md"
                    variant="outline"
                    disabled={!providerChoice || providerSaving}
                    onClick={() => void applyProvider()}
                  >
                    {providerSaving && <Loader2 className="animate-spin" aria-hidden />}
                    {t("provider.apply")}
                  </Button>
                </span>
                <span className="max-w-xs text-xs text-muted">{t("provider.changeWarning")}</span>
              </div>
            </div>
          </Card>

          {filterChips(
            [
              "PENDING_CONFIRMATION",
              "ALL",
              "REQUIRES_ACTION",
              "PROCESSING",
              "SETTLED",
              "FAILED",
              "BLOCKED",
            ] as const,
            paymentFilter,
            (value) => {
              setPaymentOffset(0);
              setPaymentFilter(value);
            },
            (value) => t(`payments.filters.${value}`),
          )}

          <DataTable
            caption={t("payments.caption")}
            columns={paymentColumns}
            rows={payments}
            rowKey={(row) => row.id}
            loading={paymentsLoading}
            empty={{ title: t("payments.empty.title"), hint: t("payments.empty.hint") }}
            pagination={{
              total: paymentTotal,
              limit: PAGE_SIZE,
              offset: paymentOffset,
              onChange: setPaymentOffset,
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ============ Dialogs ============ */}

      {/* Issue — irreversible, allocates a gap-free number. */}
      <Dialog open={Boolean(issuing)} onOpenChange={(open) => !open && setIssuing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("invoices.issueDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("invoices.issueDialog.body", {
                dealer: issuing?.dealer?.name ?? "",
                amount: formatAed(issuing?.grandTotalAed),
              })}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-warning-strong">{t("invoices.issueDialog.warning")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssuing(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={busyId === issuing?.id}
              onClick={() => {
                const row = issuing!;
                setIssuing(null);
                void runInvoiceAction(
                  row.id,
                  () => issueInvoice(row.id, token),
                  "toast.invoiceIssued",
                  "toast.invoiceIssueFailed",
                );
              }}
            >
              {t("invoices.issueDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void — drafts only. */}
      <Dialog open={Boolean(voiding)} onOpenChange={(open) => !open && setVoiding(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("invoices.voidDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("invoices.voidDialog.body", {
                dealer: voiding?.dealer?.name ?? "",
                amount: formatAed(voiding?.grandTotalAed),
              })}
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="billing-void-reason" required>
            {t("invoices.voidDialog.reason")}
          </Label>
          <Textarea
            id="billing-void-reason"
            rows={3}
            maxLength={300}
            value={voidReason}
            onChange={(event) => setVoidReason(event.target.value)}
            placeholder={t("invoices.voidDialog.placeholder")}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoiding(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={voidReason.trim().length < MIN_REASON || busyId === voiding?.id}
              onClick={() => {
                const row = voiding!;
                const reason = voidReason.trim();
                setVoiding(null);
                void runInvoiceAction(
                  row.id,
                  () => voidInvoiceDraft(row.id, reason, token),
                  "toast.invoiceVoided",
                  "toast.invoiceVoidFailed",
                );
              }}
            >
              {t("invoices.voidDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark paid. */}
      <Dialog
        open={Boolean(payingInvoice)}
        onOpenChange={(open) => !open && setPayingInvoice(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("invoices.markPaidDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("invoices.markPaidDialog.body", {
                number: payingInvoice?.number ?? "",
                dealer: payingInvoice?.dealer?.name ?? "",
                amount: formatAed(payingInvoice?.grandTotalAed),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="billing-paid-at">{t("invoices.markPaidDialog.paidAt")}</Label>
              <Input
                id="billing-paid-at"
                type="date"
                value={payForm.paidAt}
                onChange={(event) => setPayForm({ ...payForm, paidAt: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="billing-paid-method">{t("invoices.markPaidDialog.method")}</Label>
              <Picker
                id="billing-paid-method"
                value={payForm.paymentMethod}
                options={RECEIPT_METHODS.map((method) => ({
                  value: method,
                  label: t(`receipts.methods.${method}`),
                }))}
                onChange={(method) => setPayForm({ ...payForm, paymentMethod: method })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="billing-paid-ref">{t("invoices.markPaidDialog.ref")}</Label>
              <Input
                id="billing-paid-ref"
                value={payForm.paymentRef}
                maxLength={120}
                onChange={(event) => setPayForm({ ...payForm, paymentRef: event.target.value })}
                placeholder={t("invoices.markPaidDialog.refPlaceholder")}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="billing-paid-note">{t("invoices.markPaidDialog.note")}</Label>
              <Textarea
                id="billing-paid-note"
                rows={2}
                maxLength={500}
                value={payForm.note}
                onChange={(event) => setPayForm({ ...payForm, note: event.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-warning-strong">{t("invoices.markPaidDialog.warning")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingInvoice(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={busyId === payingInvoice?.id}
              onClick={() => {
                const row = payingInvoice!;
                const body = {
                  ...(payForm.paidAt
                    ? { paidAt: new Date(payForm.paidAt).toISOString() }
                    : {}),
                  paymentMethod: payForm.paymentMethod,
                  ...(payForm.paymentRef.trim() ? { paymentRef: payForm.paymentRef.trim() } : {}),
                  ...(payForm.note.trim() ? { note: payForm.note.trim() } : {}),
                };
                setPayingInvoice(null);
                void runInvoiceAction(
                  row.id,
                  () => markInvoicePaid(row.id, body, token),
                  "toast.invoicePaid",
                  "toast.invoicePayFailed",
                );
              }}
            >
              {t("invoices.markPaidDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New draft. */}
      <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("invoices.create.title")}</DialogTitle>
            <DialogDescription>{t("invoices.create.body")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="billing-draft-dealer" required>
                {t("invoices.create.dealer")}
              </Label>
              <Picker
                id="billing-draft-dealer"
                value={draft.dealerId}
                placeholder={t("invoices.create.dealerPlaceholder")}
                options={dealerOptions}
                onChange={(dealerId) => setDraft({ ...draft, dealerId })}
              />
              {selectedDraftDealer && !selectedDraftDealer.trn && (
                <p className="mt-1.5 text-xs text-warning-strong">{t("invoices.create.noTrn")}</p>
              )}
            </div>
            <div>
              <Label htmlFor="billing-draft-emirate" required>
                {t("invoices.create.emirate")}
              </Label>
              <Picker
                id="billing-draft-emirate"
                value={draft.emirateId}
                placeholder={t("invoices.create.emiratePlaceholder")}
                options={emirates.map((emirate) => ({ value: emirate.id, label: emirate.name }))}
                onChange={(emirateId) => setDraft({ ...draft, emirateId })}
              />
              <p className="mt-1.5 text-xs text-muted">{t("invoices.create.emirateHint")}</p>
            </div>
            <div>
              <Label htmlFor="billing-draft-kind">{t("invoices.create.kind")}</Label>
              <Picker
                id="billing-draft-kind"
                value={draft.kind}
                options={INVOICE_KINDS.map((kind) => ({
                  value: kind,
                  label: t(`invoices.kinds.${kind}`),
                }))}
                onChange={(kind) => setDraft({ ...draft, kind })}
              />
            </div>
            <div>
              <Label htmlFor="billing-draft-due">{t("invoices.create.dueDate")}</Label>
              <Input
                id="billing-draft-due"
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-ink">{t("invoices.create.lines")}</p>
            <div className="flex flex-col gap-2">
              {draft.lines.map((line, index) => (
                <Card key={index} className="grid gap-2 p-3 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <Label htmlFor={`billing-line-desc-${index}`} required>
                      {t("invoices.create.lineDescription")}
                    </Label>
                    <Input
                      id={`billing-line-desc-${index}`}
                      value={line.description}
                      maxLength={300}
                      onChange={(event) => patchLine(index, { description: event.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor={`billing-line-qty-${index}`}>
                      {t("invoices.create.quantity")}
                    </Label>
                    <Input
                      id={`billing-line-qty-${index}`}
                      type="number"
                      min={0.001}
                      step={0.001}
                      value={line.quantity ?? 1}
                      onChange={(event) =>
                        patchLine(index, { quantity: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor={`billing-line-price-${index}`} required>
                      {t("invoices.create.unitPrice")}
                    </Label>
                    <Input
                      id={`billing-line-price-${index}`}
                      type="number"
                      min={0}
                      step={0.01}
                      value={line.unitPriceAed}
                      onChange={(event) =>
                        patchLine(index, { unitPriceAed: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label htmlFor={`billing-line-vat-${index}`}>
                      {t("invoices.create.vatRate")}
                    </Label>
                    <Input
                      id={`billing-line-vat-${index}`}
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={line.vatRate ?? 5}
                      onChange={(event) =>
                        patchLine(index, { vatRate: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label htmlFor={`billing-line-cat-${index}`}>
                      {t("invoices.create.vatCategory")}
                    </Label>
                    <Picker
                      id={`billing-line-cat-${index}`}
                      value={line.vatCategoryCode ?? "S"}
                      options={VAT_CATEGORIES.map((category) => ({
                        value: category,
                        label: category,
                      }))}
                      onChange={(vatCategoryCode: VatCategory) =>
                        patchLine(index, { vatCategoryCode })
                      }
                    />
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t("invoices.create.removeLine")}
                      disabled={draft.lines.length === 1}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          lines: prev.lines.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                  {(line.vatCategoryCode ?? "S") !== "S" && (
                    <div className="sm:col-span-12">
                      <Label htmlFor={`billing-line-exempt-${index}`} required>
                        {t("invoices.create.exemptionCode")}
                      </Label>
                      <Input
                        id={`billing-line-exempt-${index}`}
                        value={line.vatExemptionReasonCode ?? ""}
                        maxLength={40}
                        onChange={(event) =>
                          patchLine(index, { vatExemptionReasonCode: event.target.value })
                        }
                        placeholder={t("invoices.create.exemptionPlaceholder")}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setDraft((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }))}
            >
              <Plus aria-hidden />
              {t("invoices.create.addLine")}
            </Button>
          </div>

          <div className="mt-4">
            <Label htmlFor="billing-draft-notes">{t("invoices.create.notes")}</Label>
            <Textarea
              id="billing-draft-notes"
              rows={2}
              maxLength={1000}
              value={draft.notes}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </div>

          <SurfaceCard className="mt-4 flex flex-wrap justify-between gap-3 p-3 text-sm">
            <span>
              {t("invoices.create.subtotal")}{" "}
              <strong className="text-ink">{formatAed(draftTotals.net)}</strong>
            </span>
            <span>
              {t("invoices.create.vatTotal")}{" "}
              <strong className="text-ink">{formatAed(draftTotals.vat)}</strong>
            </span>
            <span>
              {t("invoices.create.grandTotal")}{" "}
              <strong className="text-brand">{formatAed(draftTotals.grand)}</strong>
            </span>
          </SurfaceCard>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraftOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={!draftValid || draftSaving} onClick={() => void submitDraft()}>
              {draftSaving && <Loader2 className="animate-spin" aria-hidden />}
              {t("invoices.create.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice detail — read-only by design. */}
      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detail?.number ?? t("invoices.draftLabel")}
              {detail && (
                <Badge className="ms-2" variant={INVOICE_TONES[detail.status]}>
                  {t(`status.invoice.${detail.status}`)}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {t("invoices.detail.body", {
                dealer: detail?.dealer?.name ?? "",
                trn: detail?.buyerTrn ?? "—",
              })}
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("common.loading")}
            </p>
          )}

          {detail && (
            <>
              <div className="overflow-x-auto rounded-card border border-line">
                <table className="w-full min-w-[560px] border-collapse text-[13px]">
                  <caption className="sr-only">{t("invoices.detail.linesCaption")}</caption>
                  <thead>
                    <tr className="bg-brand text-white">
                      <th scope="col" className="p-2 text-start">
                        {t("invoices.detail.line")}
                      </th>
                      <th scope="col" className="p-2 text-end">
                        {t("invoices.detail.qty")}
                      </th>
                      <th scope="col" className="p-2 text-end">
                        {t("invoices.detail.unitPrice")}
                      </th>
                      <th scope="col" className="p-2 text-end">
                        {t("invoices.detail.net")}
                      </th>
                      <th scope="col" className="p-2 text-end">
                        {t("invoices.detail.vat")}
                      </th>
                      <th scope="col" className="p-2 text-end">
                        {t("invoices.detail.total")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((line, index) => (
                      <tr key={line.id} className={index % 2 === 1 ? "bg-page" : undefined}>
                        <th scope="row" className="p-2 text-start font-normal">
                          {line.description}
                        </th>
                        <td className="p-2 text-end">{String(line.quantity)}</td>
                        <td className="p-2 text-end">{formatAed(line.unitPriceAed)}</td>
                        <td className="p-2 text-end">{formatAed(line.lineNetAed)}</td>
                        <td className="p-2 text-end">{formatAed(line.vatAmountAed)}</td>
                        <td className="p-2 text-end font-semibold">{formatAed(line.totalAed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t("invoices.detail.subtotal")}</dt>
                  <dd className="font-semibold">{formatAed(detail.subtotalAed)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t("invoices.detail.vatTotal")}</dt>
                  <dd className="font-semibold">{formatAed(detail.vatTotalAed)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t("invoices.detail.grandTotal")}</dt>
                  <dd className="font-bold text-brand">{formatAed(detail.grandTotalAed)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t("invoices.detail.creditable")}</dt>
                  <dd className="font-semibold">{formatAed(detail.remainingCreditableAed)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t("invoices.detail.emirate")}</dt>
                  <dd>{detail.emirate?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">{t("invoices.detail.issueDate")}</dt>
                  <dd>{shortDate(detail.issueDate)}</dd>
                </div>
              </dl>

              {detail.creditNotes.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-sm font-bold text-ink">
                    {t("invoices.detail.creditNotes")}
                  </p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {detail.creditNotes.map((note) => (
                      <li key={note.id} className="flex items-center justify-between gap-2">
                        <span>{note.number ?? t("creditNotes.draftLabel")}</span>
                        <span className="flex items-center gap-2">
                          <Badge
                            variant={
                              CREDIT_NOTE_TONES[note.status as CreditNoteStatus] ?? "neutral"
                            }
                          >
                            {t(`status.creditNote.${note.status}`)}
                          </Badge>
                          <span className="font-semibold">{formatAed(note.grandTotalAed)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.status !== "DRAFT" && (
                <p className="mt-3 flex items-start gap-2 text-xs text-muted">
                  <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
                  {t("invoices.detail.immutable")}
                </p>
              )}
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>
              {t("common.close")}
            </Button>
            {detail?.status === "ISSUED" && (
              <Button
                onClick={() => {
                  const row = detail;
                  setDetail(null);
                  openCreditNoteFor(row);
                }}
              >
                {t("invoices.actions.creditNote")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draft a credit note against an issued invoice. */}
      <Dialog open={Boolean(noteDraft)} onOpenChange={(open) => !open && setNoteDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("creditNotes.create.title")}</DialogTitle>
            <DialogDescription>
              {t("creditNotes.create.body", {
                number: noteDraft?.invoice.number ?? "",
                amount: formatAed(noteDraft?.invoice.grandTotalAed),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="billing-cn-reason" required>
                {t("creditNotes.create.reason")}
              </Label>
              <Picker
                id="billing-cn-reason"
                value={noteDraft?.reason ?? "BILLING_ERROR"}
                options={CREDIT_NOTE_REASONS.map((reason) => ({
                  value: reason,
                  label: t(`creditNotes.reasons.${reason}`),
                }))}
                onChange={(reason: CreditNoteReason) =>
                  setNoteDraft((prev) => (prev ? { ...prev, reason } : prev))
                }
              />
            </div>
            <div>
              <Label htmlFor="billing-cn-amount" required>
                {t("creditNotes.create.amount")}
              </Label>
              <Input
                id="billing-cn-amount"
                type="number"
                min={0}
                step={0.01}
                value={noteDraft?.amount ?? 0}
                onChange={(event) =>
                  setNoteDraft((prev) =>
                    prev ? { ...prev, amount: Number(event.target.value) } : prev,
                  )
                }
              />
              <p className="mt-1.5 text-xs text-muted">{t("creditNotes.create.amountHint")}</p>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="billing-cn-desc">{t("creditNotes.create.description")}</Label>
              <Input
                id="billing-cn-desc"
                maxLength={300}
                value={noteDraft?.description ?? ""}
                onChange={(event) =>
                  setNoteDraft((prev) =>
                    prev ? { ...prev, description: event.target.value } : prev,
                  )
                }
                placeholder={t("creditNotes.create.descriptionPlaceholder")}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="billing-cn-text">{t("creditNotes.create.reasonText")}</Label>
              <Textarea
                id="billing-cn-text"
                rows={2}
                maxLength={500}
                value={noteDraft?.reasonText ?? ""}
                onChange={(event) =>
                  setNoteDraft((prev) =>
                    prev ? { ...prev, reasonText: event.target.value } : prev,
                  )
                }
              />
            </div>
          </div>

          <p className="text-xs text-muted">{t("creditNotes.create.workflow")}</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDraft(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!noteDraft || noteDraft.amount <= 0 || noteSaving}
              onClick={() => void submitNoteDraft()}
            >
              {noteSaving && <Loader2 className="animate-spin" aria-hidden />}
              {t("creditNotes.create.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve a credit note — issues it with a CN- number. */}
      <Dialog
        open={Boolean(approvingNote)}
        onOpenChange={(open) => !open && setApprovingNote(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("creditNotes.approveDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("creditNotes.approveDialog.body", {
                dealer: approvingNote?.dealer?.name ?? "",
                invoice: approvingNote?.invoice?.number ?? approvingNote?.originalNumber ?? "",
                amount: formatAed(approvingNote?.grandTotalAed),
              })}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-warning-strong">{t("creditNotes.approveDialog.warning")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingNote(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={busyId === approvingNote?.id}
              onClick={() => {
                const row = approvingNote!;
                setApprovingNote(null);
                void runNoteAction(
                  row.id,
                  () => approveCreditNote(row.id, token),
                  "toast.creditNoteApproved",
                  "toast.creditNoteApproveFailed",
                );
              }}
            >
              {t("creditNotes.approveDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject a credit note. */}
      <Dialog
        open={Boolean(rejectingNote)}
        onOpenChange={(open) => !open && setRejectingNote(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("creditNotes.rejectDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("creditNotes.rejectDialog.body", {
                amount: formatAed(rejectingNote?.grandTotalAed),
              })}
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="billing-cn-reject" required>
            {t("creditNotes.rejectDialog.reason")}
          </Label>
          <Textarea
            id="billing-cn-reject"
            rows={3}
            maxLength={300}
            value={noteReason}
            onChange={(event) => setNoteReason(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingNote(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={noteReason.trim().length < MIN_REASON || busyId === rejectingNote?.id}
              onClick={() => {
                const row = rejectingNote!;
                const reason = noteReason.trim();
                setRejectingNote(null);
                void runNoteAction(
                  row.id,
                  () => rejectCreditNote(row.id, reason, token),
                  "toast.creditNoteRejected",
                  "toast.creditNoteRejectFailed",
                );
              }}
            >
              {t("creditNotes.rejectDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record a receipt + allocate it. */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("receipts.create.title")}</DialogTitle>
            <DialogDescription>{t("receipts.create.body")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="billing-receipt-dealer" required>
                {t("receipts.create.dealer")}
              </Label>
              <Picker
                id="billing-receipt-dealer"
                value={receiptForm.dealerId}
                placeholder={t("receipts.create.dealerPlaceholder")}
                options={dealerOptions}
                onChange={(dealerId) => {
                  setReceiptForm({ ...receiptForm, dealerId });
                  setAllocation({});
                  void loadOutstanding(dealerId);
                }}
              />
            </div>
            <div>
              <Label htmlFor="billing-receipt-amount" required>
                {t("receipts.create.amount")}
              </Label>
              <Input
                id="billing-receipt-amount"
                type="number"
                min={0}
                step={0.01}
                value={receiptForm.amountAed}
                onChange={(event) =>
                  setReceiptForm({ ...receiptForm, amountAed: Number(event.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="billing-receipt-method">{t("receipts.create.method")}</Label>
              <Picker
                id="billing-receipt-method"
                value={receiptForm.method}
                options={RECEIPT_METHODS.map((method) => ({
                  value: method,
                  label: t(`receipts.methods.${method}`),
                }))}
                onChange={(method: ReceiptMethod) => setReceiptForm({ ...receiptForm, method })}
              />
            </div>
            <div>
              <Label htmlFor="billing-receipt-date" required>
                {t("receipts.create.receivedAt")}
              </Label>
              <Input
                id="billing-receipt-date"
                type="date"
                value={receiptForm.receivedAt}
                onChange={(event) =>
                  setReceiptForm({ ...receiptForm, receivedAt: event.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="billing-receipt-ref">{t("receipts.create.reference")}</Label>
              <Input
                id="billing-receipt-ref"
                maxLength={200}
                value={receiptForm.reference}
                onChange={(event) =>
                  setReceiptForm({ ...receiptForm, reference: event.target.value })
                }
                placeholder={t("receipts.create.referencePlaceholder")}
              />
            </div>
          </div>

          {/* Allocation — the heart of it. */}
          <div className="mt-4">
            <p className="mb-1 text-sm font-bold text-ink">{t("receipts.create.allocation")}</p>
            <p className="mb-2 text-xs text-muted">{t("receipts.create.allocationHint")}</p>

            {outstandingLoading && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("common.loading")}
              </p>
            )}

            {!outstandingLoading && receiptForm.dealerId && outstanding.length === 0 && (
              <p className="text-sm text-muted">{t("receipts.create.nothingOutstanding")}</p>
            )}

            {outstanding.length > 0 && (
              <div className="flex flex-col gap-2">
                {outstanding.map(({ invoice, outstandingAed }) => (
                  <Card
                    key={invoice.id}
                    className="flex flex-wrap items-end justify-between gap-3 p-3"
                  >
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-ink">
                        {invoice.number ?? t("invoices.draftLabel")}
                      </span>
                      <span className="text-xs text-muted">
                        {t("receipts.create.outstanding", {
                          amount: formatAed(outstandingAed),
                          total: formatAed(invoice.grandTotalAed),
                        })}
                      </span>
                    </span>
                    <span className="flex items-end gap-2">
                      <span>
                        <Label htmlFor={`billing-alloc-${invoice.id}`}>
                          {t("receipts.create.applyAmount")}
                        </Label>
                        <Input
                          id={`billing-alloc-${invoice.id}`}
                          className="w-36"
                          type="number"
                          min={0}
                          step={0.01}
                          value={allocation[invoice.id] ?? ""}
                          onChange={(event) =>
                            setAllocation((prev) => ({
                              ...prev,
                              [invoice.id]: Number(event.target.value),
                            }))
                          }
                        />
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setAllocation((prev) => ({ ...prev, [invoice.id]: outstandingAed }))
                        }
                      >
                        {t("receipts.create.applyFull")}
                      </Button>
                    </span>
                  </Card>
                ))}
              </div>
            )}

            <SurfaceCard className="mt-3 flex flex-wrap justify-between gap-3 p-3 text-sm">
              <span>
                {t("receipts.create.receiptAmount")}{" "}
                <strong className="text-ink">{formatAed(receiptForm.amountAed)}</strong>
              </span>
              <span>
                {t("receipts.create.allocated")}{" "}
                <strong className="text-ink">{formatAed(allocatedTotal)}</strong>
              </span>
              <span>
                {t("receipts.create.unallocated")}{" "}
                <strong className={unallocated < 0 ? "text-danger" : "text-ink"}>
                  {formatAed(unallocated)}
                </strong>
              </span>
            </SurfaceCard>
            {unallocated < 0 && (
              <p className="mt-1.5 text-xs text-danger">{t("receipts.create.overAllocated")}</p>
            )}
          </div>

          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={receiptForm.manualMarkPaid}
              onChange={(event) =>
                setReceiptForm({ ...receiptForm, manualMarkPaid: event.target.checked })
              }
            />
            <span>
              <span className="font-semibold text-ink">{t("receipts.create.manual")}</span>
              <span className="block text-xs text-muted">{t("receipts.create.manualHint")}</span>
            </span>
          </label>

          <div className="mt-3">
            <Label htmlFor="billing-receipt-note">{t("receipts.create.note")}</Label>
            <Textarea
              id="billing-receipt-note"
              rows={2}
              maxLength={2000}
              value={receiptForm.note}
              onChange={(event) => setReceiptForm({ ...receiptForm, note: event.target.value })}
            />
          </div>

          {receiptError && (
            <Card className="mt-3 flex items-start gap-2 border-danger/40 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <span className="text-sm text-ink">{receiptError}</span>
            </Card>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={!receiptValid || receiptSaving} onClick={() => void submitReceipt()}>
              {receiptSaving && <Loader2 className="animate-spin" aria-hidden />}
              {t("receipts.create.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve a manual mark-paid — money is treated as received. */}
      <Dialog
        open={Boolean(approvingReceipt)}
        onOpenChange={(open) => !open && setApprovingReceipt(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("receipts.approveDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("receipts.approveDialog.body", {
                dealer: approvingReceipt?.dealer?.name ?? "",
                amount: formatAed(approvingReceipt?.amountAed),
                allocations: approvingReceipt?.allocations.length ?? 0,
              })}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-warning-strong">{t("receipts.approveDialog.warning")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingReceipt(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={busyId === approvingReceipt?.id}
              onClick={() => {
                const row = approvingReceipt!;
                setApprovingReceipt(null);
                void runReceiptAction(
                  row.id,
                  () => approveReceipt(row.id, token),
                  "toast.receiptApproved",
                  "toast.receiptApproveFailed",
                );
              }}
            >
              <CheckCircle2 aria-hidden />
              {t("receipts.approveDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject a receipt. */}
      <Dialog
        open={Boolean(rejectingReceipt)}
        onOpenChange={(open) => !open && setRejectingReceipt(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("receipts.rejectDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("receipts.rejectDialog.body", {
                amount: formatAed(rejectingReceipt?.amountAed),
              })}
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="billing-receipt-reject" required>
            {t("receipts.rejectDialog.reason")}
          </Label>
          <Textarea
            id="billing-receipt-reject"
            rows={3}
            maxLength={1000}
            value={receiptReason}
            onChange={(event) => setReceiptReason(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingReceipt(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={receiptReason.trim().length < MIN_REASON || busyId === rejectingReceipt?.id}
              onClick={() => {
                const row = rejectingReceipt!;
                const reason = receiptReason.trim();
                setRejectingReceipt(null);
                void runReceiptAction(
                  row.id,
                  () => rejectReceipt(row.id, reason, token),
                  "toast.receiptRejected",
                  "toast.receiptRejectFailed",
                );
              }}
            >
              {t("receipts.rejectDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm a payment — real money. */}
      <Dialog
        open={Boolean(confirmingPayment)}
        onOpenChange={(open) => !open && setConfirmingPayment(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("payments.confirmDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("payments.confirmDialog.body", {
                amount: formatAed(confirmingPayment?.amountAed),
                dealer: confirmingPayment?.dealer?.name ?? "",
                invoice: confirmingPayment?.invoice?.number ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-warning-strong">{t("payments.confirmDialog.warning")}</p>
          {confirmingPayment?.declaredRef && (
            <p className="text-sm text-muted">
              {t("payments.confirmDialog.declaredRef", { ref: confirmingPayment.declaredRef })}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingPayment(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={busyId === confirmingPayment?.id}
              onClick={() => {
                const row = confirmingPayment!;
                setConfirmingPayment(null);
                void runPaymentAction(
                  row.id,
                  () => confirmPayment(row.id, token),
                  "toast.paymentConfirmed",
                  "toast.paymentConfirmFailed",
                );
              }}
            >
              <CheckCircle2 aria-hidden />
              {t("payments.confirmDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject a payment. */}
      <Dialog
        open={Boolean(rejectingPayment)}
        onOpenChange={(open) => !open && setRejectingPayment(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("payments.rejectDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("payments.rejectDialog.body", {
                amount: formatAed(rejectingPayment?.amountAed),
                dealer: rejectingPayment?.dealer?.name ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="billing-payment-reject" required>
            {t("payments.rejectDialog.reason")}
          </Label>
          <Textarea
            id="billing-payment-reject"
            rows={3}
            maxLength={500}
            value={paymentReason}
            onChange={(event) => setPaymentReason(event.target.value)}
            placeholder={t("payments.rejectDialog.placeholder")}
          />
          <p className="text-xs text-muted">{t("payments.rejectDialog.hint")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingPayment(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={paymentReason.trim().length < MIN_REASON || busyId === rejectingPayment?.id}
              onClick={() => {
                const row = rejectingPayment!;
                const reason = paymentReason.trim();
                setRejectingPayment(null);
                void runPaymentAction(
                  row.id,
                  () => rejectPayment(row.id, reason, token),
                  "toast.paymentRejected",
                  "toast.paymentRejectFailed",
                );
              }}
            >
              <Ban aria-hidden />
              {t("payments.rejectDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "admin", "admin-billing"],
        nextI18NextConfig,
      )),
    },
  };
};
