import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import {
  getNewsArticle,
  getNews,
  type ArticleDetail,
  type ArticleCard,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

/**
 * Live news article (P4-05). The pixel-exact mockup chrome (reading aside,
 * hero, breadcrumb, related strip) is preserved; the title, meta and body come
 * from the CMS in the active locale, with the body printed from the safe HTML
 * snapshot rendered server-side.
 */
export default function ArticlePage({
  article,
  related,
}: {
  article: ArticleDetail | null;
  related: ArticleCard[];
}) {
  const { t } = useTranslation("mk-article");
  const { locale } = useRouter();

  if (!article) {
    return (
      <MockupLayout>
        <main id="page-article" className="page">
          <div className="article-page">
            <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
              <h1>{t("notFound.title", { defaultValue: "Article not found" })}</h1>
              <p style={{ marginTop: 12 }}>
                <Link href="/news" className="btn btn-primary">{t("notFound.back", { defaultValue: "Back to news" })}</Link>
              </p>
            </div>
          </div>
        </main>
      </MockupLayout>
    );
  }

  const dateStr = article.publishedAt
    ? new Intl.DateTimeFormat(locale ?? "en", { dateStyle: "long" }).format(new Date(article.publishedAt))
    : "";
  const initials = (article.author ?? "Carsens")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <Head>
        <title>{`${article.seoTitle} — Carsens`}</title>
        {article.seoDescription && <meta name="description" content={article.seoDescription} />}
        <meta name="robots" content="index,follow" />
      </Head>
      <MockupLayout>
        <main id="page-article" className="page">
          <div className="read-progress" id="readProgress"></div>

          <div className="article-page">
            <div className="container">
              <div className="breadcrumb">
                <Link href="/">{t("breadcrumb.home")}</Link><span className="sep">›</span>
                <Link href="/news">{t("breadcrumb.news")}</Link><span className="sep">›</span>
                <span className="current">{article.title}</span>
              </div>

              <div className="article-hero-block">
                {article.category && <span className="article-cat-tag warning">{article.category}</span>}
                <h1 className="article-title">{article.title}</h1>
                {article.excerpt && <p className="article-dek">{article.excerpt}</p>}
                <div className="article-meta-row">
                  <div className="am-author">
                    <span className="am-avatar">{initials}</span>
                    <span><strong>{article.author ?? "Carsens"}</strong></span>
                  </div>
                  {dateStr && (<><span className="ad">•</span><span>{dateStr}</span></>)}
                  {article.readMinutes && (
                    <><span className="ad">•</span><span>{t("hero.readTime", { defaultValue: `${article.readMinutes} min read`, count: article.readMinutes })}</span></>
                  )}
                </div>
              </div>

              {article.coverImageUrl && (
                <div className="article-hero-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.coverImageUrl} alt="" />
                </div>
              )}

              {/* Body — safe HTML snapshot rendered from Markdown server-side */}
              <article className="article-body" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />

              {related.length > 0 && (
                <section className="article-related">
                  <h2 className="news-section-title">{t("related.title", { defaultValue: "Related articles" })}</h2>
                  <div className="article-grid-2">
                    {related.map((r) => (
                      <Link href={`/news/${r.slug}`} key={r.id} className="article-card">
                        <div className="ac-media">
                          {r.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.coverImageUrl} alt="" />
                          ) : (
                            <div className="ac-media-fallback" />
                          )}
                        </div>
                        <div className="ac-body">
                          {r.category && <span className="ac-tag">{r.category}</span>}
                          <h3>{r.title}</h3>
                          {r.excerpt && <p className="ac-excerpt">{r.excerpt}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  const slug = String(ctx.params?.slug ?? "");
  let article: ArticleDetail | null = null;
  let related: ArticleCard[] = [];
  try {
    article = await getNewsArticle(slug, locale);
    if (article?.category) {
      const rel = await getNews(locale, { category: article.category, limit: 5 });
      related = rel.items.filter((r) => r.slug !== slug).slice(0, 2);
    }
  } catch {
    article = null;
  }
  if (!article) ctx.res.statusCode = 404;
  return {
    props: {
      article,
      related,
      ...(await serverSideTranslations(locale, ["common", "mk-article"], nextI18NextConfig)),
    },
  };
};
