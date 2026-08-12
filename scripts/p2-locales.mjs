/**
 * Writes the P2 catalogue keys for all four locales in one pass:
 *   - public/locales/<l>/messages.json  (new namespace, chat UI)
 *   - detail.json contact.* additions   (reveal-on-interaction copy)
 *   - common.json nav additions         (messages/notifications entries)
 *
 * Re-runnable: merges into existing files, never clobbers unrelated keys.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES = ['en', 'ar', 'es', 'fr'];
const ROOT = join(process.cwd(), 'public', 'locales');

const MESSAGES = {
  en: {
    meta: { title: 'Messages — Carsens' },
    heading: 'Messages',
    loading: 'Loading…',
    safety:
      'Keep the conversation on Carsens. Never send money or share bank details before you have seen the car in person.',
    status: { live: 'Live', offline: 'Reconnecting…' },
    list: {
      label: 'Conversations',
      noMessages: 'No messages yet',
      unreadCount: '{{count}} unread',
    },
    thread: {
      empty: 'No messages yet — say hello.',
      pickOne: 'Select a conversation to read it.',
      back: 'All conversations',
    },
    composer: {
      label: 'Write a message',
      placeholder: 'Write a message…',
      send: 'Send',
    },
    block: {
      action: 'Block',
      done: 'This person can no longer message you.',
      notice: 'Messaging is unavailable in this conversation.',
    },
    empty: {
      title: 'No conversations yet',
      hint: 'When you message a seller about a car, the conversation appears here.',
      cta: 'Browse cars',
    },
    errors: {
      loadFailed: 'Could not load your messages.',
      sendFailed: 'Message not sent — try again.',
      blocked: 'Messaging is unavailable between you and this person.',
      blockFailed: 'Could not block this person.',
    },
  },
  ar: {
    meta: { title: 'الرسائل — كارسنس' },
    heading: 'الرسائل',
    loading: 'جارٍ التحميل…',
    safety:
      'أبقِ المحادثة داخل كارسنس. لا ترسل أموالاً ولا تشارك بيانات بنكية قبل معاينة السيارة على الطبيعة.',
    status: { live: 'مباشر', offline: 'إعادة الاتصال…' },
    list: {
      label: 'المحادثات',
      noMessages: 'لا توجد رسائل بعد',
      unreadCount: '{{count}} غير مقروءة',
    },
    thread: {
      empty: 'لا توجد رسائل بعد — ابدأ بالتحية.',
      pickOne: 'اختر محادثة لقراءتها.',
      back: 'كل المحادثات',
    },
    composer: {
      label: 'اكتب رسالة',
      placeholder: 'اكتب رسالة…',
      send: 'إرسال',
    },
    block: {
      action: 'حظر',
      done: 'لم يعد بإمكان هذا الشخص مراسلتك.',
      notice: 'المراسلة غير متاحة في هذه المحادثة.',
    },
    empty: {
      title: 'لا توجد محادثات بعد',
      hint: 'عند مراسلة بائع بخصوص سيارة، ستظهر المحادثة هنا.',
      cta: 'تصفح السيارات',
    },
    errors: {
      loadFailed: 'تعذّر تحميل رسائلك.',
      sendFailed: 'لم تُرسل الرسالة — حاول مجدداً.',
      blocked: 'المراسلة غير متاحة بينك وبين هذا الشخص.',
      blockFailed: 'تعذّر حظر هذا الشخص.',
    },
  },
  es: {
    meta: { title: 'Mensajes — Carsens' },
    heading: 'Mensajes',
    loading: 'Cargando…',
    safety:
      'Mantén la conversación en Carsens. Nunca envíes dinero ni compartas datos bancarios antes de ver el coche en persona.',
    status: { live: 'En vivo', offline: 'Reconectando…' },
    list: {
      label: 'Conversaciones',
      noMessages: 'Aún no hay mensajes',
      unreadCount: '{{count}} sin leer',
    },
    thread: {
      empty: 'Aún no hay mensajes: saluda.',
      pickOne: 'Selecciona una conversación para leerla.',
      back: 'Todas las conversaciones',
    },
    composer: {
      label: 'Escribe un mensaje',
      placeholder: 'Escribe un mensaje…',
      send: 'Enviar',
    },
    block: {
      action: 'Bloquear',
      done: 'Esta persona ya no puede escribirte.',
      notice: 'La mensajería no está disponible en esta conversación.',
    },
    empty: {
      title: 'Aún no hay conversaciones',
      hint: 'Cuando escribas a un vendedor sobre un coche, la conversación aparecerá aquí.',
      cta: 'Ver coches',
    },
    errors: {
      loadFailed: 'No se pudieron cargar tus mensajes.',
      sendFailed: 'Mensaje no enviado: inténtalo de nuevo.',
      blocked: 'La mensajería no está disponible entre tú y esta persona.',
      blockFailed: 'No se pudo bloquear a esta persona.',
    },
  },
  fr: {
    meta: { title: 'Messages — Carsens' },
    heading: 'Messages',
    loading: 'Chargement…',
    safety:
      "Gardez la conversation sur Carsens. N'envoyez jamais d'argent et ne partagez pas vos coordonnées bancaires avant d'avoir vu la voiture.",
    status: { live: 'En direct', offline: 'Reconnexion…' },
    list: {
      label: 'Conversations',
      noMessages: 'Pas encore de messages',
      unreadCount: '{{count}} non lus',
    },
    thread: {
      empty: 'Pas encore de messages — dites bonjour.',
      pickOne: 'Sélectionnez une conversation pour la lire.',
      back: 'Toutes les conversations',
    },
    composer: {
      label: 'Écrire un message',
      placeholder: 'Écrivez un message…',
      send: 'Envoyer',
    },
    block: {
      action: 'Bloquer',
      done: 'Cette personne ne peut plus vous écrire.',
      notice: "La messagerie n'est pas disponible dans cette conversation.",
    },
    empty: {
      title: 'Pas encore de conversations',
      hint: "Lorsque vous écrivez à un vendeur, la conversation apparaît ici.",
      cta: 'Voir les voitures',
    },
    errors: {
      loadFailed: 'Impossible de charger vos messages.',
      sendFailed: 'Message non envoyé — réessayez.',
      blocked: "La messagerie n'est pas disponible entre vous et cette personne.",
      blockFailed: 'Impossible de bloquer cette personne.',
    },
  },
};

// detail.json — contact.* replaces the "coming soon" placeholder copy.
const DETAIL_CONTACT = {
  en: {
    chat: 'Chat',
    call: 'Call',
    showNumber: 'Show number',
    whatsapp: 'WhatsApp the seller',
    noPhone: 'This seller has not added a phone number — use chat instead.',
    revealFailed: 'Could not load the number. Try again.',
    chatFailed: 'Could not open the conversation.',
  },
  ar: {
    chat: 'محادثة',
    call: 'اتصال',
    showNumber: 'إظهار الرقم',
    whatsapp: 'واتساب البائع',
    noPhone: 'لم يُضِف البائع رقم هاتف — استخدم المحادثة.',
    revealFailed: 'تعذّر تحميل الرقم. حاول مجدداً.',
    chatFailed: 'تعذّر فتح المحادثة.',
  },
  es: {
    chat: 'Chat',
    call: 'Llamar',
    showNumber: 'Ver número',
    whatsapp: 'WhatsApp al vendedor',
    noPhone: 'Este vendedor no añadió teléfono: usa el chat.',
    revealFailed: 'No se pudo cargar el número. Inténtalo de nuevo.',
    chatFailed: 'No se pudo abrir la conversación.',
  },
  fr: {
    chat: 'Chat',
    call: 'Appeler',
    showNumber: 'Afficher le numéro',
    whatsapp: 'WhatsApp au vendeur',
    noPhone: "Ce vendeur n'a pas ajouté de numéro — utilisez le chat.",
    revealFailed: 'Impossible de charger le numéro. Réessayez.',
    chatFailed: "Impossible d'ouvrir la conversation.",
  },
};

const COMMON_NAV = {
  en: { messages: 'Messages', notifications: 'Notifications', myListings: 'My listings' },
  ar: { messages: 'الرسائل', notifications: 'الإشعارات', myListings: 'إعلاناتي' },
  es: { messages: 'Mensajes', notifications: 'Notificaciones', myListings: 'Mis anuncios' },
  fr: { messages: 'Messages', notifications: 'Notifications', myListings: 'Mes annonces' },
};

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {});
const writeJson = (file, data) =>
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

/** Deep-merge that lets the incoming value win on conflicts. */
const merge = (base, extra) => {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    out[k] =
      v && typeof v === 'object' && !Array.isArray(v)
        ? merge(base?.[k] ?? {}, v)
        : v;
  }
  return out;
};

for (const locale of LOCALES) {
  const dir = join(ROOT, locale);

  writeJson(join(dir, 'messages.json'), MESSAGES[locale]);

  const detailFile = join(dir, 'detail.json');
  const detail = readJson(detailFile);
  // Drop the placeholder key so a stale "coming soon" string cannot resurface.
  if (detail.contact) delete detail.contact.comingSoon;
  writeJson(detailFile, merge(detail, { contact: DETAIL_CONTACT[locale] }));

  const commonFile = join(dir, 'common.json');
  const common = readJson(commonFile);
  writeJson(commonFile, merge(common, { nav: COMMON_NAV[locale] }));
}

console.log(`wrote messages.json + detail.contact + common.nav for ${LOCALES.join(', ')}`);
