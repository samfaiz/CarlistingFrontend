/**
 * The specification step of the sell wizard.
 *
 * The wizard used to capture whatever the trim happened to carry and nothing
 * else, so a car whose trim held 25 of the catalogue's 90 fields could never
 * be listed with more than 25 — the seller was never shown the other 65.
 *
 * Two rules shape what gets submitted:
 *
 * 1. **Only differences are sent.** A field left exactly as the trim filled it
 *    is not an override. Sending it would freeze today's trim data onto the
 *    listing as if the seller had asserted it, and a later correction to the
 *    catalogue would never reach this car.
 * 2. **Clearing a field is an edit, not a no-op.** Emptying an auto-filled box
 *    submits null, which is the seller saying "mine does not have this". That
 *    is the only way to remove a wrong trim value, so it cannot be treated the
 *    same as never touching the field.
 */
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { ChevronDown, Plus, RotateCcw, X } from "lucide-react";
import {
  getSpecSheetForTrim,
  type SpecSheet,
  type SpecSheetField,
} from "@/lib/marketplace-api";

export interface SpecStepValue {
  specOverrides: Record<string, string | null>;
  customSpecs: { label: string; value: string; group: string }[];
}

const EMPTY: SpecStepValue = { specOverrides: {}, customSpecs: [] };

