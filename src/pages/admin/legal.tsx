/**
 * /admin/legal — legal document editor (P4-05): terms, privacy, cookie-policy,
 * each in 4 locales. Bumping the version records that the effective terms changed.
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import { getLegalDocAdmin, upsertLegalDoc } from "@/components/admin/api";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

const KEYS = ["terms", "privacy", "cookie-policy"] as const;
const LOCALES = ["en", "ar", "es", "fr"] as const;
type Key = (typeof KEYS)[number];
type Loc = (typeof LOCALES)[number];
type Tr = { title: string; markdown: string };
const emptyTr = (): Tr => ({ title: "", markdown: "" });
const blank = (): Record<Loc, Tr> => ({ en: emptyTr(), ar: emptyTr(), es: emptyTr(), fr: emptyTr() });

export default function AdminLegalPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [docKey, setDocKey] = React.useState<Key>("terms");
  const [loc, setLoc] = React.useState<Loc>("en");
  const [version, setVersion] = React.useState(1);
  const [effectiveAt, setEffectiveAt] = React.useState("");
  const [bump, setBump] = React.useState(false);
  const [tr, setTr] = React.useState<Record<Loc, Tr>>(blank());
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token) return;
    try {
      const doc = await getLegalDocAdmin(docKey, token);
      setVersion(doc.version);
      setEffectiveAt(doc.effectiveAt ? doc.effectiveAt.slice(0, 10) : "");
      const next = blank();
      for (const x of doc.translations) {
        const src = (x as { bodyJson?: { source?: string } }).bodyJson?.source;
        next[x.locale as Loc] = {
          title: x.title ?? "",
          // Legal docs store only rendered HTML publicly; author fresh Markdown if empty.
          markdown: typeof src === "string" ? src : "",
        };
      }
      setTr(next);
    } catch {
      setTr(blank());
      setVersion(1);
    }
  }, [token, docKey]);

  React.useEffect(() => { void load(); }, [load]);

  const setField = (l: Loc, field: keyof Tr, value: string) =>
    setTr((prev) => ({ ...prev, [l]: { ...prev[l], [field]: value } }));

  const save = async () => {
    if (!token) return;
    const translations = LOCALES.filter((l) => tr[l].title.trim() && tr[l].markdown.trim()).map((l) => ({
      locale: l,
      title: tr[l].title.trim(),
      markdown: tr[l].markdown,
    }));
    if (!translations.some((x) => x.locale === "en")) {
      toast({ title: t("legal.needEn"), variant: "warning" });
      return;
    }
    setBusy(true);
    try {
      const doc = await upsertLegalDoc(docKey, { effectiveAt: effectiveAt || undefined, bumpVersion: bump, translations }, token);
      setVersion(doc.version);
      setBump(false);
      toast({ title: t("legal.toast.saved"), variant: "success" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : t("legal.toast.failed"), variant: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout title={t("legal.title")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Tabs value={docKey} onValueChange={(v) => setDocKey(v as Key)}>
          <TabsList>
            {KEYS.map((k) => (
              <TabsTrigger key={k} value={k}>{t(`legal.doc.${k}`, { defaultValue: k })}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Badge variant="navy">{t("legal.version", { n: version })}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="rounded-panel border border-line bg-card p-5">
          <Tabs value={loc} onValueChange={(v) => setLoc(v as Loc)}>
            <TabsList>
              {LOCALES.map((l) => (
                <TabsTrigger key={l} value={l}>{l.toUpperCase()}{tr[l].title.trim() && tr[l].markdown.trim() ? " ●" : ""}</TabsTrigger>
              ))}
            </TabsList>
            {LOCALES.map((l) => (
              <TabsContent key={l} value={l} className="space-y-4">
                <div>
                  <Label htmlFor={`ltitle-${l}`}>{t("legal.field.title")}</Label>
                  <Input id={`ltitle-${l}`} value={tr[l].title} onChange={(e) => setField(l, "title", e.target.value)} dir={l === "ar" ? "rtl" : "ltr"} />
                </div>
                <div>
                  <Label htmlFor={`lbody-${l}`}>{t("legal.field.body")}</Label>
                  <Textarea id={`lbody-${l}`} rows={20} className="font-mono text-sm" value={tr[l].markdown} onChange={(e) => setField(l, "markdown", e.target.value)} dir={l === "ar" ? "rtl" : "ltr"} placeholder={t("content.markdownHint")} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <aside className="rounded-panel border border-line bg-card p-5 space-y-4">
          <div>
            <Label htmlFor="eff">{t("legal.field.effective")}</Label>
            <Input id="eff" type="date" value={effectiveAt} onChange={(e) => setEffectiveAt(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} />
            {t("legal.bumpVersion")}
          </label>
          <Button className="w-full" disabled={busy} onClick={() => void save()}>{t("legal.save")}</Button>
          <p className="text-xs text-muted">{t("legal.hint")}</p>
        </aside>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return { props: { ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
