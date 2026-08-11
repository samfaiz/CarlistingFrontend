/**
 * SEO landing routes — task P1-06 (PRD §3.2, FR-I4, §13.1).
 *
 * URL scheme (optional catch-all, documented + unambiguous):
 *   /used-cars                          -> hub (directory of makes + emirates)
 *   /used-cars/{makeSlug}               -> make landing   (e.g. /used-cars/toyota)
 *   /used-cars/{makeSlug}/{modelSlug}   -> model landing  (e.g. /used-cars/toyota/land-cruiser)
 *   /used-cars/emirate/{emirateSlug}    -> emirate landing (e.g. /used-cars/emirate/dubai)
 *   anything else                       -> 404
 *
 * "emirate" is a RESERVED first segment: emirate landings live under it so a
 * make slug can never collide with an emirate slug (taxonomy must never mint a
 * make slugged "emirate"). Slugs resolve against the live taxonomy — unknown
 * slugs 404. Mixed-case URLs 301 to their lower-case canonical form, and the
 * src/lib/redirects.ts table (renamed/merged slugs) is checked first, also as
 * a 301 (§13.1 canonical discipline).
 *
 * Every landing renders: localized H1, intro copy block (static t() template
 * with live counts interpolated), the newest-listings grid, a "view all in
 * search" link into /cars?…Id=…, sibling interlinks (models / makes /
 * emirates) and the canonical + hreflang cluster via <SeoHead>. ItemList +
 * BreadcrumbList JSON-LD per P1-12.
 */
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { SiteHeader } from "@/components/home/site-header";
import { ListingGrid } from "@/components/listing/listing-grid";
import {
  BreadcrumbJsonLd,
  ItemListJsonLd,
  type BreadcrumbItem,
} from "@/components/seo/json-ld";
import { SeoHead } from "@/components/seo/seo-head";
import { localizedPath } from "@/components/seo/site-url";
import { Button } from "@/components/ui/button";
import { findRedirect } from "@/lib/redirects";
import {
  getMakes,
  getModels,
  getTaxonomyMeta,
  searchListings,
  type Card,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */

interface TermLink {
  slug: string;
  name: string;
  i18n?: Record<string, string> | null;
}

type LandingScope =
  | { kind: "hub" }
  | { kind: "make"; makeId: string; make: TermLink }
  | { kind: "model"; makeId: string; modelId: string; make: TermLink; model: TermLink }
  | { kind: "emirate"; emirateId: string; emirate: TermLink };

interface UsedCarsLandingProps {
  scope: LandingScope;
  items: Card[];
  total: number;
  /** All CAR makes (hub directory + sibling interlinks). */
  makes: TermLink[];
  /** Models of the scoped make (make/model scopes only). */
  models: TermLink[];
  /** All emirates (hub directory + interlinks). */
  emirates: TermLink[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Un-localized site path of a scope (canonical/breadcrumb/link building). */
function scopePath(scope: LandingScope): string {
  switch (scope.kind) {
    case "hub":
      return "/used-cars";
    case "make":
      return `/used-cars/${scope.make.slug}`;
    case "model":
      return `/used-cars/${scope.make.slug}/${scope.model.slug}`;
    case "emirate":
      return `/used-cars/emirate/${scope.emirate.slug}`;
  }
}

/** /cars search URL (object form keeps next/link locale handling). */
function scopeSearchHref(scope: LandingScope) {
  switch (scope.kind) {
    case "hub":
      return { pathname: "/cars" };
    case "make":
      return { pathname: "/cars", query: { makeId: scope.makeId } };
    case "model":
      return {
        pathname: "/cars",
        query: { makeId: scope.makeId, modelId: scope.modelId },
      };
    case "emirate":
      return { pathname: "/cars", query: { emirateId: scope.emirateId } };
  }
}

function termName(term: TermLink, locale: string): string {
  return term.i18n?.[locale] ?? term.name;
}

/** Chip-style interlink list (sibling models / makes / emirates). */
function LinkChips({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-base font-bold text-ink">{heading}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-block rounded-full border border-line bg-card px-3 py-1 text-sm text-muted-strong transition-colors hover:border-brand hover:text-brand focus-visible:outline-2"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function UsedCarsLandingPage({
  scope,
  items,
  total,
  makes,
  models,
  emirates,
}: UsedCarsLandingProps) {
  const { t } = useTranslation("seo");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const formatted = new Intl.NumberFormat(`${locale}-u-nu-latn`).format(total);
  const vars: Record<string, string | number> = { formatted };
  if (scope.kind === "make" || scope.kind === "model") vars.make = scope.make.name;
  if (scope.kind === "model") vars.model = scope.model.name;
  if (scope.kind === "emirate") vars.emirate = termName(scope.emirate, locale);

  const path = scopePath(scope);
  const title = t(`${scope.kind}.title`, vars);
  const description = t(`${scope.kind}.description`, vars);
  const h1 = t(`${scope.kind}.h1`, vars);
  const intro = t(`${scope.kind}.intro`, { ...vars, count: total });

  /* Breadcrumbs: visible trail + BreadcrumbList JSON-LD from the same data. */
  const crumbs: BreadcrumbItem[] = [
    { name: t("breadcrumb.home"), path: "/" },
    ...(scope.kind === "hub"
      ? [{ name: t("breadcrumb.usedCars") }]
      : [{ name: t("breadcrumb.usedCars"), path: "/used-cars" }]),
  ];
  if (scope.kind === "make") crumbs.push({ name: scope.make.name });
  if (scope.kind === "model") {
    crumbs.push(
      { name: scope.make.name, path: `/used-cars/${scope.make.slug}` },
      { name: scope.model.name },
    );
  }
  if (scope.kind === "emirate")
    crumbs.push({ name: termName(scope.emirate, locale) });

  /* Interlinks per scope (sibling models / makes / emirates). */
  const makeLinks = (exceptSlug?: string) =>
    makes
      .filter((m) => m.slug !== exceptSlug)
      .map((m) => ({ href: `/used-cars/${m.slug}`, label: m.name }));
  const emirateLinks = emirates.map((e) => ({
    href: `/used-cars/emirate/${e.slug}`,
    label: termName(e, locale),
  }));
  const modelLinks = (makeSlug: string, exceptSlug?: string) =>
    models
      .filter((m) => m.slug !== exceptSlug)
      .map((m) => ({ href: `/used-cars/${makeSlug}/${m.slug}`, label: m.name }));

  return (
    <>
      <SeoHead title={title} description={description} path={path} />
      <BreadcrumbJsonLd items={crumbs} />
      <ItemListJsonLd items={items} />

      <SiteHeader />

      <main className="container-shell py-6">
        <nav aria-label={t("breadcrumb.home")} className="text-xs text-muted">
          <ol className="flex flex-wrap items-center gap-1">
            {crumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden>/</span>}
                {crumb.path ? (
                  <Link href={crumb.path} className="hover:text-brand hover:underline">
                    {crumb.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-muted-strong">
                    {crumb.name}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <h1 className="mt-3 text-xl font-extrabold text-ink sm:text-2xl">{h1}</h1>

        {/*
         * Intro copy block — static t() template with live counts interpolated.
         * TODO(P4-05): replace with the CMS-editable content block (plan P1-06
         * notes the minimal block editor; full CMS arrives P4). Keep this
         * <section> as the mount point so the swap is contained.
         */}
        <section className="mt-2 max-w-3xl text-sm leading-6 text-muted-strong">
          <p>{intro}</p>
        </section>

        <section className="mt-6" aria-label={t("newest")}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">{t("newest")}</h2>
            <Button asChild variant="outline" size="sm">
              <Link href={scopeSearchHref(scope)}>
                {t("viewAll", { formatted })}
              </Link>
            </Button>
          </div>
          <div data-testid="landing-results">
            <ListingGrid listings={items} skeletonCount={12} />
          </div>
        </section>

        {scope.kind === "hub" && (
          <>
            <LinkChips heading={t("links.makes")} links={makeLinks()} />
            <LinkChips heading={t("links.emirates")} links={emirateLinks} />
          </>
        )}
        {scope.kind === "make" && (
          <>
            <LinkChips
              heading={t("links.modelsOf", { make: scope.make.name })}
              links={modelLinks(scope.make.slug)}
            />
            <LinkChips
              heading={t("links.otherMakes")}
              links={makeLinks(scope.make.slug)}
            />
            <LinkChips heading={t("links.emirates")} links={emirateLinks} />
          </>
        )}
        {scope.kind === "model" && (
          <>
            <LinkChips
              heading={t("links.modelsOf", { make: scope.make.name })}
              links={modelLinks(scope.make.slug, scope.model.slug)}
            />
            <LinkChips heading={t("links.emirates")} links={emirateLinks} />
          </>
        )}
        {scope.kind === "emirate" && (
          <>
            <LinkChips
              heading={t("links.emirates")}
              links={emirateLinks.filter(
                (l) => l.href !== `/used-cars/emirate/${scope.emirate.slug}`,
              )}
            />
            <LinkChips heading={t("links.makes")} links={makeLinks()} />
          </>
        )}
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Server side                                                        */
/* ------------------------------------------------------------------ */

const LANDING_GRID_SIZE = 12;

export const getServerSideProps: GetServerSideProps<UsedCarsLandingProps> = async ({
  params,
  locale,
  defaultLocale,
}) => {
  const currentLocale =
    locale ?? defaultLocale ?? nextI18NextConfig.i18n.defaultLocale;
  const segments = Array.isArray(params?.segments)
    ? params.segments.map((s) => s)
    : [];
  const path = `/used-cars${segments.length ? `/${segments.join("/")}` : ""}`;

  // 1) Redirect table (renamed/merged slugs) — real 301 (not 308), locale kept.
  const destination = findRedirect(path);
  if (destination) {
    return {
      redirect: {
        destination: localizedPath(destination, currentLocale),
        statusCode: 301,
      },
    };
  }

  // 2) Canonical discipline: mixed-case URLs 301 to the lower-case form.
  if (path !== path.toLowerCase()) {
    return {
      redirect: {
        destination: localizedPath(path.toLowerCase(), currentLocale),
        statusCode: 301,
      },
    };
  }

  if (segments.length > 2) return { notFound: true };

  // 3) Resolve slugs against live taxonomy (unknown -> 404).
  const [allMakes, meta] = await Promise.all([getMakes("CAR"), getTaxonomyMeta()]);
  const makes: TermLink[] = allMakes.map((m) => ({ slug: m.slug, name: m.name }));
  const emirates: TermLink[] = meta.emirates.map((e) => ({
    slug: e.slug,
    name: e.name,
    i18n: e.i18n ?? null,
  }));

  let scope: LandingScope;
  let models: TermLink[] = [];
  let searchScope: { makeId?: string; modelId?: string; emirateId?: string } = {};

  if (segments.length === 0) {
    scope = { kind: "hub" };
  } else if (segments[0] === "emirate") {
    if (segments.length !== 2) return { notFound: true };
    const emirate = meta.emirates.find((e) => e.slug === segments[1]);
    if (!emirate) return { notFound: true };
    scope = {
      kind: "emirate",
      emirateId: emirate.id,
      emirate: { slug: emirate.slug, name: emirate.name, i18n: emirate.i18n ?? null },
    };
    searchScope = { emirateId: emirate.id };
  } else {
    const make = allMakes.find((m) => m.slug === segments[0]);
    if (!make) return { notFound: true };
    const makeModels = await getModels(make.id).catch(() => []);
    models = makeModels.map((m) => ({ slug: m.slug, name: m.name }));

    if (segments.length === 2) {
      const model = makeModels.find((m) => m.slug === segments[1]);
      if (!model) return { notFound: true };
      scope = {
        kind: "model",
        makeId: make.id,
        modelId: model.id,
        make: { slug: make.slug, name: make.name },
        model: { slug: model.slug, name: model.name },
      };
      searchScope = { makeId: make.id, modelId: model.id };
    } else {
      scope = {
        kind: "make",
        makeId: make.id,
        make: { slug: make.slug, name: make.name },
      };
      searchScope = { makeId: make.id };
    }
  }

  // 4) Newest listings for the scope (degrades to an empty grid on failure —
  //    the landing shell + interlinks are the SEO payload and still render).
  const search = await searchListings({
    vehicleType: "CAR",
    sort: "newest",
    limit: LANDING_GRID_SIZE,
    ...searchScope,
  }).catch(() => null);

  return {
    props: {
      ...(await serverSideTranslations(
        currentLocale,
        ["common", "home", "listings", "seo"],
        nextI18NextConfig,
      )),
      scope,
      items: search?.items ?? [],
      total: search?.total ?? 0,
      makes,
      models,
      emirates,
    },
  };
};
