/**
 * Listing edit form — `PATCH /listings/:id`.
 *
 * WHY A DEDICATED FORM AND NOT THE /sell WIZARD IN "EDIT MODE"
 * -----------------------------------------------------------
 * The wizard is a four-step creation flow on the `.mk` layer: it cascades
 * make -> model -> trim, auto-fills a spec snapshot, gates step 3 on three
 * uploaded photos and finishes by POSTing a listing and submitting it. None of
 * that is what editing is. Editing changes a handful of fields on a row that
 * already exists, its photos live on their own screen, and — the part the
 * wizard has no vocabulary for — saving a LIVE listing takes it off the market
 * and back into moderation (FR-M1), which has to be said before the click.
 * Bending the wizard would also mean threading an edit mode through five
 * components that other flows own, and dragging a `.mk` flow into two UI-kit
 * entry points (/account/listings and /dealer/inventory).
 *
 * Make, model and trim are deliberately NOT editable: changing a published
 * ad's vehicle identity is a different car, i.e. a new listing. The backend
 * merges the untouched taxonomy chain from the stored row, so omitting them is
 * exactly right.
 *
 * The request is a true partial — only changed fields are sent. That keeps an
 * untouched field from being re-validated (a stored description shorter than
 * the DTO's 20-character floor would otherwise make every save fail).
 */
import { AlertTriangle, Save, Undo2 } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Panel, SurfaceCard } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldMessage, Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { getTaxonomyMeta, type TaxonomyMeta } from "@/lib/marketplace-api";
import {
  CONDITIONS,
  FUEL_TYPES,
  LIMITS,
  REGIONAL_SPECS,
  TRANSMISSIONS,
  currentDescription,
  isFrozen,
  patchListing,
  type ListingEditPatch,
  type OwnedListing,
} from "./api";

interface FormState {
  year: string;
  priceAed: string;
  mileageKm: string;
  cylinders: string;
  isNegotiable: boolean;
  condition: string;
  regionalSpec: string;
  fuelType: string;
  transmission: string;
  bodyTypeId: string;
  emirateId: string;
  exteriorColor: string;
  interiorColor: string;
  vin: string;
  description: string;
}

type FieldName = keyof FormState;

function toForm(listing: OwnedListing): FormState {
  return {
    year: String(listing.year),
    priceAed: String(listing.priceAed),
    mileageKm: String(listing.mileageKm),
    cylinders: listing.cylinders == null ? "" : String(listing.cylinders),
    isNegotiable: listing.isNegotiable,
    condition: listing.condition ?? "",
    regionalSpec: listing.regionalSpec ?? "",
    fuelType: listing.fuelType ?? "",
    transmission: listing.transmission ?? "",
    bodyTypeId: listing.bodyTypeId ?? "",
    emirateId: listing.emirateId ?? "",
    exteriorColor: listing.exteriorColor ?? "",
    interiorColor: listing.interiorColor ?? "",
    vin: listing.vin ?? "",
    description: currentDescription(listing),
  };
}

function localeName(term: { name: string; i18n: Record<string, string> | null }, locale: string) {
  return term.i18n?.[locale] ?? term.name;
}

