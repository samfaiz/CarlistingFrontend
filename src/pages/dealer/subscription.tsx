/**
 * /dealer/subscription — package, quota and invoices (task P3-06 FE, FR-DP10).
 *
 * OWNER-only, matching the backend: billing is the owner's business, and the
 * nav hides this entry for everyone else rather than showing a door that 403s.
 *
 * Invoices are read-only here by design — an issued invoice is immutable
 * (PRD §30.1), so there is no edit affordance to accidentally offer.
 */
import type { GetServerSideProps } from "next";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import * as React from "react";
import { Loader2, Zap } from "lucide-react";
import { PlanChooser } from "@/components/dealer/plan-chooser";
import { BillingPanel } from "@/components/dealer/billing-panel";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { DealerOnboarding } from "@/components/dealer/dealer-onboarding";
import { useDealer } from "@/components/dealer/use-dealer";
import { DataTable, StatCard, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import {
  cancelBoost,
  getDealerBoosts,
  getDealerInvoices,
  getDealerSubscription,
  type BoostRow,
  type DealerInvoiceRow,
  type SubscriptionRow,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso)) : "—";

export default function DealerSubscriptionPage() {
  const { t } = useTranslation("dealer");
  const { context, quota, loading, error, needsOnboarding, accessToken, refresh } =
    useDealer();

  const [current, setCurrent] = React.useState<SubscriptionRow | null>(null);
  const [history, setHistory] = React.useState<SubscriptionRow[]>([]);
  const [invoices, setInvoices] = React.useState<DealerInvoiceRow[]>([]);
  const [invoiceTotal, setInvoiceTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [boosts, setBoosts] = React.useState<BoostRow[]>([]);
  const [boostBalance, setBoostBalance] = React.useState(0);
  const [boostBusyId, setBoostBusyId] = React.useState<string | null>(null);
  /**
   * Bumped when a plan is requested or a payment settles: both change the
   * subscription and the invoice list, and the loader below is an inline effect
   * with no handle to call.
   */
  const [reloadKey, setReloadKey] = React.useState(0);

  const dealerId = context?.dealer?.id;

  const loadBoosts = React.useCallback(async () => {
    if (!accessToken || !dealerId) return;
    try {
      const wallet = await getDealerBoosts(dealerId, accessToken);
      setBoosts(wallet.boosts);
      setBoostBalance(wallet.balance);
    } catch {
      // Non-fatal: the boosts panel simply stays empty.
    }
  }, [accessToken, dealerId]);

  React.useEffect(() => {
    if (!accessToken || !dealerId) return;
    void (async () => {
      try {
        const [subscription, invoicePage] = await Promise.all([
          getDealerSubscription(dealerId, accessToken),
          getDealerInvoices(dealerId, accessToken, { limit: 10, offset }),
          loadBoosts(),
        ]);
        setCurrent(subscription.current);
        setHistory(subscription.history);
        setInvoices(invoicePage.items);
        setInvoiceTotal(invoicePage.total);
      } finally {
        setPageLoading(false);
      }
    })();
  }, [accessToken, dealerId, offset, loadBoosts, reloadKey]);

  const stopBoost = async (id: string) => {
    if (!accessToken || !dealerId) return;
    setBoostBusyId(id);
    try {
      await cancelBoost(dealerId, id, accessToken);
      toast({ title: t("boosts.toast.cancelled"), variant: "success" });
      await loadBoosts();
    } catch {
      toast({ title: t("boosts.toast.failed"), variant: "warning" });
    } finally {
      setBoostBusyId(null);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
      </main>
    );
  }
  if (needsOnboarding) return <DealerOnboarding onCreated={refresh} />;
  if (error || !context) {
    return <main className="p-8 text-sm text-muted">{t("errors.load")}</main>;
  }

  const columns: Column<DealerInvoiceRow>[] = [
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
        <Badge variant={row.status === "PAID" ? "green" : "amber"}>{row.status}</Badge>
      ),
    },
  ];

  return (
    <DealerLayout context={context} quota={quota} title={t("subscription.title")}>
      {/*
        Until now this screen could only REPORT a plan. A dealership had no way
        to ask for one and no way to pay, so a subscription existed only if an
        engineer ran a request by hand — and a dealership without one cannot
        publish at all.
      */}
      <PlanChooser
        dealerId={dealerId!}
        accessToken={accessToken!}
        currentTier={current?.package?.tier ?? null}
        onChanged={() => {
          setReloadKey((n) => n + 1);
          void refresh();
        }}
      />

      <BillingPanel
        dealerId={dealerId!}
        accessToken={accessToken!}
        canPay={context.permissions?.canManageBilling ?? false}
        onChanged={() => {
          setReloadKey((n) => n + 1);
          void refresh();
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/*
          Anchored for the E2E: the plan chooser above also renders tier names,
          so a bare "the paragraph containing Gold" now matches the wrong card.
        */}
        <Panel className="p-4" data-testid="current-plan">
          <p className="text-xs text-muted">{t("subscription.current")}</p>
          {current ? (
            <>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-lg font-extrabold text-ink">
                {current.terms?.name ?? current.package.name}
                <Badge
                  variant={
                    current.status === "ACTIVE"
                      ? "green"
                      : current.status === "GRACE"
                        ? "amber"
                        : current.status === "PENDING_PAYMENT"
                          ? "amber"
                          : "neutral"
                  }
                >
                  {current.status}
                </Badge>
              </p>
              <p className="mt-1 text-sm text-muted">
                {current.status === "PENDING_PAYMENT"
                  ? t("subscription.pendingPayment")
                  : current.status === "GRACE"
                    ? t("subscription.grace", { date: formatDate(current.graceEndsAt) })
                    : t("subscription.renews", { date: formatDate(current.endsAt) })}
              </p>
              {current.cancelAtPeriodEnd && (
                <p className="mt-1 text-sm text-warning-strong">
                  {t("subscription.cancelScheduled")}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mt-1 text-lg font-extrabold text-ink">
                {t("subscription.none")}
              </p>
              <p className="mt-1 text-sm text-muted">{t("subscription.noneHint")}</p>
            </>
          )}
        </Panel>

        <StatCard
          label={t("subscription.quota")}
          value={quota ? `${quota.occupied}/${quota.quota}` : "—"}
          hint={
            quota && current?.terms
              ? formatPrice(current.terms.priceAed, "en")
              : undefined
          }
          tone={quota && !quota.canPublish ? "down" : "neutral"}
        />
      </div>

      <h2 className="mb-2 mt-6 flex items-center gap-1.5 text-sm font-bold text-ink">
        <Zap className="size-4 text-brand-mid" aria-hidden />
        {t("boosts.title")}
      </h2>
      <Card className="p-3">
        <p className="mb-2 text-sm text-muted">
          {t("boosts.balance", { count: boostBalance })}
        </p>
        {boosts.length === 0 ? (
          <p className="text-sm text-muted">{t("boosts.none")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {boosts.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-ink">
                  {row.listing.year} {row.listing.make.name} {row.listing.model.name}
                </span>
                <span className="text-xs text-muted">
                  {row.product.name} · {t(`boosts.slot.${row.slot}`)} ·{" "}
                  {formatDate(row.startsAt)} → {formatDate(row.endsAt)}
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant={row.status === "ACTIVE" ? "green" : "neutral"}>
                    {t(`boosts.status.${row.status}`)}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={boostBusyId === row.id}
                    onClick={() => void stopBoost(row.id)}
                  >
                    {t("boosts.stop")}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <h2 className="mb-2 mt-6 text-sm font-bold text-ink">
        {t("subscription.invoices")}
      </h2>
      <DataTable
        caption={t("subscription.invoices")}
        columns={columns}
        rows={invoices}
        rowKey={(row) => row.id}
        loading={pageLoading}
        empty={{ title: t("subscription.noInvoices") }}
        pagination={{ total: invoiceTotal, limit: 10, offset, onChange: setOffset }}
      />

      {history.length > 1 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-bold text-ink">
            {t("subscription.history")}
          </h2>
          <Card className="p-3">
            <ul className="flex flex-col gap-1.5 text-sm">
              {history.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3">
                  <span className="text-ink">
                    {row.terms?.name ?? row.package.name}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(row.startsAt)} → {formatDate(row.endsAt)}
                  </span>
                  <Badge variant="neutral">{row.status}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </DealerLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return {
      redirect: {
        destination: `${prefix}/login?next=/dealer/subscription`,
        permanent: false,
      },
    };
  }
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dealer", "listings", "home"],
        nextI18NextConfig,
      )),
    },
  };
};
