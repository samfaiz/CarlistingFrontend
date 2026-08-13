import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function MkarticlePage() {
  const { t } = useTranslation("mk-article");
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-article" className="page">

          {/* Reading progress bar */}
          <div className="read-progress" id="readProgress"></div>

          {/* Sticky vertical aside (share/save/comment buttons) */}
          <div className="article-aside">
            <button className="aside-btn" id="articleLike" title={t("aside.like")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z"/></svg>
              <span className="cnt-badge">{t("aside.likeCount")}</span>
            </button>
            <button className="aside-btn" id="articleSave" title={t("aside.save")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
            </button>
            <button className="aside-btn" title={t("aside.share")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
            </button>
            <button className="aside-btn" title={t("aside.comments")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8z"/></svg>
              <span className="cnt-badge">{t("aside.commentCount")}</span>
            </button>
          </div>

          <div className="article-page">
            <div className="container">

              <div className="breadcrumb">
                <Link href="/">{t("breadcrumb.home")}</Link><span className="sep">›</span>
                <Link href="/news">{t("breadcrumb.news")}</Link><span className="sep">›</span>
                <Link href="/news">{t("breadcrumb.reviews")}</Link><span className="sep">›</span>
                <span className="current">{t("breadcrumb.current")}</span>
              </div>
            </div>

            {/* HERO */}
            <div className="article-hero-block">
              <span className="article-cat-tag warning">{t("hero.category")}</span>
              <h1 className="article-title">{t("hero.title")}</h1>
              <p className="article-dek">{t("hero.dek")}</p>
              <div className="article-meta-row">
                <div className="am-author">
                  <span className="am-avatar">{t("hero.authorInitials")}</span>
                  <span><strong>{t("hero.authorName")}</strong></span>
                </div>
                <span className="ad">•</span>
                <span>{t("hero.authorRole")}</span>
                <span className="ad">•</span>
                <span>{t("hero.date")}</span>
                <span className="ad">•</span>
                <span>{t("hero.readTime")}</span>
              </div>

              <div className="article-actions-row">
                <button className="article-save-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                  {t("hero.actions.save")}
                </button>
                <button>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.8c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1-.8-.8-1.9-1.3-3.1-1.3-2.3 0-4.2 1.9-4.2 4.2 0 .3 0 .7.1 1C8 8.8 4.5 7 2.2 4.2c-.4.6-.6 1.3-.6 2.1 0 1.5.8 2.8 1.9 3.5-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.7 3.3 4.1-.3.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.6 2.1 2.9 4 2.9-1.4 1.1-3.3 1.8-5.3 1.8H1c1.8 1.2 4 1.9 6.3 1.9 7.5 0 11.7-6.2 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg>
                  {t("hero.actions.tweet")}
                </button>
                <button>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5 0-.1-.2-.2-.5-.4zM12 21c-1.8 0-3.5-.5-5-1.4l-3.5 1 1-3.4c-1-1.6-1.5-3.4-1.5-5.2 0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/></svg>
                  {t("hero.actions.whatsapp")}
                </button>
                <button>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                  {t("hero.actions.copyLink")}
                </button>
              </div>
            </div>

            {/* HERO IMAGE */}
            <div className="article-hero-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1800&q=85&auto=format" alt="" />
            </div>
            <p className="article-image-caption">{t("hero.imageCaption")} <em>{t("hero.imageCredit")}</em></p>

            {/* BODY */}
            <article className="article-body">

              <p className="lead">{t("body.lead")}</p>

              <p>{t("body.p1a")}<Link href="/cars/demo">{t("body.p1Link")}</Link>{t("body.p1b")}</p>

              <h2>{t("body.h2_1")}</h2>

              <p>{t("body.p2a")}<strong>{t("body.p2Strong")}</strong>{t("body.p2b")}</p>

              <p>{t("body.p3")}</p>

              <blockquote>{t("body.blockquote1")}</blockquote>

              <p>{t("body.p4")}</p>

              {/* Inline image */}
              <figure className="article-inline-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1400&q=85&auto=format" alt="" />
                <figcaption>{t("body.inlineCaption1")}</figcaption>
              </figure>

              <h2>{t("body.h2_2")}</h2>

              <p>{t("body.p5")}</p>

              <p>{t("body.p6")}</p>

              <h3>{t("body.h3_1")}</h3>

              <p>{t("body.p7a")}<strong>{t("body.p7Strong")}</strong>{t("body.p7b")}</p>

              <p>{t("body.p8")}</p>

              <div className="pull-quote">
                {t("body.pullQuote1")}
                <span className="pq-attribution">{t("body.pullQuoteAttr1")}</span>
              </div>

              <h2>{t("body.h2_3")}</h2>

              <p>{t("body.p9")}</p>

              <ul>
                <li><strong>{t("body.list1.0.strong")}</strong>{t("body.list1.0.text")}</li>
                <li><strong>{t("body.list1.1.strong")}</strong>{t("body.list1.1.text")}</li>
                <li>{t("body.list1.2.pre")}<strong>{t("body.list1.2.strong")}</strong>{t("body.list1.2.text")}</li>
                <li><strong>{t("body.list1.3.strong")}</strong>{t("body.list1.3.text")}</li>
                <li>{t("body.list1.4.text")}</li>
              </ul>

              <p>{t("body.p10")}</p>

              {/* Spec box */}
              <div className="article-spec-box">
                <h4>{t("body.specBox.title")}</h4>
                <dl>
                  <dt>{t("body.specBox.rows.0.term")}</dt><dd>{t("body.specBox.rows.0.value")}</dd>
                  <dt>{t("body.specBox.rows.1.term")}</dt><dd>{t("body.specBox.rows.1.value")}</dd>
                  <dt>{t("body.specBox.rows.2.term")}</dt><dd>{t("body.specBox.rows.2.value")}</dd>
                  <dt>{t("body.specBox.rows.3.term")}</dt><dd>{t("body.specBox.rows.3.value")}</dd>
                  <dt>{t("body.specBox.rows.4.term")}</dt><dd>{t("body.specBox.rows.4.value")}</dd>
                  <dt>{t("body.specBox.rows.5.term")}</dt><dd>{t("body.specBox.rows.5.value")}</dd>
                  <dt>{t("body.specBox.rows.6.term")}</dt><dd>{t("body.specBox.rows.6.value")}</dd>
                  <dt>{t("body.specBox.rows.7.term")}</dt><dd>{t("body.specBox.rows.7.value")}</dd>
                  <dt>{t("body.specBox.rows.8.term")}</dt><dd>{t("body.specBox.rows.8.value")}</dd>
                  <dt>{t("body.specBox.rows.9.term")}</dt><dd>{t("body.specBox.rows.9.value")}</dd>
                </dl>
              </div>

              <h2>{t("body.h2_4")}</h2>

              <p>{t("body.p11")}</p>

              <p>{t("body.p12")}</p>

              <h3>{t("body.h3_2")}</h3>

              <p>{t("body.p13")}</p>

              <p>{t("body.p14")}</p>

              {/* Verdict / pros & cons */}
              <div className="article-verdict">
                <h3>{t("body.verdict.title")}</h3>
                <p>{t("body.verdict.summary")}</p>
                <div className="verdict-grid">
                  <div className="pros">
                    <h4>{t("body.verdict.prosTitle")}</h4>
                    <ul>
                      <li>{t("body.verdict.pros.0")}</li>
                      <li>{t("body.verdict.pros.1")}</li>
                      <li>{t("body.verdict.pros.2")}</li>
                      <li>{t("body.verdict.pros.3")}</li>
                      <li>{t("body.verdict.pros.4")}</li>
                      <li>{t("body.verdict.pros.5")}</li>
                    </ul>
                  </div>
                  <div className="cons">
                    <h4>{t("body.verdict.consTitle")}</h4>
                    <ul>
                      <li>{t("body.verdict.cons.0")}</li>
                      <li>{t("body.verdict.cons.1")}</li>
                      <li>{t("body.verdict.cons.2")}</li>
                      <li>{t("body.verdict.cons.3")}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="article-rating">
                <div>
                  <div className="ar-label">{t("body.rating.label")}</div>
                  <div className="ar-name">{t("body.rating.name")}</div>
                </div>
                <div className="ar-score">{t("body.rating.score")}<small>{t("body.rating.scoreMax")}</small></div>
              </div>

              <h2>{t("body.h2_5")}</h2>

              <p>{t("body.p15")}</p>

              <p>{t("body.p16")}</p>

              <p>{t("body.p17")}</p>

              <p><em>{t("body.p18a")}<Link href="/used-cars">{t("body.p18Link1")}</Link>{t("body.p18mid")}<Link href="/dealers">{t("body.p18Link2")}</Link></em></p>

            </article>

            {/* TAGS */}
            <div className="article-tags-row">
              <span className="tags-label">{t("tags.label")}</span>
              <a href="#" className="topic-tag">{t("tags.items.0")}</a>
              <a href="#" className="topic-tag">{t("tags.items.1")}</a>
              <a href="#" className="topic-tag">{t("tags.items.2")}</a>
              <a href="#" className="topic-tag">{t("tags.items.3")}</a>
              <a href="#" className="topic-tag">{t("tags.items.4")}</a>
              <a href="#" className="topic-tag">{t("tags.items.5")}</a>
              <a href="#" className="topic-tag">{t("tags.items.6")}</a>
              <a href="#" className="topic-tag">{t("tags.items.7")}</a>
            </div>

            {/* AUTHOR BIO */}
            <div className="author-bio">
              <div className="ab-avatar">{t("authorBio.initials")}</div>
              <div className="ab-info">
                <h4>{t("authorBio.name")}</h4>
                <div className="ab-role">{t("authorBio.role")}</div>
                <p>{t("authorBio.description")}</p>
                <div className="ab-follow">
                  <a href="#" className="btn btn-primary">{t("authorBio.follow")}</a>
                  <a href="#" className="btn btn-outline">{t("authorBio.allArticles")}</a>
                </div>
              </div>
            </div>

            {/* RELATED */}
            <section className="related-section">
              <div className="container">
                <h2>{t("related.title")}</h2>
                <div className="related-grid">
                  <Link href="/news/demo" className="article-card">
                    <div className="ac-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=720&q=80&auto=format" alt="" />
                    </div>
                    <div className="ac-body">
                      <span className="ac-tag success">{t("related.cards.0.tag")}</span>
                      <h3>{t("related.cards.0.title")}</h3>
                      <p className="ac-excerpt">{t("related.cards.0.excerpt")}</p>
                      <div className="ac-meta">
                        <div className="ac-author"><span className="av">{t("related.cards.0.authorInitials")}</span><strong>{t("related.cards.0.author")}</strong></div>
                        <span className="ac-dot">•</span><span>{t("related.cards.0.readTime")}</span>
                      </div>
                    </div>
                  </Link>
                  <Link href="/news/demo" className="article-card">
                    <div className="ac-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=720&q=80&auto=format" alt="" />
                    </div>
                    <div className="ac-body">
                      <span className="ac-tag">{t("related.cards.1.tag")}</span>
                      <h3>{t("related.cards.1.title")}</h3>
                      <p className="ac-excerpt">{t("related.cards.1.excerpt")}</p>
                      <div className="ac-meta">
                        <div className="ac-author"><span className="av">{t("related.cards.1.authorInitials")}</span><strong>{t("related.cards.1.author")}</strong></div>
                        <span className="ac-dot">•</span><span>{t("related.cards.1.readTime")}</span>
                      </div>
                    </div>
                  </Link>
                  <Link href="/news/demo" className="article-card">
                    <div className="ac-media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=720&q=80&auto=format" alt="" />
                    </div>
                    <div className="ac-body">
                      <span className="ac-tag">{t("related.cards.2.tag")}</span>
                      <h3>{t("related.cards.2.title")}</h3>
                      <p className="ac-excerpt">{t("related.cards.2.excerpt")}</p>
                      <div className="ac-meta">
                        <div className="ac-author"><span className="av">{t("related.cards.2.authorInitials")}</span><strong>{t("related.cards.2.author")}</strong></div>
                        <span className="ac-dot">•</span><span>{t("related.cards.2.readTime")}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            {/* COMMENTS */}
            <section className="comments-section">
              <div className="container">

                <div className="comments-head">
                  <h2>{t("comments.title")} <span className="cnt">{t("comments.count")}</span></h2>
                  <select className="comments-sort">
                    <option>{t("comments.sort.top")}</option>
                    <option>{t("comments.sort.recent")}</option>
                    <option>{t("comments.sort.oldest")}</option>
                  </select>
                </div>

                {/* Comment form */}
                <div className="comment-form">
                  <div className="cf-row">
                    <div className="cf-avatar">{t("comments.form.avatar")}</div>
                    <textarea className="cf-textarea" placeholder={t("comments.form.placeholder")} rows={1} id="commentInput"></textarea>
                  </div>
                  <div className="cf-foot">
                    <div className="cf-tools">
                      <button title={t("comments.form.bold")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg></button>
                      <button title={t("comments.form.italic")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>
                      <button title={t("comments.form.link")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></button>
                      <button title={t("comments.form.emoji")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg></button>
                    </div>
                    <div>
                      <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "12.5px", marginRight: "4px" }}>{t("comments.form.cancel")}</button>
                      <button className="btn btn-primary" id="postCommentBtn" style={{ padding: "6px 16px", fontSize: "12.5px" }}>{t("comments.form.post")}</button>
                    </div>
                  </div>
                </div>

                {/* COMMENT 1 (top) */}
                <div className="comment">
                  <div className="comment-avatar alt-2">{t("comments.list.0.avatar")}</div>
                  <div className="comment-body">
                    <div className="comment-head">
                      <span className="comment-name">{t("comments.list.0.name")}</span>
                      <span className="comment-badge">{t("comments.list.0.badge")}</span>
                      <span className="comment-time">{t("comments.list.0.time")}</span>
                    </div>
                    <p className="comment-text">{t("comments.list.0.text")}</p>
                    <div className="comment-actions">
                      <button className="liked"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z"/></svg> {t("comments.list.0.likes")}</button>
                      <button>{t("comments.actions.reply")}</button>
                      <button>{t("comments.actions.share")}</button>
                      <button>{t("comments.actions.report")}</button>
                    </div>

                    {/* Reply */}
                    <div className="comment-replies">
                      <div className="comment">
                        <div className="comment-avatar alt-3">{t("comments.list.0.reply.avatar")}</div>
                        <div className="comment-body">
                          <div className="comment-head">
                            <span className="comment-name">{t("comments.list.0.reply.name")}</span>
                            <span className="comment-badge author">{t("comments.list.0.reply.badge")}</span>
                            <span className="comment-time">{t("comments.list.0.reply.time")}</span>
                          </div>
                          <p className="comment-text">{t("comments.list.0.reply.text")}</p>
                          <div className="comment-actions">
                            <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z"/></svg> {t("comments.list.0.reply.likes")}</button>
                            <button>{t("comments.actions.reply")}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COMMENT 2 */}
                <div className="comment">
                  <div className="comment-avatar alt-1">{t("comments.list.1.avatar")}</div>
                  <div className="comment-body">
                    <div className="comment-head">
                      <span className="comment-name">{t("comments.list.1.name")}</span>
                      <span className="comment-time">{t("comments.list.1.time")}</span>
                    </div>
                    <p className="comment-text">{t("comments.list.1.text")}</p>
                    <div className="comment-actions">
                      <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z"/></svg> {t("comments.list.1.likes")}</button>
                      <button>{t("comments.actions.reply")}</button>
                      <button>{t("comments.actions.share")}</button>
                    </div>

                    <div className="comment-replies">
                      <div className="comment">
                        <div className="comment-avatar alt-3">{t("comments.list.1.reply.avatar")}</div>
                        <div className="comment-body">
                          <div className="comment-head">
                            <span className="comment-name">{t("comments.list.1.reply.name")}</span>
                            <span className="comment-badge author">{t("comments.list.1.reply.badge")}</span>
                            <span className="comment-time">{t("comments.list.1.reply.time")}</span>
                          </div>
                          <p className="comment-text">{t("comments.list.1.reply.text")}</p>
                          <div className="comment-actions">
                            <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z"/></svg> {t("comments.list.1.reply.likes")}</button>
                            <button>{t("comments.actions.reply")}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COMMENT 3 */}
                <div className="comment">
                  <div className="comment-avatar alt-4">{t("comments.list.2.avatar")}</div>
                  <div className="comment-body">
                    <div className="comment-head">
                      <span className="comment-name">{t("comments.list.2.name")}</span>
                      <span className="comment-time">{t("comments.list.2.time")}</span>
                    </div>
                    <p className="comment-text">{t("comments.list.2.text")}</p>
                    <div className="comment-actions">
                      <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z"/></svg> {t("comments.list.2.likes")}</button>
                      <button>{t("comments.actions.reply")}</button>
                      <button>{t("comments.actions.share")}</button>
                    </div>
                  </div>
                </div>

                {/* COMMENT 4 */}
                <div className="comment">
                  <div className="comment-avatar">{t("comments.list.3.avatar")}</div>
                  <div className="comment-body">
                    <div className="comment-head">
                      <span className="comment-name">{t("comments.list.3.name")}</span>
                      <span className="comment-time">{t("comments.list.3.time")}</span>
                    </div>
                    <p className="comment-text">{t("comments.list.3.text")}</p>
                    <div className="comment-actions">
                      <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z"/></svg> {t("comments.list.3.likes")}</button>
                      <button>{t("comments.actions.reply")}</button>
                    </div>
                  </div>
                </div>

                {/* COMMENT 5 */}
                <div className="comment">
                  <div className="comment-avatar alt-2">{t("comments.list.4.avatar")}</div>
                  <div className="comment-body">
                    <div className="comment-head">
                      <span className="comment-name">{t("comments.list.4.name")}</span>
                      <span className="comment-time">{t("comments.list.4.time")}</span>
                    </div>
                    <p className="comment-text">{t("comments.list.4.text")}</p>
                    <div className="comment-actions">
                      <button><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H7V10l4.83-9c.31-.56.93-.92 1.6-.86a2 2 0 011.74 2.36L15 5.88z"/></svg> {t("comments.list.4.likes")}</button>
                      <button>{t("comments.actions.reply")}</button>
                    </div>
                  </div>
                </div>

                <button className="btn btn-outline btn-block" style={{ marginTop: "18px", width: "100%" }}>{t("comments.loadMore")}</button>

              </div>
            </section>

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
      ["common", "mk-article"],
      nextI18NextConfig,
    )),
  },
});
