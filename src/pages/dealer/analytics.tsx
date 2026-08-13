/**
 * /dealer/analytics — views + leads performance (task P3-05, FR-DP5).
 *
 * Counts only, no buyer PII — every dealership member may see this page, so
 * there is no role gating beyond membership (the API 404s outsiders).
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { DealerOnboarding } from "@/components/dealer/dealer-onboarding";
import { useDealer } from "@/components/dealer/use-dealer";
import {
  DataTable,
  FilterBar,
  StatCard,
  type Column,
} from "@/components/workspace/data-table";
import { TrendChart } from "@/components/workspace/trend-chart";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import {
  getDealerAnalytics,
  type DealerAnalytics,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

const RANGES = [7, 30, 90] as const;

export default function DealerAnalyticsPage() {
  const { t } = useTranslation("dealer");
  const { t: tListings } = useTranslation("listings");
  const { context, quota, loading, error, needsOnboarding, accessToken, refresh } =
    useDealer();

  const [days, setDays] = React.useState<(typeof RANGES)[number]>(30);
  const [data, setData] = React.useState<DealerAnalytics | null>(null);
  const [pageError, setPageError] = React.useState(false);

  const dealerId = context?.dealer?.id;

  React.useEffect(() => {
    if (!accessToken || !dealerId) return;
    setPageError(false);
    getDealerAnalytics(dealerId, days, accessToken)
      .then(setData)
      .catch(() => setPageError(true));
  }, [accessToken, dealerId, days]);

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

  const maxSource = Math.max(1, ...(data?.sourceSplit ?? []).map((s) => s.count));

  const columns: Column<DealerAnalytics["topListings"][number]>[] = [
    {
      key: "listing",
      header: t("analytics.columns.listing"),
      isRowHeader: true,
      render: (row) => (
        <Link href={`/cars/${row.slug}`} className="hover:underline">
          {row.year} {row.makeName} {row.modelName}
        </Link>
      ),
    },
    {
      key: "status",
      header: t("analytics.columns.status"),
      render: (row) => (
        <Badge variant={row.status === "LIVE" ? "green" : "neutral"}>
          {tListings(`status.${row.status}`, { defaultValue: row.status })}
        </Badge>
      ),
    },
    {
      key: "price",
      header: t("analytics.columns.price"),
      align: "end",
      render: (row) => formatPrice(row.priceAed, "en"),
    },
    {
      key: "views",
      header: t("analytics.columns.views"),
      align: "end",
      render: (row) => row.views.toLocaleString(),
    },
    {
      key: "leads",
      header: t("analytics.columns.leads"),
      align: "end",
      render: (row) => row.leads.toLocaleString(),
    },
  ];

  return (
    <DealerLayout context={context} quota={quota} title={t("analytics.title")}>
      <FilterBar
        options={RANGES.map((r) => ({
          value: String(r),
          label: t("analytics.range", { count: r }),
        }))}
        active={String(days)}
        onSelect={(value) => setDays(Number(value) as (typeof RANGES)[number])}
      />

      {pageError ? (
        <p className="mt-4 text-sm text-muted">{t("errors.load")}</p>
      ) : !data ? (
        <div className="flex justify-center p-10">
          <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <StatCard label={t("analytics.totals.views")} value={data.totals.views.toLocaleString()} />
            <StatCard label={t("analytics.totals.leads")} value={data.totals.leads.toLocaleString()} />
            <StatCard
              label={t("analytics.totals.liveListings")}
              value={data.totals.liveListings.toLocaleString()}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TrendChart
              title={t("analytics.viewsChart")}
              total={data.totals.views}
              points={data.viewsSeries.map((r) => ({ date: r.date, value: r.views }))}
              ariaLabel={t("analytics.viewsChart")}
            />
            <TrendChart
              title={t("analytics.leadsChart")}
              total={data.totals.leads}
              points={data.leadsSeries.map((r) => ({ date: r.date, value: r.leads }))}
              ariaLabel={t("analytics.leadsChart")}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">
            <Panel className="p-4">
              <p className="mb-3 text-xs text-muted">{t("analytics.sourceSplit")}</p>
              {data.sourceSplit.length === 0 ? (
                <p className="text-sm text-muted">{t("analytics.noLeads")}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.sourceSplit.map((row) => (
                    <li key={row.type} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-ink">{t(`leads.type.${row.type}`)}</span>
                        <span className="font-semibold text-ink">{row.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-divider">
                        <div
                          className="h-full rounded-full bg-brand-mid"
                          style={{ inlineSize: `${(row.count / maxSource) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <div>
              <p className="mb-2 text-xs text-muted">{t("analytics.topListings")}</p>
              <DataTable
                caption={t("analytics.topListings")}
                columns={columns}
                rows={data.topListings}
                rowKey={(row) => row.id}
                empty={{ title: t("analytics.noListings") }}
              />
            </div>
          </div>
        </>
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
      redirect: {
        destination: `${prefix}/login?next=/dealer/analytics`,
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
