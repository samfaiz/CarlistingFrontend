/**
 * Row and group labels for the compare table.
 *
 * Spec rows carry their own locale bag from the taxonomy (`labelI18n`), which
 * is data, not UI copy — a field the schema gains tomorrow is labelled without
 * a catalogue entry. Basic rows are platform vocabulary, so they resolve
 * through the `compare` catalogue first. The canonical English name the API
 * sends is the last resort, never the first.
 */
import { useCallback } from "react";
import { useTranslation } from "next-i18next/pages";
import { formatPrice } from "@/lib/format";

export interface LabelledRow {
  key: string;
  group: string;
  label: string;
  labelI18n: Record<string, string> | null;
  unit?: string | null;
  kind?: "basic" | "spec";
}

export interface LabelledGroup {
  key: string;
  label: string;
  labelI18n: Record<string, string> | null;
}

/** Rows whose stored value is an enum the catalogue can name. */
const ENUM_ROWS = new Set([
  "condition",
  "regionalSpec",
  "transmission",
  "fuelType",
  "sellerType",
  "negotiable",
  "dealRating",
]);

const MONEY_ROWS = new Set(["price", "marketMedian"]);

export function useCompareLabels(locale: string) {
  const { t } = useTranslation("compare");

  const rowLabel = useCallback(
    (row: LabelledRow): string => {
      const fromData = row.labelI18n?.[locale];
      if (fromData) return fromData;
      const fromCatalogue = t(`rows.${row.key}`, { defaultValue: "" });
      if (fromCatalogue) return fromCatalogue;
      return row.label;
    },
    [locale, t],
  );

  const groupLabel = useCallback(
    (group: LabelledGroup): string => {
      const fromData = group.labelI18n?.[locale];
      if (fromData) return fromData;
      const fromCatalogue = t(`groups.${group.key}`, { defaultValue: "" });
      if (fromCatalogue) return fromCatalogue;
      return group.label;
    },
    [locale, t],
  );

  /**
   * Presentation only — the value itself is never changed, so an unmapped enum
   * shows the raw stored value rather than an empty cell.
   */
  const rowValue = useCallback(
    (row: LabelledRow, value: string | null): string | null => {
      if (value === null) return null;
      // Spec rows carry their unit in the label ("Power (hp)"), the way a spec
      // sheet does — repeating it in every one of six narrow columns is noise.
      if (row.kind !== "basic") return value;
      if (MONEY_ROWS.has(row.key)) {
        const n = Number(value);
        return Number.isFinite(n) ? formatPrice(n, locale) : value;
      }
      if (row.key === "mileage") {
        const n = Number(value);
        return Number.isFinite(n)
          ? `${new Intl.NumberFormat(locale).format(n)} ${t("units.km")}`
          : value;
      }
      if (row.key === "engineCc") {
        const n = Number(value);
        return Number.isFinite(n)
          ? `${new Intl.NumberFormat(locale).format(n)} ${t("units.cc")}`
          : value;
      }
      if (row.key === "listedOn") {
        const d = new Date(value);
        return Number.isNaN(d.getTime())
          ? value
          : new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
      }
      if (ENUM_ROWS.has(row.key))
        return t(`values.${row.key}.${value}`, { defaultValue: value });
      return value;
    },
    [locale, t],
  );

  return { rowLabel, groupLabel, rowValue };
}
