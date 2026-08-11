/**
 * Responsive listing grid + skeleton + empty state (shared foundation).
 *
 * 1 col mobile / 2 sm / 3 lg / 4 xl. While `loading`, renders pulse skeleton
 * cards (token colors only) with an sr-only live status; with zero results it
 * renders the branded empty state.
 */
import { useTranslation } from "next-i18next/pages";
import { SearchX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListingCard } from "@/components/listing/listing-card";
import type { Card as ListingCardData } from "@/lib/marketplace-api";

export interface ListingGridProps {
  listings: ListingCardData[];
  loading?: boolean;
  /** Skeleton cards shown while loading (match the expected page size). */
  skeletonCount?: number;
  /** Forwarded to every ListingCard (denser rail layout). */
  compact?: boolean;
  className?: string;
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden" aria-hidden>
      <div className="aspect-[4/3] w-full animate-pulse bg-divider" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 w-2/5 animate-pulse rounded-full bg-divider" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-divider" />
        <div className="h-3 w-3/5 animate-pulse rounded-full bg-divider" />
      </div>
    </Card>
  );
}

export function ListingGrid({
  listings,
  loading = false,
  skeletonCount = 8,
  compact = false,
  className,
}: ListingGridProps) {
  const { t } = useTranslation("listings");

  if (!loading && listings.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-panel border border-line bg-card p-8 text-center sm:p-12",
          className,
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-surface">
          <SearchX className="size-7 text-brand" aria-hidden />
        </span>
        <p className="text-base font-bold text-ink">{t("noResults.title")}</p>
        <p className="max-w-sm text-sm text-muted">{t("noResults.hint")}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <p role="status" className="sr-only">
            {t("loading")}
          </p>
          {Array.from({ length: skeletonCount }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </>
      ) : (
        listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} compact={compact} />
        ))
      )}
    </div>
  );
}
