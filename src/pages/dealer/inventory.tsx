/**
 * /dealer/inventory — inventory manager (task P3-03, FR-DP2/DP3).
 *
 * Status filter + pagination over GET /listings/mine with the lifecycle actions
 * the backend state machine allows per status. Every action refetches rather
 * than patching local state: the server can refuse a transition (quota, lapse)
 * and a row must never claim something the server did not do.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import * as React from "react";
import { Loader2, Pause, Play, RefreshCw, Tag, Zap } from "lucide-react";
import { BoostDialog } from "@/components/dealer/boost-dialog";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { DealerOnboarding } from "@/components/dealer/dealer-onboarding";
import { useDealer } from "@/components/dealer/use-dealer";
import {
  DataTable,
  FilterBar,
  type Column,
} from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import {
  getDealerBoosts,
  markListingSold,
  myListings,
  pauseListing,
  renewListing,
  resumeListing,
  type ListingDetail,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 20;
const FILTERS = ["ALL", "LIVE", "PENDING_REVIEW", "PAUSED", "EXPIRED", "SOLD", "REJECTED"] as const;

const STATUS_VARIANT: Record<string, "navy" | "green" | "amber" | "red" | "neutral"> = {
  LIVE: "green",
  PENDING_REVIEW: "amber",
  DRAFT: "neutral",
  PAUSED: "neutral",
  SOLD: "navy",
  EXPIRED: "neutral",
  REJECTED: "red",
};

export default function DealerInventoryPage() {
  const { t } = useTranslation("dealer");
  const { t: tListings } = useTranslation("listings");
  const { context, quota, loading, error, needsOnboarding, accessToken, refresh } =
    useDealer();

  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("ALL");
  const [offset, setOffset] = React.useState(0);
  const [rows, setRows] = React.useState<ListingDetail[]>([]);
  const [total, setTotal] = React.useState(0);
  const [listLoading, setListLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [boostTarget, setBoostTarget] = React.useState<{ id: string; label: string } | null>(null);
  const [boostedIds, setBoostedIds] = React.useState<Set<string>>(new Set());

  const loadBoosts = React.useCallback(async () => {
    if (!accessToken || !context?.dealer) return;
    try {
      const { boosts } = await getDealerBoosts(context.dealer.id, accessToken);
      setBoostedIds(new Set(boosts.map((b) => b.listingId)));
    } catch {
      // Non-fatal: rows simply lose the lightning indicator.
    }
  }, [accessToken, context?.dealer]);

  React.useEffect(() => {
    void loadBoosts();
  }, [loadBoosts]);

  const load = React.useCallback(async () => {
    if (!accessToken) return;
    setListLoading(true);
    setListError(null);
    try {
      const page = await myListings(accessToken, {
        status: filter === "ALL" ? undefined : filter,
        limit: PAGE_SIZE,
        offset,
      });
      setRows(page.items);
      setTotal(page.total);
    } catch {
      setListError(t("errors.load"));
    } finally {
      setListLoading(false);
    }
  }, [accessToken, filter, offset, t]);

  React.useEffect(() => {
    if (context?.dealer) void load();
  }, [load, context?.dealer]);

  const act = async (
    id: string,
    action: () => Promise<unknown>,
    successKey: string,
  ) => {
    setBusyId(id);
    try {
      await action();
      toast({ title: t(successKey), variant: "success" });
      await Promise.all([load(), refresh()]);
    } catch (err) {
      // Quota refusals carry a message worth showing verbatim — "you are at
      // your limit, pause one or upgrade" is actionable; "failed" is not.
      const message =
        err instanceof ApiError && err.statusCode === 409
          ? err.message
          : t("inventory.toast.failed");
      toast({ title: message, variant: "warning" });
    } finally {
      setBusyId(null);
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

  const columns: Column<ListingDetail>[] = [
    {
      key: "listing",
      header: t("inventory.columns.listing"),
      isRowHeader: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <Link href={`/cars/${row.slug}`} className="hover:underline">
            {row.year} {row.make.name} {row.model.name}
            {row.trim ? ` ${row.trim.name}` : ""}
          </Link>
          {boostedIds.has(row.id) && (
            <Zap
              className="size-3.5 text-brand-mid"
              aria-label={t("boosts.activeIndicator")}
            />
          )}
        </span>
      ),
    },
    {
      key: "price",
      header: t("inventory.columns.price"),
      align: "end",
      render: (row) => formatPrice(row.priceAed, "en"),
    },
    {
      key: "status",
      header: t("inventory.columns.status"),
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? "neutral"}>
          {tListings(`status.${row.status}`, { defaultValue: row.status })}
        </Badge>
      ),
    },
    {
      key: "views",
      header: t("inventory.columns.views"),
      align: "end",
      render: (row) => row.viewCount ?? 0,
    },
    {
      key: "expires",
      header: t("inventory.columns.expires"),
      render: (row) => (row.expiresAt ? formatRelativeTime(row.expiresAt, "en") : "—"),
    },
    {
      key: "actions",
      header: t("inventory.columns.actions"),
      align: "end",
      render: (row) => {
        const busy = busyId === row.id;
        return (
          <span className="flex justify-end gap-1.5">
            {row.status === "LIVE" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || boostedIds.has(row.id)}
                  onClick={() =>
                    setBoostTarget({
                      id: row.id,
                      label: `${row.year} ${row.make.name} ${row.model.name}`,
                    })
                  }
                >
                  <Zap aria-hidden />
                  {t("boosts.action")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void act(row.id, () => pauseListing(row.id, accessToken!), "inventory.toast.paused")
                  }
                >
                  <Pause aria-hidden />
                  {t("inventory.actions.pause")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void act(row.id, () => markListingSold(row.id, accessToken!), "inventory.toast.sold")
                  }
                >
                  <Tag aria-hidden />
                  {t("inventory.actions.sold")}
                </Button>
              </>
            )}
            {row.status === "PAUSED" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void act(row.id, () => resumeListing(row.id, accessToken!), "inventory.toast.resumed")
                }
              >
                <Play aria-hidden />
                {t("inventory.actions.resume")}
              </Button>
            )}
            {row.status === "EXPIRED" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  void act(row.id, () => renewListing(row.id, accessToken!), "inventory.toast.renewed")
                }
              >
                <RefreshCw aria-hidden />
                {t("inventory.actions.renew")}
              </Button>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <DealerLayout
      context={context}
      quota={quota}
      title={t("inventory.title")}
      actions={
        <Button size="sm" asChild>
          <Link href="/sell">{t("inventory.empty.cta")}</Link>
        </Button>
      }
    >
      {quota && !quota.canPublish && (
        <Card className="mb-3 border-warning/40 bg-warning-soft p-3 text-sm text-ink">
          {t("inventory.quotaBlocked")}
        </Card>
      )}

      <p className="mb-2 text-sm text-muted">{t("inventory.total", { count: total })}</p>

      <FilterBar
        options={FILTERS.map((f) => ({
          value: f,
          label:
            f === "ALL"
              ? t("inventory.filters.all")
              : tListings(`status.${f}`, { defaultValue: f }),
        }))}
        active={filter}
        onSelect={(value) => {
          setFilter(value as (typeof FILTERS)[number]);
          setOffset(0);
        }}
      />

      <DataTable
        caption={t("inventory.title")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={listLoading}
        error={listError}
        onRetry={() => void load()}
        empty={{
          title: t("inventory.empty.title"),
          hint: t("inventory.empty.hint"),
          action: (
            <Button size="sm" asChild className="mt-2">
              <Link href="/sell">{t("inventory.empty.cta")}</Link>
            </Button>
          ),
        }}
        pagination={{ total, limit: PAGE_SIZE, offset, onChange: setOffset }}
      />

      {context.dealer && accessToken && (
        <BoostDialog
          dealerId={context.dealer.id}
          accessToken={accessToken}
          listing={boostTarget}
          onOpenChange={(open) => {
            if (!open) setBoostTarget(null);
          }}
          onApplied={() => void loadBoosts()}
        />
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
        destination: `${prefix}/login?next=/dealer/inventory`,
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
