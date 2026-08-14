/**
 * /admin/vs-pairs — curation for the "X vs Y" SEO pages (P6-03, FR-CV7).
 * Curated pairs are indexable + sitemapped; AUTO rows come from the nightly
 * popularity cron and can be promoted here. Intro copy is per-locale CMS text.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  adminCreateVsPair,
  adminDeleteVsPair,
  adminListVsPairs,
  adminUpdateVsPair,
  type VsPairRow,
} from "@/components/admin/api";
import {
  getMakes,
  getModels,
  type TaxonomyMake,
  type TaxonomyModel,
} from "@/lib/marketplace-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

const LOCALES = ["en", "ar", "es", "fr"] as const;

function ModelPicker({
  label,
  makes,
  value,
  onChange,
  token: _token,
}: {
  label: string;
  makes: TaxonomyMake[];
  value: string;
  onChange: (modelId: string) => void;
  token?: string;
}) {
  const [makeId, setMakeId] = React.useState("");
  const [models, setModels] = React.useState<TaxonomyModel[]>([]);
  React.useEffect(() => {
    if (!makeId) { setModels([]); return; }
    getModels(makeId).then(setModels).catch(() => setModels([]));
  }, [makeId]);
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <select
          className="h-9 rounded-md border border-line bg-white px-2 text-sm"
          value={makeId}
          onChange={(e) => { setMakeId(e.target.value); onChange(""); }}
        >
          <option value="">—</option>
          {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select
          className="h-9 rounded-md border border-line bg-white px-2 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!makeId}
        >
          <option value="">—</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function AdminVsPairsPage({ makes }: { makes: TaxonomyMake[] }) {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [rows, setRows] = React.useState<VsPairRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [modelA, setModelA] = React.useState("");
  const [modelB, setModelB] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [introFor, setIntroFor] = React.useState<VsPairRow | null>(null);
  const [intro, setIntro] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminListVsPairs(token);
      setRows(data.items);
    } catch {
      toast({ title: t("vsPairs.toast.loadFailed", { defaultValue: "Could not load pairs" }), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  React.useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!token || !modelA || !modelB) return;
    setBusy(true);
    try {
      await adminCreateVsPair({ modelAId: modelA, modelBId: modelB }, token);
      toast({ title: t("vsPairs.toast.created", { defaultValue: "Pair curated" }) });
      setOpen(false); setModelA(""); setModelB("");
      void load();
    } catch {
      toast({ title: t("vsPairs.toast.createFailed", { defaultValue: "Could not create the pair" }), variant: "warning" });
    } finally { setBusy(false); }
  };

  const toggleIndexable = async (row: VsPairRow) => {
    if (!token) return;
    try {
      await adminUpdateVsPair(row.id, { indexable: !row.indexable, source: "CURATED" }, token);
      void load();
    } catch {
      toast({ title: t("vsPairs.toast.updateFailed", { defaultValue: "Update failed" }), variant: "warning" });
    }
  };

  const saveIntro = async () => {
    if (!token || !introFor) return;
    setBusy(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(intro).filter(([, v]) => v.trim()));
      await adminUpdateVsPair(introFor.id, { intro: cleaned }, token);
      toast({ title: t("vsPairs.toast.introSaved", { defaultValue: "Intro copy saved" }) });
      setIntroFor(null);
      void load();
    } catch {
      toast({ title: t("vsPairs.toast.updateFailed", { defaultValue: "Update failed" }), variant: "warning" });
    } finally { setBusy(false); }
  };

  const remove = async (row: VsPairRow) => {
    if (!token) return;
    try {
      await adminDeleteVsPair(row.id, token);
      toast({ title: t("vsPairs.toast.deleted", { defaultValue: "Pair deleted" }) });
      void load();
    } catch {
      toast({ title: t("vsPairs.toast.updateFailed", { defaultValue: "Update failed" }), variant: "warning" });
    }
  };

  return (
    <AdminLayout title={t("vsPairs.title", { defaultValue: "VS pages" })}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {t("vsPairs.hint", { defaultValue: "Curated pairs are indexable and shipped in the sitemap. AUTO rows come from compare usage and stay noindex until promoted." })}
        </p>
        <Button onClick={() => setOpen(true)}>{t("vsPairs.new", { defaultValue: "Curate a pair" })}</Button>
      </div>

      <div className="overflow-x-auto rounded-panel border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand text-start text-white">
              <th className="px-3 py-2 text-start">{t("vsPairs.col.pair", { defaultValue: "Pair" })}</th>
              <th className="px-3 py-2 text-start">{t("vsPairs.col.source", { defaultValue: "Source" })}</th>
              <th className="px-3 py-2 text-start">{t("vsPairs.col.indexable", { defaultValue: "Indexable" })}</th>
              <th className="px-3 py-2 text-start">{t("vsPairs.col.usage", { defaultValue: "Compares / views" })}</th>
              <th className="px-3 py-2 text-start">{t("vsPairs.col.actions", { defaultValue: "Actions" })}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted">…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted">{t("vsPairs.empty", { defaultValue: "No pairs yet — curate one, or wait for the popularity cron." })}</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line odd:bg-page/40">
                <td className="px-3 py-2">
                  <Link href={`/vs/${r.slug}`} target="_blank" className="font-medium text-brand hover:underline">{r.title}</Link>
                  <div className="text-xs text-muted">/vs/{r.slug}</div>
                </td>
                <td className="px-3 py-2"><Badge variant={r.source === "CURATED" ? "navy" : "neutral"}>{r.source}</Badge></td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => void toggleIndexable(r)} title={t("vsPairs.toggleIndex", { defaultValue: "Toggle indexability" })}>
                    <Badge variant={r.indexable ? "green" : "neutral"}>{r.indexable ? t("vsPairs.indexed", { defaultValue: "indexed" }) : "noindex"}</Badge>
                  </button>
                </td>
                <td className="px-3 py-2 tabular-nums">{r.compareCount} / {r.viewCount}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setIntroFor(r); setIntro((r.intro as Record<string, string>) ?? {}); }}>
                      {t("vsPairs.intro", { defaultValue: "Intro copy" })}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void remove(r)}>
                      {t("vsPairs.delete", { defaultValue: "Delete" })}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("vsPairs.new", { defaultValue: "Curate a pair" })}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <ModelPicker label={t("vsPairs.modelA", { defaultValue: "Model A" })} makes={makes} value={modelA} onChange={setModelA} />
            <ModelPicker label={t("vsPairs.modelB", { defaultValue: "Model B" })} makes={makes} value={modelB} onChange={setModelB} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("vsPairs.cancel", { defaultValue: "Cancel" })}</Button>
            <Button onClick={() => void create()} disabled={busy || !modelA || !modelB}>{t("vsPairs.create", { defaultValue: "Create" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Intro copy dialog */}
      <Dialog open={introFor != null} onOpenChange={(o) => !o && setIntroFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{introFor?.title}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {LOCALES.map((loc) => (
              <div key={loc} className="grid gap-1">
                <Label className="uppercase">{loc}</Label>
                <Textarea
                  rows={3}
                  dir={loc === "ar" ? "rtl" : "ltr"}
                  value={intro[loc] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIntro((p) => ({ ...p, [loc]: e.target.value }))}
                  placeholder={t("vsPairs.introPlaceholder", { defaultValue: "Optional — replaces the generated intro for this locale." })}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntroFor(null)}>{t("vsPairs.cancel", { defaultValue: "Cancel" })}</Button>
            <Button onClick={() => void saveIntro()} disabled={busy}>{t("vsPairs.save", { defaultValue: "Save" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  let makes: TaxonomyMake[] = [];
  try {
    makes = await getMakes();
  } catch { makes = []; }
  return { props: { makes, ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
