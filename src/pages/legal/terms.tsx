import type { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { LegalPage } from "@/components/marketplace/legal-page";
import { getLegalDoc, type LegalDoc } from "@/lib/marketplace-api";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function TermsLegalPage({ doc }: { doc: LegalDoc | null }) {
  return <LegalPage doc={doc} />;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  let doc: LegalDoc | null = null;
  try {
    doc = await getLegalDoc("terms", locale);
  } catch {
    doc = null;
  }
  return {
    props: {
      doc,
      ...(await serverSideTranslations(locale, ["common", "mk-legal"], nextI18NextConfig)),
    },
  };
};
