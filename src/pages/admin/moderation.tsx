/**
 * /admin/moderation — task P1-11 (FR-M1 minimal; the full tooling with diff
 * views, bulk actions and SLA aging arrives in P4-02).
 *
 * Two tabs: the pending queue (approve / reject-with-reason) and recent live
 * listings (feature / unfeature — FR-S3 pinning until boosts supersede it in
 * P3-08). Actions are optimistic with rollback on failure.
 */
import type { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { Car, ChevronDown, Loader2, Star } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  approveListing,
  bulkModerate,
  getModerationQueue,
  rejectListing,
  setListingFeatured,
  type ModerationQueueItem,
} from "@/components/admin/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { searchListings, type Card as ListingCardData } from "@/lib/marketplace-api";
import { formatMileage, formatPrice, formatRelativeTime, mediaUrl } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

const MIN_REASON = 5;

function titleOf(item: { year: number; make: { name: string }; model: { name: string }; trim?: { name: string } | null }) {
  return [item.year, item.make.name, item.model.name, item.trim?.name].filter(Boolean).join(" ");
}

const SLA_HOURS = 24;

function ageHours(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 3600_000;
}

/** Field-by-field diff of the pre-edit LIVE snapshot vs the row (P4-02). */
function snapshotDiff(item: ModerationQueueItem) {
  const snap = item.lastLiveSnapshot;
  if (!snap) return [];
  const current: Record<string, unknown> = {
    priceAed: item.priceAed,
    mileageKm: item.mileageKm,
    year: item.year,
    isNegotiable: item.isNegotiable,
    exteriorColor: item.exteriorColor,
    interiorColor: item.interiorColor,
    vin: item.vin,
    description: item.descriptions?.[0]?.text ?? null,
  };
  return Object.entries(current)
    .filter(([key]) => key in snap)
    .filter(([key, value]) => String(snap[key] ?? "") !== String(value ?? ""))
    .map(([key, value]) => ({ key, before: snap[key], after: value }));
}

