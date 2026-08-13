/**
 * WorkspaceShell — the sidebar + topbar frame both internal surfaces use
 * (INTERNAL-SURFACES-DESIGN §3). Promoted out of the /dev/internal-preview
 * prototype so the dealer portal (P3-02) and the admin shell (P4-01) share one
 * implementation rather than diverging the moment either is edited.
 *
 * Two rules from the design doc are enforced here rather than left to callers:
 *  - a nav entry the role cannot use is HIDDEN, never rendered disabled;
 *  - the active entry carries aria-current, so it is not signalled by colour alone.
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WorkspaceNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  /** When false the entry is not rendered at all. */
  visible?: boolean;
  badge?: number;
}

export interface WorkspaceNavGroup {
  title?: string;
  items: WorkspaceNavItem[];
}

export interface WorkspaceShellProps {
  /** Badge next to the wordmark: "Dealer", "Admin". */
  kind: string;
  /** Dealer name / staff email — who you are acting as. */
  identity?: string;
  groups: WorkspaceNavGroup[];
  title: string;
  /** Right-hand side of the topbar (actions, quota meter). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function WorkspaceShell({
  kind,
  identity,
  groups,
  title,
  actions,
  children,
}: WorkspaceShellProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [navOpen, setNavOpen] = React.useState(false);

  // Route changes must close the mobile sheet, or the user lands on a new page
  // with the navigation still covering it.
  React.useEffect(() => {
    setNavOpen(false);
  }, [router.asPath]);

  const isActive = (href: string) =>
    router.pathname === href || router.pathname.startsWith(`${href}/`);

  const nav = (
    <nav className="flex flex-col gap-3" aria-label={t("nav.workspace", { defaultValue: "Workspace" })}>
      {groups.map((group, index) => {
        const items = group.items.filter((i) => i.visible !== false);
        if (items.length === 0) return null;
        return (
          <div key={group.title ?? index}>
            {group.title && (
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                {group.title}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {items.map(({ href, label, icon: Icon, badge }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-card px-2 py-1.5 text-[13px] transition-colors",
                        active
                          ? "bg-brand-surface font-bold text-brand"
                          : "text-ink hover:bg-page",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {badge != null && badge > 0 && (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="hidden w-56 shrink-0 border-e border-line bg-card p-3 md:block">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-sm font-extrabold text-brand">
                carsens<span className="text-brand-mid">.</span>
              </Link>
              <Badge variant="navy">{kind}</Badge>
            </div>
            {identity && (
              <p className="mt-1 truncate text-xs text-muted" title={identity}>
                {identity}
              </p>
            )}
          </div>
          {nav}
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-card px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-expanded={navOpen}
                aria-label={t("nav.toggle", { defaultValue: "Toggle navigation" })}
                onClick={() => setNavOpen((open) => !open)}
              >
                {navOpen ? <X aria-hidden /> : <Menu aria-hidden />}
              </Button>
              <h1 className="truncate text-sm font-bold text-ink">{title}</h1>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </header>

          {navOpen && (
            <div className="border-b border-line bg-card p-3 md:hidden">{nav}</div>
          )}

          <main className="p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
