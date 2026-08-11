/**
 * "Browse by make" grid (P1-08) — top makes from the facets of an empty
 * search, each linking to /cars?makeId=… (logo-less by design; Teoalida logo
 * assets are a later concern).
 */
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Card } from "@/components/ui/card";
import type { FacetCount } from "@/lib/marketplace-api";

const MAX_MAKES = 12;

export interface BrowseByMakeProps {
  makes: FacetCount[];
}

export function BrowseByMake({ makes }: BrowseByMakeProps) {
  const { t } = useTranslation("home");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";
  // FR-I5: Western digits in every locale (grouping separators still localize).
  const formatCount = (n: number) =>
    new Intl.NumberFormat(`${locale}-u-nu-latn`).format(n);

  if (makes.length === 0) return null;

  return (
    <section aria-labelledby="browse-makes-heading" className="container-shell pb-10">
      <h2
        id="browse-makes-heading"
        className="mb-4 text-xl font-bold text-ink sm:text-2xl"
      >
        {t("makes.heading")}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {makes.slice(0, MAX_MAKES).map((make) => (
          <Link
            key={make.id}
            href={{ pathname: "/cars", query: { makeId: make.id } }}
            className="group block rounded-card focus-visible:outline-2"
          >
            <Card className="flex h-full flex-col gap-0.5 p-4 transition-shadow group-hover:shadow-card">
              <span className="font-bold text-ink transition-colors group-hover:text-brand">
                {make.name}
              </span>
              <span className="text-xs text-muted">
                {t("makes.count", {
                  count: make.count,
                  formatted: formatCount(make.count),
                })}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
