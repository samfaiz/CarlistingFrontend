/**
 * JSON-LD structured-data components — task P1-12 (§13.1).
 *
 * Emits <script type="application/ld+json"> blocks for:
 *  - Vehicle + Offer      (listing detail page, from the live ListingDetail)
 *  - BreadcrumbList       (detail + landing pages)
 *  - ItemList             (SEO landing pages)
 *  - WebSite+SearchAction (home page)
 *
 * Placement note: these render in the BODY, directly after the page's <Head>
 * block, NOT inside it — next/head only reliably picks up plain head tags as
 * direct children (nested components break on client-side navigation), and
 * Google parses JSON-LD anywhere in the document. Keeps the required
 * insertions into /cars/[slug].tsx and index.tsx to single lines.
 *
 * Serialization escapes "<" so listing-controlled strings can never close the
 * script tag (XSS hardening).
 */
import * as React from "react";
import { mediaUrl } from "@/lib/format";
import type { Card, ListingDetail } from "@/lib/marketplace-api";
import { absoluteUrl, SITE_URL } from "@/components/seo/site-url";

/** Serialize + emit one JSON-LD script block ("<" escaped, see file docs). */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Vehicle + Offer (detail page)                                      */
/* ------------------------------------------------------------------ */

/** "PETROL" -> "Petrol" — schema.org wants readable strings, not our enums. */
function humanizeEnum(value: string): string {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function VehicleJsonLd({ listing }: { listing: ListingDetail }) {
  const url = absoluteUrl(`/cars/${listing.slug}`);
  const name = [listing.year, listing.make.name, listing.model.name, listing.trim?.name]
    .filter(Boolean)
    .join(" ");

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name,
    url,
    brand: { "@type": "Brand", name: listing.make.name },
    model: listing.model.name,
    vehicleModelDate: String(listing.year),
    modelDate: String(listing.year),
    itemCondition: "https://schema.org/UsedCondition",
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: listing.mileageKm,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      price: listing.priceAed,
      priceCurrency: "AED",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      url,
    },
  };

  if (listing.trim?.name) data.vehicleConfiguration = listing.trim.name;
  if (listing.fuelType) data.fuelType = humanizeEnum(listing.fuelType);
  if (listing.transmission)
    data.vehicleTransmission = humanizeEnum(listing.transmission);
  if (listing.exteriorColor) data.color = listing.exteriorColor;
  if (listing.vin) data.vehicleIdentificationNumber = listing.vin;
  if (listing.bodyType) data.bodyType = listing.bodyType.name;
  const images = listing.media
    .filter((m) => m.scanStatus === "CLEAN")
    .map((m) => mediaUrl(m.variants.detail));
  if (images.length > 0) data.image = images;

  return <JsonLd data={data} />;
}

/* ------------------------------------------------------------------ */
/* BreadcrumbList (detail + landing pages)                            */
/* ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  name: string;
  /** Un-localized site-relative path; omit on the final (current) crumb. */
  path?: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
  return <JsonLd data={data} />;
}

/* ------------------------------------------------------------------ */
/* ItemList (SEO landing pages)                                       */
/* ------------------------------------------------------------------ */

/** The listing grid of a landing page as a schema.org ItemList. */
export function ItemListJsonLd({ items }: { items: Card[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/cars/${listing.slug}`),
      name: [listing.year, listing.make.name, listing.model.name, listing.trim?.name]
        .filter(Boolean)
        .join(" "),
    })),
  };
  return <JsonLd data={data} />;
}

/* ------------------------------------------------------------------ */
/* WebSite + SearchAction (home page)                                 */
/* ------------------------------------------------------------------ */

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Carsens",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/cars?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return <JsonLd data={data} />;
}

/* ------------------------------------------------------------------ */
/* FAQPage (vs pages — task P6-03, FR-CV7)                            */
/* ------------------------------------------------------------------ */

export interface FaqEntry {
  question: string;
  answer: string;
}

/** FAQPage block for the "X vs Y" pages — answers come from live data only. */
export function FaqJsonLd({ faqs }: { faqs: FaqEntry[] }) {
  if (faqs.length === 0) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  return <JsonLd data={data} />;
}
