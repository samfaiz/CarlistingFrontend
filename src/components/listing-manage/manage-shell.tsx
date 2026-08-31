/**
 * Chrome shared by the two listing-management screens.
 *
 * Both are reached from /account/listings (private seller) and from
 * /dealer/inventory (dealership member), so the shell carries the way back,
 * the vehicle's identity, its live status and the Details/Photos switch —
 * and nothing that assumes which of the two the viewer came from.
 *
 * UI-kit layer (not `.mk`): both entry points are UI-kit screens.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OwnedListing } from "./api";

export const STATUS_VARIANT: Record<
  string,
  "navy" | "green" | "amber" | "red" | "neutral"
> = {
  LIVE: "green",
  PENDING_REVIEW: "amber",
  DRAFT: "neutral",
  PAUSED: "neutral",
  SOLD: "navy",
  EXPIRED: "neutral",
  REJECTED: "red",
  ARCHIVED: "neutral",
};

export function listingTitle(listing: OwnedListing): string {
  return [listing.year, listing.make?.name, listing.model?.name, listing.trim?.name]
    .filter(Boolean)
    .join(" ");
}

export function ManageShell({
  listing,
  routeParam,
  current,
  children,
}: {
  listing: OwnedListing;
  /** The value in the `[id]` segment, reused verbatim so the tabs never re-resolve. */
  routeParam: string;
  current: "details" | "photos";
  children: React.ReactNode;
}) {
  const { t } = useTranslation("account");
  const { t: tListings } = useTranslation("listings");

  const tabs = [
    { key: "details" as const, href: `/listings/${routeParam}/edit`, label: t("manage.tabs.details") },
    { key: "photos" as const, href: `/listings/${routeParam}/photos`, label: t("manage.tabs.photos") },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <Link
        href="/account/listings"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-mid underline-offset-2 hover:underline"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t("manage.back")}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-extrabold text-ink">{listingTitle(listing)}</h1>
        <Badge variant={STATUS_VARIANT[listing.status] ?? "neutral"}>
          {tListings(`status.${listing.status}`, { defaultValue: listing.status })}
        </Badge>
      </div>

      <nav
        className="mt-4 flex gap-1 border-b border-divider"
        aria-label={t("manage.tabs.label")}
      >
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={current === tab.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
              current === tab.key
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5">{children}</div>
    </div>
  );
}

/** Shared loading / not-found / error states so both screens fail identically. */
export function ManageMessage({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-lg font-extrabold text-ink">{title}</h1>
      {body ? <p className="mt-2 text-sm text-muted">{body}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
