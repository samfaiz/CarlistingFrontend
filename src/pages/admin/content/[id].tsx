/**
 * /admin/content/[id] — article editor (P4-05). id="new" creates; otherwise edits.
 * Markdown is the editable source; the backend renders + stores the HTML snapshot.
 */
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  getCmsArticle,
  createCmsArticle,
  updateCmsArticle,
  setCmsArticleStatus,
  type UpsertArticleInput,
} from "@/components/admin/api";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../../next-i18next.config.js";

const LOCALES = ["en", "ar", "es", "fr"] as const;
type Loc = (typeof LOCALES)[number];
type Tr = { title: string; excerpt: string; markdown: string; seoTitle: string; seoDescription: string };
const emptyTr = (): Tr => ({ title: "", excerpt: "", markdown: "", seoTitle: "", seoDescription: "" });

export default function ArticleEditorPage() {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.accessToken;
  const idParam = String(router.query.id ?? "new");
  const isNew = idParam === "new";

  const [kind, setKind] = React.useState<"NEWS" | "HELP">(
    (router.query.kind as "NEWS" | "HELP") ?? "NEWS",
  );
  const [slug, setSlug] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [cover, setCover] = React.useState("");
  const [featured, setFeatured] = React.useState(false);
  const [status, setStatus] = React.useState("DRAFT");
  const [id, setId] = React.useState(isNew ? "" : idParam);
  const [tr, setTr] = React.useState<Record<Loc, Tr>>({
    en: emptyTr(), ar: emptyTr(), es: emptyTr(), fr: emptyTr(),
  });
  const [tab, setTab] = React.useState<Loc>("en");
  const [busy, setBusy] = React.useState(false);
  const [scheduleAt, setScheduleAt] = React.useState("");

  React.useEffect(() => {
    if (isNew || !token) return;
    void (async () => {
      try {
        const a = await getCmsArticle(idParam, token);
        setKind(a.kind);
        setSlug(a.slug);
        setCategory(a.category ?? "");
        setCover(a.coverImageUrl ?? "");
        setFeatured(a.featured);
        setStatus(a.status);
        setId(a.id);
        const next: Record<Loc, Tr> = { en: emptyTr(), ar: emptyTr(), es: emptyTr(), fr: emptyTr() };
        for (const x of a.translations) {
          const src =
            (x.bodyHtml && typeof (x as { markdown?: string }).markdown === "string"
              ? (x as { markdown?: string }).markdown
              : undefined) ?? "";
          next[x.locale as Loc] = {
            title: x.title ?? "",
            excerpt: (x as { excerpt?: string | null }).excerpt ?? "",
            markdown:
              ((x as { bodyJson?: { source?: string } }).bodyJson?.source as string) ?? src,
            seoTitle: (x as { seoTitle?: string | null }).seoTitle ?? "",
            seoDescription: (x as { seoDescription?: string | null }).seoDescription ?? "",
          };
        }
        setTr(next);
      } catch {
        toast({ title: t("content.toast.loadFailed"), variant: "warning" });
      }
    })();
  }, [isNew, idParam, token, t]);

  const setField = (loc: Loc, field: keyof Tr, value: string) =>
    setTr((prev) => ({ ...prev, [loc]: { ...prev[loc], [field]: value } }));

  const buildPayload = (): UpsertArticleInput => ({
    kind,
    slug: slug.trim(),
    category: category.trim() || undefined,
    coverImageUrl: cover.trim() || undefined,
    featured,
    translations: LOCALES.filter((l) => tr[l].title.trim() && tr[l].markdown.trim()).map((l) => ({
      locale: l,
      title: tr[l].title.trim(),
      excerpt: tr[l].excerpt.trim() || undefined,
      markdown: tr[l].markdown,
      seoTitle: tr[l].seoTitle.trim() || undefined,
      seoDescription: tr[l].seoDescription.trim() || undefined,
    })),
  });

  const save = async () => {
    if (!token) return;
    const payload = buildPayload();
    if (!payload.slug || !payload.translations.some((x) => x.locale === "en")) {
      toast({ title: t("content.needEnAndSlug"), variant: "warning" });
      return;
    }
    setBusy(true);
    try {
      if (id) {
        await updateCmsArticle(id, payload, token);
        toast({ title: t("content.toast.saved"), variant: "success" });
      } else {
        const created = await createCmsArticle(payload, token);
        setId(created.id);
        toast({ title: t("content.toast.created"), variant: "success" });
        void router.replace(`/admin/content/${created.id}`, undefined, { shallow: true });
      }
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : t("content.toast.failed"), variant: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (next: "PUBLISHED" | "DRAFT" | "ARCHIVED" | "SCHEDULED") => {
    if (!token || !id) return;
    setBusy(true);
    try {
      await setCmsArticleStatus(id, next, token, next === "SCHEDULED" ? new Date(scheduleAt).toISOString() : undefined);
      setStatus(next);
      toast({ title: t("content.toast.statusChanged"), variant: "success" });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : t("content.toast.failed"), variant: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout title={isNew ? t("content.newTitle") : t("content.editTitle")}>
      <div className="mb-4 flex items-center gap-3">
        <Badge variant={status === "PUBLISHED" ? "green" : status === "SCHEDULED" ? "navy" : "neutral"}>{status}</Badge>
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/content")}>{t("content.backToList")}</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Body / translations */}
        <div className="rounded-panel border border-line bg-card p-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Loc)}>
            <TabsList>
              {LOCALES.map((l) => (
                <TabsTrigger key={l} value={l}>
                  {l.toUpperCase()}
                  {tr[l].title.trim() && tr[l].markdown.trim() ? " ●" : ""}
                </TabsTrigger>
              ))}
            </TabsList>
            {LOCALES.map((l) => (
              <TabsContent key={l} value={l} className="space-y-4">
                <div>
                  <Label htmlFor={`title-${l}`}>{t("content.field.title")}</Label>
                  <Input id={`title-${l}`} value={tr[l].title} onChange={(e) => setField(l, "title", e.target.value)} dir={l === "ar" ? "rtl" : "ltr"} />
                </div>
                <div>
                  <Label htmlFor={`excerpt-${l}`}>{t("content.field.excerpt")}</Label>
                  <Textarea id={`excerpt-${l}`} rows={2} value={tr[l].excerpt} onChange={(e) => setField(l, "excerpt", e.target.value)} dir={l === "ar" ? "rtl" : "ltr"} />
                </div>
                <div>
                  <Label htmlFor={`body-${l}`}>{t("content.field.body")}</Label>
                  <Textarea id={`body-${l}`} rows={16} className="font-mono text-sm" value={tr[l].markdown} onChange={(e) => setField(l, "markdown", e.target.value)} dir={l === "ar" ? "rtl" : "ltr"} placeholder={t("content.markdownHint")} />
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted">{t("content.seo")}</summary>
                  <div className="mt-3 space-y-3">
                    <Input placeholder={t("content.field.seoTitle")} value={tr[l].seoTitle} onChange={(e) => setField(l, "seoTitle", e.target.value)} />
                    <Textarea rows={2} placeholder={t("content.field.seoDescription")} value={tr[l].seoDescription} onChange={(e) => setField(l, "seoDescription", e.target.value)} />
                  </div>
                </details>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Meta + publishing */}
        <aside className="space-y-4">
          <div className="rounded-panel border border-line bg-card p-5 space-y-4">
            <div>
              <Label htmlFor="kind">{t("content.field.kind")}</Label>
              <select id="kind" className="mt-1 h-10 w-full rounded-card border border-line bg-page px-3 text-sm" value={kind} onChange={(e) => setKind(e.target.value as "NEWS" | "HELP")}>
                <option value="NEWS">{t("content.kind.NEWS", { defaultValue: "News" })}</option>
                <option value="HELP">{t("content.kind.HELP", { defaultValue: "Help" })}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="slug">{t("content.field.slug")}</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
            </div>
            <div>
              <Label htmlFor="category">{t("content.field.category")}</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={kind === "NEWS" ? "reviews" : "selling"} />
            </div>
            <div>
              <Label htmlFor="cover">{t("content.field.cover")}</Label>
              <Input id="cover" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              {t("content.field.featured")}
            </label>
            <Button className="w-full" disabled={busy} onClick={() => void save()}>{t("content.save")}</Button>
          </div>

          {id && (
            <div className="rounded-panel border border-line bg-card p-5 space-y-3">
              <p className="text-sm font-semibold text-ink">{t("content.publishing")}</p>
              {status !== "PUBLISHED" ? (
                <Button className="w-full" variant="outline" disabled={busy} onClick={() => void changeStatus("PUBLISHED")}>{t("content.publish")}</Button>
              ) : (
                <Button className="w-full" variant="outline" disabled={busy} onClick={() => void changeStatus("DRAFT")}>{t("content.unpublish")}</Button>
              )}
              <div className="space-y-2">
                <Label htmlFor="sched">{t("content.scheduleFor")}</Label>
                <Input id="sched" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
                <Button className="w-full" variant="outline" size="sm" disabled={busy || !scheduleAt} onClick={() => void changeStatus("SCHEDULED")}>{t("content.schedule")}</Button>
              </div>
              <Button className="w-full" variant="ghost" size="sm" disabled={busy} onClick={() => void changeStatus("ARCHIVED")}>{t("content.archive")}</Button>
            </div>
          )}
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
