/**
 * Compare v2 catalogue keys (task P2-06) merged into compare.json for all four
 * locales: score panel, quiz, share, model columns, plus labels for the spec
 * groups and comparable rows the backend returns by key.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES = ['en', 'ar', 'es', 'fr'];
const ROOT = join(process.cwd(), 'public', 'locales');

const ADDITIONS = {
  en: {
    sharedNotice: 'You are viewing a shared comparison. Prices are always current.',
    loading: 'Building the comparison…',
    groups: {
      basics: 'Basics',
      engine_performance: 'Engine & performance',
      dimensions_capacity: 'Dimensions & capacity',
      exterior_interior: 'Exterior & interior',
      safety_technology: 'Safety & technology',
    },
    rows: {
      price: 'Price',
      year: 'Year',
      mileage: 'Mileage',
      condition: 'Condition',
      regionalSpec: 'Regional spec',
      transmission: 'Transmission',
      fuelType: 'Fuel',
      bodyType: 'Body type',
      emirate: 'Location',
      sellerType: 'Seller',
    },
    score: {
      label: 'Match score',
      best: 'Best match',
      personalised: 'Scored against your priorities from the quiz.',
      defaultWeights:
        'Scored with every priority weighted equally — take the quiz to make it personal.',
    },
    share: {
      button: 'Share',
      copied: 'Share link copied.',
      failed: 'Could not create a share link.',
    },
    quiz: {
      open: 'Find my match',
      title: 'Find your match',
      intro: 'Five quick questions. We rank the cars against what matters to you.',
      budget: 'Maximum budget (AED)',
      seats: 'Minimum seats',
      usage: 'How will you use it?',
      usageOptions: {
        city: 'City driving',
        family: 'Family',
        offroad: 'Off-road',
        longDistance: 'Long distance',
      },
      priorities: 'Rank what matters most',
      prioritiesHint: 'Move your top priority to the first position.',
      priorityLabels: {
        price: 'Price',
        fuelEconomy: 'Running costs',
        performance: 'Performance',
        space: 'Space',
        tech: 'Technology',
        resale: 'Resale value',
      },
      moveUp: 'Move {{item}} up',
      moveDown: 'Move {{item}} down',
      submit: 'Show my matches',
      cancel: 'Cancel',
      applied: 'Comparison re-scored against your priorities.',
      failed: 'Could not run the quiz. Try again.',
      suggestionsTitle: 'Suggested for you — tap to add to the comparison',
    },
    table: {
      rowHeader: 'Specification',
      winner: 'best in this row',
      modelColumn: '{{count}} for sale now',
      noValue: '—',
    },
    errors: {
      buildFailed: 'Could not build the comparison. Try again.',
      sharedMissing: 'This shared comparison is no longer available.',
      addFailed: 'Could not add that car.',
    },
  },
  ar: {
    sharedNotice: 'أنت تشاهد مقارنة مُشارَكة. الأسعار محدّثة دائماً.',
    loading: 'جارٍ بناء المقارنة…',
    groups: {
      basics: 'الأساسيات',
      engine_performance: 'المحرك والأداء',
      dimensions_capacity: 'الأبعاد والسعة',
      exterior_interior: 'الخارج والداخل',
      safety_technology: 'الأمان والتقنية',
    },
    rows: {
      price: 'السعر',
      year: 'السنة',
      mileage: 'المسافة المقطوعة',
      condition: 'الحالة',
      regionalSpec: 'المواصفات الإقليمية',
      transmission: 'ناقل الحركة',
      fuelType: 'الوقود',
      bodyType: 'نوع الهيكل',
      emirate: 'الموقع',
      sellerType: 'البائع',
    },
    score: {
      label: 'درجة التوافق',
      best: 'الأنسب لك',
      personalised: 'التقييم مبني على أولوياتك من الاختبار.',
      defaultWeights: 'التقييم يعطي كل الأولويات وزناً متساوياً — أجرِ الاختبار لتخصيصه.',
    },
    share: {
      button: 'مشاركة',
      copied: 'تم نسخ رابط المشاركة.',
      failed: 'تعذّر إنشاء رابط المشاركة.',
    },
    quiz: {
      open: 'اعثر على الأنسب لي',
      title: 'اعثر على السيارة الأنسب',
      intro: 'خمسة أسئلة سريعة، ثم نرتّب السيارات حسب ما يهمك.',
      budget: 'أقصى ميزانية (درهم)',
      seats: 'أقل عدد مقاعد',
      usage: 'كيف ستستخدمها؟',
      usageOptions: {
        city: 'قيادة داخل المدينة',
        family: 'عائلية',
        offroad: 'طرق وعرة',
        longDistance: 'مسافات طويلة',
      },
      priorities: 'رتّب ما يهمك أكثر',
      prioritiesHint: 'ضع أولويتك الأولى في المركز الأول.',
      priorityLabels: {
        price: 'السعر',
        fuelEconomy: 'تكاليف التشغيل',
        performance: 'الأداء',
        space: 'المساحة',
        tech: 'التقنية',
        resale: 'قيمة إعادة البيع',
      },
      moveUp: 'تحريك {{item}} للأعلى',
      moveDown: 'تحريك {{item}} للأسفل',
      submit: 'أظهر النتائج',
      cancel: 'إلغاء',
      applied: 'أُعيد تقييم المقارنة حسب أولوياتك.',
      failed: 'تعذّر تنفيذ الاختبار. حاول مجدداً.',
      suggestionsTitle: 'مقترحة لك — اضغط للإضافة إلى المقارنة',
    },
    table: {
      rowHeader: 'المواصفة',
      winner: 'الأفضل في هذا البند',
      modelColumn: '{{count}} معروضة للبيع الآن',
      noValue: '—',
    },
    errors: {
      buildFailed: 'تعذّر بناء المقارنة. حاول مجدداً.',
      sharedMissing: 'لم تعد هذه المقارنة المُشارَكة متاحة.',
      addFailed: 'تعذّرت إضافة هذه السيارة.',
    },
  },
  es: {
    sharedNotice: 'Estás viendo una comparación compartida. Los precios siempre están actualizados.',
    loading: 'Construyendo la comparación…',
    groups: {
      basics: 'Básicos',
      engine_performance: 'Motor y prestaciones',
      dimensions_capacity: 'Dimensiones y capacidad',
      exterior_interior: 'Exterior e interior',
      safety_technology: 'Seguridad y tecnología',
    },
    rows: {
      price: 'Precio',
      year: 'Año',
      mileage: 'Kilometraje',
      condition: 'Estado',
      regionalSpec: 'Especificación regional',
      transmission: 'Transmisión',
      fuelType: 'Combustible',
      bodyType: 'Carrocería',
      emirate: 'Ubicación',
      sellerType: 'Vendedor',
    },
    score: {
      label: 'Puntuación',
      best: 'La mejor opción',
      personalised: 'Puntuado según tus prioridades del cuestionario.',
      defaultWeights:
        'Puntuado con todas las prioridades por igual: haz el cuestionario para personalizarlo.',
    },
    share: {
      button: 'Compartir',
      copied: 'Enlace copiado.',
      failed: 'No se pudo crear el enlace.',
    },
    quiz: {
      open: 'Encontrar mi coche',
      title: 'Encuentra tu coche',
      intro: 'Cinco preguntas rápidas y ordenamos los coches según lo que te importa.',
      budget: 'Presupuesto máximo (AED)',
      seats: 'Plazas mínimas',
      usage: '¿Cómo lo usarás?',
      usageOptions: {
        city: 'Ciudad',
        family: 'Familia',
        offroad: 'Todoterreno',
        longDistance: 'Largas distancias',
      },
      priorities: 'Ordena lo que más te importa',
      prioritiesHint: 'Coloca tu prioridad principal en el primer puesto.',
      priorityLabels: {
        price: 'Precio',
        fuelEconomy: 'Costes de uso',
        performance: 'Prestaciones',
        space: 'Espacio',
        tech: 'Tecnología',
        resale: 'Valor de reventa',
      },
      moveUp: 'Subir {{item}}',
      moveDown: 'Bajar {{item}}',
      submit: 'Ver resultados',
      cancel: 'Cancelar',
      applied: 'Comparación recalculada según tus prioridades.',
      failed: 'No se pudo completar el cuestionario. Inténtalo de nuevo.',
      suggestionsTitle: 'Sugerencias para ti: toca para añadir a la comparación',
    },
    table: {
      rowHeader: 'Especificación',
      winner: 'mejor en esta fila',
      modelColumn: '{{count}} a la venta ahora',
      noValue: '—',
    },
    errors: {
      buildFailed: 'No se pudo construir la comparación. Inténtalo de nuevo.',
      sharedMissing: 'Esta comparación compartida ya no está disponible.',
      addFailed: 'No se pudo añadir ese coche.',
    },
  },
  fr: {
    sharedNotice: 'Vous consultez une comparaison partagée. Les prix sont toujours à jour.',
    loading: 'Construction de la comparaison…',
    groups: {
      basics: 'Essentiel',
      engine_performance: 'Moteur et performances',
      dimensions_capacity: 'Dimensions et capacité',
      exterior_interior: 'Extérieur et intérieur',
      safety_technology: 'Sécurité et technologie',
    },
    rows: {
      price: 'Prix',
      year: 'Année',
      mileage: 'Kilométrage',
      condition: 'État',
      regionalSpec: 'Spécification régionale',
      transmission: 'Boîte de vitesses',
      fuelType: 'Carburant',
      bodyType: 'Carrosserie',
      emirate: 'Emplacement',
      sellerType: 'Vendeur',
    },
    score: {
      label: 'Score',
      best: 'Meilleur choix',
      personalised: 'Noté selon vos priorités issues du questionnaire.',
      defaultWeights:
        'Noté avec toutes les priorités à poids égal — faites le questionnaire pour personnaliser.',
    },
    share: {
      button: 'Partager',
      copied: 'Lien copié.',
      failed: 'Impossible de créer le lien.',
    },
    quiz: {
      open: 'Trouver ma voiture',
      title: 'Trouvez votre voiture',
      intro: 'Cinq questions rapides, puis nous classons les voitures selon vos critères.',
      budget: 'Budget maximum (AED)',
      seats: 'Places minimum',
      usage: 'Quel usage ?',
      usageOptions: {
        city: 'En ville',
        family: 'Famille',
        offroad: 'Tout-terrain',
        longDistance: 'Longs trajets',
      },
      priorities: 'Classez vos priorités',
      prioritiesHint: 'Placez votre priorité principale en première position.',
      priorityLabels: {
        price: 'Prix',
        fuelEconomy: "Coûts d'usage",
        performance: 'Performances',
        space: 'Espace',
        tech: 'Technologie',
        resale: 'Valeur de revente',
      },
      moveUp: 'Monter {{item}}',
      moveDown: 'Descendre {{item}}',
      submit: 'Voir les résultats',
      cancel: 'Annuler',
      applied: 'Comparaison recalculée selon vos priorités.',
      failed: 'Le questionnaire a échoué. Réessayez.',
      suggestionsTitle: 'Suggestions pour vous — touchez pour ajouter à la comparaison',
    },
    table: {
      rowHeader: 'Caractéristique',
      winner: 'meilleur sur cette ligne',
      modelColumn: '{{count}} en vente actuellement',
      noValue: '—',
    },
    errors: {
      buildFailed: 'Impossible de construire la comparaison. Réessayez.',
      sharedMissing: "Cette comparaison partagée n'est plus disponible.",
      addFailed: "Impossible d'ajouter cette voiture.",
    },
  },
};

const readJson = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {});
const merge = (base, extra) => {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    out[k] =
      v && typeof v === 'object' && !Array.isArray(v) ? merge(base?.[k] ?? {}, v) : v;
  }
  return out;
};

for (const locale of LOCALES) {
  const file = join(ROOT, locale, 'compare.json');
  writeFileSync(file, `${JSON.stringify(merge(readJson(file), ADDITIONS[locale]), null, 2)}\n`, 'utf8');
}
console.log(`compare.json updated for ${LOCALES.join(', ')}`);
