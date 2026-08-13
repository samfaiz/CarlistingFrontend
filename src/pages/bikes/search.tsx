import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function MkbikeSearchPage() {
  const { t } = useTranslation("mk-bikeSearch");
  const makeOpts = t("compact.makeOpts", { returnObjects: true }) as string[];
  const modelOpts = t("compact.modelOpts", { returnObjects: true }) as string[];
  const engineOpts = t("compact.engineOpts", { returnObjects: true }) as string[];
  const yearOpts = t("compact.yearOpts", { returnObjects: true }) as string[];
  const emirateOpts = t("compact.emirateOpts", { returnObjects: true }) as string[];
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-bikes-listings" className="page">
          <div className="listings-wrap">
            <div className="container">

              <div className="breadcrumb">
                <Link href="/">{t("breadcrumb.home")}</Link><span className="sep">›</span>
                <Link href="/bikes">{t("breadcrumb.bikes")}</Link><span className="sep">›</span>
                <span className="current">{t("breadcrumb.current")}</span>
              </div>

              <div className="title-row">
                <div>
                  <h1>{t("title.heading")} <span className="count">{t("title.count")}</span></h1>
                  <p className="results-meta">{t("title.meta")}</p>
                </div>
                <button className="save-search-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                  {t("title.saveSearch")}
                </button>
              </div>

              {/* Compact search */}
              <div className="compact-search">
                <div className="compact-field">
                  <label>{t("compact.make")}</label>
                  <select>{makeOpts.map((o, i) => <option key={i}>{o}</option>)}</select>
                </div>
                <div className="compact-field">
                  <label>{t("compact.model")}</label>
                  <select>{modelOpts.map((o, i) => <option key={i}>{o}</option>)}</select>
                </div>
                <div className="compact-field">
                  <label>{t("compact.engine")}</label>
                  <select>{engineOpts.map((o, i) => <option key={i}>{o}</option>)}</select>
                </div>
                <div className="compact-field">
                  <label>{t("compact.year")}</label>
                  <select>{yearOpts.map((o, i) => <option key={i}>{o}</option>)}</select>
                </div>
                <div className="compact-field">
                  <label>{t("compact.emirate")}</label>
                  <select>{emirateOpts.map((o, i) => <option key={i}>{o}</option>)}</select>
                </div>
                <button className="btn btn-primary btn-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  {t("compact.update")}
                </button>
              </div>

              <div className="search-grid">

                {/* ============= FILTERS ============= */}
                <aside className="filters-card">
                  <div className="filters-head">
                    <h3>{t("filters.title")}</h3>
                    <button className="reset">{t("filters.reset")}</button>
                  </div>
                  <div className="filters-body">

                    <div className="fgroup">
                      <h4>{t("filters.keyword.title")} <span className="chev">▾</span></h4>
                      <div className="fbody"><input className="f-input" placeholder={t("filters.keyword.placeholder")} /></div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.body.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="chips">
                          <span className="chip">{t("filters.body.all")}</span>
                          <span className="chip active">{t("filters.body.sport")}</span>
                          <span className="chip">{t("filters.body.cruiser")}</span>
                          <span className="chip">{t("filters.body.adventure")}</span>
                          <span className="chip">{t("filters.body.naked")}</span>
                          <span className="chip">{t("filters.body.standard")}</span>
                          <span className="chip">{t("filters.body.offRoad")}</span>
                          <span className="chip">{t("filters.body.touring")}</span>
                          <span className="chip">{t("filters.body.scooter")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.make.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.make.ducati")} <span className="cnt">1,128</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.make.bmw")} <span className="cnt">1,520</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.make.harley")} <span className="cnt">1,842</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.make.kawasaki")} <span className="cnt">1,420</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.make.yamaha")} <span className="cnt">1,684</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.make.honda")} <span className="cnt">1,892</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.make.ktm")} <span className="cnt">820</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.make.suzuki")} <span className="cnt">784</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.make.triumph")} <span className="cnt">486</span></label>
                        </div>
                        <a className="more-link">{t("filters.make.more")}</a>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.engine.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="chips">
                          <span className="chip active">{t("filters.engine.any")}</span>
                          <span className="chip">{t("filters.engine.u250")}</span>
                          <span className="chip">{t("filters.engine.r250")}</span>
                          <span className="chip">{t("filters.engine.r500")}</span>
                          <span className="chip">{t("filters.engine.r800")}</span>
                          <span className="chip">{t("filters.engine.o1000")}</span>
                        </div>
                        <div className="range-row" style={{ marginTop: "10px" }}>
                          <input className="f-input" placeholder={t("filters.min")} /><span>{t("filters.engine.unit")}</span><input className="f-input" placeholder={t("filters.max")} />
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.price.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="range-row">
                          <input className="f-input" placeholder={t("filters.min")} /><span>–</span><input className="f-input" placeholder={t("filters.max")} />
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.year.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="range-row">
                          <select className="f-select"><option>2018</option><option>2017</option></select>
                          <span>–</span>
                          <select className="f-select"><option>2024</option><option>2023</option><option>2022</option></select>
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.mileage.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="range-row">
                          <input className="f-input" placeholder="0" /><span>–</span><input className="f-input" placeholder="50,000" />
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.transmission.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.transmission.m6")} <span className="cnt">9,820</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.transmission.m5")} <span className="cnt">1,418</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.transmission.dct")} <span className="cnt">486</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.transmission.cvt")} <span className="cnt">708</span></label>
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.license.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          <label className="check-row"><input type="checkbox" /> {t("filters.license.a1")} <span className="cnt">624</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.license.a2")} <span className="cnt">1,840</span></label>
                          <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.license.a")} <span className="cnt">9,968</span></label>
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.aids.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.aids.abs")} <span className="cnt">10,840</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.aids.traction")} <span className="cnt">7,420</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.aids.wheelie")} <span className="cnt">3,210</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.aids.quickshifter")} <span className="cnt">4,180</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.aids.imu")} <span className="cnt">3,820</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.aids.modes")} <span className="cnt">8,128</span></label>
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.color.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="swatches">
                          <div className="swatch" style={{ background: "#FFFFFF", border: "1px solid var(--border)" }} title={t("filters.color.white")}></div>
                          <div className="swatch active" style={{ background: "#111827" }} title={t("filters.color.black")}></div>
                          <div className="swatch" style={{ background: "#DC2626" }} title={t("filters.color.red")}></div>
                          <div className="swatch" style={{ background: "#23416B" }} title={t("filters.color.blue")}></div>
                          <div className="swatch" style={{ background: "#22C55E" }} title={t("filters.color.green")}></div>
                          <div className="swatch" style={{ background: "#EAB308" }} title={t("filters.color.yellow")}></div>
                          <div className="swatch" style={{ background: "#E97700" }} title={t("filters.color.orange")}></div>
                          <div className="swatch" style={{ background: "#9CA3AF" }} title={t("filters.color.silver")}></div>
                          <div className="swatch" style={{ background: "#A855F7" }} title={t("filters.color.purple")}></div>
                          <div className="swatch" style={{ background: "linear-gradient(45deg,#fff 0 50%,#111 50% 100%)" }} title={t("filters.color.other")}></div>
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.seller.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.seller.dealer")} <span className="cnt">8,420</span></label>
                          <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.seller.private")} <span className="cnt">4,012</span></label>
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.location.title")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          <label className="check-row"><input type="checkbox" /> {t("filters.location.dubai")} <span className="cnt">5,820</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.location.abudhabi")} <span className="cnt">3,128</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.location.sharjah")} <span className="cnt">2,184</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.location.ajman")} <span className="cnt">684</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.location.rak")} <span className="cnt">412</span></label>
                          <label className="check-row"><input type="checkbox" /> {t("filters.location.fujairah")} <span className="cnt">204</span></label>
                        </div>
                      </div>
                    </div>

                  </div>
                </aside>

                {/* ============= RESULTS ============= */}
                <div className="results-area">

                  <div className="active-filters">
                    <span className="filter-chip">{t("active.sport")} <button aria-label={t("active.remove")}>×</button></span>
                    <span className="filter-chip">{t("active.ducati")} <button aria-label={t("active.remove")}>×</button></span>
                    <span className="filter-chip">{t("active.abs")} <button aria-label={t("active.remove")}>×</button></span>
                    <span className="filter-chip">{t("active.black")} <button aria-label={t("active.remove")}>×</button></span>
                    <button className="clear-all">{t("active.clearAll")}</button>
                  </div>

                  <div className="toolbar">
                    <div className="left">
                      <strong style={{ color: "var(--text)" }}>{t("toolbar.count")}</strong> {t("toolbar.match")}
                    </div>
                    <div className="right">
                      <span className="muted">{t("toolbar.sortBy")}</span>
                      <select className="sort-select">
                        <option>{t("toolbar.sort.relevant")}</option>
                        <option>{t("toolbar.sort.newest")}</option>
                        <option>{t("toolbar.sort.priceLow")}</option>
                        <option>{t("toolbar.sort.priceHigh")}</option>
                        <option>{t("toolbar.sort.mileage")}</option>
                        <option>{t("toolbar.sort.power")}</option>
                      </select>
                      <div className="view-toggle">
                        <button className="active" title={t("toolbar.gridView")}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                        </button>
                        <button title={t("toolbar.listView")}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="result-grid">

                    <Link href="/cars/demo" className="card">
                      <div className="media">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=720&q=80&auto=format" alt="" />
                        <span className="badge">{t("badges.featured")}</span>
                        <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                        <span className="photo-count">18</span>
                      </div>
                      <div className="card-body">
                        <h3 className="card-title">{t("cards.0.title")}</h3>
                        <p className="card-sub">{t("cards.0.sub")}</p>
                        <div className="price">{t("cards.0.price")} <small>{t("cards.0.mo")}</small></div>
                        <div className="specs"><span className="spec">{t("cards.0.s1")}</span><span className="spec">{t("cards.0.s2")}</span><span className="spec">{t("cards.0.s3")}</span></div>
                        <div className="card-foot"><div className="dealer"><span className="avatar">RS</span> {t("cards.0.dealer")}</div><span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 600 }}>{t("cards.0.verified")}</span></div>
                      </div>
                    </Link>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">15</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.1.title")}</h3><p className="card-sub">{t("cards.1.sub")}</p><div className="price">{t("cards.1.price")}</div><div className="specs"><span className="spec">{t("cards.1.s1")}</span><span className="spec">{t("cards.1.s2")}</span><span className="spec">{t("cards.1.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">KM</span> {t("cards.1.dealer")}</div></div></div>
                    </Link>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1591216105303-3f8dcffe5fa1?w=720&q=80&auto=format" alt="" /><span className="badge">{t("badges.featured")}</span><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">22</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.2.title")}</h3><p className="card-sub">{t("cards.2.sub")}</p><div className="price">{t("cards.2.price")}</div><div className="specs"><span className="spec">{t("cards.2.s1")}</span><span className="spec">{t("cards.2.s2")}</span><span className="spec">{t("cards.2.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">MR</span> {t("cards.2.dealer")}</div></div></div>
                    </Link>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=720&q=80&auto=format" alt="" /><span className="badge badge-success">{t("badges.new")}</span><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">14</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.3.title")}</h3><p className="card-sub">{t("cards.3.sub")}</p><div className="price">{t("cards.3.price")}</div><div className="specs"><span className="spec">{t("cards.3.s1")}</span><span className="spec">{t("cards.3.s2")}</span><span className="spec">{t("cards.3.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">AP</span> {t("cards.3.dealer")}</div></div></div>
                    </Link>

                    {/* PROMO */}
                    <div className="promo-card">
                      <div>
                        <h4>{t("promo.title")}</h4>
                        <p>{t("promo.body")}</p>
                      </div>
                      <a className="btn btn-lg" href="#">{t("promo.cta")}</a>
                    </div>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1568708476-cdaeae3196b8?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">20</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.4.title")}</h3><p className="card-sub">{t("cards.4.sub")}</p><div className="price">{t("cards.4.price")}</div><div className="specs"><span className="spec">{t("cards.4.s1")}</span><span className="spec">{t("cards.4.s2")}</span><span className="spec">{t("cards.4.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">MR</span> {t("cards.4.dealer")}</div></div></div>
                    </Link>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=720&q=80&auto=format" alt="" /><span className="badge badge-warning">{t("badges.reduced")}</span><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">18</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.5.title")}</h3><p className="card-sub">{t("cards.5.sub")}</p><div className="price">{t("cards.5.price")} <small style={{ textDecoration: "line-through", color: "var(--text-3)" }}>{t("cards.5.was")}</small></div><div className="specs"><span className="spec">{t("cards.5.s1")}</span><span className="spec">{t("cards.5.s2")}</span><span className="spec">{t("cards.5.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">HD</span> {t("cards.5.dealer")}</div></div></div>
                    </Link>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1577563682708-c45e5e29a2da?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">16</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.6.title")}</h3><p className="card-sub">{t("cards.6.sub")}</p><div className="price">{t("cards.6.price")}</div><div className="specs"><span className="spec">{t("cards.6.s1")}</span><span className="spec">{t("cards.6.s2")}</span><span className="spec">{t("cards.6.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">TC</span> {t("cards.6.dealer")}</div></div></div>
                    </Link>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1558980664-1db506751c42?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">22</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.7.title")}</h3><p className="card-sub">{t("cards.7.sub")}</p><div className="price">{t("cards.7.price")}</div><div className="specs"><span className="spec">{t("cards.7.s1")}</span><span className="spec">{t("cards.7.s2")}</span><span className="spec">{t("cards.7.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">HM</span> {t("cards.7.dealer")}</div></div></div>
                    </Link>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1591216105303-3f8dcffe5fa1?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">12</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.8.title")}</h3><p className="card-sub">{t("cards.8.sub")}</p><div className="price">{t("cards.8.price")}</div><div className="specs"><span className="spec">{t("cards.8.s1")}</span><span className="spec">{t("cards.8.s2")}</span><span className="spec">{t("cards.8.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">KO</span> {t("cards.8.dealer")}</div></div></div>
                    </Link>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">18</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.9.title")}</h3><p className="card-sub">{t("cards.9.sub")}</p><div className="price">{t("cards.9.price")}</div><div className="specs"><span className="spec">{t("cards.9.s1")}</span><span className="spec">{t("cards.9.s2")}</span><span className="spec">{t("cards.9.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">YM</span> {t("cards.9.dealer")}</div></div></div>
                    </Link>

                    <Link href="/cars/demo" className="card">
                      <div className="media">{ }<img src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">15</span></div>
                      <div className="card-body"><h3 className="card-title">{t("cards.10.title")}</h3><p className="card-sub">{t("cards.10.sub")}</p><div className="price">{t("cards.10.price")}</div><div className="specs"><span className="spec">{t("cards.10.s1")}</span><span className="spec">{t("cards.10.s2")}</span><span className="spec">{t("cards.10.s3")}</span></div><div className="card-foot"><div className="dealer"><span className="avatar">DC</span> {t("cards.10.dealer")}</div></div></div>
                    </Link>

                  </div>

                  <div className="pagination">
                    <a className="disabled">{t("pagination.prev")}</a>
                    <a className="active">1</a>
                    <a>2</a><a>3</a><a>4</a><a>5</a>
                    <span className="dots">…</span>
                    <a>1,036</a>
                    <a>{t("pagination.next")}</a>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "mk-bikeSearch"],
      nextI18NextConfig,
    )),
  },
});
