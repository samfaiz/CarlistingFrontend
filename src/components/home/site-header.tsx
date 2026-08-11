/**
 * Shared site header for the customer-facing marketplace pages that P1-07/P1-08
 * own (home + car detail): brand wordmark, browse/sell links, auth entry point
 * (login vs account via useSession) and the LanguageSwitcher.
 */
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

export function SiteHeader() {
  const { t } = useTranslation("home");
  const { t: tCommon } = useTranslation("common");
  const { status } = useSession();
  const authed = status === "authenticated";

  return (
    <header className="border-b border-line bg-card">
      <div className="container-shell flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="shrink-0 text-xl font-extrabold tracking-tight text-brand"
        >
          {tCommon("site.name")}
          <span className="text-brand-border">.</span>
        </Link>

        <nav aria-label={t("nav.label")} className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/cars">{t("nav.browse")}</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/sell">{t("nav.sell")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={authed ? "/account" : "/login"}>
              <CircleUserRound aria-hidden />
              <span className="hidden sm:inline">
                {authed ? t("nav.account") : t("nav.signIn")}
              </span>
              <span className="sr-only sm:hidden">
                {authed ? t("nav.account") : t("nav.signIn")}
              </span>
            </Link>
          </Button>
          <LanguageSwitcher className="w-32" />
        </nav>
      </div>
    </header>
  );
}
