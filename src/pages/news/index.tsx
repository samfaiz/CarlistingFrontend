import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function MknewsPage() {
  const { t } = useTranslation("mk-news");
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-news" className="page">

          {/* Hero */}
          <div className="news-hero">
            <div className="container">
              <h1>{t("hero.title")}</h1>
              <p>{t("hero.subtitle")}</p>
            </div>
          </div>

          {/* Category tabs (sticky) */}
          <div className="news-tabs-bar">
            <div className="container">
              <nav className="news-tabs">
                <a className="ntab active">{t("tabs.all")} <span className="cnt">412</span></a>
                <a className="ntab">{t("tabs.reviews")} <span className="cnt">124</span></a>
                <a className="ntab">{t("tabs.buyingGuides")} <span className="cnt">86</span></a>
                <a className="ntab">{t("tabs.market")} <span className="cnt">48</span></a>
                <a className="ntab">{t("tabs.comparisons")} <span className="cnt">52</span></a>
                <a className="ntab">{t("tabs.news")} <span className="cnt">96</span></a>
                <a className="ntab">{t("tabs.bikes")} <span className="cnt">38</span></a>
                <a className="ntab">{t("tabs.longTerm")} <span className="cnt">24</span></a>
                <a className="ntab">{t("tabs.finance")}</a>
              </nav>
            </div>
          </div>

          <div className="news-wrap">
            <div className="container">

              {/* FEATURED ARTICLE */}
              <a href="#" className="news-featured">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1800&q=85&auto=format" alt="" />
                <div className="nf-body">
                  <span className="nf-tag">{t("featured.tag")}</span>
                  <h2>{t("featured.title")}</h2>
                  <p className="nf-excerpt">{t("featured.excerpt")}</p>
                  <div className="nf-meta">
                    <span className="author-av">KA</span>
                    <strong>{t("featured.author")}</strong>
                    <span className="dot">•</span>
                    <span>{t("featured.role")}</span>
                    <span className="dot">•</span>
                    <span>{t("featured.date")}</span>
                    <span className="dot">•</span>
                    <span>{t("featured.read")}</span>
                  </div>
                </div>
              </a>

              {/* Layout: main + sidebar */}
              <div className="news-layout">

                {/* ============ MAIN ============ */}
                <div className="news-main">

                  {/* Top picks (2 large cards) */}
                  <h2 className="news-section-title">
                    {t("topPicks.title")}
                    <a href="#" className="vl">{t("topPicks.viewLink")} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></a>
                  </h2>
                  <div className="top-picks">

                    <a href="#" className="top-pick">
                      <div className="tp-media">{ }<img src="https://images.unsplash.com/photo-1493238792000-8113da705763?w=900&q=80&auto=format" alt="" /></div>
                      <div className="tp-body">
                        <span className="tp-tag warning">{t("topPicks.0.tag")}</span>
                        <h3>{t("topPicks.0.title")}</h3>
                        <p className="tp-excerpt">{t("topPicks.0.excerpt")}</p>
                        <div className="tp-meta">
                          <span className="av-mini">SA</span>
                          <strong>{t("topPicks.0.author")}</strong>
                          <span>•</span>
                          <span>{t("topPicks.0.date")}</span>
                          <span>•</span>
                          <span>{t("topPicks.0.read")}</span>
                        </div>
                      </div>
                    </a>

                    <a href="#" className="top-pick">
                      <div className="tp-media">{ }<img src="https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=900&q=80&auto=format" alt="" /></div>
                      <div className="tp-body">
                        <span className="tp-tag success">{t("topPicks.1.tag")}</span>
                        <h3>{t("topPicks.1.title")}</h3>
                        <p className="tp-excerpt">{t("topPicks.1.excerpt")}</p>
                        <div className="tp-meta">
                          <span className="av-mini">KA</span>
                          <strong>{t("topPicks.1.author")}</strong>
                          <span>•</span>
                          <span>{t("topPicks.1.date")}</span>
                          <span>•</span>
                          <span>{t("topPicks.1.read")}</span>
                        </div>
                      </div>
                    </a>

                  </div>

                  {/* Latest articles */}
                  <h2 className="news-section-title">
                    {t("latest.title")}
                    <a href="#" className="vl">{t("latest.viewLink")} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg></a>
                  </h2>

                  <div className="article-grid-2">

                    <a href="#" className="article-card">
                      <div className="ac-media">{ }<img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=720&q=80&auto=format" alt="" /></div>
                      <div className="ac-body">
                        <span className="ac-tag">{t("articles.0.tag")}</span>
                        <h3>{t("articles.0.title")}</h3>
                        <p className="ac-excerpt">{t("articles.0.excerpt")}</p>
                        <div className="ac-meta">
                          <div className="ac-author"><span className="av">KA</span><strong>{t("articles.0.author")}</strong></div>
                          <span className="ac-dot">•</span><span>{t("articles.0.date")}</span><span className="ac-dot">•</span><span>{t("articles.0.read")}</span>
                        </div>
                      </div>
                    </a>

                    <a href="#" className="article-card">
                      <div className="ac-media">{ }<img src="https://images.unsplash.com/photo-1568708476-cdaeae3196b8?w=720&q=80&auto=format" alt="" /></div>
                      <div className="ac-body">
                        <span className="ac-tag success">{t("articles.1.tag")}</span>
                        <h3>{t("articles.1.title")}</h3>
                        <p className="ac-excerpt">{t("articles.1.excerpt")}</p>
                        <div className="ac-meta">
                          <div className="ac-author"><span className="av">OH</span><strong>{t("articles.1.author")}</strong></div>
                          <span className="ac-dot">•</span><span>{t("articles.1.date")}</span><span className="ac-dot">•</span><span>{t("articles.1.read")}</span>
                        </div>
                      </div>
                    </a>

                    <a href="#" className="article-card">
                      <div className="ac-media">{ }<img src="https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=720&q=80&auto=format" alt="" /></div>
                      <div className="ac-body">
                        <span className="ac-tag">{t("articles.2.tag")}</span>
                        <h3>{t("articles.2.title")}</h3>
                        <p className="ac-excerpt">{t("articles.2.excerpt")}</p>
                        <div className="ac-meta">
                          <div className="ac-author"><span className="av">SA</span><strong>{t("articles.2.author")}</strong></div>
                          <span className="ac-dot">•</span><span>{t("articles.2.date")}</span><span className="ac-dot">•</span><span>{t("articles.2.read")}</span>
                        </div>
                      </div>
                    </a>

                    <a href="#" className="article-card">
                      <div className="ac-media">{ }<img src="https://images.unsplash.com/photo-1542362567-b07e54358753?w=720&q=80&auto=format" alt="" /></div>
                      <div className="ac-body">
                        <span className="ac-tag warning">{t("articles.3.tag")}</span>
                        <h3>{t("articles.3.title")}</h3>
                        <p className="ac-excerpt">{t("articles.3.excerpt")}</p>
                        <div className="ac-meta">
                          <div className="ac-author"><span className="av">KA</span><strong>{t("articles.3.author")}</strong></div>
                          <span className="ac-dot">•</span><span>{t("articles.3.date")}</span><span className="ac-dot">•</span><span>{t("articles.3.read")}</span>
                        </div>
                      </div>
                    </a>

                    <a href="#" className="article-card">
                      <div className="ac-media">{ }<img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=720&q=80&auto=format" alt="" /></div>
                      <div className="ac-body">
                        <span className="ac-tag">{t("articles.4.tag")}</span>
                        <h3>{t("articles.4.title")}</h3>
                        <p className="ac-excerpt">{t("articles.4.excerpt")}</p>
                        <div className="ac-meta">
                          <div className="ac-author"><span className="av">SA</span><strong>{t("articles.4.author")}</strong></div>
                          <span className="ac-dot">•</span><span>{t("articles.4.date")}</span><span className="ac-dot">•</span><span>{t("articles.4.read")}</span>
                        </div>
                      </div>
                    </a>

                    <a href="#" className="article-card">
                      <div className="ac-media">{ }<img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=720&q=80&auto=format" alt="" /></div>
                      <div className="ac-body">
                        <span className="ac-tag error">{t("articles.5.tag")}</span>
                        <h3>{t("articles.5.title")}</h3>
                        <p className="ac-excerpt">{t("articles.5.excerpt")}</p>
                        <div className="ac-meta">
                          <div className="ac-author"><span className="av">KA</span><strong>{t("articles.5.author")}</strong></div>
                          <span className="ac-dot">•</span><span>{t("articles.5.date")}</span><span className="ac-dot">•</span><span>{t("articles.5.read")}</span>
                        </div>
                      </div>
                    </a>

                    <a href="#" className="article-card">
                      <div className="ac-media">{ }<img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=720&q=80&auto=format" alt="" /></div>
                      <div className="ac-body">
                        <span className="ac-tag warning">{t("articles.6.tag")}</span>
                        <h3>{t("articles.6.title")}</h3>
                        <p className="ac-excerpt">{t("articles.6.excerpt")}</p>
                        <div className="ac-meta">
                          <div className="ac-author"><span className="av">SA</span><strong>{t("articles.6.author")}</strong></div>
                          <span className="ac-dot">•</span><span>{t("articles.6.date")}</span><span className="ac-dot">•</span><span>{t("articles.6.read")}</span>
                        </div>
                      </div>
                    </a>

                    <a href="#" className="article-card">
                      <div className="ac-media">{ }<img src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=720&q=80&auto=format" alt="" /></div>
                      <div className="ac-body">
                        <span className="ac-tag success">{t("articles.7.tag")}</span>
                        <h3>{t("articles.7.title")}</h3>
                        <p className="ac-excerpt">{t("articles.7.excerpt")}</p>
                        <div className="ac-meta">
                          <div className="ac-author"><span className="av">OH</span><strong>{t("articles.7.author")}</strong></div>
                          <span className="ac-dot">•</span><span>{t("articles.7.date")}</span><span className="ac-dot">•</span><span>{t("articles.7.read")}</span>
                        </div>
                      </div>
                    </a>

                  </div>

                  {/* Pagination */}
                  <div className="pagination" style={{ marginTop: "8px" }}>
                    <a className="disabled">{t("pagination.prev")}</a>
                    <a className="active">1</a>
                    <a>2</a><a>3</a><a>4</a><a>5</a>
                    <span className="dots">…</span>
                    <a>52</a>
                    <a>{t("pagination.next")}</a>
                  </div>

                </div>

                {/* ============ SIDEBAR ============ */}
                <aside className="news-sidebar">

                  {/* Most popular */}
                  <div className="sidebar-card">
                    <h3>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                      {t("popular.title")}
                    </h3>
                    <ol className="popular-list">
                      <li>
                        <div className="pl-num">1</div>
                        <div className="pl-info">
                          <strong>{t("popular.0.title")}</strong>
                          <div className="pl-meta">{t("popular.0.meta")}</div>
                        </div>
                      </li>
                      <li>
                        <div className="pl-num">2</div>
                        <div className="pl-info">
                          <strong>{t("popular.1.title")}</strong>
                          <div className="pl-meta">{t("popular.1.meta")}</div>
                        </div>
                      </li>
                      <li>
                        <div className="pl-num">3</div>
                        <div className="pl-info">
                          <strong>{t("popular.2.title")}</strong>
                          <div className="pl-meta">{t("popular.2.meta")}</div>
                        </div>
                      </li>
                      <li>
                        <div className="pl-num">4</div>
                        <div className="pl-info">
                          <strong>{t("popular.3.title")}</strong>
                          <div className="pl-meta">{t("popular.3.meta")}</div>
                        </div>
                      </li>
                      <li>
                        <div className="pl-num">5</div>
                        <div className="pl-info">
                          <strong>{t("popular.4.title")}</strong>
                          <div className="pl-meta">{t("popular.4.meta")}</div>
                        </div>
                      </li>
                    </ol>
                  </div>

                  {/* Newsletter */}
                  <div className="newsletter-card">
                    <h3>{t("newsletter.title")}</h3>
                    <p>{t("newsletter.body")}</p>
                    <form className="newsletter-form">
                      <input type="email" placeholder={t("newsletter.placeholder")} />
                      <button type="submit">{t("newsletter.button")}</button>
                    </form>
                    <div className="nl-perks">
                      <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg> {t("newsletter.perk1")}</span>
                      <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg> {t("newsletter.perk2")}</span>
                    </div>
                  </div>

                  {/* Browse by topic */}
                  <div className="sidebar-card">
                    <h3>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                      {t("topics.title")}
                    </h3>
                    <div className="topic-tags">
                      <a href="#" className="topic-tag">{t("topics.tags.0")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.1")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.2")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.3")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.4")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.5")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.6")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.7")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.8")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.9")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.10")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.11")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.12")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.13")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.14")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.15")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.16")}</a>
                      <a href="#" className="topic-tag">{t("topics.tags.17")}</a>
                    </div>
                  </div>

                  {/* Featured writers */}
                  <div className="sidebar-card">
                    <h3>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      {t("writers.title")}
                    </h3>
                    <a href="#" className="writer-row">
                      <div className="writer-av">KA</div>
                      <div className="writer-info">
                        <strong>{t("writers.0.name")}</strong>
                        <div className="wr-role">{t("writers.0.role")}</div>
                        <div className="wr-stats">
                          <span>{t("writers.0.articles")}</span><span className="dot">•</span><span>{t("writers.0.reads")}</span>
                        </div>
                      </div>
                    </a>
                    <a href="#" className="writer-row">
                      <div className="writer-av alt-1">SA</div>
                      <div className="writer-info">
                        <strong>{t("writers.1.name")}</strong>
                        <div className="wr-role">{t("writers.1.role")}</div>
                        <div className="wr-stats">
                          <span>{t("writers.1.articles")}</span><span className="dot">•</span><span>{t("writers.1.reads")}</span>
                        </div>
                      </div>
                    </a>
                    <a href="#" className="writer-row">
                      <div className="writer-av alt-2">OH</div>
                      <div className="writer-info">
                        <strong>{t("writers.2.name")}</strong>
                        <div className="wr-role">{t("writers.2.role")}</div>
                        <div className="wr-stats">
                          <span>{t("writers.2.articles")}</span><span className="dot">•</span><span>{t("writers.2.reads")}</span>
                        </div>
                      </div>
                    </a>
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
      ["common", "mk-news"],
      nextI18NextConfig,
    )),
  },
});
