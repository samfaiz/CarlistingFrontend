/**
 * MockupLayout — the exact header + footer chrome from
 * carsens-FullPage interactive design.html, wrapping every ported public page
 * in `.mk` so the scoped marketplace design layer (styles/marketplace-mockup.css)
 * applies. Internal (dealer/admin) surfaces never render this, so their Tailwind
 * design is untouched (two-sides rule).
 *
 * Markup is faithful to the mockup; hrefs point at the real Next.js routes that
 * exist today and at their intended paths for screens still being built out.
 */
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { useSession } from "next-auth/react";
import { useCurrency } from "@/components/marketplace/currency-provider";
import { SOCIALS } from "@/lib/socials";

const NAV = [
  { href: "/cars", key: "usedCars", match: /^\/(cars|used-cars)/ },
  { href: "/new-cars", key: "newCars", match: /^\/new-cars/ },
  { href: "/bikes", key: "bikes", match: /^\/bikes/ },
  { href: "/dealers", key: "dealers", match: /^\/dealers/ },
  { href: "/compare", key: "compare", match: /^\/compare/ },
  { href: "/news", key: "news", match: /^\/news/ },
];

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "ar", label: "عربي" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
];

function Wordmark({ color }: { color?: string }) {
  return (
    <Link href="/" className="logo" style={color ? { color } : undefined}>
      <span className="mark">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2M9 11l1-3h4l1 3" />
        </svg>
      </span>
      Carsens
    </Link>
  );
}

