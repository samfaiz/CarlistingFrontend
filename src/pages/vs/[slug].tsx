/**
 * /vs/[make-model]-vs-[make-model] — "X vs Y" SEO landing page (task P6-03,
 * FR-CV7). Server-rendered from GET /vs/:slug (backend-cached, regenerated on
 * TrimSpec change by cache-key construction). Long-tail pairs render noindex;
 * only curated pairs are indexable + sitemapped (§13.1). FAQ copy is composed
 * client-side from structured facts so all four locales stay honest — the
 * visible FAQ text and the FAQPage JSON-LD are built from the same array.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { SeoHead } from "@/components/seo/seo-head";
import { BreadcrumbJsonLd, FaqJsonLd, type FaqEntry } from "@/components/seo/json-ld";
import { formatPrice, mediaUrl } from "@/lib/format";
import { getVsPage, type VsPage } from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

interface Props {
  page: VsPage;
}

export default function VsPairPage({ page }: Props) {
  const { t } = useTranslation("mk-vs");
  const router = useRouter();
  const locale = router.locale ?? "en";
  const [a, b] = page.models;
  const title = t("meta.title", {
    a: a.title,
    b: b.title,
    defaultValue: "{{a}} vs {{b}} — specs, prices & verdict",
  });
  const description = t("meta.desc", {
    a: a.title,
    b: b.title,
    defaultValue:
      "Side-by-side {{a}} vs {{b}} comparison for the UAE: specs, average used prices, availability and a data-driven verdict.",
  });

  // Intro: CMS copy for this locale when curated, else the honest template.
  const intro =
    page.intro?.[locale] ??
    page.intro?.en ??
    t("intro.generated", {
      a: a.title,
      b: b.title,
      defaultValue:
        "Comparing the {{a}} and the {{b}}? This page puts both side by side using live Carsens market data — real asking prices, real availability — plus the spec sheet differences that matter.",
    });

  // FAQ — every entry exists only if its fact does. JSON-LD mirrors this list.
  const faqs: FaqEntry[] = [];
  const f = page.facts;
  if (f.avgPriceAed) {
    faqs.push({
      question: t("faq.priceQ", { a: a.title, b: b.title, defaultValue: "Which is cheaper to buy used in the UAE — {{a}} or {{b}}?" }),
      answer: t("faq.priceA", {
        cheaper: f.avgPriceAed[0] <= f.avgPriceAed[1] ? a.title : b.title,
        a: a.title,
        b: b.title,
        priceA: formatPrice(f.avgPriceAed[0], "en"),
        priceB: formatPrice(f.avgPriceAed[1], "en"),
        defaultValue:
          "Based on current live listings, the average asking price is {{priceA}} for the {{a}} and {{priceB}} for the {{b}} — the {{cheaper}} is currently cheaper on average.",
      }),
    });
  }
  if (f.liveCounts[0] > 0 || f.liveCounts[1] > 0) {
    faqs.push({
      question: t("faq.availQ", { a: a.title, b: b.title, defaultValue: "Which is easier to find for sale right now?" }),
      answer: t("faq.availA", {
        a: a.title,
        b: b.title,
        countA: f.liveCounts[0],
        countB: f.liveCounts[1],
        defaultValue:
          "Carsens currently lists {{countA}} live {{a}} and {{countB}} live {{b}} adverts in the UAE.",
      }),
    });
  }
  if (f.powerHp) {
    faqs.push({
      question: t("faq.powerQ", { a: a.title, b: b.title, defaultValue: "Which has more power — {{a}} or {{b}}?" }),
      answer: t("faq.powerA", {
        a: a.title,
        b: b.title,
        hpA: f.powerHp[0],
        hpB: f.powerHp[1],
        defaultValue: "The {{a}} produces {{hpA}} hp against {{hpB}} hp for the {{b}} (compared trims).",
      }),
    });
  }
  if (f.winner >= 0) {
    const winner = page.models[f.winner];
    faqs.push({
      question: t("faq.verdictQ", { a: a.title, b: b.title, defaultValue: "Which is better overall — {{a}} or {{b}}?" }),
      answer: t("faq.verdictA", {
        winner: winner.title,
        defaultValue:
          "On Carsens's balanced scoring across price, running costs, practicality and performance, the {{winner}} comes out ahead for the compared trims. Your own priorities may differ — use the compare tool to weight what matters to you.",
      }),
    });
  }

  // Spec rows grouped for the mockup's cmp-section layout (same as /compare).
  const groups = React.useMemo(() => {
    const order: string[] = [];
    const by: Record<string, VsPage["compare"]["rows"]> = {};
    for (const r of page.compare.rows) {
      if (!by[r.group]) { by[r.group] = []; order.push(r.group); }
      by[r.group].push(r);
    }
    return order.map((g) => ({ group: g, rows: by[g] }));
  }, [page.compare.rows]);

  const browseHref = (m: VsPage["models"][number]) =>
    page.vehicleType === "CAR" ? `/used-cars/${m.makeSlug}/${m.slug}` : `/bikes?make=${m.makeSlug}`;

  return (
    <>
      <SeoHead title={`${title} — Carsens`} description={description} path={`/vs/${page.slug}`} />
      {!page.indexable && (
        <Head><meta name="robots" content="noindex, follow" /></Head>
      )}
      <BreadcrumbJsonLd
        items={[
          { name: t("breadcrumb.home", { defaultValue: "Home" }), path: "/" },
          { name: t("breadcrumb.vs", { defaultValue: "Comparisons" }), path: "/vs" },
          { name: `${a.title} vs ${b.title}`, path: `/vs/${page.slug}` },
        ]}
      />
      <FaqJsonLd faqs={faqs} />
      <MockupLayout>
        <main id="page-vs" className="page">
          <div className="compare-wrap">
            <div className="container">
              <div className="compare-head">
                <h1>{t("head.title", { a: a.title, b: b.title, defaultValue: "{{a}} vs {{b}}" })}</h1>
                <p>{intro}</p>
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <Link href={browseHref(a)} className="btn btn-outline">{t("actions.browse", { model: a.title, defaultValue: "Browse {{model}} for sale" })}</Link>
                  <Link href={browseHref(b)} className="btn btn-outline">{t("actions.browse", { model: b.title, defaultValue: "Browse {{model}} for sale" })}</Link>
                  <Link href="/compare" className="btn btn-primary">{t("actions.customize", { defaultValue: "Build your own comparison" })}</Link>
                </div>
              </div>

              {/* COLUMN HEADERS */}
              <div className="compare-cars">
                <div className="cmp-spec-col">
                  <h3>{t("cars.heading", { defaultValue: "Side by side" })}</h3>
                  <p>{t("cars.hint", { defaultValue: "Green marks the better value in each row." })}</p>
                </div>
                {page.compare.columns.map((col) => (
                  <div className="cmp-car" key={col.key}>
                    <div className="cmp-car-photo">
                      {col.coverKey ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(col.coverKey)} alt={col.title} />
                      ) : <div style={{ aspectRatio: "16/10", background: "var(--brand-surface)" }} />}
                    </div>
                    <h4>{col.title}</h4>
                    <div className="cmp-car-price">{col.priceAed != null ? `≈ ${formatPrice(col.priceAed, "en")}` : "—"}</div>
                  </div>
                ))}
              </div>

              {/* SPEC DIFF TABLE */}
              {groups.map(({ group, rows }) => (
                <div className="cmp-section" key={group}>
                  <h3 className="cmp-section-title"><div className="left">{group}</div></h3>
                  <div className="cmp-table">
                    {rows.map((r) => (
                      <div className="cmp-row" key={r.key}>
                        <div className="cmp-label">{r.label}{r.unit ? ` (${r.unit})` : ""}</div>
                        {r.values.map((v, i) => (
                          <div key={i} className={`cmp-val${r.winners.includes(i) && !r.identical ? " winner" : ""}`}>{v ?? "—"}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* VERDICT */}
              {f.winner >= 0 && (
                <div className="verdict-grid" style={{ marginTop: 24 }}>
                  <div className="verdict-card winner-card" style={{ padding: 20, border: "2px solid var(--brand)", borderRadius: "var(--radius-lg)" }}>
                    <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 6 }}>{t("verdict.title", { defaultValue: "Best overall (balanced weights)" })}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--brand)" }}>{page.models[f.winner].title}</div>
                  </div>
                </div>
              )}

              {/* LIVE LISTINGS */}
              {page.listings.some((side) => side.length > 0) && (
                <section style={{ marginTop: 36 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t("listings.heading", { defaultValue: "For sale right now" })}</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                    {page.listings.flat().map((l) => (
                      <Link key={l.slug} href={`/${page.vehicleType === "CAR" ? "cars" : "bikes"}/${l.slug}`} className="card" style={{ display: "block" }}>
                        <div style={{ aspectRatio: "16/10", background: "var(--brand-surface)", borderRadius: "var(--radius) var(--radius) 0 0", overflow: "hidden" }}>
                          {l.coverKey && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(l.coverKey)} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                        <div style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{l.title}</div>
                          <div style={{ color: "var(--brand)", fontWeight: 800, marginTop: 4 }}>{formatPrice(l.priceAed, "en")}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* FAQ — same array feeds the JSON-LD above */}
              {faqs.length > 0 && (
                <section style={{ marginTop: 36, maxWidth: 760 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{t("faq.heading", { defaultValue: "Frequently asked questions" })}</h2>
                  <div id="faqList">
                    {faqs.map((faq) => (
                      <details className="faq-item" key={faq.question}>
                        <summary className="faq-q">
                          {faq.question}
                          <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="6 9 12 15 18 9" /></svg>
                        </summary>
                        <div className="faq-a"><p>{faq.answer}</p></div>
                      </details>
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

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, params }) => {
  const slug = typeof params?.slug === "string" ? params.slug : "";
  try {
    const page = await getVsPage(slug);
    if ("redirect" in page) {
      return { redirect: { destination: `/vs/${page.redirect}`, permanent: true } };
    }
    return {
      props: {
        page,
        ...(await serverSideTranslations(locale ?? nextI18NextConfig.i18n.defaultLocale, ["common", "mk-vs"], nextI18NextConfig)),
      },
    };
  } catch {
    return { notFound: true };
  }
};
