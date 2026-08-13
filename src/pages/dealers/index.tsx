import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function MkdealersPage() {
  const { t } = useTranslation("mk-dealers");
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-dealers" className="page">
          <div className="dealers-wrap">

            {/* Hero */}
            <div className="dealers-hero">
              <div className="container">
                <h1>{t("hero.title")}</h1>
                <p className="sub">{t("hero.sub")}</p>

                <div className="dealers-searchbar">
                  <div className="ds-field">
                    <label>{t("hero.search.nameLabel")}</label>
                    <input placeholder={t("hero.search.namePlaceholder")} />
                  </div>
                  <div className="ds-field">
                    <label>{t("hero.search.emirateLabel")}</label>
                    <select>
                      <option>{t("hero.search.emirates.all")}</option>
                      <option>{t("hero.search.emirates.dubai")}</option><option>{t("hero.search.emirates.abuDhabi")}</option><option>{t("hero.search.emirates.sharjah")}</option>
                      <option>{t("hero.search.emirates.ajman")}</option><option>{t("hero.search.emirates.rak")}</option><option>{t("hero.search.emirates.fujairah")}</option><option>{t("hero.search.emirates.uaq")}</option>
                    </select>
                  </div>
                  <div className="ds-field">
                    <label>{t("hero.search.specialtyLabel")}</label>
                    <select>
                      <option>{t("hero.search.specialties.any")}</option>
                      <option>{t("hero.search.specialties.luxury")}</option><option>{t("hero.search.specialties.usedCars")}</option><option>{t("hero.search.specialties.newCars")}</option>
                      <option>{t("hero.search.specialties.sports")}</option><option>{t("hero.search.specialties.suvs")}</option><option>{t("hero.search.specialties.family")}</option><option>{t("hero.search.specialties.electric")}</option>
                    </select>
                  </div>
                  <div className="ds-cta">
                    <button className="btn btn-primary btn-lg">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                      {t("hero.search.button")}
                    </button>
                  </div>
                </div>

                <div className="dealers-stats">
                  <div className="stat"><strong>{t("hero.stats.dealers.value")}</strong>{t("hero.stats.dealers.label")}</div>
                  <div className="stat"><strong>{t("hero.stats.listings.value")}</strong>{t("hero.stats.listings.label")}</div>
                  <div className="stat"><strong>{t("hero.stats.rating.value")}</strong>{t("hero.stats.rating.label")}</div>
                  <div className="stat"><strong>{t("hero.stats.reply.value")}</strong>{t("hero.stats.reply.label")}</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="dealers-content">
              <div className="container">

                {/* FEATURED DEALERS */}
                <div style={{ marginBottom: "32px" }}>
                  <h2 className="featured-dealers-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" /></svg>
                    {t("featured.title")}
                  </h2>
                  <div className="featured-dealers">

                    <Link href="/dealers/demo" className="dealer-card">
                      <div className="dc-cover">
                        <span className="dc-premium">{t("featured.premium")}</span>
                      </div>
                      <div className="dc-body">
                        <div className="dc-logo">AT</div>
                        <div className="dc-name-row">
                          <h3>{t("featured.cards.0.name")}</h3>
                          <span className="dc-verified" title={t("card.verifiedTitle")}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                        </div>
                        <div className="dc-rating"><span className="stars"><strong>{t("featured.cards.0.rating")}</strong></span><span>{t("featured.cards.0.reviews")}</span></div>
                        <div className="dc-location">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {t("featured.cards.0.location")}
                        </div>
                        <div className="dc-tags">
                          <span className="dc-tag">{t("featured.cards.0.tags.0")}</span>
                          <span className="dc-tag">{t("featured.cards.0.tags.1")}</span>
                          <span className="dc-tag">{t("featured.cards.0.tags.2")}</span>
                        </div>
                        <div className="dc-stats">
                          <div className="dc-stat"><span className="dcs-val">{t("featured.cards.0.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                          <div className="dc-stat"><span className="dcs-val">{t("featured.cards.0.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                          <div className="dc-stat"><span className="dcs-val">{t("featured.cards.0.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                        </div>
                        <div className="dc-actions">
                          <button className="btn btn-primary">{t("card.view")}</button>
                          <button className="btn btn-outline">{t("card.contact")}</button>
                        </div>
                      </div>
                    </Link>

                    <Link href="/dealers/demo" className="dealer-card">
                      <div className="dc-cover alt-2">
                        <span className="dc-premium">{t("featured.premium")}</span>
                      </div>
                      <div className="dc-body">
                        <div className="dc-logo">EM</div>
                        <div className="dc-name-row">
                          <h3>{t("featured.cards.1.name")}</h3>
                          <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                        </div>
                        <div className="dc-rating"><span className="stars"><strong>{t("featured.cards.1.rating")}</strong></span><span>{t("featured.cards.1.reviews")}</span></div>
                        <div className="dc-location">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {t("featured.cards.1.location")}
                        </div>
                        <div className="dc-tags">
                          <span className="dc-tag">{t("featured.cards.1.tags.0")}</span>
                          <span className="dc-tag warning">{t("featured.cards.1.tags.1")}</span>
                          <span className="dc-tag">{t("featured.cards.1.tags.2")}</span>
                        </div>
                        <div className="dc-stats">
                          <div className="dc-stat"><span className="dcs-val">{t("featured.cards.1.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                          <div className="dc-stat"><span className="dcs-val">{t("featured.cards.1.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                          <div className="dc-stat"><span className="dcs-val">{t("featured.cards.1.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                        </div>
                        <div className="dc-actions">
                          <button className="btn btn-primary">{t("card.view")}</button>
                          <button className="btn btn-outline">{t("card.contact")}</button>
                        </div>
                      </div>
                    </Link>

                    <Link href="/dealers/demo" className="dealer-card">
                      <div className="dc-cover alt-3">
                        <span className="dc-premium">{t("featured.premium")}</span>
                      </div>
                      <div className="dc-body">
                        <div className="dc-logo">PA</div>
                        <div className="dc-name-row">
                          <h3>{t("featured.cards.2.name")}</h3>
                          <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                        </div>
                        <div className="dc-rating"><span className="stars"><strong>{t("featured.cards.2.rating")}</strong></span><span>{t("featured.cards.2.reviews")}</span></div>
                        <div className="dc-location">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          {t("featured.cards.2.location")}
                        </div>
                        <div className="dc-tags">
                          <span className="dc-tag">{t("featured.cards.2.tags.0")}</span>
                          <span className="dc-tag">{t("featured.cards.2.tags.1")}</span>
                          <span className="dc-tag">{t("featured.cards.2.tags.2")}</span>
                        </div>
                        <div className="dc-stats">
                          <div className="dc-stat"><span className="dcs-val">{t("featured.cards.2.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                          <div className="dc-stat"><span className="dcs-val">{t("featured.cards.2.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                          <div className="dc-stat"><span className="dcs-val">{t("featured.cards.2.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                        </div>
                        <div className="dc-actions">
                          <button className="btn btn-primary">{t("card.view")}</button>
                          <button className="btn btn-outline">{t("card.contact")}</button>
                        </div>
                      </div>
                    </Link>

                  </div>
                </div>

                {/* 2-col: filters + grid */}
                <div className="dealers-layout">

                  {/* ============ FILTERS ============ */}
                  <aside className="dealers-filters">
                    <div className="filters-head" style={{ borderBottom: "1px solid var(--divider)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>{t("filters.title")}</h3>
                      <button className="reset" style={{ color: "var(--brand)", fontWeight: 600, fontSize: "12.5px", background: "none", border: 0, cursor: "pointer" }}>{t("filters.reset")}</button>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.emirate.title")}</h4>
                      <div className="check-list">
                        <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.emirate.dubai")} <span className="cnt">418</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.emirate.abuDhabi")} <span className="cnt">312</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.emirate.sharjah")} <span className="cnt">238</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.emirate.ajman")} <span className="cnt">98</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.emirate.rak")} <span className="cnt">72</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.emirate.fujairah")} <span className="cnt">42</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.emirate.uaq")} <span className="cnt">28</span></label>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.specialty.title")}</h4>
                      <div className="check-list">
                        <label className="check-row"><input type="checkbox" /> {t("filters.specialty.luxury")} <span className="cnt">218</span></label>
                        <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.specialty.suvs")} <span className="cnt">412</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.specialty.sports")} <span className="cnt">86</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.specialty.sedans")} <span className="cnt">328</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.specialty.electric")} <span className="cnt">62</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.specialty.classic")} <span className="cnt">18</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.specialty.pickups")} <span className="cnt">98</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.specialty.family")} <span className="cnt">412</span></label>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.rating.title")}</h4>
                      <div className="rating-chips">
                        <span className="rating-chip active"><span className="star">★</span> {t("filters.rating.any")}</span>
                        <span className="rating-chip"><span className="star">★</span> {t("filters.rating.45")}</span>
                        <span className="rating-chip"><span className="star">★</span> {t("filters.rating.4")}</span>
                        <span className="rating-chip"><span className="star">★</span> {t("filters.rating.3")}</span>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.trust.title")}</h4>
                      <div className="check-list">
                        <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.trust.verified")} <span className="cnt">982</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.trust.premium")} <span className="cnt">84</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.trust.openNow")} <span className="cnt">412</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.trust.delivery")} <span className="cnt">186</span></label>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.services.title")}</h4>
                      <div className="check-list">
                        <label className="check-row"><input type="checkbox" /> {t("filters.services.tradeIn")} <span className="cnt">512</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.services.financing")} <span className="cnt">328</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.services.warranty")} <span className="cnt">218</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.services.inspection")} <span className="cnt">186</span></label>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.languages.title")}</h4>
                      <div className="check-list">
                        <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.languages.english")} <span className="cnt">1,228</span></label>
                        <label className="check-row"><input type="checkbox" defaultChecked /> {t("filters.languages.arabic")} <span className="cnt">982</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.languages.urdu")} <span className="cnt">412</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.languages.hindi")} <span className="cnt">498</span></label>
                        <label className="check-row"><input type="checkbox" /> {t("filters.languages.tagalog")} <span className="cnt">86</span></label>
                      </div>
                    </div>
                  </aside>

                  {/* ============ RESULTS ============ */}
                  <div className="dealers-results">

                    <div className="dealers-toolbar">
                      <div className="left"><strong>{t("results.count")}</strong> {t("results.matchSuffix")}</div>
                      <div className="right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12.5px", color: "var(--text-3)" }}>{t("results.sortBy")}</span>
                        <select className="sort-select">
                          <option>{t("results.sort.mostCars")}</option>
                          <option>{t("results.sort.highestRated")}</option>
                          <option>{t("results.sort.newest")}</option>
                          <option>{t("results.sort.bestResponse")}</option>
                          <option>{t("results.sort.premiumFirst")}</option>
                        </select>
                        <div className="view-toggle">
                          <button className="active" title={t("results.gridView")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                          </button>
                          <button title={t("results.mapView")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="dealer-grid">

                      <Link href="/dealers/demo" className="dealer-card">
                        <div className="dc-cover alt-1"></div>
                        <div className="dc-body">
                          <div className="dc-logo">SM</div>
                          <div className="dc-name-row">
                            <h3>{t("grid.cards.0.name")}</h3>
                            <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                          </div>
                          <div className="dc-rating"><span className="stars"><strong>{t("grid.cards.0.rating")}</strong></span><span>{t("grid.cards.0.reviews")}</span></div>
                          <div className="dc-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("grid.cards.0.location")}</div>
                          <div className="dc-tags"><span className="dc-tag">{t("grid.cards.0.tags.0")}</span><span className="dc-tag">{t("grid.cards.0.tags.1")}</span></div>
                          <div className="dc-stats">
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.0.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.0.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.0.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                          </div>
                          <div className="dc-actions">
                            <button className="btn btn-primary">{t("card.view")}</button>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dealers/demo" className="dealer-card">
                        <div className="dc-cover alt-4"></div>
                        <div className="dc-body">
                          <div className="dc-logo">NM</div>
                          <div className="dc-name-row">
                            <h3>{t("grid.cards.1.name")}</h3>
                            <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                          </div>
                          <div className="dc-rating"><span className="stars"><strong>{t("grid.cards.1.rating")}</strong></span><span>{t("grid.cards.1.reviews")}</span></div>
                          <div className="dc-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("grid.cards.1.location")}</div>
                          <div className="dc-tags"><span className="dc-tag">{t("grid.cards.1.tags.0")}</span><span className="dc-tag">{t("grid.cards.1.tags.1")}</span><span className="dc-tag">{t("grid.cards.1.tags.2")}</span></div>
                          <div className="dc-stats">
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.1.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.1.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.1.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                          </div>
                          <div className="dc-actions">
                            <button className="btn btn-primary">{t("card.view")}</button>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dealers/demo" className="dealer-card">
                        <div className="dc-cover alt-5"></div>
                        <div className="dc-body">
                          <div className="dc-logo">AM</div>
                          <div className="dc-name-row">
                            <h3>{t("grid.cards.2.name")}</h3>
                            <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                          </div>
                          <div className="dc-rating"><span className="stars"><strong>{t("grid.cards.2.rating")}</strong></span><span>{t("grid.cards.2.reviews")}</span></div>
                          <div className="dc-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("grid.cards.2.location")}</div>
                          <div className="dc-tags"><span className="dc-tag">{t("grid.cards.2.tags.0")}</span><span className="dc-tag">{t("grid.cards.2.tags.1")}</span></div>
                          <div className="dc-stats">
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.2.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.2.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.2.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                          </div>
                          <div className="dc-actions">
                            <button className="btn btn-primary">{t("card.view")}</button>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dealers/demo" className="dealer-card">
                        <div className="dc-cover alt-6"></div>
                        <div className="dc-body">
                          <div className="dc-logo">LX</div>
                          <div className="dc-name-row">
                            <h3>{t("grid.cards.3.name")}</h3>
                            <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                          </div>
                          <div className="dc-rating"><span className="stars"><strong>{t("grid.cards.3.rating")}</strong></span><span>{t("grid.cards.3.reviews")}</span></div>
                          <div className="dc-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("grid.cards.3.location")}</div>
                          <div className="dc-tags"><span className="dc-tag warning">{t("grid.cards.3.tags.0")}</span><span className="dc-tag">{t("grid.cards.3.tags.1")}</span><span className="dc-tag">{t("grid.cards.3.tags.2")}</span></div>
                          <div className="dc-stats">
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.3.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.3.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.3.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                          </div>
                          <div className="dc-actions">
                            <button className="btn btn-primary">{t("card.view")}</button>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dealers/demo" className="dealer-card">
                        <div className="dc-cover alt-2"></div>
                        <div className="dc-body">
                          <div className="dc-logo">RS</div>
                          <div className="dc-name-row">
                            <h3>{t("grid.cards.4.name")}</h3>
                            <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                          </div>
                          <div className="dc-rating"><span className="stars"><strong>{t("grid.cards.4.rating")}</strong></span><span>{t("grid.cards.4.reviews")}</span></div>
                          <div className="dc-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("grid.cards.4.location")}</div>
                          <div className="dc-tags"><span className="dc-tag">{t("grid.cards.4.tags.0")}</span><span className="dc-tag">{t("grid.cards.4.tags.1")}</span><span className="dc-tag">{t("grid.cards.4.tags.2")}</span></div>
                          <div className="dc-stats">
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.4.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.4.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.4.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                          </div>
                          <div className="dc-actions">
                            <button className="btn btn-primary">{t("card.view")}</button>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dealers/demo" className="dealer-card">
                        <div className="dc-cover alt-3"></div>
                        <div className="dc-body">
                          <div className="dc-logo">AG</div>
                          <div className="dc-name-row">
                            <h3>{t("grid.cards.5.name")}</h3>
                            <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                          </div>
                          <div className="dc-rating"><span className="stars"><strong>{t("grid.cards.5.rating")}</strong></span><span>{t("grid.cards.5.reviews")}</span></div>
                          <div className="dc-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("grid.cards.5.location")}</div>
                          <div className="dc-tags"><span className="dc-tag">{t("grid.cards.5.tags.0")}</span><span className="dc-tag">{t("grid.cards.5.tags.1")}</span></div>
                          <div className="dc-stats">
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.5.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.5.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.5.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                          </div>
                          <div className="dc-actions">
                            <button className="btn btn-primary">{t("card.view")}</button>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dealers/demo" className="dealer-card">
                        <div className="dc-cover alt-4"></div>
                        <div className="dc-body">
                          <div className="dc-logo">PW</div>
                          <div className="dc-name-row">
                            <h3>{t("grid.cards.6.name")}</h3>
                            <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                          </div>
                          <div className="dc-rating"><span className="stars"><strong>{t("grid.cards.6.rating")}</strong></span><span>{t("grid.cards.6.reviews")}</span></div>
                          <div className="dc-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("grid.cards.6.location")}</div>
                          <div className="dc-tags"><span className="dc-tag">{t("grid.cards.6.tags.0")}</span><span className="dc-tag">{t("grid.cards.6.tags.1")}</span><span className="dc-tag">{t("grid.cards.6.tags.2")}</span></div>
                          <div className="dc-stats">
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.6.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.6.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.6.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                          </div>
                          <div className="dc-actions">
                            <button className="btn btn-primary">{t("card.view")}</button>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dealers/demo" className="dealer-card">
                        <div className="dc-cover alt-1"></div>
                        <div className="dc-body">
                          <div className="dc-logo">UM</div>
                          <div className="dc-name-row">
                            <h3>{t("grid.cards.7.name")}</h3>
                          </div>
                          <div className="dc-rating"><span className="stars"><strong>{t("grid.cards.7.rating")}</strong></span><span>{t("grid.cards.7.reviews")}</span></div>
                          <div className="dc-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("grid.cards.7.location")}</div>
                          <div className="dc-tags"><span className="dc-tag">{t("grid.cards.7.tags.0")}</span><span className="dc-tag">{t("grid.cards.7.tags.1")}</span></div>
                          <div className="dc-stats">
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.7.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.7.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.7.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                          </div>
                          <div className="dc-actions">
                            <button className="btn btn-primary">{t("card.view")}</button>
                          </div>
                        </div>
                      </Link>

                      <Link href="/dealers/demo" className="dealer-card">
                        <div className="dc-cover alt-5"></div>
                        <div className="dc-body">
                          <div className="dc-logo">GA</div>
                          <div className="dc-name-row">
                            <h3>{t("grid.cards.8.name")}</h3>
                            <span className="dc-verified"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg></span>
                          </div>
                          <div className="dc-rating"><span className="stars"><strong>{t("grid.cards.8.rating")}</strong></span><span>{t("grid.cards.8.reviews")}</span></div>
                          <div className="dc-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {t("grid.cards.8.location")}</div>
                          <div className="dc-tags"><span className="dc-tag">{t("grid.cards.8.tags.0")}</span><span className="dc-tag">{t("grid.cards.8.tags.1")}</span></div>
                          <div className="dc-stats">
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.8.stats.cars")}</span><span className="dcs-label">{t("card.stats.cars")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.8.stats.active")}</span><span className="dcs-label">{t("card.stats.active")}</span></div>
                            <div className="dc-stat"><span className="dcs-val">{t("grid.cards.8.stats.reply")}</span><span className="dcs-label">{t("card.stats.reply")}</span></div>
                          </div>
                          <div className="dc-actions">
                            <button className="btn btn-primary">{t("card.view")}</button>
                          </div>
                        </div>
                      </Link>

                    </div>

                    {/* Pagination */}
                    <div className="pagination" style={{ marginTop: "30px" }}>
                      <a className="disabled">{t("pagination.prev")}</a>
                      <a className="active">1</a><a>2</a><a>3</a><a>4</a><a>5</a>
                      <span className="dots">…</span>
                      <a>104</a>
                      <a>{t("pagination.next")}</a>
                    </div>

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
      ["common", "mk-dealers"],
      nextI18NextConfig,
    )),
  },
});
