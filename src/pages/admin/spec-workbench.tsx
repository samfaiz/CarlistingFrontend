/**
 * /admin/spec-workbench — Spec DB curation workbench (P4-08, FR-VS7/VS2b):
 * coverage dashboard, low-confidence review queue with bulk verify, and the
 * missing-trim correction signals from the sell wizard.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  getSpecCoverage, getSpecReviewQueue, getSpecRequests,
  verifyTrimSpec, bulkVerifySpecs, resolveTrimRequest,
  type SpecCoverage, type ReviewSpec, type TrimRequestRow,
} from "@/components/admin/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

type TF = (k: string, o?: Record<string, unknown>) => string;

export default function SpecWorkbenchPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  return (
    <AdminLayout title={t("spec.title")}>
      <Tabs defaultValue="coverage">
        <TabsList>
          <TabsTrigger value="coverage">{t("spec.tabs.coverage")}</TabsTrigger>
          <TabsTrigger value="queue">{t("spec.tabs.queue")}</TabsTrigger>
          <TabsTrigger value="requests">{t("spec.tabs.requests")}</TabsTrigger>
        </TabsList>
        <TabsContent value="coverage"><CoverageTab token={token} t={t} /></TabsContent>
        <TabsContent value="queue"><QueueTab token={token} t={t} /></TabsContent>
        <TabsContent value="requests"><RequestsTab token={token} t={t} /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

function CoverageTab({ token, t }: { token?: string; t: TF }) {
  const [c, setC] = React.useState<SpecCoverage | null>(null);
  React.useEffect(() => { if (token) void getSpecCoverage(token).then(setC).catch(() => undefined); }, [token]);
  if (!c) return <p className="p-6 text-muted">{t("spec.loading")}</p>;
  const card = (label: string, value: React.ReactNode, sub?: string) => (
    <div className="rounded-panel border border-line bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {card(t("spec.coverage.pct"), `${c.coveragePct}%`, `${c.trimsWithSpecs} / ${c.trimsTotal} ${t("spec.coverage.trims")}`)}
        {card(t("spec.coverage.published"), c.publishedSpecs.toLocaleString(), `${c.draftSpecs} ${t("spec.coverage.draft")}`)}
        {card(t("spec.coverage.lowFields"), c.fields.LOW.toLocaleString(), `${c.fields.VERIFIED} ${t("spec.coverage.verified")} · ${c.fields.HIGH} ${t("spec.coverage.high")}`)}
        {card(t("spec.coverage.openRequests"), c.openRequests.toLocaleString())}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">{t("spec.coverage.byMake")}</h3>
        <div className="overflow-hidden rounded-panel border border-line">
          <table className="w-full text-sm">
            <thead className="bg-page text-xs uppercase text-muted"><tr>
              <th className="p-3 text-start">{t("spec.coverage.make")}</th>
              <th className="p-3 text-start">{t("spec.coverage.covered")}</th>
              <th className="p-3 text-start">{t("spec.coverage.progress")}</th>
            </tr></thead>
            <tbody>{c.byMake.map((m) => {
              const pct = m.trims ? Math.round((m.covered / m.trims) * 100) : 0;
              return (
                <tr key={m.make} className="border-t border-line">
                  <td className="p-3 font-medium text-ink">{m.make}</td>
                  <td className="p-3">{m.covered} / {m.trims}</td>
                  <td className="p-3">
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-divider">
                      <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QueueTab({ token, t }: { token?: string; t: TF }) {
  const [rows, setRows] = React.useState<ReviewSpec[]>([]);
  const [total, setTotal] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { const p = await getSpecReviewQueue(token, { confidence: "LOW", limit: 50 }); setRows(p.items); setTotal(p.total); setSelected(new Set()); }
    catch { toast({ title: t("spec.error"), variant: "warning" }); }
    finally { setLoading(false); }
  }, [token, t]);
  React.useEffect(() => { void load(); }, [load]);

  const verifyOne = async (r: ReviewSpec) => {
    if (!token) return;
    try { await verifyTrimSpec(r.id, { confidence: "VERIFIED", publish: true }, token); toast({ title: t("spec.queue.verified"), variant: "success" }); await load(); }
    catch { toast({ title: t("spec.error"), variant: "warning" }); }
  };
  const bulk = async () => {
    if (!token || selected.size === 0) return;
    try { const r = await bulkVerifySpecs([...selected], token); toast({ title: t("spec.queue.bulkVerified", { n: r.verified }), variant: "success" }); await load(); }
    catch { toast({ title: t("spec.error"), variant: "warning" }); }
  };
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{t("spec.queue.count", { n: total })}</p>
        <Button size="sm" disabled={selected.size === 0} onClick={() => void bulk()}>{t("spec.queue.bulkVerify", { n: selected.size })}</Button>
      </div>
      <div className="overflow-hidden rounded-panel border border-line">
        <table className="w-full text-sm">
          <thead className="bg-page text-xs uppercase text-muted"><tr>
            <th className="p-3"></th>
            <th className="p-3 text-start">{t("spec.queue.spec")}</th>
            <th className="p-3 text-start">{t("spec.queue.year")}</th>
            <th className="p-3 text-start">{t("spec.queue.lowFields")}</th>
            <th className="p-3 text-end"></th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-6 text-center text-muted">{t("spec.loading")}</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">{t("spec.queue.empty")}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="p-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                <td className="p-3"><span className="font-medium text-ink">{r.make} {r.model}</span> <span className="text-xs text-muted">{r.trim} · {r.regionalSpec}</span></td>
                <td className="p-3">{r.year}</td>
                <td className="p-3"><span className="text-xs text-muted">{r.lowFields.map((f) => f.fieldKey).slice(0, 4).join(", ")}{r.lowCount > 4 ? ` +${r.lowCount - 4}` : ""}</span></td>
                <td className="p-3 text-end"><Button size="sm" variant="outline" onClick={() => void verifyOne(r)}>{t("spec.queue.verifyPublish")}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestsTab({ token, t }: { token?: string; t: TF }) {
  const [rows, setRows] = React.useState<TrimRequestRow[]>([]);
  const [status, setStatus] = React.useState("PENDING");
  const load = React.useCallback(async () => {
    if (!token) return;
    try { const p = await getSpecRequests(token, { status, limit: 50 }); setRows(p.items); }
    catch { toast({ title: t("spec.error"), variant: "warning" }); }
  }, [token, status, t]);
  React.useEffect(() => { void load(); }, [load]);
  const resolve = async (r: TrimRequestRow, s: "APPROVED" | "REJECTED") => {
    if (!token) return;
    try { await resolveTrimRequest(r.id, s, token); toast({ title: t("spec.requests.resolved"), variant: "success" }); await load(); }
    catch { toast({ title: t("spec.error"), variant: "warning" }); }
  };
  const detail = (d: Record<string, unknown>) => Object.entries(d).map(([k, v]) => `${k}: ${String(v)}`).join(" · ");
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} className={`rounded-card px-3 py-1.5 text-sm ${status === s ? "bg-brand text-white" : "bg-page text-muted"}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-panel border border-line">
        <table className="w-full text-sm">
          <thead className="bg-page text-xs uppercase text-muted"><tr>
            <th className="p-3 text-start">{t("spec.requests.details")}</th>
            <th className="p-3 text-start">{t("spec.requests.status")}</th>
            <th className="p-3 text-start">{t("spec.requests.when")}</th>
            <th className="p-3 text-end"></th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">{t("spec.requests.empty")}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="p-3 text-xs text-ink">{detail(r.details)}</td>
                <td className="p-3"><Badge variant={r.status === "PENDING" ? "amber" : r.status === "APPROVED" ? "green" : "neutral"}>{r.status}</Badge></td>
                <td className="p-3 text-xs text-muted">{formatRelativeTime(r.createdAt, "en")}</td>
                <td className="p-3 text-end">
                  {r.status === "PENDING" && (
                    <span className="flex justify-end gap-1.5">
                      <Button size="sm" onClick={() => void resolve(r, "APPROVED")}>{t("spec.requests.approve")}</Button>
                      <Button size="sm" variant="outline" onClick={() => void resolve(r, "REJECTED")}>{t("spec.requests.reject")}</Button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return { props: { ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
