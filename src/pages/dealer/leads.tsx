/**
 * /dealer/leads — unified leads inbox (task P3-04, FR-DP4).
 *
 * One feed across FORM / CALL / WHATSAPP / CHAT with status pipeline, notes,
 * assignment and CSV export. PII discipline is the backend's: FORM leads carry
 * the typed contact details, reveal leads carry only a display name — this
 * page renders whatever the projection returns and never invents contact data.
 * SALES members may see a narrowed feed (assigned-only); the same endpoints
 * decide, so the UI needs no role logic beyond hiding manager-only controls.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import * as React from "react";
import { Download, Loader2, MessageSquareText, Phone } from "lucide-react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { DealerOnboarding } from "@/components/dealer/dealer-onboarding";
import { useDealer } from "@/components/dealer/use-dealer";
import {
  DataTable,
  FilterBar,
  StatCard,
  type Column,
} from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import {
  LEAD_TRANSITIONS,
  addLeadNote,
  assignLead,
  downloadLeadsCsv,
  getDealerMembers,
  getLead,
  getLeadFeed,
  getLeadSummary,
  setLeadStatus,
  type DealerMemberRow,
  type LeadDetail,
  type LeadRow,
  type LeadStatus,
  type LeadType,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 25;
const STATUS_FILTERS = ["ALL", "NEW", "CONTACTED", "WON", "LOST"] as const;
const TYPES = ["CALL", "WHATSAPP", "CHAT", "FORM"] as const;

const STATUS_VARIANT: Record<LeadStatus, "navy" | "green" | "amber" | "red"> = {
  NEW: "amber",
  CONTACTED: "navy",
  WON: "green",
  LOST: "red",
};

export default function DealerLeadsPage() {
  const { t } = useTranslation("dealer");
  const { context, quota, loading, error, needsOnboarding, accessToken, refresh } =
    useDealer();

  const dealerId = context?.dealer?.id;
  const canManage =
    context?.permissions?.role !== "SALES" || context?.permissions?.isStaff;

  const [statusFilter, setStatusFilter] =
    React.useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | LeadType>("ALL");
  const [offset, setOffset] = React.useState(0);
  const [rows, setRows] = React.useState<LeadRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [summary, setSummary] = React.useState<Record<LeadStatus, number> | null>(null);
  const [listLoading, setListLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<DealerMemberRow[]>([]);
  const [exporting, setExporting] = React.useState(false);

  // Detail dialog
  const [openLead, setOpenLead] = React.useState<LeadDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const filters = React.useMemo(
    () => ({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      type: typeFilter === "ALL" ? undefined : typeFilter,
      limit: PAGE_SIZE,
      offset,
    }),
    [statusFilter, typeFilter, offset],
  );

  const load = React.useCallback(async () => {
    if (!accessToken || !dealerId) return;
    setListLoading(true);
    setListError(null);
    try {
      const [page, counts] = await Promise.all([
        getLeadFeed(dealerId, filters, accessToken),
        getLeadSummary(dealerId, accessToken),
      ]);
      setRows(page.items);
      setTotal(page.total);
      setSummary(counts);
    } catch {
      setListError(t("errors.load"));
    } finally {
      setListLoading(false);
    }
  }, [accessToken, dealerId, filters, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!accessToken || !dealerId || !canManage) return;
    getDealerMembers(dealerId, accessToken)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [accessToken, dealerId, canManage]);

  const openDetail = async (leadId: string) => {
    if (!accessToken || !dealerId) return;
    setDetailLoading(true);
    try {
      setOpenLead(await getLead(dealerId, leadId, accessToken));
    } catch {
      toast({ title: t("errors.load"), variant: "warning" });
    } finally {
      setDetailLoading(false);
    }
  };

  /** Every mutation refetches the detail + list — the server owns the truth. */
  const mutate = async (action: () => Promise<unknown>) => {
    if (!openLead) return;
    setBusy(true);
    try {
      await action();
      const [detail] = await Promise.all([
        getLead(dealerId!, openLead.id, accessToken!),
        load(),
      ]);
      setOpenLead(detail);
    } catch {
      toast({ title: t("leads.toast.failed"), variant: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    if (!accessToken || !dealerId) return;
    setExporting(true);
    try {
      const blob = await downloadLeadsCsv(dealerId, filters, accessToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("leads.toast.exportFailed"), variant: "warning" });
    } finally {
      setExporting(false);
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

  const memberName = (id: string | null) =>
    id
      ? (members.find((m) => m.user.id === id)?.user.name ?? t("leads.assignedOther"))
      : t("leads.unassigned");

  const columns: Column<LeadRow>[] = [
    {
      key: "buyer",
      header: t("leads.columns.buyer"),
      isRowHeader: true,
      render: (row) => (
        <span className="font-medium text-ink">
          {row.buyer.name ?? t("leads.anonymous")}
        </span>
      ),
    },
    {
      key: "listing",
      header: t("leads.columns.listing"),
      render: (row) =>
        row.listing ? (
          <Link href={`/cars/${row.listing.slug}`} className="hover:underline">
            {row.listing.year} {row.listing.make.name} {row.listing.model.name}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "type",
      header: t("leads.columns.type"),
      render: (row) => (
        <Badge variant="neutral">{t(`leads.type.${row.type}`)}</Badge>
      ),
    },
    {
      key: "status",
      header: t("leads.columns.status"),
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status]}>
          {t(`leads.status.${row.status}`)}
        </Badge>
      ),
    },
    {
      key: "assignee",
      header: t("leads.columns.assignee"),
      render: (row) => (
        <span className="text-muted">{memberName(row.assigneeId)}</span>
      ),
    },
    {
      key: "received",
      header: t("leads.columns.received"),
      render: (row) => formatRelativeTime(row.createdAt, "en"),
    },
    {
      key: "notes",
      header: t("leads.columns.notes"),
      align: "end",
      render: (row) => row.noteCount || "—",
    },
    {
      key: "actions",
      header: t("leads.columns.actions"),
      align: "end",
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => void openDetail(row.id)}>
          {t("leads.open")}
        </Button>
      ),
    },
  ];

  return (
    <DealerLayout
      context={context}
      quota={quota}
      title={t("leads.title")}
      actions={
        canManage ? (
          <Button size="sm" variant="outline" disabled={exporting} onClick={() => void exportCsv()}>
            {exporting ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Download aria-hidden />
            )}
            {t("leads.exportCsv")}
          </Button>
        ) : undefined
      }
    >
      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label={t("leads.status.NEW")} value={summary.NEW} tone="up" />
          <StatCard label={t("leads.status.CONTACTED")} value={summary.CONTACTED} />
          <StatCard label={t("leads.status.WON")} value={summary.WON} />
          <StatCard label={t("leads.status.LOST")} value={summary.LOST} />
        </div>
      )}

      <FilterBar
        options={STATUS_FILTERS.map((f) => ({
          value: f,
          label: f === "ALL" ? t("leads.filters.all") : t(`leads.status.${f}`),
        }))}
        active={statusFilter}
        onSelect={(value) => {
          setStatusFilter(value as (typeof STATUS_FILTERS)[number]);
          setOffset(0);
        }}
      >
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value as "ALL" | LeadType);
            setOffset(0);
          }}
        >
          <SelectTrigger className="h-8 w-40" aria-label={t("leads.filters.type")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("leads.filters.allTypes")}</SelectItem>
            {TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`leads.type.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        caption={t("leads.title")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={listLoading}
        error={listError}
        onRetry={() => void load()}
        empty={{ title: t("leads.empty.title"), hint: t("leads.empty.hint") }}
        pagination={{ total, limit: PAGE_SIZE, offset, onChange: setOffset }}
      />

      <Dialog
        open={Boolean(openLead) || detailLoading}
        onOpenChange={(open) => {
          if (!open) {
            setOpenLead(null);
            setNote("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          {openLead ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {openLead.buyer.name ?? t("leads.anonymous")}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {/* Contact block — FORM leads only carry email/phone */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={STATUS_VARIANT[openLead.status]}>
                    {t(`leads.status.${openLead.status}`)}
                  </Badge>
                  <Badge variant="neutral">{t(`leads.type.${openLead.type}`)}</Badge>
                  <span className="text-muted">
                    {formatRelativeTime(openLead.createdAt, "en")}
                  </span>
                </div>

                {(openLead.buyer.phone || openLead.buyer.email) && (
                  <div className="space-y-1">
                    {openLead.buyer.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="size-3.5 text-muted" aria-hidden />
                        <a href={`tel:${openLead.buyer.phone}`} className="hover:underline">
                          {openLead.buyer.phone}
                        </a>
                      </p>
                    )}
                    {openLead.buyer.email && (
                      <p className="flex items-center gap-2">
                        <MessageSquareText className="size-3.5 text-muted" aria-hidden />
                        <a href={`mailto:${openLead.buyer.email}`} className="hover:underline">
                          {openLead.buyer.email}
                        </a>
                      </p>
                    )}
                  </div>
                )}

                {openLead.buyer.message && (
                  <blockquote className="rounded-card border-s-2 border-brand-mid bg-page p-3 text-ink">
                    {openLead.buyer.message}
                  </blockquote>
                )}

                {openLead.listing && (
                  <p>
                    <Link
                      href={`/cars/${openLead.listing.slug}`}
                      className="font-medium hover:underline"
                    >
                      {openLead.listing.year} {openLead.listing.make.name}{" "}
                      {openLead.listing.model.name}
                    </Link>{" "}
                    <span className="text-muted">
                      {formatPrice(openLead.listing.priceAed, "en")}
                    </span>
                  </p>
                )}

                {/* Status pipeline — only the moves the backend allows */}
                <div className="flex flex-wrap items-center gap-2">
                  {LEAD_TRANSITIONS[openLead.status].map((next) => (
                    <Button
                      key={next}
                      size="sm"
                      variant={next === "WON" ? "primary" : "outline"}
                      disabled={busy}
                      onClick={() =>
                        void mutate(() =>
                          setLeadStatus(dealerId!, openLead.id, next, accessToken!),
                        )
                      }
                    >
                      {t(`leads.moveTo.${next}`)}
                    </Button>
                  ))}
                </div>

                {/* Assignment — owners/managers only */}
                {canManage && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted">{t("leads.columns.assignee")}</span>
                    <Select
                      value={openLead.assigneeId ?? "NONE"}
                      onValueChange={(value) =>
                        void mutate(() =>
                          assignLead(
                            dealerId!,
                            openLead.id,
                            value === "NONE" ? null : value,
                            accessToken!,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-48" aria-label={t("leads.columns.assignee")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">{t("leads.unassigned")}</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.user.id} value={member.user.id}>
                            {member.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notes — append-only, per author */}
                <div>
                  <h3 className="mb-2 font-semibold text-ink">
                    {t("leads.notes.title")}
                  </h3>
                  {openLead.notes.length === 0 ? (
                    <p className="text-muted">{t("leads.notes.empty")}</p>
                  ) : (
                    <ul className="max-h-48 space-y-2 overflow-y-auto">
                      {openLead.notes.map((n) => (
                        <li key={n.id} className="rounded-card bg-page p-2">
                          <p className="text-ink">{n.body}</p>
                          <p className="mt-1 text-xs text-muted">
                            {n.author.name} · {formatRelativeTime(n.createdAt, "en")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(event: React.FormEvent) => {
                      event.preventDefault();
                      const body = note.trim();
                      if (!body) return;
                      void mutate(() =>
                        addLeadNote(dealerId!, openLead.id, body, accessToken!),
                      ).then(() => setNote(""));
                    }}
                  >
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder={t("leads.notes.placeholder")}
                      rows={2}
                      maxLength={2000}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={busy || !note.trim()}>
                      {t("leads.notes.add")}
                    </Button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center p-8">
              <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
            </div>
          )}
        </DialogContent>
      </Dialog>
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
        destination: `${prefix}/login?next=/dealer/leads`,
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
