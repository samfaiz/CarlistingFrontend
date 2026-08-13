import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import type { LegalDoc } from "@/lib/marketplace-api";

/**
 * Shared shell for the three CMS-driven legal pages (P4-05): terms, privacy,
 * cookie-policy. The heading + body come from the backend LegalDocument in the
 * active locale; the chrome (breadcrumb, effective date) is translated locally.
 * bodyHtml is rendered server-side from Markdown by our safe renderer, so it is
 * printed directly.
 */
export function LegalPage({ doc }: { doc: LegalDoc | null }) {
  const { t } = useTranslation("mk-legal");
  const { locale } = useRouter();
  const effective = doc?.effectiveAt ?? doc?.updatedAt ?? null;
  const formatted = effective
    ? new Intl.DateTimeFormat(locale ?? "en", { dateStyle: "long" }).format(new Date(effective))
    : null;

  return (
    <>
      <Head>
        <title>{`${doc?.title ?? t("fallbackTitle")} — Carsens`}</title>
        <meta name="robots" content="index,follow" />
      </Head>
      <MockupLayout>
        <main id="page-legal" className="page">
          <div className="help-hero">
            <div className="container">
              <nav className="legal-crumb">
                <Link href="/">{t("breadcrumb.home")}</Link>
                <span aria-hidden="true"> / </span>
                <span>{doc?.title ?? t("fallbackTitle")}</span>
              </nav>
              <h1>{doc?.title ?? t("fallbackTitle")}</h1>
              {formatted && (
                <p>
                  {t("effective", { date: formatted })}
                  {doc?.version ? ` · ${t("version", { n: doc.version })}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="help-wrap">
            <div className="container legal-container">
              {doc ? (
                <article
                  className="article-body legal-body"
                  dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
                />
              ) : (
                <p className="legal-empty">{t("unavailable")}</p>
              )}
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}
