/**
 * Saved-car card for /account/saved — task P1-09 (FR-U1).
 *
 * Renders a GET /saved/cars row: cover, title, current price, the
 * "Price dropped AED X" success badge when the backend flagged a drop since
 * saving, and a muted "No longer available" overlay when the listing left
 * LIVE (stillLive=false — card is not linked in that case). The unsave heart
 * is a sibling of the stretched link (axe nested-interactive).
 */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Car, Heart, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatMileage,
  formatPrice,
  formatRelativeTime,
  mediaUrl,
} from "@/lib/format";
import type { SavedCar } from "@/lib/marketplace-api";

export interface SavedCarCardProps {
  saved: SavedCar;
  /** Fired after the user clicks the unsave heart (page owns the API sync). */
  onUnsave: (listingId: string) => void;
  className?: string;
}

export function SavedCarCard({ saved, onUnsave, className }: SavedCarCardProps) {
  const { t } = useTranslation("saved");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const { listing } = saved;
  const title = [listing.year, listing.make.name, listing.model.name, listing.trim?.name]
    .filter(Boolean)
    .join(" ");
  const cover = listing.media[0];

  const body = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-surface">
        {cover ? (
          <Image
            src={mediaUrl(cover.variants.card)}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn("object-cover", !saved.stillLive && "opacity-60 grayscale")}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <Car className="size-12 text-brand-border" aria-hidden />
          </span>
        )}
        {!saved.stillLive && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <Badge variant="neutral">{t("cars.notAvailable")}</Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "text-lg font-extrabold",
              saved.stillLive ? "text-brand" : "text-muted",
            )}
          >
            {formatPrice(listing.priceAed, locale)}
          </span>
          {saved.priceDropped && saved.stillLive && (
            <Badge variant="green" data-testid="price-drop-badge">
              {t("cars.priceDrop", {
                amount: formatPrice(saved.priceDropAed, locale),
              })}
            </Badge>
          )}
        </p>

        <h3
          className={cn(
            "line-clamp-2 text-sm font-semibold sm:text-base",
            saved.stillLive ? "text-ink" : "text-muted",
          )}
        >
          {title}
        </h3>

        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-strong">
          <span>{formatMileage(listing.mileageKm, locale)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {listing.emirate.name}
          </span>
        </p>

        <p className="mt-auto pt-1 text-xs text-muted">
          {t("cars.savedAt", {
            time: formatRelativeTime(saved.savedAt, locale),
          })}
        </p>
      </div>
    </>
  );

  return (
    <Card
      data-testid="saved-car-card"
      className={cn(
        "group relative flex h-full flex-col overflow-hidden transition-shadow",
        saved.stillLive && "focus-within:shadow-card hover:shadow-card",
        className,
      )}
    >
      {saved.stillLive ? (
        <Link
          href={`/cars/${listing.slug}`}
          className="flex h-full flex-col focus-visible:outline-2"
        >
          {body}
        </Link>
      ) : (
        <div className="flex h-full flex-col">{body}</div>
      )}

      {/* Unsave heart — sibling overlay, never nested in the link. */}
      <button
        type="button"
        aria-label={t("cars.unsave", { title })}
        title={t("cars.unsave", { title })}
        onClick={() => onUnsave(listing.id)}
        data-testid="unsave-button"
        className={cn(
          "absolute top-2 end-2 flex size-8 items-center justify-center rounded-full",
          "bg-card/90 shadow-soft transition-colors hover:bg-card focus-visible:outline-2",
        )}
      >
        <Heart className="size-4 fill-danger text-danger" aria-hidden />
      </button>
    </Card>
  );
}
