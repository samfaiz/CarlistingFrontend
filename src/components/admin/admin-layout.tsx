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
import * as React from "react";
import {
  ArrowLeftRight,
  BadgeCheck,
  CarFront,
  FileText,
  BarChart3,
  Database,
  Flag,
  History,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  LifeBuoy,
  LogOut,
  Plug,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { decodeStaffStepUp } from "@/components/admin/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminLayout({
  title,
  children,
  skipStepUpGate = false,
}: {
  /** Localized page title (browser tab: "<title> — Carsens Admin"). */
  title: string;
  children: React.ReactNode;
  /** Only /admin/security sets this — the airlock cannot gate itself. */
  skipStepUpGate?: boolean;
}) {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const router = useRouter();
  const { data: session } = useSession();

  // AC-AUTH-04: every staff surface requires a fresh WebAuthn step-up. The
  // API guard is authoritative; this decode only routes to the airlock early
  // instead of letting every fetch 403.
  const needsStepUp =
    !skipStepUpGate &&
    Boolean(session?.accessToken) &&
    !decodeStaffStepUp(session?.accessToken).isSteppedUp;
  React.useEffect(() => {
    if (needsStepUp) {
      void router.replace(
        `/admin/security?next=${encodeURIComponent(router.asPath)}`,
      );
    }
  }, [needsStepUp, router]);

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
    {
      href: "/admin/users",
      label: t("layout.nav.users"),
      icon: Users,
    },
    {
      href: "/admin/listings",
      label: t("layout.nav.listings"),
      icon: CarFront,
    },
    {
      href: "/admin/leads",
      label: t("layout.nav.leads"),
      icon: Inbox,
    },
    {
      href: "/admin/reports",
      label: t("layout.nav.reports"),
      icon: Flag,
    },
    {
      href: "/admin/support",
      label: t("layout.nav.support"),
      icon: LifeBuoy,
    },
    {
      href: "/admin/content",
      label: t("layout.nav.content"),
      icon: FileText,
    },
    {
      href: "/admin/legal",
      label: t("layout.nav.legal"),
      icon: Scale,
    },
    {
      href: "/admin/banners",
      label: t("layout.nav.banners"),
      icon: ImageIcon,
    },
    {
      href: "/admin/vs-pairs",
      label: t("layout.nav.vsPairs"),
      icon: ArrowLeftRight,
    },
    {
      href: "/admin/analytics",
      label: t("layout.nav.analytics"),
      icon: BarChart3,
    },
    {
      href: "/admin/spec-workbench",
      label: t("layout.nav.spec"),
      icon: Database,
    },
    {
      href: "/admin/audit",
      label: t("layout.nav.audit"),
      icon: History,
    },
    {
      href: "/admin/system",
      label: t("layout.nav.system"),
      icon: SlidersHorizontal,
    },
    {
      href: "/admin/integrations",
      label: t("layout.nav.integrations"),
      icon: Plug,
    },
    {
      href: "/admin/rbac",
      label: t("layout.nav.rbac"),
      icon: ShieldCheck,
    },
    {
      href: "/admin/security",
      label: t("layout.nav.security"),
      icon: KeyRound,
    },
  ];

  return (
    <>
      <Head>
        <title>{`${title} — ${t("layout.title")}`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-line bg-card md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-e">
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
            className="flex flex-row flex-wrap gap-1 p-3 md:min-h-0 md:flex-1 md:flex-col md:flex-nowrap md:overflow-y-auto"
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

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {needsStepUp ? (
            <p className="p-8 text-center text-sm text-muted">
              {t("layout.stepUpRedirect")}
            </p>
          ) : (
            children
          )}
        </main>
      </div>
    </>
  );
}
