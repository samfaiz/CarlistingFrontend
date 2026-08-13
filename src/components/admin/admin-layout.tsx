/**
 * Admin workspace shell — task P1-11 FE (minimal; the full admin suite is
 * P4-02). Sidebar with wordmark + Admin badge, the Moderation nav entry and
 * sign-out. Internal-only surface: robots noindex on every admin page.
 */
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { BadgeCheck, LogOut, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminLayout({
  title,
  children,
}: {
  /** Localized page title (browser tab: "<title> — Carsens Admin"). */
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const router = useRouter();
  const { data: session } = useSession();

  const nav = [
    {
      href: "/admin/moderation",
      label: t("layout.nav.moderation"),
      icon: ShieldCheck,
    },
    {
      href: "/admin/verification",
      label: t("layout.nav.verification"),
      icon: BadgeCheck,
    },
  ];

  return (
    <>
      <Head>
        <title>{`${title} — ${t("layout.title")}`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-line bg-card md:min-h-screen md:w-60 md:border-b-0 md:border-e">
          <div className="flex h-16 items-center gap-2 border-b border-line px-4">
            <Link
              href="/admin"
              className="text-xl font-extrabold tracking-tight text-brand"
            >
              {tCommon("site.name")}
              <span className="text-brand-border">.</span>
            </Link>
            <Badge variant="solid">{t("layout.badge")}</Badge>
            {/* Mobile sign-out (the sidebar footer is desktop-only) */}
            <Button
              variant="ghost"
              size="sm"
              className="ms-auto md:hidden"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              <LogOut aria-hidden />
              {t("layout.signOut")}
            </Button>
          </div>

          <nav
            aria-label={t("layout.nav.label")}
            className="flex flex-row gap-1 p-3 md:flex-1 md:flex-col"
          >
            {nav.map((item) => {
              const active = router.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-card px-3 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-brand-light text-brand"
                      : "text-muted-strong hover:bg-divider hover:text-ink",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden flex-col gap-2 border-t border-line p-3 md:flex">
            {session?.user ? (
              <p className="truncate text-xs text-muted" title={session.user.email}>
                {session.user.email}
              </p>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              <LogOut aria-hidden />
              {t("layout.signOut")}
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </>
  );
}
