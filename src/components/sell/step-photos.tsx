/**
 * Sell wizard step 3 — Photos (task P1-02, PRD §5.3).
 *
 * Dropzone built from UI-kit primitives (hidden multi file input + drag
 * handlers — no extra deps). Files are downscaled client-side to max 2000px
 * (image-utils), then uploaded SEQUENTIALLY: presign → PUT (XHR progress) →
 * attach. First tile is the cover; remove is only possible before a photo is
 * attached (v1). Next unlocks at MIN_PHOTOS attached and no uploads in
 * flight.
 *
 * The items array is owned by the page so tiles survive step navigation and
 * feed the review thumbnails; restored drafts contribute count-only
 * placeholder tiles (files cannot persist in localStorage).
 */
import { Car, ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { attachMedia, presignUpload } from "@/lib/marketplace-api";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_TYPES, downscaleImage, uploadWithProgress } from "./image-utils";
import { MAX_PHOTOS, MIN_PHOTOS } from "./types";

export type PhotoStatus =
  | "restored"
  | "pending"
  | "processing"
  | "uploading"
  | "attaching"
  | "done"
  | "error";

export interface PhotoItem {
  id: string;
  fileName: string;
  previewUrl: string | null;
  status: PhotoStatus;
  progress: number;
  error?: string;
  file?: File;
}

const IN_FLIGHT: PhotoStatus[] = ["pending", "processing", "uploading", "attaching"];

export function countAttached(items: PhotoItem[]): number {
  return items.filter((i) => i.status === "done" || i.status === "restored").length;
}

export function StepPhotos({
  items,
  setItems,
  listingId,
  accessToken,
  onBack,
  onNext,
}: {
  items: PhotoItem[];
  setItems: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
  listingId: string;
  accessToken: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation("sell");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const busyRef = React.useRef(false);

  const update = React.useCallback(
    (id: string, patch: Partial<PhotoItem>) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    },
    [setItems],
  );

  const processItem = React.useCallback(
    async (item: PhotoItem) => {
      const { id, file } = item;
      if (!file) {
        update(id, { status: "error", error: t("photos.failed") });
        return;
      }
      try {
        update(id, { status: "processing", progress: 0 });
        const { blob, contentType } = await downscaleImage(file);
        const presigned = await presignUpload(contentType, accessToken);
        if (blob.size > presigned.maxBytes) {
          throw new Error(t("photos.failed"));
        }
        update(id, { status: "uploading" });
        await uploadWithProgress(presigned.uploadUrl, blob, contentType, (percent) =>
          update(id, { progress: percent }),
        );
        update(id, { status: "attaching" });
        await attachMedia(listingId, presigned.key, accessToken);
        update(id, { status: "done", progress: 100 });
      } catch (err) {
        update(id, {
          status: "error",
          error: err instanceof ApiError ? err.message : t("photos.failed"),
        });
      }
    },
    [accessToken, listingId, t, update],
  );

  /* Sequential queue: each state change re-runs this effect; busyRef keeps a
     single item in flight (and guards Strict-Mode double invocation). */
  React.useEffect(() => {
    if (busyRef.current) return;
    const next = items.find((i) => i.status === "pending");
    if (!next) return;
    busyRef.current = true;
    void processItem(next).finally(() => {
      busyRef.current = false;
      // Trigger a pass for the next pending item (processItem already set
      // state, but finish order isn't guaranteed against the effect run).
      setItems((prev) => [...prev]);
    });
  }, [items, processItem, setItems]);

  const addFiles = React.useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const allowed = list.filter((f) =>
        (ALLOWED_IMAGE_TYPES as string[]).includes(f.type),
      );
      if (allowed.length < list.length) {
        toast({ title: t("photos.typeRejected"), variant: "warning" });
      }
      setItems((prev) => {
        const capacity = MAX_PHOTOS - prev.length;
        if (allowed.length > capacity) {
          toast({ title: t("photos.maxReached", { max: MAX_PHOTOS }), variant: "warning" });
        }
        const accepted = allowed.slice(0, Math.max(0, capacity));
        return [
          ...prev,
          ...accepted.map((file) => ({
            id: crypto.randomUUID(),
            fileName: file.name,
            previewUrl: URL.createObjectURL(file),
            status: "pending" as const,
            progress: 0,
            file,
          })),
        ];
      });
    },
    [setItems, t],
  );

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const attached = countAttached(items);
  const inFlight = items.some((i) => IN_FLIGHT.includes(i.status));
  const canProceed = attached >= MIN_PHOTOS && !inFlight;

  const statusLabel = (item: PhotoItem): string => {
    switch (item.status) {
      case "pending":
        return t("photos.queued");
      case "processing":
        return t("photos.processing");
      case "uploading":
        return t("photos.uploading", { percent: item.progress });
      case "attaching":
        return t("photos.attaching");
      case "done":
        return t("photos.done");
      case "restored":
        return t("photos.restoredTile");
      case "error":
        return item.error ?? t("photos.failed");
    }
  };

  return (
    <div className="flex flex-col gap-5">
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
          "flex flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed p-8 text-center transition-colors",
          dragActive ? "border-brand bg-brand-surface" : "border-line bg-page",
        )}
      >
        <ImagePlus className="size-8 text-brand" aria-hidden />
        <p className="text-sm font-semibold text-ink">{t("photos.dropHint")}</p>
        <p className="text-xs text-muted">{t("photos.formats", { max: MAX_PHOTOS })}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-1"
          disabled={items.length >= MAX_PHOTOS}
          onClick={() => inputRef.current?.click()}
        >
          {t("photos.browse")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          className="sr-only"
          aria-label={t("photos.browse")}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="relative overflow-hidden rounded-card border border-line bg-card shadow-soft"
            >
              <div className="relative aspect-[4/3] bg-brand-surface">
                {item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image cannot optimize it
                  <img
                    src={item.previewUrl}
                    alt={item.fileName}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Car className="size-8 text-brand-border" aria-hidden />
                  </span>
                )}
                {index === 0 ? (
                  <Badge variant="solid" className="absolute top-1.5 start-1.5">
                    {t("photos.cover")}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-col gap-1 p-2">
                <p
                  className={cn(
                    "truncate text-xs font-semibold",
                    item.status === "error" ? "text-danger" : "text-muted-strong",
                  )}
                >
                  {statusLabel(item)}
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
                      onClick={() => update(item.id, { status: "pending", error: undefined })}
                    >
                      <RotateCcw aria-hidden />
                      {t("photos.retry")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 flex-1 px-1 text-xs text-danger"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 aria-hidden />
                      {t("photos.remove")}
                    </Button>
                  </div>
                ) : null}
                {item.status === "pending" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs text-danger"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 aria-hidden />
                    {t("photos.remove")}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <p aria-live="polite" className="text-sm font-semibold text-muted-strong">
        {t("photos.counter", { done: attached, min: MIN_PHOTOS })}
        {!canProceed ? (
          <span className="ms-2 font-normal text-muted">
            {attached < MIN_PHOTOS ? t("photos.gate", { min: MIN_PHOTOS }) : t("photos.waitUploads")}
          </span>
        ) : null}
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("back")}
        </Button>
        <Button type="button" disabled={!canProceed} onClick={onNext}>
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
