/**
 * Shared i18n configuration (single source of truth) for Next.js locale
 * routing (next.config.ts) and next-i18next (_app.tsx / serverSideTranslations).
 *
 * Locales per PRD FR-I1/FR-I2: en (default), ar (RTL), es, fr.
 * Locale detection is left at Next's default (true): first visit resolves via
 * the NEXT_LOCALE cookie / Accept-Language header; the LanguageSwitcher
 * persists the user's choice in the NEXT_LOCALE cookie.
 *
 * @type {import("next-i18next/pages").UserConfig}
 */
const path = require("path");

const config = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ar", "es", "fr"],
  },
  localePath:
    typeof window === "undefined" ? path.resolve("./public/locales") : "/locales",
  reloadOnPrerender: process.env.NODE_ENV === "development",
};

module.exports = config;
