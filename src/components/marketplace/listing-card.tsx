/**
 * MarketplaceCard — the mockup's `.card` listing tile, populated from real
 * listing data. Shared by the home rails, search results, similar-cars rails.
 */
import Link from "next/link";
import * as React from "react";
import { formatMileage, mediaUrl } from "@/lib/format";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { useCurrency } from "@/components/marketplace/currency-provider";
import { useSaved } from "@/components/saved/saved-provider";
import { useCompare } from "@/components/compare/compare-provider";
import { toast } from "@/components/ui/toast";
import type { Card } from "@/lib/marketplace-api";

const FUEL_LABEL: Record<string, string> = {
  PETROL: "Petrol", DIESEL: "Diesel", HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in", ELECTRIC: "Electric", OTHER: "Fuel",
};
const TRANS_LABEL: Record<string, string> = {
  AUTOMATIC: "Auto", MANUAL: "Manual", CVT: "CVT", DCT: "DCT", OTHER: "—",
};

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function MarketplaceCard({ car, hrefBase = "/cars" }: { car: Card; hrefBase?: string }) {
  const { format } = useCurrency();
  const { t } = useTranslation("common");
  const router = useRouter();
  // The heart was inert: it only called preventDefault(). SavedProvider was
  // already mounted and already says "heart buttons everywhere read/toggle it"
  // — the card simply never consumed it.
  const { ready, authed, isSaved, toggle } = useSaved();
  const saved = isSaved(car.id);

  /*
   * Compare. The tray and /compare page have always worked, but nothing on the
   * card could populate them — the mockup port styled `.compare-toggle` and
   * `.card.in-compare` and then never rendered either, so compare was
   * unreachable from search. Uses the design that was already there.
   */
  const { has: inCompare, toggle: toggleCompare } = useCompare();
  const comparing = inCompare(car.id);

  const onCompare = (e: React.MouseEvent) => {
    // Inside the card's <Link>: stop the navigation and the bubble.
    e.preventDefault();
    e.stopPropagation();
    const accepted = toggleCompare({
      id: car.id,
      slug: car.slug,
      title,
      year: car.year,
      priceAed: car.priceAed,
      thumb: car.media?.[0]?.variants?.card ?? null,
    });
    // toggle() returns false only when the tray is already at its max.
    if (!accepted) {
      toast({ title: t("compare.full", { defaultValue: "Compare holds 4 cars — remove one first" }), variant: "warning" });
    }
  };

  const onFav = (e: React.MouseEvent) => {
    // Inside a <Link>: stop both the navigation and the bubble.
    e.preventDefault();
    e.stopPropagation();
    // `authed` is false until the session resolves, so tapping during that
    // window bounced a SIGNED-IN user to the login page. `ready` distinguishes
    // "not signed in" from "not known yet".
    if (!ready) return;
    if (!authed) {
      void router.push(`/login?next=${encodeURIComponent(`${hrefBase}/${car.slug}`)}`);
      return;
    }
    void toggle(car.id);
  };
  // Defensive: some callers (e.g. /listings/mine) pass a leaner shape than the
  // search Card and may omit emirate / _count.
  const cover = car.media?.[0]?.variants?.card;
  const title = `${car.year} ${car.make?.name ?? ""} ${car.model?.name ?? ""}${car.trim ? ` ${car.trim.name}` : ""}`.trim();
  const dealer = car.sellerType === "DEALER" ? (car.make?.name ?? "Dealer") : "Private seller";
  const photoCount = car._count?.media ?? car.media?.length ?? 0;
  const isFeatured = car.badges?.includes("featured");

  return (
    <Link href={`${hrefBase}/${car.slug}`} className={comparing ? "card in-compare" : "card"}>
      <div className="media">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(cover)} alt={title} loading="lazy" />
        ) : (
          <div style={{ height: "100%", background: "var(--brand-surface)" }} />
        )}
        {isFeatured && <span className="badge">Featured</span>}
        <button
          className={saved ? "fav is-saved" : "fav"}
          type="button"
          /* E2E hook for the save flow; the mockup port dropped it. */
          data-testid="save-button"
          onClick={onFav}
          disabled={!ready}
          aria-pressed={saved}
          aria-label={saved ? t("card.unsave", { defaultValue: "Remove from saved" }) : t("card.save", { defaultValue: "Save this car" })}
          title={saved ? t("card.unsave", { defaultValue: "Remove from saved" }) : t("card.save", { defaultValue: "Save this car" })}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
        <span className="photo-count">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg>{" "}
          {photoCount}
        </span>
      </div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-sub">{car.year} • {car.emirate?.name ?? ""}</p>
        <div className="price">{format(car.priceAed)}</div>
        <div className="specs">
          <span className="spec">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3" /></svg>{" "}
            {formatMileage(car.mileageKm, "en")}
          </span>
          <span className="spec">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12l4 4v12H4z" /></svg>{" "}
            {FUEL_LABEL[car.fuelType ?? "OTHER"] ?? "Fuel"}
          </span>
          <span className="spec">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>{" "}
            {TRANS_LABEL[car.transmission ?? "OTHER"] ?? "—"}
          </span>
        </div>
        <div className="card-foot">
          {/*
            role="checkbox" + aria-checked, not a plain button: this is a
            selection, and that is the contract /compare and the E2E expect.
          */}
          <button
            type="button"
            role="checkbox"
            aria-checked={comparing}
            data-testid="compare-chip"
            className={comparing ? "compare-toggle added" : "compare-toggle"}
            onClick={onCompare}
            aria-label={t("compare.chipLabel", { title, defaultValue: `Compare ${title}` })}
          >
            <span className="ct-box" aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            {t("compare.chip", { defaultValue: "Compare" })}
          </button>
          <div className="dealer"><span className="avatar">{initials(dealer)}</span> {dealer}</div>
          {car.sellerType === "DEALER" && (
            <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg> Dealer
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
