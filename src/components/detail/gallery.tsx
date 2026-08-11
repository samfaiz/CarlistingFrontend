/**
 * Listing photo gallery (P1-07): main image (variants.detail) + thumb strip
 * (variants.thumb), counter chip, prev/next controls, keyboard navigation
 * (arrow keys — direction-aware in RTL, Home/End jump). Bulk-seeded listings
 * may have no media at all — those render the branded placeholder block.
 */
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Camera, Car, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/format";
import type { ListingMedia } from "@/lib/marketplace-api";

export interface GalleryProps {
  media: ListingMedia[];
  /** Vehicle title, used as the image alt base. */
  title: string;
}

export function Gallery({ media, title }: GalleryProps) {
  const { t } = useTranslation("detail");
  const router = useRouter();
  const isRtl = (router.locale ?? "en") === "ar";

  const sorted = React.useMemo(
    () => [...media].sort((a, b) => a.sortOrder - b.sortOrder),
    [media],
  );
  const [index, setIndex] = React.useState(0);
  const count = sorted.length;

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-panel border border-line bg-brand-surface">
        <Car className="size-16 text-brand-border" aria-hidden />
        <p className="text-sm font-medium text-muted-strong">{t("gallery.noPhotos")}</p>
      </div>
    );
  }

  const current = sorted[Math.min(index, count - 1)];
  const goTo = (next: number) => setIndex(((next % count) + count) % count);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Arrow keys follow the reading direction: "forward" is Right in LTR, Left in RTL.
    const forward = isRtl ? "ArrowLeft" : "ArrowRight";
    const backward = isRtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === forward) {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === backward) {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(count - 1);
    }
  };

  return (
    <div
      className="overflow-hidden rounded-panel border border-line bg-card shadow-soft"
      onKeyDown={handleKeyDown}
    >
      <div className="relative aspect-[4/3] w-full bg-brand-surface">
        <Image
          src={mediaUrl(current.variants.detail)}
          alt={`${title} — ${t("gallery.photoAria", { current: index + 1, total: count })}`}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
          priority
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={t("gallery.prev")}
              className="absolute start-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-white transition-colors hover:bg-ink/80"
            >
              <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={t("gallery.next")}
              className="absolute end-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/60 text-white transition-colors hover:bg-ink/80"
            >
              <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
            </button>
          </>
        )}

        {/* aria-label is prohibited on a generic span (axe serious) — the
            screen-reader wording lives in an sr-only sibling instead. */}
        <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2.5 py-0.5 text-xs font-semibold text-white">
          <Camera className="size-3" aria-hidden />
          <span aria-hidden>{t("gallery.counter", { current: index + 1, total: count })}</span>
          <span className="sr-only">
            {t("gallery.photoAria", { current: index + 1, total: count })}
          </span>
        </span>
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto p-2">
          {sorted.map((item, i) => (
            <button
              key={item.s3Key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t("gallery.thumbAria", { index: i + 1 })}
              aria-current={i === index}
              className={cn(
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-card border-2 bg-brand-surface transition-colors",
                i === index ? "border-brand" : "border-transparent hover:border-brand-border",
              )}
            >
              <Image
                src={mediaUrl(item.variants.thumb)}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