function QueueRow({
  item,
  locale,
  onApprove,
  onReject,
  busy,
  selected,
  onSelect,
}: {
  item: ModerationQueueItem;
  locale: string;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const { t } = useTranslation("admin");
  const [open, setOpen] = React.useState(false);
  const cover = item.media[0];
  const title = titleOf(item);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          type="checkbox"
          className="size-4 shrink-0 accent-brand"
          checked={selected}
          onChange={(event) => onSelect(event.target.checked)}
          aria-label={t("moderation.bulk.select", { title })}
        />
        <span className="relative h-20 w-28 shrink-0 overflow-hidden rounded-card bg-brand-surface">
          {cover?.variants?.card ? (
            <Image src={mediaUrl(cover.variants.card)} alt={title} fill sizes="112px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-brand-border">
              <Car className="size-6" aria-hidden />
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-ink">{title}</p>
          <p className="text-sm text-muted">
            {formatPrice(item.priceAed, locale)} · {formatMileage(item.mileageKm, locale)} ·{" "}
            {item.media.length} {t("moderation.columns.photos").toLowerCase()}
          </p>
          <p className="text-xs text-muted">
            {item.user?.email ?? item.sellerType} · {formatRelativeTime(item.updatedAt, locale)}
          </p>
          <span className="mt-1 flex flex-wrap gap-1">
            {ageHours(item.updatedAt) > SLA_HOURS && (
              <Badge variant="red">{t("moderation.slaBreach")}</Badge>
            )}
            {item.lastLiveSnapshot && (
              <Badge variant="navy">{t("moderation.editedLive")}</Badge>
            )}
            {(item.moderationFlags ?? []).map((flag) => (
              <Badge key={flag.rule} variant="amber" title={flag.detail}>
                {t(`moderation.flags.${flag.rule}`, { defaultValue: flag.rule })}
              </Badge>
            ))}
          </span>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            <ChevronDown className={open ? "rotate-180 transition-transform" : "transition-transform"} aria-hidden />
            {open ? t("moderation.collapse") : t("moderation.expand")}
          </Button>
          <Button size="sm" variant="outline" onClick={onReject} disabled={busy}>
            {t("moderation.actions.reject")}
          </Button>
          <Button size="sm" onClick={onApprove} loading={busy}>
            {t("moderation.actions.approve")}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-divider bg-page p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{t("moderation.detail.photos")}</p>
          {item.media.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {item.media.map((media) => (
                <span key={media.id} className="relative h-24 w-32 overflow-hidden rounded-card bg-brand-surface">
                  {media.variants?.card ? (
                    <Image src={mediaUrl(media.variants.card)} alt="" fill sizes="128px" className="object-cover" />
                  ) : null}
                </span>
              ))}
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted">{t("moderation.detail.noPhotos")}</p>
          )}

          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{t("moderation.detail.facts")}</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            {[
              [t("moderation.detail.price"), formatPrice(item.priceAed, locale)],
              [t("moderation.detail.mileage"), formatMileage(item.mileageKm, locale)],
              [t("moderation.detail.regionalSpec"), item.regionalSpec],
              [t("moderation.detail.fuel"), item.fuelType],
              [t("moderation.detail.transmission"), item.transmission],
              [t("moderation.detail.exteriorColor"), item.exteriorColor ?? "—"],
              [t("moderation.detail.vin"), item.vin ?? "—"],
              [t("moderation.detail.sellerType"), item.sellerType],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {snapshotDiff(item).length > 0 && (
            <>
              <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-muted">
                {t("moderation.detail.diff")}
              </p>
              <dl className="space-y-1 text-sm">
                {snapshotDiff(item).map((row) => (
                  <div key={row.key} className="flex flex-wrap gap-2">
                    <dt className="text-xs text-muted">{row.key}</dt>
                    <dd>
                      <del className="text-danger">{String(row.before ?? "—")}</del>{" "}
                      <ins className="text-success no-underline">{String(row.after ?? "—")}</ins>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {item.specsSnapshot ? (
            <>
              <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-muted">{t("moderation.detail.specs")}</p>
              <p className="text-sm text-ink">
                {item.specsSnapshot.groups
                  .flatMap((g) => g.fields.slice(0, 2).map((f) => `${f.name}: ${f.value}`))
                  .slice(0, 6)
                  .join(" · ")}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

export default function ModerationPage() {
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";
  const { t } = useTranslation("admin");
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [queue, setQueue] = React.useState<ModerationQueueItem[] | null>(null);
  const [queueTotal, setQueueTotal] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [live, setLive] = React.useState<ListingCardData[] | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState<ModerationQueueItem | null>(null);
  const [reason, setReason] = React.useState("");

  const loadQueue = React.useCallback(async () => {
    if (!token) return;
    const page = await getModerationQueue(token, { limit: 50 }).catch(() => null);
    setQueue(page?.items ?? []);
    setQueueTotal(page?.total ?? 0);
    setSelected(new Set());
  }, [token]);

  const runBulk = async (action: "approve" | "reject", reasonText?: string) => {
    if (!token || selected.size === 0) return;
    setBulkBusy(true);
    try {
      const result = await bulkModerate(action, [...selected], reasonText, token);
      toast({
        title: t("moderation.bulk.done", {
          done: result.done.length,
          failed: result.failed.length,
        }),
        variant: result.failed.length ? "warning" : "success",
      });
      await loadQueue();
    } catch {
      toast({ title: t("moderation.toasts.actionFailed"), variant: "error" });
    } finally {
      setBulkBusy(false);
    }
  };

  React.useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  React.useEffect(() => {
    void searchListings({ limit: 20 })
      .then((res) => setLive(res.items))
      .catch(() => setLive([]));
  }, []);

  const handleApprove = async (item: ModerationQueueItem) => {
    if (!token) return;
    setBusyId(item.id);
    try {
      await approveListing(item.id, token);
      setQueue((rows) => rows?.filter((row) => row.id !== item.id) ?? rows);
      toast({ title: t("moderation.toasts.approved"), variant: "success" });
    } catch (error) {
      toast({
        title: t("moderation.toasts.actionFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!token || !rejecting || reason.trim().length < MIN_REASON) return;
    const target = rejecting;
    setBusyId(target.id);
    try {
      await rejectListing(target.id, reason.trim(), token);
      setQueue((rows) => rows?.filter((row) => row.id !== target.id) ?? rows);
      toast({ title: t("moderation.toasts.rejected"), variant: "success" });
      setRejecting(null);
      setReason("");
    } catch (error) {
      toast({
        title: t("moderation.toasts.actionFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleFeature = async (listing: ListingCardData, featured: boolean) => {
    if (!token) return;
    setBusyId(listing.id);
    const previous = live;
    setLive(
      (rows) =>
        rows?.map((row) =>
          row.id === listing.id
            ? { ...row, badges: featured ? [...row.badges, "featured"] : row.badges.filter((b) => b !== "featured") }
            : row,
        ) ?? rows,
    );
    try {
      await setListingFeatured(listing.id, featured, token);
      toast({ title: featured ? t("moderation.toasts.featured") : t("moderation.toasts.unfeatured"), variant: "success" });
    } catch (error) {
      setLive(previous ?? null);
      toast({
        title: t("moderation.toasts.actionFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout title={t("moderation.title")}>
      <h1 className="text-xl font-extrabold text-ink">{t("moderation.title")}</h1>
      <p className="mb-5 mt-1 text-sm text-muted">{t("moderation.subtitle")}</p>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">{t("moderation.tabs.queue")}</TabsTrigger>
          <TabsTrigger value="live">{t("moderation.tabs.live")}</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          {queue === null ? (
            <div className="flex justify-center py-10 text-muted">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </div>
          ) : queue.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted" data-testid="queue-empty">
              {t("moderation.queueEmpty")}
            </Card>
          ) : (
            <div className="flex flex-col gap-3" data-testid="queue-rows">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>{t("moderation.bulk.count", { total: queueTotal })}</span>
                {selected.size > 0 && (
                  <>
                    <span className="font-semibold text-ink">
                      {t("moderation.bulk.selected", { count: selected.size })}
                    </span>
                    <Button
                      size="sm"
                      disabled={bulkBusy}
                      onClick={() => void runBulk("approve")}
                    >
                      {t("moderation.bulk.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkBusy}
                      onClick={() => void runBulk("reject", t("moderation.bulk.defaultReason"))}
                    >
                      {t("moderation.bulk.reject")}
                    </Button>
                  </>
                )}
              </div>
              {queue.map((item) => (
                <QueueRow
                  key={item.id}
                  item={item}
                  locale={locale}
                  busy={busyId === item.id}
                  selected={selected.has(item.id)}
                  onSelect={(checked) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(item.id);
                      else next.delete(item.id);
                      return next;
                    })
                  }
                  onApprove={() => void handleApprove(item)}
                  onReject={() => {
                    setRejecting(item);
                    setReason("");
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="live">
          {live === null ? (
            <div className="flex justify-center py-10 text-muted">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </div>
          ) : live.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted">{t("moderation.liveEmpty")}</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {live.map((listing) => {
                const featured = listing.badges.includes("featured");
                return (
                  <Card key={listing.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/cars/${listing.slug}`} className="truncate font-semibold text-ink hover:text-brand">
                        {titleOf(listing)}
                      </Link>
                      <p className="text-xs text-muted">
                        {formatPrice(listing.priceAed, locale)} · {listing.emirate.name}
                      </p>
                    </div>
                    {featured ? <Badge variant="solid">{t("moderation.featuredBadge")}</Badge> : null}
                    <Button
                      size="sm"
                      variant={featured ? "outline" : "secondary"}
                      loading={busyId === listing.id}
                      onClick={() => void handleFeature(listing, !featured)}
                    >
                      <Star className="size-4" aria-hidden />
                      {featured ? t("moderation.actions.unfeature") : t("moderation.actions.feature")}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("moderation.rejectDialog.title")}</DialogTitle>
            <DialogDescription>{t("moderation.rejectDialog.description")}</DialogDescription>
          </DialogHeader>
          <Label htmlFor="reject-reason" required>
            {t("moderation.rejectDialog.reasonLabel")}
          </Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("moderation.rejectDialog.placeholder")}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              {t("moderation.rejectDialog.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={reason.trim().length < MIN_REASON}
              onClick={() => void handleReject()}
            >
              {t("moderation.rejectDialog.confirm")}
            </Button>
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
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "admin", "listings"], nextI18NextConfig)),
    },
  };
};
