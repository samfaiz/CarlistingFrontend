/**
 * Cookie-consent banner — task P1-14 (PDPL, privacy-preserving default).
 *
 * Mounted once in _app so it can appear on ANY first-visited page. Renders
 * nothing on the server and nothing until the client has confirmed no stored
 * choice exists — so there is never a hydration mismatch and returning
 * visitors never see a flash. Accept/Decline persist via analytics.setConsent
 * (localStorage + cookie) and start/stop GA4 accordingly.
 *
 * i18n note: pages own their serverSideTranslations namespace lists and this
 * component must not force a "consent" namespace onto every page. The four
 * catalogs are therefore statically imported from public/locales (single
 * source of truth — /legal/privacy loads the same files through next-i18next)
 * and registered on the client i18n instance at mount; when no instance
 * exists (e.g. Next's default 404 page), a direct catalog lookup keeps the
 * copy correct.
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Button } from "@/components/ui/button";
import { getStoredConsent, setConsent, type ConsentValue } from "@/lib/analytics";
import arConsent from "../../../public/locales/ar/consent.json";
import enConsent from "../../../public/locales/en/consent.json";
import esConsent from "../../../public/locales/es/consent.json";
import frConsent from "../../../public/locales/fr/consent.json";

const CATALOGS: Record<string, typeof enConsent> = {
  en: enConsent,
  ar: arConsent,
  es: esConsent,
  fr: frConsent,
};

export function ConsentBanner() {
  const router = useRouter();
  const { t, i18n } = useTranslation("consent");
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Register the consent catalogs on the live i18n instance so t() resolves
    // regardless of which page (and namespace list) was server-rendered.
    try {
      for (const [lng, resources] of Object.entries(CATALOGS)) {
        if (!i18n.hasResourceBundle?.(lng, "consent")) {
          i18n.addResourceBundle?.(lng, "consent", resources, true, false);
        }
      }
    } catch {
      // Uninitialized instance (default 404 page) — fallback below covers it.
    }
    setVisible(getStoredConsent() === null);
  }, [i18n]);

  if (!visible) return null;

  const locale = router.locale ?? router.defaultLocale ?? "en";
  const catalog = CATALOGS[locale] ?? CATALOGS.en;

  /** t() first; if the key comes back unresolved, read the catalog directly. */
  const copy = (key: keyof typeof enConsent.banner): string => {
    const viaT = t(`banner.${key}`);
    return viaT === `banner.${key}` ? catalog.banner[key] : viaT;
  };

  const choose = (value: ConsentValue) => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label={copy("ariaLabel")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-card shadow-pop"
    >
      <div className="container-shell flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-sm text-ink">
          {copy("message")}{" "}
          <Link
            href="/legal/privacy"
            className="font-semibold text-brand-mid underline underline-offset-2 hover:text-brand"
          >
            {copy("privacyLink")}
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => choose("denied")}>
            {copy("decline")}
          </Button>
          <Button size="sm" onClick={() => choose("granted")}>
            {copy("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
