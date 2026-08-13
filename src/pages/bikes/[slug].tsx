/**
 * /bikes/[slug] — live bike detail (P6-01). Bikes share the Listing model, so
 * this reuses the car detail component (same design, mk-detail namespace) with
 * its own SSR fetch; similar bikes come from the same make, vehicleType=BIKE.
 */
import type { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import MkdetailPage from "@/pages/cars/[slug]";
import {
  getListing,
  searchListings,
  type Card,
  type ListingDetail,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default MkdetailPage;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  const slug = String(ctx.params?.slug ?? "");
  let listing: ListingDetail | null = null;
  let similar: Card[] = [];
  try {
    listing = await getListing(slug);
    const sim = await searchListings({
      vehicleType: "BIKE",
      makeId: undefined,
      limit: 5,
      sort: "newest",
    }).catch(() => ({ items: [] as Card[], total: 0, hasMore: false }));
    similar = sim.items.filter((s) => s.slug !== slug).slice(0, 4);
  } catch {
    return { notFound: true };
  }
  return {
    props: {
      listing,
      similar,
      ...(await serverSideTranslations(locale, ["common", "mk-detail"], nextI18NextConfig)),
    },
  };
};
