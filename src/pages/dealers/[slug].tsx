/**
 * /dealers/[slug] — public dealer profile (task P3-09, FR-DP8, PRD §13.1).
 *
 * SSR because this is an SEO surface: it carries AutoDealer JSON-LD, links to
 * the dealer's live stock, and is the page a "Toyota dealer in Dubai" search
 * should land on. Nothing here is behind auth, and the API never returns the
 * dealer's TRN or Peppol ID to it.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { BadgeCheck, Car, MapPin, Phone } from "lucide-react";
import { SiteHeader } from "@/components/home/site-header";
import { ListingCard } from "@/components/listing/listing-card";
import { Badge } from "@/components/ui/badge";
import { Card, Panel } from "@/components/ui/card";
import { mediaUrl } from "@/lib/format";
import {
  getPublicDealer,
  searchListings,
  type Card as ListingCardData,
  type DealerProfile,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

interface Props {
  dealer: DealerProfile & { liveListings: number };
  listings: ListingCardData[];
  siteUrl: string;
}

export default function DealerProfilePage({ dealer, listings, siteUrl }: Props) {
  const { t } = useTranslation("dealer");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const about =
    (dealer.aboutI18n as Record<string, string> | null)?.[locale] ??
    (dealer.aboutI18n as Record<string, string> | null)?.en ??
    null;
  const verified = dealer.verificationStatus === "VERIFIED";
  const canonical = `${siteUrl}/dealers/${dealer.slug}`;
  const primaryBranch = dealer.branches[0];

  /**
   * AutoDealer, not Organization: the vocabulary matters for how a search
   * engine understands the page, and the address comes from the primary
   * showroom rather than being invented.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": canonical,
    name: dealer.name,
    url: canonical,
    ...(dealer.logoKey ? { logo: mediaUrl(dealer.logoKey) } : {}),
    ...(about ? { description: about } : {}),
    ...(dealer.brands.length > 0 ? { brand: dealer.brands } : {}),
    ...(primaryBranch
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: primaryBranch.address ?? undefined,
            addressLocality: primaryBranch.emirate.name,
            addressCountry: "AE",
          },
          ...(primaryBranch.phone ? { telephone: primaryBranch.phone } : {}),
          ...(primaryBranch.lat != null && primaryBranch.lng != null
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: primaryBranch.lat,
                  longitude: primaryBranch.lng,
                },
              }
            : {}),
        }
      : {}),
  };

  return (
    <>
      <Head>
        <title>{`${dealer.name} — ${t("profile.stock")} | Carsens`}</title>
        <meta
          name="description"
          content={
            about ??
            `${dealer.name}: ${dealer.liveListings} cars for sale on Carsens.`
          }
        />
        <link rel="canonical" href={canonical} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <SiteHeader />

      <main className="container-shell py-8">
        <Panel className="flex flex-wrap items-start gap-4 p-5">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-card bg-brand-surface">
            {dealer.logoKey ? (
              <Image
                src={mediaUrl(dealer.logoKey)}
                alt=""
                fill
                sizes="64px"
                className="object-contain"
              />
            ) : (
              <Car className="absolute inset-0 m-auto size-7 text-brand-border" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-extrabold text-ink">
              {dealer.name}
              {verified && (
                <Badge variant="green">
                  <BadgeCheck className="size-3" aria-hidden />
                  {t("profile.verifiedBadge")}
                </Badge>
              )}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {t("directory.listings", { count: dealer.liveListings })}
            </p>
            {dealer.brands.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-1.5">
                {dealer.brands.slice(0, 8).map((brand) => (
                  <Badge key={brand} variant="neutral">
                    {brand}
                  </Badge>
                ))}
              </p>
            )}
          </div>
        </Panel>

        {about && (
          <section className="mt-6">
            <h2 className="text-sm font-bold text-ink">{t("profile.about")}</h2>
            <p className="mt-1 max-w-3xl whitespace-pre-line text-sm text-muted">{about}</p>
          </section>
        )}

        {dealer.branches.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-bold text-ink">{t("profile.branches")}</h2>
            <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dealer.branches.map((branch) => (
                <li key={branch.id}>
                  <Card className="p-3">
                    <p className="text-sm font-bold text-ink">{branch.name}</p>
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {[branch.address, branch.emirate.name].filter(Boolean).join(", ")}
                    </p>
                    {branch.phone && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs">
                        <Phone className="size-3.5 shrink-0 text-muted" aria-hidden />
                        <a href={`tel:${branch.phone}`} className="text-brand-mid hover:underline">
                          {branch.phone}
                        </a>
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-bold text-ink">{t("profile.stock")}</h2>
          {listings.length === 0 ? (
            <Card className="mt-2 p-8 text-center text-sm text-muted">
              {t("profile.noStock")}
            </Card>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
          {dealer.liveListings > listings.length && (
            <p className="mt-4">
              <Link
                href={`/cars?dealerId=${dealer.id}`}
                className="text-sm text-brand-mid hover:underline"
              >
                {t("directory.listings", { count: dealer.liveListings })}
              </Link>
            </p>
          )}
        </section>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = String(ctx.params?.slug ?? "");
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;

  try {
    const dealer = await getPublicDealer(slug);
    // Stock is a separate call so a slow search never blocks the profile itself.
    const stock = await searchListings({ dealerId: dealer.id, limit: 8 }).catch(
      () => ({ items: [] }),
    );

    return {
      props: {
        dealer,
        listings: (stock.items ?? []).slice(0, 8),
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        ...(await serverSideTranslations(
          locale,
          ["common", "dealer", "listings", "home", "search"],
          nextI18NextConfig,
        )),
      },
    };
  } catch {
    return { notFound: true };
  }
};
