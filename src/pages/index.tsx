/**
 * Home (page-home) — rebuilt to match carsens-FullPage interactive design.html
 * exactly, wrapped in MockupLayout / the `.mk` design layer. Presentational
 * sections (hero copy, body-type tiles, "why", article teasers) carry the
 * mockup's content; the Featured and Newly-listed rails are populated from the
 * live search API so the page shows real inventory.
 */
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { MarketplaceCard } from "@/components/marketplace/listing-card";
import { searchListings, type Card } from "@/lib/marketplace-api";
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

export default function HomePage() {
  const router = useRouter();
  const [featured, setFeatured] = React.useState<Card[]>([]);
  const [fresh, setFresh] = React.useState<Card[]>([]);

  React.useEffect(() => {
    searchListings({ limit: 8, sort: "newest" })
      .then((res) => {
        setFeatured(res.items.slice(0, 4));
        setFresh(res.items.slice(4, 8));
      })
      .catch(() => undefined);
  }, []);

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

  return (
    <>
      <Head>
        <title>Carsens — Buy &amp; Sell Cars in UAE</title>
        <meta name="description" content="Over 60,000 new & used cars from 1,200 trusted dealers across Dubai, Abu Dhabi, Sharjah and beyond." />
      </Head>
      <MockupLayout>
        <main id="page-home" className="page">
          {/* HERO */}
          <div className="hero">
            <div className="container">
              <h1>Find your perfect car in the UAE</h1>
              <p className="sub">Over 60,000 new &amp; used cars from 1,200 trusted dealers across Dubai, Abu Dhabi, Sharjah and beyond.</p>

              <form className="search-card" onSubmit={onSearch}>
                <div className="tabs">
                  <button type="button" className="tab active">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2" /></svg>
                    Used Cars
                  </button>
                  <button type="button" className="tab">New Cars</button>
                  <button type="button" className="tab">Bikes</button>
                  <button type="button" className="tab">Dealers</button>
                </div>
                <div className="search-body">
                  <div className="search-field">
                    <label>Make</label>
                    <select name="make" defaultValue="">
                      <option value="">Any make</option>
                      {MAKES.map((m) => <option key={m} value={m.toLowerCase().replace(/[^a-z]/g, "-")}>{m}</option>)}
                    </select>
                  </div>
                  <div className="search-field">
                    <label>Model</label>
                    <select name="model" defaultValue=""><option value="">Any model</option></select>
                  </div>
                  <div className="search-field">
                    <label>Price (AED)</label>
                    <select name="priceMax" defaultValue="">
                      <option value="">Any price</option>
                      <option value="30000">Under 30,000</option>
                      <option value="60000">30,000 – 60,000</option>
                      <option value="120000">60,000 – 120,000</option>
                      <option value="250000">120,000 – 250,000</option>
                    </select>
                  </div>
                  <div className="search-field">
                    <label>Year</label>
                    <select name="yearMin" defaultValue="">
                      <option value="">Any year</option>
                      <option value="2024">2024</option><option value="2023">2023</option><option value="2022">2022</option>
                    </select>
                  </div>
                  <div className="search-cta">
                    <button className="btn btn-primary btn-lg" type="submit">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                      Search cars
                    </button>
                  </div>
                </div>
              </form>

              <div className="quick-stats">
                <div><strong>60,432</strong> cars listed</div>
                <div><strong>1,247</strong> verified dealers</div>
                <div><strong>4.8★</strong> average rating</div>
                <div><strong>250+</strong> cars added daily</div>
              </div>
            </div>
          </div>

          {/* BROWSE BY BODY TYPE */}
          <section>
            <div className="container">
              <div className="section-head">
                <div><h2>Browse by body type</h2><p>Find cars that match your lifestyle</p></div>
                <Link href="/cars" className="view-all">View all {ARROW}</Link>
              </div>
              <div className="bodytypes">
                {BODY_TYPES.map(([name, count]) => (
                  <Link key={name} href={`/cars?bodyType=${name.toLowerCase()}`} className="bt-card">
                    <div className="icon">
                      <svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 22h40M8 22l4-10h24l4 10M14 12l2-5h16l2 5" /><circle cx="14" cy="22" r="3" /><circle cx="34" cy="22" r="3" /></svg>
                    </div>
                    <div className="name">{name}</div>
                    <div className="count">{count} cars</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURED CARS (real data) */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div><h2>Featured cars</h2><p>Hand-picked premium listings from verified dealers</p></div>
                <Link href="/cars" className="view-all">See all featured {ARROW}</Link>
              </div>
              <div className="cards">
                {featured.map((car) => <MarketplaceCard key={car.id} car={car} />)}
              </div>
            </div>
          </section>

          {/* BROWSE BY MAKE */}
          <section className="brands-section">
            <div className="container">
              <div className="section-head">
                <div><h2>Browse by make</h2><p>Shop the UAE&apos;s most popular brands</p></div>
                <Link href="/cars" className="view-all">All makes {ARROW}</Link>
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

          {/* NEWLY LISTED (real data) */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div><h2>Newly listed</h2><p>The latest cars added across the UAE</p></div>
                <Link href="/cars?sort=newest" className="view-all">Browse all {ARROW}</Link>
              </div>
              <div className="cards">
                {fresh.map((car) => <MarketplaceCard key={car.id} car={car} />)}
              </div>
            </div>
          </section>

          {/* SELL BANNER */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="sell-banner">
                <div>
                  <h2>Sell your car. Fast.</h2>
                  <p>Reach over 2 million monthly buyers across the UAE. List in under 3 minutes — free for individuals.</p>
                  <div className="perks">
                    {["Free listings for individuals", "2M+ monthly visitors", "Sell within 14 days"].map((perk) => (
                      <span key={perk} className="perk">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg> {perk}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link className="btn btn-xl" href="/sell" style={{ background: "#fff", color: "var(--brand)" }}>List your car free</Link>
                    <Link className="btn btn-xl btn-outline" href="/sell" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.4)" }}>Get instant valuation</Link>
                  </div>
                </div>
                <div className="img-side">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=720&q=80&auto=format" alt="" />
                </div>
              </div>
            </div>
          </section>

          {/* WHY CARSENS */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="why">
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 700, letterSpacing: "-.01em" }}>Why buy &amp; sell on Carsens?</h2>
                  <p style={{ margin: 0, color: "#bccbe2", fontSize: 15 }}>Built for the UAE auto market with the trust and speed you expect.</p>
                </div>
                <div className="why-grid">
                  {[
                    ["Verified dealers", "Every dealer is background-checked and rated by real buyers in the UAE."],
                    ["Real-time inventory", "Listings update every 5 minutes. No expired stock, no wasted phone calls."],
                    ["Inspection at home", "Book a free 200-point inspection at your location before you commit."],
                    ["Easy financing", "Pre-approved loans from 7 UAE banks. Get a decision in minutes."],
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
        </main>
      </MockupLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "home", "listings"],
      nextI18NextConfig,
    )),
  },
});
