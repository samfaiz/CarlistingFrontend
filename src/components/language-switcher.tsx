import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Locale display names are endonyms (proper nouns), intentionally identical in
 * every locale — they are not UI copy and therefore live outside the catalogs.
 */
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ar: "العربية",
  es: "Español",
  fr: "Français",
};

const NEXT_LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year, in seconds

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const activeLocale = router.locale ?? router.defaultLocale ?? "en";
  const locales = router.locales ?? [activeLocale];

  const handleChange = (nextLocale: string) => {
    if (nextLocale === activeLocale) return;
    // Persist the preference so Next's locale detection honours it on the next visit.
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${NEXT_LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    void router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: nextLocale },
    );
  };

  return (
    <Select value={activeLocale} onValueChange={handleChange}>
      <SelectTrigger
        aria-label={t("language.switcherLabel")}
        className={cn("w-44", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {LOCALE_NAMES[locale] ?? locale}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
