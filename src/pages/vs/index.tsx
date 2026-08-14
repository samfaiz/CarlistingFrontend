/**
 * /vs — comparison hub (task P6-03, FR-CV7): curated pairs (indexable, in the
 * sitemap) plus the most-compared pairs from real usage. Indexable itself.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { SeoHead } from "@/components/seo/seo-head";
import { getVsHub, type VsHubEntry } from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

interface Props {
  curated: VsHubEntry[];
  popular: VsHubEntry[];
}

function PairGrid({ pairs }: { pairs: VsHubEntry[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
      {pairs.map((p) => (
        <Link key={p.slug} href={`/vs/${p.slug}`} className="card" style={{ display: "block", padding: "18px 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink, #23416B)" }}>{p.title}</div>
        </Link>
      ))}
    </div>
  );
}

export default function VsHubPage({ curated, popular }: Props) {
  const { t } = useTranslation("mk-vs");
  return (
    <>
      <SeoHead
        title={`${t("hub.metaTitle", { defaultValue: "Car comparisons — X vs Y" })} — Carsens`}
        description={t("hub.metaDesc", { defaultValue: "Side-by-side comparisons of the UAE's most cross-shopped cars: specs, live prices and data-driven verdicts." })}
        path="/vs"
      />
      <MockupLayout>
        <main id="page-vs-hub" className="page">
          <div className="compare-wrap">
            <div className="container">
              <div className="compare-head">
                <h1>{t("hub.title", { defaultValue: "Popular comparisons" })}</h1>
                <p>{t("hub.sub", { defaultValue: "Real market data, side by side — pick a matchup or build your own." })}</p>
              </div>

              {curated.length > 0 && (
                <section style={{ marginTop: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{t("hub.curated", { defaultValue: "Editor's picks" })}</h2>
                  <PairGrid pairs={curated} />
                </section>
              )}
              {popular.length > 0 && (
                <section style={{ marginTop: 28 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{t("hub.popular", { defaultValue: "Most compared by shoppers" })}</h2>
                  <PairGrid pairs={popular} />
                </section>
              )}
              {curated.length === 0 && popular.length === 0 && (
                <p style={{ padding: "40px 0", color: "var(--text-3)" }}>{t("hub.empty", { defaultValue: "Comparisons are being prepared — meanwhile, build your own." })}</p>
              )}

              <p style={{ marginTop: 32 }}>
                <Link href="/compare" className="btn btn-primary btn-lg">{t("actions.customize", { defaultValue: "Build your own comparison" })}</Link>
              </p>
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale }) => {
  let curated: VsHubEntry[] = [];
  let popular: VsHubEntry[] = [];
  try {
    const hub = await getVsHub();
    curated = hub.curated;
    popular = hub.popular;
  } catch { /* empty state renders */ }
  return {
    props: {
      curated,
      popular,
      ...(await serverSideTranslations(locale ?? nextI18NextConfig.i18n.defaultLocale, ["common", "mk-vs"], nextI18NextConfig)),
    },
  };
};
