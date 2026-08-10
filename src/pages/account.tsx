/**
 * /account — protected stub, task P0-05. The real User area arrives in P2;
 * this stays a single Panel: name/email/role, email-verified Badge, sign-out.
 *
 * Protection is two-layer: SSR (getServerSession → redirect /login?next=/account,
 * which the promoted RBAC E2E asserts works without JS) + client useSession
 * (required) to catch mid-session expiry/RefreshFailed.
 */
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function AccountPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      void router.replace("/login?next=/account");
    },
  });

  // Silent refresh rotation failed → the backend session is gone; re-login.
  React.useEffect(() => {
    if (session?.error === "RefreshFailed") {
      toast({ title: t("account.sessionExpired"), variant: "warning" });
      void signOut({ callbackUrl: "/login" });
    }
  }, [session?.error, t]);

  if (!session) return null; // required:true → only while redirecting

  const verified = Boolean(session.user.emailVerifiedAt);

  return (
    <AuthLayout title={t("account.title")}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xl">{t("account.title")}</CardTitle>
          <Badge variant={verified ? "green" : "amber"}>
            {verified ? t("account.verified") : t("account.unverified")}
          </Badge>
        </div>
        <CardDescription>{t("account.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">{t("account.nameLabel")}</dt>
            <dd className="font-semibold text-ink">{session.user.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">{t("account.emailLabel")}</dt>
            <dd className="font-semibold text-ink">{session.user.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">{t("account.roleLabel")}</dt>
            <dd>
              <Badge variant="navy">{session.user.role}</Badge>
            </dd>
          </div>
        </dl>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          {t("account.signOut")}
        </Button>
      </CardContent>
    </AuthLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    // Locale prefix must survive the redirect (Next does not auto-prefix).
    const prefix =
      ctx.locale && ctx.locale !== ctx.defaultLocale ? `/${ctx.locale}` : "";
    return {
      redirect: {
        destination: `${prefix}/login?next=/account`,
        permanent: false,
      },
    };
  }
  return {
    props: {
      // Strip undefined values (error/accessToken) — SSR props must serialize.
      session: JSON.parse(JSON.stringify(session)),
      ...(await serverSideTranslations(
        ctx.locale ?? nextI18NextConfig.i18n.defaultLocale,
        ["common", "auth"],
        nextI18NextConfig,
      )),
    },
  };
};
