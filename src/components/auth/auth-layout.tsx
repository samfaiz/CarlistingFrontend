/**
 * Shared shell for the customer-facing auth screens — task P0-05.
 * Carsens wordmark header (as on the index page) + centered Panel, per the
 * mockup's auth screens (navy accents on the page background).
 */
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Panel } from "@/components/ui/card";

export function AuthLayout({
  title,
  children,
}: {
  /** Localized page title (document title becomes "<title> — <site>"). */
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>{`${title} — ${t("site.name")}`}</title>
      </Head>
      <header className="border-b border-line bg-card">
        <div className="container-shell flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-brand"
          >
            {t("site.name")}
            <span className="text-brand-border">.</span>
          </Link>
          <LanguageSwitcher className="w-36" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <Panel className="w-full max-w-md border-t-4 border-t-brand">
          {children}
        </Panel>
      </main>
    </div>
  );
}

/** Form-level error banner (role=alert so screen readers announce it). */
export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-card border border-danger/40 bg-danger-soft p-3 text-sm font-semibold text-danger-strong"
    >
      {children}
    </div>
  );
}