export function SpecStep({
  vehicleType,
  trimId,
  year,
  regionalSpec,
  value,
  onChange,
  onSheetLoaded,
}: {
  vehicleType: string;
  trimId: string;
  year: string;
  regionalSpec: string;
  value: SpecStepValue;
  onChange: (next: SpecStepValue) => void;
  /**
   * The loaded catalogue, handed up so the page can describe the car from what
   * the seller actually entered. Without it the AI draft only ever saw six
   * fields and could not mention the sunroof the seller had just ticked.
   */
  onSheetLoaded?: (sheet: SpecSheet | null) => void;
}) {
  const { t } = useTranslation("mk-sell");
  const [sheet, setSheet] = React.useState<SpecSheet | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  // Reloads whenever the identity of the car changes: a different trim or year
  // is a different factory sheet, and keeping the old one would attribute one
  // car's specs to another.
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSpecSheetForTrim({
      vehicleType,
      trimId: trimId || undefined,
      year: year ? Number(year) : undefined,
      regionalSpec: regionalSpec || undefined,
    })
      .then((next) => {
        if (cancelled) return;
        setSheet(next);
        onSheetLoaded?.(next);
      })
      .catch(() => {
        if (cancelled) return;
        setSheet(null);
        onSheetLoaded?.(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // onSheetLoaded is deliberately out of the deps: it is a fresh closure on
    // every parent render, and including it would refetch the sheet in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType, trimId, year, regionalSpec]);

  /** What the box shows: the seller's edit if there is one, else the trim. */
  const shown = (f: SpecSheetField): string => {
    if (Object.prototype.hasOwnProperty.call(value.specOverrides, f.key)) {
      return value.specOverrides[f.key] ?? "";
    }
    return f.value ?? "";
  };

  const edited = (f: SpecSheetField) =>
    Object.prototype.hasOwnProperty.call(value.specOverrides, f.key);

  const setField = (f: SpecSheetField, next: string) => {
    const overrides = { ...value.specOverrides };
    const trimmed = next.trim();

    // Back to exactly what the trim says means "not an override any more".
    if (trimmed === (f.value ?? "").trim()) {
      delete overrides[f.key];
    } else {
      overrides[f.key] = trimmed === "" ? null : trimmed;
    }
    onChange({ ...value, specOverrides: overrides });
  };

  const revert = (f: SpecSheetField) => {
    const overrides = { ...value.specOverrides };
    delete overrides[f.key];
    onChange({ ...value, specOverrides: overrides });
  };

  const addCustom = () =>
    onChange({
      ...value,
      customSpecs: [
        ...value.customSpecs,
        { label: "", value: "", group: "additional" },
      ],
    });

  const setCustom = (i: number, patch: Partial<{ label: string; value: string }>) =>
    onChange({
      ...value,
      customSpecs: value.customSpecs.map((c, n) =>
        n === i ? { ...c, ...patch } : c,
      ),
    });

  const removeCustom = (i: number) =>
    onChange({
      ...value,
      customSpecs: value.customSpecs.filter((_, n) => n !== i),
    });

  if (loading && !sheet) {
    return <p className="spec-step-note">{t("specs.loading")}</p>;
  }
  if (!sheet) return null;

  const editedCount = Object.keys(value.specOverrides).length;

  return (
    <div className="spec-step">
      <p className="spec-step-note">
        {sheet.matched
          ? t("specs.autofilled", { filled: sheet.filled, total: sheet.total })
          : t("specs.noTrimData")}
      </p>
      {editedCount > 0 && (
        <p className="spec-step-edited" role="status">
          {t("specs.editedCount", { count: editedCount })}
        </p>
      )}

      {sheet.groups.map((g) => {
        const isOpen = open[g.key] ?? g.tier !== "advanced";
        const panelId = `sell-spec-${g.key}`;
        const done = g.fields.filter((f) => shown(f) !== "").length;
        return (
          <div className="spec-step-group" key={g.key}>
            <button
              type="button"
              className="spec-group-toggle"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen((o) => ({ ...o, [g.key]: !isOpen }))}
            >
              <h3>{g.name}</h3>
              <span className="spec-group-count">
                {t("specs.filledCount", { filled: done, total: g.fields.length })}
              </span>
              <ChevronDown
                className={isOpen ? "spec-chevron spec-chevron-open" : "spec-chevron"}
                aria-hidden
              />
            </button>

            {isOpen && (
              <div className="spec-step-fields" id={panelId}>
                {g.fields.map((f) => {
                  const id = `sell-spec-${f.key}`;
                  const current = shown(f);
                  return (
                    <div className="spec-step-field" key={f.key}>
                      <label htmlFor={id}>
                        {f.name}
                        {f.unit ? ` (${f.unit})` : ""}
                      </label>
                      <div className="spec-step-control">
                        {f.valueType === "enum" && f.options.length > 0 ? (
                          <select
                            id={id}
                            className="form-input"
                            value={current}
                            onChange={(e) => setField(f, e.target.value)}
                          >
                            <option value="">{t("specs.unset")}</option>
                            {f.options.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : f.valueType === "boolean" ? (
                          <select
                            id={id}
                            className="form-input"
                            value={current}
                            onChange={(e) => setField(f, e.target.value)}
                          >
                            <option value="">{t("specs.unset")}</option>
                            <option value="Yes">{t("specs.yes")}</option>
                            <option value="No">{t("specs.no")}</option>
                          </select>
                        ) : (
                          <input
                            id={id}
                            className="form-input"
                            type={f.valueType === "number" ? "number" : "text"}
                            value={current}
                            placeholder={t("specs.unset")}
                            onChange={(e) => setField(f, e.target.value)}
                          />
                        )}
                        {edited(f) && (
                          <button
                            type="button"
                            className="spec-step-revert"
                            onClick={() => revert(f)}
                            title={t("specs.revertHint")}
                          >
                            <RotateCcw className="spec-step-revert-icon" aria-hidden />
                            <span className="sr-only">
                              {t("specs.revert", { field: f.name })}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Trim-specific detail the generic catalogue has no key for. */}
      <div className="spec-step-group">
        <h3 className="spec-step-custom-title">{t("specs.customTitle")}</h3>
        <p className="spec-step-note">{t("specs.customHint")}</p>
        {value.customSpecs.map((c, i) => (
          <div className="spec-step-custom" key={i}>
            <input
              className="form-input"
              value={c.label}
              placeholder={t("specs.customLabelPlaceholder")}
              aria-label={t("specs.customLabelAria", { n: i + 1 })}
              maxLength={60}
              onChange={(e) => setCustom(i, { label: e.target.value })}
            />
            <input
              className="form-input"
              value={c.value}
              placeholder={t("specs.customValuePlaceholder")}
              aria-label={t("specs.customValueAria", { n: i + 1 })}
              maxLength={120}
              onChange={(e) => setCustom(i, { value: e.target.value })}
            />
            <button
              type="button"
              className="spec-step-remove"
              onClick={() => removeCustom(i)}
            >
              <X className="spec-step-revert-icon" aria-hidden />
              <span className="sr-only">
                {t("specs.customRemove", { n: i + 1 })}
              </span>
            </button>
          </div>
        ))}
        {value.customSpecs.length < 20 && (
          <button type="button" className="btn btn-outline btn-sm" onClick={addCustom}>
            <Plus className="spec-step-revert-icon" aria-hidden /> {t("specs.customAdd")}
          </button>
        )}
      </div>
    </div>
  );
}

export { EMPTY as EMPTY_SPEC_STEP };
