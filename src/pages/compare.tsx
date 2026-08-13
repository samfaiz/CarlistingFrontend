import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MkcomparePage() {
  const { t } = useTranslation("mk-compare");
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-compare" className="page">
          <div className="compare-wrap">
            <div className="container">

              {/* Header */}
              <div className="breadcrumb">
                <Link href="/">{t("breadcrumb.home")}</Link><span className="sep">›</span>
                <span className="current">{t("breadcrumb.current")}</span>
              </div>

              <div className="compare-head">
                <div>
                  <h1>{t("head.title")}</h1>
                  <p>{t("head.subtitle")}</p>
                </div>
                <div className="compare-actions">
                  <button className="btn btn-outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                    {t("actions.save")}
                  </button>
                  <button className="btn btn-outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
                    {t("actions.share")}
                  </button>
                  <button className="btn btn-outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
                    {t("actions.print")}
                  </button>
                  <button className="btn btn-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
                    {t("actions.addCar")}
                  </button>
                </div>
              </div>

              {/* Sticky car columns header */}
              <div className="compare-cars" id="compareCars">
                <div className="cmp-spec-col">
                  <h3>{t("cars.heading")}</h3>
                  <p>{t("cars.hint")}</p>
                  <div className="limit">{t("cars.limit")}</div>
                </div>

                <div className="cmp-car" data-car="1">
                  <button className="cmp-remove" data-remove="1" title={t("cars.remove")}>✕</button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="cmp-car-photo"><img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600&q=80&auto=format" alt="" /></div>
                  <div className="cmp-car-brand">{t("car1.brand")}</div>
                  <h4>{t("car1.name")}</h4>
                  <p className="cmp-car-meta">{t("car1.meta")}</p>
                  <div className="cmp-car-price">{t("car1.price")}</div>
                  <div className="cmp-car-actions">
                    <Link href="/cars/demo" className="btn btn-primary">{t("cars.viewDetails")}</Link>
                    <Link href="/dealers/demo" className="btn btn-outline">{t("car1.dealer")}</Link>
                  </div>
                </div>

                <div className="cmp-car" data-car="2">
                  <button className="cmp-remove" data-remove="2" title={t("cars.remove")}>✕</button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="cmp-car-photo"><img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80&auto=format" alt="" /></div>
                  <div className="cmp-car-brand">{t("car2.brand")}</div>
                  <h4>{t("car2.name")}</h4>
                  <p className="cmp-car-meta">{t("car2.meta")}</p>
                  <div className="cmp-car-price">{t("car2.price")}</div>
                  <div className="cmp-car-actions">
                    <Link href="/cars/demo" className="btn btn-primary">{t("cars.viewDetails")}</Link>
                    <Link href="/dealers/demo" className="btn btn-outline">{t("car2.dealer")}</Link>
                  </div>
                </div>

                <div className="cmp-car" data-car="3">
                  <button className="cmp-remove" data-remove="3" title={t("cars.remove")}>✕</button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="cmp-car-photo"><img src="https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=600&q=80&auto=format" alt="" /></div>
                  <div className="cmp-car-brand">{t("car3.brand")}</div>
                  <h4>{t("car3.name")}</h4>
                  <p className="cmp-car-meta">{t("car3.meta")}</p>
                  <div className="cmp-car-price">{t("car3.price")}</div>
                  <div className="cmp-car-actions">
                    <Link href="/cars/demo" className="btn btn-primary">{t("cars.viewDetails")}</Link>
                    <Link href="/dealers/demo" className="btn btn-outline">{t("car3.dealer")}</Link>
                  </div>
                </div>

                <div className="cmp-add" id="cmpAdd">
                  <div className="cmp-add-content">
                    <div className="add-icon-big">+</div>
                    <p>{t("add.title")}</p>
                    <small>{t("add.subtitle1")}<br/>{t("add.subtitle2")}</small>
                  </div>
                </div>
              </div>

              {/* ============ SPEC SECTIONS ============ */}
              <div className="cmp-sections" id="cmpSections">

                {/* AT A GLANCE */}
                <div className="cmp-section">
                  <h3 className="cmp-section-title">
                    <div className="left">
                      <div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                      {t("glance.title")}
                    </div>
                    <svg className="cmp-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </h3>
                  <div className="cmp-table">
                    <div className="cmp-row">
                      <div className="cmp-label">{t("glance.year.label")}</div>
                      <div className="cmp-val winner">{t("glance.year.v1")}</div>
                      <div className="cmp-val winner">{t("glance.year.v2")}</div>
                      <div className="cmp-val">{t("glance.year.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("glance.body.label")}</div>
                      <div className="cmp-val">{t("glance.body.v1")}</div>
                      <div className="cmp-val">{t("glance.body.v2")}</div>
                      <div className="cmp-val">{t("glance.body.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("glance.mileage.label")}</div>
                      <div className="cmp-val winner">
                        <div className="bar-wrap">{t("glance.mileage.v1")}<div className="cmp-bar"><div className="cmp-bar-fill success" style={{ width: "9%" }}></div></div></div>
                      </div>
                      <div className="cmp-val">
                        <div className="bar-wrap">{t("glance.mileage.v2")}<div className="cmp-bar"><div className="cmp-bar-fill" style={{ width: "19%" }}></div></div></div>
                      </div>
                      <div className="cmp-val dim">
                        <div className="bar-wrap">{t("glance.mileage.v3")}<div className="cmp-bar"><div className="cmp-bar-fill warn" style={{ width: "31%" }}></div></div></div>
                      </div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("glance.specs.label")}</div>
                      <div className="cmp-val">{t("glance.specs.v1")}</div>
                      <div className="cmp-val">{t("glance.specs.v2")}</div>
                      <div className="cmp-val">{t("glance.specs.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("glance.color.label")}</div>
                      <div className="cmp-val">{t("glance.color.v1")}</div>
                      <div className="cmp-val">{t("glance.color.v2")}</div>
                      <div className="cmp-val">{t("glance.color.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("glance.price.label")}</div>
                      <div className="cmp-val">{t("glance.price.v1")}</div>
                      <div className="cmp-val">{t("glance.price.v2")}</div>
                      <div className="cmp-val winner">{t("glance.price.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("glance.monthly.label")}</div>
                      <div className="cmp-val">{t("glance.monthly.v1")}</div>
                      <div className="cmp-val">{t("glance.monthly.v2")}</div>
                      <div className="cmp-val winner">{t("glance.monthly.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("glance.location.label")}</div>
                      <div className="cmp-val">{t("glance.location.v1")}</div>
                      <div className="cmp-val">{t("glance.location.v2")}</div>
                      <div className="cmp-val">{t("glance.location.v3")}</div>
                    </div>
                  </div>
                </div>

                {/* ENGINE & PERFORMANCE */}
                <div className="cmp-section">
                  <h3 className="cmp-section-title">
                    <div className="left">
                      <div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
                      {t("engine.title")}
                    </div>
                    <svg className="cmp-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </h3>
                  <div className="cmp-table">
                    <div className="cmp-row">
                      <div className="cmp-label">{t("engine.engine.label")}</div>
                      <div className="cmp-val">{t("engine.engine.v1")}</div>
                      <div className="cmp-val">{t("engine.engine.v2")}</div>
                      <div className="cmp-val">{t("engine.engine.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("engine.hp.label")}</div>
                      <div className="cmp-val">{t("engine.hp.v1")}</div>
                      <div className="cmp-val">{t("engine.hp.v2")}</div>
                      <div className="cmp-val">{t("engine.hp.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("engine.torque.label")}</div>
                      <div className="cmp-val winner">{t("engine.torque.v1")}</div>
                      <div className="cmp-val">{t("engine.torque.v2")}</div>
                      <div className="cmp-val">{t("engine.torque.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("engine.accel.label")}</div>
                      <div className="cmp-val">{t("engine.accel.v1")}</div>
                      <div className="cmp-val winner">{t("engine.accel.v2")}</div>
                      <div className="cmp-val">{t("engine.accel.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("engine.topSpeed.label")}</div>
                      <div className="cmp-val">{t("engine.topSpeed.v1")}</div>
                      <div className="cmp-val winner">{t("engine.topSpeed.v2")}</div>
                      <div className="cmp-val">{t("engine.topSpeed.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("engine.trans.label")}</div>
                      <div className="cmp-val">{t("engine.trans.v1")}</div>
                      <div className="cmp-val winner">{t("engine.trans.v2")}</div>
                      <div className="cmp-val">{t("engine.trans.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("engine.drive.label")}</div>
                      <div className="cmp-val">{t("engine.drive.v1")}</div>
                      <div className="cmp-val">{t("engine.drive.v2")}</div>
                      <div className="cmp-val">{t("engine.drive.v3")}</div>
                    </div>
                  </div>
                </div>

                {/* FUEL & RANGE */}
                <div className="cmp-section">
                  <h3 className="cmp-section-title">
                    <div className="left">
                      <div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12v16H4z"/><path d="M16 8h2a2 2 0 012 2v6a2 2 0 01-2 2"/><path d="M7 7h6M7 11h6"/></svg></div>
                      {t("fuel.title")}
                    </div>
                    <svg className="cmp-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </h3>
                  <div className="cmp-table">
                    <div className="cmp-row">
                      <div className="cmp-label">{t("fuel.type.label")}</div>
                      <div className="cmp-val">{t("fuel.type.v1")}</div>
                      <div className="cmp-val">{t("fuel.type.v2")}</div>
                      <div className="cmp-val">{t("fuel.type.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("fuel.consumption.label")}</div>
                      <div className="cmp-val">{t("fuel.consumption.v1")}</div>
                      <div className="cmp-val winner">{t("fuel.consumption.v2")}</div>
                      <div className="cmp-val dim">{t("fuel.consumption.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("fuel.tank.label")}</div>
                      <div className="cmp-val winner">{t("fuel.tank.v1")}</div>
                      <div className="cmp-val">{t("fuel.tank.v2")}</div>
                      <div className="cmp-val">{t("fuel.tank.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("fuel.range.label")}</div>
                      <div className="cmp-val winner">{t("fuel.range.v1")}</div>
                      <div className="cmp-val">{t("fuel.range.v2")}</div>
                      <div className="cmp-val">{t("fuel.range.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("fuel.annualCost.label")}</div>
                      <div className="cmp-val">{t("fuel.annualCost.v1")}</div>
                      <div className="cmp-val winner">{t("fuel.annualCost.v2")}</div>
                      <div className="cmp-val dim">{t("fuel.annualCost.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("fuel.co2.label")}</div>
                      <div className="cmp-val">{t("fuel.co2.v1")}</div>
                      <div className="cmp-val winner">{t("fuel.co2.v2")}</div>
                      <div className="cmp-val">{t("fuel.co2.v3")}</div>
                    </div>
                  </div>
                </div>

                {/* DIMENSIONS */}
                <div className="cmp-section">
                  <h3 className="cmp-section-title">
                    <div className="left">
                      <div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/></svg></div>
                      {t("dimensions.title")}
                    </div>
                    <svg className="cmp-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </h3>
                  <div className="cmp-table">
                    <div className="cmp-row">
                      <div className="cmp-label">{t("dimensions.length.label")}</div>
                      <div className="cmp-val">{t("dimensions.length.v1")}</div>
                      <div className="cmp-val">{t("dimensions.length.v2")}</div>
                      <div className="cmp-val winner">{t("dimensions.length.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("dimensions.width.label")}</div>
                      <div className="cmp-val">{t("dimensions.width.v1")}</div>
                      <div className="cmp-val">{t("dimensions.width.v2")}</div>
                      <div className="cmp-val winner">{t("dimensions.width.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("dimensions.height.label")}</div>
                      <div className="cmp-val">{t("dimensions.height.v1")}</div>
                      <div className="cmp-val">{t("dimensions.height.v2")}</div>
                      <div className="cmp-val winner">{t("dimensions.height.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("dimensions.wheelbase.label")}</div>
                      <div className="cmp-val">{t("dimensions.wheelbase.v1")}</div>
                      <div className="cmp-val">{t("dimensions.wheelbase.v2")}</div>
                      <div className="cmp-val winner">{t("dimensions.wheelbase.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("dimensions.clearance.label")}</div>
                      <div className="cmp-val winner">{t("dimensions.clearance.v1")}</div>
                      <div className="cmp-val">{t("dimensions.clearance.v2")}</div>
                      <div className="cmp-val">{t("dimensions.clearance.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("dimensions.seating.label")}</div>
                      <div className="cmp-val">{t("dimensions.seating.v1")}</div>
                      <div className="cmp-val">{t("dimensions.seating.v2")}</div>
                      <div className="cmp-val winner">{t("dimensions.seating.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("dimensions.cargo.label")}</div>
                      <div className="cmp-val winner">{t("dimensions.cargo.v1")}</div>
                      <div className="cmp-val">{t("dimensions.cargo.v2")}</div>
                      <div className="cmp-val">{t("dimensions.cargo.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("dimensions.towing.label")}</div>
                      <div className="cmp-val winner">{t("dimensions.towing.v1")}</div>
                      <div className="cmp-val">{t("dimensions.towing.v2")}</div>
                      <div className="cmp-val winner">{t("dimensions.towing.v3")}</div>
                    </div>
                  </div>
                </div>

                {/* FEATURES */}
                <div className="cmp-section">
                  <h3 className="cmp-section-title">
                    <div className="left">
                      <div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg></div>
                      {t("features.title")}
                    </div>
                    <svg className="cmp-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </h3>
                  <div className="cmp-table">
                    <div className="cmp-row">
                      <div className="cmp-label">{t("features.moonroof.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val"><span className="cross"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M6 18L18 6"/></svg></span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("features.leather.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("features.heatedCooled.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val"><span style={{ color: "var(--warning)", fontSize: "11.5px", fontWeight: 700 }}>{t("features.heatedCooled.v3")}</span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("features.carplay.label")}</div>
                      <div className="cmp-val winner">{t("features.carplay.v1")}</div>
                      <div className="cmp-val winner">{t("features.carplay.v2")}</div>
                      <div className="cmp-val">{t("features.carplay.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("features.audio.label")}</div>
                      <div className="cmp-val winner">{t("features.audio.v1")}</div>
                      <div className="cmp-val winner">{t("features.audio.v2")}</div>
                      <div className="cmp-val">{t("features.audio.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("features.charging.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val"><span className="cross"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M6 18L18 6"/></svg></span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("features.hud.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val"><span className="cross"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M6 18L18 6"/></svg></span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("features.camera.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("features.terrain.label")}</div>
                      <div className="cmp-val winner">{t("features.terrain.v1")}</div>
                      <div className="cmp-val">{t("features.terrain.v2")}</div>
                      <div className="cmp-val">{t("features.terrain.v3")}</div>
                    </div>
                  </div>
                </div>

                {/* SAFETY & TECHNOLOGY */}
                <div className="cmp-section">
                  <h3 className="cmp-section-title">
                    <div className="left">
                      <div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z"/><path d="M9 12l2 2 4-4"/></svg></div>
                      {t("safety.title")}
                    </div>
                    <svg className="cmp-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </h3>
                  <div className="cmp-table">
                    <div className="cmp-row">
                      <div className="cmp-label">{t("safety.airbags.label")}</div>
                      <div className="cmp-val winner">{t("safety.airbags.v1")}</div>
                      <div className="cmp-val">{t("safety.airbags.v2")}</div>
                      <div className="cmp-val">{t("safety.airbags.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("safety.precollision.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val"><span className="cross"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M6 18L18 6"/></svg></span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("safety.acc.label")}</div>
                      <div className="cmp-val winner">{t("safety.acc.v1")}</div>
                      <div className="cmp-val winner">{t("safety.acc.v2")}</div>
                      <div className="cmp-val">{t("safety.acc.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("safety.lka.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val"><span className="cross"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M6 18L18 6"/></svg></span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("safety.bsm.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("safety.aeb.label")}</div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val winner"><span className="check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg></span></div>
                      <div className="cmp-val"><span className="cross"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 6l12 12M6 18L18 6"/></svg></span></div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("safety.ncap.label")}</div>
                      <div className="cmp-val winner">{t("safety.ncap.v1")}</div>
                      <div className="cmp-val winner">{t("safety.ncap.v2")}</div>
                      <div className="cmp-val">{t("safety.ncap.v3")}</div>
                    </div>
                  </div>
                </div>

                {/* PRICING & OWNERSHIP */}
                <div className="cmp-section">
                  <h3 className="cmp-section-title">
                    <div className="left">
                      <div className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
                      {t("pricing.title")}
                    </div>
                    <svg className="cmp-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </h3>
                  <div className="cmp-table">
                    <div className="cmp-row">
                      <div className="cmp-label">{t("pricing.asking.label")}</div>
                      <div className="cmp-val">{t("pricing.asking.v1")}</div>
                      <div className="cmp-val">{t("pricing.asking.v2")}</div>
                      <div className="cmp-val winner">{t("pricing.asking.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("pricing.monthly.label")}</div>
                      <div className="cmp-val">{t("pricing.monthly.v1")}</div>
                      <div className="cmp-val">{t("pricing.monthly.v2")}</div>
                      <div className="cmp-val winner">{t("pricing.monthly.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("pricing.warranty.label")}</div>
                      <div className="cmp-val winner">{t("pricing.warranty.v1")}</div>
                      <div className="cmp-val">{t("pricing.warranty.v2")}</div>
                      <div className="cmp-val dim">{t("pricing.warranty.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("pricing.service.label")}</div>
                      <div className="cmp-val">{t("pricing.service.v1")}</div>
                      <div className="cmp-val winner">{t("pricing.service.v2")}</div>
                      <div className="cmp-val">{t("pricing.service.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("pricing.annualService.label")}</div>
                      <div className="cmp-val">{t("pricing.annualService.v1")}</div>
                      <div className="cmp-val winner">{t("pricing.annualService.v2")}</div>
                      <div className="cmp-val">{t("pricing.annualService.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("pricing.insurance.label")}</div>
                      <div className="cmp-val">{t("pricing.insurance.v1")}</div>
                      <div className="cmp-val winner">{t("pricing.insurance.v2")}</div>
                      <div className="cmp-val winner">{t("pricing.insurance.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("pricing.depreciation.label")}</div>
                      <div className="cmp-val winner">{t("pricing.depreciation.v1")}</div>
                      <div className="cmp-val">{t("pricing.depreciation.v2")}</div>
                      <div className="cmp-val">{t("pricing.depreciation.v3")}</div>
                    </div>
                    <div className="cmp-row">
                      <div className="cmp-label">{t("pricing.inspection.label")}</div>
                      <div className="cmp-val winner">{t("pricing.inspection.v1")}</div>
                      <div className="cmp-val winner">{t("pricing.inspection.v2")}</div>
                      <div className="cmp-val">{t("pricing.inspection.v3")}</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer summary */}
              <div className="compare-foot">
                <div className="ft-text">
                  <strong>{t("foot.pickLabel")}</strong> {t("foot.pickText")}
                </div>
                <div className="compare-actions">
                  <button className="btn btn-outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    {t("foot.downloadPdf")}
                  </button>
                  <button className="btn btn-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                    {t("foot.saveAccount")}
                  </button>
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
      ["common", "mk-compare"],
      nextI18NextConfig,
    )),
  },
});
