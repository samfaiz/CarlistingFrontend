/**
 * /account — the User-area hub (P0-05 shell, filled in by P2-05): identity,
 * links to listings/messages/saved/notifications, PDPL export + erasure,
 * sign-out.
 *
 * Protection is two-layer: SSR (getServerSession → redirect /login?next=/account,
 * which the promoted RBAC E2E asserts works without JS) + client useSession
 * (required) to catch mid-session expiry/RefreshFailed.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import { BellRing, CarFront, Heart, MessageCircle } from "lucide-react";
import { PrivacyPanel } from "@/components/account/privacy-panel";
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
        {/* P2-05: the account hub — every user-area surface reachable in one hop. */}
        <nav aria-label={t("account.sectionsLabel")}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              { href: "/account/listings", icon: CarFront, key: "myListings" },
              { href: "/account/messages", icon: MessageCircle, key: "messages" },
              { href: "/account/saved", icon: Heart, key: "saved" },
              { href: "/account/notifications", icon: BellRing, key: "notifications" },
            ].map(({ href, icon: Icon, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 rounded-card border border-line p-3 text-sm font-semibold text-ink transition-colors hover:bg-page"
                >
                  <Icon className="size-4 text-brand-mid" aria-hidden />
                  {t(`account.sections.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {session.accessToken && (
          <PrivacyPanel accessToken={session.accessToken} email={session.user.email} />
        )}

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
        ["common", "auth", "account"],
        nextI18NextConfig,
      )),
    },
  };
};
