/**
 * /listings/[id]/photos — the photo manager for an existing listing.
 *
 * The uploader used to exist only inside the /sell wizard, alive for exactly
 * as long as the wizard's in-memory state. Reload the page — or take the
 * wizard's own "Skip for now — finish from My Account" exit — and the draft
 * could never be given photos again, so it could never be submitted. That link
 * promised a screen the product did not have. This is it.
 *
 * Same `[id]` note as the edit route: the segment carries the listing slug,
 * because the backend has no owner-scoped `GET /listings/:id`.
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
import { ManageMessage, ManageShell } from "@/components/listing-manage/manage-shell";
import { PhotoManager } from "@/components/listing-manage/photo-manager";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../../next-i18next.config.js";

export default function ListingPhotosPage() {
  const { t } = useTranslation("account");
  const router = useRouter();
  const { data: session } = useSession({ required: true });
  const accessToken = session?.accessToken;

  const param = typeof router.query.id === "string" ? router.query.id : null;
  const slugHint = typeof router.query.slug === "string" ? router.query.slug : undefined;

  const [listing, setListing] = React.useState<OwnedListing | null>(null);
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
        <title>{t("manage.meta.photosTitle")}</title>
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
          <ManageShell listing={listing} routeParam={param ?? listing.slug} current="photos">
            {!accessToken ? (
              <Panel className="flex items-center gap-2 p-6 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("manage.loading")}
              </Panel>
            ) : (
              <PhotoManager
                listing={listing}
                accessToken={accessToken}
                onListingChanged={(patch) =>
                  setListing((prev) => (prev ? { ...prev, ...patch } : prev))
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
        destination: `${prefix}/login?next=${encodeURIComponent(`/listings/${id}/photos`)}`,
        permanent: false,
      },
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
