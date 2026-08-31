/**
 * Invoices and paying them (dealer side).
 *
 * The invoice table and the payment flow live together because they are one
 * job: an ISSUED invoice is the only thing you can pay, and the payment intent
 * is the thing that tells you HOW.
 *
 * The reference is the load-bearing detail. A UAE bank transfer that arrives
 * without it is an unattributed credit that somebody has to guess at, so it is
 * given its own row, its own copy button and its own warning — not buried in a
 * paragraph of instructions.
 *
 * And declaring is not paying. `PENDING_CONFIRMATION` is stated as "awaiting
 * our confirmation" everywhere it appears, because a dealer who believes the
 * quota has started and finds it has not is a support ticket we caused.
 */
import * as React from "react";
import { Ban, Copy, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { ConfirmDialog } from "@/components/dealer/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import {
  cancelPayment,
  declarePayment,
  getDealerInvoices,
  listDealerPayments,
  startPayment,
  type DealerInvoiceRow,
  type PaymentIntent,
} from "@/lib/marketplace-api";

const PAGE_SIZE = 10;

/** Statuses the backend treats as final — nothing can be done to them. */
const TERMINAL: PaymentIntent["status"][] = [
  "SETTLED",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
];

const PAYMENT_VARIANT: Record<string, "green" | "amber" | "red" | "neutral" | "navy"> = {
  REQUIRES_ACTION: "amber",
  PENDING_CONFIRMATION: "amber",
  PROCESSING: "navy",
  SETTLED: "green",
  FAILED: "red",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
  BLOCKED: "red",
};

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso)) : "—";

export interface BillingPanelProps {
  dealerId: string;
  accessToken: string;
  /** OWNER/MANAGER — the backend's canManageBilling. */
  canPay: boolean;
  /** A settled payment activates the subscription; the page reloads quota. */
  onChanged?: () => void;
}

