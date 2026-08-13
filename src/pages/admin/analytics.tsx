/**
 * /admin/analytics — platform analytics dashboard + weekly report trigger
 * (P4-09, FR-SA8). SUPER_ADMIN.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import { getAnalytics, runWeeklyReport, type AnalyticsReport } from "@/components/admin/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

const RANGES = [7, 30, 90] as const;

export default function AnalyticsPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [days, setDays] = React.useState<number>(7);
  const [report, setReport] = React.useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [running, setRunning] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setReport(await getAnalytics(days, token)); }
    catch { toast({ title: t("analytics.loadFailed"), variant: "warning" }); }
    finally { setLoading(false); }
  }, [token, days, t]);
  React.useEffect(() => { void load(); }, [load]);

  const runReport = async () => {
    if (!token) return;
    setRunning(true);
    try { const r = await runWeeklyReport(token); toast({ title: t("analytics.reportSent", { week: r.week, n: r.recipients }), variant: "success" }); }
    catch { toast({ title: t("analytics.reportFailed"), variant: "warning" }); }
    finally { setRunning(false); }
  };

  const kpi = (label: string, value: React.ReactNode) => (
    <div className="rounded-panel border border-line bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
    </div>
  );

  const maxDaily = report ? Math.max(1, ...report.series.map((s) => s.users + s.listings + s.leads)) : 1;

  return (
    <AdminLayout title={t("analytics.title")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button key={r} className={`rounded-card px-3 py-1.5 text-sm ${days === r ? "bg-brand text-white" : "bg-page text-muted"}`} onClick={() => setDays(r)}>
              {t("analytics.days", { n: r })}
            </button>
          ))}
        </div>
        <Button disabled={running} onClick={() => void runReport()}>{t("analytics.runReport")}</Button>
      </div>

      {loading || !report ? (
        <p className="p-6 text-muted">{t("analytics.loading")}</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpi(t("analytics.kpi.newUsers"), report.totals.newUsers.toLocaleString())}
            {kpi(t("analytics.kpi.newListings"), report.totals.newListings.toLocaleString())}
            {kpi(t("analytics.kpi.liveListings"), report.totals.liveListings.toLocaleString())}
            {kpi(t("analytics.kpi.newDealers"), report.totals.newDealers.toLocaleString())}
            {kpi(t("analytics.kpi.leads"), report.totals.leads.toLocaleString())}
            {kpi(t("analytics.kpi.invoices"), report.totals.invoicesIssued.toLocaleString())}
            {kpi(t("analytics.kpi.revenue"), `AED ${report.totals.revenueAed.toLocaleString()}`)}
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-panel border border-line bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-ink">{t("analytics.dailyActivity")}</h3>
              <div className="flex items-end gap-1" style={{ height: 160 }}>
                {report.series.map((s) => {
                  const total = s.users + s.listings + s.leads;
                  const h = Math.round((total / maxDaily) * 150);
                  return (
                    <div key={s.date} className="flex flex-1 flex-col justify-end" title={`${s.date}: ${total}`}>
                      <div className="w-full rounded-t bg-brand" style={{ height: `${h}px`, minHeight: total > 0 ? 3 : 0 }} />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted">
                <span>{report.series[0]?.date}</span>
                <span>{report.series[report.series.length - 1]?.date}</span>
              </div>
            </div>

            <div className="rounded-panel border border-line bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-ink">{t("analytics.topMakes")}</h3>
              <ul className="space-y-2">
                {report.topMakes.map((m) => (
                  <li key={m.make} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{m.make}</span>
                    <span className="font-semibold text-muted">{m.listings}</span>
                  </li>
                ))}
                {report.topMakes.length === 0 && <li className="text-sm text-muted">{t("analytics.noData")}</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return { props: { ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
