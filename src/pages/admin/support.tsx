/**
 * /admin/support — support ticket inbox (task P4-04, FR-AD8).
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import { getTickets, updateTicket, type TicketRow } from "@/components/admin/api";
import { DataTable, FilterBar, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE = 25;
const FILTERS = ["OPEN", "IN_PROGRESS", "CLOSED"] as const;
const VARIANT: Record<string, "amber" | "navy" | "green"> = { OPEN: "amber", IN_PROGRESS: "navy", CLOSED: "green" };

export default function AdminSupportPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [status, setStatus] = React.useState<(typeof FILTERS)[number]>("OPEN");
  const [rows, setRows] = React.useState<TicketRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState<TicketRow | null>(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const page = await getTickets(token, { status, limit: PAGE, offset });
      setRows(page.items);
      setTotal(page.total);
    } catch {
      toast({ title: t("support.toast.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, status, offset, t]);

  React.useEffect(() => { void load(); }, [load]);

  const setTicket = async (id: string, next: string) => {
    if (!token) return;
    setBusy(true);
    try {
      await updateTicket(id, { status: next, staffNote: note.trim() || undefined }, token);
      toast({ title: t("support.toast.updated"), variant: "success" });
      setOpen(null); setNote("");
      await load();
    } catch {
      toast({ title: t("support.toast.failed"), variant: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<TicketRow>[] = [
    { key: "subject", header: t("support.columns.subject"), isRowHeader: true, render: (r) => <span className="font-medium text-ink">{r.subject}</span> },
    { key: "from", header: t("support.columns.from"), render: (r) => <span className="text-xs text-muted">{r.name} · {r.email}</span> },
    { key: "status", header: t("support.columns.status"), render: (r) => <Badge variant={VARIANT[r.status] ?? "neutral"}>{r.status}</Badge> },
    { key: "received", header: t("support.columns.received"), render: (r) => formatRelativeTime(r.createdAt, "en") },
    { key: "actions", header: t("support.columns.actions"), align: "end", render: (r) => <Button size="sm" variant="outline" onClick={() => { setNote(r.staffNote ?? ""); setOpen(r); }}>{t("support.open")}</Button> },
  ];

  return (
    <AdminLayout title={t("support.title")}>
      <FilterBar
        options={FILTERS.map((f) => ({ value: f, label: t(`support.status.${f}`, { defaultValue: f }) }))}
        active={status}
        onSelect={(v) => { setStatus(v as (typeof FILTERS)[number]); setOffset(0); }}
      />
      <DataTable
        caption={t("support.title")}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        empty={{ title: t("support.empty") }}
        pagination={{ total, limit: PAGE, offset, onChange: setOffset }}
      />

      <Dialog open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          {open && (
            <>
              <DialogHeader><DialogTitle>{open.subject}</DialogTitle></DialogHeader>
              <p className="text-xs text-muted">{open.name} · {open.email} · {formatRelativeTime(open.createdAt, "en")}</p>
              <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-card bg-page p-3 text-sm text-ink">{open.body}</p>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("support.notePlaceholder")} rows={2} maxLength={2000} />
              <DialogFooter>
                <Button variant="outline" disabled={busy} onClick={() => void setTicket(open.id, "IN_PROGRESS")}>{t("support.markInProgress")}</Button>
                <Button disabled={busy} onClick={() => void setTicket(open.id, "CLOSED")}>{t("support.close")}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return { props: { ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
