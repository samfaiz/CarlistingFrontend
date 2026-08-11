/**
 * /legal/privacy — minimal static privacy page, task P1-14.
 *
 * PLACEHOLDER by design: the consent banner needs a real destination now;
 * the full PDPL legal pages (terms, privacy, cookie policy ×4 locales) are
 * CMS-managed and arrive with P4-05, which replaces this page's copy.
 * Headings and body copy are fully localized (consent namespace).
 */
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { Panel } from "@/components/ui/card";
import nextI18NextConfig from "../../../next-i18next.config.js";

const SECTIONS = ["data", "cookies", "contact"] as const;

export default function PrivacyPage() {
  const { t } = useTranslation("consent");

  return (
    <>
      <Head>
        <title>{t("privacy.title")}</title>
        <meta name="description" content={t("privacy.sections.cookies.body")} />
      </Head>

      <main className="container-shell py-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <header>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              {t("privacy.title")}
            </h1>
            <p className="mt-2 text-sm text-muted">{t("privacy.placeholderNote")}</p>
          </header>

          {SECTIONS.map((key) => (
            <Panel key={key} className="p-5">
              <h2 className="text-base font-bold text-ink">
                {t(`privacy.sections.${key}.title`)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-strong">
                {t(`privacy.sections.${key}.body`)}
              </p>
            </Panel>
          ))}

          <p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-mid hover:text-brand"
            >
              <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
              {t("privacy.backHome")}
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "consent"],
      nextI18NextConfig,
    )),
  },
});
