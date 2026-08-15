/**
 * /admin/finance — G7/G8 Finance workspace.
 *
 * Five tabs over the finance backends: the FR-FN12 dashboards, the collector
 * workqueue + PDC register (FR-FN4), month-end close with the gap-free
 * sequence audit (FR-FN11), the e-invoicing transmission log (FR-FN2) and the
 * VAT201 workings pack (FR-FN8).
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  financeClosePeriod,
  financeDashboards,
  financePdc,
  financePdcAction,
  financePdcBounce,
  financePeriods,
  financeProcessTransmissions,
  financeSequenceAudit,
  financeTransmissions,
  financeVat201,
  financeWorkqueue,
  type CollectionRow,
  type FinanceDashboards,
  type PdcRow,
  type TransmissionRow,
} from "@/components/admin/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

const aed = (n: number | string | null | undefined) =>
  `AED ${Number(n ?? 0).toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;

export default function FinancePage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [dash, setDash] = React.useState<FinanceDashboards | null>(null);
  const [queue, setQueue] = React.useState<CollectionRow[]>([]);
  const [pdc, setPdc] = React.useState<PdcRow[]>([]);
  const [periods, setPeriods] = React.useState<{ period: string; status: string }[]>([]);
  const [audit, setAudit] = React.useState<Awaited<ReturnType<typeof financeSequenceAudit>> | null>(null);
  const [transmissions, setTransmissions] = React.useState<TransmissionRow[]>([]);
  const [vat, setVat] = React.useState<Awaited<ReturnType<typeof financeVat201>> | null>(null);
  const [vatPeriod, setVatPeriod] = React.useState(new Date().toISOString().slice(0, 7));
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    try {
      const [d, q, p, per, a, tx] = await Promise.all([
        financeDashboards(token),
        financeWorkqueue(token),
        financePdc(token),
        financePeriods(token),
        financeSequenceAudit(token),
        financeTransmissions(token),
      ]);
      setDash(d);
      setQueue(q);
      setPdc(p);
      setPeriods(per);
      setAudit(a);
      setTransmissions(tx);
    } catch {
      toast({ title: t("finance.loadFailed", { defaultValue: "Could not load finance data" }), variant: "error" });
    }
  }, [token, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const act = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await fn();
      await load();
      toast({ title: t("finance.done", { defaultValue: "Done" }) });
    } catch (error) {
      toast({ title: (error as Error).message, variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout title={t("finance.title", { defaultValue: "Finance" })}>
      <Tabs defaultValue="dashboards">
        <TabsList>
          <TabsTrigger value="dashboards">{t("finance.tabs.dashboards", { defaultValue: "Dashboards" })}</TabsTrigger>
          <TabsTrigger value="collections">{t("finance.tabs.collections", { defaultValue: "Collections" })}</TabsTrigger>
          <TabsTrigger value="close">{t("finance.tabs.close", { defaultValue: "Period close" })}</TabsTrigger>
          <TabsTrigger value="einvoicing">{t("finance.tabs.einvoicing", { defaultValue: "E-invoicing" })}</TabsTrigger>
          <TabsTrigger value="tax">{t("finance.tabs.tax", { defaultValue: "VAT201" })}</TabsTrigger>
        </TabsList>

        {/* ── Dashboards (FR-FN12) ── */}
        <TabsContent value="dashboards">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: t("finance.kpi.arr", { defaultValue: "ARR run-rate" }), value: aed(dash?.mrr.arrRunRateAed) },
              { label: t("finance.kpi.deferred", { defaultValue: "Deferred revenue" }), value: aed(dash?.invoicedVsCollected.deferredBalanceAed) },
              { label: t("finance.kpi.dso", { defaultValue: "DSO" }), value: `${dash?.dsoDays ?? 0} d` },
              { label: t("finance.kpi.cei", { defaultValue: "Collection effectiveness" }), value: `${dash?.ceiPct ?? 0}%` },
              { label: t("finance.kpi.ar", { defaultValue: "Total AR" }), value: aed(dash?.agingHeatmap.totalArAed) },
              { label: t("finance.kpi.commission", { defaultValue: "Commission liability" }), value: aed(dash?.commissionLiabilityAed) },
              { label: t("finance.kpi.cash", { defaultValue: "Net cash" }), value: aed(dash?.cashPosition.netAed) },
              { label: t("finance.kpi.pdc", { defaultValue: "PDC due ≤30d" }), value: aed(dash?.cashPosition.pdcDue30dAed) },
            ].map((kpi) => (
              <Card key={kpi.label} className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted">{kpi.label}</p>
                <p className="mt-1 text-xl font-bold text-ink">{kpi.value}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-4 p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("finance.aging", { defaultValue: "AR aging by dealer" })}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("finance.dealer", { defaultValue: "Dealer" })}</TableHead>
                  <TableHead>1–30</TableHead><TableHead>31–60</TableHead><TableHead>61–90</TableHead><TableHead>91–120</TableHead><TableHead>120+</TableHead>
                  <TableHead>{t("finance.total", { defaultValue: "Total" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(dash?.agingHeatmap.dealers ?? []).slice(0, 12).map((d) => (
                  <TableRow key={d.dealerId}>
                    <TableCell>{d.dealerName}</TableCell>
                    <TableCell>{d.d1_30 || "—"}</TableCell><TableCell>{d.d31_60 || "—"}</TableCell><TableCell>{d.d61_90 || "—"}</TableCell>
                    <TableCell>{d.d91_120 || "—"}</TableCell><TableCell>{d.d120_plus || "—"}</TableCell>
                    <TableCell className="font-semibold">{aed(d.totalAed)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── Collections (FR-FN4) ── */}
        <TabsContent value="collections">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("finance.workqueue", { defaultValue: "Collector workqueue" })}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("finance.invoice", { defaultValue: "Invoice" })}</TableHead>
                  <TableHead>{t("finance.dealer", { defaultValue: "Dealer" })}</TableHead>
                  <TableHead>{t("finance.outstanding", { defaultValue: "Outstanding" })}</TableHead>
                  <TableHead>{t("finance.overdue", { defaultValue: "Days overdue" })}</TableHead>
                  <TableHead>{t("finance.promise", { defaultValue: "Promise" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.slice(0, 25).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.number ?? row.id.slice(0, 8)}</TableCell>
                    <TableCell>{row.dealerName}</TableCell>
                    <TableCell>{aed(row.remainingAed)}</TableCell>
                    <TableCell><Badge variant={row.daysOverdue > 60 ? "red" : row.daysOverdue > 30 ? "amber" : "neutral"}>{row.daysOverdue}</Badge></TableCell>
                    <TableCell>{row.openPromise ? t("finance.promised", { defaultValue: "Promised" }) : "—"}</TableCell>
                  </TableRow>
                ))}
                {queue.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-muted">{t("finance.noOverdue", { defaultValue: "Nothing overdue" })}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="mt-4 p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("finance.pdcRegister", { defaultValue: "PDC register" })}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("finance.cheque", { defaultValue: "Cheque" })}</TableHead>
                  <TableHead>{t("finance.bank", { defaultValue: "Bank" })}</TableHead>
                  <TableHead>{t("finance.dealer", { defaultValue: "Dealer" })}</TableHead>
                  <TableHead>{t("finance.amount", { defaultValue: "Amount" })}</TableHead>
                  <TableHead>{t("finance.due", { defaultValue: "Due" })}</TableHead>
                  <TableHead>{t("finance.status", { defaultValue: "Status" })}</TableHead>
                  <TableHead>{t("finance.actions", { defaultValue: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pdc.slice(0, 25).map((cheque) => (
                  <TableRow key={cheque.id}>
                    <TableCell>{cheque.chequeNumber}</TableCell>
                    <TableCell>{cheque.draweeBank}</TableCell>
                    <TableCell>{cheque.dealer?.name}</TableCell>
                    <TableCell>{aed(cheque.amountAed)}</TableCell>
                    <TableCell>{cheque.dueDate?.slice(0, 10)}</TableCell>
                    <TableCell><Badge variant={cheque.status === "BOUNCED" ? "red" : cheque.status === "CLEARED" ? "green" : "neutral"}>{cheque.status}</Badge></TableCell>
                    <TableCell className="space-x-1">
                      {cheque.status === "RECEIVED" && (
                        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void act("deposit", () => financePdcAction(cheque.id, "deposit", token))}>
                          {t("finance.deposit", { defaultValue: "Deposit" })}
                        </Button>
                      )}
                      {cheque.status === "DEPOSITED" && (
                        <>
                          <Button size="sm" disabled={busy !== null} onClick={() => void act("clear", () => financePdcAction(cheque.id, "clear", token))}>
                            {t("finance.clear", { defaultValue: "Cleared" })}
                          </Button>
                          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void act("bounce", () => financePdcBounce(cheque.id, "Bounced at the bank", token))}>
                            {t("finance.bounce", { defaultValue: "Bounced" })}
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {pdc.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-muted">{t("finance.noPdc", { defaultValue: "No post-dated cheques on file" })}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── Period close + sequence audit (FR-FN11) ── */}
        <TabsContent value="close">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">{t("finance.periods", { defaultValue: "Finance periods" })}</h3>
              <div className="mb-3 flex gap-2">
                <Input className="w-40" value={vatPeriod} onChange={(e) => setVatPeriod(e.target.value)} placeholder="YYYY-MM" aria-label={t("finance.period", { defaultValue: "Period" })} />
                <Button size="sm" disabled={busy !== null} onClick={() => void act("close", () => financeClosePeriod(vatPeriod, token))}>
                  {t("finance.close", { defaultValue: "Close period" })}
                </Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>{t("finance.period", { defaultValue: "Period" })}</TableHead><TableHead>{t("finance.status", { defaultValue: "Status" })}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {periods.slice(0, 12).map((p) => (
                    <TableRow key={p.period}>
                      <TableCell>{p.period}</TableCell>
                      <TableCell><Badge variant={p.status === "CLOSED" ? "navy" : "green"}>{p.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">{t("finance.sequences", { defaultValue: "Gap-free sequence audit" })}</h3>
              <p className="mb-2">
                <Badge variant={audit?.allGapFree ? "green" : "red"}>
                  {audit?.allGapFree ? t("finance.gapFree", { defaultValue: "All series gap-free" }) : t("finance.gaps", { defaultValue: "Gaps detected" })}
                </Badge>
              </p>
              <Table>
                <TableHeader><TableRow><TableHead>{t("finance.series", { defaultValue: "Series" })}</TableHead><TableHead>{t("finance.count", { defaultValue: "Docs" })}</TableHead><TableHead>{t("finance.status", { defaultValue: "Status" })}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[...(audit?.invoices ?? []), ...(audit?.creditNotes ?? []), ...(audit?.receipts ?? [])].map((s) => (
                    <TableRow key={s.series}>
                      <TableCell>{s.series}</TableCell>
                      <TableCell>{s.count}</TableCell>
                      <TableCell><Badge variant={s.gapFree ? "green" : "red"}>{s.gapFree ? "OK" : "GAPS"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        {/* ── E-invoicing (FR-FN2) ── */}
        <TabsContent value="einvoicing">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">{t("finance.transmissions", { defaultValue: "E-invoice transmissions" })}</h3>
              <Button size="sm" disabled={busy !== null} onClick={() => void act("process", () => financeProcessTransmissions(token))}>
                {t("finance.processQueue", { defaultValue: "Run queue now" })}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("finance.document", { defaultValue: "Document" })}</TableHead>
                  <TableHead>{t("finance.status", { defaultValue: "Status" })}</TableHead>
                  <TableHead>{t("finance.attempts", { defaultValue: "Attempts" })}</TableHead>
                  <TableHead>{t("finance.error", { defaultValue: "Last error" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transmissions.slice(0, 25).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.documentKey}</TableCell>
                    <TableCell><Badge variant={tx.status === "FAILED" ? "red" : tx.status === "TDD_REPORTED" ? "green" : "neutral"}>{tx.status}</Badge></TableCell>
                    <TableCell>{tx.attempts}</TableCell>
                    <TableCell className="text-xs text-muted">{tx.lastError ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {transmissions.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-muted">{t("finance.noTransmissions", { defaultValue: "Nothing queued — enable voluntary adoption to start transmitting" })}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── VAT201 (FR-FN8) ── */}
        <TabsContent value="tax">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Input className="w-40" value={vatPeriod} onChange={(e) => setVatPeriod(e.target.value)} placeholder="YYYY-MM" aria-label={t("finance.period", { defaultValue: "Period" })} />
              <Button size="sm" disabled={busy !== null} onClick={() => void act("vat", async () => setVat(await financeVat201(vatPeriod, token)))}>
                {t("finance.generateVat", { defaultValue: "Generate workings" })}
              </Button>
            </div>
            {vat && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="navy">{t("finance.netVat", { defaultValue: "Net VAT due" })}: {aed(vat.netVatDueAed)}</Badge>
                  <Badge variant="neutral">Box 1: {aed(vat.boxes.box1TotalVatAed)}</Badge>
                  <Badge variant="neutral">Box 3 (RCM): {aed(vat.boxes.box3RcmOutputVatAed)}</Badge>
                  <Badge variant="neutral">Box 9 (input): {aed(vat.boxes.box9InputVatAed)}</Badge>
                  <Badge variant={vat.reconciliations.returnToRegister.differenceAed === 0 ? "green" : "red"}>
                    {t("finance.reconciled", { defaultValue: "Register reconciliation" })}: {vat.reconciliations.returnToRegister.differenceAed}
                  </Badge>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>{t("finance.emirate", { defaultValue: "Emirate" })}</TableHead><TableHead>{t("finance.net", { defaultValue: "Net" })}</TableHead><TableHead>VAT</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {vat.boxes.box1ByEmirate.map((row) => (
                      <TableRow key={row.emirate}>
                        <TableCell>{row.emirate}</TableCell>
                        <TableCell>{aed(row.amountAed)}</TableCell>
                        <TableCell>{aed(row.vatAed)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return { props: { ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
