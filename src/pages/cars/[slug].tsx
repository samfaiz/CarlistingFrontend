import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../../next-i18next.config.js";

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg>
);

export default function MkdetailPage() {
  const { t } = useTranslation("mk-detail");

  const featureKeys = [
    "moonroof", "hud", "cam360", "cruise", "lanekeep", "jbl", "ventilated",
    "heatedSteering", "carplay", "terrain", "crawl", "diff", "lockers", "matrix",
  ];

  const bars = [
    { key: "engine", w: "96%" },
    { key: "body", w: "100%" },
    { key: "interior", w: "98%" },
    { key: "electronics", w: "95%" },
    { key: "tires", w: "92%" },
    { key: "underbody", w: "100%" },
  ];

  const specGroups = [
    { group: "engine", rows: ["engine", "hp", "torque", "accel", "topSpeed", "economy", "drivetrain", "transmission"] },
    { group: "dimensions", rows: ["length", "width", "height", "wheelbase", "clearance", "seating", "cargo", "tank"] },
    { group: "exterior", rows: ["extColor", "intColor", "wheels", "headlights", "sunroof", "doors"] },
    { group: "safety", rows: ["airbags", "preCollision", "adaptive", "lanekeep", "blindspot", "cam360", "infotainment", "carplay"] },
  ];

  const historyItems = ["owner", "accident", "service", "warranty", "gcc", "mulkiya"];

  const similarCars = [
    { img: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=720&q=80&auto=format", i: 0 },
    { img: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=720&q=80&auto=format", i: 1 },
    { img: "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=720&q=80&auto=format", i: 2 },
    { img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=720&q=80&auto=format", i: 3 },
  ];

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-detail" className="page">
          <div className="detail-wrap">
            <div className="container">

              {/* Breadcrumb */}
              <div className="breadcrumb">
                <Link href="/">{t("breadcrumb.home")}</Link><span className="sep">›</span>
                <Link href="/search">{t("breadcrumb.usedCars")}</Link><span className="sep">›</span>
                <Link href="/search">{t("breadcrumb.make")}</Link><span className="sep">›</span>
                <Link href="/search">{t("breadcrumb.model")}</Link><span className="sep">›</span>
                <span className="current">{t("breadcrumb.current")}</span>
              </div>

              {/* Title row */}
              <div className="detail-head">
                <div>
                  <h1>{t("head.title")}</h1>
                  <div className="head-meta">
                    <span>{t("head.year")}</span><span className="dot">•</span>
                    <span>{t("head.body")}</span><span className="dot">•</span>
                    <span>{t("head.mileage")}</span><span className="dot">•</span>
                    <span>{t("head.location")}</span>
                    <span className="tag">{t("head.tag")}</span>
                  </div>
                </div>
                <div className="head-actions">
                  <button>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                    {t("actions.share")}
                  </button>
                  <button className="save-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                    {t("actions.save")}
                  </button>
                  <button>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                    {t("actions.compare")}
                  </button>
                  <button>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" /></svg>
                    {t("actions.print")}
                  </button>
                </div>
              </div>

              {/* Main 2-column grid */}
              <div className="detail-grid">

                {/* ============ LEFT: MAIN CONTENT ============ */}
                <div className="detail-main">

                  {/* GALLERY */}
                  <div className="gallery">
                    <div className="gallery-main">
                      <span className="badge-detail">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
                        {t("gallery.featured")}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img id="mainPhoto" src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1400&q=85&auto=format" alt="" />
                      <button className="gal-nav gal-prev" id="galPrev">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6" /></svg>
                      </button>
                      <button className="gal-nav gal-next" id="galNext">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 18l6-6-6-6" /></svg>
                      </button>
                      <span className="photo-num-large" id="photoNum">{t("gallery.photoNum")}</span>
                      <button className="view-all-photos">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                        {t("gallery.viewAll")}
                      </button>
                    </div>
                    <div className="gallery-thumbs" id="galleryThumbs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb active" data-i="0" src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i="1" src="https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i="2" src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i="3" src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i="4" src="https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i="5" src="https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&q=70&auto=format" alt="" />
                    </div>
                  </div>

                  {/* QUICK SPECS */}
                  <div className="quick-specs">
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      <div className="qs-label">{t("quickSpecs.year.label")}</div><div className="qs-val">{t("quickSpecs.year.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <div className="qs-label">{t("quickSpecs.mileage.label")}</div><div className="qs-val">{t("quickSpecs.mileage.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9v6M19 9v6M5 12h14M9 5l-4 4 4 4M15 5l4 4-4 4" /></svg>
                      <div className="qs-label">{t("quickSpecs.transmission.label")}</div><div className="qs-val">{t("quickSpecs.transmission.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12v16H4zM16 8h2a2 2 0 012 2v6a2 2 0 01-2 2" /><path d="M7 7h6M7 11h6" /></svg>
                      <div className="qs-label">{t("quickSpecs.fuel.label")}</div><div className="qs-val">{t("quickSpecs.fuel.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2" /></svg>
                      <div className="qs-label">{t("quickSpecs.body.label")}</div><div className="qs-val">{t("quickSpecs.body.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /></svg>
                      <div className="qs-label">{t("quickSpecs.specs.label")}</div><div className="qs-val">{t("quickSpecs.specs.val")}</div>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="detail-section">
                    <h2>{t("description.title")}</h2>
                    <p>{t("description.p1")}</p>
                    <p>{t("description.p2")}</p>
                    <p>{t("description.p3")}</p>
                    <button className="text-link">{t("description.readMore")}</button>
                  </div>

                  {/* FEATURES */}
                  <div className="detail-section">
                    <h2>{t("features.title")}</h2>
                    <div className="features-grid">
                      {featureKeys.map((k) => (
                        <span className="feat" key={k}><CheckIcon /> {t(`features.${k}`)}</span>
                      ))}
                    </div>
                  </div>

                  {/* INSPECTION */}
                  <div className="inspect-card">
                    <div className="inspect-head">
                      <div className="inspect-head-left">
                        <div className="inspect-shield">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /><path d="M9 12l2 2 4-4" /></svg>
                        </div>
                        <div>
                          <h3>{t("inspect.title")}</h3>
                          <p>{t("inspect.subtitle")}</p>
                        </div>
                      </div>
                      <div className="score-box">
                        <div className="score">{t("inspect.score")}</div>
                        <div className="out">{t("inspect.outOf")}</div>
                      </div>
                    </div>
                    <div className="inspect-bars">
                      {bars.map((b) => (
                        <div className="bar" key={b.key}>
                          <span>{t(`inspect.bars.${b.key}.label`)}</span>
                          <div className="bar-track"><div className="bar-fill" style={{ width: b.w }}></div></div>
                          <span>{t(`inspect.bars.${b.key}.pct`)}</span>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-outline">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      {t("inspect.reportButton")}
                    </button>
                  </div>

                  {/* FULL SPECIFICATIONS */}
                  <div className="detail-section">
                    <h2>{t("specs.title")}</h2>

                    {specGroups.map((g) => (
                      <div className="spec-group" key={g.group}>
                        <h3>{t(`specs.${g.group}.title`)}</h3>
                        <div className="spec-table">
                          {g.rows.map((r) => (
                            <div className="spec-row" key={r}>
                              <span>{t(`specs.${g.group}.${r}.label`)}</span>
                              <span>{t(`specs.${g.group}.${r}.value`)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* VEHICLE HISTORY */}
                  <div className="detail-section">
                    <h2>{t("history.title")}</h2>
                    <div className="history-grid">
                      {historyItems.map((h) => (
                        <div className="history-item" key={h}>
                          <div className="h-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg></div>
                          <div className="h-text"><strong>{t(`history.${h}.title`)}</strong>{t(`history.${h}.text`)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ============ RIGHT: STICKY SIDEBAR ============ */}
                <aside className="detail-sidebar">

                  {/* PRICE + CONTACT */}
                  <div className="card-sidebar">
                    <div className="price-block">
                      <div className="price-tag">{t("price.currency")}<span className="amt">{t("price.amount")}</span></div>
                      <div className="price-sub">{t("price.subPre")} <span className="em">{t("price.subMonthly")}</span> {t("price.subPost")}</div>
                    </div>

                    <div className="dealer-block">
                      <div className="dealer-row">
                        <div className="dealer-logo">{t("dealer.logo")}</div>
                        <div style={{ flex: "1" }}>
                          <div className="dealer-name">
                            {t("dealer.name")}
                            <svg className="v" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
                          </div>
                          <div className="dealer-meta"><span className="star">{t("dealer.rating")}</span><span>•</span><span>{t("dealer.reviews")}</span></div>
                          <div className="dealer-meta-2">{t("dealer.stats")}</div>
                        </div>
                      </div>
                      <Link href="/dealers/demo" className="dealer-link">{t("dealer.viewAll")}</Link>
                    </div>

                    <div className="contact-buttons">
                      <button className="btn btn-primary btn-block btn-lg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                        <span>{t("contact.phone")}</span>
                        <small style={{ opacity: .8, fontWeight: 500, marginLeft: "4px" }}>{t("contact.tapToView")}</small>
                      </button>
                      <button className="btn btn-whatsapp btn-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5 0-.1-.2-.2-.5-.4z" /><path d="M12 21c-1.8 0-3.5-.5-5-1.4l-3.5 1 1-3.4c-1-1.6-1.5-3.4-1.5-5.2 0-5 4-9 9-9s9 4 9 9-4 9-9 9z" /></svg>
                        {t("contact.whatsapp")}
                      </button>
                      <button className="btn btn-outline btn-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        {t("contact.message")}
                      </button>
                      <button className="btn btn-secondary btn-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        {t("contact.testDrive")}
                      </button>
                    </div>
                  </div>

                  {/* FINANCE CALCULATOR */}
                  <div className="card-sidebar finance-card">
                    <h3>{t("finance.title")}</h3>
                    <p className="muted">{t("finance.subtitle")}</p>

                    <div className="fin-row">
                      <div className="fin-label"><span>{t("finance.vehiclePrice")}</span></div>
                      <div className="fin-val">{t("finance.currency")} <span id="finPrice">{t("finance.priceAmt")}</span></div>
                    </div>

                    <div className="fin-row">
                      <div className="fin-label"><span>{t("finance.downPayment")}</span><span className="dim">(<b id="dpPct">{t("finance.dpPct")}</b>%)</span></div>
                      <input type="range" id="dpSlider" min="0" max="60" step="1" defaultValue="20" />
                      <div className="fin-val">{t("finance.currency")} <span id="dpAmt">{t("finance.dpAmt")}</span></div>
                    </div>

                    <div className="fin-row">
                      <div className="fin-label"><span>{t("finance.loanTerm")}</span></div>
                      <select id="termSelect" className="f-select" defaultValue="60">
                        <option value="12">{t("finance.term12")}</option>
                        <option value="24">{t("finance.term24")}</option>
                        <option value="36">{t("finance.term36")}</option>
                        <option value="48">{t("finance.term48")}</option>
                        <option value="60">{t("finance.term60")}</option>
                        <option value="72">{t("finance.term72")}</option>
                      </select>
                    </div>

                    <div className="fin-row">
                      <div className="fin-label"><span>{t("finance.interestRate")}</span><span className="dim">(<b id="rateLbl">{t("finance.rateLbl")}</b>%)</span></div>
                      <input type="range" id="rateSlider" min="3" max="10" step="0.1" defaultValue="4.5" />
                    </div>

                    <div className="fin-result">
                      <div className="fin-result-row primary">
                        <span>{t("finance.monthlyPayment")}</span>
                        <strong>{t("finance.currency")} <span id="monthly">{t("finance.monthlyAmt")}</span></strong>
                      </div>
                      <div className="fin-result-row"><span>{t("finance.loanAmount")}</span><span>{t("finance.currency")} <span id="loanAmt">{t("finance.loanAmt")}</span></span></div>
                      <div className="fin-result-row"><span>{t("finance.totalInterest")}</span><span>{t("finance.currency")} <span id="totalInt">{t("finance.totalIntAmt")}</span></span></div>
                      <div className="fin-result-row"><span>{t("finance.totalCost")}</span><span>{t("finance.currency")} <span id="totalAmt">{t("finance.totalAmt")}</span></span></div>
                    </div>

                    <button className="btn btn-primary btn-block">{t("finance.preApproved")}</button>
                  </div>

                  {/* SAFETY */}
                  <div className="card-sidebar safety-card">
                    <h4>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /></svg>
                      {t("safety.title")}
                    </h4>
                    <ul>
                      <li>{t("safety.tip1")}</li>
                      <li>{t("safety.tip2")}</li>
                      <li>{t("safety.tip3")}</li>
                      <li>{t("safety.tip4")}</li>
                    </ul>
                    <a href="#" className="text-link">{t("safety.guide")}</a>
                  </div>

                </aside>

              </div>

              {/* SIMILAR CARS */}
              <section className="similar-section">
                <div className="section-head">
                  <div>
                    <h2 style={{ fontSize: "22px", margin: 0 }}>{t("similar.title")}</h2>
                    <p style={{ margin: "6px 0 0", color: "var(--text-2)", fontSize: "14px" }}>{t("similar.subtitle")}</p>
                  </div>
                  <Link href="/search" className="view-all">{t("similar.seeAll")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></Link>
                </div>
                <div className="cards">
                  {similarCars.map((c) => (
                    <Link href="/cars/demo" className="card detail-link" key={c.i}>
                      <div className="media">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.img} alt="" />
                        <button className="fav"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></button>
                      </div>
                      <div className="card-body">
                        <h3 className="card-title">{t(`similar.cars.${c.i}.title`)}</h3>
                        <p className="card-sub">{t(`similar.cars.${c.i}.sub`)}</p>
                        <div className="price">{t(`similar.cars.${c.i}.price`)}</div>
                        <div className="specs"><span className="spec">{t(`similar.cars.${c.i}.spec1`)}</span><span className="spec">{t(`similar.cars.${c.i}.spec2`)}</span></div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

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
      ["common", "mk-detail"],
      nextI18NextConfig,
    )),
  },
});