export function ListingEditForm({
  listing,
  descriptionsLoaded,
  accessToken,
  locale,
  onSaved,
}: {
  listing: OwnedListing;
  descriptionsLoaded: boolean;
  accessToken: string;
  locale: string;
  onSaved: (updated: OwnedListing) => void;
}) {
  const { t } = useTranslation("account");
  const { t: tListings } = useTranslation("listings");

  const baseline = React.useMemo(() => toForm(listing), [listing]);
  const [form, setForm] = React.useState<FormState>(baseline);
  const [errors, setErrors] = React.useState<Partial<Record<FieldName, string>>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [meta, setMeta] = React.useState<TaxonomyMeta | null>(null);

  React.useEffect(() => setForm(baseline), [baseline]);

  React.useEffect(() => {
    let alive = true;
    getTaxonomyMeta()
      .then((m) => {
        if (alive) setMeta(m);
      })
      .catch(() => {
        if (alive) setMeta(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const frozen = isFrozen(listing.status);
  const willRequireReview = listing.status === "LIVE";

  const set = <K extends FieldName>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setServerError(null);
  };

  /* ---------------------------------------------------------------- */
  /* Diff + validation                                                */
  /* ---------------------------------------------------------------- */

  const buildPatch = React.useCallback((): {
    patch: ListingEditPatch;
    errors: Partial<Record<FieldName, string>>;
  } => {
    const patch: ListingEditPatch = {};
    const next: Partial<Record<FieldName, string>> = {};

    const requiredNumber = (
      key: "year" | "priceAed" | "mileageKm",
      bounds: { min: number; max: number },
    ) => {
      const raw = form[key].trim();
      if (raw === "") {
        next[key] = t("manage.validation.required");
        return;
      }
      const value = Number(raw);
      if (!Number.isInteger(value)) {
        next[key] = t("manage.validation.wholeNumber");
        return;
      }
      if (value < bounds.min || value > bounds.max) {
        next[key] = t("manage.validation.range", { min: bounds.min, max: bounds.max });
        return;
      }
      if (value !== listing[key]) patch[key] = value;
    };

    requiredNumber("year", LIMITS.year);
    requiredNumber("priceAed", LIMITS.priceAed);
    requiredNumber("mileageKm", LIMITS.mileageKm);

    // Optional and un-clearable: the API has no way to set cylinders back to
    // null, so an emptied box means "leave it alone", not "remove it".
    const cyl = form.cylinders.trim();
    if (cyl !== "") {
      const value = Number(cyl);
      if (!Number.isInteger(value)) {
        next.cylinders = t("manage.validation.wholeNumber");
      } else if (value < LIMITS.cylinders.min || value > LIMITS.cylinders.max) {
        next.cylinders = t("manage.validation.range", {
          min: LIMITS.cylinders.min,
          max: LIMITS.cylinders.max,
        });
      } else if (value !== listing.cylinders) {
        patch.cylinders = value;
      }
    }

    if (form.isNegotiable !== listing.isNegotiable) patch.isNegotiable = form.isNegotiable;
    if (form.condition && form.condition !== listing.condition) patch.condition = form.condition;
    if (form.regionalSpec && form.regionalSpec !== listing.regionalSpec) {
      patch.regionalSpec = form.regionalSpec;
    }
    if (form.fuelType && form.fuelType !== listing.fuelType) patch.fuelType = form.fuelType;
    if (form.transmission && form.transmission !== listing.transmission) {
      patch.transmission = form.transmission;
    }
    if (form.bodyTypeId && form.bodyTypeId !== listing.bodyTypeId) {
      patch.bodyTypeId = form.bodyTypeId;
    }
    if (form.emirateId && form.emirateId !== listing.emirateId) patch.emirateId = form.emirateId;

    const text = (key: "exteriorColor" | "interiorColor" | "vin", max: number) => {
      const value = form[key].trim();
      if (value.length > max) {
        next[key] = t("manage.validation.tooLong", { max });
        return;
      }
      if (value !== (listing[key] ?? "")) patch[key] = value;
    };
    text("exteriorColor", LIMITS.colorLength);
    text("interiorColor", LIMITS.colorLength);
    text("vin", LIMITS.vinLength);

    const description = form.description.trim();
    if (description !== (descriptionsLoaded ? currentDescription(listing) : "")) {
      if (description === "") {
        // `@IsOptional() @MinLength(20)` rejects "", so a description cannot be
        // deleted through this endpoint. Say that rather than 400ing.
        next.description = t("manage.validation.descriptionCannotClear", {
          min: LIMITS.description.min,
        });
      } else if (description.length < LIMITS.description.min) {
        next.description = t("manage.validation.descriptionShort", {
          min: LIMITS.description.min,
        });
      } else if (description.length > LIMITS.description.max) {
        next.description = t("manage.validation.tooLong", { max: LIMITS.description.max });
      } else {
        patch.description = description;
      }
    }

    return { patch, errors: next };
  }, [descriptionsLoaded, form, listing, t]);

  const { patch, errors: liveErrors } = buildPatch();
  const changedCount = Object.keys(patch).length;
  const hasErrors = Object.values(liveErrors).some(Boolean);
  const dirty = changedCount > 0 || hasErrors;

  /* ---------------------------------------------------------------- */
  /* Save                                                             */
  /* ---------------------------------------------------------------- */

  const save = async () => {
    const result = buildPatch();
    if (Object.values(result.errors).some(Boolean)) {
      setErrors(result.errors);
      return;
    }
    if (Object.keys(result.patch).length === 0) return;

    setSaving(true);
    setServerError(null);
    try {
      const updated = await patchListing(listing.id, result.patch, accessToken);
      onSaved(updated);
      toast({
        title:
          updated.status === "PENDING_REVIEW" && listing.status === "LIVE"
            ? t("manage.saved.pending")
            : t("manage.saved.ok"),
        variant: "success",
      });
      setConfirmOpen(false);
    } catch (err) {
      // Surface the backend's own words — it returns the specific reason
      // ("priceAed must not be less than 1000", "A listing that is sold cannot
      // be edited") and replacing that with "try again" is how a seller gets
      // stuck.
      const message = err instanceof ApiError ? err.message : t("manage.errors.saveGeneric");
      setServerError(message);
      toast({ title: t("manage.errors.saveTitle"), description: message, variant: "error" });
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = buildPatch();
    if (Object.values(result.errors).some(Boolean)) {
      setErrors(result.errors);
      return;
    }
    if (Object.keys(result.patch).length === 0) return;
    if (willRequireReview) {
      setConfirmOpen(true);
      return;
    }
    void save();
  };

  /* ---------------------------------------------------------------- */
  /* Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  const errorFor = (key: FieldName) => errors[key];

  /*
   * Render FUNCTIONS, not nested components: a component declared inside the
   * render body is a new type on every keystroke, so React unmounts the input
   * and the field loses focus mid-typing.
   */
  const numberField = ({
    name,
    label,
    hint,
    min,
    max,
  }: {
    name: "year" | "priceAed" | "mileageKm" | "cylinders";
    label: string;
    hint?: string;
    min: number;
    max: number;
  }) => {
    const error = errorFor(name);
    const describedBy = error || hint ? `${name}-msg` : undefined;
    return (
      <div>
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          name={name}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          disabled={frozen}
          value={form[name]}
          invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => set(name, e.target.value)}
        />
        {error || hint ? (
          <FieldMessage id={describedBy} error={Boolean(error)}>
            {error ?? hint}
          </FieldMessage>
        ) : null}
      </div>
    );
  };

  const textField = ({
    name,
    label,
    max,
    hint,
  }: {
    name: "exteriorColor" | "interiorColor" | "vin";
    label: string;
    max: number;
    hint?: string;
  }) => {
    const error = errorFor(name);
    const describedBy = error || hint ? `${name}-msg` : undefined;
    return (
      <div>
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          name={name}
          maxLength={max}
          disabled={frozen}
          value={form[name]}
          invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => set(name, e.target.value)}
        />
        {error || hint ? (
          <FieldMessage id={describedBy} error={Boolean(error)}>
            {error ?? hint}
          </FieldMessage>
        ) : null}
      </div>
    );
  };

  const enumField = ({
    name,
    label,
    options,
    render,
  }: {
    name: "condition" | "regionalSpec" | "fuelType" | "transmission";
    label: string;
    options: readonly string[];
    render: (value: string) => string;
  }) => (
    <div>
      <Label htmlFor={`${name}-trigger`}>{label}</Label>
      <Select
        value={form[name]}
        disabled={frozen}
        onValueChange={(value) => set(name, value)}
      >
        <SelectTrigger id={`${name}-trigger`} aria-label={label}>
          <SelectValue placeholder={t("manage.fields.notSet")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {render(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const descriptionLength = form.description.trim().length;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {frozen ? (
        <SurfaceCard className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-strong" aria-hidden />
          <div>
            <p className="text-sm font-bold text-ink">{t("manage.frozen.title")}</p>
            <p className="mt-1 text-sm text-muted">
              {t("manage.frozen.body", {
                status: tListings(`status.${listing.status}`, { defaultValue: listing.status }),
              })}
            </p>
          </div>
        </SurfaceCard>
      ) : null}

      {willRequireReview ? (
        <SurfaceCard className="flex items-start gap-3 p-4" role="note">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-strong" aria-hidden />
          <div>
            <p className="text-sm font-bold text-ink">{t("manage.review.bannerTitle")}</p>
            <p className="mt-1 text-sm text-muted">{t("manage.review.bannerBody")}</p>
          </div>
        </SurfaceCard>
      ) : null}

      <Panel className="p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          {t("manage.sections.vehicle")}
        </h2>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-muted">{t("manage.identity.make")}</dt>
            <dd className="font-semibold text-ink">{listing.make?.name ?? "—"}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">{t("manage.identity.model")}</dt>
            <dd className="font-semibold text-ink">{listing.model?.name ?? "—"}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">{t("manage.identity.trim")}</dt>
            <dd className="font-semibold text-ink">{listing.trim?.name ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted">{t("manage.identity.hint")}</p>
      </Panel>

      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          {t("manage.sections.price")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {numberField({
            name: "priceAed",
            label: t("manage.fields.priceAed"),
            min: LIMITS.priceAed.min,
            max: LIMITS.priceAed.max,
            hint: t("manage.fields.priceHint"),
          })}
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                className="size-4 accent-brand"
                disabled={frozen}
                checked={form.isNegotiable}
                onChange={(e) => set("isNegotiable", e.target.checked)}
              />
              {t("manage.fields.isNegotiable")}
            </label>
          </div>
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          {t("manage.sections.details")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {numberField({
            name: "year",
            label: t("manage.fields.year"),
            min: LIMITS.year.min,
            max: LIMITS.year.max,
          })}
          {numberField({
            name: "mileageKm",
            label: t("manage.fields.mileageKm"),
            min: LIMITS.mileageKm.min,
            max: LIMITS.mileageKm.max,
          })}
          {enumField({
            name: "condition",
            label: t("manage.fields.condition"),
            options: CONDITIONS,
            render: (value) => t(`manage.enum.condition.${value}`, { defaultValue: value }),
          })}
          {enumField({
            name: "regionalSpec",
            label: t("manage.fields.regionalSpec"),
            options: REGIONAL_SPECS,
            render: (value) => tListings(`enum.spec.${value}`, { defaultValue: value }),
          })}
          {enumField({
            name: "fuelType",
            label: t("manage.fields.fuelType"),
            options: FUEL_TYPES,
            render: (value) => tListings(`enum.fuel.${value}`, { defaultValue: value }),
          })}
          {enumField({
            name: "transmission",
            label: t("manage.fields.transmission"),
            options: TRANSMISSIONS,
            render: (value) => tListings(`enum.transmission.${value}`, { defaultValue: value }),
          })}
          {numberField({
            name: "cylinders",
            label: t("manage.fields.cylinders"),
            min: LIMITS.cylinders.min,
            max: LIMITS.cylinders.max,
            hint: t("manage.fields.optionalHint"),
          })}
          {listing.vehicleType === "CAR" ? (
            <div>
              <Label htmlFor="bodyType-trigger">{t("manage.fields.bodyType")}</Label>
              <Select
                value={form.bodyTypeId}
                disabled={frozen || !meta}
                onValueChange={(value) => set("bodyTypeId", value)}
              >
                <SelectTrigger id="bodyType-trigger" aria-label={t("manage.fields.bodyType")}>
                  <SelectValue placeholder={t("manage.fields.notSet")} />
                </SelectTrigger>
                <SelectContent>
                  {(meta?.bodyTypes ?? []).map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {localeName(term, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {textField({
            name: "exteriorColor",
            label: t("manage.fields.exteriorColor"),
            max: LIMITS.colorLength,
          })}
          {textField({
            name: "interiorColor",
            label: t("manage.fields.interiorColor"),
            max: LIMITS.colorLength,
          })}
          {textField({
            name: "vin",
            label: t("manage.fields.vin"),
            max: LIMITS.vinLength,
            hint: t("manage.fields.vinHint"),
          })}
          <div>
            <Label htmlFor="emirate-trigger">{t("manage.fields.emirate")}</Label>
            <Select
              value={form.emirateId}
              disabled={frozen || !meta}
              onValueChange={(value) => set("emirateId", value)}
            >
              <SelectTrigger id="emirate-trigger" aria-label={t("manage.fields.emirate")}>
                <SelectValue placeholder={t("manage.fields.notSet")} />
              </SelectTrigger>
              <SelectContent>
                {(meta?.emirates ?? []).map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {localeName(term, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Panel>

      <Panel className="flex flex-col gap-2 p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          {t("manage.sections.description")}
        </h2>
        {!descriptionsLoaded ? (
          <p className="text-xs text-warning-strong">{t("manage.fields.descriptionUnavailable")}</p>
        ) : null}
        <div>
          <Label htmlFor="description">{t("manage.fields.description")}</Label>
          <Textarea
            id="description"
            name="description"
            rows={6}
            maxLength={LIMITS.description.max}
            disabled={frozen}
            value={form.description}
            invalid={Boolean(errorFor("description"))}
            aria-describedby="description-msg"
            onChange={(e) => set("description", e.target.value)}
          />
          <FieldMessage id="description-msg" error={Boolean(errorFor("description"))}>
            {errorFor("description") ??
              t("manage.fields.descriptionHint", {
                count: descriptionLength,
                min: LIMITS.description.min,
                max: LIMITS.description.max,
              })}
          </FieldMessage>
        </div>
      </Panel>

      {serverError ? (
        <p role="alert" className="rounded-card border border-danger bg-danger-soft p-3 text-sm text-danger-strong">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-xs text-muted">
          {changedCount === 0
            ? t("manage.noChanges")
            : t("manage.changedCount", { count: changedCount })}
        </p>
        <div className="flex gap-2">
          {dirty ? (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setForm(baseline);
                setErrors({});
                setServerError(null);
              }}
            >
              <Undo2 aria-hidden />
              {t("manage.discard")}
            </Button>
          ) : null}
          <Button type="submit" loading={saving} disabled={frozen || changedCount === 0}>
            <Save aria-hidden />
            {t("manage.save")}
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => !saving && setConfirmOpen(open)}>
        <DialogContent aria-describedby="edit-confirm-body">
          <DialogHeader>
            <DialogTitle>{t("manage.review.confirmTitle")}</DialogTitle>
            <DialogDescription id="edit-confirm-body">
              {t("manage.review.confirmBody")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => setConfirmOpen(false)}>
              {t("manage.cancel")}
            </Button>
            <Button type="button" loading={saving} onClick={() => void save()}>
              {t("manage.review.confirmCta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
