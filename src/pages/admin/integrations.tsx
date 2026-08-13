/**
 * /admin/integrations — encrypted secrets vault + AI configuration (P5-01).
 * SUPER_ADMIN. Secret VALUES are write-only: they are entered here, encrypted
 * server-side, and never returned — the list shows a masked hint only.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  getSecrets, setSecret, deleteSecret, type SecretRow,
  getAiConfig, setAiFlag, setAiCaps, getAiUsage, testAiProvider,
  type AiConfig, type AiUsageRow,
} from "@/components/admin/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

type TF = (k: string, o?: Record<string, unknown>) => string;

const KNOWN: { group: string; keys: { key: string; label: string }[] }[] = [
  { group: "AI providers", keys: [
    { key: "ANTHROPIC_API_KEY", label: "Anthropic (Claude) — primary" },
    { key: "OPENROUTER_API_KEY", label: "OpenRouter — fallback" },
    { key: "GEMINI_API_KEY", label: "Google Gemini — fallback" },
  ] },
  { group: "Imagery", keys: [
    { key: "IMAGIN_API_KEY", label: "IMAGIN.studio (vehicle imagery)" },
    { key: "FAL_API_KEY", label: "fal.ai (image generation)" },
  ] },
  { group: "Email (ESP / SMTP)", keys: [
    { key: "SMTP_HOST", label: "SMTP host" },
    { key: "SMTP_USER", label: "SMTP user" },
    { key: "SMTP_PASS", label: "SMTP password" },
  ] },
  { group: "Google", keys: [
    { key: "GOOGLE_OAUTH_CLIENT_ID", label: "OAuth client id" },
    { key: "GOOGLE_OAUTH_CLIENT_SECRET", label: "OAuth client secret" },
    { key: "GOOGLE_PLACES_API_KEY", label: "Places API key" },
    { key: "GOOGLE_MAPS_API_KEY", label: "Maps API key" },
  ] },
];
const CATEGORY_OF = (key: string) => KNOWN.find((g) => g.keys.some((k) => k.key === key))?.group ?? "integration";

export default function IntegrationsPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  return (
    <AdminLayout title={t("integrations.title")}>
      <Tabs defaultValue="secrets">
        <TabsList>
          <TabsTrigger value="secrets">{t("integrations.tabs.secrets")}</TabsTrigger>
          <TabsTrigger value="ai">{t("integrations.tabs.ai")}</TabsTrigger>
        </TabsList>
        <TabsContent value="secrets"><SecretsTab token={token} t={t} /></TabsContent>
        <TabsContent value="ai"><AiTab token={token} t={t} /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

function SecretsTab({ token, t }: { token?: string; t: TF }) {
  const [rows, setRows] = React.useState<SecretRow[]>([]);
  const [edit, setEdit] = React.useState<{ key: string; value: string; category: string; custom: boolean } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(async () => { if (token) setRows(await getSecrets(token).catch(() => [])); }, [token]);
  React.useEffect(() => { void load(); }, [load]);

  const byKey = new Map(rows.map((r) => [r.key, r]));
  const open = (key: string, custom = false) => setEdit({ key, value: "", category: CATEGORY_OF(key), custom });
  const save = async () => {
    if (!token || !edit) return;
    if (!edit.key.trim() || !edit.value.trim()) { toast({ title: t("integrations.needKeyValue"), variant: "warning" }); return; }
    setBusy(true);
    try { await setSecret(edit.key.trim(), edit.value, edit.category, token); toast({ title: t("integrations.saved"), variant: "success" }); setEdit(null); await load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : t("integrations.error"), variant: "warning" }); }
    finally { setBusy(false); }
  };
  const remove = async (key: string) => {
    if (!token || !window.confirm(t("integrations.confirmRemove", { key }))) return;
    try { await deleteSecret(key, token); toast({ title: t("integrations.removed"), variant: "success" }); await load(); }
    catch { toast({ title: t("integrations.error"), variant: "warning" }); }
  };

  return (
    <div className="space-y-5">
      <p className="rounded-card bg-page p-3 text-sm text-muted">🔒 {t("integrations.securityNote")}</p>
      {KNOWN.map((grp) => (
        <div key={grp.group}>
          <h3 className="mb-2 text-sm font-semibold text-ink">{grp.group}</h3>
          <div className="overflow-hidden rounded-panel border border-line">
            <table className="w-full text-sm">
              <tbody>
                {grp.keys.map((k) => {
                  const cur = byKey.get(k.key);
                  return (
                    <tr key={k.key} className="border-t border-line first:border-t-0">
                      <td className="p-3"><div className="font-medium text-ink">{k.label}</div><div className="font-mono text-xs text-muted">{k.key}</div></td>
                      <td className="p-3">{cur ? <Badge variant="green">{t("integrations.configured")}</Badge> : <Badge variant="neutral">{t("integrations.notSet")}</Badge>}</td>
                      <td className="p-3 font-mono text-xs text-muted">{cur?.hint ?? "—"}</td>
                      <td className="p-3 text-end">
                        <span className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => open(k.key)}>{cur ? t("integrations.update") : t("integrations.set")}</Button>
                          {cur && <Button size="sm" variant="ghost" onClick={() => void remove(k.key)}>{t("integrations.remove")}</Button>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div>
        <Button size="sm" variant="outline" onClick={() => open("", true)}>{t("integrations.addCustom")}</Button>
      </div>

      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.custom ? t("integrations.addCustom") : `${t("integrations.set")} · ${edit?.key}`}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              {edit.custom && (
                <div><Label htmlFor="sk">{t("integrations.keyName")}</Label><Input id="sk" value={edit.key} onChange={(e) => setEdit({ ...edit, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} placeholder="MY_PROVIDER_API_KEY" /></div>
              )}
              <div>
                <Label htmlFor="sv">{t("integrations.value")}</Label>
                <Input id="sv" type="password" autoComplete="new-password" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} placeholder="••••••••••••" />
                <p className="mt-1 text-xs text-muted">{t("integrations.writeOnly")}</p>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>{t("integrations.cancel")}</Button><Button disabled={busy} onClick={() => void save()}>{t("integrations.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AiTab({ token, t }: { token?: string; t: TF }) {
  const [cfg, setCfg] = React.useState<AiConfig | null>(null);
  const [usage, setUsage] = React.useState<AiUsageRow[]>([]);
  const [caps, setCaps] = React.useState({ perUserPerDay: 50, globalPerDay: 5000 });
  const [testing, setTesting] = React.useState(false);
  const load = React.useCallback(async () => {
    if (!token) return;
    const [c, u] = await Promise.all([getAiConfig(token).catch(() => null), getAiUsage(30, token).catch(() => [])]);
    if (c) { setCfg(c); setCaps(c.caps); }
    setUsage(u);
  }, [token]);
  React.useEffect(() => { void load(); }, [load]);

  const toggle = async (feature: string, enabled: boolean) => {
    if (!token) return;
    try { await setAiFlag(feature, enabled, token); await load(); }
    catch { toast({ title: t("integrations.error"), variant: "warning" }); }
  };
  const saveCaps = async () => {
    if (!token) return;
    try { await setAiCaps(caps, token); toast({ title: t("integrations.saved"), variant: "success" }); }
    catch { toast({ title: t("integrations.error"), variant: "warning" }); }
  };
  const test = async () => {
    if (!token) return;
    setTesting(true);
    try { const r = await testAiProvider(token); toast({ title: r.ok ? t("integrations.ai.testOk", { provider: r.provider }) : t("integrations.ai.testFail", { detail: r.detail ?? r.provider }), variant: r.ok ? "success" : "warning" }); }
    finally { setTesting(false); }
  };

  if (!cfg) return <p className="p-6 text-muted">{t("integrations.loading")}</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-panel border border-line bg-card p-4">
        <span className="text-sm text-ink">{t("integrations.ai.provider")}:</span>
        <Badge variant={cfg.providerConfigured ? "green" : "amber"}>{cfg.providerConfigured ? t("integrations.ai.live") : t("integrations.ai.localOnly")}</Badge>
        <Button size="sm" variant="outline" disabled={testing} onClick={() => void test()}>{t("integrations.ai.test")}</Button>
        {!cfg.providerConfigured && <span className="text-xs text-muted">{t("integrations.ai.addKeyHint")}</span>}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">{t("integrations.ai.features")}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(cfg.flags).map(([feature, enabled]) => (
            <label key={feature} className="flex items-center justify-between rounded-card border border-line bg-card px-3 py-2 text-sm">
              <span className="text-ink">{t(`integrations.ai.feature.${feature}`, { defaultValue: feature })}</span>
              <input type="checkbox" checked={enabled} onChange={(e) => void toggle(feature, e.target.checked)} />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-panel border border-line bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">{t("integrations.ai.caps")}</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div><Label htmlFor="cu">{t("integrations.ai.perUser")}</Label><Input id="cu" type="number" className="w-40" value={caps.perUserPerDay} onChange={(e) => setCaps({ ...caps, perUserPerDay: Number(e.target.value) })} /></div>
          <div><Label htmlFor="cg">{t("integrations.ai.global")}</Label><Input id="cg" type="number" className="w-40" value={caps.globalPerDay} onChange={(e) => setCaps({ ...caps, globalPerDay: Number(e.target.value) })} /></div>
          <Button onClick={() => void saveCaps()}>{t("integrations.save")}</Button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink">{t("integrations.ai.usage")}</h3>
        <div className="overflow-hidden rounded-panel border border-line">
          <table className="w-full text-sm">
            <thead className="bg-page text-xs uppercase text-muted"><tr>
              <th className="p-3 text-start">{t("integrations.ai.usageFeature")}</th><th className="p-3 text-start">{t("integrations.ai.usageProvider")}</th>
              <th className="p-3 text-start">{t("integrations.ai.usageCalls")}</th><th className="p-3 text-start">{t("integrations.ai.usageTokens")}</th><th className="p-3 text-start">{t("integrations.ai.usageCost")}</th>
            </tr></thead>
            <tbody>
              {usage.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">{t("integrations.ai.noUsage")}</td></tr>}
              {usage.map((u, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="p-3 text-ink">{u.feature}</td>
                  <td className="p-3"><Badge variant={u.provider === "local" ? "neutral" : "navy"}>{u.provider}</Badge></td>
                  <td className="p-3">{u.calls}</td>
                  <td className="p-3 text-muted">{(u.inputTokens + u.outputTokens).toLocaleString()}</td>
                  <td className="p-3">${u.costUsd.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
