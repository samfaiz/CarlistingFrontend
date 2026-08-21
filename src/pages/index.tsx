/**
 * Home page.
 *
 * The page is LAYOUT-DRIVEN: `GET /homepage` returns the published arrangement
 * of sections and the Studio decides what appears, in what order, styled how.
 * Sections whose markup is structural (hero, body types, sell banner, why-us)
 * keep their bespoke JSX here and are placed by the layout; card rows and the
 * editor-added kinds render through the shared `HomepageSection` component, the
 * same one the Studio preview uses.
 *
 * If nothing is published — a fresh install, or the API being unreachable —
 * the stock order below renders exactly as it always did.
 */
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { AssistantWidget } from "@/components/marketplace/assistant-widget";
import { MarketplaceCard } from "@/components/marketplace/listing-card";
import {
  HomepageSection,
  sectionStyle,
  resolveFieldText,
  type ResolvedSection,
} from "@/components/homepage/section-renderer";
import { searchListings, type Card } from "@/lib/marketplace-api";
import { API_BASE_URL } from "@/lib/api";
import nextI18NextConfig from "../../next-i18next.config.js";

const BODY_TYPES = [
  ["SUV", "18,402"], ["Sedan", "14,128"], ["Coupe", "3,421"], ["Hatchback", "5,892"],
  ["Pickup", "2,734"], ["Convertible", "1,084"], ["Van", "982"], ["Wagon", "416"],
];
const MAKES = [
  "Toyota", "Nissan", "BMW", "Mercedes-Benz", "Lexus", "Audi",
  "Ford", "Honda", "Porsche", "Land Rover", "Kia", "Hyundai",
];
const ARROW = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
);

/** The order the page rendered before it became editable. */
const STOCK_ORDER = [
  "HERO", "BODY_TYPES", "FEATURED_LISTINGS", "BRANDS", "NEW_LISTINGS", "SELL_BANNER", "WHY_US",
];

type T = (key: string) => string;

// ── Structural sections ───────────────────────────────────────────────────────

function Hero({ t, section }: { t: T; section?: ResolvedSection }) {
  const router = useRouter();
  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["make", "priceMax", "yearMin"]) {
      const v = form.get(key);
      if (v) params.set(key, String(v));
    }
    void router.push(`/cars${params.toString() ? `?${params}` : ""}`);
  };

  // The Studio can override the headline and the palette; everything else about
  // the hero is structure, not content.
  const title = section ? resolveFieldText(section.content.title, t) || t("hero.title") : t("hero.title");
  const sub = section ? resolveFieldText(section.content.subtitle, t) || t("hero.sub") : t("hero.sub");
  const style = section ? sectionStyle(section.style) : undefined;

  return (
    <div className="hero" style={style}>
      <div className="container">
        <h1>{title}</h1>
        <p className="sub">{sub}</p>

        <form className="search-card" onSubmit={onSearch}>
          <div className="tabs">
            <button type="button" className="tab active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2" /></svg>
              {t("hero.tabUsed")}
            </button>
            <button type="button" className="tab" onClick={() => void router.push("/new-cars")}>{t("hero.tabNew")}</button>
            <button type="button" className="tab" onClick={() => void router.push("/bikes")}>{t("hero.tabBikes")}</button>
            <button type="button" className="tab" onClick={() => void router.push("/dealers")}>{t("hero.tabDealers")}</button>
          </div>
          <div className="search-body">
            {/* Every control is label-associated: a bare <label> next to a
                <select> is not announced by a screen reader and does not focus
                the field when clicked. */}
            <div className="search-field">
              <label htmlFor="home-make">{t("hero.make")}</label>
              <select id="home-make" name="make" defaultValue="">
                <option value="">{t("hero.anyMake")}</option>
                {MAKES.map((m) => <option key={m} value={m.toLowerCase().replace(/[^a-z]/g, "-")}>{m}</option>)}
              </select>
            </div>
            <div className="search-field">
              <label htmlFor="home-model">{t("hero.model")}</label>
              <select id="home-model" name="model" defaultValue=""><option value="">{t("hero.anyModel")}</option></select>
            </div>
            <div className="search-field">
              <label htmlFor="home-price">{t("hero.price")}</label>
              <select id="home-price" name="priceMax" defaultValue="">
                <option value="">{t("hero.anyPrice")}</option>
                <option value="30000">Under 30,000</option>
                <option value="60000">30,000 – 60,000</option>
                <option value="120000">60,000 – 120,000</option>
                <option value="250000">120,000 – 250,000</option>
              </select>
            </div>
            <div className="search-field">
              <label htmlFor="home-year">{t("hero.year")}</label>
              <select id="home-year" name="yearMin" defaultValue="">
                <option value="">{t("hero.anyYear")}</option>
                <option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option>
              </select>
            </div>
            <div className="search-cta">
              <button className="btn btn-primary btn-lg" type="submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                {t("hero.search")}
              </button>
            </div>
          </div>
        </form>

        <div className="quick-stats">
          <div><strong>60,432</strong> {t("stats.listed")}</div>
          <div><strong>1,247</strong> {t("stats.dealers")}</div>
          <div><strong>4.8★</strong> {t("stats.rating")}</div>
          <div><strong>250+</strong> {t("stats.daily")}</div>
        </div>
      </div>
    </div>
  );
}

