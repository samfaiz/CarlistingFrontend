import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { getServerSession } from "next-auth/next";
import { signOut } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { MarketplaceCard } from "@/components/marketplace/listing-card";
import { myListings, type Card } from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

interface AccountProps {
  user: { name: string; email: string; initials: string; role: string };
  listings: Card[];
}

export default function MkaccountPage({ user, listings }: AccountProps) {
  const { t } = useTranslation("mk-account");
  // The mockup's vanilla-JS tab switching, ported to React state (P6 fix —
  // the sidebar anchors were dead on the live page).
  const [tab, setTab] = React.useState("dashboard");
  const isStaff = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-account" className="page">
          <div className="account-wrap">
            <div className="container">
              <div className="account-grid">

                {/* ============ SIDEBAR ============ */}
                <aside className="account-sidebar">
                  <div className="acc-user">
                    <div className="acc-avatar">{user.initials}</div>
                    <h3>{user.name}</h3>
                    <div className="acc-email-text">{user.email}</div>
                    <span className="acc-tier">{t("user.tier")}</span>
                  </div>
                  <div className="acc-menu" id="accMenu">
                    {isStaff && (
                      <>
                        <Link href="/admin" style={{ fontWeight: 700 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /></svg>
                          {t("menu.adminPanel", { defaultValue: "Admin panel" })}
                        </Link>
                        <div className="menu-divider"></div>
                      </>
                    )}
                    <a data-tab="dashboard" role="button" tabIndex={0} className={tab === "dashboard" ? "active" : undefined} onClick={() => setTab("dashboard")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                      {t("menu.dashboard")}
                    </a>
                    <a data-tab="saved" role="button" tabIndex={0} className={tab === "saved" ? "active" : undefined} onClick={() => setTab("saved")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                      {t("menu.saved")} <span className="count-pill">{t("menu.savedCount")}</span>
                    </a>
                    <a data-tab="searches" role="button" tabIndex={0} className={tab === "searches" ? "active" : undefined} onClick={() => setTab("searches")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                      {t("menu.searches")} <span className="count-pill">{t("menu.searchesCount")}</span>
                    </a>
                    <a data-tab="messages" role="button" tabIndex={0} className={tab === "messages" ? "active" : undefined} onClick={() => setTab("messages")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8z" /></svg>
                      {t("menu.messages")} <span className="count-pill">{t("menu.messagesCount")}</span>
                    </a>
                    <a data-tab="listings" role="button" tabIndex={0} className={tab === "listings" ? "active" : undefined} onClick={() => setTab("listings")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2" /></svg>
                      {t("menu.listings")} <span className="count-pill">{t("menu.listingsCount")}</span>
                    </a>
                    <a data-tab="alerts" role="button" tabIndex={0} className={tab === "alerts" ? "active" : undefined} onClick={() => setTab("alerts")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></svg>
                      {t("menu.alerts")} <span className="count-pill">{t("menu.alertsCount")}</span>
                    </a>
                    <div className="menu-divider"></div>
                    <a data-tab="profile" role="button" tabIndex={0} className={tab === "profile" ? "active" : undefined} onClick={() => setTab("profile")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      {t("menu.profile")}
                    </a>
                    <a data-tab="notifications" role="button" tabIndex={0} className={tab === "notifications" ? "active" : undefined} onClick={() => setTab("notifications")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                      {t("menu.notifications")}
                    </a>
                    <a data-tab="security" role="button" tabIndex={0} className={tab === "security" ? "active" : undefined} onClick={() => setTab("security")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                      {t("menu.security")}
                    </a>
                    <div className="menu-divider"></div>
                    <a className="signout" role="button" tabIndex={0} onClick={() => void signOut({ callbackUrl: "/" })}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                      {t("menu.signout")}
                    </a>
                  </div>
                </aside>

                {/* ============ MAIN ============ */}
                <div className="account-main">

                  {/* DASHBOARD */}
                  <section className={`acc-section${tab === "dashboard" ? " active" : ""}`} data-section="dashboard">
                    <h2>{t("dashboard.welcome")}</h2>
                    <p className="section-sub">{t("dashboard.sub")}</p>

                    <div className="stats-grid">
                      <div className="stat-card" data-jump="saved">
                        <div className="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg></div>
                        <div className="stat-val">{t("stats.saved.val")}</div>
                        <div className="stat-label">{t("stats.saved.label")}</div>
                        <div className="stat-trend">{t("stats.saved.trend")}</div>
                      </div>
                      <div className="stat-card" data-jump="searches">
                        <div className="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg></div>
                        <div className="stat-val">{t("stats.searches.val")}</div>
                        <div className="stat-label">{t("stats.searches.label")}</div>
                        <div className="stat-trend">{t("stats.searches.trend")}</div>
                      </div>
                      <div className="stat-card" data-jump="messages">
                        <div className="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8z" /></svg></div>
                        <div className="stat-val">{t("stats.messages.val")}</div>
                        <div className="stat-label">{t("stats.messages.label")}</div>
                        <div className="stat-trend" style={{ color: "var(--info)" }}>{t("stats.messages.trend")}</div>
                      </div>
                      <div className="stat-card" data-jump="listings">
                        <div className="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M6 17l2-6h8l2 6" /></svg></div>
                        <div className="stat-val">{t("stats.listings.val")}</div>
                        <div className="stat-label">{t("stats.listings.label")}</div>
                        <div className="stat-trend">{t("stats.listings.trend")}</div>
                      </div>
                    </div>

                    <div className="activity-block">
                      <h3>{t("dashboard.savedTitle")} <a href="#" data-jump="saved">{t("dashboard.viewAllSaved")}</a></h3>
                      <div className="cards">
                        <Link href="/cars/demo" className="card">
                          <div className="media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=720&q=80&auto=format" alt="" />
                          <span className="badge">{t("recent.0.badge")}</span></div>
                          <div className="card-body"><h3 className="card-title">{t("recent.0.title")}</h3><p className="card-sub">{t("recent.0.sub")}</p><div className="price">{t("recent.0.price")}</div></div>
                        </Link>
                        <Link href="/cars/demo" className="card">
                          <div className="media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=720&q=80&auto=format" alt="" />
                          </div>
                          <div className="card-body"><h3 className="card-title">{t("recent.1.title")}</h3><p className="card-sub">{t("recent.1.sub")}</p><div className="price">{t("recent.1.price")}</div></div>
                        </Link>
                        <Link href="/cars/demo" className="card">
                          <div className="media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1542362567-b07e54358753?w=720&q=80&auto=format" alt="" />
                          </div>
                          <div className="card-body"><h3 className="card-title">{t("recent.2.title")}</h3><p className="card-sub">{t("recent.2.sub")}</p><div className="price">{t("recent.2.price")}</div></div>
                        </Link>
                      </div>
                    </div>

                    <div className="activity-block">
                      <h3>{t("dashboard.msgTitle")} <a href="#" data-jump="messages">{t("dashboard.viewAllMsg")}</a></h3>
                      <div className="msg-row unread">
                        <div className="msg-av">{t("latest.0.av")}</div>
                        <div className="msg-body">
                          <div className="msg-head"><strong>{t("latest.0.name")}</strong><time>{t("latest.0.time")}</time></div>
                          <div className="msg-car">{t("latest.0.car")}</div>
                          <div className="msg-preview">{t("latest.0.preview")}</div>
                        </div>
                      </div>
                      <div className="msg-row unread">
                        <div className="msg-av">{t("latest.1.av")}</div>
                        <div className="msg-body">
                          <div className="msg-head"><strong>{t("latest.1.name")}</strong><time>{t("latest.1.time")}</time></div>
                          <div className="msg-car">{t("latest.1.car")}</div>
                          <div className="msg-preview">{t("latest.1.preview")}</div>
                        </div>
                      </div>
                      <div className="msg-row">
                        <div className="msg-av">{t("latest.2.av")}</div>
                        <div className="msg-body">
                          <div className="msg-head"><strong>{t("latest.2.name")}</strong><time>{t("latest.2.time")}</time></div>
                          <div className="msg-car">{t("latest.2.car")}</div>
                          <div className="msg-preview">{t("latest.2.preview")}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SAVED CARS */}
                  <section className={`acc-section${tab === "saved" ? " active" : ""}`} data-section="saved">
                    <h2>{t("saved.title")}</h2>
                    <p className="section-sub">{t("saved.sub")}</p>
                    <div className="activity-block" style={{ padding: "18px" }}>
                      <div className="cards" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                        <Link href="/cars/demo" className="card">
                          <div className="media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=720&q=80&auto=format" alt="" />
                          <span className="badge">{t("savedCars.0.badge")}</span></div>
                          <div className="card-body"><h3 className="card-title">{t("savedCars.0.title")}</h3><p className="card-sub">{t("savedCars.0.sub")}</p><div className="price">{t("savedCars.0.price")}</div></div>
                        </Link>
                        <Link href="/cars/demo" className="card">
                          <div className="media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=720&q=80&auto=format" alt="" />
                          </div>
                          <div className="card-body"><h3 className="card-title">{t("savedCars.1.title")}</h3><p className="card-sub">{t("savedCars.1.sub")}</p><div className="price">{t("savedCars.1.price")}</div></div>
                        </Link>
                        <Link href="/cars/demo" className="card">
                          <div className="media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=720&q=80&auto=format" alt="" />
                          </div>
                          <div className="card-body"><h3 className="card-title">{t("savedCars.2.title")}</h3><p className="card-sub">{t("savedCars.2.sub")}</p><div className="price">{t("savedCars.2.price")}</div></div>
                        </Link>
                        <Link href="/cars/demo" className="card">
                          <div className="media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=720&q=80&auto=format" alt="" />
                          <span className="badge badge-warning">{t("savedCars.3.badgeWarning")}</span></div>
                          <div className="card-body"><h3 className="card-title">{t("savedCars.3.title")}</h3><p className="card-sub">{t("savedCars.3.sub")}</p><div className="price">{t("savedCars.3.price")} <small style={{ textDecoration: "line-through", color: "var(--text-3)", marginLeft: "6px" }}>{t("savedCars.3.priceOld")}</small></div></div>
                        </Link>
                        <Link href="/cars/demo" className="card">
                          <div className="media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1542362567-b07e54358753?w=720&q=80&auto=format" alt="" />
                          </div>
                          <div className="card-body"><h3 className="card-title">{t("savedCars.4.title")}</h3><p className="card-sub">{t("savedCars.4.sub")}</p><div className="price">{t("savedCars.4.price")}</div></div>
                        </Link>
                        <Link href="/cars/demo" className="card">
                          <div className="media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=720&q=80&auto=format" alt="" />
                          </div>
                          <div className="card-body"><h3 className="card-title">{t("savedCars.5.title")}</h3><p className="card-sub">{t("savedCars.5.sub")}</p><div className="price">{t("savedCars.5.price")}</div></div>
                        </Link>
                      </div>
                    </div>
                  </section>

                  {/* SAVED SEARCHES */}
                  <section className={`acc-section${tab === "searches" ? " active" : ""}`} data-section="searches">
                    <h2>{t("searches.title")}</h2>
                    <p className="section-sub">{t("searches.sub")}</p>

                    <div className="activity-block" style={{ padding: "18px" }}>
                      <div className="ss-row">
                        <div className="ss-info">
                          <strong>{t("searchRows.0.name")}</strong>
                          <div className="crit">{t("searchRows.0.crit")}</div>
                          <div className="matches">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
                            {t("searchRows.0.matches")}
                          </div>
                        </div>
                        <div className="ss-actions">
                          <button className="btn btn-secondary btn-mini">{t("searches.viewResults")}</button>
                          <button className="btn-icon" title={t("searches.editTitle")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.4 2.6a2 2 0 012.8 2.8L12 14.7l-4 1 1-4z" /></svg></button>
                          <button className="btn-icon danger" title={t("searches.removeTitle")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></button>
                        </div>
                      </div>

                      <div className="ss-row">
                        <div className="ss-info">
                          <strong>{t("searchRows.1.name")}</strong>
                          <div className="crit">{t("searchRows.1.crit")}</div>
                          <div className="matches">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
                            {t("searchRows.1.matches")}
                          </div>
                        </div>
                        <div className="ss-actions">
                          <button className="btn btn-secondary btn-mini">{t("searches.viewResults")}</button>
                          <button className="btn-icon" title={t("searches.editTitle")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.4 2.6a2 2 0 012.8 2.8L12 14.7l-4 1 1-4z" /></svg></button>
                          <button className="btn-icon danger" title={t("searches.removeTitle")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></button>
                        </div>
                      </div>

                      <div className="ss-row">
                        <div className="ss-info">
                          <strong>{t("searchRows.2.name")}</strong>
                          <div className="crit">{t("searchRows.2.crit")}</div>
                          <div className="matches">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
                            {t("searchRows.2.matches")}
                          </div>
                        </div>
                        <div className="ss-actions">
                          <button className="btn btn-secondary btn-mini">{t("searches.viewResults")}</button>
                          <button className="btn-icon" title={t("searches.editTitle")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.4 2.6a2 2 0 012.8 2.8L12 14.7l-4 1 1-4z" /></svg></button>
                          <button className="btn-icon danger" title={t("searches.removeTitle")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* MESSAGES (2-pane chat layout) */}
                  <section className={`acc-section${tab === "messages" ? " active" : ""}`} data-section="messages">
                    <h2>{t("messages.title")}</h2>
                    <p className="section-sub">{t("messages.sub")}</p>

                    <div className="msg-layout">

                      {/* ============ LEFT: CONVERSATION LIST ============ */}
                      <div className="msg-list">
                        <div className="msg-list-head">
                          <div className="msg-search-wrap">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                            <input className="msg-search" placeholder={t("messages.searchPlaceholder")} />
                          </div>
                        </div>

                        <div className="msg-filter-chips">
                          <span className="chip active">{t("messages.chips.all")}</span>
                          <span className="chip">{t("messages.chips.unread")}</span>
                          <span className="chip">{t("messages.chips.buying")}</span>
                          <span className="chip">{t("messages.chips.selling")}</span>
                        </div>

                        <div className="msg-conversations" id="convList">

                          <div className="conv-item active unread" data-conv="1">
                            <div className="conv-av">{t("conv.1.av")}<span className="online-dot"></span></div>
                            <div className="conv-info">
                              <div className="conv-name-row">
                                <strong>{t("conv.1.name")}</strong>
                                <span className="conv-time">{t("conv.1.time")}</span>
                              </div>
                              <div className="conv-car-line">{t("conv.1.car")}</div>
                              <div className="conv-preview">
                                <span>{t("conv.1.preview")}</span>
                                <span className="unread-badge">{t("conv.1.badge")}</span>
                              </div>
                            </div>
                          </div>

                          <div className="conv-item unread" data-conv="2">
                            <div className="conv-av dealer-2">{t("conv.2.av")}</div>
                            <div className="conv-info">
                              <div className="conv-name-row">
                                <strong>{t("conv.2.name")}</strong>
                                <span className="conv-time">{t("conv.2.time")}</span>
                              </div>
                              <div className="conv-car-line">{t("conv.2.car")}</div>
                              <div className="conv-preview">
                                <span>{t("conv.2.preview")}</span>
                                <span className="unread-badge">{t("conv.2.badge")}</span>
                              </div>
                            </div>
                          </div>

                          <div className="conv-item" data-conv="3">
                            <div className="conv-av dealer-3">{t("conv.3.av")}<span className="online-dot"></span></div>
                            <div className="conv-info">
                              <div className="conv-name-row">
                                <strong>{t("conv.3.name")}</strong>
                                <span className="conv-time">{t("conv.3.time")}</span>
                              </div>
                              <div className="conv-car-line">{t("conv.3.car")}</div>
                              <div className="conv-preview">
                                <span>{t("conv.3.preview")}</span>
                                <svg className="last-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                              </div>
                            </div>
                          </div>

                          <div className="conv-item" data-conv="4">
                            <div className="conv-av dealer-4">{t("conv.4.av")}</div>
                            <div className="conv-info">
                              <div className="conv-name-row">
                                <strong>{t("conv.4.name")}</strong>
                                <span className="conv-time">{t("conv.4.time")}</span>
                              </div>
                              <div className="conv-car-line">{t("conv.4.car")}</div>
                              <div className="conv-preview">
                                <span>{t("conv.4.preview")}</span>
                                <svg className="last-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                              </div>
                            </div>
                          </div>

                          <div className="conv-item" data-conv="5">
                            <div className="conv-av">{t("conv.5.av")}</div>
                            <div className="conv-info">
                              <div className="conv-name-row">
                                <strong>{t("conv.5.name")}</strong>
                                <span className="conv-time">{t("conv.5.time")}</span>
                              </div>
                              <div className="conv-car-line">{t("conv.5.car")}</div>
                              <div className="conv-preview">
                                <span>{t("conv.5.preview")}</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* ============ RIGHT: THREAD PANE ============ */}
                      <div className="msg-thread">

                        {/* THREAD 1: Al Tayer Motors (default open) */}
                        <div className="thread-pane active" data-thread="1">
                          <div className="thread-head">
                            <div className="ta">{t("t1.av")}<span className="online-dot"></span></div>
                            <div className="ti">
                              <strong>
                                {t("t1.name")}
                                <span className="v-tag" title={t("t1.verifiedTitle")}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
                                </span>
                              </strong>
                              <div className="status"><span className="ostat">{t("t1.online")}</span> · {t("t1.statusText")}</div>
                            </div>
                            <div className="thread-actions">
                              <button className="btn-icon" title={t("threadActions.call")}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                              </button>
                              <button className="btn-icon" title={t("threadActions.whatsapp")} style={{ color: "#25D366" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5 0-.1-.2-.2-.5-.4z" /><path d="M12 21c-1.8 0-3.5-.5-5-1.4l-3.5 1 1-3.4c-1-1.6-1.5-3.4-1.5-5.2 0-5 4-9 9-9s9 4 9 9-4 9-9 9z" /></svg>
                              </button>
                              <button className="btn-icon" title={t("threadActions.more")}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                              </button>
                            </div>
                          </div>

                          <Link href="/cars/demo" className="thread-car">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=300&q=70&auto=format" alt="" />
                            <div className="thread-car-info">
                              <strong>{t("t1.car.title")}</strong>
                              <div className="tc-meta">{t("t1.car.meta")}<span className="tc-price">{t("t1.car.price")}</span></div>
                            </div>
                            <button className="btn btn-outline tc-action">{t("threadActions.viewListing")}</button>
                          </Link>

                          <div className="thread-messages" id="messages-1">
                            <div className="day-divider"><span>{t("t1.day1")}</span></div>

                            <div className="msg-bubble sent">{t("t1.m1")}</div>
                            <div className="msg-meta sent-meta">
                              {t("t1.m1time")}
                              <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg>
                            </div>

                            <div className="msg-bubble received">{t("t1.m2")}</div>
                            <div className="msg-meta recv-meta">{t("t1.m2meta")}</div>

                            <div className="msg-bubble sent">{t("t1.m3")}</div>
                            <div className="msg-meta sent-meta">
                              {t("t1.m3time")}
                              <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg>
                            </div>

                            <div className="msg-bubble received">{t("t1.m4")}</div>
                            <div className="msg-meta recv-meta">{t("t1.m4meta")}</div>

                            <div className="day-divider"><span>{t("t1.day2")}</span></div>

                            <div className="msg-bubble sent">{t("t1.m5")}</div>
                            <div className="msg-meta sent-meta">
                              {t("t1.m5time")}
                              <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg>
                            </div>

                            <div className="msg-bubble received">{t("t1.m6")}</div>
                            <div className="msg-meta recv-meta">{t("t1.m6meta")}</div>

                            <div className="msg-car-share">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600&q=80&auto=format" alt="" />
                              <div className="mcs-body">
                                <strong>{t("t1.share.title")}</strong>
                                <div className="tc-meta">{t("t1.share.meta")}</div>
                                <div className="mcs-price">{t("t1.share.link")}</div>
                              </div>
                            </div>
                            <div className="msg-meta recv-meta">{t("t1.m7meta")}</div>

                            <div className="msg-bubble received">{t("t1.m8")}</div>
                            <div className="msg-meta recv-meta">{t("t1.m8meta")}</div>

                          </div>

                          <div className="quick-replies">
                            <button className="qr-chip">{t("t1.qr.0")}</button>
                            <button className="qr-chip">{t("t1.qr.1")}</button>
                            <button className="qr-chip">{t("t1.qr.2")}</button>
                            <button className="qr-chip">{t("t1.qr.3")}</button>
                          </div>

                          <div className="thread-compose">
                            <div className="compose-actions">
                              <button className="compose-btn" title={t("compose.attach")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.4 11l-9.2 9.2a6 6 0 01-8.5-8.5l9.2-9.2a4 4 0 015.6 5.6L9.4 17.4a2 2 0 01-2.8-2.8L15 6.4" /></svg>
                              </button>
                              <button className="compose-btn" title={t("compose.photo")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg>
                              </button>
                            </div>
                            <textarea className="compose-input" placeholder={t("compose.placeholder")} rows={1} id="composeInput-1"></textarea>
                            <button className="send-btn" title={t("compose.send")} data-send="1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                            </button>
                          </div>
                        </div>

                        {/* THREAD 2: Star Motors (with offer card) */}
                        <div className="thread-pane" data-thread="2">
                          <div className="thread-head">
                            <div className="ta dealer-2">{t("t2.av")}</div>
                            <div className="ti">
                              <strong>{t("t2.name")}</strong>
                              <div className="status">{t("t2.status")}</div>
                            </div>
                            <div className="thread-actions">
                              <button className="btn-icon" title={t("threadActions.call")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg></button>
                              <button className="btn-icon" title={t("threadActions.more")}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></button>
                            </div>
                          </div>

                          <Link href="/cars/demo" className="thread-car">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=70&auto=format" alt="" />
                            <div className="thread-car-info">
                              <strong>{t("t2.car.title")}</strong>
                              <div className="tc-meta">{t("t2.car.meta")}<span className="tc-price">{t("t2.car.price")}</span></div>
                            </div>
                            <button className="btn btn-outline tc-action">{t("threadActions.viewListing")}</button>
                          </Link>

                          <div className="thread-messages">
                            <div className="day-divider"><span>{t("t2.day1")}</span></div>
                            <div className="msg-bubble sent">{t("t2.m1")}</div>
                            <div className="msg-meta sent-meta">{t("t2.m1time")} <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg></div>

                            <div className="msg-bubble received">{t("t2.m2")}</div>
                            <div className="msg-meta recv-meta">{t("t2.m2meta")}</div>

                            <div className="msg-offer">
                              <div className="offer-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
                                {t("t2.offer.label")}
                              </div>
                              <div className="offer-amt">{t("t2.offer.amt")}</div>
                              <div className="offer-orig">{t("t2.offer.orig")}</div>
                              <div className="offer-actions">
                                <button className="btn btn-primary">{t("t2.offer.accept")}</button>
                                <button className="btn btn-outline">{t("t2.offer.counter")}</button>
                              </div>
                            </div>
                            <div className="msg-meta recv-meta">{t("t2.offermeta")}</div>

                            <div className="msg-bubble sent">{t("t2.m3")}</div>
                            <div className="msg-meta sent-meta">{t("t2.m3time")} <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg></div>

                            <div className="msg-bubble received">{t("t2.m4")}</div>
                            <div className="msg-meta recv-meta">{t("t2.m4meta")}</div>

                            <div className="day-divider"><span>{t("t2.day2")}</span></div>
                            <div className="msg-bubble received">{t("t2.m5")}</div>
                            <div className="msg-meta recv-meta">{t("t2.m5meta")}</div>
                          </div>

                          <div className="quick-replies">
                            <button className="qr-chip">{t("t2.qr.0")}</button>
                            <button className="qr-chip">{t("t2.qr.1")}</button>
                            <button className="qr-chip">{t("t2.qr.2")}</button>
                            <button className="qr-chip">{t("t2.qr.3")}</button>
                          </div>

                          <div className="thread-compose">
                            <div className="compose-actions">
                              <button className="compose-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.4 11l-9.2 9.2a6 6 0 01-8.5-8.5l9.2-9.2a4 4 0 015.6 5.6L9.4 17.4a2 2 0 01-2.8-2.8L15 6.4" /></svg></button>
                            </div>
                            <textarea className="compose-input" placeholder={t("compose.placeholder")} rows={1} id="composeInput-2"></textarea>
                            <button className="send-btn" data-send="2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg></button>
                          </div>
                        </div>

                        {/* THREAD 3: Nasser Motors (test drive confirmed) */}
                        <div className="thread-pane" data-thread="3">
                          <div className="thread-head">
                            <div className="ta dealer-3">{t("t3.av")}<span className="online-dot"></span></div>
                            <div className="ti">
                              <strong>{t("t3.name")}</strong>
                              <div className="status"><span className="ostat">{t("t3.online")}</span> · {t("t3.statusText")}</div>
                            </div>
                            <div className="thread-actions">
                              <button className="btn-icon" title={t("threadActions.call")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg></button>
                              <button className="btn-icon" title={t("threadActions.more")}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></button>
                            </div>
                          </div>

                          <Link href="/cars/demo" className="thread-car">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=300&q=70&auto=format" alt="" />
                            <div className="thread-car-info">
                              <strong>{t("t3.car.title")}</strong>
                              <div className="tc-meta">{t("t3.car.meta")}<span className="tc-price">{t("t3.car.price")}</span></div>
                            </div>
                            <button className="btn btn-outline tc-action">{t("threadActions.viewListing")}</button>
                          </Link>

                          <div className="thread-messages">
                            <div className="day-divider"><span>{t("t3.day1")}</span></div>
                            <div className="msg-bubble sent">{t("t3.m1")}</div>
                            <div className="msg-meta sent-meta">{t("t3.m1time")} <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg></div>

                            <div className="msg-bubble received">{t("t3.m2")}</div>
                            <div className="msg-meta recv-meta">{t("t3.m2meta")}</div>

                            <div className="msg-bubble sent">{t("t3.m3")}</div>
                            <div className="msg-meta sent-meta">{t("t3.m3time")} <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg></div>

                            <div className="msg-bubble received">{t("t3.m4")}</div>
                            <div className="msg-meta recv-meta">{t("t3.m4meta")}</div>

                            <div className="msg-bubble sent">{t("t3.m5")}</div>
                            <div className="msg-meta sent-meta">{t("t3.m5time")} <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg></div>

                            <div className="msg-bubble received">{t("t3.m6")}</div>
                            <div className="msg-meta recv-meta">{t("t3.m6meta")}</div>
                          </div>

                          <div className="quick-replies">
                            <button className="qr-chip">{t("t3.qr.0")}</button>
                            <button className="qr-chip">{t("t3.qr.1")}</button>
                            <button className="qr-chip">{t("t3.qr.2")}</button>
                          </div>

                          <div className="thread-compose">
                            <div className="compose-actions">
                              <button className="compose-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.4 11l-9.2 9.2a6 6 0 01-8.5-8.5l9.2-9.2a4 4 0 015.6 5.6L9.4 17.4a2 2 0 01-2.8-2.8L15 6.4" /></svg></button>
                            </div>
                            <textarea className="compose-input" placeholder={t("compose.placeholder")} rows={1} id="composeInput-3"></textarea>
                            <button className="send-btn" data-send="3"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg></button>
                          </div>
                        </div>

                        {/* THREAD 4: Emirates Auto (sold) */}
                        <div className="thread-pane" data-thread="4">
                          <div className="thread-head">
                            <div className="ta dealer-4">{t("t4.av")}</div>
                            <div className="ti">
                              <strong>{t("t4.name")}</strong>
                              <div className="status">{t("t4.status")}</div>
                            </div>
                            <div className="thread-actions">
                              <button className="btn-icon" title={t("threadActions.more")}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></button>
                            </div>
                          </div>

                          <Link href="/cars/demo" className="thread-car">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=300&q=70&auto=format" alt="" />
                            <div className="thread-car-info">
                              <strong>{t("t4.car.title")} <span style={{ background: "var(--text-2)", color: "#fff", padding: "1px 7px", borderRadius: "99px", fontSize: "10px", fontWeight: 700, marginLeft: "4px" }}>{t("t4.car.sold")}</span></strong>
                              <div className="tc-meta">{t("t4.car.meta")}<span style={{ color: "var(--text-3)", textDecoration: "line-through" }}>{t("t4.car.price")}</span></div>
                            </div>
                          </Link>

                          <div className="thread-messages">
                            <div className="day-divider"><span>{t("t4.day1")}</span></div>
                            <div className="msg-bubble sent">{t("t4.m1")}</div>
                            <div className="msg-meta sent-meta">{t("t4.m1time")} <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg></div>

                            <div className="msg-bubble received">{t("t4.m2")}</div>
                            <div className="msg-meta recv-meta">{t("t4.m2meta")}</div>

                            <div className="msg-bubble sent">{t("t4.m3")}</div>
                            <div className="msg-meta sent-meta">{t("t4.m3time")} <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg></div>

                            <div className="msg-bubble received">{t("t4.m4")}</div>
                            <div className="msg-meta recv-meta">{t("t4.m4meta")}</div>
                          </div>

                          <div className="thread-compose">
                            <div className="compose-actions">
                              <button className="compose-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.4 11l-9.2 9.2a6 6 0 01-8.5-8.5l9.2-9.2a4 4 0 015.6 5.6L9.4 17.4a2 2 0 01-2.8-2.8L15 6.4" /></svg></button>
                            </div>
                            <textarea className="compose-input" placeholder={t("compose.placeholder")} rows={1} id="composeInput-4"></textarea>
                            <button className="send-btn" data-send="4"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg></button>
                          </div>
                        </div>

                        {/* THREAD 5: Premier Auto */}
                        <div className="thread-pane" data-thread="5">
                          <div className="thread-head">
                            <div className="ta">{t("t5.av")}</div>
                            <div className="ti">
                              <strong>{t("t5.name")}</strong>
                              <div className="status">{t("t5.status")}</div>
                            </div>
                            <div className="thread-actions">
                              <button className="btn-icon" title={t("threadActions.call")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg></button>
                              <button className="btn-icon" title={t("threadActions.more")}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></button>
                            </div>
                          </div>

                          <Link href="/cars/demo" className="thread-car">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=300&q=70&auto=format" alt="" />
                            <div className="thread-car-info">
                              <strong>{t("t5.car.title")}</strong>
                              <div className="tc-meta">{t("t5.car.meta")}<span className="tc-price">{t("t5.car.price")}</span></div>
                            </div>
                            <button className="btn btn-outline tc-action">{t("threadActions.viewListing")}</button>
                          </Link>

                          <div className="thread-messages">
                            <div className="day-divider"><span>{t("t5.day1")}</span></div>
                            <div className="msg-bubble sent">{t("t5.m1")}</div>
                            <div className="msg-meta sent-meta">{t("t5.m1time")} <svg className="check-double" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2 12l4 4 10-10M8 12l4 4 10-10" /></svg></div>

                            <div className="msg-bubble received">{t("t5.m2")}</div>
                            <div className="msg-meta recv-meta">{t("t5.m2meta")}</div>
                          </div>

                          <div className="thread-compose">
                            <div className="compose-actions">
                              <button className="compose-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.4 11l-9.2 9.2a6 6 0 01-8.5-8.5l9.2-9.2a4 4 0 015.6 5.6L9.4 17.4a2 2 0 01-2.8-2.8L15 6.4" /></svg></button>
                            </div>
                            <textarea className="compose-input" placeholder={t("compose.placeholder")} rows={1} id="composeInput-5"></textarea>
                            <button className="send-btn" data-send="5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg></button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </section>

                  {/* MY LISTINGS */}
                  <section className={`acc-section${tab === "listings" ? " active" : ""}`} data-section="listings">
                    <h2>{t("listings.title")}</h2>
                    <p className="section-sub">{t("listings.sub")}</p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <span className="chip active">{t("listings.chips.all")}</span>
                        <span className="chip">{t("listings.chips.active")}</span>
                        <span className="chip">{t("listings.chips.pending")}</span>
                        <span className="chip">{t("listings.chips.sold")}</span>
                      </div>
                      <Link href="/sell" className="btn btn-primary"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg> {t("listings.newCar")}</Link>
                    </div>

                    <div className="activity-block" style={{ padding: "18px" }}>
                      {listings.length === 0 ? (
                        <p style={{ textAlign: "center", color: "var(--text-3)", padding: "24px 0" }}>{t("listings.empty", { defaultValue: "You have no listings yet." })}</p>
                      ) : (
                        <div className="cards" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                          {listings.map((car) => <MarketplaceCard key={car.id} car={car} />)}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* PRICE ALERTS */}
                  <section className={`acc-section${tab === "alerts" ? " active" : ""}`} data-section="alerts">
                    <h2>{t("alerts.title")}</h2>
                    <p className="section-sub">{t("alerts.sub")}</p>
                    <div className="activity-block" style={{ padding: "18px" }}>
                      <div className="ss-row">
                        <div className="ss-info">
                          <strong>{t("alertRows.0.name")}</strong>
                          <div className="crit">{t("alertRows.0.crit")}</div>
                        </div>
                        <div className="ss-actions">
                          <button className="btn-icon danger" title={t("alerts.removeTitle")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg></button>
                        </div>
                      </div>
                      <div className="ss-row">
                        <div className="ss-info">
                          <strong>{t("alertRows.1.name")}</strong>
                          <div className="crit">{t("alertRows.1.crit")}</div>
                        </div>
                        <div className="ss-actions">
                          <button className="btn-icon danger" title={t("alerts.removeTitle")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg></button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* PROFILE SETTINGS */}
                  <section className={`acc-section${tab === "profile" ? " active" : ""}`} data-section="profile">
                    <h2>{t("profile.title")}</h2>
                    <p className="section-sub">{t("profile.sub")}</p>

                    <div className="activity-block" style={{ padding: "22px 24px" }}>
                      <form>
                        <div className="profile-grid">
                          <div className="form-group"><label>{t("profile.fullName")}</label><input className="form-input" defaultValue={t("profile.fullNameVal")} /></div>
                          <div className="form-group"><label>{t("profile.mobile")}</label><input className="form-input" defaultValue={t("profile.mobileVal")} /></div>
                          <div className="form-group full"><label>{t("profile.email")}</label><input className="form-input" type="email" defaultValue={t("profile.emailVal")} /></div>
                          <div className="form-group"><label>{t("profile.city")}</label><select className="form-input" defaultValue={t("profile.cityOptions.0")}><option>{t("profile.cityOptions.0")}</option><option>{t("profile.cityOptions.1")}</option><option>{t("profile.cityOptions.2")}</option></select></div>
                          <div className="form-group"><label>{t("profile.language")}</label><select className="form-input" defaultValue={t("profile.langOptions.0")}><option>{t("profile.langOptions.0")}</option><option>{t("profile.langOptions.1")}</option></select></div>
                          <div className="form-group full"><label>{t("profile.bio")}</label><input className="form-input" placeholder={t("profile.bioPlaceholder")} /></div>
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: "18px" }}>{t("profile.save")}</button>
                        <button type="button" className="btn btn-outline" style={{ marginTop: "18px", marginLeft: "6px" }}>{t("profile.cancel")}</button>
                      </form>
                    </div>
                  </section>

                  {/* NOTIFICATIONS */}
                  <section className={`acc-section${tab === "notifications" ? " active" : ""}`} data-section="notifications">
                    <h2>{t("notif.title")}</h2>
                    <p className="section-sub">{t("notif.sub")}</p>

                    <div className="activity-block" style={{ padding: "6px 24px 18px" }}>
                      <div className="pref-row">
                        <div className="pref-info"><strong>{t("notif.rows.0.title")}</strong><p>{t("notif.rows.0.desc")}</p></div>
                        <div className="toggle on" data-toggle></div>
                      </div>
                      <div className="pref-row">
                        <div className="pref-info"><strong>{t("notif.rows.1.title")}</strong><p>{t("notif.rows.1.desc")}</p></div>
                        <div className="toggle on" data-toggle></div>
                      </div>
                      <div className="pref-row">
                        <div className="pref-info"><strong>{t("notif.rows.2.title")}</strong><p>{t("notif.rows.2.desc")}</p></div>
                        <div className="toggle on" data-toggle></div>
                      </div>
                      <div className="pref-row">
                        <div className="pref-info"><strong>{t("notif.rows.3.title")}</strong><p>{t("notif.rows.3.desc")}</p></div>
                        <div className="toggle on" data-toggle></div>
                      </div>
                      <div className="pref-row">
                        <div className="pref-info"><strong>{t("notif.rows.4.title")}</strong><p>{t("notif.rows.4.desc")}</p></div>
                        <div className="toggle" data-toggle></div>
                      </div>
                      <div className="pref-row">
                        <div className="pref-info"><strong>{t("notif.rows.5.title")}</strong><p>{t("notif.rows.5.desc")}</p></div>
                        <div className="toggle" data-toggle></div>
                      </div>
                    </div>
                  </section>

                  {/* SECURITY */}
                  <section className={`acc-section${tab === "security" ? " active" : ""}`} data-section="security">
                    <h2>{t("security.title")}</h2>
                    <p className="section-sub">{t("security.sub")}</p>

                    <div className="activity-block" style={{ padding: "22px 24px" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: "15px" }}>{t("security.changePw")}</h3>
                      <form>
                        <div className="form-group"><label>{t("security.current")}</label><input className="form-input" type="password" placeholder={t("security.currentPh")} /></div>
                        <div className="form-group"><label>{t("security.new")}</label><input className="form-input" type="password" placeholder={t("security.newPh")} /></div>
                        <div className="form-group"><label>{t("security.confirm")}</label><input className="form-input" type="password" /></div>
                        <button className="btn btn-primary" style={{ marginTop: "8px" }}>{t("security.updatePw")}</button>
                      </form>
                    </div>

                    <div className="activity-block" style={{ padding: "22px 24px" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: "15px" }}>{t("security.twofa")}</h3>
                      <div className="pref-row" style={{ paddingTop: 0, borderBottom: 0 }}>
                        <div className="pref-info"><strong>{t("security.authApp")}</strong><p>{t("security.authAppDesc")}</p></div>
                        <button className="btn btn-outline">{t("security.enable")}</button>
                      </div>
                      <div className="pref-row" style={{ borderBottom: 0 }}>
                        <div className="pref-info"><strong>{t("security.sms")}</strong><p>{t("security.smsDesc")}</p></div>
                        <div className="toggle on" data-toggle></div>
                      </div>
                    </div>

                    <div className="activity-block" style={{ padding: "22px 24px" }}>
                      <h3 style={{ margin: "0 0 14px", fontSize: "15px" }}>{t("security.sessions")}</h3>
                      <div className="pref-row">
                        <div className="pref-info"><strong>{t("security.thisDevice")}</strong><p>{t("security.thisDeviceDesc")}</p></div>
                        <span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 700 }}>{t("security.current2")}</span>
                      </div>
                      <div className="pref-row" style={{ borderBottom: 0 }}>
                        <div className="pref-info"><strong>{t("security.iphone")}</strong><p>{t("security.iphoneDesc")}</p></div>
                        <button className="btn-icon danger" title={t("security.signoutDevice")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg></button>
                      </div>
                    </div>
                  </section>

                </div>
              </div>
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<AccountProps> = async (ctx) => {
  const { locale } = ctx;
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return { redirect: { destination: `${prefix}/login?next=/account`, permanent: false } };
  }

  const token = session.accessToken;
  const mine = token
    ? await myListings(token, { limit: 12 }).catch(() => ({ items: [] as Card[], total: 0 }))
    : { items: [] as Card[], total: 0 };
  const name = session.user?.name ?? session.user?.email ?? "You";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return {
    props: {
      user: {
        name,
        email: session.user?.email ?? "",
        initials,
        role: (session.user as { role?: string } | undefined)?.role ?? "USER",
      },
      listings: mine.items,
      ...(await serverSideTranslations(
        locale ?? nextI18NextConfig.i18n.defaultLocale,
        ["common", "mk-account"],
        nextI18NextConfig,
      )),
    },
  };
};
