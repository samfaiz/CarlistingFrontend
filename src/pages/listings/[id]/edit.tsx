/**
 * /listings/[id]/edit — change a listing after it was created.
 *
 * `PATCH /listings/:id` shipped in P1 and had ZERO frontend callers: a seller
 * who mistyped a price or wanted to drop it had to pause the ad and start
 * again, which then tripped the duplicate-photo and duplicate-VIN checks on
 * submit. This is that route's first caller.
 *
 * Reached from both /account/listings (private seller) and /dealer/inventory
 * (dealership member). The backend's `ownedListing` gate already accepts
 * either, so there is deliberately no ownership check here.
 *
 * ABOUT THE `[id]` SEGMENT: the backend has no owner-scoped `GET /listings/:id`
 * — `GET /listings/:slug` is the only single-listing read — so the segment
 * carries the listing SLUG. A link that passes the raw id still resolves (see
 * `loadOwnedListing`), and `?slug=` is honoured as a hint.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { SiteHeader } from "@/components/home/site-header";
import { loadOwnedListing, type OwnedListing } from "@/components/listing-manage/api";
import { ListingEditForm } from "@/components/listing-manage/edit-form";
import { ManageMessage, ManageShell } from "@/components/listing-manage/manage-shell";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../../next-i18next.config.js";

export default function EditListingPage() {
  const { t } = useTranslation("account");
  const router = useRouter();
  const { data: session } = useSession({ required: true });
  const accessToken = session?.accessToken;

  const param = typeof router.query.id === "string" ? router.query.id : null;
  const slugHint = typeof router.query.slug === "string" ? router.query.slug : undefined;

  const [listing, setListing] = React.useState<OwnedListing | null>(null);
  const [descriptionsLoaded, setDescriptionsLoaded] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!param || !accessToken) return;
    let alive = true;
    setLoading(true);
    loadOwnedListing(param, accessToken, slugHint)
      .then((loaded) => {
        if (!alive) return;
        setListing(loaded.listing);
        setDescriptionsLoaded(loaded.descriptionsLoaded);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof ApiError ? err.message : t("manage.errors.load"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [accessToken, param, slugHint, t]);

  return (
    <>
      <Head>
        <title>{t("manage.meta.editTitle")}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <SiteHeader />
      <main>
        {loading ? (
          <ManageMessage title={t("manage.loading")} />
        ) : !listing ? (
          <ManageMessage title={t("manage.notFound.title")} body={error ?? t("manage.notFound.body")}>
            <Button asChild variant="outline">
              <Link href="/account/listings">{t("manage.back")}</Link>
            </Button>
          </ManageMessage>
        ) : (
          <ManageShell listing={listing} routeParam={param ?? listing.slug} current="details">
            {!accessToken ? (
              <Panel className="flex items-center gap-2 p-6 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("manage.loading")}
              </Panel>
            ) : (
              <ListingEditForm
                listing={listing}
                descriptionsLoaded={descriptionsLoaded}
                accessToken={accessToken}
                locale={router.locale ?? nextI18NextConfig.i18n.defaultLocale}
                onSaved={(updated) =>
                  setListing((prev) => (prev ? { ...prev, ...updated } : updated))
                }
              />
            )}
          </ManageShell>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  const id = typeof ctx.params?.id === "string" ? ctx.params.id : "";
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return {
      redirect: {
        destination: `${prefix}/login?next=${encodeURIComponent(`/listings/${id}/edit`)}`,
        permanent: false,
      },
    };
  }
  return {
    props: {
      // `listings` supplies the status/enum labels the shell and form reuse;
      // `home` is what SiteHeader reads. Omitting either renders raw keys.
      ...(await serverSideTranslations(
        locale,
        ["common", "account", "listings", "home"],
        nextI18NextConfig,
      )),
    },
  };
};
