import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function MkbikeDetailPage() {
  const { t } = useTranslation("mk-bikeDetail");

  const featCheck = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
  const historyCheck = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );

  const featureIdx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const inspectBars = [
    { key: 0, width: "100%" },
    { key: 1, width: "98%" },
    { key: 2, width: "100%" },
    { key: 3, width: "100%" },
    { key: 4, width: "96%" },
  ];
  const specGroups = [
    { group: "engine", rows: 10 },
    { group: "transmission", rows: 4 },
    { group: "dimensions", rows: 7 },
    { group: "wheels", rows: 7 },
    { group: "electronics", rows: 10 },
  ];
  const historyIdx = [0, 1, 2, 3, 4, 5];
  const safetyIdx = [0, 1, 2, 3];
  const similarIdx = [0, 1, 2, 3];
  const similarImg = [
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=720&q=80&auto=format",
    "https://images.unsplash.com/photo-1591216105303-3f8dcffe5fa1?w=720&q=80&auto=format",
    "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=720&q=80&auto=format",
    "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=720&q=80&auto=format",
  ];

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-bike-detail" className="page">
          <div className="detail-wrap">
            <div className="container">

              {/* Breadcrumb */}
              <div className="breadcrumb">
                <Link href="/">{t("breadcrumb.home")}</Link><span className="sep">›</span>
                <Link href="/bikes">{t("breadcrumb.bikes")}</Link><span className="sep">›</span>
                <Link href="/bikes">{t("breadcrumb.sportBikes")}</Link><span className="sep">›</span>
                <Link href="/bikes">{t("breadcrumb.ducati")}</Link><span className="sep">›</span>
                <span className="current">{t("breadcrumb.current")}</span>
              </div>

              {/* Title row */}
              <div className="detail-head">
                <div>
                  <h1>{t("head.title")}</h1>
                  <div className="head-meta">
                    <span>{t("head.year")}</span><span className="dot">•</span>
                    <span>{t("head.body")}</span><span className="dot">•</span>
                    <span>{t("head.engine")}</span><span className="dot">•</span>
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
                </div>
              </div>

              <div className="detail-grid">

                {/* ============ LEFT: MAIN ============ */}
                <div className="detail-main">

                  {/* GALLERY */}
                  <div className="gallery">
                    <div className="gallery-main">
                      <span className="badge-detail">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
                        {t("gallery.featured")}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img id="bikeMainPhoto" src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1400&q=85&auto=format" alt="" />
                      <button className="gal-nav gal-prev" id="bikeGalPrev"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6" /></svg></button>
                      <button className="gal-nav gal-next" id="bikeGalNext"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 18l6-6-6-6" /></svg></button>
                      <span className="photo-num-large" id="bikePhotoNum">{t("gallery.photoNum")}</span>
                      <button className="view-all-photos">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                        {t("gallery.viewAll")}
                      </button>
                    </div>
                    <div className="gallery-thumbs" id="bikeGalleryThumbs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb active" data-i={0} src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i={1} src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i={2} src="https://images.unsplash.com/photo-1591216105303-3f8dcffe5fa1?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i={3} src="https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i={4} src="https://images.unsplash.com/photo-1568708476-cdaeae3196b8?w=300&q=70&auto=format" alt="" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="thumb" data-i={5} src="https://images.unsplash.com/photo-1558980664-1db506751c42?w=300&q=70&auto=format" alt="" />
                    </div>
                  </div>

                  {/* QUICK SPECS */}
                  <div className="quick-specs">
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
                      <div className="qs-label">{t("quickSpecs.year.label")}</div><div className="qs-val">{t("quickSpecs.year.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <div className="qs-label">{t("quickSpecs.mileage.label")}</div><div className="qs-val">{t("quickSpecs.mileage.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3v9l5 3" /></svg>
                      <div className="qs-label">{t("quickSpecs.engine.label")}</div><div className="qs-val">{t("quickSpecs.engine.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                      <div className="qs-label">{t("quickSpecs.power.label")}</div><div className="qs-val">{t("quickSpecs.power.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="18" r="3" /><circle cx="16" cy="18" r="3" /><path d="M8 18l4-10 4 10" /></svg>
                      <div className="qs-label">{t("quickSpecs.body.label")}</div><div className="qs-val">{t("quickSpecs.body.val")}</div>
                    </div>
                    <div className="qs">
                      <svg className="qs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9v6M19 9v6M5 12h14" /></svg>
                      <div className="qs-label">{t("quickSpecs.gears.label")}</div><div className="qs-val">{t("quickSpecs.gears.val")}</div>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div className="detail-section">
                    <h2>{t("about.title")}</h2>
                    <p>{t("about.p1")}</p>
                    <p>{t("about.p2")}</p>
                    <p>{t("about.p3")}</p>
                    <button className="text-link">{t("about.readMore")}</button>
                  </div>

                  {/* KEY FEATURES */}
                  <div className="detail-section">
                    <h2>{t("features.title")}</h2>
                    <div className="features-grid">
                      {featureIdx.map((i) => (
                        <span className="feat" key={i}>{featCheck} {t(`features.items.${i}`)}</span>
                      ))}
                    </div>
                  </div>

                  {/* INSPECTION */}
                  <div className="inspect-card">
                    <div className="inspect-head">
                      <div className="inspect-head-left">
                        <div className="inspect-shield"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /><path d="M9 12l2 2 4-4" /></svg></div>
                        <div>
                          <h3>{t("inspect.title")}</h3>
                          <p>{t("inspect.by")}</p>
                        </div>
                      </div>
                      <div className="score-box">
                        <div className="score">{t("inspect.score")}</div>
                        <div className="out">{t("inspect.outOf")}</div>
                      </div>
                    </div>
                    <div className="inspect-bars">
                      {inspectBars.map((b) => (
                        <div className="bar" key={b.key}>
                          <span>{t(`inspect.bars.${b.key}.label`)}</span>
                          <div className="bar-track"><div className="bar-fill" style={{ width: b.width }} /></div>
                          <span>{t(`inspect.bars.${b.key}.value`)}</span>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-outline">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      {t("inspect.report")}
                    </button>
                  </div>

                  {/* FULL SPECIFICATIONS */}
                  <div className="detail-section">
                    <h2>{t("specs.title")}</h2>

                    {specGroups.map((g) => (
                      <div className="spec-group" key={g.group}>
                        <h3>{t(`specs.groups.${g.group}.title`)}</h3>
                        <div className="spec-table">
                          {Array.from({ length: g.rows }).map((_, i) => (
                            <div className="spec-row" key={i}>
                              <span>{t(`specs.groups.${g.group}.rows.${i}.label`)}</span>
                              <span>{t(`specs.groups.${g.group}.rows.${i}.value`)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* BIKE HISTORY */}
                  <div className="detail-section">
                    <h2>{t("history.title")}</h2>
                    <div className="history-grid">
                      {historyIdx.map((i) => (
                        <div className="history-item" key={i}>
                          <div className="h-icon">{historyCheck}</div>
                          <div className="h-text"><strong>{t(`history.items.${i}.title`)}</strong>{t(`history.items.${i}.desc`)}</div>
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
                      <div className="price-tag">{t("price.currency")}<span className="amt">{t("price.amt")}</span></div>
                      <div className="price-sub">{t("price.subPre")} <span className="em">{t("price.subEm")}</span> {t("price.subPost")}</div>
                    </div>

                    <div className="dealer-block">
                      <div className="dealer-row">
                        <div className="dealer-logo">{t("dealer.logo")}</div>
                        <div style={{ flex: 1 }}>
                          <div className="dealer-name">
                            {t("dealer.name")}
                            <svg className="v" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
                          </div>
                          <div className="dealer-meta"><span className="star">{t("dealer.rating")}</span><span>•</span><span>{t("dealer.reviews")}</span></div>
                          <div className="dealer-meta-2">{t("dealer.meta2")}</div>
                        </div>
                      </div>
                      <Link href="/dealers/demo" className="dealer-link">{t("dealer.link")}</Link>
                    </div>

                    <div className="contact-buttons">
                      <button className="btn btn-primary btn-block btn-lg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                        <span>{t("contact.phone")}</span>
                        <small style={{ opacity: 0.8, fontWeight: 500, marginLeft: "4px" }}>{t("contact.phoneHint")}</small>
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
                        {t("contact.schedule")}
                      </button>
                    </div>
                  </div>

                  {/* FINANCE CALCULATOR */}
                  <div className="card-sidebar finance-card">
                    <h3>{t("finance.title")}</h3>
                    <p className="muted">{t("finance.subtitle")}</p>

                    <div className="fin-row">
                      <div className="fin-label"><span>{t("finance.price.label")}</span></div>
                      <div className="fin-val">{t("finance.currency")} <span id="bikeFinPrice">{t("finance.price.val")}</span></div>
                    </div>

                    <div className="fin-row">
                      <div className="fin-label"><span>{t("finance.downPayment.label")}</span><span className="dim">(<b id="bikeDpPct">{t("finance.downPayment.pct")}</b>%)</span></div>
                      <input type="range" id="bikeDpSlider" min="0" max="60" step="1" defaultValue="25" />
                      <div className="fin-val">{t("finance.currency")} <span id="bikeDpAmt">{t("finance.downPayment.amt")}</span></div>
                    </div>

                    <div className="fin-row">
                      <div className="fin-label"><span>{t("finance.loanTerm.label")}</span></div>
                      <select id="bikeTermSelect" className="f-select" defaultValue="60">
                        <option value="12">{t("finance.loanTerm.opt12")}</option>
                        <option value="24">{t("finance.loanTerm.opt24")}</option>
                        <option value="36">{t("finance.loanTerm.opt36")}</option>
                        <option value="48">{t("finance.loanTerm.opt48")}</option>
                        <option value="60">{t("finance.loanTerm.opt60")}</option>
                      </select>
                    </div>

                    <div className="fin-row">
                      <div className="fin-label"><span>{t("finance.interestRate.label")}</span><span className="dim">(<b id="bikeRateLbl">{t("finance.interestRate.val")}</b>%)</span></div>
                      <input type="range" id="bikeRateSlider" min="3" max="10" step="0.1" defaultValue="5.5" />
                    </div>

                    <div className="fin-result">
                      <div className="fin-result-row primary"><span>{t("finance.result.monthly")}</span><strong>{t("finance.currency")} <span id="bikeMonthly">{t("finance.result.monthlyVal")}</span></strong></div>
                      <div className="fin-result-row"><span>{t("finance.result.loanAmount")}</span><span>{t("finance.currency")} <span id="bikeLoanAmt">{t("finance.result.loanAmountVal")}</span></span></div>
                      <div className="fin-result-row"><span>{t("finance.result.totalInterest")}</span><span>{t("finance.currency")} <span id="bikeTotalInt">{t("finance.result.totalInterestVal")}</span></span></div>
                      <div className="fin-result-row"><span>{t("finance.result.totalCost")}</span><span>{t("finance.currency")} <span id="bikeTotalAmt">{t("finance.result.totalCostVal")}</span></span></div>
                    </div>

                    <button className="btn btn-primary btn-block">{t("finance.getPreApproved")}</button>
                  </div>

                  {/* SAFETY */}
                  <div className="card-sidebar safety-card">
                    <h4>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /></svg>
                      {t("safety.title")}
                    </h4>
                    <ul>
                      {safetyIdx.map((i) => (
                        <li key={i}>{t(`safety.items.${i}`)}</li>
                      ))}
                    </ul>
                    <Link href="#" className="text-link">{t("safety.link")}</Link>
                  </div>

                </aside>

              </div>

              {/* SIMILAR BIKES */}
              <section className="similar-section">
                <div className="section-head">
                  <div>
                    <h2 style={{ fontSize: "22px", margin: 0 }}>{t("similar.title")}</h2>
                    <p style={{ margin: "6px 0 0", color: "var(--text-2)", fontSize: "14px" }}>{t("similar.subtitle")}</p>
                  </div>
                  <Link href="/bikes" className="view-all">{t("similar.seeAll")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></Link>
                </div>
                <div className="cards">
                  {similarIdx.map((i) => (
                    <Link href="/bikes/demo" className="card" key={i}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <div className="media"><img src={similarImg[i]} alt="" /></div>
                      <div className="card-body">
                        <h3 className="card-title">{t(`similar.cards.${i}.title`)}</h3>
                        <p className="card-sub">{t(`similar.cards.${i}.sub`)}</p>
                        <div className="price">{t(`similar.cards.${i}.price`)}</div>
                        <div className="specs"><span className="spec">{t(`similar.cards.${i}.spec1`)}</span><span className="spec">{t(`similar.cards.${i}.spec2`)}</span></div>
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
      ["common", "mk-bikeDetail"],
      nextI18NextConfig,
    )),
  },
});
