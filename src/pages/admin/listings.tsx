/**
 * /admin/listings — listings manager (task P4-03, FR-AD2).
 *
 * Search across every status; force-pause / restore is audited server-side.
 * Feature toggling stays on the moderation page (its live tab).
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  getAdminListings,
  setAdminListingPaused,
  type AdminListingRow,
} from "@/components/admin/api";
import { DataTable, FilterBar, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 25;
const STATUS_FILTERS = ["ALL", "LIVE", "PENDING_REVIEW", "PAUSED", "SOLD", "EXPIRED", "REJECTED"] as const;

const STATUS_VARIANT: Record<string, "green" | "amber" | "red" | "navy" | "neutral"> = {
  LIVE: "green",
  PENDING_REVIEW: "amber",
  PAUSED: "neutral",
  SOLD: "navy",
  REJECTED: "red",
};

export default function AdminListingsPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [rows, setRows] = React.useState<AdminListingRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const page = await getAdminListings(token, {
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: PAGE_SIZE,
        offset,
      });
      setRows(page.items);
      setTotal(page.total);
    } catch {
      toast({ title: t("listingsManager.toast.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, offset, t]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const setPaused = async (row: AdminListingRow, paused: boolean) => {
    if (!token) return;
    setBusyId(row.id);
    try {
      await setAdminListingPaused(row.id, paused, undefined, token);
      toast({
        title: t(paused ? "listingsManager.toast.paused" : "listingsManager.toast.unpaused"),
        variant: "success",
      });
      await load();
    } catch {
      toast({ title: t("listingsManager.toast.failed"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<AdminListingRow>[] = [
    {
      key: "listing",
      header: t("listingsManager.columns.listing"),
      isRowHeader: true,
      render: (row) => (
        <Link href={`/cars/${row.slug}`} className="hover:underline">
          {row.year} {row.make.name} {row.model.name}
        </Link>
      ),
    },
    {
      key: "seller",
      header: t("listingsManager.columns.seller"),
      render: (row) => (
        <span className="text-xs text-muted">
          {row.dealer?.name ?? row.user?.email ?? row.sellerType}
        </span>
      ),
    },
    {
      key: "price",
      header: t("listingsManager.columns.price"),
      align: "end",
      render: (row) => formatPrice(row.priceAed, "en"),
    },
    {
      key: "status",
      header: t("listingsManager.columns.status"),
      render: (row) => (
        <Badge variant={STATUS_VARIANT[row.status] ?? "neutral"}>{row.status}</Badge>
      ),
    },
    {
      key: "updated",
      header: t("listingsManager.columns.updated"),
      render: (row) => formatRelativeTime(row.updatedAt, "en"),
    },
    {
      key: "actions",
      header: t("listingsManager.columns.actions"),
      align: "end",
      render: (row) => (
        <span className="flex justify-end gap-1.5">
          {row.status === "LIVE" && (
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === row.id}
              onClick={() => void setPaused(row, true)}
            >
              {t("listingsManager.pause")}
            </Button>
          )}
          {row.status === "PAUSED" && (
            <Button
              size="sm"
              disabled={busyId === row.id}
              onClick={() => void setPaused(row, false)}
            >
              {t("listingsManager.unpause")}
            </Button>
          )}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title={t("listingsManager.title")}>
      <FilterBar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setOffset(0);
        }}
        options={STATUS_FILTERS.map((f) => ({
          value: f,
          label: f === "ALL" ? t("listingsManager.filters.all") : f,
        }))}
        active={statusFilter}
        onSelect={(value) => {
          setStatusFilter(value as (typeof STATUS_FILTERS)[number]);
          setOffset(0);
        }}
      />

      <DataTable
        caption={t("listingsManager.title")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        empty={{ title: t("listingsManager.empty") }}
        pagination={{ total, limit: PAGE_SIZE, offset, onChange: setOffset }}
      />
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
