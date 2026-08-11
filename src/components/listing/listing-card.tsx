/**
 * Marketplace listing card (shared foundation for P1-05 search grid,
 * P1-08 home rails and related surfaces).
 *
 * - The card body is one locale-aware <Link> to /cars/[slug]; the P1-09/P1-10
 *   action buttons (save heart, compare chip) are SIBLINGS of the link inside
 *   an aspect-matched overlay — interactive elements nested inside an anchor
 *   would fail the axe nested-interactive gate.
 * - Cover uses next/image (variants.card); bulk-seeded listings may have no
 *   media — those render the branded placeholder (bg-brand-surface + Car icon).
 * - All copy comes from the "listings" catalog; enum values (fuel/transmission/
 *   regional spec) translate via enum.* keys with a humanized fallback so an
 *   unknown backend value never renders a raw i18n key.
 */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Camera, Car, MapPin } from "lucide-react";
import { CompareChip } from "@/components/compare/compare-chip";
import { SaveButton } from "@/components/saved/save-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMileage, formatPrice, formatRelativeTime, mediaUrl } from "@/lib/format";
import type { Card as ListingCardData } from "@/lib/marketplace-api";

export interface ListingCardProps {
  listing: ListingCardData;
  /** Denser layout for horizontal rails / narrow columns. */
  compact?: boolean;
  className?: string;
}

/** "PLUGIN_HYBRID" -> "Plugin hybrid" — last-resort label for unknown enums. */
function humanize(value: string): string {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function ListingCard({ listing, compact = false, className }: ListingCardProps) {
  const { t } = useTranslation("listings");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const title = [
    listing.year,
    listing.make.name,
    listing.model.name,
    listing.trim?.name,
  ]
    .filter(Boolean)
    .join(" ");

  const cover = listing.media[0];
  const photoCount = listing._count.media;
  const isFeatured = listing.badges.includes("featured");
  const isVerified = listing.badges.includes("verified");

  const tEnum = (group: string, value: string) =>
    t(`enum.${group}.${value}`, { defaultValue: humanize(value) });

  return (
    <Card
      className={cn(
        "group relative h-full overflow-hidden transition-shadow focus-within:shadow-card hover:shadow-card",
        className,
      )}
    >
      <Link
        href={`/cars/${listing.slug}`}
        className="flex h-full flex-col focus-visible:outline-2"
      >
        {/* Cover — 4:3, branded placeholder when the listing has no media */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-surface">
          {cover ? (
            <Image
              src={mediaUrl(cover.variants.card)}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center">
              <Car
                className={cn("text-brand-border", compact ? "size-8" : "size-12")}
                aria-hidden
              />
            </span>
          )}

          {(isFeatured || isVerified) && (
            <span className="absolute top-2 start-2 flex flex-wrap gap-1 pe-10">
              {isFeatured && <Badge variant="solid">{t("badge.featured")}</Badge>}
              {isVerified && <Badge variant="green">{t("badge.verified")}</Badge>}
            </span>
          )}

          {photoCount > 0 && (
            <span
              className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-semibold text-white"
              aria-label={t("photoCount", { count: photoCount })}
            >
              <Camera className="size-3" aria-hidden />
              <span aria-hidden>{photoCount}</span>
            </span>
          )}
        </div>

        {/* Body */}
        <div className={cn("flex flex-1 flex-col gap-1", compact ? "p-3" : "p-3 sm:p-4")}>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span
              className={cn(
                "font-extrabold text-brand",
                compact ? "text-base" : "text-lg",
              )}
            >
              {formatPrice(listing.priceAed, locale)}
            </span>
            {listing.isNegotiable && (
              <span className="text-xs font-medium text-muted">{t("negotiable")}</span>
            )}
          </p>

          <h3
            className={cn(
              "font-semibold text-ink",
              compact ? "line-clamp-1 text-sm" : "line-clamp-2 text-sm sm:text-base",
            )}
          >
            {title}
          </h3>

          {/* Spec row: mileage · fuel · transmission + regional-spec badge */}
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-strong">
            <span>{formatMileage(listing.mileageKm, locale)}</span>
            {listing.fuelType && (
              <>
                <span aria-hidden>·</span>
                <span>{tEnum("fuel", listing.fuelType)}</span>
              </>
            )}
            {!compact && listing.transmission && (
              <>
                <span aria-hidden>·</span>
                <span>{tEnum("transmission", listing.transmission)}</span>
              </>
            )}
            {listing.regionalSpec && (
              <Badge variant="navy" className="ms-auto">
                {tEnum("spec", listing.regionalSpec)}
              </Badge>
            )}
          </p>

          <p className="mt-auto flex items-center gap-1 pt-1 text-xs text-muted">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{listing.emirate.name}</span>
            {listing.publishedAt && (
              <>
                <span aria-hidden>·</span>
                <span className="shrink-0">
                  {formatRelativeTime(listing.publishedAt, locale)}
                </span>
              </>
            )}
          </p>
        </div>
      </Link>

      {/* P1-09/P1-10 actions — SIBLINGS of the link (axe nested-interactive),
          positioned over the image via an aspect-matched overlay box. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/3]">
        <SaveButton
          listingId={listing.id}
          className="pointer-events-auto absolute top-2 end-2"
        />
        <CompareChip
          entry={{
            id: listing.id,
            slug: listing.slug,
            title,
            year: listing.year,
            priceAed: listing.priceAed,
            thumb: cover ? cover.variants.card : null,
          }}
          className="pointer-events-auto absolute bottom-2 start-2"
        />
      </div>
    </Card>
  );
}
