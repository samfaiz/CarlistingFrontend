import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MksellPage() {
  const { t } = useTranslation("mk-sell");
  const list = (key: string) => t(key, { returnObjects: true }) as string[];
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-sell" className="page">

          {/* Hero */}
          <div className="sell-hero">
            <div className="container">
              <h1>{t("hero.title")}</h1>
              <p>{t("hero.subtitle")}</p>
              <div className="sell-stats">
                <div className="ss"><strong>{t("hero.stats.0.value")}</strong><span>{t("hero.stats.0.label")}</span></div>
                <div className="ss"><strong>{t("hero.stats.1.value")}</strong><span>{t("hero.stats.1.label")}</span></div>
                <div className="ss"><strong>{t("hero.stats.2.value")}</strong><span>{t("hero.stats.2.label")}</span></div>
                <div className="ss"><strong>{t("hero.stats.3.value")}</strong><span>{t("hero.stats.3.label")}</span></div>
              </div>
            </div>
          </div>

          <div className="sell-wrap">
            <div className="container">

              {/* Progress stepper */}
              <div className="stepper" id="stepper">
                <div className="step-track"></div>
                <div className="step-track-fill" id="trackFill"></div>
                <div className="step active" data-step="1">
                  <div className="step-num">1</div>
                  <div className="step-label">{t("stepper.0")}</div>
                </div>
                <div className="step" data-step="2">
                  <div className="step-num">2</div>
                  <div className="step-label">{t("stepper.1")}</div>
                </div>
                <div className="step" data-step="3">
                  <div className="step-num">3</div>
                  <div className="step-label">{t("stepper.2")}</div>
                </div>
                <div className="step" data-step="4">
                  <div className="step-num">4</div>
                  <div className="step-label">{t("stepper.3")}</div>
                </div>
                <div className="step" data-step="5">
                  <div className="step-num">5</div>
                  <div className="step-label">{t("stepper.4")}</div>
                </div>
              </div>

              {/* Two columns */}
              <div className="sell-grid">

                {/* ============ MAIN FORM ============ */}
                <div className="sell-main">
                  <div className="sell-step-card">

                    {/* STEP 1: CAR INFO */}
                    <section className="sell-step active" data-sstep="1">
                      <h2>{t("step1.title")}</h2>
                      <p className="step-sub">{t("step1.sub")}</p>

                      <div className="plate-lookup">
                        <div className="plate-lookup-label">{t("step1.plateLabel")}</div>
                        <div className="plate-row">
                          <select className="form-input">
                            {list("step1.emirates").map((o) => (<option key={o}>{o}</option>))}
                          </select>
                          <input className="form-input" placeholder={t("step1.platePlaceholder")} />
                          <button className="btn btn-primary">{t("step1.autofill")}</button>
                        </div>
                        <p className="plate-helper">{t("step1.plateHelper")} <a href="#">{t("step1.plateHelperLink")}</a></p>
                      </div>

                      <div className="section-divider">{t("step1.divider")}</div>

                      <div className="form-grid">
                        <div className="form-group"><label>{t("step1.makeLabel")}</label>
                          <select className="form-input" id="sMake">
                            <option value="">{t("step1.selectMake")}</option>
                            {list("step1.makes").map((o) => (<option key={o}>{o}</option>))}
                          </select>
                        </div>
                        <div className="form-group"><label>{t("step1.modelLabel")}</label>
                          <select className="form-input" id="sModel">
                            <option value="">{t("step1.selectModel")}</option>
                            {list("step1.models").map((o) => (<option key={o}>{o}</option>))}
                          </select>
                        </div>
                        <div className="form-group"><label>{t("step1.yearLabel")}</label>
                          <select className="form-input" id="sYear">
                            <option value="">{t("step1.selectYear")}</option>
                            <option>2025</option><option>2024</option><option>2023</option><option>2022</option><option>2021</option>
                            <option>2020</option><option>2019</option><option>2018</option><option>2017</option><option>2016</option>
                          </select>
                        </div>
                        <div className="form-group"><label>{t("step1.trimLabel")}</label>
                          <input className="form-input" placeholder={t("step1.trimPlaceholder")} />
                        </div>
                        <div className="form-group"><label>{t("step1.bodyLabel")}</label>
                          <select className="form-input" id="sBody">
                            <option value="">{t("step1.selectBody")}</option>
                            {list("step1.bodies").map((o) => (<option key={o}>{o}</option>))}
                          </select>
                        </div>
                        <div className="form-group"><label>{t("step1.colorLabel")}</label>
                          <select className="form-input">
                            <option value="">{t("step1.selectColor")}</option>
                            {list("step1.colors").map((o) => (<option key={o}>{o}</option>))}
                          </select>
                        </div>
                      </div>

                      <div className="step-footer">
                        <span className="left-info">{t("step1.required")}</span>
                        <button className="btn btn-primary btn-lg" data-next="2">{t("step1.continue")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg></button>
                      </div>
                    </section>

                    {/* STEP 2: SPECS & CONDITION */}
                    <section className="sell-step" data-sstep="2">
                      <h2>{t("step2.title")}</h2>
                      <p className="step-sub">{t("step2.sub")}</p>

                      <div className="form-grid">
                        <div className="form-group"><label>{t("step2.mileageLabel")}</label>
                          <input className="form-input" id="sMileage" type="number" placeholder={t("step2.mileagePlaceholder")} />
                        </div>
                        <div className="form-group"><label>{t("step2.transmissionLabel")}</label>
                          <select className="form-input">{list("step2.transmissions").map((o) => (<option key={o}>{o}</option>))}</select>
                        </div>
                        <div className="form-group"><label>{t("step2.fuelLabel")}</label>
                          <select className="form-input">{list("step2.fuels").map((o) => (<option key={o}>{o}</option>))}</select>
                        </div>
                        <div className="form-group"><label>{t("step2.cylindersLabel")}</label>
                          <select className="form-input">{list("step2.cylinders").map((o) => (<option key={o}>{o}</option>))}</select>
                        </div>
                        <div className="form-group"><label>{t("step2.regionalLabel")}</label>
                          <select className="form-input">{list("step2.regionals").map((o) => (<option key={o}>{o}</option>))}</select>
                        </div>
                        <div className="form-group"><label>{t("step2.ownersLabel")}</label>
                          <select className="form-input">{list("step2.owners").map((o) => (<option key={o}>{o}</option>))}</select>
                        </div>
                        <div className="form-group"><label>{t("step2.doorsLabel")}</label>
                          <select className="form-input">{list("step2.doors").map((o) => (<option key={o}>{o}</option>))}</select>
                        </div>
                        <div className="form-group"><label>{t("step2.warrantyLabel")}</label>
                          <select className="form-input">{list("step2.warranties").map((o) => (<option key={o}>{o}</option>))}</select>
                        </div>
                      </div>

                      <div className="section-divider">{t("step2.dividerCondition")}</div>

                      <div className="condition-cards" id="conditionCards">
                        <div className="condition-card selected" data-cond="excellent">
                          <div className="cond-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /><path d="M9 12l2 2 4-4" /></svg>
                          </div>
                          <div className="cond-name">{t("step2.conditions.0.name")}</div>
                          <div className="cond-desc">{t("step2.conditions.0.desc")}</div>
                        </div>
                        <div className="condition-card" data-cond="good">
                          <div className="cond-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div className="cond-name">{t("step2.conditions.1.name")}</div>
                          <div className="cond-desc">{t("step2.conditions.1.desc")}</div>
                        </div>
                        <div className="condition-card" data-cond="fair">
                          <div className="cond-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /></svg>
                          </div>
                          <div className="cond-name">{t("step2.conditions.2.name")}</div>
                          <div className="cond-desc">{t("step2.conditions.2.desc")}</div>
                        </div>
                        <div className="condition-card" data-cond="needs-work">
                          <div className="cond-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /></svg>
                          </div>
                          <div className="cond-name">{t("step2.conditions.3.name")}</div>
                          <div className="cond-desc">{t("step2.conditions.3.desc")}</div>
                        </div>
                      </div>

                      <div className="section-divider">{t("step2.dividerFeatures")}</div>

                      <div className="feature-chips" id="featureChips">
                        <div className="feature-chip selected"><span className="fc-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg></span> {t("step2.features.0")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.1")}</div>
                        <div className="feature-chip selected"><span className="fc-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg></span> {t("step2.features.2")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.3")}</div>
                        <div className="feature-chip selected"><span className="fc-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg></span> {t("step2.features.4")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.5")}</div>
                        <div className="feature-chip selected"><span className="fc-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg></span> {t("step2.features.6")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.7")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.8")}</div>
                        <div className="feature-chip selected"><span className="fc-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg></span> {t("step2.features.9")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.10")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.11")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.12")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.13")}</div>
                        <div className="feature-chip"><span className="fc-check"></span> {t("step2.features.14")}</div>
                      </div>

                      <div className="step-footer">
                        <button className="btn btn-outline" data-back="1">{t("common.back")}</button>
                        <button className="btn btn-primary btn-lg" data-next="3">{t("step2.continue")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg></button>
                      </div>
                    </section>

                    {/* STEP 3: PHOTOS */}
                    <section className="sell-step" data-sstep="3">
                      <h2>{t("step3.title")}</h2>
                      <p className="step-sub">{t("step3.sub")}</p>

                      <div className="photo-dropzone">
                        <div className="pd-icon">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M16 8l1-2h4" /></svg>
                        </div>
                        <h3>{t("step3.dzTitle")}</h3>
                        <p>{t("step3.dzSub")}</p>
                        <div className="types">{t("step3.dzTypes")}</div>
                      </div>

                      <div className="photo-rec-title">{t("step3.recTitle")}</div>
                      <div className="photo-recs" id="photoRecs">
                        <div className="photo-rec uploaded" data-img="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600&q=80&auto=format">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&q=70&auto=format" alt="" />
                          <button className="pr-remove" type="button">✕</button>
                          <span className="pr-primary">{t("step3.primary")}</span>
                        </div>
                        <div className="photo-rec uploaded" data-img="https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=600&q=80&auto=format">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=400&q=70&auto=format" alt="" />
                          <button className="pr-remove" type="button">✕</button>
                        </div>
                        <div className="photo-rec uploaded" data-img="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80&auto=format">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=70&auto=format" alt="" />
                          <button className="pr-remove" type="button">✕</button>
                        </div>
                        <div className="photo-rec uploaded" data-img="https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=600&q=80&auto=format">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=400&q=70&auto=format" alt="" />
                          <button className="pr-remove" type="button">✕</button>
                        </div>
                        <div className="photo-rec" data-rec="Front 3/4">
                          <div className="pr-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                          <span className="pr-label">{t("step3.recs.0")}</span>
                        </div>
                        <div className="photo-rec" data-rec="Rear 3/4">
                          <div className="pr-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                          <span className="pr-label">{t("step3.recs.1")}</span>
                        </div>
                        <div className="photo-rec" data-rec="Side profile">
                          <div className="pr-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                          <span className="pr-label">{t("step3.recs.2")}</span>
                        </div>
                        <div className="photo-rec" data-rec="Dashboard">
                          <div className="pr-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                          <span className="pr-label">{t("step3.recs.3")}</span>
                        </div>
                        <div className="photo-rec" data-rec="Front seats">
                          <div className="pr-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                          <span className="pr-label">{t("step3.recs.4")}</span>
                        </div>
                        <div className="photo-rec" data-rec="Back seats">
                          <div className="pr-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                          <span className="pr-label">{t("step3.recs.5")}</span>
                        </div>
                        <div className="photo-rec" data-rec="Engine">
                          <div className="pr-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                          <span className="pr-label">{t("step3.recs.6")}</span>
                        </div>
                        <div className="photo-rec" data-rec="Odometer">
                          <div className="pr-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                          <span className="pr-label">{t("step3.recs.7")}</span>
                        </div>
                      </div>

                      <div className="step-footer">
                        <button className="btn btn-outline" data-back="2">{t("common.back")}</button>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span className="left-info"><strong style={{ color: "var(--brand)" }} id="photoCount">4</strong> {t("step3.photosCount")}</span>
                          <button className="btn btn-primary btn-lg" data-next="4">{t("step3.continue")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg></button>
                        </div>
                      </div>
                    </section>

                    {/* STEP 4: PRICE */}
                    <section className="sell-step" data-sstep="4">
                      <h2>{t("step4.title")}</h2>
                      <p className="step-sub">{t("step4.sub")}</p>

                      {/* Inline valuation (live) */}
                      <div style={{ background: "linear-gradient(135deg,var(--brand-light),var(--brand-surface))", border: "1px solid var(--brand-border)", borderRadius: "12px", padding: "18px 22px", marginBottom: "22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 14l4-4 4 2 5-7" /></svg>
                          <strong style={{ color: "var(--brand)", fontSize: "13px", textTransform: "uppercase", letterSpacing: ".04em" }}>{t("step4.marketEstimate")}</strong>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "26px", fontWeight: 800, color: "var(--brand)", letterSpacing: "-.02em" }}>AED <span id="pVlow">98,000</span> – <span id="pVhigh">115,000</span></span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-2)" }}>{t("step4.estBasedOnPre")} <strong style={{ color: "var(--text)" }} id="pVcount">47</strong> {t("step4.estBasedOnPost")}</p>
                      </div>

                      <div className="form-grid">
                        <div className="form-group full"><label>{t("step4.askingLabel")}</label>
                          <input className="form-input" id="pAsking" type="text" defaultValue="105,000" style={{ fontSize: "20px", fontWeight: 800 }} />
                          <div id="priceAdvice" style={{ fontSize: "12.5px", color: "var(--success)", marginTop: "6px", fontWeight: 600 }}>
                            {t("step4.priceAdvice")}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="terms" style={{ margin: 0 }}>
                            <input type="checkbox" defaultChecked /> {t("step4.bestOffer")}
                          </label>
                        </div>
                        <div className="form-group">
                          <label className="terms" style={{ margin: 0 }}>
                            <input type="checkbox" /> {t("step4.hidePrice")}
                          </label>
                        </div>
                      </div>

                      <div className="section-divider">{t("step4.boostDivider")} <span style={{ textTransform: "none", fontWeight: 500, color: "var(--text-3)", marginLeft: "6px" }}>{t("step4.boostOptional")}</span></div>

                      <div className="boost-cards" id="boostCards">
                        <div className="boost-card selected">
                          <div className="b-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M6 17l2-6h8l2 6" /></svg></div>
                          <h4>{t("step4.boost.0.name")}</h4>
                          <div className="b-price">{t("step4.boost.0.price")} <small>{t("step4.boost.0.period")}</small></div>
                          <p>{t("step4.boost.0.desc")}</p>
                        </div>
                        <div className="boost-card">
                          <span className="b-badge">{t("step4.boost.1.badge")}</span>
                          <div className="b-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" /></svg></div>
                          <h4>{t("step4.boost.1.name")}</h4>
                          <div className="b-price">{t("step4.boost.1.price")} <small>{t("step4.boost.1.period")}</small></div>
                          <p>{t("step4.boost.1.desc")}</p>
                        </div>
                        <div className="boost-card">
                          <span className="b-badge" style={{ background: "var(--brand)", color: "#fff" }}>{t("step4.boost.2.badge")}</span>
                          <div className="b-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V6M5 12l7-7 7 7" /></svg></div>
                          <h4>{t("step4.boost.2.name")}</h4>
                          <div className="b-price">{t("step4.boost.2.price")} <small>{t("step4.boost.2.period")}</small></div>
                          <p>{t("step4.boost.2.desc")}</p>
                        </div>
                      </div>

                      <div className="step-footer">
                        <button className="btn btn-outline" data-back="3">{t("common.back")}</button>
                        <button className="btn btn-primary btn-lg" data-next="5">{t("step4.continue")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg></button>
                      </div>
                    </section>

                    {/* STEP 5: PUBLISH */}
                    <section className="sell-step" data-sstep="5">
                      <h2>{t("step5.title")}</h2>
                      <p className="step-sub">{t("step5.sub")}</p>

                      <div className="form-group">
                        <label>{t("step5.descLabel")}</label>
                        <textarea className="form-input" rows={5} style={{ fontFamily: "inherit", resize: "vertical" }} placeholder={t("step5.descPlaceholder")} defaultValue={t("step5.descValue")} />
                        <div style={{ fontSize: "11.5px", color: "var(--text-3)", marginTop: "4px" }}>{t("step5.charCount")}</div>
                      </div>

                      <div className="section-divider">{t("step5.contactDivider")}</div>

                      <div className="form-grid">
                        <div className="form-group"><label>{t("step5.contactNameLabel")}</label><input className="form-input" defaultValue="Faisal Khan" /></div>
                        <div className="form-group"><label>{t("step5.mobileLabel")}</label><input className="form-input" defaultValue="+971 50 247 9842" /></div>
                        <div className="form-group full">
                          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{t("step5.showOnListing")}</span>
                          </label>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                            <label className="terms" style={{ margin: 0 }}><input type="checkbox" defaultChecked /> {t("step5.showPhone")}</label>
                            <label className="terms" style={{ margin: 0 }}><input type="checkbox" defaultChecked /> {t("step5.showWhatsapp")}</label>
                            <label className="terms" style={{ margin: 0 }}><input type="checkbox" defaultChecked /> {t("step5.showMessages")}</label>
                            <label className="terms" style={{ margin: 0 }}><input type="checkbox" /> {t("step5.showEmail")}</label>
                          </div>
                        </div>
                        <div className="form-group full"><label>{t("step5.durationLabel")}</label>
                          <select className="form-input">{list("step5.durations").map((o) => (<option key={o}>{o}</option>))}</select>
                        </div>
                      </div>

                      <label className="terms">
                        <input type="checkbox" required />
                        <span>{t("step5.termsPre")} <a href="#">{t("step5.termsLink")}</a> {t("step5.termsPost")}</span>
                      </label>

                      <div className="step-footer">
                        <button className="btn btn-outline" data-back="4">{t("common.back")}</button>
                        <button className="btn btn-primary btn-lg" id="publishBtn" style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-mid))" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                          {t("step5.publish")}
                        </button>
                      </div>
                    </section>

                    {/* STEP 6: SUCCESS (hidden until publish) */}
                    <section className="sell-step" data-sstep="6">
                      <div className="publish-success">
                        <div className="success-icon">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2>{t("step6.title")}</h2>
                        <p>{t("step6.sub")}</p>

                        <div className="publish-summary">
                          <h4>{t("step6.summaryTitle")}</h4>
                          <div className="ps-row"><span>{t("step6.rows.0.label")}</span><strong>{t("step6.rows.0.value")}</strong></div>
                          <div className="ps-row"><span>{t("step6.rows.1.label")}</span><strong>{t("step6.rows.1.value")}</strong></div>
                          <div className="ps-row"><span>{t("step6.rows.2.label")}</span><strong>{t("step6.rows.2.value")}</strong></div>
                          <div className="ps-row"><span>{t("step6.rows.3.label")}</span><strong>{t("step6.rows.3.value")}</strong></div>
                        </div>

                        <div className="publish-actions">
                          <Link href="/cars/demo" className="btn btn-primary btn-lg">{t("step6.viewListing")}</Link>
                          <Link href="/account" className="btn btn-outline btn-lg">{t("step6.dashboard")}</Link>
                          <button className="btn btn-secondary btn-lg">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
                            {t("step6.share")}
                          </button>
                        </div>
                      </div>
                    </section>

                  </div>
                </div>

                {/* ============ SIDEBAR ============ */}
                <aside className="sell-sidebar">

                  {/* Live valuation */}
                  <div className="valuation-card">
                    <div className="v-label">{t("sidebar.valuation.label")}</div>
                    <div className="v-range" id="vRange">{t("sidebar.valuation.range")}</div>
                    <div className="v-mid">{t("sidebar.valuation.medianLabel")} <strong id="vMid" style={{ color: "#fff" }}>{t("sidebar.valuation.medianValue")}</strong></div>
                    <div className="v-confidence">
                      <span>{t("sidebar.valuation.confidence")}</span>
                      <span className="confidence-dots" id="confDots"><span className="cd on"></span><span className="cd on"></span><span className="cd on"></span><span className="cd on"></span></span>
                      <span id="confLabel">{t("sidebar.valuation.confidenceLevel")}</span>
                    </div>
                    <div className="v-tip">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 014 12.7L14 17H10l-2-2.3A7 7 0 0112 2z" /></svg>
                      <span>{t("sidebar.valuation.tipPre")} <strong>{t("sidebar.valuation.tipDays")}</strong> {t("sidebar.valuation.tipPost")}</span>
                    </div>
                  </div>

                  {/* Comparable listings */}
                  <div className="compare-card">
                    <h4>{t("sidebar.compare.title")} <span className="cmp-count">{t("sidebar.compare.period")}</span></h4>
                    <div className="cmp-row">
                      <div className="cmp-info"><strong>{t("sidebar.compare.rows.0.name")}</strong><small>{t("sidebar.compare.rows.0.spec")}</small></div>
                      <span className="cmp-price">{t("sidebar.compare.rows.0.price")}</span>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-info"><strong>{t("sidebar.compare.rows.1.name")}</strong><small>{t("sidebar.compare.rows.1.spec")}</small></div>
                      <span className="cmp-price">{t("sidebar.compare.rows.1.price")}</span>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-info"><strong>{t("sidebar.compare.rows.2.name")}</strong><small>{t("sidebar.compare.rows.2.spec")}</small></div>
                      <span className="cmp-price">{t("sidebar.compare.rows.2.price")}</span>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-info"><strong>{t("sidebar.compare.rows.3.name")}</strong><small>{t("sidebar.compare.rows.3.spec")}</small></div>
                      <span className="cmp-price">{t("sidebar.compare.rows.3.price")}</span>
                    </div>
                  </div>

                  {/* Tips card (changes per step) */}
                  <div className="tips-card" id="tipsCard">
                    <h4>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 014 12.7L14 17H10l-2-2.3A7 7 0 0112 2z" /></svg>
                      {t("sidebar.tips.title")}
                    </h4>
                    <ul id="tipsList">
                      <li>{t("sidebar.tips.items.0")}</li>
                      <li>{t("sidebar.tips.items.1")}</li>
                      <li>{t("sidebar.tips.items.2")}</li>
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

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "mk-sell"],
      nextI18NextConfig,
    )),
  },
});
