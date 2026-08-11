/**
 * /compare — task P1-10 (Compare v1, FR-CV1/CV2 partial).
 *
 * Columns come from the CompareProvider (localStorage-backed, max 4). Rows are
 * the union of basics + every spec group present in the compared listings'
 * snapshots, so cars with different spec coverage still align. "Differences
 * only" hides rows whose values match across all columns.
 *
 * P2-06 extends this with model-mode, weighted scoring and the guided quiz —
 * the row-building shape here is deliberately data-driven to absorb that.
 */
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import Image from "next/image";
import { Car, Loader2, Scale, X } from "lucide-react";
import { SiteHeader } from "@/components/home/site-header";
import { COMPARE_MAX, useCompare } from "@/components/compare/compare-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getListing, type ListingDetail } from "@/lib/marketplace-api";
import { formatMileage, formatPrice, mediaUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import nextI18NextConfig from "../../next-i18next.config.js";

interface Row {
  key: string;
  label: string;
  values: (string | null)[];
  group: string;
}

export default function ComparePage() {
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";
  const { t } = useTranslation("compare");
  const { items, remove, clear } = useCompare();

  const [details, setDetails] = React.useState<Record<string, ListingDetail>>({});
  const [loading, setLoading] = React.useState(false);
  const [differencesOnly, setDifferencesOnly] = React.useState(false);

  const slugs = items.map((item) => item.slug).join(",");

  React.useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const fetched = await Promise.all(
        items.map((item) => getListing(item.slug).catch(() => null)),
      );
      if (cancelled) return;
      const next: Record<string, ListingDetail> = {};
      fetched.forEach((detail) => {
        if (detail) next[detail.slug] = detail;
      });
      setDetails(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Re-fetch only when the compared set actually changes.
  }, [slugs, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = items
    .map((item) => details[item.slug])
    .filter((detail): detail is ListingDetail => Boolean(detail));

  const rows: Row[] = React.useMemo(() => {
    if (columns.length === 0) return [];

    const basics: Row[] = [
      {
        key: "price",
        label: t("table.price"),
        group: t("table.basics"),
        values: columns.map((c) => formatPrice(c.priceAed, locale)),
      },
      {
        key: "year",
        label: t("table.year"),
        group: t("table.basics"),
        values: columns.map((c) => String(c.year)),
      },
      {
        key: "mileage",
        label: t("table.mileage"),
        group: t("table.basics"),
        values: columns.map((c) => formatMileage(c.mileageKm, locale)),
      },
      {
        key: "fuel",
        label: t("table.fuel"),
        group: t("table.basics"),
        values: columns.map((c) => c.fuelType),
      },
      {
        key: "transmission",
        label: t("table.transmission"),
        group: t("table.basics"),
        values: columns.map((c) => c.transmission),
      },
      {
        key: "regionalSpec",
        label: t("table.regionalSpec"),
        group: t("table.basics"),
        values: columns.map((c) => c.regionalSpec),
      },
      {
        key: "location",
        label: t("table.location"),
        group: t("table.basics"),
        values: columns.map((c) => c.emirate.name),
      },
    ];

    // Union of spec fields across all columns, preserving first-seen order.
    const specRows = new Map<string, Row>();
    columns.forEach((column, columnIndex) => {
      column.specsSnapshot?.groups.forEach((group) => {
        group.fields.forEach((field) => {
          const key = `${group.key}.${field.key}`;
          if (!specRows.has(key)) {
            specRows.set(key, {
              key,
              label: field.name,
              group: group.name,
              values: Array.from({ length: columns.length }, () => null),
            });
          }
          const value = field.unit ? `${field.value} ${field.unit}` : field.value;
          specRows.get(key)!.values[columnIndex] = value;
        });
      });
    });

    return [...basics, ...specRows.values()];
  }, [columns, locale, t]);

  const visibleRows = differencesOnly
    ? rows.filter((row) => new Set(row.values.map((v) => v ?? "")).size > 1)
    : rows;

  const groups = visibleRows.reduce<Record<string, Row[]>>((acc, row) => {
    (acc[row.group] ??= []).push(row);
    return acc;
  }, {});

  return (
    <>
      <Head>
        <title>{t("meta.title")}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <SiteHeader />
      <main className="container-shell py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">{t("heading")}</h1>
            {items.length > 0 ? (
              <p className="mt-1 text-sm text-muted">
                {t("subheading", { count: items.length, max: COMPARE_MAX })}
              </p>
            ) : null}
          </div>
          {items.length > 0 ? (
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-brand)]"
                  checked={differencesOnly}
                  onChange={(e) => setDifferencesOnly(e.target.checked)}
                />
                {t("table.differencesOnly")}
              </label>
              <Button size="sm" variant="outline" onClick={clear}>
                {t("tray.clear")}
              </Button>
            </div>
          ) : null}
        </div>

        {items.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-12 text-center">
            <Scale className="size-8 text-brand-border" aria-hidden />
            <p className="font-bold text-ink">{t("empty.title")}</p>
            <p className="max-w-sm text-sm text-muted">{t("empty.hint")}</p>
            <Button asChild size="sm" variant="secondary" className="mt-2">
              <Link href="/cars">{t("empty.cta")}</Link>
            </Button>
          </Card>
        ) : loading && columns.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {t("loading")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line bg-card">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-40 border-b border-line bg-page p-3 text-start text-xs font-bold text-muted">
                    {" "}
                  </th>
                  {columns.map((column) => {
                    const cover = column.media.find((m) => m.isCover) ?? column.media[0];
                    const title = [column.year, column.make.name, column.model.name, column.trim?.name]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <th
                        key={column.id}
                        className="border-b border-s border-line p-3 align-top text-start"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/cars/${column.slug}`}
                            className="block min-w-0 flex-1 font-bold text-ink hover:text-brand"
                          >
                            <span className="relative mb-2 block aspect-[4/3] w-full overflow-hidden rounded-card bg-brand-surface">
                              {cover?.variants?.card ? (
                                <Image
                                  src={mediaUrl(cover.variants.card)}
                                  alt={title}
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
                            <span className="line-clamp-2 text-sm">{title}</span>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("table.remove")}
                            onClick={() => remove(column.id)}
                          >
                            <X className="size-4" aria-hidden />
                          </Button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groups).map(([groupName, groupRows]) => (
                  <React.Fragment key={groupName}>
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="border-b border-line bg-brand-surface px-3 py-2 text-xs font-bold uppercase tracking-wide text-brand"
                      >
                        {groupName}
                      </td>
                    </tr>
                    {groupRows.map((row) => (
                      <tr key={row.key} className="even:bg-page">
                        <th
                          scope="row"
                          className="border-b border-divider p-3 text-start text-xs font-semibold text-muted"
                        >
                          {row.label}
                        </th>
                        {row.values.map((value, index) => (
                          <td
                            key={`${row.key}-${index}`}
                            className={cn(
                              "border-b border-s border-divider p-3 text-ink",
                              value === null && "text-muted",
                            )}
                          >
                            {value ?? t("table.noValue")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
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
