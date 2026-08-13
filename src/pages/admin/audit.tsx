/**
 * /admin/audit — read-only audit log viewer (P4-07, FR-SA9).
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import { getAuditLog, type AuditRow } from "@/components/admin/api";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function AdminAuditPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [action, setAction] = React.useState("");
  const [entityType, setEntityType] = React.useState("");
  const [cursorStack, setCursorStack] = React.useState<string[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const load = React.useCallback(async (cursor?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const page = await getAuditLog(token, { action: action || undefined, entityType: entityType || undefined, cursor, limit: 50 });
      setRows(page.items);
      setNextCursor(page.nextCursor);
    } catch {
      toast({ title: t("audit.toast.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, action, entityType, t]);

  React.useEffect(() => { void load(); setCursorStack([]); }, [load]);

  const columns: Column<AuditRow>[] = [
    { key: "when", header: t("audit.columns.when"), isRowHeader: true, render: (r) => formatRelativeTime(r.createdAt, "en") },
    { key: "action", header: t("audit.columns.action"), render: (r) => <Badge variant="navy">{r.action}</Badge> },
    { key: "entity", header: t("audit.columns.entity"), render: (r) => <span className="text-xs text-muted">{r.entityType}{r.entityId ? `:${r.entityId.slice(0, 8)}` : ""}</span> },
    { key: "actor", header: t("audit.columns.actor"), render: (r) => <span className="text-xs text-muted">{r.actorId ? r.actorId.slice(0, 10) : t("audit.system")}</span> },
    { key: "ip", header: t("audit.columns.ip"), render: (r) => <span className="text-xs text-muted">{r.ip ?? "—"}</span> },
  ];

  return (
    <AdminLayout title={t("audit.title")}>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted" htmlFor="f-action">{t("audit.filter.action")}</label>
          <Input id="f-action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="listing." className="w-48" />
        </div>
        <div>
          <label className="text-xs text-muted" htmlFor="f-entity">{t("audit.filter.entity")}</label>
          <Input id="f-entity" value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="Listing" className="w-48" />
        </div>
      </div>
      <DataTable
        caption={t("audit.title")}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        empty={{ title: t("audit.empty") }}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={cursorStack.length === 0}
          onClick={() => {
            const prev = [...cursorStack];
            prev.pop();
            setCursorStack(prev);
            void load(prev[prev.length - 1]);
          }}
        >
          {t("audit.prev")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!nextCursor}
          onClick={() => {
            if (!nextCursor) return;
            setCursorStack((s) => [...s, nextCursor]);
            void load(nextCursor);
          }}
        >
          {t("audit.next")}
        </Button>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return { props: { ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
