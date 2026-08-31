/**
 * Photo manager for an existing listing — add / reorder / set cover / delete.
 *
 * Until now the uploader lived ONLY inside the /sell wizard, driven by
 * in-memory state: reload the page, or take the wizard's own "Skip for now —
 * finish from My Account" exit, and the draft could never receive a photo
 * again. This screen is what that link was promising.
 *
 * Upload pipeline is the wizard's, deliberately: downscale to 2000px, presign,
 * PUT with progress, attach — one file at a time so a phone on 4G does not
 * open ten sockets. What differs is that the server, not local state, owns the
 * gallery: every mutation replaces the list with the endpoint's response, so
 * the UI can never claim an order or a cover the backend refused.
 *
 * Reordering uses explicit Move earlier / Move later buttons rather than
 * drag-and-drop. Native HTML5 drag is unusable with a keyboard and does not
 * fire on touch at all, and this screen's whole reason to exist is the seller
 * on a phone finishing a stranded draft.
 */
import {
  Car,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, SurfaceCard } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  ALLOWED_IMAGE_TYPES,
  downscaleImage,
  uploadWithProgress,
} from "@/components/sell/image-utils";
import { ApiError } from "@/lib/api";
import { mediaUrl } from "@/lib/format";
import {
  attachMedia,
  deleteListingMedia,
  getListingMedia,
  presignUpload,
  reorderListingMedia,
  setListingCover,
  submitListing,
  type ListingMediaRow,
} from "@/lib/marketplace-api";
import { cn } from "@/lib/utils";
import {
  MAX_LISTING_PHOTOS,
  MIN_LISTING_PHOTOS,
  hasPhotoFloor,
  isFrozen,
  isSubmittable,
  toMediaItems,
  type OwnedListing,
} from "./api";

type UploadStatus = "pending" | "processing" | "uploading" | "attaching" | "error";

interface UploadItem {
  id: string;
  fileName: string;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  file: File;
}

