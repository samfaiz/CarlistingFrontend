/**
 * Catalogue-key guard.
 *
 * Twice now a component has read a key shape the catalogue does not have
 * (`events.X.title` vs `events.X`), which renders the raw key to users and is
 * invisible to tsc, eslint and unit tests. This scans the source for literal
 * t("…") keys and checks every one against the EN catalogue, then checks the
 * other locales for parity with EN.
 *
 *   node scripts/check-locale-keys.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const LOCALES_DIR = join(ROOT, 'public', 'locales');
const LOCALES = readdirSync(LOCALES_DIR).filter((d) =>
  statSync(join(LOCALES_DIR, d)).isDirectory(),
);
const SRC = join(ROOT, 'src');

const catalogues = {};
for (const locale of LOCALES) {
  catalogues[locale] = {};
  for (const file of readdirSync(join(LOCALES_DIR, locale))) {
    if (!file.endsWith('.json')) continue;
    catalogues[locale][file.replace(/\.json$/, '')] = JSON.parse(
      readFileSync(join(LOCALES_DIR, locale, file), 'utf8'),
    );
  }
}

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory()
      ? walk(full)
      : /\.tsx?$/.test(full)
        ? [full]
        : [];
  });

const lookup = (obj, path) =>
  path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);

/** Count-suffixed plural forms are legitimate variants of a base key. */
const PLURAL_SUFFIXES = ['_one', '_other', '_zero', '_two', '_few', '_many'];

let missing = 0;
let checked = 0;

for (const file of walk(SRC)) {
  const source = readFileSync(file, 'utf8');

  /*
   * Bind each translator identifier to the namespace it was created with:
   *   const { t } = useTranslation("search")              -> t         -> search
   *   const { t: tListings } = useTranslation("listings") -> tListings -> listings
   * Matching by identifier (instead of "any t-ish call in the file") is what
   * keeps local helpers such as tEnum(group, value) out of the results, and it
   * catches a key looked up through the wrong namespace.
   */
  const translators = new Map();
  for (const m of source.matchAll(
    /\{\s*t\s*(?::\s*(\w+))?\s*\}\s*=\s*useTranslation\(\s*["'`]([\w-]+)["'`]/g,
  )) {
    translators.set(m[1] ?? 't', m[2]);
  }
  if (translators.size === 0) continue;

  for (const [identifier, ns] of translators) {
    // Literal keys only — template keys are exercised by the runtime data.
    const pattern = new RegExp(`\\b${identifier}\\(\\s*["']([\\w.-]+)["']`, 'g');
    for (const match of source.matchAll(pattern)) {
      const key = match[1];
      checked += 1;
      const cat = catalogues.en[ns];
      const found =
        cat &&
        (lookup(cat, key) !== undefined ||
          PLURAL_SUFFIXES.some((suffix) => lookup(cat, `${key}${suffix}`) !== undefined));
      if (!found) {
        missing += 1;
        console.log(`  MISSING  ${relative(ROOT, file)} → ${ns}:${key}`);
      }
    }
  }
}

// Locale parity: every EN leaf must exist in ar/es/fr.
const leaves = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? leaves(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

let parityGaps = 0;
for (const [ns, cat] of Object.entries(catalogues.en)) {
  for (const locale of LOCALES.filter((l) => l !== 'en')) {
    const other = catalogues[locale][ns];
    if (!other) {
      console.log(`  MISSING FILE  ${locale}/${ns}.json`);
      parityGaps += 1;
      continue;
    }
    for (const leaf of leaves(cat)) {
      if (lookup(other, leaf) === undefined) {
        console.log(`  NO TRANSLATION  ${locale}/${ns}.json → ${leaf}`);
        parityGaps += 1;
      }
    }
  }
}

console.log(
  `\n${checked} literal keys checked · ${missing} missing from EN · ${parityGaps} locale parity gaps`,
);
if (missing > 0 || parityGaps > 0) process.exitCode = 1;
