/**
 * Adds the translation keys the P1-09/P1-10 components actually read.
 * The components were written against `listings` (card chips/hearts),
 * `common` (compare tray, save-search button) and `saved` (saved-car card);
 * this backfills every locale so no UI renders a raw key.
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

const patch = (locale, namespace, entries) => {
  const file = path.join(root, locale, `${namespace}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [key, value] of Object.entries(entries)) setDeep(json, key, value);
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
};

const LISTINGS = {
  en: {
    "save.label": "Save car",
    "save.saved": "Saved",
    "save.loginRequired": "Sign in to save cars",
    "save.error": "Could not update your saved cars",
    "compare.chip": "Compare",
    "compare.chipLabel": "Add to compare: {{title}}",
    "compare.full": "You can compare up to 4 cars",
  },
  ar: {
    "save.label": "حفظ السيارة",
    "save.saved": "محفوظة",
    "save.loginRequired": "سجّل الدخول لحفظ السيارات",
    "save.error": "تعذّر تحديث السيارات المحفوظة",
    "compare.chip": "قارن",
    "compare.chipLabel": "أضف للمقارنة: {{title}}",
    "compare.full": "يمكنك مقارنة حتى 4 سيارات",
  },
  es: {
    "save.label": "Guardar coche",
    "save.saved": "Guardado",
    "save.loginRequired": "Inicia sesión para guardar coches",
    "save.error": "No se pudieron actualizar tus coches guardados",
    "compare.chip": "Comparar",
    "compare.chipLabel": "Añadir a comparar: {{title}}",
    "compare.full": "Puedes comparar hasta 4 coches",
  },
  fr: {
    "save.label": "Enregistrer la voiture",
    "save.saved": "Enregistrée",
    "save.loginRequired": "Connectez-vous pour enregistrer des voitures",
    "save.error": "Impossible de mettre à jour vos voitures enregistrées",
    "compare.chip": "Comparer",
    "compare.chipLabel": "Ajouter au comparateur : {{title}}",
    "compare.full": "Vous pouvez comparer jusqu'à 4 voitures",
  },
};

const COMMON = {
  en: {
    "compareTray.label": "Compare",
    "compareTray.cta": "Compare ({{count}})",
    "compareTray.clear": "Clear",
    "compareTray.remove": "Remove {{title}} from comparison",
    "saveSearch.cta": "Save this search",
    "saveSearch.title": "Save this search",
    "saveSearch.description": "Find it again from your account. Alerts arrive in the next release.",
    "saveSearch.nameLabel": "Name",
    "saveSearch.namePlaceholder": "e.g. Land Cruiser under 400k",
    "saveSearch.nameRequired": "Give this search a name.",
    "saveSearch.frequencyLabel": "Alerts",
    "saveSearch.frequencyHint": "Alert delivery arrives in the next release.",
    "saveSearch.submit": "Save search",
    "saveSearch.cancel": "Cancel",
    "saveSearch.success": "Search saved",
    "saveSearch.error": "Could not save this search",
    "saveSearch.loginRequired": "Sign in to save searches",
  },
  ar: {
    "compareTray.label": "المقارنة",
    "compareTray.cta": "قارن ({{count}})",
    "compareTray.clear": "مسح",
    "compareTray.remove": "إزالة {{title}} من المقارنة",
    "saveSearch.cta": "احفظ هذا البحث",
    "saveSearch.title": "حفظ هذا البحث",
    "saveSearch.description": "اعثر عليه لاحقًا من حسابك. التنبيهات تصل في الإصدار القادم.",
    "saveSearch.nameLabel": "الاسم",
    "saveSearch.namePlaceholder": "مثال: لاند كروزر بأقل من 400 ألف",
    "saveSearch.nameRequired": "أعطِ هذا البحث اسمًا.",
    "saveSearch.frequencyLabel": "التنبيهات",
    "saveSearch.frequencyHint": "إرسال التنبيهات يصل في الإصدار القادم.",
    "saveSearch.submit": "حفظ البحث",
    "saveSearch.cancel": "إلغاء",
    "saveSearch.success": "تم حفظ البحث",
    "saveSearch.error": "تعذّر حفظ هذا البحث",
    "saveSearch.loginRequired": "سجّل الدخول لحفظ عمليات البحث",
  },
  es: {
    "compareTray.label": "Comparar",
    "compareTray.cta": "Comparar ({{count}})",
    "compareTray.clear": "Limpiar",
    "compareTray.remove": "Quitar {{title}} de la comparación",
    "saveSearch.cta": "Guardar esta búsqueda",
    "saveSearch.title": "Guardar esta búsqueda",
    "saveSearch.description": "Vuelve a encontrarla desde tu cuenta. Las alertas llegan en la próxima versión.",
    "saveSearch.nameLabel": "Nombre",
    "saveSearch.namePlaceholder": "p. ej. Land Cruiser por menos de 400k",
    "saveSearch.nameRequired": "Ponle un nombre a esta búsqueda.",
    "saveSearch.frequencyLabel": "Alertas",
    "saveSearch.frequencyHint": "El envío de alertas llega en la próxima versión.",
    "saveSearch.submit": "Guardar búsqueda",
    "saveSearch.cancel": "Cancelar",
    "saveSearch.success": "Búsqueda guardada",
    "saveSearch.error": "No se pudo guardar esta búsqueda",
    "saveSearch.loginRequired": "Inicia sesión para guardar búsquedas",
  },
  fr: {
    "compareTray.label": "Comparateur",
    "compareTray.cta": "Comparer ({{count}})",
    "compareTray.clear": "Effacer",
    "compareTray.remove": "Retirer {{title}} de la comparaison",
    "saveSearch.cta": "Enregistrer cette recherche",
    "saveSearch.title": "Enregistrer cette recherche",
    "saveSearch.description": "Retrouvez-la depuis votre compte. Les alertes arrivent dans la prochaine version.",
    "saveSearch.nameLabel": "Nom",
    "saveSearch.namePlaceholder": "ex. Land Cruiser sous 400k",
    "saveSearch.nameRequired": "Donnez un nom à cette recherche.",
    "saveSearch.frequencyLabel": "Alertes",
    "saveSearch.frequencyHint": "L'envoi des alertes arrive dans la prochaine version.",
    "saveSearch.submit": "Enregistrer la recherche",
    "saveSearch.cancel": "Annuler",
    "saveSearch.success": "Recherche enregistrée",
    "saveSearch.error": "Impossible d'enregistrer cette recherche",
    "saveSearch.loginRequired": "Connectez-vous pour enregistrer des recherches",
  },
};

// saved-car-card reads cars.priceDrop / cars.notAvailable / cars.savedAt / cars.unsave.
const SAVED_ALIASES = {
  en: { "cars.priceDrop": "Price dropped {{amount}}", "cars.notAvailable": "No longer available" },
  ar: { "cars.priceDrop": "انخفض السعر {{amount}}", "cars.notAvailable": "لم تعد متاحة" },
  es: { "cars.priceDrop": "Bajó de precio {{amount}}", "cars.notAvailable": "Ya no disponible" },
  fr: { "cars.priceDrop": "Prix en baisse {{amount}}", "cars.notAvailable": "Plus disponible" },
};

for (const locale of ["en", "ar", "es", "fr"]) {
  patch(locale, "listings", LISTINGS[locale]);
  patch(locale, "common", COMMON[locale]);
  patch(locale, "saved", SAVED_ALIASES[locale]);
}

console.log("component keys backfilled: listings.save/compare, common.compareTray/saveSearch, saved.cars aliases");
