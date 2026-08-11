/**
 * Detail price/seller panel (P1-07): prominent price + negotiable badge, the
 * h1 title, key facts, posted time + view count, seller block with disabled
 * Chat/Call (contact wiring lands with P2-03) and a share button
 * (navigator.share with copy-link + toast fallback).
 */
import * as React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  Calendar,
  Car,
  Eye,
  Fuel,
  Gauge,
  Globe,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Settings2,
  Share2,
} from "lucide-react";
import { SaveButton } from "@/components/saved/save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { formatMileage, formatPrice, formatRelativeTime } from "@/lib/format";
import type { ListingDetail } from "@/lib/marketplace-api";

export interface PricePanelProps {
  listing: ListingDetail;
  /** Composed vehicle title (year make model trim). */
  title: string;
  /** Locale-resolved emirate display name. */
  emirateName: string;
}

/** "PLUGIN_HYBRID" -> "Plugin hybrid" — last-resort label for unknown enums. */
function humanize(value: string): string {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

interface Fact {
  key: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}

export function PricePanel({ listing, title, emirateName }: PricePanelProps) {
  const { t } = useTranslation("detail");
  const { t: tListings } = useTranslation("listings");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const tEnum = (group: string, value: string) =>
    tListings(`enum.${group}.${value}`, { defaultValue: humanize(value) });
  // FR-I5: Western digits in every locale.
  const formatCount = (n: number) =>
    new Intl.NumberFormat(`${locale}-u-nu-latn`).format(n);

  const facts: Fact[] = [
    { key: "year", Icon: Calendar, label: t("facts.year"), value: String(listing.year) },
    {
      key: "mileage",
      Icon: Gauge,
      label: t("facts.mileage"),
      value: formatMileage(listing.mileageKm, locale),
    },
    ...(listing.regionalSpec
      ? [
          {
            key: "regionalSpec",
            Icon: Globe,
            label: t("facts.regionalSpec"),
            value: tEnum("spec", listing.regionalSpec),
          },
        ]
      : []),
    ...(listing.fuelType
      ? [
          {
            key: "fuel",
            Icon: Fuel,
            label: t("facts.fuel"),
            value: tEnum("fuel", listing.fuelType),
          },
        ]
      : []),
    ...(listing.transmission
      ? [
          {
            key: "transmission",
            Icon: Settings2,
            label: t("facts.transmission"),
            value: tEnum("transmission", listing.transmission),
          },
        ]
      : []),
    ...(listing.bodyType
      ? [
          {
            key: "bodyType",
            Icon: Car,
            label: t("facts.bodyType"),
            value: listing.bodyType.name,
          },
        ]
      : []),
    ...(listing.exteriorColor
      ? [
          {
            key: "exteriorColor",
            Icon: Palette,
            label: t("facts.exteriorColor"),
            value: listing.exteriorColor,
          },
        ]
      : []),
    { key: "location", Icon: MapPin, label: t("facts.location"), value: emirateName },
  ];

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed the sheet (or share failed) — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t("share.copied"), variant: "success" });
    } catch {
      toast({ title: t("share.failed"), variant: "warning" });
    }
  };

  const postedAt = listing.publishedAt ?? listing.createdAt;

  return (
    <Panel className="flex flex-col gap-4 p-5">
      <div>
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-extrabold text-brand sm:text-3xl">
            {formatPrice(listing.priceAed, locale)}
          </span>
          {listing.isNegotiable && (
            <Badge variant="navy">{tListings("negotiable")}</Badge>
          )}
        </p>
        <h1 className="mt-1 text-lg font-bold text-ink sm:text-xl">{title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {postedAt && (
            <span>{t("posted", { time: formatRelativeTime(postedAt, locale) })}</span>
          )}
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden />
            {t("views", {
              count: listing.viewCount,
              formatted: formatCount(listing.viewCount),
            })}
          </span>
        </p>
      </div>

      {/* Each fact is ONE div directly under the dl, with dt/dd as its direct
          children (icon lives inside the dt) — deeper nesting fails the axe
          definition-list/dlitem serious rules. */}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-divider pt-4">
        {facts.map(({ key, Icon, label, value }) => (
          <div key={key} className="min-w-0">
            <dt className="flex items-center gap-2 text-xs text-muted">
              <Icon className="size-4 shrink-0 text-brand-mid" aria-hidden />
              {label}
            </dt>
            <dd className="ms-6 text-sm font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-divider pt-4">
        <p className="text-xs text-muted">{t("seller.heading")}</p>
        <p className="text-sm font-bold text-ink">
          {t(`seller.type.${listing.sellerType}`, {
            defaultValue: humanize(listing.sellerType),
          })}
        </p>

        {/*
         * TODO(P2-03): wire real chat/call actions. Contact endpoints must be
         * fetched on interaction only — never present in the HTML source
         * (plan P1-07 note / FR-D6). Until then both buttons stay disabled.
         */}
        <div className="mt-3 grid grid-cols-2 gap-2" title={t("contact.comingSoon")}>
          <Button disabled aria-describedby="contact-coming-soon">
            <MessageCircle aria-hidden />
            {t("contact.chat")}
          </Button>
          <Button disabled variant="secondary" aria-describedby="contact-coming-soon">
            <Phone aria-hidden />
            {t("contact.call")}
          </Button>
        </div>
        <p id="contact-coming-soon" className="mt-2 text-xs text-muted">
          {t("contact.comingSoon")}
        </p>
      </div>

      {/* P1-09: save + share, side by side. */}
      <div className="grid grid-cols-2 gap-2">
        <SaveButton listingId={listing.id} variant="panel" />
        <Button variant="outline" onClick={() => void handleShare()}>
          <Share2 aria-hidden />
          {t("share.button")}
        </Button>
      </div>
    </Panel>
  );
}
