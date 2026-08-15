/**
 * /admin/intelligence — G5 workspace.
 *
 * Simulation panels (FR-ADS5), competitor monitoring + alerts (FR-CA1–CA5),
 * and the flag / experiment console (FR-FF2–FF5). The pre-flight disclaimer is
 * rendered from the API response, not hardcoded, so it can never drift.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  intelAckAlert,
  intelAddCompetitor,
  intelAlerts,
  intelApplySuggestions,
  intelCompetitors,
  intelExperimentAction,
  intelExperimentResults,
  intelExperiments,
  intelFlags,
  intelMonitor,
  intelPersonas,
  intelReport,
  intelRunSimulation,
  intelUpsertFlag,
  type CompetitorAlertRow,
  type CompetitorRow,
  type ExperimentRow,
  type FeatureFlagRow,
  type SimPersona,
  type SimulationResult,
} from "@/components/admin/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function IntelligencePage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [personas, setPersonas] = React.useState<SimPersona[]>([]);
  const [competitors, setCompetitors] = React.useState<CompetitorRow[]>([]);
  const [alerts, setAlerts] = React.useState<CompetitorAlertRow[]>([]);
  const [flags, setFlags] = React.useState<FeatureFlagRow[]>([]);
  const [experiments, setExperiments] = React.useState<ExperimentRow[]>([]);
  const [result, setResult] = React.useState<SimulationResult | null>(null);
  const [expResults, setExpResults] = React.useState<Record<string, Awaited<ReturnType<typeof intelExperimentResults>>>>({});
  const [headline, setHeadline] = React.useState("");
  const [bodyCopy, setBodyCopy] = React.useState("");
  const [cta, setCta] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newUrl, setNewUrl] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    try {
      const [p, c, a, f, e] = await Promise.all([
        intelPersonas(token),
        intelCompetitors(token),
        intelAlerts(token),
        intelFlags(token),
        intelExperiments(token),
      ]);
      setPersonas(p);
      setCompetitors(c);
      setAlerts(a);
      setFlags(f);
      setExperiments(e);
    } catch {
      toast({ title: t("intel.loadFailed", { defaultValue: "Could not load intelligence data" }), variant: "error" });
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
    } catch (error) {
      toast({ title: (error as Error).message, variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const runPanel = async () => {
    if (!headline.trim()) return;
    setBusy("sim");
    try {
      const res = await intelRunSimulation(
        { label: headline.slice(0, 40), copy: { headline, body: bodyCopy, cta }, platform: "META" },
        token,
      );
      setResult(res);
    } catch (error) {
      toast({ title: (error as Error).message, variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout title={t("intel.title", { defaultValue: "Intelligence" })}>
      <Tabs defaultValue="simulation">
        <TabsList>
          <TabsTrigger value="simulation">{t("intel.tabs.simulation", { defaultValue: "Simulation" })}</TabsTrigger>
          <TabsTrigger value="competitors">{t("intel.tabs.competitors", { defaultValue: "Competitors" })}</TabsTrigger>
          <TabsTrigger value="experiments">{t("intel.tabs.experiments", { defaultValue: "Flags & experiments" })}</TabsTrigger>
        </TabsList>

        {/* ── Simulation (FR-ADS5) ── */}
        <TabsContent value="simulation">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-2 p-4">
              <h3 className="text-sm font-semibold text-ink">{t("intel.testCopy", { defaultValue: "Test ad copy on the panel" })}</h3>
              <Label htmlFor="sim-headline">{t("intel.headline", { defaultValue: "Headline" })}</Label>
              <Input id="sim-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
              <Label htmlFor="sim-body">{t("intel.body", { defaultValue: "Body" })}</Label>
              <Textarea id="sim-body" rows={2} value={bodyCopy} onChange={(e) => setBodyCopy(e.target.value)} />
              <Label htmlFor="sim-cta">{t("intel.cta", { defaultValue: "Call to action" })}</Label>
              <Input id="sim-cta" value={cta} onChange={(e) => setCta(e.target.value)} />
              <Button className="w-full" disabled={busy === "sim"} onClick={() => void runPanel()} data-testid="run-panel">
                {busy === "sim" ? t("intel.running", { defaultValue: "Running the panel…" }) : t("intel.runPanel", { defaultValue: "Run persona panel" })}
              </Button>
              <p className="text-xs text-muted">
                {t("intel.personaCount", { defaultValue: "{{n}} active personas", n: personas.length })}
              </p>
            </Card>

            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-ink">{t("intel.result", { defaultValue: "Panel result" })}</h3>
              {!result && <p className="text-sm text-muted">{t("intel.noRun", { defaultValue: "Run a panel to see scores and suggestions." })}</p>}
              {result && (
                <div className="space-y-3">
                  <p className="rounded-card bg-line/40 p-2 text-xs text-muted">{result.disclaimer}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="navy">{t("intel.aggregate", { defaultValue: "Aggregate" })}: {result.aggregateScore ?? "—"}/100</Badge>
                    {result.subjects.map((s) => (
                      <Badge key={s.key} variant={s.kind === "COMPETITOR_AD" ? "neutral" : "green"}>
                        {s.label}: {s.avgScore}
                      </Badge>
                    ))}
                  </div>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-ink">
                    {result.suggestions.map((s) => (
                      <li key={s.suggestion}>
                        {s.suggestion} <span className="text-muted">({s.personaVotes})</span>
                      </li>
                    ))}
                  </ol>
                  <Button
                    size="sm"
                    disabled={busy === "apply"}
                    onClick={() =>
                      void act("apply", async () => {
                        const applied = await intelApplySuggestions(result.id, token);
                        toast({ title: t("intel.applied", { defaultValue: "Created editable scene: {{name}}", name: applied.scene.name }) });
                      })
                    }
                  >
                    {t("intel.applySuggestions", { defaultValue: "Apply suggestions → new ad" })}
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <Card className="mt-4 p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("intel.personas", { defaultValue: "Persona panel" })}</h3>
            <div className="grid gap-2 md:grid-cols-3">
              {personas.map((p) => (
                <div key={p.id} className="rounded-card border border-line p-3">
                  <p className="flex items-center justify-between text-sm font-semibold text-ink">
                    {p.name}
                    <Badge variant={p.builtin ? "neutral" : "amber"}>{p.locale}</Badge>
                  </p>
                  <p className="mt-1 text-xs text-muted">{p.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ── Competitors (FR-CA1–CA5) ── */}
        <TabsContent value="competitors">
          <Card className="mb-4 p-4">
            <h3 className="mb-2 text-sm font-semibold text-ink">{t("intel.addCompetitor", { defaultValue: "Watch a competitor" })}</h3>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label htmlFor="comp-name">{t("intel.name", { defaultValue: "Name" })}</Label>
                <Input id="comp-name" className="w-56" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="comp-url">{t("intel.url", { defaultValue: "Website" })}</Label>
                <Input id="comp-url" className="w-72" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://" />
              </div>
              <Button
                disabled={busy !== null || !newName || !newUrl}
                onClick={() =>
                  void act("add", async () => {
                    await intelAddCompetitor({ name: newName, websiteUrl: newUrl }, token);
                    setNewName("");
                    setNewUrl("");
                  })
                }
              >
                {t("intel.add", { defaultValue: "Add" })}
              </Button>
              <Button
                variant="outline"
                disabled={busy !== null}
                onClick={() =>
                  void act("monitor", async () => {
                    const res = await intelMonitor(token);
                    toast({ title: t("intel.monitored", { defaultValue: "{{urls}} URLs checked, {{changes}} change(s)", urls: res.urlsChecked, changes: res.changes }) });
                  })
                }
              >
                {t("intel.monitorNow", { defaultValue: "Monitor now" })}
              </Button>
            </div>
          </Card>

          <Card className="mb-4 p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("intel.name", { defaultValue: "Name" })}</TableHead>
                  <TableHead>{t("intel.position", { defaultValue: "Position" })}</TableHead>
                  <TableHead>{t("intel.snapshots", { defaultValue: "Snapshots" })}</TableHead>
                  <TableHead>{t("intel.alerts", { defaultValue: "Alerts" })}</TableHead>
                  <TableHead>{t("intel.actions", { defaultValue: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="text-muted">{c.marketPosition ?? "—"}</TableCell>
                    <TableCell>{c._count.snapshots}</TableCell>
                    <TableCell>{c._count.alerts}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() =>
                          void act("report", async () => {
                            const r = await intelReport(c.id, token);
                            toast({ title: t("intel.reported", { defaultValue: "Report generated (pack v{{v}})", v: r.promptPackVersion }) });
                          })
                        }
                      >
                        {t("intel.report", { defaultValue: "Report" })}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {competitors.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-muted">{t("intel.noCompetitors", { defaultValue: "No competitors watched yet" })}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("intel.changeAlerts", { defaultValue: "Change alerts" })}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("intel.competitor", { defaultValue: "Competitor" })}</TableHead>
                  <TableHead>{t("intel.kind", { defaultValue: "Kind" })}</TableHead>
                  <TableHead>{t("intel.detail", { defaultValue: "Detail" })}</TableHead>
                  <TableHead>{t("intel.actions", { defaultValue: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.slice(0, 20).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.competitor?.name}</TableCell>
                    <TableCell><Badge variant={a.kind === "PRICE_SIGNAL" ? "amber" : "neutral"}>{a.kind}</Badge></TableCell>
                    <TableCell className="text-xs text-muted">{a.detail ?? a.title}</TableCell>
                    <TableCell>
                      {a.acknowledgedAt ? (
                        <Badge variant="green">{t("intel.acked", { defaultValue: "Acknowledged" })}</Badge>
                      ) : (
                        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void act("ack", () => intelAckAlert(a.id, token))}>
                          {t("intel.ack", { defaultValue: "Acknowledge" })}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {alerts.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-muted">{t("intel.noAlerts", { defaultValue: "No alerts" })}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── Flags & experiments (FR-FF2–FF5) ── */}
        <TabsContent value="experiments">
          <Card className="mb-4 p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("intel.flags", { defaultValue: "Feature flags" })}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("intel.key", { defaultValue: "Key" })}</TableHead>
                  <TableHead>{t("intel.rollout", { defaultValue: "Rollout" })}</TableHead>
                  <TableHead>{t("intel.state", { defaultValue: "State" })}</TableHead>
                  <TableHead>{t("intel.actions", { defaultValue: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((f) => (
                  <TableRow key={f.key}>
                    <TableCell className="font-mono text-xs">{f.key}</TableCell>
                    <TableCell>{f.rolloutPct}%</TableCell>
                    <TableCell>
                      <Badge variant={f.killed ? "red" : f.enabled ? "green" : "neutral"}>
                        {f.killed ? t("intel.killed", { defaultValue: "Killed" }) : f.enabled ? t("intel.on", { defaultValue: "On" }) : t("intel.off", { defaultValue: "Off" })}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void act("flag", () => intelUpsertFlag({ key: f.key, enabled: !f.enabled }, token))}>
                        {f.enabled ? t("intel.disable", { defaultValue: "Disable" }) : t("intel.enable", { defaultValue: "Enable" })}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void act("kill", () => intelUpsertFlag({ key: f.key, killed: !f.killed }, token))}>
                        {f.killed ? t("intel.unkill", { defaultValue: "Un-kill" }) : t("intel.kill", { defaultValue: "Kill" })}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {flags.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-muted">{t("intel.noFlags", { defaultValue: "No flags yet" })}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t("intel.experiments", { defaultValue: "Experiments" })}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("intel.key", { defaultValue: "Key" })}</TableHead>
                  <TableHead>{t("intel.surface", { defaultValue: "Surface" })}</TableHead>
                  <TableHead>{t("intel.status", { defaultValue: "Status" })}</TableHead>
                  <TableHead>{t("intel.results", { defaultValue: "Results" })}</TableHead>
                  <TableHead>{t("intel.actions", { defaultValue: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experiments.map((e) => {
                  const res = expResults[e.key];
                  return (
                    <TableRow key={e.key}>
                      <TableCell className="font-mono text-xs">{e.key}</TableCell>
                      <TableCell>{e.surface}</TableCell>
                      <TableCell>
                        <Badge variant={e.flaggedAt ? "red" : e.status === "RUNNING" ? "green" : "neutral"}>
                          {e.flaggedAt ? t("intel.flagged", { defaultValue: "Guardrail flagged" }) : e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {res ? (
                          <span>
                            {res.totalExposures} exp · SRM χ²={res.srm.chiSquare}
                            {res.srm.detected ? ` ⚠︎` : ""} · {res.guardrails.breaches.length} breach(es)
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy !== null}
                          onClick={() =>
                            void act("results", async () => {
                              const r = await intelExperimentResults(e.key, token);
                              setExpResults((prev) => ({ ...prev, [e.key]: r }));
                            })
                          }
                        >
                          {t("intel.loadResults", { defaultValue: "Results" })}
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy !== null}
                          onClick={() => void act("exp", () => intelExperimentAction(e.key, e.status === "RUNNING" ? "stop" : "start", token))}
                        >
                          {e.status === "RUNNING" ? t("intel.stop", { defaultValue: "Stop" }) : t("intel.start", { defaultValue: "Start" })}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {experiments.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-muted">{t("intel.noExperiments", { defaultValue: "No experiments yet" })}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
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
