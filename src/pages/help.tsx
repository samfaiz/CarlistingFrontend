import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MkhelpPage() {
  const { t } = useTranslation("mk-help");
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-help" className="page">

          {/* Hero */}
          <div className="help-hero">
            <div className="container">
              <h1>{t("hero.title")}</h1>
              <p>{t("hero.subtitle")}</p>

              <div className="help-search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                <input type="text" placeholder={t("hero.searchPlaceholder")} />
                <button>{t("hero.searchButton")}</button>
              </div>

              <div className="help-suggestions">
                <span>{t("hero.popular")}</span>
                <a href="#">{t("hero.suggestions.0")}</a><span>·</span>
                <a href="#">{t("hero.suggestions.1")}</a><span>·</span>
                <a href="#">{t("hero.suggestions.2")}</a><span>·</span>
                <a href="#">{t("hero.suggestions.3")}</a>
              </div>
            </div>
          </div>

          <div className="help-wrap">
            <div className="container">

              {/* Category cards */}
              <h2 className="news-section-title" style={{ marginBottom: "14px" }}>{t("cats.heading")}</h2>
              <div className="help-cats">

                <a href="#" className="help-cat">
                  <div className="help-cat-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                  </div>
                  <h3>{t("cats.0.title")}</h3>
                  <p>{t("cats.0.desc")}</p>
                  <span className="cat-count">{t("cats.0.count")}</span>
                </a>

                <a href="#" className="help-cat">
                  <div className="help-cat-icon alt-1">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2"/></svg>
                  </div>
                  <h3>{t("cats.1.title")}</h3>
                  <p>{t("cats.1.desc")}</p>
                  <span className="cat-count">{t("cats.1.count")}</span>
                </a>

                <a href="#" className="help-cat">
                  <div className="help-cat-icon alt-2">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <h3>{t("cats.2.title")}</h3>
                  <p>{t("cats.2.desc")}</p>
                  <span className="cat-count">{t("cats.2.count")}</span>
                </a>

                <a href="#" className="help-cat">
                  <div className="help-cat-icon alt-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z"/><path d="M9 12l2 2 4-4"/></svg>
                  </div>
                  <h3>{t("cats.3.title")}</h3>
                  <p>{t("cats.3.desc")}</p>
                  <span className="cat-count">{t("cats.3.count")}</span>
                </a>

                <a href="#" className="help-cat">
                  <div className="help-cat-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                  </div>
                  <h3>{t("cats.4.title")}</h3>
                  <p>{t("cats.4.desc")}</p>
                  <span className="cat-count">{t("cats.4.count")}</span>
                </a>

                <a href="#" className="help-cat">
                  <div className="help-cat-icon alt-1">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
                  </div>
                  <h3>{t("cats.5.title")}</h3>
                  <p>{t("cats.5.desc")}</p>
                  <span className="cat-count">{t("cats.5.count")}</span>
                </a>

                <a href="#" className="help-cat">
                  <div className="help-cat-icon alt-2">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>
                  </div>
                  <h3>{t("cats.6.title")}</h3>
                  <p>{t("cats.6.desc")}</p>
                  <span className="cat-count">{t("cats.6.count")}</span>
                </a>

                <a href="#" className="help-cat">
                  <div className="help-cat-icon alt-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>
                  </div>
                  <h3>{t("cats.7.title")}</h3>
                  <p>{t("cats.7.desc")}</p>
                  <span className="cat-count">{t("cats.7.count")}</span>
                </a>

              </div>

              {/* Popular FAQs */}
              <div className="help-section">
                <div className="help-section-head">
                  <h2>{t("faq.heading")}</h2>
                  <a href="#">{t("faq.viewAll")}</a>
                </div>
                <div className="faq-list" id="faqList">

                  <div className="faq-item">
                    <button className="faq-q">
                      {t("faq.items.0.q")}
                      <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div className="faq-a">
                      <p>{t("faq.items.0.a.0")}</p>
                      <p>{t("faq.items.0.a.1")}</p>
                    </div>
                  </div>

                  <div className="faq-item">
                    <button className="faq-q">
                      {t("faq.items.1.q")}
                      <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div className="faq-a">
                      <p><strong>{t("faq.items.1.a.0.label")}</strong>{t("faq.items.1.a.0.text")}</p>
                      <p><strong>{t("faq.items.1.a.1.label")}</strong>{t("faq.items.1.a.1.text")}</p>
                      <p><strong>{t("faq.items.1.a.2.label")}</strong>{t("faq.items.1.a.2.text")}</p>
                    </div>
                  </div>

                  <div className="faq-item">
                    <button className="faq-q">
                      {t("faq.items.2.q")}
                      <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div className="faq-a">
                      <p>{t("faq.items.2.a.0")}</p>
                      <p><strong>{t("faq.items.2.a.1.label")}</strong>{t("faq.items.2.a.1.text")}</p>
                    </div>
                  </div>

                  <div className="faq-item">
                    <button className="faq-q">
                      {t("faq.items.3.q")}
                      <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div className="faq-a">
                      <p>{t("faq.items.3.a.0")}</p>
                    </div>
                  </div>

                  <div className="faq-item">
                    <button className="faq-q">
                      {t("faq.items.4.q")}
                      <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div className="faq-a">
                      <p>{t("faq.items.4.a.0")}</p>
                      <p>{t("faq.items.4.a.1")}</p>
                    </div>
                  </div>

                  <div className="faq-item">
                    <button className="faq-q">
                      {t("faq.items.5.q")}
                      <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div className="faq-a">
                      <p>{t("faq.items.5.a.0")}</p>
                      <p>{t("faq.items.5.a.1")}</p>
                    </div>
                  </div>

                  <div className="faq-item">
                    <button className="faq-q">
                      {t("faq.items.6.q")}
                      <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div className="faq-a">
                      <p>{t("faq.items.6.a.0.pre")}<Link href="/account">{t("faq.items.6.a.0.link")}</Link>{t("faq.items.6.a.0.post")}</p>
                    </div>
                  </div>

                  <div className="faq-item">
                    <button className="faq-q">
                      {t("faq.items.7.q")}
                      <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div className="faq-a">
                      <p>{t("faq.items.7.a.0")}</p>
                      <p>{t("faq.items.7.a.1.pre")}<a href="#">{t("faq.items.7.a.1.link")}</a>{t("faq.items.7.a.1.post")}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Help bottom contact bar */}
              <div className="help-contact-bar">
                <div>
                  <h3>{t("contactBar.title")}</h3>
                  <p>{t("contactBar.subtitle")}</p>
                  <div className="actions">
                    <a className="btn btn-xl" href="#/contact" style={{ background: "#fff", color: "var(--brand)" }}>{t("contactBar.contactBtn")}</a>
                    <a className="btn btn-xl btn-outline" href="#" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.4)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5 0-.1-.2-.2-.5-.4zM12 21c-1.8 0-3.5-.5-5-1.4l-3.5 1 1-3.4c-1-1.6-1.5-3.4-1.5-5.2 0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/></svg>
                      {t("contactBar.whatsapp")}
                    </a>
                  </div>
                </div>
                <div className="hcb-stats">
                  <div className="hcb-stat"><strong>{t("contactBar.stats.0.value")}</strong><span>{t("contactBar.stats.0.label")}</span></div>
                  <div className="hcb-stat"><strong>{t("contactBar.stats.1.value")}</strong><span>{t("contactBar.stats.1.label")}</span></div>
                  <div className="hcb-stat"><strong>{t("contactBar.stats.2.value")}</strong><span>{t("contactBar.stats.2.label")}</span></div>
                  <div className="hcb-stat"><strong>{t("contactBar.stats.3.value")}</strong><span>{t("contactBar.stats.3.label")}</span></div>
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
      ["common", "mk-help"],
      nextI18NextConfig,
    )),
  },
});
