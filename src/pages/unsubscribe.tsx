/**
 * /unsubscribe — RFC 8058 one-click unsubscribe landing (task P2-04).
 *
 * Mail clients POST the List-Unsubscribe URL directly; humans arrive here by
 * clicking the link. The signature in ?t= is what authorises the change, so no
 * session is required — but nothing happens until the visitor confirms, so a
 * link-scanning proxy prefetching the page cannot silently unsubscribe anyone.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { BellOff, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { unsubscribeAllEmail } from "@/lib/marketplace-api";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function UnsubscribePage() {
  const { t } = useTranslation("account");
  const router = useRouter();
  const u = typeof router.query.u === "string" ? router.query.u : "";
  const token = typeof router.query.t === "string" ? router.query.t : "";

  const [state, setState] = React.useState<"idle" | "working" | "done" | "error">("idle");

  const confirm = async () => {
    setState("working");
    try {
      await unsubscribeAllEmail(u, token);
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <>
      <Head>
        <title>{t("unsubscribe.meta.title")}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4">
        <Panel className="w-full p-8 text-center">
          <BellOff className="mx-auto size-8 text-muted" aria-hidden />
          <h1 className="mt-3 text-lg font-extrabold text-ink">
            {t("unsubscribe.heading")}
          </h1>

          {state === "done" ? (
            <>
              <p className="mt-2 flex items-center justify-center gap-2 text-sm text-success-strong">
                <Check className="size-4" aria-hidden />
                {t("unsubscribe.done")}
              </p>
              <p className="mt-4 text-sm text-muted">{t("unsubscribe.doneHint")}</p>
              <Button asChild className="mt-4">
                <Link href="/account/notifications">{t("unsubscribe.managePrefs")}</Link>
              </Button>
            </>
          ) : state === "error" ? (
            <>
              <p className="mt-2 text-sm text-danger-strong">{t("unsubscribe.invalid")}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/account/notifications">{t("unsubscribe.managePrefs")}</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">{t("unsubscribe.body")}</p>
              <Button
                className="mt-5"
                onClick={() => void confirm()}
                disabled={!u || !token || state === "working"}
              >
                {state === "working" && <Loader2 className="animate-spin" aria-hidden />}
                {t("unsubscribe.confirm")}
              </Button>
              {(!u || !token) && (
                <p className="mt-3 text-xs text-muted">{t("unsubscribe.missingLink")}</p>
              )}
            </>
          )}
        </Panel>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => ({
  props: {
    ...(await serverSideTranslations(
      ctx.locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "account"],
      nextI18NextConfig,
    )),
  },
});
