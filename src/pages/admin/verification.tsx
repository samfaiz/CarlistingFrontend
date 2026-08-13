/**
 * /admin/verification — dealer verification queue (task P3-01 minimal screen;
 * the full tooling with SLA aging arrives in P4-03).
 *
 * Approve turns on auto-publish for the dealership, so the licence link is
 * front and centre: the reviewer is expected to open it before deciding.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  approveDealerVerification,
  getLicenceUrl,
  getVerificationQueue,
  rejectDealerVerification,
  type VerificationQueueItem,
} from "@/components/admin/api";
import { DataTable, type Column } from "@/components/workspace/data-table";
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

const PAGE_SIZE = 25;
const MIN_REASON = 5;

export default function AdminVerificationPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [rows, setRows] = React.useState<VerificationQueueItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState<VerificationQueueItem | null>(null);
  const [reason, setReason] = React.useState("");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const page = await getVerificationQueue(token, { limit: PAGE_SIZE, offset });
      setRows(page.items);
      setTotal(page.total);
    } catch {
      toast({ title: t("verification.toast.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, offset, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openLicence = async (row: VerificationQueueItem) => {
    if (!token) return;
    try {
      const { url } = await getLicenceUrl(row.id, token);
      window.open(url, "_blank", "noopener");
    } catch {
      toast({ title: t("verification.toast.licenceFailed"), variant: "warning" });
    }
  };

  const decide = async (id: string, action: () => Promise<unknown>, key: string) => {
    setBusyId(id);
    try {
      await action();
      toast({ title: t(key), variant: "success" });
      await load();
    } catch {
      toast({ title: t("verification.toast.failed"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<VerificationQueueItem>[] = [
    {
      key: "dealer",
      header: t("verification.columns.dealer"),
      isRowHeader: true,
      render: (row) => (
        <Link href={`/dealers/${row.slug}`} className="font-medium hover:underline">
          {row.name}
        </Link>
      ),
    },
    {
      key: "trn",
      header: t("verification.columns.trn"),
      render: (row) => row.trn ?? "—",
    },
    {
      key: "submitted",
      header: t("verification.columns.submitted"),
      render: (row) => formatRelativeTime(row.updatedAt, "en"),
    },
    {
      key: "licence",
      header: t("verification.columns.licence"),
      render: (row) =>
        row.tradeLicenseKey ? (
          <Button size="sm" variant="outline" onClick={() => void openLicence(row)}>
            <ExternalLink aria-hidden />
            {t("verification.open")}
          </Button>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      header: t("verification.columns.actions"),
      align: "end",
      render: (row) => (
        <span className="flex justify-end gap-1.5">
          <Button
            size="sm"
            disabled={busyId === row.id}
            onClick={() =>
              void decide(
                row.id,
                () => approveDealerVerification(row.id, token!),
                "verification.toast.approved",
              )
            }
          >
            {t("verification.approve")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === row.id}
            onClick={() => {
              setReason("");
              setRejecting(row);
            }}
          >
            {t("verification.reject")}
          </Button>
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title={t("verification.title")}>
      <p className="mb-3 text-sm text-muted">{t("verification.count", { count: total })}</p>

      <DataTable
        caption={t("verification.title")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        empty={{ title: t("verification.empty.title"), hint: t("verification.empty.hint") }}
        pagination={{ total, limit: PAGE_SIZE, offset, onChange: setOffset }}
      />

      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("verification.rejectDialog.title", { name: rejecting?.name })}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("verification.rejectDialog.placeholder")}
            rows={3}
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              {t("verification.rejectDialog.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={reason.trim().length < MIN_REASON || busyId === rejecting?.id}
              onClick={() => {
                const row = rejecting!;
                setRejecting(null);
                void decide(
                  row.id,
                  () => rejectDealerVerification(row.id, reason.trim(), token!),
                  "verification.toast.rejected",
                );
              }}
            >
              {t("verification.rejectDialog.confirm")}
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
      ...(await serverSideTranslations(locale, ["common", "admin", "listings"], nextI18NextConfig)),
    },
  };
};
