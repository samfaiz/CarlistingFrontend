/**
 * /admin/leads — cross-dealer leads overview (task P4-11, FR-AD9).
 *
 * Volumes only, no buyer PII: which dealers generate demand, through which
 * channels, and how the platform-wide series moves.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import { apiGet } from "@/lib/api";
import {
  DataTable,
  FilterBar,
  StatCard,
  type Column,
} from "@/components/workspace/data-table";
import { TrendChart } from "@/components/workspace/trend-chart";
import { Panel } from "@/components/ui/card";
import nextI18NextConfig from "../../../next-i18next.config.js";

const RANGES = [7, 30, 90] as const;

interface LeadsOverview {
  rangeDays: number;
  totals: { leads: number; dealersWithLeads: number };
  byDealer: { dealerId: string; name: string; slug: string; leads: number; won: number }[];
  byType: { type: string; count: number }[];
  series: { date: string; leads: number }[];
}

export default function AdminLeadsPage() {
  const { t } = useTranslation("admin");
  const { t: tDealer } = useTranslation("dealer");
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [days, setDays] = React.useState<(typeof RANGES)[number]>(30);
  const [data, setData] = React.useState<LeadsOverview | null>(null);

  React.useEffect(() => {
    if (!token) return;
    apiGet<LeadsOverview>(`/admin/leads-overview?days=${days}`, { token })
      .then(setData)
      .catch(() => setData(null));
  }, [token, days]);

  const maxType = Math.max(1, ...(data?.byType ?? []).map((row) => row.count));

  const columns: Column<LeadsOverview["byDealer"][number]>[] = [
    {
      key: "dealer",
      header: t("leadsOverview.columns.dealer"),
      isRowHeader: true,
      render: (row) => (
        <Link href={`/dealers/${row.slug}`} className="hover:underline">
          {row.name}
        </Link>
      ),
    },
    {
      key: "leads",
      header: t("leadsOverview.columns.leads"),
      align: "end",
      render: (row) => row.leads.toLocaleString(),
    },
    {
      key: "won",
      header: t("leadsOverview.columns.won"),
      align: "end",
      render: (row) => row.won.toLocaleString(),
    },
  ];

  return (
    <AdminLayout title={t("leadsOverview.title")}>
      <FilterBar
        options={RANGES.map((r) => ({ value: String(r), label: t("leadsOverview.range", { count: r }) }))}
        active={String(days)}
        onSelect={(value) => setDays(Number(value) as (typeof RANGES)[number])}
      />

      {!data ? (
        <div className="flex justify-center p-10">
          <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <StatCard label={t("leadsOverview.totals.leads")} value={data.totals.leads.toLocaleString()} />
            <StatCard
              label={t("leadsOverview.totals.dealers")}
              value={data.totals.dealersWithLeads.toLocaleString()}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TrendChart
              title={t("leadsOverview.chart")}
              total={data.totals.leads}
              points={data.series.map((row) => ({ date: row.date, value: row.leads }))}
              ariaLabel={t("leadsOverview.chart")}
            />
            <Panel className="p-4">
              <p className="mb-3 text-xs text-muted">{t("leadsOverview.byChannel")}</p>
              <ul className="flex flex-col gap-2">
                {data.byType.map((row) => (
                  <li key={row.type} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-ink">
                        {tDealer(`leads.type.${row.type}`, { defaultValue: row.type })}
                      </span>
                      <span className="font-semibold text-ink">{row.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-divider">
                      <div
                        className="h-full rounded-full bg-brand-mid"
                        style={{ inlineSize: `${(row.count / maxType) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <p className="mb-2 mt-4 text-xs text-muted">{t("leadsOverview.topDealers")}</p>
          <DataTable
            caption={t("leadsOverview.topDealers")}
            columns={columns}
            rows={data.byDealer}
            rowKey={(row) => row.dealerId}
            empty={{ title: t("leadsOverview.empty") }}
          />
        </>
      )}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "admin", "dealer"], nextI18NextConfig)),
    },
  };
};
