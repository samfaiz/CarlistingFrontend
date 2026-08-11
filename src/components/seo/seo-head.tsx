/**
 * Canonical + hreflang head block for SEO landing pages — task P1-06 (§13.1).
 *
 * Renders <title>, meta description, the self-canonical link for the current
 * locale and the full hreflang alternate cluster (en/ar/es/fr + x-default,
 * locale-prefixed paths per the Next i18n routing convention).
 *
 * IMPORTANT (next/head contract): every tag must be a DIRECT child of <Head>
 * — nested components are not picked up on client-side navigation — so this
 * component renders the whole <Head> itself. Pass the UN-localized `path`
 * ("/used-cars/toyota"); locale prefixes are derived here.
 */
import Head from "next/head";
import { useRouter } from "next/router";
import {
  absoluteUrl,
  DEFAULT_LOCALE,
  hreflangAlternates,
} from "@/components/seo/site-url";

export interface SeoHeadProps {
  title: string;
  description: string;
  /** Un-localized site-relative path, e.g. "/used-cars/toyota". */
  path: string;
  /** Extra og:image URL (absolute), optional. */
  ogImage?: string;
}

export function SeoHead({ title, description, path, ogImage }: SeoHeadProps) {
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? DEFAULT_LOCALE;
  const canonical = absoluteUrl(path, locale);

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {hreflangAlternates(path).map((alt) => (
        <link
          key={alt.hrefLang}
          rel="alternate"
          hrefLang={alt.hrefLang}
          href={alt.href}
        />
      ))}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      {ogImage && <meta property="og:image" content={ogImage} />}
    </Head>
  );
}
