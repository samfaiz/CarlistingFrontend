/**
 * /admin/content — news + help article manager (P4-05, FR-N1–N3/FR-H1–H2).
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  getCmsArticles,
  setCmsArticleStatus,
  deleteCmsArticle,
  type CmsArticleRow,
} from "@/components/admin/api";
import { DataTable, FilterBar, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../../next-i18next.config.js";

const PAGE = 25;
const KINDS = ["NEWS", "HELP"] as const;
const STATUS_VARIANT: Record<string, "amber" | "green" | "navy" | "neutral"> = {
  DRAFT: "neutral",
  SCHEDULED: "navy",
  PUBLISHED: "green",
  ARCHIVED: "amber",
};

export default function AdminContentPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.accessToken;
  const [kind, setKind] = React.useState<(typeof KINDS)[number]>("NEWS");
  const [rows, setRows] = React.useState<CmsArticleRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const page = await getCmsArticles(token, { kind, limit: PAGE, offset });
      setRows(page.items);
      setTotal(page.total);
    } catch {
      toast({ title: t("content.toast.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, kind, offset, t]);

  React.useEffect(() => { void load(); }, [load]);

  const publish = async (r: CmsArticleRow) => {
    if (!token) return;
    setBusyId(r.id);
    try {
      const next = r.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      await setCmsArticleStatus(r.id, next, token);
      toast({ title: t("content.toast.statusChanged"), variant: "success" });
      await load();
    } catch {
      toast({ title: t("content.toast.failed"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (r: CmsArticleRow) => {
    if (!token || !window.confirm(t("content.confirmDelete", { title: r.slug }))) return;
    setBusyId(r.id);
    try {
      await deleteCmsArticle(r.id, token);
      toast({ title: t("content.toast.deleted"), variant: "success" });
      await load();
    } catch {
      toast({ title: t("content.toast.failed"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const enTitle = (r: CmsArticleRow) =>
    r.translations.find((x) => x.locale === "en")?.title ?? r.translations[0]?.title ?? r.slug;

  const columns: Column<CmsArticleRow>[] = [
    {
      key: "title",
      header: t("content.columns.title"),
      isRowHeader: true,
      render: (r) => (
        <Link href={`/admin/content/${r.id}`} className="font-medium text-ink hover:underline">
          {enTitle(r)}
        </Link>
      ),
    },
    { key: "category", header: t("content.columns.category"), render: (r) => <span className="text-xs text-muted">{r.category ?? "—"}</span> },
    { key: "locales", header: t("content.columns.locales"), render: (r) => <span className="text-xs uppercase text-muted">{r.translations.map((x) => x.locale).join(" · ")}</span> },
    { key: "status", header: t("content.columns.status"), render: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "neutral"}>{r.status}</Badge> },
    { key: "updated", header: t("content.columns.updated"), render: (r) => formatRelativeTime(r.updatedAt, "en") },
    {
      key: "actions",
      header: t("content.columns.actions"),
      align: "end",
      render: (r) => (
        <span className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => void publish(r)}>
            {r.status === "PUBLISHED" ? t("content.unpublish") : t("content.publish")}
          </Button>
          <Button size="sm" variant="ghost" disabled={busyId === r.id} onClick={() => void remove(r)}>
            {t("content.delete")}
          </Button>
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title={t("content.title")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <FilterBar
          options={KINDS.map((k) => ({ value: k, label: t(`content.kind.${k}`, { defaultValue: k }) }))}
          active={kind}
          onSelect={(v) => { setKind(v as (typeof KINDS)[number]); setOffset(0); }}
        />
        <Button onClick={() => router.push(`/admin/content/new?kind=${kind}`)}>{t("content.new")}</Button>
      </div>
      <DataTable
        caption={t("content.title")}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        empty={{ title: t("content.empty") }}
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