export function PhotoManager({
  listing,
  accessToken,
  onListingChanged,
}: {
  listing: OwnedListing;
  accessToken: string;
  onListingChanged: (patch: Partial<OwnedListing>) => void;
}) {
  const { t } = useTranslation("account");

  const [photos, setPhotos] = React.useState<ListingMediaRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [reordering, setReordering] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<ListingMediaRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const busyRef = React.useRef(false);
  const listingId = listing.id;
  const frozen = isFrozen(listing.status);

  /* ---------------------------------------------------------------- */
  /* Load                                                             */
  /* ---------------------------------------------------------------- */

  const refresh = React.useCallback(async () => {
    try {
      const items = toMediaItems(await getListingMedia(listingId, accessToken));
      setPhotos(items);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t("manage.photos.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [accessToken, listingId, t]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  /* ---------------------------------------------------------------- */
  /* Upload queue — one file in flight at a time                      */
  /* ---------------------------------------------------------------- */

  const patchUpload = React.useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const processUpload = React.useCallback(
    async (item: UploadItem) => {
      try {
        patchUpload(item.id, { status: "processing", progress: 0 });
        const { blob, contentType } = await downscaleImage(item.file);
        const presigned = await presignUpload(contentType, accessToken);
        if (blob.size > presigned.maxBytes) {
          throw new Error(t("manage.photos.errors.tooLarge"));
        }
        patchUpload(item.id, { status: "uploading" });
        await uploadWithProgress(presigned.uploadUrl, blob, contentType, (percent) =>
          patchUpload(item.id, { progress: percent }),
        );
        patchUpload(item.id, { status: "attaching" });
        await attachMedia(listingId, presigned.key, accessToken);
        URL.revokeObjectURL(item.previewUrl);
        setUploads((prev) => prev.filter((u) => u.id !== item.id));
        await refresh();
      } catch (err) {
        patchUpload(item.id, {
          status: "error",
          error:
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : t("manage.photos.errors.upload"),
        });
      }
    },
    [accessToken, listingId, patchUpload, refresh, t],
  );

  React.useEffect(() => {
    if (busyRef.current) return;
    const next = uploads.find((u) => u.status === "pending");
    if (!next) return;
    busyRef.current = true;
    void processUpload(next).finally(() => {
      busyRef.current = false;
      // Re-run the effect so the next queued file starts; processUpload's own
      // setState may already have been flushed by the time this resolves.
      setUploads((prev) => [...prev]);
    });
  }, [processUpload, uploads]);

  const capacity = MAX_LISTING_PHOTOS - photos.length - uploads.length;

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const allowed = list.filter((f) => (ALLOWED_IMAGE_TYPES as string[]).includes(f.type));
    if (allowed.length < list.length) {
      toast({ title: t("manage.photos.errors.type"), variant: "warning" });
    }
    if (allowed.length > capacity) {
      toast({ title: t("manage.photos.errors.max", { max: MAX_LISTING_PHOTOS }), variant: "warning" });
    }
    const accepted = allowed.slice(0, Math.max(0, capacity));
    if (accepted.length === 0) return;
    setUploads((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        status: "pending" as const,
        progress: 0,
        file,
      })),
    ]);
  };

  const dropUpload = (id: string) => {
    setUploads((prev) => {
      const target = prev.find((u) => u.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((u) => u.id !== id);
    });
  };

  /* ---------------------------------------------------------------- */
  /* Reorder / cover / delete                                         */
  /* ---------------------------------------------------------------- */

  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;
    const before = photos;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setPhotos(next);
    setReordering(true);
    setActionError(null);
    try {
      const items = toMediaItems(
        await reorderListingMedia(listingId, next.map((p) => p.id), accessToken),
      );
      setPhotos(items);
    } catch (err) {
      setPhotos(before);
      const message = err instanceof ApiError ? err.message : t("manage.photos.errors.reorder");
      setActionError(message);
      toast({ title: t("manage.photos.errors.reorder"), description: message, variant: "error" });
    } finally {
      setReordering(false);
    }
  };

  const makeCover = async (photo: ListingMediaRow) => {
    setBusyId(photo.id);
    setActionError(null);
    try {
      const items = toMediaItems(await setListingCover(listingId, photo.id, accessToken));
      setPhotos(items);
      toast({ title: t("manage.photos.coverSet"), variant: "success" });
    } catch (err) {
      // 409 while the virus scan is still running, 400 for an infected file —
      // both say precisely what is wrong, so say it.
      const message = err instanceof ApiError ? err.message : t("manage.photos.errors.cover");
      setActionError(message);
      toast({ title: t("manage.photos.errors.cover"), description: message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      const items = toMediaItems(
        await deleteListingMedia(listingId, pendingDelete.id, accessToken),
      );
      setPhotos(items);
      setPendingDelete(null);
      toast({ title: t("manage.photos.deleted"), variant: "success" });
    } catch (err) {
      // The photo floor lives here: "A published listing needs at least 3
      // photos (FR-M5) — add a replacement before removing this one".
      const message = err instanceof ApiError ? err.message : t("manage.photos.errors.delete");
      setActionError(message);
      toast({ title: t("manage.photos.errors.delete"), description: message, variant: "error" });
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const result = await submitListing(listingId, accessToken);
      onListingChanged({ status: result.status });
      toast({ title: t("manage.photos.submitDone"), variant: "success" });
    } catch (err) {
      // Duplicate photos, duplicate VIN and the 2-active-listings quota all
      // land here with their own wording.
      const message = err instanceof ApiError ? err.message : t("manage.photos.errors.submit");
      setActionError(message);
      toast({ title: t("manage.photos.errors.submit"), description: message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Derived                                                          */
  /* ---------------------------------------------------------------- */

  const servable = photos.filter((p) => p.scanStatus !== "INFECTED").length;
  const floorApplies = hasPhotoFloor(listing.status);
  const uploadsInFlight = uploads.some((u) => u.status !== "error");
  const canSubmit =
    isSubmittable(listing.status) && servable >= MIN_LISTING_PHOTOS && !uploadsInFlight;

  const scanBadge = (photo: ListingMediaRow) => {
    if (photo.scanStatus === "INFECTED") {
      return (
        <Badge variant="red" className="gap-1">
          <ShieldAlert className="size-3" aria-hidden />
          {t("manage.photos.scan.infected")}
        </Badge>
      );
    }
    if (photo.scanStatus !== "CLEAN") {
      return (
        <Badge variant="amber" className="gap-1">
          <ShieldCheck className="size-3" aria-hidden />
          {t("manage.photos.scan.pending")}
        </Badge>
      );
    }
    return null;
  };

  const uploadStatusLabel = (item: UploadItem): string => {
    switch (item.status) {
      case "pending":
        return t("manage.photos.upload.queued");
      case "processing":
        return t("manage.photos.upload.processing");
      case "uploading":
        return t("manage.photos.upload.uploading", { percent: item.progress });
      case "attaching":
        return t("manage.photos.upload.attaching");
      case "error":
        return item.error ?? t("manage.photos.errors.upload");
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <Panel className="flex items-center gap-2 p-6 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t("manage.photos.loading")}
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {frozen ? (
        <SurfaceCard className="p-4">
          <p className="text-sm font-bold text-ink">{t("manage.frozen.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("manage.photos.frozenBody")}</p>
        </SurfaceCard>
      ) : null}

      {loadError ? (
        <p role="alert" className="rounded-card border border-danger bg-danger-soft p-3 text-sm text-danger-strong">
          {loadError}
        </p>
      ) : null}

      {!frozen ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed p-6 text-center transition-colors",
            dragActive ? "border-brand bg-brand-surface" : "border-line bg-page",
          )}
        >
          <ImagePlus className="size-7 text-brand" aria-hidden />
          <p className="text-sm font-semibold text-ink">{t("manage.photos.dropHint")}</p>
          <p className="text-xs text-muted">
            {t("manage.photos.formats", { max: MAX_LISTING_PHOTOS })}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-1"
            disabled={capacity <= 0}
            onClick={() => inputRef.current?.click()}
          >
            <Upload aria-hidden />
            {t("manage.photos.browse")}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            multiple
            className="sr-only"
            aria-label={t("manage.photos.browse")}
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="rounded-card border border-danger bg-danger-soft p-3 text-sm text-danger-strong">
          {actionError}
        </p>
      ) : null}

      <p aria-live="polite" className="text-sm font-semibold text-muted-strong">
        {t("manage.photos.counter", { count: servable, max: MAX_LISTING_PHOTOS })}
        {floorApplies ? (
          <span className="ms-2 font-normal text-muted">
            {t("manage.photos.floor", { min: MIN_LISTING_PHOTOS })}
          </span>
        ) : null}
        {isSubmittable(listing.status) && servable < MIN_LISTING_PHOTOS ? (
          <span className="ms-2 font-normal text-muted">
            {t("manage.photos.needMore", {
              count: MIN_LISTING_PHOTOS - servable,
              min: MIN_LISTING_PHOTOS,
            })}
          </span>
        ) : null}
      </p>

      {photos.length === 0 && uploads.length === 0 ? (
        <Panel className="p-6 text-center text-sm text-muted">{t("manage.photos.empty")}</Panel>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => {
            const position = index + 1;
            const busy = busyId === photo.id || reordering;
            const thumb = photo.variants?.thumb ?? photo.variants?.card ?? null;
            return (
              <li
                key={photo.id}
                className="flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-soft"
              >
                <div className="relative aspect-[4/3] bg-brand-surface">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- MinIO/S3 origin, not a next/image loader source
                    <img
                      src={mediaUrl(thumb)}
                      alt={t("manage.photos.thumbAlt", { position })}
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Car className="size-8 text-brand-border" aria-hidden />
                    </span>
                  )}
                  <span className="absolute top-1.5 start-1.5 flex flex-col items-start gap-1">
                    {photo.isCover ? (
                      <Badge variant="solid" className="gap-1">
                        <Star className="size-3" aria-hidden />
                        {t("manage.photos.cover")}
                      </Badge>
                    ) : null}
                    {scanBadge(photo)}
                  </span>
                  <span className="absolute bottom-1.5 end-1.5 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-bold text-white">
                    {position}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 p-2">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 px-0"
                      disabled={frozen || busy || index === 0}
                      aria-label={t("manage.photos.moveEarlierLabel", { position })}
                      onClick={() => void move(index, -1)}
                    >
                      <ChevronLeft className="rtl:rotate-180" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 px-0"
                      disabled={frozen || busy || index === photos.length - 1}
                      aria-label={t("manage.photos.moveLaterLabel", { position })}
                      onClick={() => void move(index, 1)}
                    >
                      <ChevronRight className="rtl:rotate-180" aria-hidden />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 justify-start px-1 text-xs"
                    disabled={frozen || busy || photo.isCover || photo.scanStatus !== "CLEAN"}
                    aria-label={t("manage.photos.setCoverLabel", { position })}
                    aria-describedby={
                      photo.scanStatus !== "CLEAN" ? `scan-note-${photo.id}` : undefined
                    }
                    onClick={() => void makeCover(photo)}
                  >
                    <Star aria-hidden />
                    {photo.isCover ? t("manage.photos.isCover") : t("manage.photos.setCover")}
                  </Button>
                  {photo.scanStatus !== "CLEAN" ? (
                    <p id={`scan-note-${photo.id}`} className="px-1 text-xs text-muted">
                      {photo.scanStatus === "INFECTED"
                        ? t("manage.photos.scan.infectedHint")
                        : t("manage.photos.scan.pendingHint")}
                    </p>
                  ) : null}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 justify-start px-1 text-xs text-danger"
                    disabled={frozen || busy}
                    aria-label={t("manage.photos.deleteLabel", { position })}
                    onClick={() => setPendingDelete(photo)}
                  >
                    <Trash2 aria-hidden />
                    {t("manage.photos.delete")}
                  </Button>
                </div>
              </li>
            );
          })}

          {uploads.map((item) => (
            <li
              key={item.id}
              className="flex flex-col overflow-hidden rounded-card border border-dashed border-line bg-card"
            >
              <div className="relative aspect-[4/3] bg-brand-surface">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview */}
                <img
                  src={item.previewUrl}
                  alt={item.fileName}
                  className="absolute inset-0 size-full object-cover opacity-70"
                />
              </div>
              <div className="flex flex-col gap-1 p-2">
                <p
                  className={cn(
                    "truncate text-xs font-semibold",
                    item.status === "error" ? "text-danger" : "text-muted-strong",
                  )}
                >
                  {uploadStatusLabel(item)}
                </p>
                {item.status === "uploading" || item.status === "processing" || item.status === "attaching" ? (
                  <div className="h-1 overflow-hidden rounded-full bg-divider" aria-hidden>
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${item.status === "uploading" ? item.progress : 15}%` }}
                    />
                  </div>
                ) : null}
                {item.status === "error" ? (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 flex-1 px-1 text-xs"
                      onClick={() => patchUpload(item.id, { status: "pending", error: undefined })}
                    >
                      <RotateCcw aria-hidden />
                      {t("manage.photos.upload.retry")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 flex-1 px-1 text-xs text-danger"
                      onClick={() => dropUpload(item.id)}
                    >
                      <Trash2 aria-hidden />
                      {t("manage.photos.upload.discard")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isSubmittable(listing.status) ? (
        <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-ink">{t("manage.photos.submitTitle")}</p>
            <p className="mt-1 text-sm text-muted">
              {canSubmit
                ? t("manage.photos.submitReady")
                : t("manage.photos.submitBlocked", { min: MIN_LISTING_PHOTOS })}
            </p>
          </div>
          <Button type="button" loading={submitting} disabled={!canSubmit} onClick={() => void submit()}>
            {t("manage.photos.submitCta")}
          </Button>
        </Panel>
      ) : null}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !deleting && !open && setPendingDelete(null)}
      >
        <DialogContent aria-describedby="delete-photo-body">
          <DialogHeader>
            <DialogTitle>{t("manage.photos.deleteTitle")}</DialogTitle>
            <DialogDescription id="delete-photo-body">
              {t("manage.photos.deleteBody", {
                position: pendingDelete ? photos.indexOf(pendingDelete) + 1 : 0,
                remaining: Math.max(0, servable - 1),
              })}
              {pendingDelete?.isCover ? ` ${t("manage.photos.deleteCoverNote")}` : ""}
              {floorApplies ? ` ${t("manage.photos.deleteFloorNote", { min: MIN_LISTING_PHOTOS })}` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setPendingDelete(null)}
            >
              {t("manage.cancel")}
            </Button>
            <Button type="button" variant="danger" loading={deleting} onClick={() => void confirmDelete()}>
              {t("manage.photos.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
