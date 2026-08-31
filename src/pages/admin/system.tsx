/**
 * /admin/system — Super Admin console (P4-07, FR-SA1/SA2/SA3/SA5/SA6/SA7).
 * Tabs: system health, staff & permissions, packages, settings, translations,
 * taxonomy. SUPER_ADMIN-gated by the backend; page shows a notice for ADMINs.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  getSystemHealth, type SystemHealth,
  getStaff, getPermissionCatalogue, createStaff, setStaffRole, setStaffPermissions, type StaffRow,
  getPackages, upsertPackage, type PackageRow, type PackageInput,
  getSettings, upsertSetting, type SettingRow,
  getTranslationNamespaces, getTranslations, upsertTranslation, type TranslationRow,
  getAdminTaxonomy, upsertMake, reindexMake, type AdminTaxonomy,
} from "@/components/admin/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

const LOCALES = ["en", "ar", "es", "fr"] as const;

export default function SystemPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  return (
    <AdminLayout title={t("system.title")}>
      <Tabs defaultValue="health">
        <TabsList className="flex-wrap">
          <TabsTrigger value="health">{t("system.tabs.health")}</TabsTrigger>
          <TabsTrigger value="staff">{t("system.tabs.staff")}</TabsTrigger>
          <TabsTrigger value="packages">{t("system.tabs.packages")}</TabsTrigger>
          <TabsTrigger value="settings">{t("system.tabs.settings")}</TabsTrigger>
          <TabsTrigger value="translations">{t("system.tabs.translations")}</TabsTrigger>
          <TabsTrigger value="taxonomy">{t("system.tabs.taxonomy")}</TabsTrigger>
        </TabsList>
        <TabsContent value="health"><HealthTab token={token} t={t} /></TabsContent>
        <TabsContent value="staff"><StaffTab token={token} t={t} /></TabsContent>
        <TabsContent value="packages"><PackagesTab token={token} t={t} /></TabsContent>
        <TabsContent value="settings"><SettingsTab token={token} t={t} /></TabsContent>
        <TabsContent value="translations"><TranslationsTab token={token} t={t} /></TabsContent>
        <TabsContent value="taxonomy"><TaxonomyTab token={token} t={t} /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

type TF = (k: string, o?: Record<string, unknown>) => string;

function HealthTab({ token, t }: { token?: string; t: TF }) {
  const [h, setH] = React.useState<SystemHealth | null>(null);
  const load = React.useCallback(async () => { if (token) setH(await getSystemHealth(token).catch(() => null)); }, [token]);
  React.useEffect(() => { void load(); }, [load]);
  if (!h) return <p className="p-6 text-muted">{t("system.loading")}</p>;
  const card = (label: string, value: React.ReactNode) => (
    <div className="rounded-panel border border-line bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-lg font-bold text-ink">{value}</div>
    </div>
  );
  const q = (v: Record<string, number> | null) => (v ? `${v.waiting ?? 0} wait · ${v.active ?? 0} active · ${v.failed ?? 0} failed` : "—");
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => void load()}>{t("system.refresh")}</Button></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {card(t("system.health.database"), <Badge variant={h.database.status === "up" ? "green" : "amber"}>{h.database.status}</Badge>)}
        {card(t("system.health.mediaQueue"), <span className="text-sm">{q(h.queues.media)}</span>)}
        {card(t("system.health.emailQueue"), <span className="text-sm">{q(h.queues.email)}</span>)}
        {card(t("system.health.users"), h.counts.users.toLocaleString())}
        {card(t("system.health.listings"), `${h.counts.liveListings.toLocaleString()} / ${h.counts.listings.toLocaleString()}`)}
        {card(t("system.health.pendingReview"), h.counts.pendingReview.toLocaleString())}
        {card(t("system.health.dealers"), h.counts.dealers.toLocaleString())}
      </div>
    </div>
  );
}

function StaffTab({ token, t }: { token?: string; t: TF }) {
  const [rows, setRows] = React.useState<StaffRow[]>([]);
  const [catalogue, setCatalogue] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<StaffRow | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({ email: "", name: "", role: "ADMIN" as "ADMIN" | "SUPER_ADMIN" });
  const [perms, setPerms] = React.useState<string[]>([]);
  const load = React.useCallback(async () => {
    if (!token) return;
    const [s, c] = await Promise.all([getStaff(token), getPermissionCatalogue(token)]);
    setRows(s); setCatalogue(c);
  }, [token]);
  React.useEffect(() => { void load(); }, [load]);

  const savePerms = async () => {
    if (!token || !editing) return;
    try { await setStaffPermissions(editing.id, perms, token); toast({ title: t("system.staff.permsSaved"), variant: "success" }); setEditing(null); await load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : t("system.error"), variant: "warning" }); }
  };
  const changeRole = async (r: StaffRow, role: "USER" | "ADMIN" | "SUPER_ADMIN") => {
    if (!token) return;
    try { await setStaffRole(r.id, role, token); await load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : t("system.error"), variant: "warning" }); }
  };
  const create = async () => {
    if (!token) return;
    try { await createStaff({ ...form, permissions: [] }, token); toast({ title: t("system.staff.created"), variant: "success" }); setCreating(false); setForm({ email: "", name: "", role: "ADMIN" }); await load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : t("system.error"), variant: "warning" }); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setCreating(true)}>{t("system.staff.new")}</Button></div>
      <div className="overflow-hidden rounded-panel border border-line">
        <table className="w-full text-sm">
          <thead className="bg-page text-start text-xs uppercase text-muted"><tr>
            <th className="p-3 text-start">{t("system.staff.name")}</th>
            <th className="p-3 text-start">{t("system.staff.role")}</th>
            <th className="p-3 text-start">{t("system.staff.permissions")}</th>
            <th className="p-3 text-end">{t("system.staff.actions")}</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="p-3"><div className="font-medium text-ink">{r.name}</div><div className="text-xs text-muted">{r.email}</div></td>
                <td className="p-3">
                  <select className="h-8 rounded-card border border-line bg-page px-2 text-xs" value={r.role} onChange={(e) => void changeRole(r, e.target.value as "USER" | "ADMIN" | "SUPER_ADMIN")}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="USER">USER</option>
                  </select>
                </td>
                <td className="p-3"><span className="text-xs text-muted">{r.permissions.length ? r.permissions.join(", ") : t("system.staff.roleDefaults")}</span></td>
                <td className="p-3 text-end"><Button size="sm" variant="outline" onClick={() => { setEditing(r); setPerms(r.permissions); }}>{t("system.staff.editPerms")}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.name} — {t("system.staff.permissions")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {catalogue.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={perms.includes(p)} onChange={(e) => setPerms((cur) => e.target.checked ? [...cur, p] : cur.filter((x) => x !== p))} />
                {p}
              </label>
            ))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>{t("system.cancel")}</Button><Button onClick={() => void savePerms()}>{t("system.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("system.staff.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label htmlFor="s-name">{t("system.staff.name")}</Label><Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label htmlFor="s-email">{t("system.staff.email")}</Label><Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label htmlFor="s-role">{t("system.staff.role")}</Label>
              <select id="s-role" className="mt-1 h-10 w-full rounded-card border border-line bg-page px-3 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "SUPER_ADMIN" })}>
                <option value="ADMIN">ADMIN</option><option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
            <p className="text-xs text-muted">{t("system.staff.resetNote")}</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreating(false)}>{t("system.cancel")}</Button><Button onClick={() => void create()}>{t("system.staff.create")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackagesTab({ token, t }: { token?: string; t: TF }) {
  const [rows, setRows] = React.useState<PackageRow[]>([]);
  const [edit, setEdit] = React.useState<PackageInput | null>(null);
  const load = React.useCallback(async () => { if (token) setRows(await getPackages(token).catch(() => [])); }, [token]);
  React.useEffect(() => { void load(); }, [load]);
  const save = async () => {
    if (!token || !edit) return;
    try { await upsertPackage(edit, token); toast({ title: t("system.packages.saved"), variant: "success" }); setEdit(null); await load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : t("system.error"), variant: "warning" }); }
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setEdit({ tier: "", name: "", listingQuota: 10, boostCredits: 0, priceAed: 0, termMonths: 1, isActive: true })}>{t("system.packages.new")}</Button></div>
      <div className="overflow-hidden rounded-panel border border-line">
        <table className="w-full text-sm">
          <thead className="bg-page text-xs uppercase text-muted"><tr>
            <th className="p-3 text-start">{t("system.packages.tier")}</th><th className="p-3 text-start">{t("system.packages.price")}</th>
            <th className="p-3 text-start">{t("system.packages.quota")}</th><th className="p-3 text-start">{t("system.packages.subs")}</th>
            <th className="p-3 text-start">{t("system.packages.active")}</th><th className="p-3 text-end"></th>
          </tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id} className="border-t border-line">
              <td className="p-3"><span className="font-medium text-ink">{p.tier}</span> <span className="text-xs text-muted">{p.name}</span></td>
              <td className="p-3">AED {p.priceAed.toLocaleString()}</td>
              <td className="p-3">{p.listingQuota}</td>
              <td className="p-3">{p.activeSubscriptions}</td>
              <td className="p-3"><Badge variant={p.isActive ? "green" : "neutral"}>{p.isActive ? t("system.on") : t("system.off")}</Badge></td>
              <td className="p-3 text-end"><Button size="sm" variant="outline" onClick={() => setEdit({ id: p.id, tier: p.tier, name: p.name, listingQuota: p.listingQuota, boostCredits: p.boostCredits, priceAed: p.priceAed, termMonths: p.termMonths, isActive: p.isActive })}>{t("system.edit")}</Button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{t("system.packages.grandfatherNote")}</p>

      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? t("system.packages.edit") : t("system.packages.new")}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="p-tier">{t("system.packages.tier")}</Label><Input id="p-tier" value={edit.tier} onChange={(e) => setEdit({ ...edit, tier: e.target.value })} disabled={Boolean(edit.id)} /></div>
              <div><Label htmlFor="p-name">{t("system.packages.name")}</Label><Input id="p-name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><Label htmlFor="p-price">{t("system.packages.price")}</Label><Input id="p-price" type="number" value={edit.priceAed} onChange={(e) => setEdit({ ...edit, priceAed: Number(e.target.value) })} /></div>
              <div><Label htmlFor="p-quota">{t("system.packages.quota")}</Label><Input id="p-quota" type="number" value={edit.listingQuota} onChange={(e) => setEdit({ ...edit, listingQuota: Number(e.target.value) })} /></div>
              <div><Label htmlFor="p-boost">{t("system.packages.boostCredits")}</Label><Input id="p-boost" type="number" value={edit.boostCredits} onChange={(e) => setEdit({ ...edit, boostCredits: Number(e.target.value) })} /></div>
              <div><Label htmlFor="p-term">{t("system.packages.termMonths")}</Label><Input id="p-term" type="number" value={edit.termMonths} onChange={(e) => setEdit({ ...edit, termMonths: Number(e.target.value) })} /></div>
              <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.isActive} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} />{t("system.packages.active")}</label>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>{t("system.cancel")}</Button><Button onClick={() => void save()}>{t("system.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsTab({ token, t }: { token?: string; t: TF }) {
  const [rows, setRows] = React.useState<SettingRow[]>([]);
  const [edit, setEdit] = React.useState<{ key: string; category: string; json: string } | null>(null);
  const load = React.useCallback(async () => { if (token) setRows(await getSettings(token).catch(() => [])); }, [token]);
  React.useEffect(() => { void load(); }, [load]);
  const save = async () => {
    if (!token || !edit) return;
    let value: Record<string, unknown>;
    try { value = JSON.parse(edit.json); } catch { toast({ title: t("system.settings.badJson"), variant: "warning" }); return; }
    try { await upsertSetting(edit.key, value, edit.category || "general", token); toast({ title: t("system.settings.saved"), variant: "success" }); setEdit(null); await load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : t("system.error"), variant: "warning" }); }
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => setEdit({ key: "", category: "general", json: "{\n  \n}" })}>{t("system.settings.new")}</Button></div>
      <div className="overflow-hidden rounded-panel border border-line">
        <table className="w-full text-sm">
          <thead className="bg-page text-xs uppercase text-muted"><tr><th className="p-3 text-start">{t("system.settings.key")}</th><th className="p-3 text-start">{t("system.settings.category")}</th><th className="p-3 text-start">{t("system.settings.value")}</th><th className="p-3 text-end"></th></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.key} className="border-t border-line">
              <td className="p-3 font-mono text-xs text-ink">{s.key}</td>
              <td className="p-3"><Badge variant="neutral">{s.category}</Badge></td>
              <td className="p-3 font-mono text-xs text-muted">{JSON.stringify(s.value).slice(0, 60)}</td>
              <td className="p-3 text-end"><Button size="sm" variant="outline" onClick={() => setEdit({ key: s.key, category: s.category, json: JSON.stringify(s.value, null, 2) })}>{t("system.edit")}</Button></td>
            </tr>
          ))}{rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">{t("system.settings.empty")}</td></tr>}</tbody>
        </table>
      </div>
      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("system.settings.edit")}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label htmlFor="set-key">{t("system.settings.key")}</Label><Input id="set-key" value={edit.key} onChange={(e) => setEdit({ ...edit, key: e.target.value })} /></div>
              <div><Label htmlFor="set-cat">{t("system.settings.category")}</Label><Input id="set-cat" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></div>
              <div><Label htmlFor="set-json">{t("system.settings.valueJson")}</Label><Textarea id="set-json" rows={8} className="font-mono text-xs" value={edit.json} onChange={(e) => setEdit({ ...edit, json: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>{t("system.cancel")}</Button><Button onClick={() => void save()}>{t("system.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TranslationsTab({ token, t }: { token?: string; t: TF }) {
  const [namespaces, setNamespaces] = React.useState<string[]>([]);
  const [ns, setNs] = React.useState("");
  const [rows, setRows] = React.useState<TranslationRow[]>([]);
  const [edit, setEdit] = React.useState<TranslationRow | null>(null);
  React.useEffect(() => { if (token) void getTranslationNamespaces(token).then((n) => { setNamespaces(n); if (n[0]) setNs(n[0]); }).catch(() => undefined); }, [token]);
  const load = React.useCallback(async () => { if (token && ns) setRows(await getTranslations(ns, token).catch(() => [])); }, [token, ns]);
  React.useEffect(() => { void load(); }, [load]);
  const save = async () => {
    if (!token || !edit) return;
    try { await upsertTranslation(edit, token); toast({ title: t("system.translations.saved"), variant: "success" }); setEdit(null); await load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : t("system.error"), variant: "warning" }); }
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label htmlFor="ns">{t("system.translations.namespace")}</Label>
        <select id="ns" className="h-9 rounded-card border border-line bg-page px-2 text-sm" value={ns} onChange={(e) => setNs(e.target.value)}>
          {namespaces.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-panel border border-line">
        <table className="w-full text-sm">
          <thead className="bg-page text-xs uppercase text-muted"><tr><th className="p-3 text-start">{t("system.translations.key")}</th>{LOCALES.map((l) => <th key={l} className="p-3 text-start">{l.toUpperCase()}</th>)}<th className="p-3 text-end"></th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.key} className="border-t border-line">
              <td className="p-3 font-mono text-xs text-ink">{r.key}</td>
              {LOCALES.map((l) => <td key={l} className="max-w-[160px] truncate p-3 text-xs text-muted">{r.values[l] ?? "—"}</td>)}
              <td className="p-3 text-end"><Button size="sm" variant="outline" onClick={() => setEdit({ ...r, values: { ...r.values } })}>{t("system.edit")}</Button></td>
            </tr>
          ))}{rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">{t("system.translations.empty")}</td></tr>}</tbody>
        </table>
      </div>
      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.namespace}:{edit?.key}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              {LOCALES.map((l) => (
                <div key={l}><Label htmlFor={`tr-${l}`}>{l.toUpperCase()}</Label>
                  <Input id={`tr-${l}`} dir={l === "ar" ? "rtl" : "ltr"} value={edit.values[l] ?? ""} onChange={(e) => setEdit({ ...edit, values: { ...edit.values, [l]: e.target.value } })} />
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>{t("system.cancel")}</Button><Button onClick={() => void save()}>{t("system.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaxonomyTab({ token, t }: { token?: string; t: TF }) {
  const [tax, setTax] = React.useState<AdminTaxonomy | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const load = React.useCallback(async () => { if (token) setTax(await getAdminTaxonomy(token).catch(() => null)); }, [token]);
  React.useEffect(() => { void load(); }, [load]);
  const toggleMake = async (m: AdminTaxonomy["makes"][number]) => {
    if (!token) return;
    try { await upsertMake({ id: m.id, slug: m.slug, name: m.name, vehicleTypes: m.vehicleTypes, isActive: !m.isActive, sortOrder: m.sortOrder }, token); await load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : t("system.error"), variant: "warning" }); }
  };
  const reindex = async (m: AdminTaxonomy["makes"][number]) => {
    if (!token) return;
    setBusy(m.id);
    try { const r = await reindexMake(m.id, token); toast({ title: t("system.taxonomy.reindexed", { n: r.reindexed }), variant: "success" }); }
    catch (e) { toast({ title: e instanceof Error ? e.message : t("system.error"), variant: "warning" }); }
    finally { setBusy(null); }
  };
  if (!tax) return <p className="p-6 text-muted">{t("system.loading")}</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("system.taxonomy.intro")}</p>
      <div className="overflow-hidden rounded-panel border border-line">
        <table className="w-full text-sm">
          <thead className="bg-page text-xs uppercase text-muted"><tr>
            <th className="p-3 text-start">{t("system.taxonomy.make")}</th><th className="p-3 text-start">{t("system.taxonomy.models")}</th>
            <th className="p-3 text-start">{t("system.taxonomy.listings")}</th><th className="p-3 text-start">{t("system.taxonomy.active")}</th><th className="p-3 text-end"></th>
          </tr></thead>
          <tbody>{tax.makes.slice(0, 100).map((m) => (
            <tr key={m.id} className="border-t border-line">
              <td className="p-3"><span className="font-medium text-ink">{m.name}</span> <span className="text-xs text-muted">{m.slug}</span></td>
              <td className="p-3">{m._count.models}</td>
              <td className="p-3">{m._count.listings}</td>
              <td className="p-3"><Badge variant={m.isActive ? "green" : "neutral"}>{m.isActive ? t("system.on") : t("system.off")}</Badge></td>
              <td className="p-3 text-end">
                <span className="flex justify-end gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => void toggleMake(m)}>{m.isActive ? t("system.off") : t("system.on")}</Button>
                  <Button size="sm" variant="ghost" disabled={busy === m.id} onClick={() => void reindex(m)}>{t("system.taxonomy.reindex")}</Button>
                </span>
              </td>
            </tr>
          ))}</tbody>
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