export function MockupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { data: session } = useSession();
  const { currency, setCurrency } = useCurrency();
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Close the panel whenever the route changes. Tapping a link already closes
  // it, but browser back/forward and in-page links did not.
  React.useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on("routeChangeComplete", close);
    return () => router.events.off("routeChangeComplete", close);
  }, [router.events]);

  const switchLocale = (code: string) => {
    void router.push({ pathname: router.pathname, query: router.query }, router.asPath, { locale: code });
  };

  return (
    <div className="mk">
      <header className="header">
        <div className="container row">
          <Wordmark />
          <nav className="nav">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.match.test(router.pathname) ? "active" : undefined}
              >
                {t(`chrome.nav.${item.key}`)}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <select
              className="chrome-select"
              aria-label={t("chrome.language")}
              value={router.locale ?? "en"}
              onChange={(e) => switchLocale(e.target.value)}
            >
              {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <select
              className="chrome-select"
              aria-label={t("chrome.currency")}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "AED" | "USD" | "EUR")}
            >
              <option value="AED">AED</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <Link className="btn btn-outline" href={session ? "/account" : "/login"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {session ? t("chrome.myAccount") : t("chrome.login")}
            </Link>
            <Link className="btn btn-primary" href="/sell">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("chrome.sell")}
            </Link>
            <button
              className="mobile-toggle"
              aria-label={t("chrome.menu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-menu" className="mobile-menu" aria-label={t("chrome.menuNav")}>
            <div className="container">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={item.match.test(router.pathname) ? "active" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(`chrome.nav.${item.key}`)}
                </Link>
              ))}

              {/*
                Account, language and currency live ONLY in the desktop header,
                where they are display:none below 900px. Without them here a
                phone user cannot sign in at all, and cannot switch to Arabic —
                on an Arabic-first, mobile-first market.
              */}
              <Link
                className="mobile-menu-account"
                href={session ? "/account" : "/login"}
                onClick={() => setMenuOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {session ? t("chrome.myAccount") : t("chrome.login")}
              </Link>

              <div className="mobile-menu-prefs">
                <label htmlFor="m-lang">{t("chrome.language")}</label>
                <select
                  id="m-lang"
                  value={router.locale ?? "en"}
                  onChange={(e) => {
                    setMenuOpen(false);
                    switchLocale(e.target.value);
                  }}
                >
                  {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>

                <label htmlFor="m-currency">{t("chrome.currency")}</label>
                <select
                  id="m-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "AED" | "USD" | "EUR")}
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </nav>
        )}
      </header>

      {children}

      <footer>
        <div className="container">
          <div className="grid">
            <div className="brand-col">
              <Wordmark color="#fff" />
              <p>{t("chrome.tagline")}</p>
              <div className="socials">
                {SOCIALS["X"] ? (
                  <a href={SOCIALS["X"]} aria-label="X" target="_blank" rel="noopener noreferrer"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.8c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1-.8-.8-1.9-1.3-3.1-1.3-2.3 0-4.2 1.9-4.2 4.2 0 .3 0 .7.1 1C8 8.8 4.5 7 2.2 4.2c-.4.6-.6 1.3-.6 2.1 0 1.5.8 2.8 1.9 3.5-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.7 3.3 4.1-.3.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.6 2.1 2.9 4 2.9-1.4 1.1-3.3 1.8-5.3 1.8H1c1.8 1.2 4 1.9 6.3 1.9 7.5 0 11.7-6.2 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z" /></svg></a>
                ) : (
                  <span aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.8c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1-.8-.8-1.9-1.3-3.1-1.3-2.3 0-4.2 1.9-4.2 4.2 0 .3 0 .7.1 1C8 8.8 4.5 7 2.2 4.2c-.4.6-.6 1.3-.6 2.1 0 1.5.8 2.8 1.9 3.5-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.7 3.3 4.1-.3.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.6 2.1 2.9 4 2.9-1.4 1.1-3.3 1.8-5.3 1.8H1c1.8 1.2 4 1.9 6.3 1.9 7.5 0 11.7-6.2 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z" /></svg></span>
                )}
                {SOCIALS["Facebook"] ? (
                  <a href={SOCIALS["Facebook"]} aria-label="Facebook" target="_blank" rel="noopener noreferrer"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12z" /></svg></a>
                ) : (
                  <span aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12z" /></svg></span>
                )}
                {SOCIALS["Instagram"] ? (
                  <a href={SOCIALS["Instagram"]} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></a>
                ) : (
                  <span aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></span>
                )}
                {SOCIALS["LinkedIn"] ? (
                  <a href={SOCIALS["LinkedIn"]} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.3 18.3H5.7v-8h2.6v8zM7 9.2a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11.3 9.1h-2.6v-4.4c0-1.1 0-2.4-1.5-2.4s-1.7 1.1-1.7 2.3v4.5h-2.6v-8h2.5v1.1c.4-.7 1.2-1.3 2.5-1.3 2.7 0 3.2 1.8 3.2 4v4.2z" /></svg></a>
                ) : (
                  <span aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.3 18.3H5.7v-8h2.6v8zM7 9.2a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11.3 9.1h-2.6v-4.4c0-1.1 0-2.4-1.5-2.4s-1.7 1.1-1.7 2.3v4.5h-2.6v-8h2.5v1.1c.4-.7 1.2-1.3 2.5-1.3 2.7 0 3.2 1.8 3.2 4v4.2z" /></svg></span>
                )}
              </div>
            </div>
            <FooterCol title={t("chrome.footer.buy")} links={[[t("chrome.nav.usedCars"), "/cars"], [t("chrome.nav.newCars"), "/new-cars"], [t("chrome.nav.bikes"), "/bikes"], [t("chrome.nav.dealers"), "/dealers"]]} />
            <FooterCol title={t("chrome.footer.sell")} links={[[t("chrome.sell"), "/sell"], [t("chrome.footer.valuation"), "/sell"], [t("chrome.footer.dealerSignup"), "/dealers"], [t("chrome.footer.sellingTips"), "/help"]]} />
            <FooterCol title={t("chrome.footer.tools")} links={[[t("chrome.nav.compare"), "/compare"], [t("chrome.footer.help"), "/help"], [t("chrome.footer.contact"), "/contact"]]} />
            <FooterCol title={t("chrome.footer.company")} links={[[t("chrome.footer.about"), "/help"], [t("chrome.nav.news"), "/news"], [t("chrome.footer.terms"), "/legal/terms"], [t("chrome.footer.privacy"), "/legal/privacy"], [t("chrome.footer.cookies"), "/legal/cookie-policy"]]} />
          </div>
          <div className="copyright">
            <div>{t("chrome.copyright")}</div>
            <div>{t("chrome.madeIn")}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h5>{title}</h5>
      <ul>
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href}>{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
