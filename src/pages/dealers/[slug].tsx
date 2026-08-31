/**
 * /dealers/[slug] — public dealer profile. The mockup's page-dealer design
 * (`.mk` layer, mk-dealerProfile i18n x4 + RTL), wired to the real dealer
 * (getPublicDealer) + their live inventory, and carrying the AutoDealer
 * JSON-LD (FR-DP8, §13.1) that the SSR profile needs for SEO. 404 if unknown.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { MarketplaceCard } from "@/components/marketplace/listing-card";
import { mediaUrl } from "@/lib/format";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/toast";
import {
  createSavedSearch,
  getPublicDealer,
  getSavedSearches,
  searchListings,
  type Card,
  type DealerBranch,
  type DealerProfile,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

type Dealer = DealerProfile & { liveListings: number; _count: { listings: number } };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function MkdealerProfilePage({
  dealer, listings, locale,
}: { dealer: Dealer; listings: Card[]; locale: string }) {
  const { t } = useTranslation("mk-dealerProfile");
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [following, setFollowing] = React.useState(false);
  const [followBusy, setFollowBusy] = React.useState(false);

  // "Follow" was a dead button with no model behind it. A saved search scoped
  // to this dealer IS following them — it is the alert pipeline that already
  // exists, rather than a second half-built one.
  React.useEffect(() => {
    if (!token) return;
    getSavedSearches(token)
      .then((rows) => setFollowing(rows.some((r) => r.query?.dealerId === dealer.id)))
      .catch(() => undefined);
  }, [token, dealer.id]);

  const onFollow = async () => {
    if (!token) {
      void router.push(`/login?next=${encodeURIComponent(`/dealers/${dealer.slug}`)}`);
      return;
    }
    if (following) {
      void router.push("/account/saved-searches");
      return;
    }
    setFollowBusy(true);
    try {
      await createSavedSearch(
        { name: dealer.name, query: { dealerId: dealer.id }, frequency: "DAILY" },
        token,
      );
      setFollowing(true);
      toast({ title: t("header.followed", { defaultValue: "Following — you will hear about new stock" }) });
    } catch {
      toast({ title: t("header.followFailed", { defaultValue: "Could not follow this dealer" }), variant: "error" });
    } finally {
      setFollowBusy(false);
    }
  };

  const about = dealer.aboutI18n?.[locale] ?? dealer.aboutI18n?.en ?? "";
  const years = Math.max(1, new Date().getFullYear() - new Date(dealer.createdAt).getFullYear());
  const emirate = dealer.branches[0]?.emirate?.name ?? "UAE";
  const primaryPhone = dealer.branches.find((b: DealerBranch) => b.phone)?.phone ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealer.name,
    url: `https://carsens.ae/dealers/${dealer.slug}`,
    address: {
      "@type": "PostalAddress",
      addressRegion: emirate,
      addressCountry: "AE",
    },
    ...(dealer.brands.length ? { brand: dealer.brands } : {}),
  };

  return (
    <>
      <Head>
        <title>{`${dealer.name} — Carsens`}</title>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <MockupLayout>
        <main id="page-dealer" className="page">
          <div className="dealer-profile-wrap">
            <div className="container">
              <div className="dealer-header">
                {/*
                  The uploaded logo, with initials as the fallback. logoKey has
                  been written by the profile editor and returned by the public
                  API all along, and nothing ever drew it — every dealership
                  showed text initials no matter what they uploaded.
                */}
                <div className="dealer-logo-big">
                  {dealer.logoKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(dealer.logoKey)}
                      alt={dealer.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    initials(dealer.name)
                  )}
                </div>
                <div className="dealer-info">
                  <div className="dealer-name-row">
                    <h1>{dealer.name}</h1>
                    {dealer.verificationStatus === "VERIFIED" && (
                      <span className="verified-tag">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
                        {t("header.verified")}
                      </span>
                    )}
                  </div>
                  <div className="dealer-meta-row">
                    <span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "-2px" }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {" "}{emirate}
                    </span>
                    <span className="mdot">•</span>
                    <span><strong style={{ color: "var(--text)" }}>{dealer.liveListings}</strong> {t("header.carsListedLabel")}</span>
                    <span className="mdot">•</span>
                    <span>{t("header.memberSinceYears", { count: years, defaultValue: `${years} years on Carsens` })}</span>
                  </div>
                </div>
                <div className="dealer-actions">
                  {/* Contact was inert. The branch phone is real data already on
                      the page — call it, or fall back to the branches section. */}
                  {primaryPhone ? (
                    <a href={`tel:${primaryPhone.replace(/[^+\d]/g, "")}`} className="btn btn-primary">
                      {t("header.contact")}
                    </a>
                  ) : (
                    <a href="#dealer-branches" className="btn btn-primary">{t("header.contact")}</a>
                  )}
                  <button
                    type="button"
                    className={following ? "btn btn-primary" : "btn btn-outline"}
                    onClick={() => void onFollow()}
                    disabled={followBusy}
                    aria-pressed={following}
                  >
                    {following
                      ? t("header.following", { defaultValue: "Following" })
                      : t("header.follow")}
                  </button>
                </div>
              </div>

              <div className="dealer-stats">
                <div className="ds-item"><div className="ds-val">{dealer.liveListings}</div><div className="ds-label">{t("stats.activeLabel")}</div></div>
                <div className="ds-item"><div className="ds-val">{years}</div><div className="ds-label">{t("stats.yearsLabel")}</div></div>
                <div className="ds-item"><div className="ds-val">{dealer.branches.length || 1}</div><div className="ds-label">{t("stats.locationsLabel", { defaultValue: "Locations" })}</div></div>
                <div className="ds-item"><div className="ds-val">{dealer.brands.length || "—"}</div><div className="ds-label">{t("stats.brandsLabel", { defaultValue: "Brands" })}</div></div>
              </div>

              <div className="dealer-grid">
                <div className="dealer-main">
                  <section className="dealer-section active">
                    <div className="toolbar">
                      <div className="left"><strong style={{ color: "var(--text)" }}>{dealer.liveListings}</strong> {t("inventory.toolbarFrom", { defaultValue: "cars in stock" })}</div>
                    </div>
                    {listings.length === 0 ? (
                      <p style={{ padding: "40px 0", textAlign: "center", color: "var(--text-3)" }}>{t("inventory.empty", { defaultValue: "No cars listed right now." })}</p>
                    ) : (
                      <div className="result-grid">
                        {listings.map((car) => <MarketplaceCard key={car.id} car={car} />)}
                      </div>
                    )}
                  </section>

                  {about && (
                    <section className="dealer-section" style={{ marginTop: 32 }}>
                      <h2>{t("about.title", { defaultValue: "About" })}</h2>
                      <p style={{ color: "var(--text-2)", lineHeight: 1.7 }}>{about}</p>
                    </section>
                  )}
                </div>

                <aside className="dealer-sidebar">
                  {dealer.branches.length > 0 && (
                    <div className="location-card" id="dealer-branches">
                      <h3>{t("locations.title", { defaultValue: "Locations" })}</h3>
                      {dealer.branches.map((b: DealerBranch) => (
                        <div key={b.id} className="loc-item" style={{ marginTop: 12 }}>
                          <strong>{b.name}</strong>
                          <div style={{ color: "var(--text-3)", fontSize: 13 }}>{b.address ?? b.emirate?.name}</div>
                          {b.phone && <div style={{ color: "var(--text-3)", fontSize: 13 }}>{b.phone}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {dealer.brands.length > 0 && (
                    <div className="location-card" style={{ marginTop: 16 }}>
                      <h3>{t("sidebar.brands", { defaultValue: "Brands" })}</h3>
                      <div className="chips" style={{ marginTop: 10 }}>
                        {dealer.brands.map((brand) => <span key={brand} className="chip">{brand}</span>)}
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, params }) => {
  const slug = String(params?.slug ?? "");
  let dealer: Dealer | null = null;
  try {
    dealer = await getPublicDealer(slug);
  } catch {
    dealer = null;
  }
  if (!dealer) return { notFound: true };

  const res = await searchListings({ dealerId: dealer.id, limit: 9, sort: "newest" }).catch(() => ({ items: [] as Card[] }));

  return {
    props: {
      dealer,
      listings: res.items,
      locale: locale ?? "en",
      ...(await serverSideTranslations(
        locale ?? nextI18NextConfig.i18n.defaultLocale,
        ["common", "mk-dealerProfile"],
        nextI18NextConfig,
      )),
    },
  };
};
