/**
 * /compare — the mockup's page-compare design (`.mk` layer, mk-compare i18n
 * x4 + RTL) wired to the real Compare engine: the app-wide compare tray
 * (useCompare) feeds buildCompare(), which returns spec rows with per-row
 * winners and a weighted verdict. Copy stays in mk-compare.
 */
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { useCompare } from "@/components/compare/compare-provider";
import { formatPrice, mediaUrl } from "@/lib/format";
import { buildCompare, type CompareResult } from "@/lib/marketplace-api";
import { API_BASE_URL, apiPost } from "@/lib/api";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MkcomparePage() {
  const { t } = useTranslation("mk-compare");
  const { items, remove } = useCompare();
  const [result, setResult] = React.useState<CompareResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const [verdictBusy, setVerdictBusy] = React.useState(false);
  const [verdict, setVerdict] = React.useState<{ text: string; disclaimer: string } | null>(null);

  // P5-05 compare export — fetch the PDF and open it in a new tab.
  const exportPdf = async () => {
    setPdfBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pdf/compare`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ members: items.map((i) => ({ kind: "LISTING", listingSlug: i.slug })) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch { /* toast-free page; button re-enables */ }
    finally { setPdfBusy(false); }
  };

  // P5-04 AI verdict — built from the already-computed compare table only.
  const getVerdict = async () => {
    if (!result) return;
    setVerdictBusy(true);
    try {
      const v = await apiPost<{ text: string; disclaimer: string }>("/ai/compare-verdict", {
        columns: result.columns.map((c) => ({ title: c.title, priceAed: c.priceAed, mileageKm: c.mileageKm, year: c.year, specs: c.specs ?? {} })),
        rows: result.rows.map((r) => ({ label: r.label, values: r.values, winners: r.winners })),
      });
      setVerdict(v);
    } catch { /* silently keep the page usable */ }
    finally { setVerdictBusy(false); }
  };

  React.useEffect(() => {
    if (items.length < 2) { setResult(null); return; }
    setLoading(true);
    buildCompare(items.map((i) => ({ kind: "LISTING" as const, listingSlug: i.slug })))
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [items]);

  // Group the flat rows by their section for the mockup's cmp-section layout.
  const groups = React.useMemo(() => {
    if (!result) return [];
    const order: string[] = [];
    const by: Record<string, CompareResult["rows"]> = {};
    for (const r of result.rows) {
      if (!by[r.group]) { by[r.group] = []; order.push(r.group); }
      by[r.group].push(r);
    }
    return order.map((g) => ({ group: g, rows: by[g] }));
  }, [result]);

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-compare" className="page">
          <div className="compare-wrap">
            <div className="container">
              <div className="compare-head">
                <h1>{t("head.title")}</h1>
                <p>{t("head.sub")}</p>
                {items.length >= 2 && (
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-outline" onClick={() => void exportPdf()} disabled={pdfBusy}>
                      📄 {pdfBusy ? t("actions.exporting", { defaultValue: "Exporting…" }) : t("actions.exportPdf", { defaultValue: "Export PDF" })}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => void getVerdict()} disabled={verdictBusy}>
                      ✨ {verdictBusy ? t("actions.thinking", { defaultValue: "Thinking…" }) : t("actions.aiVerdict", { defaultValue: "AI verdict" })}
                    </button>
                  </div>
                )}
                {verdict && (
                  <div style={{ marginTop: 14, padding: "12px 16px", background: "var(--surface-2, #f2f5fa)", borderRadius: 10, maxWidth: 720 }}>
                    <p style={{ fontSize: 14, lineHeight: 1.55 }}>{verdict.text}</p>
                    <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>{verdict.disclaimer}</p>
                  </div>
                )}
              </div>

              {items.length < 2 ? (
                <div className="compare-empty" style={{ textAlign: "center", padding: "64px 0", color: "var(--text-3)" }}>
                  <p style={{ fontSize: 16, marginBottom: 16 }}>{t("empty.text", { defaultValue: "Add at least two cars to compare — use the ⚖ button on any listing." })}</p>
                  <Link href="/cars" className="btn btn-primary btn-lg">{t("empty.cta", { defaultValue: "Browse cars" })}</Link>
                </div>
              ) : (
                <>
                  {/* CAR COLUMNS */}
                  <div className="compare-cars">
                    <div className="cmp-spec-col">
                      <h3>{t("cars.heading")}</h3>
                      <p>{t("cars.hint")}</p>
                    </div>
                    {(result?.columns ?? items.map((i) => ({ key: i.id, title: i.title, priceAed: i.priceAed, coverKey: i.thumb, slug: i.slug, listingId: i.id }))).map((col) => (
                      <div className="cmp-car" key={col.key}>
                        <button className="cmp-remove" type="button" title={t("cars.remove")} onClick={() => col.listingId && remove(col.listingId)}>✕</button>
                        <div className="cmp-car-photo">
                          {col.coverKey ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaUrl(col.coverKey)} alt={col.title} />
                          ) : <div style={{ aspectRatio: "16/10", background: "var(--brand-surface)" }} />}
                        </div>
                        <h4>{col.title}</h4>
                        <div className="cmp-car-price">{col.priceAed != null ? formatPrice(col.priceAed, "en") : "—"}</div>
                        <div className="cmp-car-actions">
                          {col.slug && <Link href={`/cars/${col.slug}`} className="btn btn-primary">{t("cars.viewDetails")}</Link>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {loading && <p style={{ padding: 24, color: "var(--text-3)" }}>{t("loading", { defaultValue: "Comparing…" })}</p>}

                  {/* SPEC ROWS BY GROUP */}
                  {groups.map(({ group, rows }) => (
                    <div className="cmp-section" key={group}>
                      <h3 className="cmp-section-title">
                        <div className="left">{group}</div>
                      </h3>
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
                  {result && result.columns.length > 1 && (
                    <div className="verdict-grid" style={{ marginTop: 24 }}>
                      <div className="verdict-card winner-card" style={{ padding: 20, border: "2px solid var(--brand)", borderRadius: "var(--radius-lg)" }}>
                        <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 6 }}>{t("verdict.title", { defaultValue: "Best overall" })}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--brand)" }}>{result.columns[result.scores.winner]?.title}</div>
                      </div>
                    </div>
                  )}
                </>
              )}
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
      ["common", "mk-compare"],
      nextI18NextConfig,
    )),
  },
});
