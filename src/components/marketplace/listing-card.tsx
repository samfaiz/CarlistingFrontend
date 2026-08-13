/**
 * MarketplaceCard — the mockup's `.card` listing tile, populated from real
 * listing data. Shared by the home rails, search results, similar-cars rails.
 */
import Link from "next/link";
import * as React from "react";
import { formatMileage, formatPrice, mediaUrl } from "@/lib/format";
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

export function MarketplaceCard({ car }: { car: Card }) {
  // Defensive: some callers (e.g. /listings/mine) pass a leaner shape than the
  // search Card and may omit emirate / _count.
  const cover = car.media?.[0]?.variants?.card;
  const title = `${car.year} ${car.make?.name ?? ""} ${car.model?.name ?? ""}${car.trim ? ` ${car.trim.name}` : ""}`.trim();
  const dealer = car.sellerType === "DEALER" ? (car.make?.name ?? "Dealer") : "Private seller";
  const photoCount = car._count?.media ?? car.media?.length ?? 0;
  const isFeatured = car.badges?.includes("featured");

  return (
    <Link href={`/cars/${car.slug}`} className="card">
      <div className="media">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(cover)} alt={title} loading="lazy" />
        ) : (
          <div style={{ height: "100%", background: "var(--brand-surface)" }} />
        )}
        {isFeatured && <span className="badge">Featured</span>}
        <button className="fav" type="button" aria-label="Save" onClick={(e) => e.preventDefault()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <div className="price">{formatPrice(car.priceAed, "en")}</div>
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
