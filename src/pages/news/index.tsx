import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import {
  getNews,
  getNewsCategories,
  type ArticleCard,
  type CategoryCount,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

/**
 * Live news index (P4-05). Keeps the mockup's hero + tab bar + two-column
 * layout, but the featured card, latest grid and category counts come from the
 * CMS. The newsletter + topics sidebar widgets remain editorial chrome.
 */
export default function NewsIndexPage({
  featured,
  latest,
  categories,
  activeCategory,
}: {
  featured: ArticleCard | null;
  latest: ArticleCard[];
  categories: CategoryCount[];
  activeCategory: string | null;
}) {
  const { t } = useTranslation("mk-news");
  const { locale } = useRouter();
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const humanize = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const fmtDate = (d: string | null) =>
    d ? new Intl.DateTimeFormat(locale ?? "en", { dateStyle: "medium" }).format(new Date(d)) : "";

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-news" className="page">
          <div className="news-hero">
            <div className="container">
              <h1>{t("hero.title")}</h1>
              <p>{t("hero.subtitle")}</p>
            </div>
          </div>

          <div className="news-tabs-bar">
            <div className="container">
              <nav className="news-tabs">
                <Link href="/news" className={`ntab${!activeCategory ? " active" : ""}`}>
                  {t("tabs.all")} <span className="cnt">{total}</span>
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.category}
                    href={`/news?category=${encodeURIComponent(c.category)}`}
                    className={`ntab${activeCategory === c.category ? " active" : ""}`}
                  >
                    {humanize(c.category)} <span className="cnt">{c.count}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="news-wrap">
            <div className="container">
              {featured && (
                <Link href={`/news/${featured.slug}`} className="news-featured">
                  {featured.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.coverImageUrl} alt="" />
                  ) : (
                    <div className="nf-media-fallback" />
                  )}
                  <div className="nf-body">
                    {featured.category && <span className="nf-tag">{humanize(featured.category)}</span>}
                    <h2>{featured.title}</h2>
                    {featured.excerpt && <p className="nf-excerpt">{featured.excerpt}</p>}
                    <div className="nf-meta">
                      <strong>{featured.author ?? "Carsens"}</strong>
                      {featured.publishedAt && (<><span className="dot">•</span><span>{fmtDate(featured.publishedAt)}</span></>)}
                      {featured.readMinutes && (<><span className="dot">•</span><span>{t("readMin", { count: featured.readMinutes, defaultValue: `${featured.readMinutes} min read` })}</span></>)}
                    </div>
                  </div>
                </Link>
              )}

              <div className="news-layout">
                <div className="news-main">
                  <h2 className="news-section-title">{t("latest.title")}</h2>

                  {latest.length === 0 && !featured ? (
                    <p style={{ padding: "24px 0", color: "var(--text-2)" }}>{t("empty", { defaultValue: "No articles yet — check back soon." })}</p>
                  ) : (
                    <div className="article-grid-2">
                      {latest.map((a) => (
                        <Link href={`/news/${a.slug}`} key={a.id} className="article-card">
                          <div className="ac-media">
                            {a.coverImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={a.coverImageUrl} alt="" />
                            ) : (
                              <div className="ac-media-fallback" />
                            )}
                          </div>
                          <div className="ac-body">
                            {a.category && <span className="ac-tag">{humanize(a.category)}</span>}
                            <h3>{a.title}</h3>
                            {a.excerpt && <p className="ac-excerpt">{a.excerpt}</p>}
                            <div className="ac-meta">
                              <div className="ac-author"><strong>{a.author ?? "Carsens"}</strong></div>
                              {a.publishedAt && (<><span className="ac-dot">•</span><span>{fmtDate(a.publishedAt)}</span></>)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <aside className="news-sidebar">
                  <div className="newsletter-card">
                    <h3>{t("newsletter.title")}</h3>
                    <p>{t("newsletter.body")}</p>
                    <form className="newsletter-form">
                      <input type="email" placeholder={t("newsletter.placeholder")} />
                      <button type="submit">{t("newsletter.button")}</button>
                    </form>
                    <div className="nl-perks">
                      <span>{t("newsletter.perk1")}</span>
                      <span>{t("newsletter.perk2")}</span>
                    </div>
                  </div>

                  <div className="sidebar-card">
                    <h3>{t("topics.title")}</h3>
                    <div className="topic-tags">
                      {categories.map((c) => (
                        <Link key={c.category} href={`/news?category=${encodeURIComponent(c.category)}`} className="topic-tag">
                          {humanize(c.category)}
                        </Link>
                      ))}
                    </div>
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  const activeCategory = typeof ctx.query.category === "string" ? ctx.query.category : null;
  let featured: ArticleCard | null = null;
  let latest: ArticleCard[] = [];
  let categories: CategoryCount[] = [];
  try {
    const [page, cats] = await Promise.all([
      getNews(locale, { category: activeCategory ?? undefined, limit: 25 }),
      getNewsCategories(),
    ]);
    categories = cats;
    const items = page.items;
    if (!activeCategory && items.length > 0) {
      featured = items.find((a) => a.featured) ?? items[0];
      latest = items.filter((a) => a.id !== featured?.id);
    } else {
      latest = items;
    }
  } catch {
    // Leave everything empty; the page renders its empty state.
  }
  return {
    props: {
      featured,
      latest,
      categories,
      activeCategory,
      ...(await serverSideTranslations(locale, ["common", "mk-news"], nextI18NextConfig)),
    },
  };
};
