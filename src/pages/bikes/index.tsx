import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function MkbikesPage() {
  const { t } = useTranslation("mk-bikes");
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-bikes" className="page">

          {/* BIKES HERO */}
          <div className="hero" style={{ background: "linear-gradient(180deg,rgba(35,65,107,.85),rgba(35,65,107,.6)),url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1800&q=80&auto=format') center/cover no-repeat" }}>
            <div className="container">
              <h1>{t("hero.title")}</h1>
              <p className="sub">{t("hero.sub")}</p>

              <div className="search-card">
                <div className="tabs">
                  <button className="tab active">
                    <svg width="20" height="16" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="22" r="4" /><circle cx="36" cy="22" r="4" /><path d="M10 22 L20 14 L30 14 L36 22 M14 14 L20 8 L26 8" /></svg>
                    {t("hero.tabs.all")}
                  </button>
                  <button className="tab">{t("hero.tabs.sport")}</button>
                  <button className="tab">{t("hero.tabs.cruiser")}</button>
                  <button className="tab">{t("hero.tabs.adventure")}</button>
                  <button className="tab">{t("hero.tabs.offroad")}</button>
                </div>
                <div className="search-body">
                  <div className="search-field">
                    <label>{t("filters.make")}</label>
                    <select>
                      <option>{t("filters.anyMake")}</option>
                      <option>Harley-Davidson</option><option>BMW Motorrad</option><option>Ducati</option>
                      <option>Kawasaki</option><option>Honda</option><option>Yamaha</option>
                      <option>KTM</option><option>Suzuki</option><option>Triumph</option><option>Aprilia</option>
                    </select>
                  </div>
                  <div className="search-field">
                    <label>{t("filters.model")}</label>
                    <select><option>{t("filters.anyModel")}</option></select>
                  </div>
                  <div className="search-field">
                    <label>{t("filters.price")}</label>
                    <select>
                      <option>{t("filters.anyPrice")}</option>
                      <option>{t("filters.priceUnder20")}</option><option>{t("filters.price2050")}</option>
                      <option>{t("filters.price50100")}</option><option>{t("filters.price100plus")}</option>
                    </select>
                  </div>
                  <div className="search-field">
                    <label>{t("filters.engine")}</label>
                    <select>
                      <option>{t("filters.anySize")}</option>
                      <option>{t("filters.engineUnder250")}</option><option>{t("filters.engine250500")}</option>
                      <option>{t("filters.engine500800")}</option><option>{t("filters.engine8001000")}</option><option>{t("filters.engine1000plus")}</option>
                    </select>
                  </div>
                  <div className="search-cta">
                    <button className="btn btn-primary btn-lg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                      {t("hero.searchCta")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="quick-stats">
                <div><strong>12,432</strong> {t("stats.listed")}</div>
                <div><strong>380</strong> {t("stats.sellers")}</div>
                <div><strong>4.7★</strong> {t("stats.rating")}</div>
                <div><strong>120+</strong> {t("stats.weekly")}</div>
              </div>
            </div>
          </div>

          {/* BROWSE BY TYPE */}
          <section>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("types.title")}</h2>
                  <p>{t("types.sub")}</p>
                </div>
                <a href="#" className="view-all">{t("common.viewAll")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></a>
              </div>
              <div className="bodytypes">
                <div className="bt-card"><div className="icon"><svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="22" r="4" /><circle cx="36" cy="22" r="4" /><path d="M10 22 L20 14 L30 14 L36 22 M14 14 L20 8 L26 8 M28 14 L34 10" /></svg></div><div className="name">{t("types.sport.name")}</div><div className="count">{t("types.sport.count")}</div></div>
                <div className="bt-card"><div className="icon"><svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="22" r="4" /><circle cx="40" cy="22" r="4" /><path d="M8 22 L18 18 L30 18 L40 22 M16 18 L20 12 L24 12 L26 18" /></svg></div><div className="name">{t("types.cruiser.name")}</div><div className="count">{t("types.cruiser.count")}</div></div>
                <div className="bt-card"><div className="icon"><svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="22" r="4" /><circle cx="36" cy="22" r="4" /><path d="M10 22 L20 12 L28 12 L36 22 M16 12 L20 4 L26 4 M28 12 L32 8" /></svg></div><div className="name">{t("types.adventure.name")}</div><div className="count">{t("types.adventure.count")}</div></div>
                <div className="bt-card"><div className="icon"><svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="22" r="4" /><circle cx="36" cy="22" r="4" /><path d="M10 22 L20 14 L30 14 L36 22 M18 14 L22 8 L26 8" /></svg></div><div className="name">{t("types.naked.name")}</div><div className="count">{t("types.naked.count")}</div></div>
                <div className="bt-card"><div className="icon"><svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="22" r="4" /><circle cx="36" cy="22" r="4" /><path d="M10 22 L20 16 L30 16 L36 22 M18 16 L22 10 L26 10" /></svg></div><div className="name">{t("types.standard.name")}</div><div className="count">{t("types.standard.count")}</div></div>
                <div className="bt-card"><div className="icon"><svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="22" r="5" /><circle cx="36" cy="22" r="5" /><path d="M10 22 L18 10 L26 10 L34 4 M22 10 L28 16 L34 22" /></svg></div><div className="name">{t("types.offroad.name")}</div><div className="count">{t("types.offroad.count")}</div></div>
                <div className="bt-card"><div className="icon"><svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="22" r="4" /><circle cx="40" cy="22" r="4" /><path d="M8 22 L16 14 L32 14 L40 22 M14 14 L18 8 L26 8 L30 14 M32 18 L38 18" /></svg></div><div className="name">{t("types.touring.name")}</div><div className="count">{t("types.touring.count")}</div></div>
                <div className="bt-card"><div className="icon"><svg width="48" height="28" viewBox="0 0 48 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="22" r="4" /><circle cx="36" cy="22" r="4" /><path d="M10 22 L14 16 L30 16 L36 22 M20 16 L20 10 L26 10" /></svg></div><div className="name">{t("types.scooter.name")}</div><div className="count">{t("types.scooter.count")}</div></div>
              </div>
            </div>
          </section>

          {/* FEATURED BIKES */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("featured.title")}</h2>
                  <p>{t("featured.sub")}</p>
                </div>
                <a href="#" className="view-all">{t("featured.seeAll")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></a>
              </div>
              <div className="cards">

                <Link href="/cars/demo" className="card">
                  <div className="media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=720&q=80&auto=format" alt="" />
                    <span className="badge">{t("featured.cards.0.badge")}</span>
                    <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                    <span className="photo-count"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg> 18</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">Ducati Panigale V4 SP2</h3>
                    <p className="card-sub">{t("featured.cards.0.sub")}</p>
                    <div className="price">AED 168,000 <small>{t("featured.cards.0.finance")}</small></div>
                    <div className="specs">
                      <span className="spec">{t("featured.cards.0.km")}</span>
                      <span className="spec">{t("featured.cards.0.type")}</span>
                      <span className="spec">{t("featured.cards.0.power")}</span>
                    </div>
                    <div className="card-foot">
                      <div className="dealer"><span className="avatar">RS</span> RS Motorcycles</div>
                      <span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 600 }}>{t("common.verified")}</span>
                    </div>
                  </div>
                </Link>

                <Link href="/cars/demo" className="card">
                  <div className="media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1568708476-cdaeae3196b8?w=720&q=80&auto=format" alt="" />
                    <span className="badge">{t("featured.cards.1.badge")}</span>
                    <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                    <span className="photo-count"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg> 24</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">BMW R1250GS Adventure</h3>
                    <p className="card-sub">{t("featured.cards.1.sub")}</p>
                    <div className="price">AED 92,000 <small>{t("featured.cards.1.finance")}</small></div>
                    <div className="specs">
                      <span className="spec">{t("featured.cards.1.km")}</span>
                      <span className="spec">{t("featured.cards.1.type")}</span>
                      <span className="spec">{t("featured.cards.1.power")}</span>
                    </div>
                    <div className="card-foot">
                      <div className="dealer"><span className="avatar">MR</span> Motorrad Dubai</div>
                      <span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 600 }}>{t("common.verified")}</span>
                    </div>
                  </div>
                </Link>

                <Link href="/cars/demo" className="card">
                  <div className="media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=720&q=80&auto=format" alt="" />
                    <span className="badge badge-warning">{t("featured.cards.2.badge")}</span>
                    <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                    <span className="photo-count"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg> 20</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">Harley-Davidson Street Glide</h3>
                    <p className="card-sub">{t("featured.cards.2.sub")}</p>
                    <div className="price">AED 78,000 <small style={{ textDecoration: "line-through", color: "var(--text-3)", marginLeft: "6px" }}>AED 88,000</small></div>
                    <div className="specs">
                      <span className="spec">{t("featured.cards.2.km")}</span>
                      <span className="spec">{t("featured.cards.2.type")}</span>
                      <span className="spec">{t("featured.cards.2.power")}</span>
                    </div>
                    <div className="card-foot">
                      <div className="dealer"><span className="avatar">HD</span> H-D Sharjah</div>
                      <span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 600 }}>{t("common.verified")}</span>
                    </div>
                  </div>
                </Link>

                <Link href="/cars/demo" className="card">
                  <div className="media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=720&q=80&auto=format" alt="" />
                    <span className="badge badge-success">{t("featured.cards.3.badge")}</span>
                    <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                    <span className="photo-count"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg> 15</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">Kawasaki Ninja ZX-10R</h3>
                    <p className="card-sub">{t("featured.cards.3.sub")}</p>
                    <div className="price">AED 68,000 <small>{t("featured.cards.3.finance")}</small></div>
                    <div className="specs">
                      <span className="spec">{t("featured.cards.3.km")}</span>
                      <span className="spec">{t("featured.cards.3.type")}</span>
                      <span className="spec">{t("featured.cards.3.power")}</span>
                    </div>
                    <div className="card-foot">
                      <div className="dealer"><span className="avatar">KM</span> Kawasaki Motors</div>
                      <span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 600 }}>{t("common.verified")}</span>
                    </div>
                  </div>
                </Link>

              </div>
            </div>
          </section>

          {/* BROWSE BY MAKE */}
          <section className="brands-section">
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("makes.title")}</h2>
                  <p>{t("makes.sub")}</p>
                </div>
                <a href="#" className="view-all">{t("makes.allBrands")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></a>
              </div>
              <div className="brands">
                <div className="brand-card"><div className="logo-circle">H</div><div className="name">Harley-Davidson</div><div className="count">1,842</div></div>
                <div className="brand-card"><div className="logo-circle">B</div><div className="name">BMW Motorrad</div><div className="count">1,520</div></div>
                <div className="brand-card"><div className="logo-circle">D</div><div className="name">Ducati</div><div className="count">1,128</div></div>
                <div className="brand-card"><div className="logo-circle">K</div><div className="name">Kawasaki</div><div className="count">1,420</div></div>
                <div className="brand-card"><div className="logo-circle">Y</div><div className="name">Yamaha</div><div className="count">1,684</div></div>
                <div className="brand-card"><div className="logo-circle">H</div><div className="name">Honda</div><div className="count">1,892</div></div>
                <div className="brand-card"><div className="logo-circle">K</div><div className="name">KTM</div><div className="count">820</div></div>
                <div className="brand-card"><div className="logo-circle">S</div><div className="name">Suzuki</div><div className="count">784</div></div>
                <div className="brand-card"><div className="logo-circle">T</div><div className="name">Triumph</div><div className="count">486</div></div>
                <div className="brand-card"><div className="logo-circle">A</div><div className="name">Aprilia</div><div className="count">312</div></div>
                <div className="brand-card"><div className="logo-circle">I</div><div className="name">Indian</div><div className="count">196</div></div>
                <div className="brand-card"><div className="logo-circle">M</div><div className="name">MV Agusta</div><div className="count">128</div></div>
                <div className="brand-card"><div className="logo-circle">V</div><div className="name">Vespa</div><div className="count">218</div></div>
                <div className="brand-card"><div className="logo-circle">R</div><div className="name">Royal Enfield</div><div className="count">386</div></div>
                <div className="brand-card"><div className="logo-circle">B</div><div className="name">Benelli</div><div className="count">142</div></div>
                <div className="brand-card"><div className="logo-circle">+</div><div className="name">{t("makes.viewAll")}</div><div className="count">{t("makes.viewAllCount")}</div></div>
              </div>
            </div>
          </section>

          {/* CATEGORIES TILES */}
          <section>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("categories.title")}</h2>
                  <p>{t("categories.sub")}</p>
                </div>
              </div>
              <div className="categories">
                <a href="#" className="cat-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&q=80&auto=format')" }}>
                  <div className="cta"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg></div>
                  <div className="cat-body"><h3>{t("categories.sport.title")}</h3><p>{t("categories.sport.count")}</p></div>
                </a>
                <a href="#" className="cat-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&q=80&auto=format')" }}>
                  <div className="cta"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg></div>
                  <div className="cat-body"><h3>{t("categories.cruisers.title")}</h3><p>{t("categories.cruisers.count")}</p></div>
                </a>
                <a href="#" className="cat-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1568708476-cdaeae3196b8?w=900&q=80&auto=format')" }}>
                  <div className="cta"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg></div>
                  <div className="cat-body"><h3>{t("categories.adventure.title")}</h3><p>{t("categories.adventure.count")}</p></div>
                </a>
                <a href="#" className="cat-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1577563682708-c45e5e29a2da?w=900&q=80&auto=format')" }}>
                  <div className="cta"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg></div>
                  <div className="cat-body"><h3>{t("categories.classic.title")}</h3><p>{t("categories.classic.count")}</p></div>
                </a>
              </div>
            </div>
          </section>

          {/* NEWLY LISTED */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("newly.title")}</h2>
                  <p>{t("newly.sub")}</p>
                </div>
                <a href="#" className="view-all">{t("common.seeAll")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></a>
              </div>
              <div className="cards">

                <Link href="/cars/demo" className="card">
                  <div className="media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1591216105303-3f8dcffe5fa1?w=720&q=80&auto=format" alt="" />
                    <span className="badge badge-success">{t("newly.cards.0.badge")}</span>
                    <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                    <span className="photo-count">{t("newly.cards.0.photos")}</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">KTM 1290 Super Duke RR</h3>
                    <p className="card-sub">{t("newly.cards.0.sub")}</p>
                    <div className="price">AED 95,000</div>
                    <div className="specs">
                      <span className="spec">{t("newly.cards.0.km")}</span>
                      <span className="spec">{t("newly.cards.0.type")}</span>
                      <span className="spec">{t("newly.cards.0.power")}</span>
                    </div>
                    <div className="card-foot"><div className="dealer"><span className="avatar">KO</span> KTM Orange Dubai</div></div>
                  </div>
                </Link>

                <Link href="/cars/demo" className="card">
                  <div className="media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=720&q=80&auto=format" alt="" />
                    <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                    <span className="photo-count">{t("newly.cards.1.photos")}</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">Triumph Bonneville T120</h3>
                    <p className="card-sub">{t("newly.cards.1.sub")}</p>
                    <div className="price">AED 52,000</div>
                    <div className="specs">
                      <span className="spec">{t("newly.cards.1.km")}</span>
                      <span className="spec">{t("newly.cards.1.type")}</span>
                      <span className="spec">{t("newly.cards.1.power")}</span>
                    </div>
                    <div className="card-foot"><div className="dealer"><span className="avatar">TC</span> Triumph Concession</div></div>
                  </div>
                </Link>

                <Link href="/cars/demo" className="card">
                  <div className="media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1577563682708-c45e5e29a2da?w=720&q=80&auto=format" alt="" />
                    <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                    <span className="photo-count">{t("newly.cards.2.photos")}</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">Yamaha MT-09 SP</h3>
                    <p className="card-sub">{t("newly.cards.2.sub")}</p>
                    <div className="price">AED 48,500</div>
                    <div className="specs">
                      <span className="spec">{t("newly.cards.2.km")}</span>
                      <span className="spec">{t("newly.cards.2.type")}</span>
                      <span className="spec">{t("newly.cards.2.power")}</span>
                    </div>
                    <div className="card-foot"><div className="dealer"><span className="avatar">YM</span> Yamaha Motors UAE</div></div>
                  </div>
                </Link>

                <Link href="/cars/demo" className="card">
                  <div className="media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1558980664-1db506751c42?w=720&q=80&auto=format" alt="" />
                    <span className="badge badge-warning">{t("newly.cards.3.badge")}</span>
                    <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                    <span className="photo-count">{t("newly.cards.3.photos")}</span>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">Honda Africa Twin Adventure Sports</h3>
                    <p className="card-sub">{t("newly.cards.3.sub")}</p>
                    <div className="price">AED 75,000 <small style={{ textDecoration: "line-through", color: "var(--text-3)", marginLeft: "6px" }}>AED 82,000</small></div>
                    <div className="specs">
                      <span className="spec">{t("newly.cards.3.km")}</span>
                      <span className="spec">{t("newly.cards.3.type")}</span>
                      <span className="spec">{t("newly.cards.3.power")}</span>
                    </div>
                    <div className="card-foot"><div className="dealer"><span className="avatar">HM</span> Honda Motors AD</div></div>
                  </div>
                </Link>

              </div>
            </div>
          </section>

          {/* GEAR & ACCESSORIES PROMO */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="sell-banner" style={{ background: "linear-gradient(135deg,#1B3556 0%,#3B82F6 100%)" }}>
                <div>
                  <h2>{t("gear.title")}</h2>
                  <p>{t("gear.sub")}</p>
                  <div className="perks">
                    <span className="perk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg> {t("gear.perk1")}</span>
                    <span className="perk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg> {t("gear.perk2")}</span>
                    <span className="perk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg> {t("gear.perk3")}</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <a className="btn btn-xl" href="#" style={{ background: "#fff", color: "var(--brand)" }}>{t("gear.shop")}</a>
                    <a className="btn btn-xl btn-outline" href="#" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.4)" }}>{t("gear.browse")}</a>
                  </div>
                </div>
                <div className="img-side">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1591216105303-3f8dcffe5fa1?w=720&q=80&auto=format" alt="" />
                </div>
              </div>
            </div>
          </section>

          {/* BIKE NEWS */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("news.title")}</h2>
                  <p>{t("news.sub")}</p>
                </div>
                <a href="#" className="view-all">{t("news.allArticles")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></a>
              </div>
              <div className="articles">
                <a href="#" className="article">
                  <div className="media">{ }<img src="https://images.unsplash.com/photo-1568708476-cdaeae3196b8?w=900&q=80&auto=format" alt="" /></div>
                  <div className="article-body">
                    <span className="tag">{t("news.articles.0.tag")}</span>
                    <h3>{t("news.articles.0.title")}</h3>
                    <div className="meta"><span>{t("news.articles.0.date")}</span><span>•</span><span>{t("news.articles.0.read")}</span></div>
                  </div>
                </a>
                <a href="#" className="article">
                  <div className="media">{ }<img src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=900&q=80&auto=format" alt="" /></div>
                  <div className="article-body">
                    <span className="tag">{t("news.articles.1.tag")}</span>
                    <h3>{t("news.articles.1.title")}</h3>
                    <div className="meta"><span>{t("news.articles.1.date")}</span><span>•</span><span>{t("news.articles.1.read")}</span></div>
                  </div>
                </a>
                <a href="#" className="article">
                  <div className="media">{ }<img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&q=80&auto=format" alt="" /></div>
                  <div className="article-body">
                    <span className="tag">{t("news.articles.2.tag")}</span>
                    <h3>{t("news.articles.2.title")}</h3>
                    <div className="meta"><span>{t("news.articles.2.date")}</span><span>•</span><span>{t("news.articles.2.read")}</span></div>
                  </div>
                </a>
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
      ["common", "mk-bikes"],
      nextI18NextConfig,
    )),
  },
});
