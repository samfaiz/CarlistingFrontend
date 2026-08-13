/**
 * /admin/banners — banners & featured-slot manager (P4-06, FR-AD7).
 */
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  getBanners,
  createBanner,
  updateBanner,
  setBannerActive,
  deleteBanner,
  type BannerRow,
  type BannerInput,
} from "@/components/admin/api";
import { getTaxonomyMeta, type TaxonomyTerm } from "@/lib/marketplace-api";
import { DataTable, FilterBar, type Column } from "@/components/workspace/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import nextI18NextConfig from "../../../next-i18next.config.js";

const SLOTS = ["HOME_HERO", "HOME_STRIP", "SEARCH_TOP", "DETAIL_SIDEBAR"] as const;
type Slot = (typeof SLOTS)[number];
const empty: BannerInput = { name: "", slot: "HOME_HERO", imageUrl: "", targetUrl: "", priority: 0, active: true };

export default function AdminBannersPage({ emirates }: { emirates: TaxonomyTerm[] }) {
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [slotFilter, setSlotFilter] = React.useState<Slot | "ALL">("ALL");
  const [rows, setRows] = React.useState<BannerRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<BannerInput>(empty);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getBanners(token, slotFilter === "ALL" ? {} : { slot: slotFilter });
      setRows(data);
    } catch {
      toast({ title: t("banners.toast.loadFailed"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [token, slotFilter, t]);

  React.useEffect(() => { void load(); }, [load]);

  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (b: BannerRow) => {
    setEditId(b.id);
    setForm({
      name: b.name, slot: b.slot, imageUrl: b.imageUrl, targetUrl: b.targetUrl,
      locale: b.locale, emirateId: b.emirateId, priority: b.priority, active: b.active,
      startsAt: b.startsAt ? b.startsAt.slice(0, 16) : null,
      endsAt: b.endsAt ? b.endsAt.slice(0, 16) : null,
    });
    setOpen(true);
  };

  const set = <K extends keyof BannerInput>(k: K, v: BannerInput[K]) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!token) return;
    if (!form.name.trim() || !form.imageUrl.trim() || !form.targetUrl.trim()) {
      toast({ title: t("banners.needFields"), variant: "warning" });
      return;
    }
    setBusy(true);
    const payload: BannerInput = {
      ...form,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      locale: form.locale || null,
      emirateId: form.emirateId || null,
    };
    try {
      if (editId) await updateBanner(editId, payload, token);
      else await createBanner(payload, token);
      toast({ title: t("banners.toast.saved"), variant: "success" });
      setOpen(false);
      await load();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : t("banners.toast.failed"), variant: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (b: BannerRow) => {
    if (!token) return;
    try {
      await setBannerActive(b.id, !b.active, token);
      await load();
    } catch {
      toast({ title: t("banners.toast.failed"), variant: "warning" });
    }
  };

  const remove = async (b: BannerRow) => {
    if (!token || !window.confirm(t("banners.confirmDelete", { name: b.name }))) return;
    try {
      await deleteBanner(b.id, token);
      toast({ title: t("banners.toast.deleted"), variant: "success" });
      await load();
    } catch {
      toast({ title: t("banners.toast.failed"), variant: "warning" });
    }
  };

  const columns: Column<BannerRow>[] = [
    {
      key: "name",
      header: t("banners.columns.name"),
      isRowHeader: true,
      render: (b) => (
        <button className="text-start font-medium text-ink hover:underline" onClick={() => openEdit(b)}>{b.name}</button>
      ),
    },
    { key: "slot", header: t("banners.columns.slot"), render: (b) => <Badge variant="navy">{b.slot}</Badge> },
    { key: "target", header: t("banners.columns.targeting"), render: (b) => (
      <span className="text-xs text-muted">{(b.locale ?? t("banners.anyLocale")) + " · " + (b.emirate?.name ?? t("banners.anyEmirate"))}</span>
    ) },
    { key: "stats", header: t("banners.columns.stats"), render: (b) => <span className="text-xs text-muted">{b.impressions}👁 · {b.clicks}🖱</span> },
    { key: "priority", header: t("banners.columns.priority"), render: (b) => b.priority },
    { key: "active", header: t("banners.columns.active"), render: (b) => <Badge variant={b.active ? "green" : "neutral"}>{b.active ? t("banners.on") : t("banners.off")}</Badge> },
    {
      key: "actions", header: t("banners.columns.actions"), align: "end",
      render: (b) => (
        <span className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" onClick={() => void toggle(b)}>{b.active ? t("banners.deactivate") : t("banners.activate")}</Button>
          <Button size="sm" variant="ghost" onClick={() => void remove(b)}>{t("banners.delete")}</Button>
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title={t("banners.title")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <FilterBar
          options={[{ value: "ALL", label: t("banners.allSlots") }, ...SLOTS.map((s) => ({ value: s, label: s }))]}
          active={slotFilter}
          onSelect={(v) => setSlotFilter(v as Slot | "ALL")}
        />
        <Button onClick={openNew}>{t("banners.new")}</Button>
      </div>
      <DataTable
        caption={t("banners.title")}
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        loading={loading}
        empty={{ title: t("banners.empty") }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? t("banners.editTitle") : t("banners.newTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="b-name">{t("banners.field.name")}</Label>
              <Input id="b-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="b-slot">{t("banners.field.slot")}</Label>
                <select id="b-slot" className="mt-1 h-10 w-full rounded-card border border-line bg-page px-3 text-sm" value={form.slot} onChange={(e) => set("slot", e.target.value as Slot)}>
                  {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="b-priority">{t("banners.field.priority")}</Label>
                <Input id="b-priority" type="number" min={0} value={form.priority ?? 0} onChange={(e) => set("priority", Number(e.target.value))} />
              </div>
            </div>
            <div>
              <Label htmlFor="b-image">{t("banners.field.image")}</Label>
              <Input id="b-image" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label htmlFor="b-target">{t("banners.field.target")}</Label>
              <Input id="b-target" value={form.targetUrl} onChange={(e) => set("targetUrl", e.target.value)} placeholder="https://…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="b-locale">{t("banners.field.locale")}</Label>
                <select id="b-locale" className="mt-1 h-10 w-full rounded-card border border-line bg-page px-3 text-sm" value={form.locale ?? ""} onChange={(e) => set("locale", e.target.value || null)}>
                  <option value="">{t("banners.anyLocale")}</option>
                  {["en", "ar", "es", "fr"].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="b-emirate">{t("banners.field.emirate")}</Label>
                <select id="b-emirate" className="mt-1 h-10 w-full rounded-card border border-line bg-page px-3 text-sm" value={form.emirateId ?? ""} onChange={(e) => set("emirateId", e.target.value || null)}>
                  <option value="">{t("banners.anyEmirate")}</option>
                  {emirates.map((em) => <option key={em.id} value={em.id}>{em.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="b-start">{t("banners.field.starts")}</Label>
                <Input id="b-start" type="datetime-local" value={form.startsAt ?? ""} onChange={(e) => set("startsAt", e.target.value || null)} />
              </div>
              <div>
                <Label htmlFor="b-end">{t("banners.field.ends")}</Label>
                <Input id="b-end" type="datetime-local" value={form.endsAt ?? ""} onChange={(e) => set("endsAt", e.target.value || null)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active ?? true} onChange={(e) => set("active", e.target.checked)} />
              {t("banners.field.active")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("banners.cancel")}</Button>
            <Button disabled={busy} onClick={() => void save()}>{t("banners.save")}</Button>
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
  let emirates: TaxonomyTerm[] = [];
  try {
    emirates = (await getTaxonomyMeta()).emirates;
  } catch {
    emirates = [];
  }
  return { props: { emirates, ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)) } };
};
