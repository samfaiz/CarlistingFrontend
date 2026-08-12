/**
 * P2-05 catalogue keys: the new `account` namespace (my listings, notification
 * inbox + preference matrix, PDPL panel, unsubscribe) plus the hub links that
 * live under the existing `auth` namespace. Re-runnable; merges, never clobbers.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LOCALES = ['en', 'ar', 'es', 'fr'];
const ROOT = join(process.cwd(), 'public', 'locales');

const EVENTS = {
  en: {
    MESSAGE_RECEIVED: 'New message',
    LISTING_APPROVED: 'Listing approved',
    LISTING_REJECTED: 'Listing rejected',
    LISTING_EXPIRING: 'Listing expiring soon',
    SAVED_SEARCH_MATCH: 'New matches for a saved search',
    PRICE_DROP: 'Price drop on a saved car',
    NEW_LEAD: 'A buyer contacted you',
  },
  ar: {
    MESSAGE_RECEIVED: 'رسالة جديدة',
    LISTING_APPROVED: 'تمت الموافقة على الإعلان',
    LISTING_REJECTED: 'تم رفض الإعلان',
    LISTING_EXPIRING: 'الإعلان على وشك الانتهاء',
    SAVED_SEARCH_MATCH: 'نتائج جديدة لبحث محفوظ',
    PRICE_DROP: 'انخفاض سعر سيارة محفوظة',
    NEW_LEAD: 'تواصل معك مشترٍ',
  },
  es: {
    MESSAGE_RECEIVED: 'Mensaje nuevo',
    LISTING_APPROVED: 'Anuncio aprobado',
    LISTING_REJECTED: 'Anuncio rechazado',
    LISTING_EXPIRING: 'El anuncio caduca pronto',
    SAVED_SEARCH_MATCH: 'Nuevos resultados de una búsqueda guardada',
    PRICE_DROP: 'Bajada de precio en un coche guardado',
    NEW_LEAD: 'Un comprador te ha contactado',
  },
  fr: {
    MESSAGE_RECEIVED: 'Nouveau message',
    LISTING_APPROVED: 'Annonce approuvée',
    LISTING_REJECTED: 'Annonce refusée',
    LISTING_EXPIRING: "L'annonce expire bientôt",
    SAVED_SEARCH_MATCH: 'Nouveaux résultats pour une recherche enregistrée',
    PRICE_DROP: 'Baisse de prix sur une voiture enregistrée',
    NEW_LEAD: 'Un acheteur vous a contacté',
  },
};

const ACCOUNT = {
  en: {
    listings: {
      meta: { title: 'My listings — Carsens' },
      heading: 'My listings',
      total: '{{count}} listing',
      total_other: '{{count}} listings',
      filterLabel: 'Filter by status',
      filters: { all: 'All' },
      loading: 'Loading your listings…',
      published: 'published {{time}}',
      pagination: 'Pagination',
      prev: 'Previous',
      next: 'Next',
      pageOf: 'Page {{page}} of {{pages}}',
      empty: { title: 'You have no listings yet', cta: 'Sell your car' },
      actions: {
        pause: 'Pause',
        resume: 'Resume',
        sold: 'Mark sold',
        renew: 'Renew',
        paused: 'Listing paused.',
        resumed: 'Listing is live again.',
        markedSold: 'Marked as sold.',
        renewed: 'Listing renewed for another 60 days.',
      },
      errors: { load: 'Could not load your listings.', action: 'That action failed — try again.' },
    },
    notifications: {
      meta: { title: 'Notifications — Carsens' },
      heading: 'Notifications',
      loading: 'Loading…',
      markAllRead: 'Mark all read',
      empty: 'Nothing here yet.',
      events: EVENTS.en,
      prefs: {
        heading: 'What we notify you about',
        hint: 'Everything is on by default. Turn off anything you do not want.',
        event: 'Event',
        inApp: 'In app',
        email: 'Email',
        toggleLabel: '{{event}} — {{channel}}',
      },
      errors: { load: 'Could not load notifications.', save: 'Could not save that preference.' },
    },
    privacy: {
      heading: 'Your data',
      body: 'Download everything we hold about you, or close your account permanently.',
      export: 'Download my data',
      exportDone: 'Your data file has been downloaded.',
      exportFailed: 'Could not prepare your data. Try again.',
      delete: 'Delete my account',
      deleteTitle: 'Delete your account?',
      deleteWarning:
        'This removes your profile, saved cars, searches and alerts, and takes your listings offline. It cannot be undone.',
      confirmLabel: 'Type {{email}} to confirm',
      cancel: 'Cancel',
      deleteConfirm: 'Delete permanently',
      deleteDone: 'Your account has been closed.',
      deleteFailed: 'Could not delete the account. Check the email and try again.',
    },
    unsubscribe: {
      meta: { title: 'Unsubscribe — Carsens' },
      heading: 'Unsubscribe from emails',
      body: 'This turns off every notification email. You will still see notifications in the app.',
      confirm: 'Unsubscribe me',
      done: 'You are unsubscribed from notification emails.',
      doneHint: 'You can turn individual emails back on any time.',
      managePrefs: 'Manage notification settings',
      invalid: 'This unsubscribe link is not valid or has expired.',
      missingLink: 'Open this page from the link in your email.',
    },
  },
  ar: {
    listings: {
      meta: { title: 'إعلاناتي — كارسنس' },
      heading: 'إعلاناتي',
      total: '{{count}} إعلان',
      total_other: '{{count}} إعلانات',
      filterLabel: 'تصفية حسب الحالة',
      filters: { all: 'الكل' },
      loading: 'جارٍ تحميل إعلاناتك…',
      published: 'نُشر {{time}}',
      pagination: 'ترقيم الصفحات',
      prev: 'السابق',
      next: 'التالي',
      pageOf: 'صفحة {{page}} من {{pages}}',
      empty: { title: 'لا توجد لديك إعلانات بعد', cta: 'بِع سيارتك' },
      actions: {
        pause: 'إيقاف مؤقت',
        resume: 'استئناف',
        sold: 'تم البيع',
        renew: 'تجديد',
        paused: 'تم إيقاف الإعلان مؤقتاً.',
        resumed: 'عاد الإعلان للنشر.',
        markedSold: 'تم وضع علامة مُباع.',
        renewed: 'تم تجديد الإعلان لـ 60 يوماً أخرى.',
      },
      errors: { load: 'تعذّر تحميل إعلاناتك.', action: 'فشل هذا الإجراء — حاول مجدداً.' },
    },
    notifications: {
      meta: { title: 'الإشعارات — كارسنس' },
      heading: 'الإشعارات',
      loading: 'جارٍ التحميل…',
      markAllRead: 'تعليم الكل كمقروء',
      empty: 'لا يوجد شيء بعد.',
      events: EVENTS.ar,
      prefs: {
        heading: 'ما الذي نُشعرك به',
        hint: 'كل الإشعارات مفعّلة افتراضياً. أوقف ما لا ترغب به.',
        event: 'الحدث',
        inApp: 'داخل التطبيق',
        email: 'البريد',
        toggleLabel: '{{event}} — {{channel}}',
      },
      errors: { load: 'تعذّر تحميل الإشعارات.', save: 'تعذّر حفظ هذا التفضيل.' },
    },
    privacy: {
      heading: 'بياناتك',
      body: 'نزّل كل ما نحتفظ به عنك، أو أغلق حسابك نهائياً.',
      export: 'تنزيل بياناتي',
      exportDone: 'تم تنزيل ملف بياناتك.',
      exportFailed: 'تعذّر تجهيز بياناتك. حاول مجدداً.',
      delete: 'حذف حسابي',
      deleteTitle: 'حذف حسابك؟',
      deleteWarning:
        'سيؤدي هذا إلى إزالة ملفك الشخصي والسيارات والبحوث والتنبيهات المحفوظة، وسحب إعلاناتك. لا يمكن التراجع.',
      confirmLabel: 'اكتب {{email}} للتأكيد',
      cancel: 'إلغاء',
      deleteConfirm: 'حذف نهائي',
      deleteDone: 'تم إغلاق حسابك.',
      deleteFailed: 'تعذّر حذف الحساب. تحقق من البريد وحاول مجدداً.',
    },
    unsubscribe: {
      meta: { title: 'إلغاء الاشتراك — كارسنس' },
      heading: 'إلغاء الاشتراك من الرسائل',
      body: 'سيوقف هذا كل رسائل الإشعارات. ستظل ترى الإشعارات داخل التطبيق.',
      confirm: 'ألغِ اشتراكي',
      done: 'تم إلغاء اشتراكك في رسائل الإشعارات.',
      doneHint: 'يمكنك إعادة تفعيل أي منها في أي وقت.',
      managePrefs: 'إدارة إعدادات الإشعارات',
      invalid: 'رابط إلغاء الاشتراك غير صالح أو منتهي الصلاحية.',
      missingLink: 'افتح هذه الصفحة من الرابط الموجود في رسالتك.',
    },
  },
  es: {
    listings: {
      meta: { title: 'Mis anuncios — Carsens' },
      heading: 'Mis anuncios',
      total: '{{count}} anuncio',
      total_other: '{{count}} anuncios',
      filterLabel: 'Filtrar por estado',
      filters: { all: 'Todos' },
      loading: 'Cargando tus anuncios…',
      published: 'publicado {{time}}',
      pagination: 'Paginación',
      prev: 'Anterior',
      next: 'Siguiente',
      pageOf: 'Página {{page}} de {{pages}}',
      empty: { title: 'Aún no tienes anuncios', cta: 'Vende tu coche' },
      actions: {
        pause: 'Pausar',
        resume: 'Reanudar',
        sold: 'Marcar vendido',
        renew: 'Renovar',
        paused: 'Anuncio pausado.',
        resumed: 'El anuncio vuelve a estar activo.',
        markedSold: 'Marcado como vendido.',
        renewed: 'Anuncio renovado por 60 días más.',
      },
      errors: { load: 'No se pudieron cargar tus anuncios.', action: 'La acción falló: inténtalo de nuevo.' },
    },
    notifications: {
      meta: { title: 'Notificaciones — Carsens' },
      heading: 'Notificaciones',
      loading: 'Cargando…',
      markAllRead: 'Marcar todo como leído',
      empty: 'Aún no hay nada.',
      events: EVENTS.es,
      prefs: {
        heading: 'Qué te notificamos',
        hint: 'Todo está activado por defecto. Desactiva lo que no quieras.',
        event: 'Evento',
        inApp: 'En la app',
        email: 'Correo',
        toggleLabel: '{{event}} — {{channel}}',
      },
      errors: { load: 'No se pudieron cargar las notificaciones.', save: 'No se pudo guardar la preferencia.' },
    },
    privacy: {
      heading: 'Tus datos',
      body: 'Descarga todo lo que guardamos sobre ti o cierra tu cuenta definitivamente.',
      export: 'Descargar mis datos',
      exportDone: 'Se ha descargado el archivo con tus datos.',
      exportFailed: 'No se pudieron preparar tus datos. Inténtalo de nuevo.',
      delete: 'Eliminar mi cuenta',
      deleteTitle: '¿Eliminar tu cuenta?',
      deleteWarning:
        'Esto elimina tu perfil, coches guardados, búsquedas y alertas, y retira tus anuncios. No se puede deshacer.',
      confirmLabel: 'Escribe {{email}} para confirmar',
      cancel: 'Cancelar',
      deleteConfirm: 'Eliminar definitivamente',
      deleteDone: 'Tu cuenta se ha cerrado.',
      deleteFailed: 'No se pudo eliminar la cuenta. Revisa el correo e inténtalo de nuevo.',
    },
    unsubscribe: {
      meta: { title: 'Cancelar suscripción — Carsens' },
      heading: 'Cancelar los correos',
      body: 'Esto desactiva todos los correos de notificación. Seguirás viendo las notificaciones en la app.',
      confirm: 'Cancelar mi suscripción',
      done: 'Has cancelado la suscripción a los correos de notificación.',
      doneHint: 'Puedes reactivar cada correo cuando quieras.',
      managePrefs: 'Gestionar notificaciones',
      invalid: 'Este enlace no es válido o ha caducado.',
      missingLink: 'Abre esta página desde el enlace de tu correo.',
    },
  },
  fr: {
    listings: {
      meta: { title: 'Mes annonces — Carsens' },
      heading: 'Mes annonces',
      total: '{{count}} annonce',
      total_other: '{{count}} annonces',
      filterLabel: 'Filtrer par statut',
      filters: { all: 'Toutes' },
      loading: 'Chargement de vos annonces…',
      published: 'publiée {{time}}',
      pagination: 'Pagination',
      prev: 'Précédent',
      next: 'Suivant',
      pageOf: 'Page {{page}} sur {{pages}}',
      empty: { title: "Vous n'avez pas encore d'annonces", cta: 'Vendre ma voiture' },
      actions: {
        pause: 'Mettre en pause',
        resume: 'Reprendre',
        sold: 'Marquer vendue',
        renew: 'Renouveler',
        paused: 'Annonce mise en pause.',
        resumed: "L'annonce est de nouveau en ligne.",
        markedSold: 'Marquée comme vendue.',
        renewed: 'Annonce renouvelée pour 60 jours.',
      },
      errors: { load: 'Impossible de charger vos annonces.', action: "L'action a échoué — réessayez." },
    },
    notifications: {
      meta: { title: 'Notifications — Carsens' },
      heading: 'Notifications',
      loading: 'Chargement…',
      markAllRead: 'Tout marquer comme lu',
      empty: 'Rien pour le moment.',
      events: EVENTS.fr,
      prefs: {
        heading: 'Ce que nous vous notifions',
        hint: 'Tout est activé par défaut. Désactivez ce que vous ne souhaitez pas.',
        event: 'Événement',
        inApp: "Dans l'app",
        email: 'E-mail',
        toggleLabel: '{{event}} — {{channel}}',
      },
      errors: { load: 'Impossible de charger les notifications.', save: 'Impossible d’enregistrer ce réglage.' },
    },
    privacy: {
      heading: 'Vos données',
      body: 'Téléchargez tout ce que nous conservons sur vous, ou fermez définitivement votre compte.',
      export: 'Télécharger mes données',
      exportDone: 'Votre fichier de données a été téléchargé.',
      exportFailed: 'Impossible de préparer vos données. Réessayez.',
      delete: 'Supprimer mon compte',
      deleteTitle: 'Supprimer votre compte ?',
      deleteWarning:
        'Cela supprime votre profil, vos voitures enregistrées, recherches et alertes, et retire vos annonces. Action irréversible.',
      confirmLabel: 'Saisissez {{email}} pour confirmer',
      cancel: 'Annuler',
      deleteConfirm: 'Supprimer définitivement',
      deleteDone: 'Votre compte a été fermé.',
      deleteFailed: 'Impossible de supprimer le compte. Vérifiez l’e-mail et réessayez.',
    },
    unsubscribe: {
      meta: { title: 'Désabonnement — Carsens' },
      heading: 'Se désabonner des e-mails',
      body: "Cela désactive tous les e-mails de notification. Vous verrez toujours les notifications dans l'app.",
      confirm: 'Me désabonner',
      done: 'Vous êtes désabonné des e-mails de notification.',
      doneHint: 'Vous pouvez les réactiver individuellement à tout moment.',
      managePrefs: 'Gérer les notifications',
      invalid: "Ce lien de désabonnement n'est pas valide ou a expiré.",
      missingLink: 'Ouvrez cette page depuis le lien de votre e-mail.',
    },
  },
};

// The hub links live on /account, which reads the `auth` namespace.
const AUTH_SECTIONS = {
  en: {
    sectionsLabel: 'Account sections',
    sections: {
      myListings: 'My listings',
      messages: 'Messages',
      saved: 'Saved cars & searches',
      notifications: 'Notifications',
    },
  },
  ar: {
    sectionsLabel: 'أقسام الحساب',
    sections: {
      myListings: 'إعلاناتي',
      messages: 'الرسائل',
      saved: 'السيارات والبحوث المحفوظة',
      notifications: 'الإشعارات',
    },
  },
  es: {
    sectionsLabel: 'Secciones de la cuenta',
    sections: {
      myListings: 'Mis anuncios',
      messages: 'Mensajes',
      saved: 'Coches y búsquedas guardados',
      notifications: 'Notificaciones',
    },
  },
  fr: {
    sectionsLabel: 'Sections du compte',
    sections: {
      myListings: 'Mes annonces',
      messages: 'Messages',
      saved: 'Voitures et recherches enregistrées',
      notifications: 'Notifications',
    },
  },
};

const readJson = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {});
const writeJson = (f, d) => writeFileSync(f, `${JSON.stringify(d, null, 2)}\n`, 'utf8');
const merge = (base, extra) => {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    out[k] =
      v && typeof v === 'object' && !Array.isArray(v) ? merge(base?.[k] ?? {}, v) : v;
  }
  return out;
};

for (const locale of LOCALES) {
  const dir = join(ROOT, locale);
  const accountFile = join(dir, 'account.json');
  writeJson(accountFile, merge(readJson(accountFile), ACCOUNT[locale]));

  const authFile = join(dir, 'auth.json');
  const auth = readJson(authFile);
  writeJson(authFile, merge(auth, { account: AUTH_SECTIONS[locale] }));
}

console.log(`wrote account.json + auth.account.sections for ${LOCALES.join(', ')}`);
