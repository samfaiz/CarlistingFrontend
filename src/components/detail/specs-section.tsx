/**
 * Specifications section (P1-07): renders specsSnapshot.groups verbatim as
 * stacked Cards per group (mockup treatment; scales to any group count where
 * Tabs would overflow). Group/field names prefer the payload's own i18n map
 * for the viewer locale. Low-confidence fields carry an amber dot + tooltip.
 */
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SpecGroups } from "@/lib/marketplace-api";

export interface SpecsSectionProps {
  snapshot: SpecGroups;
}

export function SpecsSection({ snapshot }: SpecsSectionProps) {
  const { t } = useTranslation("detail");
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale ?? "en";

  return (
    <section aria-labelledby="specs-heading" className="flex flex-col gap-4">
      <h2 id="specs-heading" className="text-xl font-bold text-ink">
        {t("specs.heading")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {snapshot.groups.map((group) => (
          <Card key={group.key}>
            <CardHeader className="pb-2">
              <CardTitle>{group.i18n?.[locale] ?? group.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col divide-y divide-divider">
                {group.fields.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-baseline justify-between gap-3 py-1.5"
                  >
                    <dt className="flex items-center gap-1.5 text-sm text-muted-strong">
                      {field.i18n?.[locale] ?? field.name}
                      {field.confidence === "LOW" && (
                        <span
                          className="inline-flex"
                          title={t("specs.lowConfidence")}
                        >
                          <span
                            className="size-2 shrink-0 rounded-full bg-warning"
                            aria-hidden
                          />
                          <span className="sr-only">{t("specs.lowConfidence")}</span>
                        </span>
                      )}
                    </dt>
                    <dd className="text-end text-sm font-semibold text-ink">
                      {field.value}
                      {field.unit ? ` ${field.unit}` : ""}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
