/**
 * /admin/dealers — the staff dealer directory (task P4-03, FR-AD2).
 *
 * The verification queue is hard-scoped to PENDING, so an approved or rejected
 * dealership fell off every internal screen the moment it was decided. This is
 * the list that does not disappear, and the only place trading can be stopped.
 *
 * Two status concepts share the screen and must never be read as one:
 *   • verificationStatus — are their documents good? (UNVERIFIED/PENDING/
 *     VERIFIED/REJECTED). Rendered as a pill badge, one per state.
 *   • status — may they trade today? (ACTIVE/SUSPENDED). Rendered as an alarm
 *     chip when suspended and a quiet dot when not, because "trading normally"
 *     is the unremarkable default and only the stop is news.
 * A VERIFIED dealership can be suspended; an UNVERIFIED one is not in trouble.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import {
  Ban,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Users,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  DEALER_DIRECTORY_SORTS,
  DEALER_VERIFICATION_STATUSES,
  LISTING_STATUSES,
  getDealerDetail,
  getDealerDirectory,
  reinstateDealer,
  suspendDealer,
  type DealerDetail,
  type DealerDirectoryRow,
  type DealerDirectorySort,
  type DealerTradingStatus,
  type DealerVerificationStatus,
  type ListingStatusKey,
} from "@/components/admin/dealers-api";
import {
  DataTable,
  FilterBar,
  StatCard,
  type Column,
} from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 25;
/** Mirrors SuspendDealerDto — @MinLength(3) @MaxLength(500). */
const MIN_REASON = 3;
const MAX_REASON = 500;
const ANY = "ALL";

/** Verification is a document verdict: one pill per state, colour-coded. */
const VERIFICATION_TONE: Record<
  DealerVerificationStatus,
  "green" | "amber" | "red" | "neutral"
> = {
  VERIFIED: "green",
  PENDING: "amber",
  REJECTED: "red",
  UNVERIFIED: "neutral",
};

function VerificationBadge({ status }: { status: DealerVerificationStatus }) {
  const { t } = useTranslation("admin-dealers");
  return (
    <Badge variant={VERIFICATION_TONE[status]}>
      {t(`verification.${status}`)}
    </Badge>
  );
}

/**
 * Trading status deliberately does NOT look like a verification pill: suspended
 * is a red alarm chip with an icon, active is a green dot and quiet text.
 */
