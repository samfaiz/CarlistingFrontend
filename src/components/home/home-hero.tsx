/**
 * Home hero (P1-08): headline, big keyword search (submits to /cars?q=) and
 * quick body-type chips (taxonomy meta -> /cars?bodyTypeId=). Navy brand
 * background straight from the mockup's hero treatment.
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaxonomyTerm } from "@/lib/marketplace-api";

export interface HomeHeroProps {
  /** Body types from /taxonomy/meta — chips are hidden until they arrive. */
  bodyTypes: TaxonomyTerm[];
}

export function HomeHero({ bodyTypes }: HomeHeroProps) {
  const { t } = useTranslation("home");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";
  const [q, setQ] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = q.trim();
    void router.push({
      pathname: "/cars",
      query: keyword ? { q: keyword } : {},
    });
  };

  return (
    <section className="bg-brand">
      <div className="container-shell flex flex-col items-center gap-6 py-12 text-center sm:py-16">
        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          {t("hero.headline")}
        </h1>
        <p className="max-w-xl text-sm text-white/80 sm:text-base">{t("hero.sub")}</p>

        <form
          role="search"
          aria-label={t("hero.searchLabel")}
          onSubmit={handleSubmit}
          className="flex w-full max-w-2xl items-center gap-2 rounded-panel bg-card p-2 shadow-pop"
        >
          <label htmlFor="home-search" className="sr-only">
            {t("hero.searchLabel")}
          </label>
          <Input
            id="home-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("hero.searchPlaceholder")}
            className="border-0 focus:ring-0"
          />
          <Button type="submit" className="shrink-0">
            <Search aria-hidden />
            <span className="hidden sm:inline">{t("hero.searchButton")}</span>
            <span className="sr-only sm:hidden">{t("hero.searchButton")}</span>
          </Button>
        </form>

        {bodyTypes.length > 0 && (
          <nav
            aria-label={t("hero.chipsLabel")}
            className="flex flex-wrap justify-center gap-2"
          >
            {bodyTypes.map((bodyType) => (
              <Link
                key={bodyType.id}
                href={{ pathname: "/cars", query: { bodyTypeId: bodyType.id } }}
                className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                {bodyType.i18n?.[locale] ?? bodyType.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
