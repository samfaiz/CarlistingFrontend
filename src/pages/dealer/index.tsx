/**
 * /dealer — dealer dashboard (task P3-02, FR-DP1).
 *
 * Four KPI cards and the two lists a dealer actually acts on: what is expiring,
 * and what changed recently. Deliberately not a wall of charts — analytics is
 * its own module (P3-05); this page exists to answer "is anything wrong today".
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { useDealer } from "@/components/dealer/use-dealer";
import { DataTable, StatCard, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { myListings, type ListingDetail } from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { DealerOnboarding } from "@/components/dealer/dealer-onboarding";
import nextI18NextConfig from "../../../next-i18next.config.js";

const STATUS_VARIANT: Record<string, "navy" | "green" | "amber" | "red" | "neutral"> = {
  LIVE: "green",
  PENDING_REVIEW: "amber",
  DRAFT: "neutral",
  PAUSED: "neutral",
  SOLD: "navy",
  EXPIRED: "neutral",
  REJECTED: "red",
};

export default function DealerDashboardPage() {
  const { t } = useTranslation("dealer");
  const { t: tListings } = useTranslation("listings");
  const { context, quota, loading, error, needsOnboarding, accessToken, refresh } =
    useDealer();

  const [rows, setRows] = React.useState<ListingDetail[]>([]);
  const [total, setTotal] = React.useState(0);
  const [listLoading, setListLoading] = React.useState(true);

  React.useEffect(() => {
    if (!accessToken || !context?.dealer) return;
    void (async () => {
      try {
        const page = await myListings(accessToken, { limit: 8 });
        setRows(page.items);
        setTotal(page.total);
      } finally {
        setListLoading(false);
      }
    })();
  }, [accessToken, context?.dealer]);

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

  const live = rows.filter((r) => r.status === "LIVE").length;
  const soon = Date.now() + 7 * 864e5;
  const expiring = rows.filter(
    (r) => r.status === "LIVE" && r.expiresAt && new Date(r.expiresAt).getTime() < soon,
  );

  const columns: Column<ListingDetail>[] = [
    {
      key: "listing",
      header: t("inventory.columns.listing"),
      isRowHeader: true,
      render: (row) => (
        <Link href={`/cars/${row.slug}`} className="hover:underline">
          {row.year} {row.make.name} {row.model.name}
        </Link>
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
      key: "expires",
      header: t("inventory.columns.expires"),
      render: (row) =>
        row.expiresAt ? formatRelativeTime(row.expiresAt, "en") : "—",
    },
  ];

  return (
    <DealerLayout
      context={context}
      quota={quota}
      title={t("dashboard.title")}
      actions={
        <Button size="sm" asChild>
          <Link href="/sell">{t("dashboard.empty.cta")}</Link>
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.liveListings")}
          value={quota ? quota.occupied : live}
          hint={quota ? t("dashboard.quotaHint", { quota: quota.quota }) : undefined}
          tone={quota && !quota.canPublish ? "down" : "neutral"}
        />
        <StatCard label={t("dashboard.leads7")} value="—" />
        <StatCard label={t("dashboard.views7")} value="—" />
        <StatCard
          label={t("dashboard.expiring")}
          value={expiring.length}
          hint={expiring.length > 0 ? t("dashboard.expiringHint") : undefined}
          tone={expiring.length > 0 ? "down" : "neutral"}
        />
      </div>

      {quota && !quota.canPublish && quota.reason === "QUOTA_EXCEEDED" && (
        <Card className="mb-4 border-warning/40 bg-warning-soft p-3 text-sm text-ink">
          {t("inventory.quotaBlocked")}
        </Card>
      )}

      <h2 className="mb-2 text-sm font-bold text-ink">{t("dashboard.recentTitle")}</h2>
      <DataTable
        caption={t("dashboard.recentTitle")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={listLoading}
        empty={{
          title: t("dashboard.empty.title"),
          hint: t("dashboard.empty.hint"),
          action: (
            <Button size="sm" asChild className="mt-2">
              <Link href="/sell">{t("dashboard.empty.cta")}</Link>
            </Button>
          ),
        }}
      />
      {total > rows.length && (
        <p className="mt-3 text-xs text-muted">
          <Link href="/dealer/inventory" className="text-brand-mid hover:underline">
            {t("inventory.total", { count: total })}
          </Link>
        </p>
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
      redirect: { destination: `${prefix}/login?next=/dealer`, permanent: false },
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
