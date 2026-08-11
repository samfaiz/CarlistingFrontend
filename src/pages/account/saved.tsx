/**
 * /account/saved — task P1-09 (FR-U1 saved cars, FR-S5 saved searches).
 *
 * Two tabs over the /saved/* endpoints. Protection mirrors /account: SSR
 * getServerSession redirect (works without JS) + client useSession(required).
 * Alert frequency is display-only here — PATCH lands with the P2-04 dispatcher.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { BellRing, Heart, Loader2, Search, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/home/site-header";
import { SavedCarCard } from "@/components/saved/saved-car-card";
import { summarizeSavedSearchQuery } from "@/components/saved/search-summary";
import { useSaved } from "@/components/saved/saved-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import {
  deleteSavedSearch,
  getMakes,
  getSavedCars,
  getSavedSearches,
  getTaxonomyMeta,
  type SavedCar,
  type SavedSearch,
  type TaxonomyMake,
  type TaxonomyMeta,
} from "@/lib/marketplace-api";
import { formatRelativeTime } from "@/lib/format";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 p-10 text-center">
      <div className="text-brand-border">{icon}</div>
      <p className="font-bold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-muted">{hint}</p>
      {action}
    </Card>
  );
}

export default function SavedPage() {
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";
  const { t } = useTranslation("saved");
  const { t: tListings } = useTranslation("listings");
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      void router.replace("/login?next=/account/saved");
    },
  });
  const token = session?.accessToken;
  // Unsaving goes through the provider so the hearts elsewhere stay in sync.
  const { toggle } = useSaved();

  const [cars, setCars] = React.useState<SavedCar[] | null>(null);
  const [searches, setSearches] = React.useState<SavedSearch[] | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<SavedSearch | null>(null);
  // Taxonomy powers the human-readable filter summary on each saved search.
  const [makes, setMakes] = React.useState<TaxonomyMake[]>([]);
  const [meta, setMeta] = React.useState<TaxonomyMeta | null>(null);

  React.useEffect(() => {
    void Promise.all([getMakes().catch(() => []), getTaxonomyMeta().catch(() => null)]).then(
      ([makeRows, metaRow]) => {
        setMakes(makeRows);
        setMeta(metaRow);
      },
    );
  }, []);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      const [carRows, searchRows] = await Promise.all([
        getSavedCars(token).catch(() => [] as SavedCar[]),
        getSavedSearches(token).catch(() => [] as SavedSearch[]),
      ]);
      if (cancelled) return;
      setCars(carRows);
      setSearches(searchRows);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleUnsave = async (listingId: string) => {
    const previous = cars;
    setCars((rows) => rows?.filter((row) => row.listing.id !== listingId) ?? rows);
    const ok = await toggle(listingId);
    if (ok) toast({ title: t("cars.removed"), variant: "success" });
    else setCars(previous ?? null); // provider rolled back — restore the row
  };

  const handleDeleteSearch = async () => {
    if (!token || !pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    setSearches((rows) => rows?.filter((row) => row.id !== target.id) ?? rows);
    try {
      await deleteSavedSearch(target.id, token);
      toast({ title: t("searches.deleted"), variant: "success" });
    } catch {
      const rows = await getSavedSearches(token).catch(() => null);
      if (rows) setSearches(rows);
    }
  };

  const loading = status === "loading" || cars === null || searches === null;

  return (
    <>
      <Head>
        <title>{t("meta.title")}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <SiteHeader />
      <main className="container-shell py-8">
        <h1 className="mb-6 text-2xl font-extrabold text-ink">{t("heading")}</h1>

        <Tabs defaultValue="cars">
          <TabsList>
            <TabsTrigger value="cars">{t("tabs.cars")}</TabsTrigger>
            <TabsTrigger value="searches">{t("tabs.searches")}</TabsTrigger>
          </TabsList>

          <TabsContent value="cars">
            {loading ? (
              <div className="flex justify-center py-12 text-muted">
                <Loader2 className="size-6 animate-spin" aria-hidden />
              </div>
            ) : cars.length === 0 ? (
              <EmptyState
                icon={<Heart className="size-8" aria-hidden />}
                title={t("cars.empty.title")}
                hint={t("cars.empty.hint")}
                action={
                  <Button asChild size="sm" variant="secondary" className="mt-2">
                    <Link href="/cars">{t("cars.browse")}</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cars.map((saved) => (
                  <SavedCarCard
                    key={saved.listing.id}
                    saved={saved}
                    onUnsave={(id) => void handleUnsave(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="searches">
            {loading ? (
              <div className="flex justify-center py-12 text-muted">
                <Loader2 className="size-6 animate-spin" aria-hidden />
              </div>
            ) : searches.length === 0 ? (
              <EmptyState
                icon={<Search className="size-8" aria-hidden />}
                title={t("searches.empty.title")}
                hint={t("searches.empty.hint")}
                action={
                  <Button asChild size="sm" variant="secondary" className="mt-2">
                    <Link href="/cars">{t("cars.browse")}</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {searches.map((search) => {
                  const query = new URLSearchParams(
                    Object.entries(search.query).map(([k, v]) => [k, String(v)]),
                  ).toString();
                  return (
                    <li key={search.id}>
                      <Panel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink">{search.name}</p>
                          <p className="mt-0.5 truncate text-sm text-muted">
                            {summarizeSavedSearchQuery(search.query, {
                              t,
                              tListings,
                              locale,
                              makes,
                              meta,
                            })}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {t("searches.createdAt", {
                              when: formatRelativeTime(search.createdAt, locale),
                            })}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant="neutral"
                            className="gap-1"
                            title={t("searches.frequency.comingSoon")}
                          >
                            <BellRing className="size-3" aria-hidden />
                            {t(`searches.frequency.${search.frequency}`)}
                          </Badge>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/cars?${query}`}>{t("searches.open")}</Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("searches.delete")}
                            onClick={() => setPendingDelete(search)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </div>
                      </Panel>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("searches.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("searches.deleteBody", { name: pendingDelete?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("searches.cancel")}</Button>
            </DialogClose>
            <Button variant="danger" onClick={() => void handleDeleteSearch()}>
              {t("searches.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return { redirect: { destination: `${prefix}/login?next=/account/saved`, permanent: false } };
  }
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "saved", "listings", "home"], nextI18NextConfig)),
    },
  };
};