export function BillingPanel({
  dealerId,
  accessToken,
  canPay,
  onChanged,
}: BillingPanelProps) {
  const { t } = useTranslation("dealer");

  const [invoices, setInvoices] = React.useState<DealerInvoiceRow[]>([]);
  const [invoiceTotal, setInvoiceTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [invoicesLoading, setInvoicesLoading] = React.useState(true);

  const [intents, setIntents] = React.useState<PaymentIntent[]>([]);
  const [paymentsLoading, setPaymentsLoading] = React.useState(true);

  const [active, setActive] = React.useState<PaymentIntent | null>(null);
  const [startingId, setStartingId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [declareFor, setDeclareFor] = React.useState<PaymentIntent | null>(null);
  const [declareRef, setDeclareRef] = React.useState("");
  const [cancelFor, setCancelFor] = React.useState<PaymentIntent | null>(null);

  const loadInvoices = React.useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const page = await getDealerInvoices(dealerId, accessToken, {
        limit: PAGE_SIZE,
        offset,
      });
      setInvoices(page.items);
      setInvoiceTotal(page.total);
    } finally {
      setInvoicesLoading(false);
    }
  }, [accessToken, dealerId, offset]);

  const loadPayments = React.useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const page = await listDealerPayments(dealerId, accessToken);
      setIntents(page.items);
    } catch {
      setIntents([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [accessToken, dealerId]);

  React.useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  React.useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const showFailure = (err: unknown) => {
    // 400/409 from this API say something worth reading — "this invoice is
    // paid and cannot take a payment", "nothing is outstanding".
    toast({
      title: err instanceof ApiError ? err.message : t("payment.failed"),
      variant: "warning",
    });
  };

  const openIntentFor = (invoiceId: string) =>
    intents.find((i) => i.invoiceId === invoiceId && !TERMINAL.includes(i.status)) ?? null;

  const pay = async (invoice: DealerInvoiceRow) => {
    const existing = openIntentFor(invoice.id);
    if (existing) {
      setActive(existing);
      return;
    }
    setStartingId(invoice.id);
    try {
      const intent = await startPayment(dealerId, invoice.id, accessToken);
      setActive(intent);
      await loadPayments();
    } catch (err) {
      showFailure(err);
    } finally {
      setStartingId(null);
    }
  };

  const copy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: t("payment.copied", { field }), variant: "success" });
    } catch {
      toast({ title: t("payment.copyFailed"), variant: "warning" });
    }
  };

  const doDeclare = async () => {
    if (!declareFor || busy) return;
    setBusy(true);
    try {
      const updated = await declarePayment(
        dealerId,
        declareFor.id,
        declareRef.trim() ? { reference: declareRef.trim() } : {},
        accessToken,
      );
      setDeclareFor(null);
      setDeclareRef("");
      setActive(updated);
      toast({ title: t("payment.declared"), variant: "success" });
      await Promise.all([loadPayments(), loadInvoices()]);
      onChanged?.();
    } catch (err) {
      showFailure(err);
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async () => {
    if (!cancelFor || busy) return;
    setBusy(true);
    try {
      await cancelPayment(dealerId, cancelFor.id, accessToken);
      setCancelFor(null);
      setActive(null);
      toast({ title: t("payment.cancelled"), variant: "success" });
      await loadPayments();
    } catch (err) {
      showFailure(err);
    } finally {
      setBusy(false);
    }
  };

  const invoiceColumns: Column<DealerInvoiceRow>[] = [
    {
      key: "number",
      header: t("subscription.invoiceColumns.number"),
      isRowHeader: true,
      render: (row) => row.number ?? "—",
    },
    {
      key: "issued",
      header: t("subscription.invoiceColumns.issued"),
      render: (row) => formatDate(row.issueDate),
    },
    {
      key: "due",
      header: t("subscription.invoiceColumns.due"),
      render: (row) => formatDate(row.dueDate),
    },
    {
      key: "total",
      header: t("subscription.invoiceColumns.total"),
      align: "end",
      render: (row) => formatPrice(Number(row.grandTotalAed), "en"),
    },
    {
      key: "status",
      header: t("subscription.invoiceColumns.status"),
      render: (row) => (
        <Badge variant={row.status === "PAID" ? "green" : "amber"}>
          {row.status === "PAID"
            ? t("payment.status.SETTLED")
            : t("payment.status.REQUIRES_ACTION")}
        </Badge>
      ),
    },
    {
      key: "pay",
      header: t("payment.columns.actions"),
      align: "end",
      render: (row) => {
        if (!canPay || row.status !== "ISSUED") return null;
        const open = openIntentFor(row.id);
        return (
          <Button
            size="sm"
            variant={open ? "outline" : "primary"}
            disabled={startingId === row.id}
            aria-label={t("payment.payAria", { number: row.number ?? row.id })}
            onClick={() => void pay(row)}
          >
            {startingId === row.id ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <CreditCard aria-hidden />
            )}
            {startingId === row.id ? t("payment.preparing") : t("payment.pay")}
          </Button>
        );
      },
    },
  ];

  const paymentColumns: Column<PaymentIntent>[] = [
    {
      key: "reference",
      header: t("payment.columns.reference"),
      isRowHeader: true,
      render: (row) => <span className="font-mono text-xs">{row.reference}</span>,
    },
    {
      key: "amount",
      header: t("payment.columns.amount"),
      align: "end",
      render: (row) => formatPrice(row.amountAed, "en"),
    },
    {
      key: "status",
      header: t("payment.columns.status"),
      render: (row) => (
        <Badge variant={PAYMENT_VARIANT[row.status] ?? "neutral"}>
          {t(`payment.status.${row.status}`, { defaultValue: row.status })}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("payment.columns.actions"),
      align: "end",
      render: (row) =>
        canPay && !TERMINAL.includes(row.status) ? (
          <Button size="sm" variant="outline" onClick={() => setActive(row)}>
            {t("payment.transferTitle")}
          </Button>
        ) : null,
    },
  ];

  const instructions = active?.instructions ?? null;
  const blocked = active?.status === "BLOCKED";

  return (
    <>
      <h2 className="mb-2 mt-6 text-sm font-bold text-ink">
        {t("subscription.invoices")}
      </h2>
      <DataTable
        caption={t("subscription.invoices")}
        columns={invoiceColumns}
        rows={invoices}
        rowKey={(row) => row.id}
        loading={invoicesLoading}
        empty={{ title: t("subscription.noInvoices") }}
        pagination={{
          total: invoiceTotal,
          limit: PAGE_SIZE,
          offset,
          onChange: setOffset,
        }}
      />

      <h2 className="mb-2 mt-6 text-sm font-bold text-ink">{t("payment.title")}</h2>
      <DataTable
        caption={t("payment.title")}
        columns={paymentColumns}
        rows={intents}
        rowKey={(row) => row.id}
        loading={paymentsLoading}
        empty={{ title: t("payment.none") }}
      />

      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blocked ? t("payment.blockedTitle") : t("payment.transferTitle")}
            </DialogTitle>
            <DialogDescription>
              {blocked ? t("payment.blockedBody") : t("payment.referenceHint")}
            </DialogDescription>
          </DialogHeader>

          {active && blocked && (
            <Card className="border-danger/40 bg-danger-soft p-3 text-sm text-danger-strong">
              {active.blockedReason
                ? t("payment.blockedReason", { reason: active.blockedReason })
                : t("payment.blockedTitle")}
            </Card>
          )}

          {active && !blocked && active.checkoutUrl && (
            <Button asChild>
              <a href={active.checkoutUrl} target="_blank" rel="noreferrer noopener">
                <ExternalLink aria-hidden />
                {t("payment.checkout")}
              </a>
            </Button>
          )}

          {active && !blocked && !active.checkoutUrl && (
            <dl className="flex flex-col gap-2 text-sm">
              <CopyRow
                label={t("payment.reference")}
                value={instructions?.quoteReference ?? active.reference}
                emphasis
                copyLabel={t("payment.copy")}
                copyAria={t("payment.copyAria", { field: t("payment.reference") })}
                onCopy={copy}
                field={t("payment.reference")}
              />
              <CopyRow
                label={t("payment.amount")}
                value={formatPrice(active.amountAed, "en")}
                copyLabel={t("payment.copy")}
                copyAria={t("payment.copyAria", { field: t("payment.amount") })}
                onCopy={copy}
                field={t("payment.amount")}
              />
              {instructions?.beneficiary && (
                <CopyRow
                  label={t("payment.beneficiary")}
                  value={instructions.beneficiary}
                  copyLabel={t("payment.copy")}
                  copyAria={t("payment.copyAria", { field: t("payment.beneficiary") })}
                  onCopy={copy}
                  field={t("payment.beneficiary")}
                />
              )}
              {instructions?.iban ? (
                <CopyRow
                  label={t("payment.iban")}
                  value={instructions.iban}
                  copyLabel={t("payment.copy")}
                  copyAria={t("payment.copyAria", { field: t("payment.iban") })}
                  onCopy={copy}
                  field={t("payment.iban")}
                />
              ) : (
                <p className="rounded-card border border-warning/40 bg-warning-soft p-2 text-sm text-ink">
                  {t("payment.missingIban")}
                </p>
              )}
              {instructions?.bank && (
                <CopyRow
                  label={t("payment.bank")}
                  value={instructions.bank}
                  copyLabel={t("payment.copy")}
                  copyAria={t("payment.copyAria", { field: t("payment.bank") })}
                  onCopy={copy}
                  field={t("payment.bank")}
                />
              )}
              {instructions?.trn && (
                <CopyRow
                  label={t("payment.trn")}
                  value={instructions.trn}
                  copyLabel={t("payment.copy")}
                  copyAria={t("payment.copyAria", { field: t("payment.trn") })}
                  onCopy={copy}
                  field={t("payment.trn")}
                />
              )}
            </dl>
          )}

          {active && active.status === "PENDING_CONFIRMATION" && (
            <p className="mt-3 rounded-card border border-warning/40 bg-warning-soft p-3 text-sm text-ink">
              {t("payment.pendingNotice")}
            </p>
          )}
          {active && active.status === "SETTLED" && (
            <p className="mt-3 rounded-card border border-success/40 bg-success-soft p-3 text-sm text-success-strong">
              {t("payment.settledNotice")}
            </p>
          )}

          <DialogFooter>
            {active && !TERMINAL.includes(active.status) && !blocked && (
              <Button
                variant="ghost"
                onClick={() => setCancelFor(active)}
              >
                <Ban aria-hidden />
                {t("payment.cancelPayment")}
              </Button>
            )}
            {active && active.status === "REQUIRES_ACTION" && !blocked && (
              <Button
                onClick={() => {
                  setDeclareFor(active);
                  setDeclareRef("");
                }}
              >
                {t("payment.declare")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={declareFor !== null}
        onOpenChange={(open) => {
          if (!open) setDeclareFor(null);
        }}
        title={t("payment.declareTitle")}
        body={t("payment.declareBody")}
        confirmLabel={t("payment.declareSubmit")}
        cancelLabel={t("payment.declareCancel")}
        tone="primary"
        busy={busy}
        onConfirm={() => void doDeclare()}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="declare-ref">{t("payment.declareRefLabel")}</Label>
          <Input
            id="declare-ref"
            value={declareRef}
            maxLength={64}
            placeholder={t("payment.declareRefPlaceholder")}
            onChange={(event) => setDeclareRef(event.target.value)}
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={cancelFor !== null}
        onOpenChange={(open) => {
          if (!open) setCancelFor(null);
        }}
        title={t("payment.cancelTitle")}
        body={t("payment.cancelBody", { reference: cancelFor?.reference ?? "" })}
        confirmLabel={t("payment.cancelConfirm")}
        cancelLabel={t("payment.cancelKeep")}
        busy={busy}
        onConfirm={() => void doCancel()}
      />
    </>
  );
}

function CopyRow({
  label,
  value,
  field,
  emphasis,
  copyLabel,
  copyAria,
  onCopy,
}: {
  label: string;
  value: string;
  field: string;
  emphasis?: boolean;
  copyLabel: string;
  copyAria: string;
  onCopy: (value: string, field: string) => void | Promise<void>;
}) {
  return (
    <div
      className={
        emphasis
          ? "flex flex-wrap items-center justify-between gap-2 rounded-card border border-brand-border bg-brand-surface p-3"
          : "flex flex-wrap items-center justify-between gap-2 rounded-card bg-page p-2"
      }
    >
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd
          className={
            emphasis
              ? "select-all break-all font-mono text-base font-extrabold text-brand"
              : "select-all break-all text-sm text-ink"
          }
        >
          {value}
        </dd>
      </div>
      <Button
        size="sm"
        variant="outline"
        aria-label={copyAria}
        onClick={() => void onCopy(value, field)}
      >
        <Copy aria-hidden />
        {copyLabel}
      </Button>
    </div>
  );
}
