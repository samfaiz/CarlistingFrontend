/**
 * "Similar cars" rail (P1-07): same-model listings via /search/listings
 * (single fetch, self excluded, 4 compact cards). Renders nothing while
 * loading or when there is nothing comparable — the section only appears
 * with real content.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { ListingCard } from "@/components/listing/listing-card";
import { searchListings, type Card } from "@/lib/marketplace-api";

const RAIL_SIZE = 4;

export interface SimilarRailProps {
  modelId: string;
  /** The listing being viewed — always excluded from its own rail. */
  excludeId: string;
}

export function SimilarRail({ modelId, excludeId }: SimilarRailProps) {
  const { t } = useTranslation("detail");
  const [items, setItems] = React.useState<Card[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setItems(null);
    // One request per page view (limit+1 so the rail stays full after
    // excluding self) — no debounce needed, this is not filter-driven.
    searchListings({ modelId, limit: RAIL_SIZE + 1 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items.filter((item) => item.id !== excludeId).slice(0, RAIL_SIZE));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [modelId, excludeId]);

  if (!items || items.length === 0) return null;

  return (
    <section
      aria-labelledby="similar-heading"
      className="container-shell flex flex-col gap-4 pb-12"
    >
      <h2 id="similar-heading" className="text-xl font-bold text-ink">
        {t("similar.heading")}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} compact />
        ))}
      </div>
    </section>
  );
}
