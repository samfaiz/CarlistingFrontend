import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function MkdealerProfilePage() {
  const { t } = useTranslation("mk-dealerProfile");
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-dealer" className="page">
          <div className="dealer-wrap">

            {/* Cover banner */}
            <div className="dealer-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1567449303078-57ad995bd323?w=1800&q=80&auto=format" alt={t("cover.alt")} />
            </div>

            <div className="container dealer-page-container">

              {/* Header card */}
              <div className="dealer-header">
                <div className="dealer-logo-big">AT</div>
                <div className="dealer-info">
                  <div className="dealer-name-row">
                    <h1>{t("header.name")}</h1>
                    <span className="verified-tag">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
                      {t("header.verified")}
                    </span>
                    <span className="premium-tag">{t("header.premium")}</span>
                  </div>
                  <div className="dealer-meta-row">
                    <span className="rating-star">{t("header.rating")}</span>
                    <span>{t("header.reviews")}</span>
                    <span className="mdot">•</span>
                    <span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "-2px" }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {t("header.location")}
                    </span>
                    <span className="mdot">•</span>
                    <span><strong style={{ color: "var(--text)" }}>{t("header.carsListedValue")}</strong> {t("header.carsListedLabel")}</span>
                    <span className="mdot">•</span>
                    <span>{t("header.memberSince")}</span>
                    <span className="open-now">{t("header.openNow")}</span>
                  </div>
                </div>
                <div className="dealer-actions">
                  <button className="btn btn-primary">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8z" /></svg>
                    {t("header.contact")}
                  </button>
                  <button className="btn btn-outline">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" /></svg>
                    {t("header.follow")}
                  </button>
                  <button className="btn btn-outline">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
                    {t("header.share")}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="dealer-stats">
                <div className="ds-item"><div className="ds-val">{t("stats.activeVal")}</div><div className="ds-label">{t("stats.activeLabel")}</div></div>
                <div className="ds-item"><div className="ds-val">{t("stats.yearsVal")}</div><div className="ds-label">{t("stats.yearsLabel")}</div></div>
                <div className="ds-item"><div className="ds-val">{t("stats.responseVal")}</div><div className="ds-label">{t("stats.responseLabel")}</div></div>
                <div className="ds-item"><div className="ds-val">{t("stats.replyVal")}</div><div className="ds-label">{t("stats.replyLabel")}</div></div>
                <div className="ds-item"><div className="ds-val">{t("stats.soldVal")}</div><div className="ds-label">{t("stats.soldLabel")}</div></div>
              </div>

              {/* Tab nav */}
              <div className="dealer-tabs" id="dealerTabs">
                <button className="dtab active" data-dtab="inventory">{t("tabs.inventory")}</button>
                <button className="dtab" data-dtab="about">{t("tabs.about")}</button>
                <button className="dtab" data-dtab="reviews">{t("tabs.reviews")}</button>
                <button className="dtab" data-dtab="locations">{t("tabs.locations")}</button>
              </div>

              {/* Two-column */}
              <div className="dealer-grid">

                {/* ============ MAIN ============ */}
                <div className="dealer-main">

                  {/* INVENTORY */}
                  <section className="dealer-section active" data-dsection="inventory">
                    <div className="inv-chips">
                      <span className="chip active">{t("inventory.chips.0")}</span>
                      <span className="chip">{t("inventory.chips.1")}</span>
                      <span className="chip">{t("inventory.chips.2")}</span>
                      <span className="chip">{t("inventory.chips.3")}</span>
                      <span className="chip">{t("inventory.chips.4")}</span>
                      <span className="chip">{t("inventory.chips.5")}</span>
                      <span className="chip">{t("inventory.chips.6")}</span>
                    </div>

                    <div className="toolbar">
                      <div className="left"><strong style={{ color: "var(--text)" }}>{t("inventory.toolbarCount")}</strong> {t("inventory.toolbarFrom")}</div>
                      <div className="right">
                        <span className="muted">{t("inventory.sortBy")}</span>
                        <select className="sort-select">
                          <option>{t("inventory.sort.relevant")}</option>
                          <option>{t("inventory.sort.newest")}</option>
                          <option>{t("inventory.sort.priceLow")}</option>
                          <option>{t("inventory.sort.priceHigh")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="result-grid">
                      <Link href="/cars/demo" className="card">
                        <div className="media">{ }<img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=720&q=80&auto=format" alt="" /><span className="badge">{t("inventory.cards.0.badge")}</span><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">{t("inventory.cards.0.photos")}</span></div>
                        <div className="card-body"><h3 className="card-title">{t("inventory.cards.0.title")}</h3><p className="card-sub">{t("inventory.cards.0.sub")}</p><div className="price">{t("inventory.cards.0.price")}</div><div className="specs"><span className="spec">{t("inventory.cards.0.spec0")}</span><span className="spec">{t("inventory.cards.0.spec1")}</span><span className="spec">{t("inventory.cards.0.spec2")}</span></div></div>
                      </Link>
                      <Link href="/cars/demo" className="card">
                        <div className="media">{ }<img src="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=720&q=80&auto=format" alt="" /><span className="badge">{t("inventory.cards.1.badge")}</span><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">{t("inventory.cards.1.photos")}</span></div>
                        <div className="card-body"><h3 className="card-title">{t("inventory.cards.1.title")}</h3><p className="card-sub">{t("inventory.cards.1.sub")}</p><div className="price">{t("inventory.cards.1.price")}</div><div className="specs"><span className="spec">{t("inventory.cards.1.spec0")}</span><span className="spec">{t("inventory.cards.1.spec1")}</span><span className="spec">{t("inventory.cards.1.spec2")}</span></div></div>
                      </Link>
                      <Link href="/cars/demo" className="card">
                        <div className="media">{ }<img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">{t("inventory.cards.2.photos")}</span></div>
                        <div className="card-body"><h3 className="card-title">{t("inventory.cards.2.title")}</h3><p className="card-sub">{t("inventory.cards.2.sub")}</p><div className="price">{t("inventory.cards.2.price")}</div><div className="specs"><span className="spec">{t("inventory.cards.2.spec0")}</span><span className="spec">{t("inventory.cards.2.spec1")}</span><span className="spec">{t("inventory.cards.2.spec2")}</span></div></div>
                      </Link>
                      <Link href="/cars/demo" className="card">
                        <div className="media">{ }<img src="https://images.unsplash.com/photo-1542362567-b07e54358753?w=720&q=80&auto=format" alt="" /><span className="badge badge-success">{t("inventory.cards.3.badge")}</span><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">{t("inventory.cards.3.photos")}</span></div>
                        <div className="card-body"><h3 className="card-title">{t("inventory.cards.3.title")}</h3><p className="card-sub">{t("inventory.cards.3.sub")}</p><div className="price">{t("inventory.cards.3.price")}</div><div className="specs"><span className="spec">{t("inventory.cards.3.spec0")}</span><span className="spec">{t("inventory.cards.3.spec1")}</span><span className="spec">{t("inventory.cards.3.spec2")}</span></div></div>
                      </Link>
                      <Link href="/cars/demo" className="card">
                        <div className="media">{ }<img src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">{t("inventory.cards.4.photos")}</span></div>
                        <div className="card-body"><h3 className="card-title">{t("inventory.cards.4.title")}</h3><p className="card-sub">{t("inventory.cards.4.sub")}</p><div className="price">{t("inventory.cards.4.price")}</div><div className="specs"><span className="spec">{t("inventory.cards.4.spec0")}</span><span className="spec">{t("inventory.cards.4.spec1")}</span><span className="spec">{t("inventory.cards.4.spec2")}</span></div></div>
                      </Link>
                      <Link href="/cars/demo" className="card">
                        <div className="media">{ }<img src="https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=720&q=80&auto=format" alt="" /><span className="badge badge-warning">{t("inventory.cards.5.badge")}</span><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">{t("inventory.cards.5.photos")}</span></div>
                        <div className="card-body"><h3 className="card-title">{t("inventory.cards.5.title")}</h3><p className="card-sub">{t("inventory.cards.5.sub")}</p><div className="price">{t("inventory.cards.5.price")} <small style={{ textDecoration: "line-through", color: "var(--text-3)" }}>{t("inventory.cards.5.priceOld")}</small></div><div className="specs"><span className="spec">{t("inventory.cards.5.spec0")}</span><span className="spec">{t("inventory.cards.5.spec1")}</span><span className="spec">{t("inventory.cards.5.spec2")}</span></div></div>
                      </Link>
                      <Link href="/cars/demo" className="card">
                        <div className="media">{ }<img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">{t("inventory.cards.6.photos")}</span></div>
                        <div className="card-body"><h3 className="card-title">{t("inventory.cards.6.title")}</h3><p className="card-sub">{t("inventory.cards.6.sub")}</p><div className="price">{t("inventory.cards.6.price")}</div><div className="specs"><span className="spec">{t("inventory.cards.6.spec0")}</span><span className="spec">{t("inventory.cards.6.spec1")}</span><span className="spec">{t("inventory.cards.6.spec2")}</span></div></div>
                      </Link>
                      <Link href="/cars/demo" className="card">
                        <div className="media">{ }<img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">{t("inventory.cards.7.photos")}</span></div>
                        <div className="card-body"><h3 className="card-title">{t("inventory.cards.7.title")}</h3><p className="card-sub">{t("inventory.cards.7.sub")}</p><div className="price">{t("inventory.cards.7.price")}</div><div className="specs"><span className="spec">{t("inventory.cards.7.spec0")}</span><span className="spec">{t("inventory.cards.7.spec1")}</span><span className="spec">{t("inventory.cards.7.spec2")}</span></div></div>
                      </Link>
                      <Link href="/cars/demo" className="card">
                        <div className="media">{ }<img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=720&q=80&auto=format" alt="" /><button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button><span className="photo-count">{t("inventory.cards.8.photos")}</span></div>
                        <div className="card-body"><h3 className="card-title">{t("inventory.cards.8.title")}</h3><p className="card-sub">{t("inventory.cards.8.sub")}</p><div className="price">{t("inventory.cards.8.price")}</div><div className="specs"><span className="spec">{t("inventory.cards.8.spec0")}</span><span className="spec">{t("inventory.cards.8.spec1")}</span><span className="spec">{t("inventory.cards.8.spec2")}</span></div></div>
                      </Link>
                    </div>

                    <div className="pagination" style={{ marginTop: "24px" }}>
                      <a className="disabled">{t("inventory.prev")}</a>
                      <a className="active">1</a><a>2</a><a>3</a><a>4</a><a>5</a>
                      <span className="dots">…</span>
                      <a>36</a>
                      <a>{t("inventory.next")}</a>
                    </div>
                  </section>

                  {/* ABOUT */}
                  <section className="dealer-section" data-dsection="about">
                    <div className="detail-section">
                      <h2>{t("about.heading")}</h2>
                      <p>{t("about.p1")}</p>
                      <p>{t("about.p2")}</p>
                      <p>{t("about.p3")}</p>
                    </div>

                    <div className="detail-section">
                      <h2>{t("about.servicesHeading")}</h2>
                      <div className="services-grid">
                        <div className="service-item">
                          <div className="svc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6l9 6 9-6M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6M3 6l3-3h12l3 3" /></svg></div>
                          <strong>{t("about.services.0.title")}</strong>
                          <p>{t("about.services.0.desc")}</p>
                        </div>
                        <div className="service-item">
                          <div className="svc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg></div>
                          <strong>{t("about.services.1.title")}</strong>
                          <p>{t("about.services.1.desc")}</p>
                        </div>
                        <div className="service-item">
                          <div className="svc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /><path d="M9 12l2 2 4-4" /></svg></div>
                          <strong>{t("about.services.2.title")}</strong>
                          <p>{t("about.services.2.desc")}</p>
                        </div>
                        <div className="service-item">
                          <div className="svc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>
                          <strong>{t("about.services.3.title")}</strong>
                          <p>{t("about.services.3.desc")}</p>
                        </div>
                        <div className="service-item">
                          <div className="svc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></div>
                          <strong>{t("about.services.4.title")}</strong>
                          <p>{t("about.services.4.desc")}</p>
                        </div>
                        <div className="service-item">
                          <div className="svc-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" /></svg></div>
                          <strong>{t("about.services.5.title")}</strong>
                          <p>{t("about.services.5.desc")}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* REVIEWS */}
                  <section className="dealer-section" data-dsection="reviews">
                    <div className="review-summary">
                      <div className="rs-big">
                        <div className="rs-num">{t("reviews.summaryNum")}</div>
                        <div className="rs-stars">★★★★★</div>
                        <div className="rs-count">{t("reviews.summaryCount")}</div>
                      </div>
                      <div className="rs-bars">
                        <div className="rs-bar"><span>{t("reviews.bars.5")}</span><div className="rb-track"><div className="rb-fill" style={{ width: "78%" }}></div></div><span>194</span></div>
                        <div className="rs-bar"><span>{t("reviews.bars.4")}</span><div className="rb-track"><div className="rb-fill" style={{ width: "16%" }}></div></div><span>40</span></div>
                        <div className="rs-bar"><span>{t("reviews.bars.3")}</span><div className="rb-track"><div className="rb-fill" style={{ width: "4%" }}></div></div><span>10</span></div>
                        <div className="rs-bar"><span>{t("reviews.bars.2")}</span><div className="rb-track"><div className="rb-fill" style={{ width: "1%" }}></div></div><span>3</span></div>
                        <div className="rs-bar"><span>{t("reviews.bars.1")}</span><div className="rb-track"><div className="rb-fill" style={{ width: ".5%" }}></div></div><span>1</span></div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <span className="chip active">{t("reviews.filters.0")}</span>
                        <span className="chip">{t("reviews.filters.1")}</span>
                        <span className="chip">{t("reviews.filters.2")}</span>
                        <span className="chip">{t("reviews.filters.3")}</span>
                        <span className="chip">{t("reviews.filters.4")}</span>
                      </div>
                      <select className="sort-select">
                        <option>{t("reviews.sort.relevant")}</option>
                        <option>{t("reviews.sort.recent")}</option>
                        <option>{t("reviews.sort.highest")}</option>
                      </select>
                    </div>

                    <div className="review-card">
                      <div className="review-head">
                        <div className="reviewer">
                          <div className="rev-av">SK</div>
                          <div>
                            <div className="rev-name">{t("reviews.items.0.name")}</div>
                            <div className="rev-meta">
                              <span className="stars">★★★★★</span>
                              <span>{t("reviews.items.0.time")}</span>
                              <span>•</span>
                              <span className="vbuyer"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4" /></svg> {t("reviews.verifiedBuyer")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="review-body">{t("reviews.items.0.body")}</p>
                      <span className="rev-car-tag">{t("reviews.items.0.carTag")}</span>
                      <div className="dealer-reply">
                        <strong>{t("reviews.replyFrom")}</strong>
                        <p>{t("reviews.items.0.reply")}</p>
                      </div>
                      <div className="rev-helpful">
                        <button>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z" /></svg>
                          {t("reviews.items.0.helpful")}
                        </button>
                        <button>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8z" /></svg>
                          {t("reviews.reply")}
                        </button>
                        <button>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                          {t("reviews.report")}
                        </button>
                      </div>
                    </div>

                    <div className="review-card">
                      <div className="review-head">
                        <div className="reviewer">
                          <div className="rev-av">AH</div>
                          <div>
                            <div className="rev-name">{t("reviews.items.1.name")}</div>
                            <div className="rev-meta">
                              <span className="stars">★★★★★</span>
                              <span>{t("reviews.items.1.time")}</span>
                              <span>•</span>
                              <span className="vbuyer"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4" /></svg> {t("reviews.verifiedBuyer")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="review-body">{t("reviews.items.1.body")}</p>
                      <span className="rev-car-tag">{t("reviews.items.1.carTag")}</span>
                      <div className="rev-helpful">
                        <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z" /></svg> {t("reviews.items.1.helpful")}</button>
                        <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7" /></svg> {t("reviews.reply")}</button>
                      </div>
                    </div>

                    <div className="review-card">
                      <div className="review-head">
                        <div className="reviewer">
                          <div className="rev-av">FR</div>
                          <div>
                            <div className="rev-name">{t("reviews.items.2.name")}</div>
                            <div className="rev-meta">
                              <span className="stars">★★★★☆</span>
                              <span>{t("reviews.items.2.time")}</span>
                              <span>•</span>
                              <span className="vbuyer"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4" /></svg> {t("reviews.verifiedBuyer")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="review-body">{t("reviews.items.2.body")}</p>
                      <span className="rev-car-tag">{t("reviews.items.2.carTag")}</span>
                      <div className="dealer-reply">
                        <strong>{t("reviews.replyFrom")}</strong>
                        <p>{t("reviews.items.2.reply")}</p>
                      </div>
                      <div className="rev-helpful">
                        <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z" /></svg> {t("reviews.items.2.helpful")}</button>
                      </div>
                    </div>

                    <div className="review-card">
                      <div className="review-head">
                        <div className="reviewer">
                          <div className="rev-av">MJ</div>
                          <div>
                            <div className="rev-name">{t("reviews.items.3.name")}</div>
                            <div className="rev-meta">
                              <span className="stars">★★★★★</span>
                              <span>{t("reviews.items.3.time")}</span>
                              <span>•</span>
                              <span className="vbuyer"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4" /></svg> {t("reviews.verifiedBuyer")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="review-body">{t("reviews.items.3.body")}</p>
                      <span className="rev-car-tag">{t("reviews.items.3.carTag")}</span>
                      <div className="rev-helpful">
                        <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z" /></svg> {t("reviews.items.3.helpful")}</button>
                        <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7" /></svg> {t("reviews.reply")}</button>
                      </div>
                    </div>

                    <button className="btn btn-outline btn-block" style={{ marginTop: "14px" }}>{t("reviews.loadMore")}</button>
                  </section>

                  {/* LOCATIONS */}
                  <section className="dealer-section" data-dsection="locations">
                    <div className="detail-section" style={{ padding: 0, background: "transparent", border: 0 }}>
                      <h2 style={{ marginBottom: "14px" }}>{t("locations.heading")}</h2>

                      <div className="location-card">
                        <div>
                          <h3>{t("locations.items.0.name")}</h3>
                          <p className="loc-addr">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: "2px", color: "var(--brand)", flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            {t("locations.items.0.addr")}
                          </p>
                          <div className="loc-hours">
                            <span><strong>{t("locations.items.0.openStrong")}</strong> {t("locations.items.0.openUntil")}</span>
                            <span>{t("locations.items.0.hours0")}</span>
                            <span>{t("locations.items.0.hours1")}</span>
                            <span>{t("locations.items.0.phone")}</span>
                          </div>
                        </div>
                        <div className="loc-actions">
                          <button className="btn btn-primary btn-mini">{t("locations.getDirections")}</button>
                          <button className="btn btn-outline btn-mini">{t("locations.call")}</button>
                        </div>
                      </div>

                      <div className="location-card">
                        <div>
                          <h3>{t("locations.items.1.name")}</h3>
                          <p className="loc-addr">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: "2px", color: "var(--brand)", flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            {t("locations.items.1.addr")}
                          </p>
                          <div className="loc-hours">
                            <span><strong>{t("locations.items.1.openStrong")}</strong> {t("locations.items.1.openUntil")}</span>
                            <span>{t("locations.items.1.hours0")}</span>
                            <span>{t("locations.items.1.phone")}</span>
                          </div>
                        </div>
                        <div className="loc-actions">
                          <button className="btn btn-primary btn-mini">{t("locations.getDirections")}</button>
                          <button className="btn btn-outline btn-mini">{t("locations.call")}</button>
                        </div>
                      </div>

                      <div className="location-card">
                        <div>
                          <h3>{t("locations.items.2.name")}</h3>
                          <p className="loc-addr">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: "2px", color: "var(--brand)", flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            {t("locations.items.2.addr")}
                          </p>
                          <div className="loc-hours">
                            <span style={{ color: "var(--text-2)" }}>{t("locations.items.2.closingSoon")}</span>
                            <span>{t("locations.items.2.hours0")}</span>
                            <span>{t("locations.items.2.phone")}</span>
                          </div>
                        </div>
                        <div className="loc-actions">
                          <button className="btn btn-primary btn-mini">{t("locations.getDirections")}</button>
                          <button className="btn btn-outline btn-mini">{t("locations.call")}</button>
                        </div>
                      </div>

                      {/* Large map */}
                      <div className="map-large">
                        <svg className="map-bg" viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D4DCE8" strokeWidth=".5" />
                            </pattern>
                          </defs>
                          <rect width="800" height="350" fill="#E6EBF4" />
                          <rect width="800" height="350" fill="url(#grid)" />
                          <path d="M0 180 L800 180" stroke="#C8D3E2" strokeWidth="14" />
                          <path d="M0 180 L800 180" stroke="#fff" strokeWidth="2" strokeDasharray="10 8" />
                          <path d="M400 0 L400 350" stroke="#C8D3E2" strokeWidth="12" />
                          <path d="M400 0 L400 350" stroke="#fff" strokeWidth="2" strokeDasharray="10 8" />
                          <path d="M0 80 L800 80" stroke="#C8D3E2" strokeWidth="6" />
                          <path d="M0 280 L800 280" stroke="#C8D3E2" strokeWidth="6" />
                          <path d="M180 0 L180 350" stroke="#C8D3E2" strokeWidth="6" />
                          <path d="M620 0 L620 350" stroke="#C8D3E2" strokeWidth="6" />
                          <rect x="60" y="30" width="80" height="40" fill="#D4DCE8" rx="3" />
                          <rect x="240" y="200" width="120" height="60" fill="#D4DCE8" rx="3" />
                          <rect x="440" y="40" width="100" height="30" fill="#D4DCE8" rx="3" />
                          <rect x="660" y="200" width="100" height="60" fill="#D4DCE8" rx="3" />
                          <rect x="240" y="100" width="60" height="50" fill="#D4DCE8" rx="3" />
                        </svg>
                        <div className="map-pulse" style={{ top: "50%", left: "25%" }}></div>
                        <div className="map-pin-wrap" style={{ top: "50%", left: "25%" }}>
                          <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24c0-8.84-7.16-16-16-16z" fill="#DC2626" /><circle cx="16" cy="16" r="6" fill="#fff" /></svg>
                        </div>
                        <div className="map-pulse" style={{ top: "35%", left: "60%" }}></div>
                        <div className="map-pin-wrap" style={{ top: "35%", left: "60%" }}>
                          <svg width="28" height="36" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24c0-8.84-7.16-16-16-16z" fill="#23416B" /><circle cx="16" cy="16" r="6" fill="#fff" /></svg>
                        </div>
                        <div className="map-pulse" style={{ top: "75%", left: "80%" }}></div>
                        <div className="map-pin-wrap" style={{ top: "75%", left: "80%" }}>
                          <svg width="28" height="36" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24c0-8.84-7.16-16-16-16z" fill="#23416B" /><circle cx="16" cy="16" r="6" fill="#fff" /></svg>
                        </div>
                        <div style={{ position: "absolute", bottom: "14px", left: "14px", background: "#fff", padding: "8px 12px", borderRadius: "8px", fontSize: "11.5px", fontWeight: 600, color: "var(--text-2)", boxShadow: "var(--shadow)", display: "flex", gap: "14px" }}>
                          <span><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "99px", background: "#DC2626", verticalAlign: "middle", marginRight: "4px" }}></span>{t("locations.legendFlagship")}</span>
                          <span><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "99px", background: "var(--brand)", verticalAlign: "middle", marginRight: "4px" }}></span>{t("locations.legendBranches")}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                </div>

                {/* ============ SIDEBAR ============ */}
                <aside className="dealer-sidebar">

                  {/* Contact card */}
                  <div className="card-sidebar">
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700 }}>{t("sidebar.contact.heading")}</h3>
                    <p style={{ margin: "0 0 14px", color: "var(--text-2)", fontSize: "13px" }}>{t("sidebar.contact.subtitle")}</p>

                    <div className="contact-buttons">
                      <button className="btn btn-primary btn-lg btn-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                        {t("sidebar.contact.phone")}
                      </button>
                      <button className="btn btn-whatsapp btn-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5 0-.1-.2-.2-.5-.4z" /><path d="M12 21c-1.8 0-3.5-.5-5-1.4l-3.5 1 1-3.4c-1-1.6-1.5-3.4-1.5-5.2 0-5 4-9 9-9s9 4 9 9-4 9-9 9z" /></svg>
                        {t("sidebar.contact.whatsapp")}
                      </button>
                      <button className="btn btn-outline btn-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        {t("sidebar.contact.sendMessage")}
                      </button>
                      <button className="btn btn-secondary btn-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {t("sidebar.contact.getDirections")}
                      </button>
                    </div>
                  </div>

                  {/* Mini map */}
                  <div className="card-sidebar">
                    <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700 }}>{t("sidebar.miniMap.heading")}</h3>
                    <div className="mini-map">
                      <svg className="map-bg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D4DCE8" strokeWidth=".5" />
                          </pattern>
                        </defs>
                        <rect width="200" height="200" fill="#E6EBF4" />
                        <rect width="200" height="200" fill="url(#grid2)" />
                        <path d="M0 100 L200 100" stroke="#C8D3E2" strokeWidth="8" />
                        <path d="M0 100 L200 100" stroke="#fff" strokeWidth="1" strokeDasharray="6 4" />
                        <path d="M100 0 L100 200" stroke="#C8D3E2" strokeWidth="8" />
                        <path d="M100 0 L100 200" stroke="#fff" strokeWidth="1" strokeDasharray="6 4" />
                        <path d="M0 40 L200 40" stroke="#C8D3E2" strokeWidth="3" />
                        <path d="M0 160 L200 160" stroke="#C8D3E2" strokeWidth="3" />
                        <path d="M40 0 L40 200" stroke="#C8D3E2" strokeWidth="3" />
                        <path d="M160 0 L160 200" stroke="#C8D3E2" strokeWidth="3" />
                        <rect x="20" y="20" width="20" height="14" fill="#D4DCE8" rx="2" />
                        <rect x="120" y="120" width="32" height="22" fill="#D4DCE8" rx="2" />
                        <rect x="55" y="135" width="20" height="14" fill="#D4DCE8" rx="2" />
                        <rect x="160" y="50" width="22" height="14" fill="#D4DCE8" rx="2" />
                      </svg>
                      <div className="map-pulse"></div>
                      <div className="map-pin-wrap">
                        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24c0-8.84-7.16-16-16-16z" fill="#DC2626" /><circle cx="16" cy="16" r="6" fill="#fff" /></svg>
                      </div>
                    </div>
                    <p style={{ margin: "12px 0 6px", fontSize: "13px", color: "var(--text)", fontWeight: 600 }}>{t("sidebar.miniMap.name")}</p>
                    <p style={{ margin: "0 0 8px", fontSize: "12.5px", color: "var(--text-2)", lineHeight: 1.5 }}>{t("sidebar.miniMap.addrLine1")}<br />{t("sidebar.miniMap.addrLine2")}</p>
                    <a href="#" className="text-link">{t("sidebar.miniMap.link")}</a>
                  </div>

                  {/* Hours */}
                  <div className="card-sidebar">
                    <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, display: "flex", alignItems: "center" }}>
                      {t("sidebar.hours.heading")}
                      <span className="open-now" style={{ marginLeft: "8px" }}>{t("sidebar.hours.openNow")}</span>
                    </h3>
                    <div className="hours-list">
                      <div className="hour-row"><span>{t("sidebar.hours.mon")}</span><span>{t("sidebar.hours.monTime")}</span></div>
                      <div className="hour-row today"><span>{t("sidebar.hours.tue")} <small>{t("sidebar.hours.today")}</small></span><span>{t("sidebar.hours.tueTime")}</span></div>
                      <div className="hour-row"><span>{t("sidebar.hours.wed")}</span><span>{t("sidebar.hours.wedTime")}</span></div>
                      <div className="hour-row"><span>{t("sidebar.hours.thu")}</span><span>{t("sidebar.hours.thuTime")}</span></div>
                      <div className="hour-row"><span>{t("sidebar.hours.fri")}</span><span>{t("sidebar.hours.friTime")}</span></div>
                      <div className="hour-row"><span>{t("sidebar.hours.sat")}</span><span>{t("sidebar.hours.satTime")}</span></div>
                      <div className="hour-row"><span>{t("sidebar.hours.sun")}</span><span>{t("sidebar.hours.sunTime")}</span></div>
                    </div>
                  </div>

                  {/* Trust */}
                  <div className="card-sidebar">
                    <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700 }}>{t("sidebar.trust.heading")}</h3>
                    <ul className="trust-list">
                      <li><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg> {t("sidebar.trust.items.0")}</li>
                      <li><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg> {t("sidebar.trust.items.1")}</li>
                      <li><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg> {t("sidebar.trust.items.2")}</li>
                      <li><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg> {t("sidebar.trust.items.3")}</li>
                      <li><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg> {t("sidebar.trust.items.4")}</li>
                      <li><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg> {t("sidebar.trust.items.5")}</li>
                    </ul>
                  </div>

                </aside>

              </div>
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "mk-dealerProfile"],
      nextI18NextConfig,
    )),
  },
});
