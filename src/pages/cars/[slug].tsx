/**
 * /cars/[slug] — car detail. The mockup's page-detail design (`.mk` layer),
 * wired to the real listing (getListing) + real similar cars. Copy stays in
 * the mk-detail i18n namespace (EN/AR/ES/FR + RTL).
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { API_BASE_URL, ApiError } from "@/lib/api";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { MarketplaceCard } from "@/components/marketplace/listing-card";
import { formatMileage, formatPrice, mediaUrl } from "@/lib/format";
import { useCurrency } from "@/components/marketplace/currency-provider";
import { SpecSheet } from "@/components/marketplace/spec-sheet";
import type { SpecSheet as SpecSheetData } from "@/lib/marketplace-api";
import {
  getListing,
  getSpecSheet,
  openConversation,
  revealContact,
  searchListings,
  type Card,
  type ListingDetail,
} from "@/lib/marketplace-api";
import {
  getFinanceConfig,
  getPriceSignal,
  type CalculatorConfig,
  type PriceSignal,
} from "@/lib/market-api";
import { DealBadge } from "@/components/market/deal-badge";
import { DaysOnMarketLine, PriceInsight } from "@/components/market/price-insight";
import { FinanceCalculator, MonthlyFromPrice } from "@/components/market/finance-calculator";
import { BreadcrumbJsonLd, VehicleJsonLd } from "@/components/seo/json-ld";
import nextI18NextConfig from "../../../next-i18next.config.js";

const FUEL: Record<string, string> = { PETROL: "Petrol", DIESEL: "Diesel", HYBRID: "Hybrid", PLUGIN_HYBRID: "Plug-in Hybrid", ELECTRIC: "Electric", OTHER: "—" };
const TRANS: Record<string, string> = { AUTOMATIC: "Automatic", MANUAL: "Manual", CVT: "CVT", DCT: "DCT", OTHER: "—" };

export default function MkdetailPage({
  listing,
  similar,
  signal,
  financeConfig,
  specSheet,
  gone,
}: {
  listing: ListingDetail;
  similar: Card[];
  /**
   * Optional for the same reason the market props are: /bikes/[slug] reuses
   * this component with its own getServerSideProps and does not supply one.
   * Null also covers "the spec endpoint was down", and the section renders
   * nothing rather than an empty shell.
   */
  specSheet?: SpecSheetData | null;
  /*
   * Market signals are OPTIONAL props, and deliberately so. /bikes/[slug]
   * re-exports this component with its own getServerSideProps, which supplies
   * neither of these and does not load the `market` catalogue — so the market
   * UI must be entirely prop-driven and render nothing at all when they are
   * absent, rather than fetching client-side and painting raw keys. Undefined
   * means "never fetched"; null means the market endpoint was down.
   */
  /** The listing was removed: the page answers 410 and says so. */
  gone?: boolean;
  signal?: PriceSignal | null;
  financeConfig?: CalculatorConfig | null;
}) {
  const { t } = useTranslation("mk-detail");
  const [active, setActive] = React.useState(0);
  const router = useRouter();
  const { data: session } = useSession();
  const [phone, setPhone] = React.useState<string | null>(null);
  const { currency, format } = useCurrency();
  const [leadBusy, setLeadBusy] = React.useState<string | null>(null);

  /*
   * Gallery navigation. The track is a scroll-snap carousel, so moving between
   * photos is a scroll rather than a state-driven swap — that keeps the native
   * touch swipe, and scrollIntoView handles Arabic RTL without a direction
   * branch. `active` is derived FROM the scroll position, not the other way
   * round, so a swipe and a thumbnail click stay in agreement.
   *
   * These three live up here with the other hooks, ABOVE the `gone` early
   * return: a 410 render that skipped them changed the hook count between
   * renders, which is a hard React error, not a lint nit.
   */
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  const goToPhoto = React.useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, track.children.length - 1));
    const slide = track.children[clamped] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActive(clamped);
  }, []);

  const onTrackScroll = React.useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    // Math.abs: scrollLeft is negative in RTL in some engines.
    const index = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
    setActive((cur) => (cur === index ? cur : index));
  }, []);

  // Money and dates in the market panels format per locale (Latin digits are
  // forced inside formatPrice/formatRelativeTime, per FR-I5).
  const locale = router.locale ?? "en";

  // P6-02: contact buttons record REAL leads (CALL/WHATSAPP reveal + CHAT).
  const onCall = async () => {
    if (phone) { window.location.href = `tel:${phone}`; return; }
    setLeadBusy("call");
    try {
      const r = await revealContact(listing.id, "CALL", { accessToken: session?.accessToken, source: "detail" });
      if (r.phone) setPhone(r.phone);
    } catch { /* keep button usable */ }
    finally { setLeadBusy(null); }
  };
  const onWhatsApp = async () => {
    setLeadBusy("wa");
    try {
      const r = await revealContact(listing.id, "WHATSAPP", { accessToken: session?.accessToken, source: "detail" });
      const url = r.whatsappUrl ?? (r.phone ? `https://wa.me/${r.phone.replace(/[^\d]/g, "")}` : null);
      if (url) window.open(url, "_blank");
    } catch { /* noop */ }
    finally { setLeadBusy(null); }
  };
  const onMessage = async () => {
    if (!session?.accessToken) { void router.push(`/login?next=/cars/${listing.slug}`); return; }
    setLeadBusy("msg");
    try {
      const convo = await openConversation(listing.id, session.accessToken);
      void router.push(`/account/messages?c=${convo.id}`);
    } catch { /* noop */ }
    finally { setLeadBusy(null); }
  };

  /*
   * A removed listing. This sits AFTER every hook — React requires the same
   * hooks on every render — and BEFORE the first `listing.` dereference, since
   * a 410 response carries no listing at all.
   */
  if (gone || !listing) {
    return (
      <MockupLayout>
        <Head>
          <title>{`${t("gone.title")} — Carsens`}</title>
          <meta name="robots" content="noindex" />
        </Head>
        <main className="page" style={{ padding: "48px 20px", textAlign: "center" }}>
          <h1 style={{ marginBottom: 8 }}>{t("gone.title")}</h1>
          <p style={{ color: "var(--text-3)", marginBottom: 24 }}>{t("gone.body")}</p>
          <Link href="/cars" className="btn btn-primary">
            {t("gone.cta")}
          </Link>
        </main>
      </MockupLayout>
    );
  }

  const title = `${listing.year} ${listing.make.name} ${listing.model.name}${listing.trim ? ` ${listing.trim.name}` : ""}`;
  const photos = listing.media.map((m) => m.variants?.card).filter(Boolean) as string[];

  const desc = listing.descriptions.find((d) => d.locale === "en")?.text ?? listing.descriptions[0]?.text ?? "";
  // Was listing.make.name — a dealer listing showed "Toyota" as the seller.
  const dealer =
    listing.sellerType === "DEALER"
      ? (listing.dealer?.name ?? t("dealer.dealership", { defaultValue: "Dealership" }))
      : t("dealer.private", { defaultValue: "Private seller" });

  return (
    <>
      <Head>
        <title>{`${title} — Carsens`}</title>
        <meta name="description" content={desc.slice(0, 160)} />
      </Head>
      {/* Vehicle + Offer and the breadcrumb trail. These render in the BODY on
          purpose — see json-ld.tsx: next/head drops nested components on
          client-side navigation, and Google parses JSON-LD anywhere. */}
      <VehicleJsonLd listing={listing} />
      <BreadcrumbJsonLd
        items={[
          { name: "Carsens", path: "/" },
          { name: t("breadcrumb.usedCars", { defaultValue: "Used cars" }), path: "/cars" },
          { name: listing.make.name, path: `/cars?make=${listing.make.slug}` },
          // Final crumb carries no path, per BreadcrumbItem's contract.
          { name: title },
        ]}
      />
      <MockupLayout>
        <main id="page-detail" className="page">
          <div className="detail-wrap">
            <div className="container">
              <div className="breadcrumb">
                <Link href="/">{t("breadcrumb.home")}</Link><span className="sep">›</span>
                <Link href="/cars">{t("breadcrumb.usedCars")}</Link><span className="sep">›</span>
                <span className="current">{title}</span>
              </div>

              <div className="detail-head">
                <h1>{title}</h1>
                <p className="detail-sub">{listing.year} • {listing.emirate.name} • {listing.regionalSpec} Specs</p>
              </div>

              <div className="detail-grid">
                {/* `.detail-main` is the mockup's own column class (flex,
                    gap:18px). The port shipped a bare <div>, so every card in
                    this column sat flush against the next one. */}
                <div className="detail-main">
                  {/* GALLERY */}
                  <div className="gallery">
                    <div className="gallery-main">
                      {listing.badges?.includes("featured") && (
                        <span className="badge-detail">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
                          {t("gallery.featured")}
                        </span>
                      )}
                      {photos.length > 0 ? (
                        /*
                          A scroll-snap track, not a single swapped <img>. The
                          thumbnail strip is the ONLY way to change photo and it
                          is display:none on phones, so photos 2..N were
                          unreachable while the counter advertised them.
                          Scroll-driven rather than transform-driven because
                          scrollIntoView respects direction, so it is correct in
                          Arabic RTL for free.
                        */
                        <div className="gallery-track" ref={trackRef} onScroll={onTrackScroll}>
                          {photos.map((ph, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={mediaUrl(ph)}
                              alt={`${title} — ${i + 1}/${photos.length}`}
                              loading={i === 0 ? "eager" : "lazy"}
                              draggable={false}
                            />
                          ))}
                        </div>
                      ) : (
                        <div style={{ aspectRatio: "16/10", background: "var(--brand-surface)" }} />
                      )}
                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="gallery-nav prev"
                            aria-label={t("gallery.previous")}
                            onClick={() => goToPhoto(active - 1)}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 6l-6 6 6 6" /></svg>
                          </button>
                          <button
                            type="button"
                            className="gallery-nav next"
                            aria-label={t("gallery.next")}
                            onClick={() => goToPhoto(active + 1)}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>
                          </button>
                        </>
                      )}
                      <span className="photo-num-large" aria-live="polite">{active + 1}/{photos.length || 1}</span>
                    </div>
                    {photos.length > 1 && (
                      <div className="gallery-thumbs">
                        {photos.map((ph, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={i} className={`thumb${i === active ? " active" : ""}`} src={mediaUrl(ph)} alt="" onClick={() => goToPhoto(i)} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* QUICK SPECS */}
                  <div className="quick-specs">
                    <div className="qs"><div className="qs-label">{t("quickSpecs.year.label")}</div><div className="qs-val">{listing.year}</div></div>
                    <div className="qs"><div className="qs-label">{t("quickSpecs.mileage.label")}</div><div className="qs-val">{formatMileage(listing.mileageKm, "en")}</div></div>
                    <div className="qs"><div className="qs-label">{t("quickSpecs.transmission.label")}</div><div className="qs-val">{TRANS[listing.transmission ?? "OTHER"]}</div></div>
                    <div className="qs"><div className="qs-label">{t("quickSpecs.fuel.label")}</div><div className="qs-val">{FUEL[listing.fuelType ?? "OTHER"]}</div></div>
                    <div className="qs"><div className="qs-label">{t("quickSpecs.body.label")}</div><div className="qs-val">{listing.bodyType?.name ?? "—"}</div></div>
                    <div className="qs"><div className="qs-label">{t("quickSpecs.specs.label")}</div><div className="qs-val">{listing.regionalSpec}</div></div>
                  </div>

                  {/* HOW THIS PRICE COMPARES — deal rating, days on market,
                      price history. Renders nothing without SSR'd signals. */}
                  <PriceInsight signal={signal} locale={locale} />

                  {/* DESCRIPTION */}
                  {desc && (
                    <div className="detail-section">
                      <h2>{t("description.title")}</h2>
                      {desc.split(/\n+/).map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                  )}

                  {/* SPECIFICATIONS */}
                  <SpecSheet sheet={specSheet ?? null} />
                </div>

                {/* STICKY SIDEBAR */}
                <aside className="detail-sidebar">
                  <div className="card-sidebar">
                    <div className="price-block">
                      <div className="price-tag">{formatPrice(listing.priceAed, "en")}{currency !== "AED" && <span style={{ display: "block", fontSize: 14, color: "var(--text-2)", fontWeight: 600 }}>{format(listing.priceAed)}</span>}</div>
                      {listing.isNegotiable && <div className="price-sub">{t("price.negotiable", { defaultValue: "Negotiable" })}</div>}
                      {/* Days on market, the deal verdict, then the monthly.
                          The badge draws nothing at all unless the rating is
                          trustworthy — see DealBadge. */}
                      <DaysOnMarketLine signal={signal} />
                      <DealBadge signal={signal} size="sm" />
                      {financeConfig && (
                        <MonthlyFromPrice priceAed={listing.priceAed} config={financeConfig} locale={locale} />
                      )}
                    </div>

                    <div className="dealer-block">
                      <div className="dealer-row">
                        <div className="dealer-logo">{dealer.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</div>
                        <div style={{ flex: "1" }}>
                          <div className="dealer-name">
                            {dealer}
                            {/* The tick means VERIFIED, not merely "is a dealer". */}
                            {listing.dealer?.verificationStatus === "VERIFIED" && (
                              <svg className="v" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
                            )}
                          </div>
                          <div className="dealer-meta-2">{listing.emirate.name}</div>
                        </div>
                      </div>
                      {listing.dealer?.slug && (
                        <Link href={`/dealers/${listing.dealer.slug}`} className="dealer-link">{t("dealer.viewAll")}</Link>
                      )}
                    </div>

                    <div className="contact-buttons">
                      {/* data-testid because the accessible name is the MASKED number until the
    reveal, so it cannot be matched by text (FR-D6 E2E). */}
                      <button type="button" data-testid="reveal-phone" className="btn btn-primary btn-block btn-lg" disabled={leadBusy === "call"} onClick={() => void onCall()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                        <span>{phone ?? t("contact.phone")}</span>
                      </button>
                      <button type="button" className="btn btn-whatsapp btn-block" disabled={leadBusy === "wa"} onClick={() => void onWhatsApp()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5 0-.1-.2-.2-.5-.4z" /></svg>
                        {t("contact.whatsapp")}
                      </button>
                      <button type="button" data-testid="start-chat" className="btn btn-outline btn-block" disabled={leadBusy === "msg"} onClick={() => void onMessage()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        {t("contact.message")}
                      </button>
                      <a
                        className="btn btn-outline btn-block"
                        href={`${API_BASE_URL}/pdf/listings/${listing.slug}`}
                        target="_blank"
                        rel="noopener"
                      >
                        📄 {t("contact.pdf", { defaultValue: "Download spec sheet (PDF)" })}
                      </a>
                    </div>
                  </div>

                  {/* FINANCE CALCULATOR — a second sidebar card; `.detail-sidebar`
                      is already a flex column with a gap, so no new CSS. */}
                  {financeConfig && (
                    <FinanceCalculator
                      listingId={listing.id}
                      priceAed={listing.priceAed}
                      config={financeConfig}
                      accessToken={session?.accessToken}
                      locale={locale}
                    />
                  )}
                </aside>
              </div>

              {/* SIMILAR */}
              {similar.length > 0 && (
                <section className="similar-section">
                  <h2>{t("similar.title", { defaultValue: "Similar cars" })}</h2>
                  <div className="cards">
                    {similar.map((car) => <MarketplaceCard key={car.id} car={car} />)}
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
        {/*
          Mobile action bar. On a phone the price and all three contact CTAs sit in
          the sidebar, which stacks BELOW the full specification section — the call
          button landed ~870px down a 4000px page. On a classifieds listing that is
          the conversion action, so it is pinned. Hidden above the phone breakpoint,
          where the sidebar is already beside the gallery.
        */}
        <div className="detail-action-bar">
          <div className="dab-price">
            <span className="dab-label">{t("contact.priceLabel", { defaultValue: "Price" })}</span>
            <strong>{formatPrice(listing.priceAed, "en")}</strong>
          </div>
          <button
            type="button"
            className="btn btn-whatsapp dab-wa"
            disabled={leadBusy === "wa"}
            onClick={() => void onWhatsApp()}
            aria-label={t("contact.whatsapp")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5 0-.1-.2-.2-.5-.4z" /></svg>
          </button>
          <button
            type="button"
            className="btn btn-primary dab-call"
            disabled={leadBusy === "call"}
            onClick={() => void onCall()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
            <span>{phone ?? t("contact.phone")}</span>
          </button>
        </div>

      </MockupLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, params, res }) => {
  const slug = String(params?.slug ?? "");
  let listing: ListingDetail | null = null;
  try {
    listing = await getListing(slug);
  } catch (error) {
    /*
     * A removed listing answers 410 Gone, not 404. The row is never deleted, so
     * the slug stays reserved forever and the URL is permanently retired —
     * which is exactly what 410 tells a crawler, and 404 does not. Funnelling
     * it into notFound() threw that signal away and left the car in the index.
     */
    if (error instanceof ApiError && error.statusCode === 410) {
      res.statusCode = 410;
      return { props: { gone: true, ...(await serverSideTranslations(locale ?? "en", ["common", "mk-detail"], nextI18NextConfig)) } };
    }
    listing = null;
  }
  if (!listing) return { notFound: true };

  /*
   * The market signals are fetched here rather than in the browser for three
   * reasons: the deal badge is then in the HTML a crawler sees, there is no
   * layout shift under the price, and — because the calculator's defaults
   * arrive with the page — dragging its sliders makes ZERO client requests,
   * which is what keeps it off the 120/min global throttle. Both are
   * `.catch(() => null)`: a market outage must cost the badge, not the page.
   */
  const [signal, financeConfig, similarRes, specSheet] = await Promise.all([
    getPriceSignal(listing.id).catch(() => null),
    getFinanceConfig().catch(() => null),
    searchListings({
      makeId: listing.make.slug ? undefined : undefined,
      vehicleType: listing.vehicleType,
      limit: 4,
      sort: "newest",
    }).catch(() => ({ items: [] as Card[] })),
    // Server-side so the specification table is in the HTML a crawler reads and
    // the page does not reflow when it lands. A spec outage costs the table,
    // not the car page.
    getSpecSheet(slug).catch(() => null),
  ]);
  const similar = similarRes.items.filter((c) => c.slug !== slug).slice(0, 4);

  return {
    props: {
      listing,
      similar,
      signal,
      financeConfig,
      specSheet,
      ...(await serverSideTranslations(
        locale ?? nextI18NextConfig.i18n.defaultLocale,
        ["common", "mk-detail", "market"],
        nextI18NextConfig,
      )),
    },
  };
};
