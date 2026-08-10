/**
 * /verify-email?token=… — task P0-05 (FR-A1). Calls POST /auth/verify-email
 * on mount (ref-guarded against React StrictMode's dev double-effect).
 * Success/error states with onward links.
 */
import { Loader2 } from "lucide-react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiPost } from "@/lib/api";
import nextI18NextConfig from "../../next-i18next.config.js";

type VerifyStatus = "pending" | "success" | "invalid" | "missing";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [status, setStatus] = React.useState<VerifyStatus>("pending");
  // StrictMode runs effects twice in dev — the token must be consumed once.
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (!router.isReady || firedRef.current) return;
    const token =
      typeof router.query.token === "string" ? router.query.token : null;
    if (!token) {
      setStatus("missing");
      return;
    }
    firedRef.current = true;
    apiPost<{ verified: boolean }>("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("invalid"));
  }, [router.isReady, router.query.token]);

  const heading =
    status === "success"
      ? t("verify.successTitle")
      : status === "pending"
        ? t("verify.title")
        : t("verify.errorTitle");

  return (
    <AuthLayout title={t("verify.title")}>
      <CardHeader>
        <CardTitle className="text-xl">{heading}</CardTitle>
        {status === "success" ? (
          <CardDescription>{t("verify.successBody")}</CardDescription>
        ) : status === "invalid" ? (
          <CardDescription>{t("verify.errorBody")}</CardDescription>
        ) : status === "missing" ? (
          <CardDescription>{t("verify.missingBody")}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {status === "pending" ? (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("verify.pending")}
          </p>
        ) : null}
        {status === "success" ? (
          <Button asChild className="w-full">
            <Link href="/login">{t("verify.goToLogin")}</Link>
          </Button>
        ) : null}
        {status === "invalid" || status === "missing" ? (
          <>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/register">{t("verify.goToRegister")}</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">{t("verify.goToLogin")}</Link>
            </Button>
          </>
        ) : null}
      </CardContent>
    </AuthLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "auth"],
      nextI18NextConfig,
    )),
  },
});
