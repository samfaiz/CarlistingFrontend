/**
 * Car detail page — task P1-07 (/cars/[slug]).
 *
 * SSR via getServerSideProps: the listing is fetched by slug (backend 404s
 * anything that is not LIVE unless the owner views it → Next notFound). SEO
 * head is composed per task spec: "YEAR Make Model Trim for sale in Emirate |
 * Carsens", meta description from price + mileage + emirate, og:image from the
 * first detail variant.
 *
 * Layout: gallery + specs + description in the start column, sticky price/
 * seller panel at the end column (mobile stacks gallery → price → specs →
 * description via grid auto-placement), similar-cars rail underneath.
 */
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { DescriptionSection } from "@/components/detail/description-section";
import { Gallery } from "@/components/detail/gallery";
import { PricePanel } from "@/components/detail/price-panel";
import { SimilarRail } from "@/components/detail/similar-rail";
import { SpecsSection } from "@/components/detail/specs-section";
import { SiteHeader } from "@/components/home/site-header";
import { BreadcrumbJsonLd, VehicleJsonLd } from "@/components/seo/json-ld";
import { ApiError } from "@/lib/api";
import { formatMileage, formatPrice, mediaUrl } from "@/lib/format";
import { getListing, type ListingDetail } from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

/**
 * The live payload carries more than the shared ListingDetail type declares
 * (owned foundation — not edited here): the raw FK ids used for the similar
 * rail and the emirate's i18n name map.
 */
type ListingDetailFull = ListingDetail & {
  modelId: string;
  makeId: string;
  emirate: ListingDetail["emirate"] & { i18n?: Record<string, string> | null };
};

interface CarDetailPageProps {
  listing: ListingDetailFull;
}

export default function CarDetailPage({ listing }: CarDetailPageProps) {
  const { t } = useTranslation("detail");
  const { t: tSeo } = useTranslation("seo"); // P1-12 breadcrumb labels
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const title = [listing.year, listing.make.name, listing.model.name, listing.trim?.name]
    .filter(Boolean)
    .join(" ");
  const emirateName = listing.emirate.i18n?.[locale] ?? listing.emirate.name;

  const seoTitle = t("seo.title", { vehicle: title, emirate: emirateName });
  const seoDescription = t("seo.description", {
    price: formatPrice(listing.priceAed, locale),
    mileage: formatMileage(listing.mileageKm, locale),
    emirate: emirateName,
  });
  const ogImage = listing.media[0]
    ? mediaUrl(listing.media[0].variants.detail)
    : null;

  const hasSpecs =
    listing.specsSnapshot !== null && listing.specsSnapshot.groups.length > 0;
  const hasDescription = listing.descriptions.length > 0;

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        {ogImage && <meta property="og:image" content={ogImage} />}
      </Head>

      {/* P1-12 structured data (body placement — see json-ld.tsx docs). */}
      <VehicleJsonLd listing={listing} />
      <BreadcrumbJsonLd
        items={[
          { name: tSeo("breadcrumb.home"), path: "/" },
          { name: listing.make.name, path: `/used-cars/${listing.make.slug}` },
          {
            name: `${listing.make.name} ${listing.model.name}`,
            path: `/used-cars/${listing.make.slug}/${listing.model.slug}`,
          },
          { name: title },
        ]}
      />

      <SiteHeader />

      <main>
        <div className="container-shell py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Gallery media={listing.media} title={title} />
            </div>

            {/* Spans every content row so the panel can stick alongside them. */}
            <div className="lg:row-span-3">
              <div className="lg:sticky lg:top-6">
                <PricePanel listing={listing} title={title} emirateName={emirateName} />
              </div>
            </div>

            {hasSpecs && listing.specsSnapshot && (
              <div className="lg:col-span-2">
                <SpecsSection snapshot={listing.specsSnapshot} />
              </div>
            )}

            {hasDescription && (
              <div className="lg:col-span-2">
                <DescriptionSection descriptions={listing.descriptions} />
              </div>
            )}
          </div>
        </div>

        <SimilarRail modelId={listing.modelId} excludeId={listing.id} />
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<CarDetailPageProps> = async ({
  params,
  locale,
}) => {
  const slug = typeof params?.slug === "string" ? params.slug : "";
  if (!slug) return { notFound: true };

  try {
    const listing = (await getListing(slug)) as ListingDetailFull;
    return {
      props: {
        listing,
        ...(await serverSideTranslations(
          locale ?? nextI18NextConfig.i18n.defaultLocale,
          ["common", "home", "listings", "detail", "seo"],
          nextI18NextConfig,
        )),
      },
    };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return { notFound: true };
    }
    throw error;
  }
};
