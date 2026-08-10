import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function Home() {
  const { t } = useTranslation("common");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      {/* Localized document title (axe: document-title, serious) — composed from catalog keys. */}
      <Head>
        <title>{`${t("site.name")} — ${t("site.tagline")}`}</title>
      </Head>
      <h1 className="text-3xl font-extrabold tracking-tight text-brand">
        {t("site.name")}
        <span className="text-brand-border">.</span>
      </h1>
      <p className="text-base font-semibold text-ink">{t("site.tagline")}</p>
      <p className="text-sm text-muted">{t("home.scaffoldStatus")}</p>
      <Button asChild variant="secondary" size="sm">
        <Link href="/dev/ui-kit">{t("home.openUiKit")}</Link>
      </Button>
      <LanguageSwitcher />
    </main>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common"],
      nextI18NextConfig,
    )),
  },
});
