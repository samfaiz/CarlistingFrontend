/**
 * Description section (P1-07): picks the viewer-locale description, falls back
 * to English, then to whatever exists. Descriptions whose source is an AI
 * translation (anything non-USER containing "AI") get the "auto-translated"
 * badge — the AI translation pipeline itself arrives later (P2+).
 */
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ListingDescription } from "@/lib/marketplace-api";

export interface DescriptionSectionProps {
  descriptions: ListingDescription[];
}

export function pickDescription(
  descriptions: ListingDescription[],
  locale: string,
): ListingDescription | null {
  return (
    descriptions.find((d) => d.locale === locale) ??
    descriptions.find((d) => d.locale === "en") ??
    descriptions[0] ??
    null
  );
}

export function DescriptionSection({ descriptions }: DescriptionSectionProps) {
  const { t } = useTranslation("detail");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  const chosen = pickDescription(descriptions, locale);
  if (!chosen) return null;

  const isAutoTranslated = chosen.source.toUpperCase().includes("AI");

  return (
    <section aria-labelledby="description-heading" className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 id="description-heading" className="text-xl font-bold text-ink">
          {t("description.heading")}
        </h2>
        {isAutoTranslated && (
          <Badge variant="neutral">{t("description.autoTranslated")}</Badge>
        )}
      </div>
      <Card className="p-4 sm:p-5">
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-strong">
          {chosen.text}
        </p>
      </Card>
    </section>
  );
}
