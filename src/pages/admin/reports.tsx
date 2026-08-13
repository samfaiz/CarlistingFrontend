/**
 * /admin/reports — listing reports/flags queue (task P4-04, FR-AD5).
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import { getReports, resolveReport, type ReportRow } from "@/components/admin/api";
import { DataTable, FilterBar, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE = 25;
const FILTERS = ["OPEN", "RESOLVED", "DISMISSED"] as const;
const VARIANT: Record<string, "amber" | "green" | "neutral"> = { OPEN: "amber", RESOLVED: "green", DISMISSED: "neutral" };

export default function AdminReportsPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [status, setStatus] = React.useState<(typeof FILTERS)[number]>("OPEN");
  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const page = await getReports(token, { status, limit: PAGE, offset });
      setRows(page.items);
      setTotal(page.total);
    } catch {
      toast({ title: t("reports.toast.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, status, offset, t]);

  React.useEffect(() => { void load(); }, [load]);

  const act = async (id: string, decision: "RESOLVED" | "DISMISSED") => {
    if (!token) return;
    setBusyId(id);
    try {
      await resolveReport(id, decision, undefined, token);
      toast({ title: t(`reports.toast.${decision.toLowerCase()}`), variant: "success" });
      await load();
    } catch {
      toast({ title: t("reports.toast.failed"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<ReportRow>[] = [
    {
      key: "listing",
      header: t("reports.columns.listing"),
      isRowHeader: true,
      render: (r) => r.listing ? (
        <Link href={`/cars/${r.listing.slug}`} className="hover:underline">{r.listing.year} {r.listing.make.name} {r.listing.model.name}</Link>
      ) : "—",
    },
    { key: "reason", header: t("reports.columns.reason"), render: (r) => <Badge variant="neutral">{r.reason}</Badge> },
    { key: "details", header: t("reports.columns.details"), render: (r) => <span className="text-xs text-muted">{r.details ?? "—"}</span> },
    { key: "status", header: t("reports.columns.status"), render: (r) => <Badge variant={VARIANT[r.status] ?? "neutral"}>{r.status}</Badge> },
    { key: "filed", header: t("reports.columns.filed"), render: (r) => formatRelativeTime(r.createdAt, "en") },
    {
      key: "actions",
      header: t("reports.columns.actions"),
      align: "end",
      render: (r) => r.status === "OPEN" ? (
        <span className="flex justify-end gap-1.5">
          <Button size="sm" disabled={busyId === r.id} onClick={() => void act(r.id, "RESOLVED")}>{t("reports.resolve")}</Button>
          <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => void act(r.id, "DISMISSED")}>{t("reports.dismiss")}</Button>
        </span>
      ) : null,
    },
  ];

  return (
    <AdminLayout title={t("reports.title")}>
      <FilterBar
        options={FILTERS.map((f) => ({ value: f, label: t(`reports.status.${f}`, { defaultValue: f }) }))}
        active={status}
        onSelect={(v) => { setStatus(v as (typeof FILTERS)[number]); setOffset(0); }}
      />
      <DataTable
        caption={t("reports.title")}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        empty={{ title: t("reports.empty") }}
        pagination={{ total, limit: PAGE, offset, onChange: setOffset }}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return { props: { ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
