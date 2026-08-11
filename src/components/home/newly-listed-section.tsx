/**
 * "Newly listed" rail (P1-08) — latest cards from /search/listings rendered
 * through the shared ListingGrid (skeletons while loading, branded empty state).
 */
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingGrid } from "@/components/listing/listing-grid";
import type { Card } from "@/lib/marketplace-api";

export interface NewlyListedSectionProps {
  items: Card[];
  loading: boolean;
  failed: boolean;
}

export function NewlyListedSection({ items, loading, failed }: NewlyListedSectionProps) {
  const { t } = useTranslation("home");

  return (
    <section aria-labelledby="newly-listed-heading" className="container-shell py-10">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id="newly-listed-heading" className="text-xl font-bold text-ink sm:text-2xl">
          {t("newlyListed.heading")}
        </h2>
        <Button asChild variant="link" size="sm">
          <Link href="/cars">
            {t("newlyListed.viewAll")}
            <ArrowRight className="rtl:-scale-x-100" aria-hidden />
          </Link>
        </Button>
      </div>

      {failed ? (
        <p className="rounded-card border border-line bg-card p-4 text-sm text-muted-strong">
          {t("newlyListed.error")}
        </p>
      ) : (
        <ListingGrid listings={items} loading={loading} skeletonCount={8} />
      )}
    </section>
  );
}
