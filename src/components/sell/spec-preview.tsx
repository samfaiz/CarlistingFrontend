/**
 * FR-VS3 auto-fill panel (task P1-02) — the "wow moment" of step 1.
 *
 * When trim + year resolve to a TrimSpec, the full grouped spec sheet renders
 * read-only inside a SurfaceCard with a per-field confidence dot. While the
 * lookup runs a lightweight skeleton keeps the panel area stable so the
 * reveal feels instant rather than causing layout jumps.
 */
import { Search, Sparkles } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { SurfaceCard } from "@/components/ui/card";
import type { SpecGroups } from "@/lib/marketplace-api";
import { cn } from "@/lib/utils";
import { localizedName } from "./types";

export type SpecLookupState = "idle" | "loading" | "found" | "missing";

const CONFIDENCE_DOT: Record<string, string> = {
  HIGH: "bg-success",
  MEDIUM: "bg-warning",
  LOW: "bg-danger",
};

export function SpecPreview({
  state,
  spec,
  locale,
}: {
  state: SpecLookupState;
  spec: SpecGroups | null;
  locale: string;
}) {
  const { t } = useTranslation("sell");

  if (state === "idle") return null;

  if (state === "loading") {
    return (
      <SurfaceCard className="p-4 sm:p-5" aria-busy>
        <p className="flex items-center gap-2 text-sm font-semibold text-brand">
          <Sparkles className="size-4 animate-pulse" aria-hidden />
          {t("autofill.loading")}
        </p>
        <div className="mt-3 flex flex-col gap-2" aria-hidden>
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-brand-light" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-brand-light" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-brand-light" />
        </div>
      </SurfaceCard>
    );
  }

  if (state === "missing" || !spec) {
    return (
      <SurfaceCard className="p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-ink">
          <Search className="size-4 text-brand" aria-hidden />
          {t("autofill.notFoundTitle")}
        </p>
        <p className="mt-1 text-sm text-muted">{t("autofill.notFoundBody")}</p>
        {/* Placeholder — the missing-trim request flow ships with P1-03. */}
        <span
          aria-disabled
          className="mt-2 inline-block cursor-not-allowed text-sm font-semibold text-brand-mid opacity-70"
        >
          {t("autofill.requestLink")}
        </span>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-brand">
        <Sparkles className="size-4" aria-hidden />
        {t("autofill.title")}
      </p>
      <p className="mt-1 text-sm text-muted">{t("autofill.subtitle")}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {spec.groups.map((group) => (
          <section key={group.key}>
            <h4 className="text-xs font-bold uppercase tracking-wide text-brand">
              {localizedName(group, locale)}
            </h4>
            <dl className="mt-2 flex flex-col gap-1.5">
              {group.fields.map((field) => (
                <div
                  key={field.key}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <dt className="flex items-center gap-1.5 text-muted">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        CONFIDENCE_DOT[field.confidence] ?? "bg-line",
                      )}
                      title={t(`autofill.confidence.${field.confidence}`, {
                        defaultValue: field.confidence,
                      })}
                      aria-hidden
                    />
                    <span className="sr-only">
                      {t(`autofill.confidence.${field.confidence}`, {
                        defaultValue: field.confidence,
                      })}
                      {": "}
                    </span>
                    {localizedName(field, locale)}
                  </dt>
                  <dd className="text-end font-semibold text-ink">
                    {field.value}
                    {field.unit ? ` ${field.unit}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </SurfaceCard>
  );
}