function TradingStatus({ status }: { status: DealerTradingStatus }) {
  const { t } = useTranslation("admin-dealers");
  if (status === "SUSPENDED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-card border border-danger/50 bg-danger-soft px-2 py-1 text-xs font-bold text-danger-strong">
        <Ban className="size-3.5" aria-hidden />
        {t("trading.SUSPENDED")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-strong">
      <span className="size-2 rounded-full bg-success" aria-hidden />
      {t("trading.ACTIVE")}
    </span>
  );
}

export default function AdminDealersPage() {
  const { t } = useTranslation("admin-dealers");
  const router = useRouter();
  const locale = router.locale ?? "en";
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [rows, setRows] = React.useState<DealerDirectoryRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const [searchInput, setSearchInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [trading, setTrading] = React.useState<DealerTradingStatus | typeof ANY>(ANY);
  const [verification, setVerification] = React.useState<
    DealerVerificationStatus | typeof ANY
  >(ANY);
  const [sort, setSort] = React.useState<DealerDirectorySort>("recent");

  const [summary, setSummary] = React.useState<{
    all: number;
    verified: number;
    pending: number;
    suspended: number;
  } | null>(null);

  const [detail, setDetail] = React.useState<DealerDetail | null>(null);
  const [detailFor, setDetailFor] = React.useState<DealerDirectoryRow | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const [confirming, setConfirming] = React.useState<{
    row: Pick<DealerDirectoryRow, "id" | "name" | "status">;
    liveListings: number;
    action: "suspend" | "reinstate";
  } | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  /** These endpoints return specific, useful refusals — show the server's own. */
  const showApiError = React.useCallback(
    (err: unknown, fallbackKey: string) => {
      const message =
        err instanceof ApiError && err.statusCode !== 0 && err.message
          ? err.message
          : t(fallbackKey);
      toast({ title: message, variant: "warning" });
    },
    [t],
  );

  const loadList = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setListError(null);
    try {
      const page = await getDealerDirectory(token, {
        ...(query ? { q: query } : {}),
        ...(verification !== ANY ? { verificationStatus: verification } : {}),
        ...(trading !== ANY ? { status: trading } : {}),
        sort,
        limit: PAGE_SIZE,
        offset,
      });
      setRows(page.items);
      setTotal(page.total);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setListError(
        err instanceof ApiError && err.statusCode !== 0 && err.message
          ? err.message
          : t("toast.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [token, query, verification, trading, sort, offset, t]);

  /** Four counted probes (limit=1) — the directory returns a real total. */
  const loadSummary = React.useCallback(async () => {
    if (!token) return;
    try {
      const [all, verified, pending, suspended] = await Promise.all([
        getDealerDirectory(token, { limit: 1 }),
        getDealerDirectory(token, { limit: 1, verificationStatus: "VERIFIED" }),
        getDealerDirectory(token, { limit: 1, verificationStatus: "PENDING" }),
        getDealerDirectory(token, { limit: 1, status: "SUSPENDED" }),
      ]);
      setSummary({
        all: all.total,
        verified: verified.total,
        pending: pending.total,
        suspended: suspended.total,
      });
    } catch {
      setSummary(null);
    }
  }, [token]);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  // Debounced search — the directory is 100 rows a page over every dealership.
  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      setQuery(searchInput.trim());
      setOffset(0);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const openDetail = React.useCallback(
    async (row: DealerDirectoryRow) => {
      if (!token) return;
      setDetailFor(row);
      setDetail(null);
      setDetailLoading(true);
      try {
        setDetail(await getDealerDetail(row.id, token));
      } catch (err) {
        setDetailFor(null);
        showApiError(err, "toast.detailFailed");
      } finally {
        setDetailLoading(false);
      }
    },
    [token, showApiError],
  );

  const runAction = async () => {
    if (!confirming || !token) return;
    setBusy(true);
    try {
      if (confirming.action === "suspend") {
        const result = await suspendDealer(confirming.row.id, reason.trim(), token);
        toast({
          title: t("toast.suspended", { name: confirming.row.name }),
          description: t("toast.suspendedDetail", { count: result.listingsPaused }),
          variant: "success",
        });
      } else {
        const result = await reinstateDealer(confirming.row.id, token);
        toast({
          title: t("toast.reinstated", { name: confirming.row.name }),
          description: t("toast.reinstatedDetail", { count: result.listingsRestored }),
          variant: "success",
        });
      }
      setConfirming(null);
      setReason("");
      await Promise.all([loadList(), loadSummary()]);
      if (detailFor && detailFor.id === confirming.row.id && token) {
        try {
          setDetail(await getDealerDetail(confirming.row.id, token));
        } catch {
          setDetail(null);
        }
      }
    } catch (err) {
      showApiError(err, "toast.actionFailed");
    } finally {
      setBusy(false);
    }
  };

  const askSuspend = (row: DealerDirectoryRow | DealerDetail, liveListings: number) => {
    setReason("");
    setConfirming({
      row: { id: row.id, name: row.name, status: row.status },
      liveListings,
      action: "suspend",
    });
  };

  const askReinstate = (row: DealerDirectoryRow | DealerDetail) => {
    setReason("");
    setConfirming({
      row: { id: row.id, name: row.name, status: row.status },
      liveListings: 0,
      action: "reinstate",
    });
  };

  const columns: Column<DealerDirectoryRow>[] = [
    {
      key: "name",
      header: t("columns.dealer"),
      isRowHeader: true,
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => void openDetail(row)}
          className="text-start font-semibold text-brand hover:underline"
        >
          {row.name}
          <span className="block text-xs font-normal text-muted">{row.slug}</span>
        </button>
      ),
    },
    {
      key: "trn",
      header: t("columns.trn"),
      render: (row) => (
        <span className="font-mono text-xs text-muted-strong">{row.trn ?? "—"}</span>
      ),
    },
    {
      key: "verification",
      header: t("columns.verification"),
      render: (row) => <VerificationBadge status={row.verificationStatus} />,
    },
    {
      key: "trading",
      header: t("columns.trading"),
      render: (row) => <TradingStatus status={row.status} />,
    },
    {
      key: "listings",
      header: t("columns.live"),
      align: "end",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-ink">{row.liveListings.toLocaleString(locale)}</span>
      ),
    },
    {
      key: "members",
      header: t("columns.team"),
      align: "end",
      render: (row) => row.memberCount.toLocaleString(locale),
    },
    {
      key: "recent",
      header: t("columns.joined"),
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted">{formatRelativeTime(row.createdAt, locale)}</span>
      ),
    },
    {
      key: "actions",
      header: t("columns.actions"),
      align: "end",
      render: (row) => (
        <span className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => void openDetail(row)}>
            {t("actions.view")}
          </Button>
          {row.status === "SUSPENDED" ? (
            <Button size="sm" variant="secondary" onClick={() => askReinstate(row)}>
              <RotateCcw aria-hidden />
              {t("actions.reinstate")}
            </Button>
          ) : (
            <Button size="sm" variant="danger" onClick={() => askSuspend(row, row.liveListings)}>
              <Ban aria-hidden />
              {t("actions.suspend")}
            </Button>
          )}
        </span>
      ),
    },
  ];

  /**
   * The sort tokens and the sortable column keys are deliberately the same
   * three strings, so the header arrow reflects the server query rather than a
   * second, local notion of order. Direction is fixed by the backend: name is
   * ascending, recent and listings are descending.
   */
  const sortDirection: "asc" | "desc" = sort === "name" ? "asc" : "desc";
  const onSort = (key: string) => {
    if (key === "name" || key === "listings" || key === "recent") {
      setSort(key as DealerDirectorySort);
      setOffset(0);
    }
  };

  const activeSubscription = detail?.subscriptions?.[0] ?? null;
  const packagePrice = activeSubscription?.terms?.priceAed;

  return (
    <AdminLayout title={t("title")}>
      <p className="mb-3 text-sm text-muted">{t("intro")}</p>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t("summary.all")}
          value={summary ? summary.all.toLocaleString(locale) : "—"}
        />
        <StatCard
          label={t("summary.verified")}
          value={summary ? summary.verified.toLocaleString(locale) : "—"}
          hint={t("summary.verifiedHint")}
          tone="up"
        />
        <StatCard
          label={t("summary.pending")}
          value={summary ? summary.pending.toLocaleString(locale) : "—"}
          hint={t("summary.pendingHint")}
        />
        <StatCard
          label={t("summary.suspended")}
          value={summary ? summary.suspended.toLocaleString(locale) : "—"}
          hint={t("summary.suspendedHint")}
          tone={summary && summary.suspended > 0 ? "down" : "neutral"}
        />
      </div>

      <FilterBar
        search={searchInput}
        onSearch={setSearchInput}
        options={[
          { value: ANY, label: t("filters.trading.ALL") },
          { value: "ACTIVE", label: t("trading.ACTIVE") },
          { value: "SUSPENDED", label: t("trading.SUSPENDED") },
        ]}
        active={trading}
        onSelect={(value) => {
          setTrading(value as DealerTradingStatus | typeof ANY);
          setOffset(0);
        }}
      >
        <span className="flex items-center gap-2">
          <Label htmlFor="dealers-verification" className="mb-0 text-xs text-muted">
            {t("filters.verificationLabel")}
          </Label>
          <Select
            value={verification}
            onValueChange={(value) => {
              setVerification(value as DealerVerificationStatus | typeof ANY);
              setOffset(0);
            }}
          >
            <SelectTrigger id="dealers-verification" className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("filters.verification.ALL")}</SelectItem>
              {DEALER_VERIFICATION_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`verification.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
        <span className="flex items-center gap-2">
          <Label htmlFor="dealers-sort" className="mb-0 text-xs text-muted">
            {t("filters.sortLabel")}
          </Label>
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as DealerDirectorySort);
              setOffset(0);
            }}
          >
            <SelectTrigger id="dealers-sort" className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEALER_DIRECTORY_SORTS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`filters.sort.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
      </FilterBar>

      <p className="mb-2 text-xs text-muted">{t("count", { count: total })}</p>

      <DataTable
        caption={t("title")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={listError}
        onRetry={() => void loadList()}
        sort={{ key: sort, direction: sortDirection }}
        onSort={onSort}
        empty={{ title: t("empty.title"), hint: t("empty.hint") }}
        pagination={{ total, limit: PAGE_SIZE, offset, onChange: setOffset }}
      />

      {/* ── Detail ─────────────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(detailFor)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailFor(null);
            setDetail(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailFor?.name ?? t("detail.title")}</DialogTitle>
            <DialogDescription>{t("detail.subtitle")}</DialogDescription>
          </DialogHeader>

          {detailLoading || !detail ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("detail.loading")}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {detail.status === "SUSPENDED" && (
                <div className="flex gap-3 rounded-card border border-danger/50 bg-danger-soft p-3">
                  <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger-strong" aria-hidden />
                  <div className="text-sm">
                    <p className="font-bold text-danger-strong">{t("detail.suspendedTitle")}</p>
                    <p className="mt-1 text-ink">
                      {detail.suspensionReason ?? t("detail.noReason")}
                    </p>
                    <p className="mt-1 text-xs text-muted-strong">
                      {t("detail.suspendedMeta", {
                        when: detail.suspendedAt
                          ? formatRelativeTime(detail.suspendedAt, locale)
                          : "—",
                        by: detail.suspendedBy?.name ?? t("detail.unknownActor"),
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Panel className="p-3">
                  <p className="text-xs text-muted">{t("detail.verificationLabel")}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <VerificationBadge status={detail.verificationStatus} />
                  </div>
                  <p className="mt-2 text-xs text-muted">{t("detail.verificationHint")}</p>
                  {detail.verificationNote && (
                    <p className="mt-1 text-xs text-ink">{detail.verificationNote}</p>
                  )}
                </Panel>
                <Panel className="p-3">
                  <p className="text-xs text-muted">{t("detail.tradingLabel")}</p>
                  <div className="mt-1.5">
                    <TradingStatus status={detail.status} />
                  </div>
                  <p className="mt-2 text-xs text-muted">{t("detail.tradingHint")}</p>
                </Panel>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-card border border-line p-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">{t("detail.trn")}</dt>
                  <dd className="font-mono text-xs text-ink">{detail.trn ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t("detail.slug")}</dt>
                  <dd className="text-xs text-ink">{detail.slug}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t("detail.joined")}</dt>
                  <dd className="text-xs text-ink">
                    {formatRelativeTime(detail.createdAt, locale)}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-muted">{t("detail.brands")}</dt>
                  <dd className="text-xs text-ink">
                    {detail.brands.length > 0 ? detail.brands.join(", ") : t("detail.none")}
                  </dd>
                </div>
              </dl>

              <section>
                <h3 className="mb-2 text-xs font-bold text-muted-strong uppercase">
                  {t("detail.stock")}
                </h3>
                {Object.keys(detail.listingCounts).length === 0 ? (
                  <p className="text-sm text-muted">{t("detail.noStock")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {LISTING_STATUSES.filter(
                      (status) => (detail.listingCounts[status as ListingStatusKey] ?? 0) > 0,
                    ).map((status) => (
                      <span
                        key={status}
                        className="inline-flex items-center gap-1.5 rounded-card border border-line bg-page px-2.5 py-1 text-xs"
                      >
                        <span className="text-muted">{t(`listingStatus.${status}`)}</span>
                        <span className="font-bold text-ink">
                          {(detail.listingCounts[status as ListingStatusKey] ?? 0).toLocaleString(
                            locale,
                          )}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-bold text-muted-strong uppercase">
                  {t("detail.package")}
                </h3>
                {activeSubscription ? (
                  <Panel className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {activeSubscription.package?.name ??
                          activeSubscription.terms?.name ??
                          t("detail.none")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t("detail.packageTerms", {
                          quota: activeSubscription.terms?.listingQuota ?? 0,
                          boosts: activeSubscription.terms?.boostCredits ?? 0,
                        })}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-extrabold text-ink">
                        {packagePrice != null
                          ? formatPrice(Number(packagePrice), locale)
                          : t("detail.none")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t("detail.packageRenews", {
                          when: formatRelativeTime(activeSubscription.endsAt, locale),
                        })}
                      </p>
                    </div>
                    <Badge variant={activeSubscription.status === "ACTIVE" ? "green" : "amber"}>
                      {t(`subscriptionStatus.${activeSubscription.status}`)}
                    </Badge>
                  </Panel>
                ) : (
                  <p className="text-sm text-muted">{t("detail.noPackage")}</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-strong uppercase">
                  <Building2 className="size-3.5" aria-hidden />
                  {t("detail.branches", { count: detail.branches.length })}
                </h3>
                {detail.branches.length === 0 ? (
                  <p className="text-sm text-muted">{t("detail.noBranches")}</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {detail.branches.map((branch) => (
                      <li
                        key={branch.id}
                        className="rounded-card border border-line px-3 py-2 text-sm"
                      >
                        <span className="font-semibold text-ink">{branch.name}</span>
                        <span className="ms-2 text-xs text-muted">
                          {[branch.emirate?.name, branch.address, branch.phone]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-strong uppercase">
                  <Users className="size-3.5" aria-hidden />
                  {t("detail.team", { count: detail.members.length })}
                </h3>
                <div className="overflow-x-auto rounded-card border border-line">
                  <table className="w-full min-w-[420px] border-collapse text-[13px]">
                    <caption className="sr-only">{t("detail.team", { count: detail.members.length })}</caption>
                    <thead>
                      <tr className="bg-brand text-white">
                        <th scope="col" className="p-2 text-start font-semibold">
                          {t("detail.memberName")}
                        </th>
                        <th scope="col" className="p-2 text-start font-semibold">
                          {t("detail.memberRole")}
                        </th>
                        <th scope="col" className="p-2 text-start font-semibold">
                          {t("detail.memberStatus")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.members.map((member, index) => (
                        <tr key={member.id} className={index % 2 === 1 ? "bg-page" : undefined}>
                          <th scope="row" className="p-2 text-start font-normal">
                            <span className="font-semibold text-ink">{member.user.name}</span>
                            <span className="block text-xs text-muted">{member.user.email}</span>
                          </th>
                          <td className="p-2">
                            <Badge variant={member.role === "OWNER" ? "navy" : "neutral"}>
                              {t(`memberRole.${member.role}`)}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <span
                              className={
                                member.user.status === "ACTIVE"
                                  ? "text-xs text-muted-strong"
                                  : "text-xs font-bold text-danger-strong"
                              }
                            >
                              {t(`userStatus.${member.user.status}`)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          <DialogFooter>
            {detail && (
              <Button variant="outline" asChild>
                <Link href={`/dealers/${detail.slug}`} target="_blank" rel="noopener">
                  <ExternalLink aria-hidden />
                  {t("actions.viewPublic")}
                </Link>
              </Button>
            )}
            {detail &&
              (detail.status === "SUSPENDED" ? (
                <Button onClick={() => askReinstate(detail)}>
                  <RotateCcw aria-hidden />
                  {t("actions.reinstate")}
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => askSuspend(detail, detail.listingCounts.LIVE ?? 0)}
                >
                  <Ban aria-hidden />
                  {t("actions.suspend")}
                </Button>
              ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation ───────────────────────────────────────────────── */}
      <Dialog
        open={Boolean(confirming)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setConfirming(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {confirming?.action === "suspend"
                ? t("suspend.title", { name: confirming?.row.name })
                : t("reinstate.title", { name: confirming?.row.name })}
            </DialogTitle>
            <DialogDescription>
              {confirming?.action === "suspend"
                ? t("suspend.description")
                : t("reinstate.description")}
            </DialogDescription>
          </DialogHeader>

          {confirming?.action === "suspend" ? (
            <>
              <ul className="flex flex-col gap-1.5 rounded-card border border-danger/40 bg-danger-soft p-3 text-sm text-ink">
                <li className="flex gap-2">
                  <Ban className="mt-0.5 size-4 shrink-0 text-danger-strong" aria-hidden />
                  {t("suspend.effectPause", { count: confirming.liveListings })}
                </li>
                <li className="flex gap-2">
                  <Ban className="mt-0.5 size-4 shrink-0 text-danger-strong" aria-hidden />
                  {t("suspend.effectPublish")}
                </li>
                <li className="flex gap-2">
                  <Ban className="mt-0.5 size-4 shrink-0 text-danger-strong" aria-hidden />
                  {t("suspend.effectNotify")}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-strong" aria-hidden />
                  {t("suspend.effectSessions")}
                </li>
              </ul>

              <div>
                <Label htmlFor="suspend-reason" required>
                  {t("suspend.reasonLabel")}
                </Label>
                <Textarea
                  id="suspend-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={t("suspend.reasonPlaceholder")}
                  rows={3}
                  maxLength={MAX_REASON}
                />
                <p className="mt-1.5 text-xs text-muted">
                  {t("suspend.reasonHint", { max: MAX_REASON })}
                </p>
              </div>
            </>
          ) : (
            <ul className="flex flex-col gap-1.5 rounded-card border border-line bg-page p-3 text-sm text-ink">
              <li className="flex gap-2">
                <RotateCcw className="mt-0.5 size-4 shrink-0 text-success-strong" aria-hidden />
                {t("reinstate.effectRestore")}
              </li>
              <li className="flex gap-2">
                <RotateCcw className="mt-0.5 size-4 shrink-0 text-success-strong" aria-hidden />
                {t("reinstate.effectPublish")}
              </li>
              <li className="flex gap-2">
                <RotateCcw className="mt-0.5 size-4 shrink-0 text-success-strong" aria-hidden />
                {t("reinstate.effectNotify")}
              </li>
            </ul>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setConfirming(null);
                setReason("");
              }}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              variant={confirming?.action === "suspend" ? "danger" : "primary"}
              loading={busy}
              disabled={
                busy ||
                (confirming?.action === "suspend" && reason.trim().length < MIN_REASON)
              }
              onClick={() => void runAction()}
            >
              {confirming?.action === "suspend"
                ? t("suspend.confirm")
                : t("reinstate.confirm")}
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
        ["common", "admin", "admin-dealers"],
        nextI18NextConfig,
      )),
    },
  };
};
