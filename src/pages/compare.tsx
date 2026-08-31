/**
 * /compare — the mockup's page-compare design (`.mk` layer, mk-compare i18n
 * x4 + RTL) wired to the Compare engine.
 *
 * Up to six vehicles, every spec they carry grouped basic → advanced, per-row
 * winners, the weighted "best overall" verdict, share links, PDF export and
 * the AI advisor that replaced the guided quiz. Copy stays in mk-compare;
 * row and group names come from the taxonomy's own locale bags, falling back
 * to the `compare` catalogue.
 */
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { useCompare, COMPARE_MAX } from "@/components/compare/compare-provider";
import { CompareTable } from "@/components/compare/compare-table";
import { AddCarPanel } from "@/components/compare/add-car-panel";
import { AdvisorPanel } from "@/components/compare/advisor-panel";
import {
  buildCompare,
  getCompareSet,
  saveCompareSet,
  type CompareMember,
  type CompareResult,
} from "@/lib/marketplace-api";
import { API_BASE_URL } from "@/lib/api";
import styles from "@/components/compare/compare-page.module.css";
import nextI18NextConfig from "../../next-i18next.config.js";

/** The PDF export endpoint still validates at four members (see PDF module). */
const PDF_MAX_MEMBERS = 4;

export default function MkcomparePage() {
  const { t } = useTranslation("mk-compare");
  const router = useRouter();
  const { data: session } = useSession();
  const { items, remove } = useCompare();
  const locale = router.locale ?? nextI18NextConfig.i18n.defaultLocale;

  const [result, setResult] = React.useState<CompareResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const [pdfFailed, setPdfFailed] = React.useState(false);
  /*
   * Show only the rows where the cars actually differ. On a phone with six
   * columns and every spec on the page this is the difference between reading
   * a reference table and reading a decision.
   */
  const [diffOnly, setDiffOnly] = React.useState(false);
  const [advisorOpen, setAdvisorOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [weights, setWeights] = React.useState<Record<string, number> | undefined>();
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [shareBusy, setShareBusy] = React.useState(false);
  const [shareFailed, setShareFailed] = React.useState(false);

  const sharedSlug = typeof router.query.set === "string" ? router.query.set : null;

  const members = React.useMemo<CompareMember[]>(
    () => items.map((i) => ({ kind: "LISTING" as const, listingSlug: i.slug })),
    [items],
  );

  React.useEffect(() => {
    // A shared link renders the saved set directly.
    if (sharedSlug) {
      setLoading(true);
      getCompareSet(sharedSlug)
        .then(setResult)
        .catch(() => setResult(null))
        .finally(() => setLoading(false));
      return;
    }
    if (members.length < 2) {
      setResult(null);
      return;
    }
    setLoading(true);
    buildCompare(members, weights)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [members, weights, sharedSlug]);

  const share = async () => {
    if (members.length < 2) return;
    setShareBusy(true);
    setShareFailed(false);
    try {
      const saved = await saveCompareSet(members, weights, session?.accessToken);
      const url = `${window.location.origin}/compare?set=${saved.sharedSlug}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url).catch(() => undefined);
    } catch {
      setShareFailed(true);
    } finally {
      setShareBusy(false);
    }
  };

  // P5-05 compare export — fetch the PDF and open it in a new tab.
  const exportPdf = async () => {
    setPdfBusy(true);
    setPdfFailed(false);
    try {
      const res = await fetch(`${API_BASE_URL}/pdf/compare`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ members }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch {
      setPdfFailed(true);
    } finally {
      setPdfBusy(false);
    }
  };

  // A shared ?set= link must render from the fetched set — the visitor's own
  // compare tray is empty in a fresh browser, so never gate shared views on it.
  const showTable = sharedSlug ? loading || result != null : members.length >= 2;
  const editable = !sharedSlug;
  const pdfTooMany = members.length > PDF_MAX_MEMBERS;

  return (
    <>
      <Head>
        <title>{`${t("meta.title")} — Carsens`}</title>
      </Head>
      <MockupLayout>
        <main id="page-compare" className="page">
          <div className="compare-wrap">
            <div className="container">
              <div className="compare-head">
                <div>
                  <h1>{t("head.title")}</h1>
                  <p>{t("head.sub", { max: COMPARE_MAX })}</p>
                </div>
                {showTable && (
                  <div className="compare-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setAdvisorOpen((v) => !v)}
                      aria-expanded={advisorOpen}
                    >
                      {t("actions.advisor")}
                    </button>
                    {editable && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => void share()}
                        disabled={shareBusy}
                      >
                        {shareBusy ? t("actions.sharing") : t("actions.share")}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => void exportPdf()}
                      disabled={pdfBusy || pdfTooMany}
                      title={pdfTooMany ? t("actions.pdfLimit", { max: PDF_MAX_MEMBERS }) : undefined}
                    >
                      {pdfBusy ? t("actions.exporting") : t("actions.exportPdf")}
                    </button>
                  </div>
                )}
              </div>

              {pdfTooMany && showTable && (
                <p className={styles.notice}>{t("actions.pdfLimit", { max: PDF_MAX_MEMBERS })}</p>
              )}
              {pdfFailed && (
                <p className={styles.notice} role="status">
                  {t("actions.pdfFailed")}
                </p>
              )}
              {weights && (
                <p className={styles.notice}>
                  {t("actions.weighted")}{" "}
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setWeights(undefined)}
                  >
                    {t("actions.resetWeights")}
                  </button>
                </p>
              )}
              {shareUrl && (
                <p className={styles.notice} role="status">
                  {t("actions.shared")}{" "}
                  <span style={{ userSelect: "all" }}>{shareUrl}</span>
                </p>
              )}
              {shareFailed && (
                <p className={styles.notice} role="status">
                  {t("actions.shareFailed")}
                </p>
              )}

              {!showTable ? (
                <div className={styles.empty}>
                  <p>{t("empty.text")}</p>
                  <Link href="/cars" className="btn btn-primary btn-lg">
                    {t("empty.cta")}
                  </Link>
                </div>
              ) : (
                <>
                  {advisorOpen && result && (
                    <AdvisorPanel
                      members={
                        editable
                          ? members
                          : result.columns
                              .filter((c) => c.slug)
                              .map((c) => ({
                                kind: "LISTING" as const,
                                listingSlug: c.slug!,
                              }))
                      }
                      locale={locale}
                      onWeights={(w) => setWeights(w)}
                      onClose={() => setAdvisorOpen(false)}
                    />
                  )}

                  {editable && (
                    <AddCarPanel
                      open={addOpen}
                      onOpenChange={setAddOpen}
                      presentIds={items.map((i) => i.id)}
                      locale={locale}
                    />
                  )}

                  {loading && <p className={styles.notice}>{t("loading")}</p>}

                  {result && (
                    <>
                      <div className="cmp-filter">
                        <label htmlFor="cmp-diff-only">
                          <input
                            id="cmp-diff-only"
                            type="checkbox"
                            checked={diffOnly}
                            onChange={(e) => setDiffOnly(e.target.checked)}
                          />
                          {t("diffOnly")}
                        </label>
                      </div>

                      <CompareTable
                        result={result}
                        locale={locale}
                        onRemove={editable ? remove : undefined}
                        onAdd={() => setAddOpen(true)}
                        showAdd={editable && result.columns.length < COMPARE_MAX}
                        diffOnly={diffOnly}
                      />

                      {result.columns.length > 1 && result.scores.winner >= 0 && (
                        <div className="compare-foot">
                          <div className="ft-text">
                            {t("verdict.title")}{" "}
                            <strong>{result.columns[result.scores.winner]?.title}</strong>
                          </div>
                          <div className="ft-text">
                            {t("verdict.score", {
                              score: result.scores.totals[result.scores.winner] ?? 0,
                            })}
                          </div>
                        </div>
                      )}
                    </>
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
      // "compare" carries the row/group vocabulary the table falls back to when
      // the taxonomy has no locale bag for a field.
      ["common", "mk-compare", "compare"],
      nextI18NextConfig,
    )),
  },
});
