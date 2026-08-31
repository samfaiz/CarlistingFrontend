/**
 * /admin/subscriptions — the staff subscriptions workspace.
 *
 * The endpoints were complete and audited long before this page existed, which
 * meant the only way to give a dealership a plan was an engineer running curl —
 * so a dealership nobody hand-provisioned could never publish anything.
 *
 * Two things the layout argues on purpose:
 *
 *  1. The REQUEST QUEUE is the front door. A pending request is a dealership
 *     waiting on us, so it opens first and the queue is ordered oldest-first.
 *  2. PENDING_PAYMENT grants NO quota. "I assigned the plan and they still
 *     cannot publish" is the exact confusion this screen exists to remove, so
 *     the state is a chip on the row and a callout above the table, not a
 *     status word a reader has to know the meaning of.
 */
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AlertTriangle, Info, Loader2, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  approveSubscriptionRequest,
  assignPackage,
  cancelSubscription,
  declineSubscriptionRequest,
  listSalePackages,
  listSubscriptionRequests,
  listSubscriptions,
  searchDealers,
  SUBSCRIPTION_REQUEST_STATUSES,
  SUBSCRIPTION_STATUSES,
  type AdminSubscription,
  type AdminSubscriptionRequest,
  type AedAmount,
  type DealerDirectoryRow,
  type SalePackage,
  type SubscriptionRequestStatus,
  type SubscriptionStatus,
} from "@/components/admin/subscriptions-api";
import { DataTable, StatCard, type Column } from "@/components/workspace/data-table";
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
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 25;
const MIN_REASON = 3;
const MAX_REASON = 300;

/** Statuses whose quota is actually being served right now. */
const QUOTA_GRANTING: SubscriptionStatus[] = ["ACTIVE", "GRACE"];
/** Cancelling anything already terminal is a 409 — do not offer it. */
const CANCELLABLE: SubscriptionStatus[] = ["PENDING_PAYMENT", "ACTIVE", "GRACE", "SUSPENDED"];

const STATUS_TONE: Record<SubscriptionStatus, "green" | "amber" | "red" | "neutral"> = {
  ACTIVE: "green",
  PENDING_PAYMENT: "amber",
  GRACE: "amber",
  SUSPENDED: "red",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
};

const REQUEST_TONE: Record<SubscriptionRequestStatus, "green" | "amber" | "red" | "neutral"> = {
  PENDING: "amber",
  APPROVED: "green",
  DECLINED: "red",
  WITHDRAWN: "neutral",
};

/**
 * Whole AED with thousands separators. Decimal(12,2) arrives as a number or a
 * decimal string and is already in dirhams — dividing it by 100 is the bug
 * that once printed a AED 1,500 package as "AED 15".
 */
function aed(value: AedAmount | null | undefined, locale: string): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "—";
  return `AED ${amount.toLocaleString(`${locale}-u-nu-latn`, { maximumFractionDigits: 2 })}`;
}

