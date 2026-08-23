import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import {
  getMakes,
  getModels,
  searchListings,
  submitLeadForm,
  type TaxonomyMake,
  type TaxonomyModel,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MknewCarsPage() {
  const { t } = useTranslation("mk-newCars");
  // P6-02 (AC-DLR-05): the hero quick-form is a REAL "Get best price" lead form.
  const [makes, setMakes] = React.useState<TaxonomyMake[]>([]);
  const [models, setModels] = React.useState<TaxonomyModel[]>([]);
  const [form, setLead] = React.useState({ makeId: "", modelId: "", name: "", phone: "" });
  const [leadState, setLeadState] = React.useState<"idle" | "busy" | "sent" | "none" | "error">("idle");
  React.useEffect(() => { void getMakes("CAR").then(setMakes).catch(() => undefined); }, []);
  const onBrand = async (makeId: string) => {
    setLead((f) => ({ ...f, makeId, modelId: "" }));
    setModels(makeId ? await getModels(makeId).catch(() => []) : []);
  };
  const submitBestPrice = async () => {
    if (!form.makeId || !form.modelId || !form.name.trim()) return;
    setLeadState("busy");
    try {
      // Route the lead to a dealer listing of this model (newest), else any listing.
      const dealer = await searchListings({ makeId: form.makeId, modelId: form.modelId, sellerType: "DEALER", limit: 1, sort: "newest" });
      const target = dealer.items[0] ?? (await searchListings({ makeId: form.makeId, modelId: form.modelId, limit: 1, sort: "newest" })).items[0];
      if (!target) { setLeadState("none"); return; }
      await submitLeadForm(target.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        message: `Get best price request (new cars) for ${target.year} ${target.make.name} ${target.model.name}`,
      });
      setLeadState("sent");
    } catch { setLeadState("error"); }
  };
  const list = (key: string) => t(key, { returnObjects: true }) as string[];
  const objs = <T,>(key: string) => t(key, { returnObjects: true }) as T[];

  const brandLogos = ["T", "N", "H", "L", "B", "M", "A", "H", "K", "P", "R", "T"];

  const modelCards = [
    { img: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=720&q=80&auto=format", badgeClass: "model-badge", badgeKey: "badge2025" },
    { img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=720&q=80&auto=format", badgeClass: "model-badge", badgeKey: "badge2025" },
    { img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=720&q=80&auto=format", badgeClass: "model-badge hybrid", badgeKey: "badgeHybrid" },
    { img: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=720&q=80&auto=format", badgeClass: "model-badge", badgeKey: "badge2025" },
    { img: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=720&q=80&auto=format", badgeClass: "model-badge electric", badgeKey: "badgeElectric" },
    { img: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=720&q=80&auto=format", badgeClass: "model-badge", badgeKey: "badge2025" },
    { img: "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=720&q=80&auto=format", badgeClass: "model-badge electric", badgeKey: "badgeElectric" },
    { img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=720&q=80&auto=format", badgeClass: "model-badge", badgeKey: "badge2025" },
  ];

  const categoryImgs = [
    "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=900&q=80&auto=format",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=900&q=80&auto=format",
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=80&auto=format",
    "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=900&q=80&auto=format",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?w=900&q=80&auto=format",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80&auto=format",
    "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=900&q=80&auto=format",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&q=80&auto=format",
  ];

  const comingImgs = [
    "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=720&q=80&auto=format",
    "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=720&q=80&auto=format",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?w=720&q=80&auto=format",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=720&q=80&auto=format",
  ];

  const articleImgs = [
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=80&auto=format",
    "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=900&q=80&auto=format",
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=80&auto=format",
  ];

  const swatches: { style: React.CSSProperties; active?: boolean }[] = [
    { style: { background: "#FFFFFF", border: "1px solid var(--border)" } },
    { style: { background: "#111827" }, active: true },
    { style: { background: "#9CA3AF" } },
    { style: { background: "#4B5563" } },
    { style: { background: "#DC2626" } },
    { style: { background: "#23416B" } },
    { style: { background: "#EAB308" } },
    { style: { background: "#22C55E" } },
    { style: { background: "#7C3F00" } },
    { style: { background: "#E97700" } },
    { style: { background: "#A855F7" } },
    { style: { background: "linear-gradient(45deg,#fff 0 50%,#111 50% 100%)" } },
  ];

  const makeChecked = [true, false, false, false, false, false, false, false];
  const yearChecked = [true, true];
  const trimChecked = [false, false, false, false];
  const transChecked = [true, false, false];
  const fuelChecked = [false, false, false, false, false];
  const driveChecked = [false, false, true, true];
  const offersChecked = [false, false, false, false];
  const locChecked = [false, false, false, false, false];

  const bodyChipActive = [false, true, false, false, false, false, false];
  const seatingChipActive = [false, false, false, false, true, false];

  const brandCards = objs<{ name: string; models: string; from: string }>("brands.cards");
  const modelCardText = objs<{ brand: string; name: string; meta: string; price: string }>("models.cards");
  const makeItems = objs<{ name: string; count: string }>("filters.make.items");
  const yearItems = objs<{ name: string; count: string }>("filters.year.items");
  const trimItems = objs<{ name: string; count: string }>("filters.trim.items");
  const transItems = objs<{ name: string; count: string }>("filters.transmission.items");
  const fuelItems = objs<{ name: string; count: string }>("filters.fuel.items");
  const driveItems = objs<{ name: string; count: string }>("filters.drive.items");
  const offersItems = objs<{ name: string; count: string }>("filters.offers.items");
  const locItems = objs<{ name: string; count: string }>("filters.location.items");
  const categoryCards = objs<{ title: string; desc: string; count: string }>("categories.cards");
  const comingCards = objs<{ brand: string; name: string; desc: string; eta: string }>("coming.cards");
  const dealsStats = objs<{ value: string; label: string }>("deals.stats");
  const reviewCards = objs<{ tag: string; title: string; date: string; read: string }>("reviews.cards");

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-new" className="page">

          {/* HERO */}
          <div className="new-hero">
            <div className="container">
              <span className="eyebrow">{t("hero.eyebrow")}</span>
              <h1>{t("hero.title")}</h1>
              <p className="sub">{t("hero.sub")}</p>

              <div className="qf-search">
                <div className="qf-field">
                  <label htmlFor="new-cars-qf-brand-label">{t("qf.brand.label")}</label>
                  <select id="new-cars-qf-brand-label" value={form.makeId} onChange={(e) => void onBrand(e.target.value)}>
                    <option value="">{t("bp.anyBrand", { defaultValue: "Select brand" })}</option>
                    {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="qf-field">
                  <label htmlFor="new-cars-qf-model-label">{t("qf.model.label")}</label>
                  <select id="new-cars-qf-model-label" value={form.modelId} onChange={(e) => setLead((f) => ({ ...f, modelId: e.target.value }))} disabled={!form.makeId}>
                    <option value="">{t("bp.anyModel", { defaultValue: "Select model" })}</option>
                    {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="qf-field">
                  <label htmlFor="new-cars-bp-name">{t("bp.name", { defaultValue: "Your name" })}</label>
                  <input id="new-cars-bp-name" className="form-input" style={{ height: 42 }} value={form.name} onChange={(e) => setLead((f) => ({ ...f, name: e.target.value }))} placeholder={t("bp.namePh", { defaultValue: "Full name" })} />
                </div>
                <div className="qf-field">
                  <label htmlFor="new-cars-bp-phone">{t("bp.phone", { defaultValue: "Mobile" })}</label>
                  <input id="new-cars-bp-phone" type="tel" inputMode="tel" autoComplete="tel" className="form-input" value={form.phone} onChange={(e) => setLead((f) => ({ ...f, phone: e.target.value }))} placeholder="+971 5x xxx xxxx" />
                </div>
                <div className="qf-cta">
                  <button className="btn btn-primary btn-lg" type="button" disabled={leadState === "busy" || !form.makeId || !form.modelId || !form.name.trim()} onClick={() => void submitBestPrice()}>
                    {leadState === "busy" ? t("bp.sending", { defaultValue: "Sending…" }) : t("bp.cta", { defaultValue: "Get best price" })}
                  </button>
                </div>
              </div>
              {leadState === "sent" && <p role="status" style={{ color: "#7EE2A8", marginTop: 10, fontWeight: 600 }}>{t("bp.sent", { defaultValue: "Request sent — a dealer will contact you with their best price." })}</p>}
              {leadState === "none" && <p role="alert" style={{ color: "#FFD48A", marginTop: 10 }}>{t("bp.none", { defaultValue: "No sellers list this model yet — try another model." })}</p>}
              {leadState === "error" && <p role="alert" style={{ color: "#FFB4B4", marginTop: 10 }}>{t("bp.error", { defaultValue: "Could not send your request. Please try again." })}</p>}

              <div className="qf-tags">
                <Link href="/cars?sort=newest&yearMin=2025" className="tag-pill"><span className="dot"></span> {t("qf.tags.0")}</Link>
                <Link href="/cars?fuelType=HYBRID" className="tag-pill">{t("qf.tags.1")}</Link>
                <Link href="/cars?bodyType=suv" className="tag-pill">{t("qf.tags.2")}</Link>
                <Link href="/cars?sort=newest" className="tag-pill">{t("qf.tags.3")}</Link>
                <Link href="/cars" className="tag-pill">{t("qf.tags.4")}</Link>
              </div>
            </div>
          </div>

          {/* BROWSE BY BRAND */}
          <section>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("brands.title")}</h2>
                  <p>{t("brands.sub")}</p>
                </div>
                <Link href="/cars" className="view-all">{t("brands.viewAll")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></Link>
              </div>
              <div className="new-brands">
                {brandCards.map((b, i) => (
                  <Link key={i} href={`/cars?q=${encodeURIComponent(b.name)}`} className="new-brand-card"><div className="logo-square">{brandLogos[i]}</div><div className="brand-name">{b.name}</div><div className="brand-models">{b.models}</div><div className="brand-from">{b.from}</div></Link>
                ))}
              </div>
            </div>
          </section>

          {/* MOST POPULAR NEW CARS (with filter sidebar) */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("browse.title")}</h2>
                  <p>{t("browse.sub")}</p>
                </div>
                <Link href="/cars" className="view-all">{t("browse.viewAll")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></Link>
              </div>

              <div className="search-grid">

                {/* FILTERS */}
                <aside className="filters-card">
                  <div className="filters-head">
                    <h3>{t("filters.title")}</h3>
                    <button className="reset">{t("filters.reset")}</button>
                  </div>
                  <div className="filters-body">

                    <div className="fgroup">
                      <h4>{t("filters.keyword.label")} <span className="chev">▾</span></h4>
                      <div className="fbody"><input className="f-input" placeholder={t("filters.keyword.placeholder")} /></div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.bodyType.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="chips">
                          {list("filters.bodyType.chips").map((c, i) => (
                            <span key={i} className={bodyChipActive[i] ? "chip active" : "chip"}>{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.make.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          {makeItems.map((m, i) => (
                            <label key={i} className="check-row"><input type="checkbox" defaultChecked={makeChecked[i]} /> {m.name} <span className="cnt">{m.count}</span></label>
                          ))}
                        </div>
                        <a className="more-link">{t("filters.make.more")}</a>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.model.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <select className="f-select">{list("filters.model.options").map((o, i) => <option key={i}>{o}</option>)}</select>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.price.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="range-row">
                          <input className="f-input" placeholder={t("filters.price.min")} /><span>–</span><input className="f-input" placeholder={t("filters.price.max")} />
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.year.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          {yearItems.map((y, i) => (
                            <label key={i} className="check-row"><input type="checkbox" defaultChecked={yearChecked[i]} /> {y.name} <span className="cnt">{y.count}</span></label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.trim.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          {trimItems.map((tr, i) => (
                            <label key={i} className="check-row"><input type="checkbox" defaultChecked={trimChecked[i]} /> {tr.name} <span className="cnt">{tr.count}</span></label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.transmission.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          {transItems.map((tm, i) => (
                            <label key={i} className="check-row"><input type="checkbox" defaultChecked={transChecked[i]} /> {tm.name} <span className="cnt">{tm.count}</span></label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.fuel.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          {fuelItems.map((f, i) => (
                            <label key={i} className="check-row"><input type="checkbox" defaultChecked={fuelChecked[i]} /> {f.name} <span className="cnt">{f.count}</span></label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.drive.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          {driveItems.map((d, i) => (
                            <label key={i} className="check-row"><input type="checkbox" defaultChecked={driveChecked[i]} /> {d.name} <span className="cnt">{d.count}</span></label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.seating.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="chips">
                          {list("filters.seating.chips").map((c, i) => (
                            <span key={i} className={seatingChipActive[i] ? "chip active" : "chip"}>{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.color.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="swatches">
                          {swatches.map((s, i) => (
                            <div key={i} className={s.active ? "swatch active" : "swatch"} style={s.style} title={list("filters.color.titles")[i]}></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.offers.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          {offersItems.map((o, i) => (
                            <label key={i} className="check-row"><input type="checkbox" defaultChecked={offersChecked[i]} /> {o.name} <span className="cnt">{o.count}</span></label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fgroup">
                      <h4>{t("filters.location.label")} <span className="chev">▾</span></h4>
                      <div className="fbody">
                        <div className="check-list">
                          {locItems.map((l, i) => (
                            <label key={i} className="check-row"><input type="checkbox" defaultChecked={locChecked[i]} /> {l.name} <span className="cnt">{l.count}</span></label>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </aside>

                {/* RESULTS */}
                <div className="results-area">

                  <div className="active-filters">
                    <span className="filter-chip">{t("activeFilters.chips.0")} <button aria-label={t("activeFilters.removeLabel")}>×</button></span>
                    <span className="filter-chip">{t("activeFilters.chips.1")} <button aria-label={t("activeFilters.removeLabel")}>×</button></span>
                    <span className="filter-chip">{t("activeFilters.chips.2")} <button aria-label={t("activeFilters.removeLabel")}>×</button></span>
                    <span className="filter-chip">{t("activeFilters.chips.3")} <button aria-label={t("activeFilters.removeLabel")}>×</button></span>
                    <button className="clear-all">{t("activeFilters.clearAll")}</button>
                  </div>

                  <div className="toolbar">
                    <div className="left"><strong style={{ color: "var(--text)" }}>{t("toolbar.countStrong")}</strong> {t("toolbar.countRest")}</div>
                    <div className="right">
                      <span className="muted">{t("toolbar.sortBy")}</span>
                      <select className="sort-select">
                        {list("toolbar.sort").map((o, i) => <option key={i}>{o}</option>)}
                      </select>
                      <div className="view-toggle">
                        <button className="active" title={t("toolbar.gridTitle")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg></button>
                        <button title={t("toolbar.listTitle")}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg></button>
                      </div>
                    </div>
                  </div>

                  <div className="model-grid">

                    {modelCards.map((c, i) => (
                      // The new-car catalogue is not built yet (P5-07), so a model
                      // card searches the real inventory for that brand+model
                      // rather than linking to a listing id that never existed.
                      <Link
                        key={i}
                        href={`/cars?q=${encodeURIComponent(`${modelCardText[i]?.brand ?? ""} ${modelCardText[i]?.name ?? ""}`.trim())}`}
                        className="model-card detail-link"
                      >
                        <div className="model-media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.img} alt="" />
                          <span className={c.badgeClass}>{t(`models.${c.badgeKey}`)}</span>
                        </div>
                        <div className="model-body">
                          <span className="model-brand">{modelCardText[i].brand}</span>
                          <h3>{modelCardText[i].name}</h3>
                          <p className="model-meta">{modelCardText[i].meta}</p>
                          <div className="model-price">
                            <span className="from">{t("models.startingFrom")}</span>
                            <span className="amt">{modelCardText[i].price}</span>
                          </div>
                          <div className="model-actions">
                            <button className="btn btn-primary btn-mini">{t("models.viewTrims")}</button>
                            <button className="btn btn-outline btn-mini">{t("models.brochure")}</button>
                          </div>
                        </div>
                      </Link>
                    ))}

                  </div>{/* /.model-grid */}

                  {/* PAGINATION */}
                  <div className="pagination" style={{ marginTop: 24 }}>
                    <a className="disabled">{t("pagination.prev")}</a>
                    <a className="active">1</a>
                    <a>2</a><a>3</a><a>4</a><a>5</a>
                    <span className="dots">…</span>
                    <a>118</a>
                    <a>{t("pagination.next")}</a>
                  </div>

                </div>{/* /.results-area */}
              </div>{/* /.search-grid */}
            </div>
          </section>

          {/* BY CATEGORY */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("categories.title")}</h2>
                  <p>{t("categories.sub")}</p>
                </div>
              </div>
              <div className="new-cats">
                {categoryCards.map((c, i) => (
                  <Link key={i} href="/new-cars" className="new-cat" style={{ backgroundImage: `url('${categoryImgs[i]}')` }}>
                    <div className="nc-body"><h3>{c.title}</h3><p>{c.desc} <span className="count">{c.count}</span></p></div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* COMING SOON */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("coming.title")}</h2>
                  <p>{t("coming.sub")}</p>
                </div>
                <Link href="/cars?sort=newest" className="view-all">{t("coming.viewAll")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></Link>
              </div>
              <div className="coming-grid">

                {comingCards.map((c, i) => (
                  <div key={i} className="coming-card">
                    <div className="coming-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={comingImgs[i]} alt="" />
                      <span className="coming-eta">{c.eta}</span>
                    </div>
                    <div className="coming-body">
                      <span className="brand-tag">{c.brand}</span>
                      <h3>{c.name}</h3>
                      <p>{c.desc}</p>
                      <button className="notify">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></svg>
                        {t("coming.notify")}
                      </button>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </section>

          {/* MAY OFFERS / DEALS BANNER */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="deals-banner">
                <div>
                  <span className="deals-eyebrow">{t("deals.eyebrow")}</span>
                  <h2>{t("deals.title")}</h2>
                  <p>{t("deals.text")}</p>
                  <Link href="/cars" className="btn btn-xl">{t("deals.cta")} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg></Link>
                </div>
                <div className="deals-stats">
                  {dealsStats.map((s, i) => (
                    <div key={i} className="ds"><strong>{s.value}</strong><span>{s.label}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* NEW CAR REVIEWS */}
          <section style={{ paddingTop: 0 }}>
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>{t("reviews.title")}</h2>
                  <p>{t("reviews.sub")}</p>
                </div>
                <Link href="/news" className="view-all">{t("reviews.viewAll")} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></Link>
              </div>
              <div className="articles">
                {reviewCards.map((r, i) => (
                  <Link key={i} href="/news" className="article">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <div className="media"><img src={articleImgs[i]} alt="" /></div>
                    <div className="article-body">
                      <span className="tag">{r.tag}</span>
                      <h3>{r.title}</h3>
                      <div className="meta"><span>{r.date}</span><span>•</span><span>{r.read}</span></div>
                    </div>
                  </Link>
                ))}
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
      ["common", "mk-newCars"],
      nextI18NextConfig,
    )),
  },
});
