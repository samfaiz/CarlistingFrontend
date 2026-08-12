/**
 * /account/listings — task P2-05 (FR-U5 my listings, FR-L1 renew).
 *
 * Status filter + pagination over GET /listings/mine, with the lifecycle
 * actions the backend state machine allows for each status. Every action
 * refetches rather than patching local state, so the row can never claim a
 * transition the server refused.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { CarFront, Loader2, Pause, Play, RefreshCw, Tag } from "lucide-react";
import { SiteHeader } from "@/components/home/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import {
  markListingSold,
  myListings,
  pauseListing,
  renewListing,
  resumeListing,
  type ListingDetail,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

const PAGE_SIZE = 10;
const FILTERS = ["ALL", "LIVE", "PENDING_REVIEW", "DRAFT", "PAUSED", "EXPIRED", "REJECTED"] as const;

const STATUS_VARIANT: Record<string, "navy" | "green" | "amber" | "red" | "neutral"> = {
  LIVE: "green",
  PENDING_REVIEW: "amber",
  DRAFT: "neutral",
  PAUSED: "neutral",
  SOLD: "navy",
  EXPIRED: "neutral",
  REJECTED: "red",
};

export default function MyListingsPage() {
  const { t } = useTranslation("account");
  const { t: tListings } = useTranslation("listings");
  const { data: session } = useSession({ required: true });
  const accessToken = session?.accessToken;

  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("ALL");
  const [offset, setOffset] = React.useState(0);
  const [rows, setRows] = React.useState<ListingDetail[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const page = await myListings(accessToken, {
        status: filter === "ALL" ? undefined : filter,
        limit: PAGE_SIZE,
        offset,
      });
      setRows(page.items);
      setTotal(page.total);
    } catch {
      toast({ title: t("listings.errors.load"), variant: "warning" });
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter, offset, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, action: () => Promise<unknown>, successKey: string) => {
    setBusyId(id);
    try {
      await action();
      toast({ title: t(successKey), variant: "success" });
      await load();
    } catch {
      toast({ title: t("listings.errors.action"), variant: "warning" });
    } finally {
      setBusyId(null);
    }
  };

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <Head>
        <title>{t("listings.meta.title")}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <h1 className="text-xl font-extrabold text-ink">{t("listings.heading")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("listings.total", { count: total })}
        </p>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("listings.filterLabel")}>
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "primary" : "outline"}
              aria-pressed={filter === f}
              onClick={() => {
                setFilter(f);
                setOffset(0);
              }}
            >
              {f === "ALL" ? t("listings.filters.all") : tListings(`status.${f}`, { defaultValue: f })}
            </Button>
          ))}
        </div>

        {loading ? (
          <Panel className="mt-4 flex items-center gap-2 p-6 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("listings.loading")}
          </Panel>
        ) : rows.length === 0 ? (
          <Panel className="mt-4 flex flex-col items-center gap-3 p-10 text-center">
            <CarFront className="size-8 text-muted" aria-hidden />
            <p className="text-sm font-bold text-ink">{t("listings.empty.title")}</p>
            <Button asChild>
              <Link href="/sell">{t("listings.empty.cta")}</Link>
            </Button>
          </Panel>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {rows.map((l) => {
              const title = `${l.year} ${l.make.name} ${l.model.name}`;
              const busy = busyId === l.id;
              return (
                <li key={l.id}>
                  <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/cars/${l.slug}`}
                          className="truncate text-sm font-bold text-ink underline-offset-2 hover:underline"
                        >
                          {title}
                        </Link>
                        <Badge variant={STATUS_VARIANT[l.status] ?? "neutral"}>
                          {tListings(`status.${l.status}`, { defaultValue: l.status })}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {formatPrice(l.priceAed, "en")}
                        {l.publishedAt
                          ? ` · ${t("listings.published", {
                              time: formatRelativeTime(l.publishedAt, "en"),
                            })}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {l.status === "LIVE" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void act(l.id, () => pauseListing(l.id, accessToken!), "listings.actions.paused")
                            }
                          >
                            <Pause aria-hidden />
                            {t("listings.actions.pause")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void act(l.id, () => markListingSold(l.id, accessToken!), "listings.actions.markedSold")
                            }
                          >
                            <Tag aria-hidden />
                            {t("listings.actions.sold")}
                          </Button>
                        </>
                      )}
                      {l.status === "PAUSED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void act(l.id, () => resumeListing(l.id, accessToken!), "listings.actions.resumed")
                          }
                        >
                          <Play aria-hidden />
                          {t("listings.actions.resume")}
                        </Button>
                      )}
                      {l.status === "EXPIRED" && (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void act(l.id, () => renewListing(l.id, accessToken!), "listings.actions.renewed")
                          }
                        >
                          <RefreshCw aria-hidden />
                          {t("listings.actions.renew")}
                        </Button>
                      )}
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>
        )}

        {pages > 1 && (
          <nav className="mt-4 flex items-center justify-between" aria-label={t("listings.pagination")}>
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
            >
              {t("listings.prev")}
            </Button>
            <span className="text-xs text-muted">
              {t("listings.pageOf", {
                page: Math.floor(offset / PAGE_SIZE) + 1,
                pages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
            >
              {t("listings.next")}
            </Button>
          </nav>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return {
      redirect: { destination: `${prefix}/login?next=/account/listings`, permanent: false },
    };
  }
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "account", "listings", "home"],
        nextI18NextConfig,
      )),
    },
  };
};
