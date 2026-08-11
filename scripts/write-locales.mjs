/**
 * One-shot helper: writes ar/es/fr variants of a namespace from a flat key map,
 * using the en catalog as the structural source. Kept in-repo so future locale
 * additions follow the same shape (no partial catalogs).
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..", "public", "locales");

const setDeep = (obj, dotted, value) => {
  const keys = dotted.split(".");
  let cursor = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    cursor[keys[i]] = cursor[keys[i]] ?? {};
    cursor = cursor[keys[i]];
  }
  cursor[keys.at(-1)] = value;
};

export function writeLocale(namespace, translations) {
  const en = JSON.parse(fs.readFileSync(path.join(root, "en", `${namespace}.json`), "utf8"));
  for (const [locale, flat] of Object.entries(translations)) {
    const out = structuredClone(en);
    for (const [key, value] of Object.entries(flat)) setDeep(out, key, value);
    fs.writeFileSync(path.join(root, locale, `${namespace}.json`), `${JSON.stringify(out, null, 2)}\n`);
  }
}
