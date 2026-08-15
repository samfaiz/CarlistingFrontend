/**
 * /admin/growth — G2 marketing leads + G3 SEO suite + G4 campaigns in one
 * workspace, because the same person runs all three day to day.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  adsCampaigns,
  adsCreateCampaign,
  adsRecordSpend,
  marketingDashboard,
  marketingLeads,
  seoDashboard,
  seoKeywords,
  seoRunTech,
  seoRunTracking,
  seoTech,
  type AdCampaignRow,
  type MarketingLeadRow,
  type SeoKeywordRow,
  type SeoTechRow,
} from "@/components/admin/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

const aed = (n: number | string | null | undefined) =>
  `AED ${Number(n ?? 0).toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;

export default function GrowthPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? "";

  const [leads, setLeads] = React.useState<MarketingLeadRow[]>([]);
  const [marketing, setMarketing] = React.useState<Record<string, unknown> | null>(null);
  const [campaigns, setCampaigns] = React.useState<AdCampaignRow[]>([]);
  const [seo, setSeo] = React.useState<Record<string, unknown> | null>(null);
  const [keywords, setKeywords] = React.useState<SeoKeywordRow[]>([]);
  const [tech, setTech] = React.useState<SeoTechRow[]>([]);
  const [campName, setCampName] = React.useState("");
  const [campBudget, setCampBudget] = React.useState("5000");
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    const results = await Promise.allSettled([
      marketingLeads(token),
      marketingDashboard(token),
      adsCampaigns(token),
      seoDashboard(token),
      seoKeywords(token),
      seoTech(token),
    ]);
    if (results[0].status === "fulfilled") setLeads(results[0].value.items ?? []);
    if (results[1].status === "fulfilled") setMarketing(results[1].value);
    if (results[2].status === "fulfilled") setCampaigns(results[2].value);
    if (results[3].status === "fulfilled") setSeo(results[3].value);
    if (results[4].status === "fulfilled") setKeywords(results[4].value);
    if (results[5].status === "fulfilled") setTech(results[5].value);
  }, [token]);

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

  return (
    <AdminLayout title={t("growth.title", { defaultValue: "Growth" })}>
      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">{t("growth.tabs.leads", { defaultValue: "Marketing leads" })}</TabsTrigger>
          <TabsTrigger value="campaigns">{t("growth.tabs.campaigns", { defaultValue: "Campaigns" })}</TabsTrigger>
          <TabsTrigger value="seo">{t("growth.tabs.seo", { defaultValue: "SEO" })}</TabsTrigger>
        </TabsList>

        {/* ── G2 marketing leads ── */}
        <TabsContent value="leads">
          {marketing && (
            <div className="mb-4 grid gap-4 md:grid-cols-4">
              {Object.entries(marketing)
                .filter(([, v]) => typeof v === "number")
                .slice(0, 8)
                .map(([k, v]) => (
                  <Card key={k} className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">{k}</p>
                    <p className="mt-1 text-xl font-bold text-ink">{String(v)}</p>
                  </Card>
                ))}
            </div>
          )}
          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("growth.lead", { defaultValue: "Lead" })}</TableHead>
                  <TableHead>{t("growth.platform", { defaultValue: "Platform" })}</TableHead>
                  <TableHead>{t("growth.campaign", { defaultValue: "Campaign" })}</TableHead>
                  <TableHead>{t("growth.status", { defaultValue: "Status" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 25).map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell><Badge variant="neutral">{lead.platform}</Badge></TableCell>
                    <TableCell className="text-xs text-muted">{lead.utmCampaign ?? lead.campaignId ?? "—"}</TableCell>
                    <TableCell><Badge variant={lead.status === "CONVERTED" ? "green" : "neutral"}>{lead.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-muted">{t("growth.noLeads", { defaultValue: "No marketing leads yet" })}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── G4 campaigns ── */}
        <TabsContent value="campaigns">
          <Card className="mb-4 p-4">
            <h3 className="mb-2 text-sm font-semibold text-ink">{t("growth.newCampaign", { defaultValue: "New campaign" })}</h3>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label htmlFor="camp-name">{t("growth.name", { defaultValue: "Name" })}</Label>
                <Input id="camp-name" className="w-64" value={campName} onChange={(e) => setCampName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="camp-budget">{t("growth.budget", { defaultValue: "Budget (AED)" })}</Label>
                <Input id="camp-budget" className="w-36" value={campBudget} onChange={(e) => setCampBudget(e.target.value)} />
              </div>
              <Button
                disabled={busy !== null || !campName}
                onClick={() =>
                  void act("camp", async () => {
                    await adsCreateCampaign({ name: campName, platform: "META", budgetAed: Number(campBudget) || 0, landingPath: "/cars" }, token);
                    setCampName("");
                  })
                }
              >
                {t("growth.create", { defaultValue: "Create" })}
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("growth.name", { defaultValue: "Name" })}</TableHead>
                  <TableHead>{t("growth.platform", { defaultValue: "Platform" })}</TableHead>
                  <TableHead>{t("growth.budget", { defaultValue: "Budget" })}</TableHead>
                  <TableHead>{t("growth.spend", { defaultValue: "Spend" })}</TableHead>
                  <TableHead>{t("growth.creatives", { defaultValue: "Creatives" })}</TableHead>
                  <TableHead>{t("growth.utm", { defaultValue: "UTM" })}</TableHead>
                  <TableHead>{t("growth.actions", { defaultValue: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell><Badge variant="neutral">{c.platform}</Badge></TableCell>
                    <TableCell>{aed(c.budgetAed)}</TableCell>
                    <TableCell>{aed(c.spendAed)}</TableCell>
                    <TableCell>{c.creativeCount ?? 0}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-muted">{c.utmUrl}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() =>
                          void act("spend", () =>
                            adsRecordSpend(c.id, { day: new Date().toISOString().slice(0, 10), spendAed: 100 }, token),
                          )
                        }
                      >
                        {t("growth.addSpend", { defaultValue: "+100 spend" })}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {campaigns.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-muted">{t("growth.noCampaigns", { defaultValue: "No campaigns yet" })}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── G3 SEO ── */}
        <TabsContent value="seo">
          <div className="mb-4 flex gap-2">
            <Button
              size="sm"
              disabled={busy !== null}
              onClick={() =>
                void act("rank", async () => {
                  const r = await seoRunTracking(token);
                  toast({ title: t("growth.ranked", { defaultValue: "{{n}} keywords tracked", n: r.tracked }) });
                })
              }
            >
              {t("growth.runRanks", { defaultValue: "Run rank tracking" })}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() =>
                void act("tech", async () => {
                  const r = await seoRunTech(token);
                  toast({ title: t("growth.techRan", { defaultValue: "{{n}} checks, {{f}} failures", n: r.ran, f: r.failures }) });
                })
              }
            >
              {t("growth.runTech", { defaultValue: "Run technical monitors" })}
            </Button>
          </div>

          {seo && (
            <Card className="mb-4 p-4">
              <h3 className="mb-2 text-sm font-semibold text-ink">{t("growth.seoDashboard", { defaultValue: "SEO dashboard" })}</h3>
              <pre className="max-h-56 overflow-auto rounded-card bg-line/30 p-3 text-xs text-muted">{JSON.stringify(seo, null, 2).slice(0, 2000)}</pre>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">{t("growth.keywords", { defaultValue: "Tracked keywords" })}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("growth.keyword", { defaultValue: "Keyword" })}</TableHead>
                    <TableHead>{t("growth.locale", { defaultValue: "Locale" })}</TableHead>
                    <TableHead>{t("growth.position", { defaultValue: "Position" })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.slice(0, 15).map((k) => (
                    <TableRow key={k.id}>
                      <TableCell>{k.keyword}</TableCell>
                      <TableCell>{k.locale}</TableCell>
                      <TableCell>{k.latestPosition ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {keywords.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-muted">{t("growth.noKeywords", { defaultValue: "No keywords tracked" })}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">{t("growth.techMonitors", { defaultValue: "Technical monitors" })}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("growth.check", { defaultValue: "Check" })}</TableHead>
                    <TableHead>{t("growth.status", { defaultValue: "Status" })}</TableHead>
                    <TableHead>{t("growth.detail", { defaultValue: "Detail" })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tech.slice(0, 15).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.kind}</TableCell>
                      <TableCell><Badge variant={row.ok ? "green" : "red"}>{row.ok ? "OK" : "FAIL"}</Badge></TableCell>
                      <TableCell className="max-w-[280px] truncate text-xs text-muted">{row.detail ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {tech.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-muted">{t("growth.noChecks", { defaultValue: "No monitor runs yet" })}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
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
