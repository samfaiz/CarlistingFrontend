/**
 * The full specification sheet on a car page.
 *
 * What it replaced rendered `listing.specsSnapshot.groups` and nothing else,
 * so a car without a snapshot — which is nearly all of them — showed no
 * specifications at all, with no indication that a spec section existed.
 *
 * Three deliberate choices:
 *
 * 1. A field with no value renders "Not specified", never "No". Blank means
 *    nobody has told us; "No" means the car does not have it. Printing the
 *    second when we mean the first is a claim about someone's car that we
 *    cannot support.
 * 2. Groups marked "advanced" start collapsed. Ninety rows opened at once
 *    buries the engine under the fender vents.
 * 3. A value the seller entered is marked as theirs. Trim data describes a
 *    model; a correction describes this specific car, and a buyer is entitled
 *    to know which they are reading.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { ChevronDown } from "lucide-react";
import type { SpecSheet as SpecSheetData, SpecSheetGroup } from "@/lib/marketplace-api";

/** Locale-keyed labels from the database beat the shipped catalogue copy. */
function localised(
  i18n: Record<string, string> | null,
  fallback: string,
  locale: string,
): string {
  if (i18n && typeof i18n === "object") {
    const hit = i18n[locale] ?? i18n[locale.split("-")[0]];
    if (typeof hit === "string" && hit.trim()) return hit;
  }
  return fallback;
}

function SpecGroup({
  group,
  custom,
  locale,
  t,
}: {
  group: SpecSheetGroup;
  custom: { label: string; value: string }[];
  locale: string;
  t: (k: string, o?: Record<string, unknown>) => string;
}) {
  const [open, setOpen] = React.useState(group.tier !== "advanced");
  const known = group.fields.filter((f) => f.value !== null).length + custom.length;
  const panelId = `spec-group-${group.key}`;

  return (
    <div className="spec-group">
      <button
        type="button"
        className="spec-group-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <h3>{localised(group.i18n, group.name, locale)}</h3>
        <span className="spec-group-count">
          {t("specs.filledCount", {
            filled: known,
            total: group.fields.length + custom.length,
          })}
        </span>
        <ChevronDown
          className={open ? "spec-chevron spec-chevron-open" : "spec-chevron"}
          aria-hidden
        />
      </button>

      {open && (
        <div className="spec-table" id={panelId}>
          {group.fields.map((f) => (
            <div className="spec-row" key={f.key}>
              <span>{localised(f.i18n, f.name, locale)}</span>
              <span className={f.value === null ? "spec-value-empty" : undefined}>
                {f.value === null ? (
                  t("specs.notSpecified")
                ) : (
                  <>
                    {f.value}
                    {f.unit ? ` ${f.unit}` : ""}
                    {f.source === "SELLER" && (
                      <span className="spec-by-seller" title={t("specs.bySellerHint")}>
                        {t("specs.bySeller")}
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          ))}
          {custom.map((c) => (
            <div className="spec-row" key={`custom-${c.label}`}>
              <span>{c.label}</span>
              <span>
                {c.value}
                <span className="spec-by-seller" title={t("specs.bySellerHint")}>
                  {t("specs.bySeller")}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SpecSheet({ sheet }: { sheet: SpecSheetData | null }) {
  const { t, i18n } = useTranslation("mk-detail");
  const locale = i18n.language ?? "en";

  if (!sheet || sheet.groups.length === 0) return null;

  // Custom rows name the group they belong to; anything naming a group that no
  // longer exists still has to render, so it falls through to a group of its own
  // rather than vanishing.
  const groupKeys = new Set(sheet.groups.map((g) => g.key));
  const orphanCustom = sheet.custom.filter((c) => !groupKeys.has(c.group));

  return (
    <div className="detail-section">
      <div className="spec-head">
        <h2>{t("specs.title")}</h2>
        <span className="spec-coverage">
          {t("specs.coverage", { filled: sheet.filled, total: sheet.total })}
        </span>
      </div>

      {!sheet.matched && (
        <p className="spec-nodata">{t("specs.noTrimData")}</p>
      )}

      {sheet.groups.map((g) => (
        <SpecGroup
          key={g.key}
          group={g}
          custom={sheet.custom.filter((c) => c.group === g.key)}
          locale={locale}
          t={t}
        />
      ))}

      {orphanCustom.length > 0 && (
        <SpecGroup
          group={{
            key: "additional",
            name: t("specs.additional"),
            i18n: null,
            tier: "basic",
            fields: [],
          }}
          custom={orphanCustom}
          locale={locale}
          t={t}
        />
      )}
    </div>
  );
}
