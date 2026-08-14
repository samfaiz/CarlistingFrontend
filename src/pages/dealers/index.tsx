/**
 * /dealers — public dealer directory, wired to live data (stub-cleanup batch:
 * the mockup's cards all linked to /dealers/demo). Keeps the mockup design
 * classes (.dealers-hero, .dealer-card…) over GET /dealers/directory —
 * verified-first, never exposes TRN. Searchable via ?q=.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { apiGet } from "@/lib/api";
import nextI18NextConfig from "../../../next-i18next.config.js";

interface DirectoryDealer {
  id: string;
  slug: string;
  name: string;
  logoKey: string | null;
  verified: boolean;
  brands: string[];
  emirates: string[];
  liveListings: number;
}

interface Props {
  items: DirectoryDealer[];
  total: number;
  q: string;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function DealerCard({ d, t }: { d: DirectoryDealer; t: (k: string, o?: Record<string, unknown>) => string }) {
  return (
    <Link href={`/dealers/${d.slug}`} className="dealer-card">
      <div className="dc-cover">
        {d.verified && <span className="dc-premium">{t("card.verifiedTitle", { defaultValue: "Verified dealer" })}</span>}
      </div>
      <div className="dc-body">
        <div className="dc-logo">{initials(d.name)}</div>
        <div className="dc-name-row">
          <h3>{d.name}</h3>
          {d.verified && (
            <span className="dc-verified" title={t("card.verifiedTitle", { defaultValue: "Verified dealer" })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4 6.5-6.5L19 1 9 11 5 7 3 9z" /></svg>
            </span>
          )}
        </div>
        {d.emirates.length > 0 && (
          <div className="dc-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {d.emirates.join(" · ")}
          </div>
        )}
        {d.brands.length > 0 && (
          <div className="dc-tags">
            {d.brands.slice(0, 3).map((b) => <span key={b} className="dc-tag">{b}</span>)}
          </div>
        )}
        <div className="dc-stats">
          <div className="dc-stat">
            <span className="dcs-val">{d.liveListings}</span>
            <span className="dcs-label">{t("card.stats.cars", { defaultValue: "cars" })}</span>
          </div>
        </div>
        <div className="dc-actions">
          <span className="btn btn-primary">{t("card.view", { defaultValue: "View inventory" })}</span>
        </div>
      </div>
    </Link>
  );
}

export default function DealersPage({ items, total, q }: Props) {
  const { t } = useTranslation("mk-dealers");
  const router = useRouter();
  const [kw, setKw] = React.useState(q);
  const verified = items.filter((d) => d.verified);
  const others = items.filter((d) => !d.verified);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    void router.push({ pathname: "/dealers", query: kw.trim() ? { q: kw.trim() } : {} });
  };

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-dealers" className="page">
          <div className="dealers-wrap">
            <div className="dealers-hero">
              <div className="container">
                <h1>{t("hero.title")}</h1>
                <p>{t("hero.sub")}</p>
                <form className="dealers-searchbar" onSubmit={search}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder={t("hero.searchPlaceholder", { defaultValue: "Search dealerships…" })} />
                  <button type="submit" className="btn btn-primary">{t("hero.searchBtn", { defaultValue: "Search" })}</button>
                </form>
                <div className="dealers-stats">
                  <div><strong>{total}</strong> {t("stats.dealers", { defaultValue: "dealerships" })}</div>
                  <div><strong>{verified.length}</strong> {t("stats.verified", { defaultValue: "verified" })}</div>
                </div>
              </div>
            </div>

            <div className="dealers-content">
              <div className="container">
                {items.length === 0 ? (
                  <p style={{ padding: "48px 0", textAlign: "center", color: "var(--text-3)" }}>
                    {t("empty", { defaultValue: "No dealerships match your search yet." })}
                  </p>
                ) : (
                  <>
                    {verified.length > 0 && (
                      <>
                        <h2 className="featured-dealers-title">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" /></svg>
                          {t("featured.title")}
                        </h2>
                        <div className="featured-dealers">
                          {verified.map((d) => <DealerCard key={d.id} d={d} t={t} />)}
                        </div>
                      </>
                    )}
                    {others.length > 0 && (
                      <>
                        <h2 className="featured-dealers-title" style={{ marginTop: 28 }}>{t("all.title", { defaultValue: "All dealerships" })}</h2>
                        <div className="featured-dealers">
                          {others.map((d) => <DealerCard key={d.id} d={d} t={t} />)}
                        </div>
                      </>
                    )}
                  </>
                )}
                <p style={{ marginTop: 28, fontSize: 13 }}>
                  <Link href="/dealer" style={{ color: "var(--brand)" }}>{t("cta.join", { defaultValue: "Are you a dealer? Open your portal →" })}</Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, query }) => {
  const q = typeof query.q === "string" ? query.q : "";
  let items: DirectoryDealer[] = [];
  let total = 0;
  try {
    const res = await apiGet<{ items: DirectoryDealer[]; total: number }>(
      `/dealers/directory?limit=48${q ? `&q=${encodeURIComponent(q)}` : ""}`,
    );
    items = res.items;
    total = res.total;
  } catch {
    /* empty state renders */
  }
  return {
    props: {
      items,
      total,
      q,
      ...(await serverSideTranslations(locale ?? nextI18NextConfig.i18n.defaultLocale, ["common", "mk-dealers"], nextI18NextConfig)),
    },
  };
};