function shortDate(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(`${locale}-u-nu-latn`, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** The server's refusals here are specific and useful — never swallow them. */
function errorText(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";
  return message.trim() ? message : fallback;
}

export default function AdminSubscriptionsPage() {
  const { t } = useTranslation("admin-subscriptions");
  const router = useRouter();
  const locale = router.locale ?? "en";
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [packages, setPackages] = React.useState<SalePackage[]>([]);

  // ── Request queue ─────────────────────────────────────────────────────────
  const [requestStatus, setRequestStatus] = React.useState<SubscriptionRequestStatus | "">(
    "PENDING",
  );
  const [requestOffset, setRequestOffset] = React.useState(0);
  const [requests, setRequests] = React.useState<AdminSubscriptionRequest[]>([]);
  const [requestTotal, setRequestTotal] = React.useState(0);
  const [requestsLoading, setRequestsLoading] = React.useState(true);
  const [requestsError, setRequestsError] = React.useState<string | null>(null);

  // ── Subscription list ─────────────────────────────────────────────────────
  const [subStatus, setSubStatus] = React.useState<SubscriptionStatus | "">("");
  const [subOffset, setSubOffset] = React.useState(0);
  const [subs, setSubs] = React.useState<AdminSubscription[]>([]);
  const [subTotal, setSubTotal] = React.useState(0);
  const [subsLoading, setSubsLoading] = React.useState(true);
  const [subsError, setSubsError] = React.useState<string | null>(null);

  // ── Summary counters ──────────────────────────────────────────────────────
  const [counts, setCounts] = React.useState({
    pendingRequests: 0,
    active: 0,
    pendingPayment: 0,
    grace: 0,
  });

  const [busy, setBusy] = React.useState<string | null>(null);

  const loadRequests = React.useCallback(async () => {
    if (!token) return;
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const page = await listSubscriptionRequests(token, {
        status: requestStatus,
        limit: PAGE_SIZE,
        offset: requestOffset,
      });
      setRequests(page.items);
      setRequestTotal(page.total);
    } catch (error) {
      setRequestsError(errorText(error, t("requests.loadFailed")));
    } finally {
      setRequestsLoading(false);
    }
  }, [token, requestStatus, requestOffset, t]);

  const loadSubs = React.useCallback(async () => {
    if (!token) return;
    setSubsLoading(true);
    setSubsError(null);
    try {
      const page = await listSubscriptions(token, {
        status: subStatus,
        limit: PAGE_SIZE,
        offset: subOffset,
      });
      setSubs(page.items);
      setSubTotal(page.total);
    } catch (error) {
      setSubsError(errorText(error, t("subs.loadFailed")));
    } finally {
      setSubsLoading(false);
    }
  }, [token, subStatus, subOffset, t]);

  const loadCounts = React.useCallback(async () => {
    if (!token) return;
    try {
      const [pendingRequests, active, pendingPayment, grace] = await Promise.all([
        listSubscriptionRequests(token, { status: "PENDING", limit: 1 }),
        listSubscriptions(token, { status: "ACTIVE", limit: 1 }),
        listSubscriptions(token, { status: "PENDING_PAYMENT", limit: 1 }),
        listSubscriptions(token, { status: "GRACE", limit: 1 }),
      ]);
      setCounts({
        pendingRequests: pendingRequests.total,
        active: active.total,
        pendingPayment: pendingPayment.total,
        grace: grace.total,
      });
    } catch {
      // The counters are a summary of lists the operator can still read below;
      // a failed count must not blank the workspace.
    }
  }, [token]);

  React.useEffect(() => {
    void loadRequests();
  }, [loadRequests]);
  React.useEffect(() => {
    void loadSubs();
  }, [loadSubs]);
  React.useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  React.useEffect(() => {
    if (!token) return;
    listSalePackages(token)
      .then(setPackages)
      .catch((error: unknown) => {
        toast({ title: errorText(error, t("toast.packagesFailed")), variant: "warning" });
      });
  }, [token, t]);

  const refreshAll = React.useCallback(async () => {
    await Promise.all([loadRequests(), loadSubs(), loadCounts()]);
  }, [loadRequests, loadSubs, loadCounts]);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [approving, setApproving] = React.useState<AdminSubscriptionRequest | null>(null);
  const [declining, setDeclining] = React.useState<AdminSubscriptionRequest | null>(null);
  const [declineReason, setDeclineReason] = React.useState("");
  const [cancelling, setCancelling] = React.useState<AdminSubscription | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = React.useState(true);
  const [assignOpen, setAssignOpen] = React.useState(false);

  /** Shared by the assign form and the approve form. */
  const [formPackageId, setFormPackageId] = React.useState("");
  const [formStartsAt, setFormStartsAt] = React.useState("");
  const [formTermMonths, setFormTermMonths] = React.useState("");
  const [formPrice, setFormPrice] = React.useState("");

  const resetForm = (packageId: string) => {
    setFormPackageId(packageId);
    setFormStartsAt("");
    setFormTermMonths("");
    setFormPrice("");
  };

  const selectedPackage = packages.find((p) => p.id === formPackageId) ?? null;

  /** What will actually be charged: the override if given, else the package. */
  const effectivePrice = (): AedAmount | null => {
    if (formPrice.trim() !== "") return Number(formPrice);
    return selectedPackage ? selectedPackage.priceAed : null;
  };
  const effectiveTerm = (): number | null => {
    if (formTermMonths.trim() !== "") return Number(formTermMonths);
    return selectedPackage ? selectedPackage.termMonths : null;
  };

  const termsFromForm = () => ({
    packageId: formPackageId,
    ...(formStartsAt ? { startsAt: new Date(formStartsAt).toISOString() } : {}),
    ...(formTermMonths.trim() !== "" ? { termMonths: Number(formTermMonths) } : {}),
    ...(formPrice.trim() !== "" ? { priceAedOverride: Number(formPrice) } : {}),
  });

  // ── Dealer picker (assign only) ───────────────────────────────────────────
  const [dealerQuery, setDealerQuery] = React.useState("");
  const [dealerResults, setDealerResults] = React.useState<DealerDirectoryRow[]>([]);
  const [dealerSearching, setDealerSearching] = React.useState(false);
  const [dealerSearchError, setDealerSearchError] = React.useState<string | null>(null);
  const [chosenDealer, setChosenDealer] = React.useState<DealerDirectoryRow | null>(null);
  const [manualDealerId, setManualDealerId] = React.useState("");

  React.useEffect(() => {
    if (!assignOpen || !token) return;
    setDealerSearching(true);
    const handle = window.setTimeout(() => {
      searchDealers(token, { q: dealerQuery.trim() || undefined, limit: 8 })
        .then((page) => {
          setDealerResults(page.items);
          setDealerSearchError(null);
        })
        .catch((error: unknown) => {
          setDealerResults([]);
          // A finance-only admin may hold billing.subscriptions.* without
          // marketplace.dealers.view; the manual id field is their way through.
          setDealerSearchError(errorText(error, t("assign.dealerSearchFailed")));
        })
        .finally(() => setDealerSearching(false));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [assignOpen, token, dealerQuery, t]);

  const assignDealerId = chosenDealer?.id ?? manualDealerId.trim();

  const openAssign = () => {
    resetForm(packages[0]?.id ?? "");
    setChosenDealer(null);
    setManualDealerId("");
    setDealerQuery("");
    setAssignOpen(true);
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const run = async (key: string, action: () => Promise<unknown>, successKey: string) => {
    setBusy(key);
    try {
      await action();
      toast({ title: t(successKey), variant: "success" });
      await refreshAll();
      return true;
    } catch (error) {
      toast({ title: errorText(error, t("toast.failed")), variant: "error" });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const submitAssign = async () => {
    const ok = await run(
      "assign",
      () => assignPackage({ dealerId: assignDealerId, ...termsFromForm() }, token),
      "toast.assigned",
    );
    if (ok) setAssignOpen(false);
  };

  const submitApprove = async () => {
    const request = approving;
    if (!request) return;
    const ok = await run(
      request.id,
      () => {
        const { packageId, ...rest } = termsFromForm();
        return approveSubscriptionRequest(request.id, { packageId, ...rest }, token);
      },
      "toast.approved",
    );
    if (ok) setApproving(null);
  };

  const submitDecline = async () => {
    const request = declining;
    if (!request) return;
    const ok = await run(
      request.id,
      () => declineSubscriptionRequest(request.id, declineReason.trim(), token),
      "toast.declined",
    );
    if (ok) setDeclining(null);
  };

  const submitCancel = async () => {
    const subscription = cancelling;
    if (!subscription) return;
    const ok = await run(
      subscription.id,
      () => cancelSubscription(subscription.id, cancelAtPeriodEnd, token),
      cancelAtPeriodEnd ? "toast.cancelScheduled" : "toast.cancelledNow",
    );
    if (ok) setCancelling(null);
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const requestColumns: Column<AdminSubscriptionRequest>[] = [
    {
      key: "dealer",
      header: t("requests.columns.dealer"),
      isRowHeader: true,
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <span className="font-medium text-ink">{row.dealer.name}</span>
          <span className="text-xs text-muted">
            {t(`verification.${row.dealer.verificationStatus}`, {
              defaultValue: row.dealer.verificationStatus,
            })}
          </span>
        </span>
      ),
    },
    {
      key: "package",
      header: t("requests.columns.package"),
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <span>{row.package.name}</span>
          <span className="text-xs text-muted">{aed(row.package.priceAed, locale)}</span>
        </span>
      ),
    },
    {
      key: "note",
      header: t("requests.columns.note"),
      render: (row) =>
        row.note ? (
          <span className="block max-w-[22rem] text-xs text-muted-strong">{row.note}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "waiting",
      header: t("requests.columns.waiting"),
      render: (row) => (
        <span title={shortDate(row.createdAt, locale)}>
          {formatRelativeTime(row.createdAt, locale)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("requests.columns.status"),
      render: (row) => (
        <span className="flex flex-col items-start gap-1">
          <Badge variant={REQUEST_TONE[row.status]}>{t(`requestStatus.${row.status}`)}</Badge>
          {row.declineReason && (
            <span className="block max-w-[16rem] text-xs text-muted">{row.declineReason}</span>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("requests.columns.actions"),
      align: "end",
      render: (row) =>
        row.status === "PENDING" ? (
          <span className="flex justify-end gap-1.5">
            <Button
              size="sm"
              disabled={busy === row.id}
              onClick={() => {
                resetForm(row.packageId);
                setApproving(row);
              }}
            >
              {t("requests.approve")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy === row.id}
              onClick={() => {
                setDeclineReason("");
                setDeclining(row);
              }}
            >
              {t("requests.decline")}
            </Button>
          </span>
        ) : (
          <span className="text-xs text-muted">
            {row.decidedAt ? formatRelativeTime(row.decidedAt, locale) : "—"}
          </span>
        ),
    },
  ];

  const subColumns: Column<AdminSubscription>[] = [
    {
      key: "dealer",
      header: t("subs.columns.dealer"),
      isRowHeader: true,
      render: (row) => <span className="font-medium text-ink">{row.dealer.name}</span>,
    },
    {
      key: "package",
      header: t("subs.columns.package"),
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <span>{row.terms?.name ?? row.package.name}</span>
          <span className="text-xs text-muted">{row.terms?.tier ?? row.package.tier}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: t("subs.columns.status"),
      render: (row) => (
        <span className="flex flex-col items-start gap-1">
          <Badge variant={STATUS_TONE[row.status]}>{t(`status.${row.status}`)}</Badge>
          {row.status === "PENDING_PAYMENT" && (
            <Badge variant="red">{t("subs.noQuotaChip")}</Badge>
          )}
          {row.cancelAtPeriodEnd && row.status !== "CANCELLED" && (
            <Badge variant="neutral">{t("subs.cancelScheduledChip")}</Badge>
          )}
        </span>
      ),
    },
    {
      key: "term",
      header: t("subs.columns.term"),
      render: (row) => (
        <span className="flex flex-col gap-0.5">
          <span>
            {t("subs.termRange", {
              start: shortDate(row.startsAt, locale),
              end: shortDate(row.endsAt, locale),
            })}
          </span>
          <span className="text-xs text-muted">
            {t("subs.endsIn", { when: formatRelativeTime(row.endsAt, locale) })}
          </span>
        </span>
      ),
    },
    {
      key: "price",
      header: t("subs.columns.price"),
      align: "end",
      render: (row) =>
        row.terms ? (
          <span className="flex flex-col items-end gap-0.5">
            <span className="font-semibold">{aed(row.terms.priceAed, locale)}</span>
            <span className="text-xs text-muted">
              {t("subs.termMonths", { n: row.terms.termMonths })}
            </span>
          </span>
        ) : (
          <span className="text-muted" title={t("subs.noSnapshotHint")}>
            {t("subs.noSnapshot")}
          </span>
        ),
    },
    {
      key: "quota",
      header: t("subs.columns.quota"),
      align: "end",
      render: (row) => {
        if (!row.terms) return <span className="text-muted">—</span>;
        return QUOTA_GRANTING.includes(row.status) ? (
          <span className="font-semibold">{row.terms.listingQuota}</span>
        ) : (
          <span className="text-muted">
            {t("subs.quotaWithheld", { quota: row.terms.listingQuota })}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: t("subs.columns.actions"),
      align: "end",
      render: (row) =>
        CANCELLABLE.includes(row.status) ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy === row.id}
            onClick={() => {
              setCancelAtPeriodEnd(true);
              setCancelling(row);
            }}
          >
            {t("subs.cancel")}
          </Button>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  const statusFilter = <TStatus extends string>(
    values: readonly TStatus[],
    active: TStatus | "",
    onSelect: (value: TStatus | "") => void,
    label: (value: TStatus) => string,
  ) => (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={active === "" ? "primary" : "outline"}
        aria-pressed={active === ""}
        onClick={() => onSelect("")}
      >
        {t("filters.all")}
      </Button>
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

  const packageChooser = (id: string) => (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {packages.map((pkg) => {
        const selected = pkg.id === formPackageId;
        return (
          <button
            key={pkg.id}
            type="button"
            id={`${id}-${pkg.id}`}
            aria-pressed={selected}
            onClick={() => setFormPackageId(pkg.id)}
            className={`rounded-card border p-2.5 text-start transition-colors ${
              selected
                ? "border-brand bg-brand-light text-brand"
                : "border-line bg-card text-ink hover:border-brand-border"
            }`}
          >
            <span className="block text-sm font-bold">{pkg.name}</span>
            <span className="block text-xs">
              {aed(pkg.priceAed, locale)} ·{" "}
              {t("assign.packageMeta", {
                quota: pkg.listingQuota,
                months: pkg.termMonths,
              })}
            </span>
          </button>
        );
      })}
    </div>
  );

  /** startsAt / termMonths / price override — identical in assign and approve. */
  const termFields = (id: string) => (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-starts`}>{t("assign.startsAt")}</Label>
          <Input
            id={`${id}-starts`}
            type="date"
            value={formStartsAt}
            onChange={(event) => setFormStartsAt(event.target.value)}
          />
          <p className="mt-1 text-xs text-muted">{t("assign.startsAtHint")}</p>
        </div>
        <div>
          <Label htmlFor={`${id}-term`}>{t("assign.termMonths")}</Label>
          <Input
            id={`${id}-term`}
            type="number"
            min={1}
            max={60}
            value={formTermMonths}
            onChange={(event) => setFormTermMonths(event.target.value)}
            placeholder={
              selectedPackage ? String(selectedPackage.termMonths) : t("assign.termMonths")
            }
          />
          <p className="mt-1 text-xs text-muted">{t("assign.termMonthsHint")}</p>
        </div>
      </div>

      <div>
        <Label htmlFor={`${id}-price`}>{t("assign.priceOverride")}</Label>
        <Input
          id={`${id}-price`}
          type="number"
          min={0}
          step={1}
          value={formPrice}
          onChange={(event) => setFormPrice(event.target.value)}
          placeholder={selectedPackage ? String(Number(selectedPackage.priceAed)) : "0"}
        />
        <p className="mt-1 text-xs text-muted">{t("assign.priceOverrideHint")}</p>
      </div>

      <Card className="flex gap-2 border-warning bg-warning-soft p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-warning-strong" aria-hidden />
        <p className="text-xs text-warning-strong">{t("assign.snapshotNote")}</p>
      </Card>
    </>
  );

  const summaryLine = () => {
    const price = effectivePrice();
    const months = effectiveTerm();
    if (!selectedPackage || price === null || months === null) return null;
    return (
      <p className="text-sm font-semibold text-ink">
        {t("assign.summary", {
          package: selectedPackage.name,
          price: aed(price, locale),
          months,
        })}
      </p>
    );
  };

  return (
    <AdminLayout title={t("title")}>
      <p className="mb-4 max-w-3xl text-sm text-muted">{t("subtitle")}</p>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("summary.pendingRequests")}
          value={counts.pendingRequests}
          hint={t("summary.pendingRequestsHint")}
          tone={counts.pendingRequests > 0 ? "down" : "neutral"}
        />
        <StatCard label={t("summary.active")} value={counts.active} hint={t("summary.activeHint")} />
        <StatCard
          label={t("summary.pendingPayment")}
          value={counts.pendingPayment}
          hint={t("summary.pendingPaymentHint")}
          tone={counts.pendingPayment > 0 ? "down" : "neutral"}
        />
        <StatCard label={t("summary.grace")} value={counts.grace} hint={t("summary.graceHint")} />
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">
            {t("tabs.requests", { n: counts.pendingRequests })}
          </TabsTrigger>
          <TabsTrigger value="subscriptions">{t("tabs.subscriptions")}</TabsTrigger>
        </TabsList>

        {/* ── The queue: dealerships waiting on a decision ── */}
        <TabsContent value="requests">
          {statusFilter(
            SUBSCRIPTION_REQUEST_STATUSES,
            requestStatus,
            (value) => {
              setRequestStatus(value);
              setRequestOffset(0);
            },
            (value) => t(`requestStatus.${value}`),
          )}

          <p className="mb-3 text-sm text-muted">{t("requests.count", { n: requestTotal })}</p>

          <DataTable
            caption={t("requests.caption")}
            columns={requestColumns}
            rows={requests}
            rowKey={(row) => row.id}
            loading={requestsLoading}
            error={requestsError}
            onRetry={() => void loadRequests()}
            empty={{ title: t("requests.empty.title"), hint: t("requests.empty.hint") }}
            pagination={{
              total: requestTotal,
              limit: PAGE_SIZE,
              offset: requestOffset,
              onChange: setRequestOffset,
            }}
          />
        </TabsContent>

        {/* ── Every subscription, soonest to expire first ── */}
        <TabsContent value="subscriptions">
          <Card className="mb-3 flex gap-2 border-warning bg-warning-soft p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-strong" aria-hidden />
            <p className="text-xs text-warning-strong">{t("subs.pendingPaymentCallout")}</p>
          </Card>

          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            {statusFilter(
              SUBSCRIPTION_STATUSES,
              subStatus,
              (value) => {
                setSubStatus(value);
                setSubOffset(0);
              },
              (value) => t(`status.${value}`),
            )}
            <Button size="sm" disabled={packages.length === 0} onClick={openAssign}>
              {t("subs.assign")}
            </Button>
          </div>

          <p className="mb-3 text-sm text-muted">{t("subs.count", { n: subTotal })}</p>

          <DataTable
            caption={t("subs.caption")}
            columns={subColumns}
            rows={subs}
            rowKey={(row) => row.id}
            loading={subsLoading}
            error={subsError}
            onRetry={() => void loadSubs()}
            empty={{ title: t("subs.empty.title"), hint: t("subs.empty.hint") }}
            pagination={{
              total: subTotal,
              limit: PAGE_SIZE,
              offset: subOffset,
              onChange: setSubOffset,
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ── Assign a package ── */}
      <Dialog open={assignOpen} onOpenChange={(open) => !open && setAssignOpen(false)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("assign.title")}</DialogTitle>
            <DialogDescription>{t("assign.description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="assign-dealer-search">{t("assign.dealerLabel")}</Label>
              <span className="relative block">
                <Search
                  className="pointer-events-none absolute inset-block-0 start-2 my-auto size-4 text-muted"
                  aria-hidden
                />
                <Input
                  id="assign-dealer-search"
                  className="ps-8"
                  value={dealerQuery}
                  onChange={(event) => {
                    setDealerQuery(event.target.value);
                    setChosenDealer(null);
                  }}
                  placeholder={t("assign.dealerPlaceholder")}
                />
              </span>

              {dealerSearching && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  {t("assign.searching")}
                </p>
              )}

              {dealerSearchError && (
                <p className="mt-1.5 text-xs text-danger">{dealerSearchError}</p>
              )}

              {!dealerSearching && !dealerSearchError && dealerResults.length === 0 && (
                <p className="mt-1.5 text-xs text-muted">{t("assign.noDealers")}</p>
              )}

              {dealerResults.length > 0 && (
                <ul className="mt-2 grid max-h-48 gap-1 overflow-y-auto">
                  {dealerResults.map((dealer) => {
                    const selected = chosenDealer?.id === dealer.id;
                    return (
                      <li key={dealer.id}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setChosenDealer(dealer);
                            setManualDealerId("");
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-card border p-2 text-start text-sm transition-colors ${
                            selected
                              ? "border-brand bg-brand-light text-brand"
                              : "border-line bg-card text-ink hover:border-brand-border"
                          }`}
                        >
                          <span className="flex flex-col">
                            <span className="font-medium">{dealer.name}</span>
                            <span className="text-xs text-muted">
                              {t("assign.dealerMeta", {
                                trn: dealer.trn ?? "—",
                                live: dealer.liveListings,
                              })}
                            </span>
                          </span>
                          <Badge
                            variant={dealer.verificationStatus === "VERIFIED" ? "green" : "neutral"}
                          >
                            {t(`verification.${dealer.verificationStatus}`, {
                              defaultValue: dealer.verificationStatus,
                            })}
                          </Badge>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-3">
                <Label htmlFor="assign-dealer-id">{t("assign.dealerIdLabel")}</Label>
                <Input
                  id="assign-dealer-id"
                  value={manualDealerId}
                  onChange={(event) => {
                    setManualDealerId(event.target.value);
                    setChosenDealer(null);
                  }}
                  placeholder={t("assign.dealerIdPlaceholder")}
                />
                <p className="mt-1 text-xs text-muted">{t("assign.dealerIdHint")}</p>
              </div>
            </div>

            <div>
              <Label>{t("assign.packageLabel")}</Label>
              {packageChooser("assign-package")}
            </div>

            {termFields("assign")}
            {summaryLine()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button
              disabled={!assignDealerId || !formPackageId || busy === "assign"}
              loading={busy === "assign"}
              onClick={() => void submitAssign()}
            >
              {t("assign.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approve a request ── */}
      <Dialog open={Boolean(approving)} onOpenChange={(open) => !open && setApproving(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("approve.title", { dealer: approving?.dealer.name ?? "" })}</DialogTitle>
            <DialogDescription>
              {t("approve.description", {
                package: approving?.package.name ?? "",
                price: aed(approving?.package.priceAed, locale),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {approving?.note && (
              <Card className="p-3">
                <p className="text-xs font-bold text-muted">{t("approve.noteLabel")}</p>
                <p className="mt-1 text-sm text-ink">{approving.note}</p>
              </Card>
            )}

            <div>
              <Label>{t("assign.packageLabel")}</Label>
              {packageChooser("approve-package")}
            </div>

            {termFields("approve")}
            {summaryLine()}
            <p className="text-xs text-muted">{t("approve.pendingPaymentNote")}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>
              {t("actions.cancel")}
            </Button>
            <Button
              disabled={!formPackageId || busy === approving?.id}
              loading={busy === approving?.id}
              onClick={() => void submitApprove()}
            >
              {t("approve.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Decline a request ── */}
      <Dialog open={Boolean(declining)} onOpenChange={(open) => !open && setDeclining(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("decline.title", { dealer: declining?.dealer.name ?? "" })}</DialogTitle>
            <DialogDescription>{t("decline.description")}</DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="decline-reason" required>
              {t("decline.reasonLabel")}
            </Label>
            <Textarea
              id="decline-reason"
              rows={3}
              maxLength={MAX_REASON}
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              placeholder={t("decline.placeholder")}
            />
            <p className="mt-1 text-xs text-muted">
              {t("decline.reasonHint", { min: MIN_REASON, max: MAX_REASON })}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclining(null)}>
              {t("actions.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={declineReason.trim().length < MIN_REASON || busy === declining?.id}
              loading={busy === declining?.id}
              onClick={() => void submitDecline()}
            >
              {t("decline.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel a subscription ── */}
      <Dialog open={Boolean(cancelling)} onOpenChange={(open) => !open && setCancelling(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("cancelDialog.title", { dealer: cancelling?.dealer.name ?? "" })}
            </DialogTitle>
            <DialogDescription>{t("cancelDialog.description")}</DialogDescription>
          </DialogHeader>

          <fieldset className="grid gap-2">
            <legend className="sr-only">{t("cancelDialog.legend")}</legend>
            <label
              className={`flex cursor-pointer gap-2 rounded-card border p-3 ${
                cancelAtPeriodEnd ? "border-brand bg-brand-light" : "border-line bg-card"
              }`}
            >
              <input
                type="radio"
                name="cancel-mode"
                className="mt-1"
                checked={cancelAtPeriodEnd}
                onChange={() => setCancelAtPeriodEnd(true)}
              />
              <span>
                <span className="block text-sm font-bold text-ink">
                  {t("cancelDialog.atPeriodEnd")}
                </span>
                <span className="block text-xs text-muted">
                  {t("cancelDialog.atPeriodEndHint", {
                    date: shortDate(cancelling?.endsAt, locale),
                  })}
                </span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer gap-2 rounded-card border p-3 ${
                cancelAtPeriodEnd ? "border-line bg-card" : "border-danger bg-danger-soft"
              }`}
            >
              <input
                type="radio"
                name="cancel-mode"
                className="mt-1"
                checked={!cancelAtPeriodEnd}
                onChange={() => setCancelAtPeriodEnd(false)}
              />
              <span>
                <span className="block text-sm font-bold text-ink">
                  {t("cancelDialog.immediate")}
                </span>
                <span className="block text-xs text-muted">{t("cancelDialog.immediateHint")}</span>
              </span>
            </label>
          </fieldset>

          <p className="text-sm font-semibold text-ink">
            {cancelAtPeriodEnd
              ? t("cancelDialog.confirmScheduled", {
                  dealer: cancelling?.dealer.name ?? "",
                  date: shortDate(cancelling?.endsAt, locale),
                })
              : t("cancelDialog.confirmImmediate", { dealer: cancelling?.dealer.name ?? "" })}
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)}>
              {t("actions.keep")}
            </Button>
            <Button
              variant="danger"
              disabled={busy === cancelling?.id}
              loading={busy === cancelling?.id}
              onClick={() => void submitCancel()}
            >
              {cancelAtPeriodEnd
                ? t("cancelDialog.confirmScheduledButton")
                : t("cancelDialog.confirmImmediateButton")}
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
        ["common", "admin", "admin-subscriptions"],
        nextI18NextConfig,
      )),
    },
  };
};
