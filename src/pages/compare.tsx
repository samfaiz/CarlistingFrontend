/**
 * /compare — Compare v2 (task P2-06, FR-CV1–CV4, CV6).
 *
 * The table is built by the backend (POST /compare/build): aligned rows,
 * per-row winners and the weighted score all come from one place, so the quiz
 * suggestions and this table can never disagree about who wins.
 *
 * Columns come from the CompareProvider (localStorage, max 4) — unless the URL
 * carries ?set=<slug>, in which case a shared compare is loaded instead and the
 * local tray is left alone.
 */
import type { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { Car, Link2, Loader2, Scale, Share2, Sparkles, Trophy, X } from "lucide-react";
import { SiteHeader } from "@/components/home/site-header";
import { COMPARE_MAX, useCompare } from "@/components/compare/compare-provider";
import { QuizDialog } from "@/components/compare/quiz-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { formatPrice, mediaUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  buildCompare,
  getCompareSet,
  getListing,
  saveCompareSet,
  type CompareMember,
  type CompareResult,
  type QuizResponse,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function ComparePage() {
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";
  const { t } = useTranslation("compare");
  const { items, remove, clear, toggle } = useCompare();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const sharedSlug = typeof router.query.set === "string" ? router.query.set : null;

  const [result, setResult] = React.useState<CompareResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [differencesOnly, setDifferencesOnly] = React.useState(false);
  const [weights, setWeights] = React.useState<Record<string, number> | undefined>();
  const [quizOpen, setQuizOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<QuizResponse["suggestions"]>([]);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);

  const memberKey = items.map((i) => i.slug).join(",");

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      setError(null);
      if (sharedSlug) {
        setLoading(true);
        try {
          const shared = await getCompareSet(sharedSlug);
          if (!cancelled) {
            setResult(shared);
            setWeights(shared.scores.weights);
          }
        } catch {
          if (!cancelled) setError(t("errors.sharedMissing"));
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      if (items.length < 2) {
        setResult(null);
        return;
      }

      setLoading(true);
      try {
        const members: CompareMember[] = items.map((i) => ({
          kind: "LISTING",
          listingSlug: i.slug,
        }));
        const built = await buildCompare(members, weights);
        if (!cancelled) setResult(built);
      } catch {
        if (!cancelled) setError(t("errors.buildFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [memberKey, sharedSlug, weights, items, t]);

  /**
   * Suggestions arrive as slug + title only; the tray entry needs the full card
   * shape, so fetch the listing before adding rather than storing a stub that
   * would render an empty chip.
   */
  const addSuggestion = async (slug: string) => {
    try {
      const listing = await getListing(slug);
      toggle({
        id: listing.id,
        slug: listing.slug,
        title: `${listing.year} ${listing.make.name} ${listing.model.name}`,
        year: listing.year,
        priceAed: listing.priceAed,
        thumb: listing.media[0]?.variants?.thumb ?? null,
      });
    } catch {
      toast({ title: t("errors.addFailed"), variant: "warning" });
    }
  };

  const applyQuiz = (quiz: QuizResponse) => {
    setWeights(quiz.weights);
    setSuggestions(quiz.suggestions);
    toast({ title: t("quiz.applied"), variant: "success" });
  };

  const share = async () => {
    if (!result) return;
    try {
      const members: CompareMember[] = result.columns.map((c) =>
        c.kind === "LISTING"
          ? { kind: "LISTING", listingSlug: c.slug! }
          : { kind: "MODEL", trimId: c.trimId!, year: c.year },
      );
      const saved = await saveCompareSet(members, weights, accessToken);
      const url = `${window.location.origin}/compare?set=${saved.sharedSlug}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url).catch(() => undefined);
      toast({ title: t("share.copied"), variant: "success" });
    } catch {
      toast({ title: t("share.failed"), variant: "warning" });
    }
  };

  const rows = result?.rows ?? [];
  const visibleRows = differencesOnly ? rows.filter((r) => !r.identical) : rows;
  const grouped = visibleRows.reduce<Record<string, typeof rows>>((acc, row) => {
    (acc[row.group] ??= []).push(row);
    return acc;
  }, {});

  const columnCount = result?.columns.length ?? 0;
  const empty = !sharedSlug && items.length < 2;

  return (
    <>
      <Head>
        <title>{t("meta.title")}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <SiteHeader />

      <main className="container-shell py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">{t("heading")}</h1>
            <p className="mt-1 text-sm text-muted">
              {sharedSlug
                ? t("sharedNotice")
                : t("subheading", { count: items.length, max: COMPARE_MAX })}
            </p>
          </div>

          {result && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-brand)]"
                  checked={differencesOnly}
                  onChange={(e) => setDifferencesOnly(e.target.checked)}
                />
                {t("table.differencesOnly")}
              </label>
              <Button size="sm" variant="outline" onClick={() => setQuizOpen(true)}>
                <Sparkles aria-hidden />
                {t("quiz.open")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => void share()}>
                <Share2 aria-hidden />
                {t("share.button")}
              </Button>
              {!sharedSlug && (
                <Button size="sm" variant="ghost" onClick={clear}>
                  {t("tray.clear")}
                </Button>
              )}
            </div>
          )}
        </div>

        {shareUrl && (
          <p className="mb-4 flex items-center gap-2 rounded-card border border-line bg-page p-3 text-xs text-muted">
            <Link2 className="size-4 shrink-0 text-brand-mid" aria-hidden />
            <span className="truncate">{shareUrl}</span>
          </p>
        )}

        {empty ? (
          <Card className="flex flex-col items-center gap-2 p-12 text-center">
            <Scale className="size-8 text-brand-border" aria-hidden />
            <p className="font-bold text-ink">{t("empty.title")}</p>
            <p className="max-w-sm text-sm text-muted">{t("empty.hint")}</p>
            <Button asChild size="sm" variant="secondary" className="mt-2">
              <Link href="/cars">{t("empty.cta")}</Link>
            </Button>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center text-sm text-muted">{error}</Card>
        ) : loading && !result ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {t("loading")}
          </div>
        ) : result ? (
          <>
            {/* Weighted score — the "winner" is personal once the quiz has run. */}
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.columns.map((column, index) => {
                const total = result.scores.totals[index];
                const isWinner = result.scores.winner === index;
                return (
                  <Card
                    key={column.key}
                    className={cn("p-4", isWinner && "border-brand-border bg-brand-surface")}
                  >
                    <p className="flex items-center justify-between gap-2 text-xs text-muted">
                      {t("score.label")}
                      {isWinner && (
                        <Badge variant="green">
                          <Trophy className="size-3" aria-hidden />
                          {t("score.best")}
                        </Badge>
                      )}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-brand">
                      {total === null ? "—" : `${total}`}
                      <span className="text-sm font-semibold text-muted">/100</span>
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted">{column.title}</p>
                  </Card>
                );
              })}
            </div>

            <p className="mb-4 text-xs text-muted">
              {weights ? t("score.personalised") : t("score.defaultWeights")}
            </p>

            {suggestions.length > 0 && (
              <Card className="mb-4 p-4">
                <p className="text-sm font-bold text-ink">{t("quiz.suggestionsTitle")}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <li key={s.slug}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void addSuggestion(s.slug)}
                      >
                        {s.title} · {s.score}
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="overflow-x-auto rounded-card border border-line bg-card">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-40 border-b border-line bg-page p-3 text-start text-xs font-bold text-muted">
                      <span className="sr-only">{t("table.rowHeader")}</span>
                    </th>
                    {result.columns.map((column) => (
                      <th
                        key={column.key}
                        className="border-b border-s border-line p-3 align-top text-start"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="relative mb-2 block aspect-[4/3] w-full overflow-hidden rounded-card bg-brand-surface">
                              {column.coverKey ? (
                                <Image
                                  src={mediaUrl(column.coverKey)}
                                  alt=""
                                  fill
                                  sizes="200px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center text-brand-border">
                                  <Car className="size-8" aria-hidden />
                                </span>
                              )}
                            </span>
                            {column.slug ? (
                              <Link
                                href={`/cars/${column.slug}`}
                                className="line-clamp-2 text-sm font-bold text-ink hover:text-brand"
                              >
                                {column.title}
                              </Link>
                            ) : (
                              <span className="line-clamp-2 text-sm font-bold text-ink">
                                {column.title}
                              </span>
                            )}
                            {column.kind === "MODEL" && (
                              <span className="mt-1 block text-[11px] font-normal text-muted">
                                {t("table.modelColumn", { count: column.liveCount ?? 0 })}
                              </span>
                            )}
                          </div>
                          {!sharedSlug && column.listingId && (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={t("table.remove")}
                              onClick={() => remove(column.listingId!)}
                            >
                              <X className="size-4" aria-hidden />
                            </Button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([groupKey, groupRows]) => (
                    <React.Fragment key={groupKey}>
                      <tr>
                        <td
                          colSpan={columnCount + 1}
                          className="border-b border-line bg-brand-surface px-3 py-2 text-xs font-bold uppercase tracking-wide text-brand"
                        >
                          {t(`groups.${groupKey}`, { defaultValue: groupKey })}
                        </td>
                      </tr>
                      {groupRows.map((row) => (
                        <tr key={`${groupKey}-${row.key}`} className="even:bg-page">
                          <th
                            scope="row"
                            className="border-b border-divider p-3 text-start text-xs font-semibold text-muted"
                          >
                            {t(`rows.${row.key}`, { defaultValue: row.label })}
                          </th>
                          {row.values.map((value, index) => {
                            const isWinner = row.winners.includes(index);
                            const display =
                              row.key === "price" && value
                                ? formatPrice(Number(value), locale)
                                : value && row.unit
                                  ? `${value} ${row.unit}`
                                  : value;
                            return (
                              <td
                                key={`${row.key}-${index}`}
                                className={cn(
                                  "border-b border-s border-divider p-3 text-ink",
                                  value === null && "text-muted",
                                  isWinner && "bg-success-soft font-bold text-success-strong",
                                )}
                              >
                                {display ?? t("table.noValue")}
                                {isWinner && (
                                  <span className="sr-only"> — {t("table.winner")}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </main>

      <QuizDialog
        open={quizOpen}
        onOpenChange={setQuizOpen}
        onComplete={applyQuiz}
        accessToken={accessToken}
      />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "compare", "listings", "home"],
      nextI18NextConfig,
    )),
  },
});
