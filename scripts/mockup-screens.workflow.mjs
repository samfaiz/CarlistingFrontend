export const meta = {
  name: "mockup-screens",
  description: "Port mockup screens to pixel-exact, i18n'd Next.js pages",
  phases: [{ title: "Convert" }],
};

// args = array of { id, namespace, title, target, fetch, depth, htmlPath }
// The harness may deliver args as a JSON string; parse it defensively.
const parsed = typeof args === "string" ? JSON.parse(args) : args;
const screens = Array.isArray(parsed) ? parsed : parsed?.screens ?? [];

const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["id", "pageWritten", "localesWritten", "keyCount"],
  properties: {
    id: { type: "string" },
    pageWritten: { type: "string", description: "absolute path of the page file written" },
    localesWritten: { type: "array", items: { type: "string" } },
    keyCount: { type: "number" },
    notes: { type: "string" },
  },
};

const FRONT = "C:/dev/Listing Platform/Frontend";

function prompt(s) {
  const relCfg = s.depth === 2 ? "../../../next-i18next.config.js" : "../../next-i18next.config.js";
  const fetchImport = s.fetch === "gssp" ? "GetServerSideProps" : "GetStaticProps";
  const comp = s.namespace.replace(/[^a-zA-Z]/g, "") + "Page";
  const pagePath = `${FRONT}/src/${s.target}`;
  const localeBase = `${FRONT}/public/locales`;
  const fetchExport =
    s.fetch === "gssp"
      ? `export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "${s.namespace}"],
      nextI18NextConfig,
    )),
  },
});`
      : `export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "${s.namespace}"],
      nextI18NextConfig,
    )),
  },
});`;

  return `You are porting ONE screen of a static HTML mockup into a real Next.js (Pages Router, TypeScript) page for the Carsens marketplace, matching the mockup PIXEL-EXACT and fully internationalised.

## Step 1 — read the mockup section
Read this file (it is the exact <main id="${s.id}"> block from the mockup):
  ${s.htmlPath}

## Step 2 — write the page file
Write it to EXACTLY this path (create parent dirs):
  ${pagePath}

The file MUST be this exact skeleton — fill only the JSX inside <main> and keep everything else verbatim:

\`\`\`tsx
import type { ${fetchImport} } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "${relCfg}";

export default function ${comp}() {
  const { t } = useTranslation("${s.namespace}");
  return (
    <>
      <Head><title>{\`\${t("meta.title")} — Carsens\`}</title></Head>
      <MockupLayout>
        <main id="${s.id}" className="page">
          {/* ...converted JSX here... */}
        </main>
      </MockupLayout>
    </>
  );
}

${fetchExport}
\`\`\`

## Conversion rules (follow every one)
- PIXEL-EXACT: keep ALL of the mockup's classes, structure, inline styles, SVGs and DEMO/MOCK content (car names, prices, dealer names, article text, etc.) exactly. Do NOT wire to any API or invent a different layout. Static is intended.
- HTML → JSX: \`class\`→\`className\`, \`for\`→\`htmlFor\`, self-close every void/SVG element (<img/>, <input/>, <br/>, <path/>, <circle/>, <rect/>, <line/>, <polyline/>, <polygon/>, <use/>, <stop/>, <ellipse/>). SVG hyphenated attrs → camelCase (stroke-width→strokeWidth, stroke-linecap→strokeLinecap, stroke-linejoin→strokeLinejoin, fill-rule→fillRule, clip-rule→clipRule, stop-color→stopColor). \`viewBox\` and \`fill\`/\`stroke\` stay. Inline \`style="a:b;c:d"\` → \`style={{ a: "b", c: "d" }}\` with camelCased properties and numeric/string values. Remove HTML comments (or convert to {/* */}). \`tabindex\`→\`tabIndex\`, \`maxlength\`→\`maxLength\`, \`autocomplete\`→\`autoComplete\`, \`readonly\`→\`readOnly\`. Add \`{/* eslint-disable-next-line @next/next/no-img-element */}\` on the line before each <img>.
- Escape stray braces/apostrophes in JSX text. Prefer wrapping literal text in {"..."} or using &apos; for apostrophes.
- Do NOT include the header or footer chrome from the mockup — MockupLayout provides them. Only the <main> section's inner content goes inside <main>.
- Interactivity is STATIC/visual only — no useState, no event handlers. Tabs/toggles render in their default "active" state exactly as the mockup shows. Keep <button> elements but no onClick. Where the mockup links somewhere, use next/link <Link href="..."> for obvious internal targets (Login→/login, Sell→/sell, a car card→/cars/demo, a dealer→/dealers/demo), else href="#".

## Step 3 — internationalise (every visible string)
Replace EVERY user-visible text string in the JSX with t("<dot.key>"). Use clear hierarchical keys (e.g. t("hero.title"), t("filters.make"), t("cards.0.title")). Include a "meta.title" key (short page title). Then write FOUR locale files with IDENTICAL key structure:
  ${localeBase}/en/${s.namespace}.json   (the original English)
  ${localeBase}/ar/${s.namespace}.json   (Arabic translation)
  ${localeBase}/es/${s.namespace}.json   (Spanish translation)
  ${localeBase}/fr/${s.namespace}.json   (French translation)
All four MUST have exactly the same keys (parity is enforced by CI). Translate naturally; keep brand names ("Carsens"), model names (BMW X5), and units where appropriate. JSON only, 2-space indent, UTF-8, no comments.

Numbers/prices that are part of demo data can stay as literal text inside a key's value (e.g. "AED 285,000") — still put them in the locale file so the string is translatable, but keep digits identical across locales.

## Return
After writing all 5 files, return the structured result: id, pageWritten (the page path), localesWritten (the 4 locale paths), keyCount (number of i18n keys), notes (anything unusual).

Screen: ${s.id} · namespace ${s.namespace} · title "${s.title}"`;
}

phase("Convert");
const results = await parallel(
  screens.map((s) => () =>
    agent(prompt(s), {
      label: `port:${s.id}`,
      phase: "Convert",
      schema: RESULT_SCHEMA,
      effort: "high",
    }),
  ),
);

const ok = results.filter(Boolean);
log(`ported ${ok.length}/${screens.length} screens`);
return {
  ported: ok.length,
  total: screens.length,
  screens: ok.map((r) => ({ id: r.id, keys: r.keyCount, notes: r.notes })),
};