function BodyTypes({ t, section }: { t: T; section?: ResolvedSection }) {
  return (
    <section style={section ? sectionStyle(section.style) : undefined}>
      <div className="container">
        <div className="section-head">
          <div><h2>{t("body.title")}</h2><p>{t("body.sub")}</p></div>
          <Link href="/cars" className="view-all">{t("body.viewAll")} {ARROW}</Link>
        </div>
        <div className="bodytypes">
          {BODY_TYPES.map(([name, count]) => (
            <Link key={name} href={`/cars?bodyType=${name.toLowerCase()}`} className="bt-card">
              <div className="icon">
                <svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 22h40M8 22l4-10h24l4 10M14 12l2-5h16l2 5" /><circle cx="14" cy="22" r="3" /><circle cx="34" cy="22" r="3" /></svg>
              </div>
              <div className="name">{t(`bt.${name}`)}</div>
              <div className="count">{count} {t("body.cars")}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SellBanner({ t, section }: { t: T; section?: ResolvedSection }) {
  const style = section ? sectionStyle(section.style) : { paddingTop: 0 };
  return (
    <section style={style}>
      <div className="container">
        <div className="sell-banner">
          <div>
            <h2>{t("sell.title")}</h2>
            <p>{t("sell.sub")}</p>
            <div className="perks">
              {[t("sell.perk1"), t("sell.perk2"), t("sell.perk3")].map((perk) => (
                <span key={perk} className="perk">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg> {perk}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link className="btn btn-xl" href="/sell" style={{ background: "#fff", color: "var(--brand)" }}>{t("sell.cta1")}</Link>
              <Link className="btn btn-xl btn-outline" href="/sell" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.4)" }}>{t("sell.cta2")}</Link>
            </div>
          </div>
          <div className="img-side">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=720&q=80&auto=format" alt="" />
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyUs({ t, section }: { t: T; section?: ResolvedSection }) {
  const style = section ? sectionStyle(section.style) : { paddingTop: 0 };
  return (
    <section style={style}>
      <div className="container">
        <div className="why">
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 700, letterSpacing: "-.01em" }}>{t("why.title")}</h2>
            <p style={{ margin: 0, color: "#bccbe2", fontSize: 15 }}>{t("why.sub")}</p>
          </div>
          <div className="why-grid">
            {[
              [t("why.t1"), t("why.b1")],
              [t("why.t2"), t("why.b2")],
              [t("why.t3"), t("why.b3")],
              [t("why.t4"), t("why.b4")],
            ].map(([title, body]) => (
              <div key={title} className="why-item">
                <div className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /><path d="M9 12l2 2 4-4" /></svg></div>
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The stock card rows, used only when no layout is published. */
function StockCards({ t, cards, titleKey, subKey, ctaKey, href }: {
  t: T; cards: Card[]; titleKey: string; subKey: string; ctaKey: string; href: string;
}) {
  if (cards.length === 0) return null;
  return (
    <section style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="section-head">
          <div><h2>{t(titleKey)}</h2><p>{t(subKey)}</p></div>
          <Link href={href} className="view-all">{t(ctaKey)} {ARROW}</Link>
        </div>
        <div className="cards">{cards.map((car) => <MarketplaceCard key={car.id} car={car} />)}</div>
      </div>
    </section>
  );
}

function StockBrands({ t }: { t: T }) {
  return (
    <section className="brands-section">
      <div className="container">
        <div className="section-head">
          <div><h2>{t("make.title")}</h2><p>{t("make.sub")}</p></div>
          <Link href="/cars" className="view-all">{t("make.all")} {ARROW}</Link>
        </div>
        <div className="brands">
          {MAKES.map((make) => (
            <Link key={make} href={`/cars?make=${make.toLowerCase().replace(/[^a-z]/g, "-")}`} className="brand-card">
              <div className="logo-circle">{make[0]}</div>
              <div className="brand-name">{make}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface HomeProps {
  layout: { status: string; version: number | null; sections: ResolvedSection[] };
}

export default function HomePage({ layout }: HomeProps) {
  const { t } = useTranslation("mk-home");
  const [featured, setFeatured] = React.useState<Card[]>([]);
  const [fresh, setFresh] = React.useState<Card[]>([]);
  const usingLayout = layout.sections.length > 0;

  React.useEffect(() => {
    // Only the stock page needs a client fetch — a published layout arrives with
    // its cards already resolved server-side.
    if (usingLayout) return;
    searchListings({ limit: 8, sort: "newest" })
      .then((res) => {
        setFeatured(res.items.slice(0, 4));
        setFresh(res.items.slice(4, 8));
      })
      .catch(() => undefined);
  }, [usingLayout]);

  const structural = (section: ResolvedSection) => {
    switch (section.kind) {
      case "HERO": return <Hero key={section.id} t={t} section={section} />;
      case "BODY_TYPES": return <BodyTypes key={section.id} t={t} section={section} />;
      case "SELL_BANNER": return <SellBanner key={section.id} t={t} section={section} />;
      case "WHY_US": return <WhyUs key={section.id} t={t} section={section} />;
      default: return <HomepageSection key={section.id} section={section} />;
    }
  };

  return (
    <>
      <Head>
        <title>{`Carsens — ${t("meta.title")}`}</title>
        <meta name="description" content={t("meta.desc")} />
      </Head>
      <MockupLayout>
        <main id="page-home" className="page">
          {usingLayout ? (
            layout.sections.map(structural)
          ) : (
            <>
              <Hero t={t} />
              <BodyTypes t={t} />
              <StockCards t={t} cards={featured} titleKey="featured.title" subKey="featured.sub" ctaKey="featured.seeAll" href="/cars" />
              <StockBrands t={t} />
              <StockCards t={t} cards={fresh} titleKey="fresh.title" subKey="fresh.sub" ctaKey="fresh.browse" href="/cars?sort=newest" />
              <SellBanner t={t} />
              <WhyUs t={t} />
            </>
          )}
        </main>
        <AssistantWidget />
      </MockupLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const lang = locale ?? nextI18NextConfig.i18n.defaultLocale;

  // A home page that fails to build because the layout API blinked is worse
  // than one that renders its stock sections, so this never throws.
  let layout: HomeProps["layout"] = { status: "NONE", version: null, sections: [] };
  try {
    const res = await fetch(`${API_BASE_URL}/homepage?locale=${lang}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const body = (await res.json()) as HomeProps["layout"];
      if (Array.isArray(body.sections)) layout = body;
    }
  } catch {
    // Stock page it is.
  }

  return {
    props: {
      layout,
      ...(await serverSideTranslations(lang, ["common", "mk-home", "mk-assistant"], nextI18NextConfig)),
    },
    // Publishing busts the API cache immediately; this bounds how long the
    // statically-rendered page can lag behind it.
    revalidate: 60,
  };
};

export { STOCK_ORDER };
