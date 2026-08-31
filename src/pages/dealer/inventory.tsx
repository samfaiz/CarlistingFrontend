/**
 * /dealer/inventory — inventory manager (task P3-03, FR-DP2/DP3).
 *
 * The stock is the DEALERSHIP's, not the signed-in person's. This page used to
 * call `myListings`, which is scoped by userId: the owner saw their own private
 * ads mixed in and a colleague who had not personally created anything saw an
 * empty showroom. `getDealerInventory` is scoped by dealerId, so every team
 * member sees the same cars — which is the whole point of a dealer portal.
 *
 * ARCHIVED is excluded from every other view by the backend, so without its own
 * chip a removed car is simply unreachable — no recycle bin, no way back. The
 * DRAFT chip exists for the same reason: unfinished cars are invisible in the
 * default view and easy to abandon.
 *
 * Every action refetches rather than patching local state: the server can refuse
 * a transition (quota, lapse, restore window) and a row must never claim
 * something the server did not do.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import * as React from "react";
import {
  ExternalLink,
  Images,
  Loader2,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  RotateCcw,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { BoostDialog } from "@/components/dealer/boost-dialog";
import { ConfirmDialog } from "@/components/dealer/confirm-dialog";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import {
  archiveListing,
  getDealerBoosts,
  getDealerInventory,
  markListingSold,
  pauseListing,
  renewListing,
  restoreListing,
  resumeListing,
  type ListingDetail,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 20;
const FILTERS = [
  "ALL",
  "LIVE",
  "PENDING_REVIEW",
  "DRAFT",
  "PAUSED",
  "EXPIRED",
  "SOLD",
  "REJECTED",
  "ARCHIVED",
] as const;

const STATUS_VARIANT: Record<string, "navy" | "green" | "amber" | "red" | "neutral"> = {
  LIVE: "green",
  PENDING_REVIEW: "amber",
  DRAFT: "neutral",
  PAUSED: "neutral",
  SOLD: "navy",
  EXPIRED: "neutral",
  REJECTED: "red",
  ARCHIVED: "red",
};

const listingLabel = (row: ListingDetail) =>
  `${row.year} ${row.make.name} ${row.model.name}${row.trim ? ` ${row.trim.name}` : ""}`;

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
  const [archiveTarget, setArchiveTarget] = React.useState<ListingDetail | null>(null);
  const [archiveReason, setArchiveReason] = React.useState("");
  const [restoreTarget, setRestoreTarget] = React.useState<ListingDetail | null>(null);
  const [confirmBusy, setConfirmBusy] = React.useState(false);

  const dealerId = context?.dealer?.id;

  const loadBoosts = React.useCallback(async () => {
    if (!accessToken || !dealerId) return;
    try {
      const { boosts } = await getDealerBoosts(dealerId, accessToken);
      setBoostedIds(new Set(boosts.map((b) => b.listingId)));
    } catch {
      // Non-fatal: rows simply lose the lightning indicator.
    }
  }, [accessToken, dealerId]);

  React.useEffect(() => {
    void loadBoosts();
  }, [loadBoosts]);

  const load = React.useCallback(async () => {
    if (!accessToken || !dealerId) return;
    setListLoading(true);
    setListError(null);
    try {
      const page = await getDealerInventory(dealerId, accessToken, {
        status: filter === "ALL" ? undefined : filter,
        limit: PAGE_SIZE,
        offset,
      });
      setRows(page.items);
      setTotal(page.total);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : t("errors.load"));
    } finally {
      setListLoading(false);
    }
  }, [accessToken, dealerId, filter, offset, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const act = async (
    id: string,
    action: () => Promise<unknown>,
    successKey: string,
  ) => {
    setBusyId(id);
    try {
      await action();
      toast({ title: t(successKey), variant: "success" });
      await Promise.all([load(), loadBoosts(), refresh()]);
    } catch (err) {
      // Quota and window refusals carry a message worth showing verbatim — "you
      // are at your limit, pause one or upgrade" is actionable; "failed" is not.
      const message =
        err instanceof ApiError && err.statusCode !== 0
          ? err.message
          : t("inventory.toast.failed");
      toast({ title: message, variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget || !accessToken || confirmBusy) return;
    setConfirmBusy(true);
    const target = archiveTarget;
    const reason = archiveReason.trim();
    try {
      await act(
        target.id,
        () => archiveListing(target.id, accessToken, reason || undefined),
        "inventory.toast.archived",
      );
      setArchiveTarget(null);
      setArchiveReason("");
    } finally {
      setConfirmBusy(false);
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget || !accessToken || confirmBusy) return;
    setConfirmBusy(true);
    const target = restoreTarget;
    try {
      await act(
        target.id,
        () => restoreListing(target.id, accessToken),
        "inventory.toast.restored",
      );
      setRestoreTarget(null);
    } finally {
      setConfirmBusy(false);
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
          {/* The row's home is its edit screen: a DRAFT or ARCHIVED car has no
              public page, and the dealer's next act on any of them is a fix. */}
          <Link href={`/listings/${row.id}/edit`} className="hover:underline">
            {listingLabel(row)}
          </Link>
          {row.status === "LIVE" && (
            <Link
              href={`/cars/${row.slug}`}
              className="text-muted hover:text-brand"
              aria-label={`${listingLabel(row)} — ${t("nav.publicProfile")}`}
            >
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          )}
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
        const archived = row.status === "ARCHIVED";
        return (
          <span className="flex flex-wrap justify-end gap-1.5">
            {archived ? (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => setRestoreTarget(row)}
                aria-label={`${t("inventory.actions.restore")} — ${listingLabel(row)}`}
              >
                <RotateCcw aria-hidden />
                {t("inventory.actions.restore")}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  aria-label={`${t("inventory.actions.edit")} — ${listingLabel(row)}`}
                >
                  <Link href={`/listings/${row.id}/edit`}>
                    <Pencil aria-hidden />
                    {t("inventory.actions.edit")}
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  aria-label={`${t("inventory.actions.photos")} — ${listingLabel(row)}`}
                >
                  <Link href={`/listings/${row.id}/photos`}>
                    <Images aria-hidden />
                    {t("inventory.actions.photos")}
                  </Link>
                </Button>
                {row.status === "LIVE" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || boostedIds.has(row.id)}
                      onClick={() =>
                        setBoostTarget({ id: row.id, label: listingLabel(row) })
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
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setArchiveTarget(row);
                    setArchiveReason("");
                  }}
                  aria-label={`${t("inventory.actions.archive")} — ${listingLabel(row)}`}
                >
                  <Trash2 aria-hidden />
                  {t("inventory.actions.archive")}
                </Button>
              </>
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

      {filter === "ARCHIVED" && (
        <p className="mb-2 text-sm text-muted">{t("inventory.archivedHint")}</p>
      )}
      {filter === "DRAFT" && (
        <p className="mb-2 text-sm text-muted">{t("inventory.draftHint")}</p>
      )}

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

      <ConfirmDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={t("inventory.archive.title")}
        body={t("inventory.archive.lead", {
          listing: archiveTarget ? listingLabel(archiveTarget) : "",
        })}
        effects={[
          t("inventory.archive.effects.offSite"),
          t("inventory.archive.effects.slot"),
          t("inventory.archive.effects.boost"),
          t("inventory.archive.effects.restore"),
        ]}
        confirmLabel={t("inventory.archive.confirm")}
        cancelLabel={t("inventory.archive.cancel")}
        busy={confirmBusy}
        onConfirm={() => void confirmArchive()}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="archive-reason">{t("inventory.archive.reasonLabel")}</Label>
          <Input
            id="archive-reason"
            value={archiveReason}
            maxLength={200}
            placeholder={t("inventory.archive.reasonPlaceholder")}
            onChange={(event) => setArchiveReason(event.target.value)}
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        title={t("inventory.restore.title")}
        body={t("inventory.restore.body", {
          listing: restoreTarget ? listingLabel(restoreTarget) : "",
        })}
        confirmLabel={t("inventory.restore.confirm")}
        cancelLabel={t("inventory.restore.cancel")}
        tone="primary"
        busy={confirmBusy}
        onConfirm={() => void confirmRestore()}
      />

      {dealerId && accessToken && (
        <BoostDialog
          dealerId={dealerId}
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
