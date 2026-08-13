/**
 * /admin/users — users manager (task P4-03, FR-AD3).
 *
 * Suspend/ban revoke every session server-side; impersonation is
 * SUPER_ADMIN-only, audited, and surfaces the minted identity clearly so an
 * admin can never mistake whose session they hold.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { UserCog } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  getAdminUsers,
  impersonateUser,
  setAdminUserStatus,
  type AdminUserRow,
} from "@/components/admin/api";
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
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 25;
const STATUS_FILTERS = ["ALL", "ACTIVE", "SUSPENDED", "BANNED"] as const;

const STATUS_VARIANT: Record<string, "green" | "amber" | "red" | "neutral"> = {
  ACTIVE: "green",
  SUSPENDED: "amber",
  BANNED: "red",
  DELETED: "neutral",
};

export default function AdminUsersPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [rows, setRows] = React.useState<AdminUserRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [impersonated, setImpersonated] = React.useState<{
    email: string;
    accessToken: string;
  } | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const page = await getAdminUsers(token, {
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: PAGE_SIZE,
        offset,
      });
      setRows(page.items);
      setTotal(page.total);
    } catch {
      toast({ title: t("users.toast.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, offset, t]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (
    row: AdminUserRow,
    action: "suspend" | "ban" | "reinstate",
  ) => {
    if (!token) return;
    setBusyId(row.id);
    try {
      const result = await setAdminUserStatus(row.id, action, undefined, token);
      toast({
        title: t(`users.toast.${action}`, { count: result.sessionsRevoked }),
        variant: "success",
      });
      await load();
    } catch {
      toast({ title: t("users.toast.failed"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const impersonate = async (row: AdminUserRow) => {
    if (!token) return;
    setBusyId(row.id);
    try {
      const result = await impersonateUser(row.id, token);
      setImpersonated({ email: result.target.email, accessToken: result.accessToken });
    } catch {
      toast({ title: t("users.toast.failed"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<AdminUserRow>[] = [
    {
      key: "user",
      header: t("users.columns.user"),
      isRowHeader: true,
      render: (row) => (
        <span>
          <span className="block font-medium text-ink">{row.name}</span>
          <span className="text-xs text-muted">{row.email}</span>
        </span>
      ),
    },
    {
      key: "role",
      header: t("users.columns.role"),
      render: (row) => <Badge variant="neutral">{row.role}</Badge>,
    },
    {
      key: "status",
      header: t("users.columns.status"),
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? "neutral"}>{row.status}</Badge>
      ),
    },
    {
      key: "listings",
      header: t("users.columns.listings"),
      align: "end",
      render: (row) => row._count.listings,
    },
    {
      key: "joined",
      header: t("users.columns.joined"),
      render: (row) => formatRelativeTime(row.createdAt, "en"),
    },
    {
      key: "actions",
      header: t("users.columns.actions"),
      align: "end",
      render: (row) => {
        const staff = row.role !== "USER";
        const busy = busyId === row.id;
        return (
          <span className="flex justify-end gap-1.5">
            {!staff && row.status === "ACTIVE" && (
              <>
                {isSuperAdmin && (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => void impersonate(row)}>
                    <UserCog aria-hidden />
                    {t("users.impersonate")}
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void act(row, "suspend")}>
                  {t("users.suspend")}
                </Button>
                <Button size="sm" variant="danger" disabled={busy} onClick={() => void act(row, "ban")}>
                  {t("users.ban")}
                </Button>
              </>
            )}
            {!staff && row.status !== "ACTIVE" && row.status !== "DELETED" && (
              <Button size="sm" disabled={busy} onClick={() => void act(row, "reinstate")}>
                {t("users.reinstate")}
              </Button>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <AdminLayout title={t("users.title")}>
      <FilterBar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setOffset(0);
        }}
        options={STATUS_FILTERS.map((f) => ({
          value: f,
          label: f === "ALL" ? t("users.filters.all") : f,
        }))}
        active={statusFilter}
        onSelect={(value) => {
          setStatusFilter(value as (typeof STATUS_FILTERS)[number]);
          setOffset(0);
        }}
      />

      <DataTable
        caption={t("users.title")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        empty={{ title: t("users.empty") }}
        pagination={{ total, limit: PAGE_SIZE, offset, onChange: setOffset }}
      />

      <Dialog open={Boolean(impersonated)} onOpenChange={(open) => !open && setImpersonated(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.impersonationDialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted">
            {t("users.impersonationDialog.body", { email: impersonated?.email })}
          </p>
          <p className="break-all rounded-card bg-page p-2 font-mono text-xs text-ink">
            {impersonated?.accessToken}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(impersonated?.accessToken ?? "");
                toast({ title: t("users.impersonationDialog.copied"), variant: "success" });
              }}
            >
              {t("users.impersonationDialog.copy")}
            </Button>
            <Button onClick={() => setImpersonated(null)}>
              {t("users.impersonationDialog.close")}
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
      ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)),
    },
  };
};
