import { Html, Head, Main, NextScript } from "next/document";
import type { DocumentProps } from "next/document";
import { i18n } from "../../next-i18next.config.js";

/** Locales rendered right-to-left. Keep in sync with supported locales in next-i18next.config.js. */
const RTL_LOCALES = new Set(["ar"]);

export default function Document({ __NEXT_DATA__ }: DocumentProps) {
  const locale = __NEXT_DATA__.locale ?? i18n.defaultLocale;
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";

  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
