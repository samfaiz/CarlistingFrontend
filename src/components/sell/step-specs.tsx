/**
 * Sell wizard step 2 — Specs & price (task P1-02, PRD §5.3).
 *
 * Mileage, fuel, transmission, optional cylinders/colours/VIN, emirate,
 * price + negotiable switch and the 20–4000 char description with a live
 * counter. Submitting this step is the moment the parent creates the draft
 * (single POST /listings) — API errors (409 quota, validation) surface here
 * inline via the `serverError` prop.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FieldMessage, Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTaxonomyMeta, type TaxonomyTerm } from "@/lib/marketplace-api";
import { cn } from "@/lib/utils";
import {
  CYLINDER_OPTIONS,
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  FUEL_TYPES,
  localizedName,
  TRANSMISSIONS,
  type SpecsFormValues,
} from "./types";

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export function StepSpecs({
  initial,
  locked,
  locale,
  creating,
  serverError,
  onBack,
  onNext,
}: {
  initial: SpecsFormValues;
  locked: boolean;
  locale: string;
  creating: boolean;
  serverError: string | null;
  onBack: () => void;
  onNext: (values: SpecsFormValues, emirateName?: string) => void;
}) {
  const { t } = useTranslation("sell");
  const { t: tListings } = useTranslation("listings");

  const schema = React.useMemo(
    () =>
      z.object({
        mileageKm: z
          .string()
          .regex(/^\d{1,7}$/, t("validation.mileageInvalid")),
        fuelType: z.string().min(1, t("validation.fuelRequired")),
        transmission: z.string().min(1, t("validation.transmissionRequired")),
        cylinders: z.string(),
        exteriorColor: z.string(),
        interiorColor: z.string(),
        emirateId: z.string().min(1, t("validation.emirateRequired")),
        vin: z
          .string()
          .refine((v) => v === "" || VIN_REGEX.test(v), t("validation.vinInvalid")),
        priceAed: z
          .string()
          .regex(/^[1-9]\d{0,7}$/, t("validation.priceInvalid")),
        isNegotiable: z.boolean(),
        description: z
          .string()
          .trim()
          .min(DESCRIPTION_MIN, t("validation.descriptionMin", { min: DESCRIPTION_MIN }))
          .max(DESCRIPTION_MAX, t("validation.descriptionMax", { max: DESCRIPTION_MAX })),
      }),
    [t],
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SpecsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  const [emirates, setEmirates] = React.useState<TaxonomyTerm[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    getTaxonomyMeta()
      .then((meta) => {
        if (!cancelled) setEmirates(meta.emirates);
      })
      .catch(() => {
        // The Select stays empty; validation will keep the user here.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const description = watch("description");

  const vinField = register("vin");

  const submit = handleSubmit((values) => {
    const emirate = emirates.find((e) => e.id === values.emirateId);
    onNext(values, emirate ? localizedName(emirate, locale) : undefined);
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {locked ? (
        <p className="flex items-start gap-2 rounded-card border border-line bg-divider p-3 text-sm text-muted-strong">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("draftLocked")}
        </p>
      ) : null}
      {serverError ? (
        <p role="alert" className="rounded-card bg-danger-soft p-3 text-sm font-semibold text-danger-strong">
          {serverError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="mileageKm" required>
            {t("specs.mileage")}
          </Label>
          <Input
            id="mileageKm"
            inputMode="numeric"
            disabled={locked}
            invalid={!!errors.mileageKm}
            aria-describedby={errors.mileageKm ? "mileageKm-error" : undefined}
            {...register("mileageKm")}
          />
          {errors.mileageKm ? (
            <FieldMessage id="mileageKm-error" error>
              {errors.mileageKm.message}
            </FieldMessage>
          ) : null}
        </div>

        <div>
          <Label htmlFor="fuelType" required>
            {t("specs.fuelType")}
          </Label>
          <Controller
            control={control}
            name="fuelType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={locked}>
                <SelectTrigger id="fuelType" aria-invalid={!!errors.fuelType || undefined}>
                  <SelectValue placeholder={t("specs.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {tListings(`enum.fuel.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.fuelType ? (
            <FieldMessage error>{errors.fuelType.message}</FieldMessage>
          ) : null}
        </div>

        <div>
          <Label htmlFor="transmission" required>
            {t("specs.transmission")}
          </Label>
          <Controller
            control={control}
            name="transmission"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={locked}>
                <SelectTrigger
                  id="transmission"
                  aria-invalid={!!errors.transmission || undefined}
                >
                  <SelectValue placeholder={t("specs.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {TRANSMISSIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {tListings(`enum.transmission.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.transmission ? (
            <FieldMessage error>{errors.transmission.message}</FieldMessage>
          ) : null}
        </div>

        <div>
          <Label htmlFor="cylinders">{t("specs.cylinders")}</Label>
          <Controller
            control={control}
            name="cylinders"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={locked}>
                <SelectTrigger id="cylinders">
                  <SelectValue placeholder={t("specs.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t("specs.notSpecified")}</SelectItem>
                  {CYLINDER_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="exteriorColor">{t("specs.exteriorColor")}</Label>
          <Input id="exteriorColor" disabled={locked} {...register("exteriorColor")} />
        </div>

        <div>
          <Label htmlFor="interiorColor">{t("specs.interiorColor")}</Label>
          <Input id="interiorColor" disabled={locked} {...register("interiorColor")} />
        </div>

        <div>
          <Label htmlFor="emirateId" required>
            {t("specs.emirate")}
          </Label>
          <Controller
            control={control}
            name="emirateId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={locked}>
                <SelectTrigger id="emirateId" aria-invalid={!!errors.emirateId || undefined}>
                  <SelectValue placeholder={t("specs.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {emirates.map((emirate) => (
                    <SelectItem key={emirate.id} value={emirate.id}>
                      {localizedName(emirate, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.emirateId ? (
            <FieldMessage error>{errors.emirateId.message}</FieldMessage>
          ) : null}
        </div>

        <div>
          <Label htmlFor="vin">{t("specs.vin")}</Label>
          <Input
            id="vin"
            disabled={locked}
            maxLength={17}
            className="uppercase"
            invalid={!!errors.vin}
            aria-describedby={errors.vin ? "vin-error" : "vin-hint"}
            {...vinField}
            onChange={(event) => {
              event.target.value = event.target.value.toUpperCase();
              void vinField.onChange(event);
            }}
          />
          {errors.vin ? (
            <FieldMessage id="vin-error" error>
              {errors.vin.message}
            </FieldMessage>
          ) : (
            <FieldMessage id="vin-hint">{t("specs.vinHint")}</FieldMessage>
          )}
        </div>

        <div>
          <Label htmlFor="priceAed" required>
            {t("specs.price")}
          </Label>
          <Input
            id="priceAed"
            inputMode="numeric"
            disabled={locked}
            invalid={!!errors.priceAed}
            aria-describedby={errors.priceAed ? "priceAed-error" : undefined}
            {...register("priceAed")}
          />
          {errors.priceAed ? (
            <FieldMessage id="priceAed-error" error>
              {errors.priceAed.message}
            </FieldMessage>
          ) : null}
        </div>

        <div className="flex items-end pb-2.5">
          {/* Switch-styled checkbox (UI-kit primitives + tokens only). */}
          <label className="flex cursor-pointer select-none items-center gap-3">
            <input
              type="checkbox"
              disabled={locked}
              className="peer sr-only"
              {...register("isNegotiable")}
            />
            <span
              aria-hidden
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors",
                "peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand-mid/25",
                "after:absolute after:top-0.5 after:start-0.5 after:size-5 after:rounded-full after:bg-card after:shadow-soft after:transition-transform",
                "peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5",
              )}
            />
            <span className="text-sm font-semibold text-ink">
              {t("specs.negotiable")}
            </span>
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="description" required>
          {t("specs.description")}
        </Label>
        <Textarea
          id="description"
          rows={5}
          disabled={locked}
          maxLength={DESCRIPTION_MAX}
          invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : "description-hint"}
          {...register("description")}
        />
        <div className="flex items-baseline justify-between gap-3">
          {errors.description ? (
            <FieldMessage id="description-error" error>
              {errors.description.message}
            </FieldMessage>
          ) : (
            <FieldMessage id="description-hint">
              {t("specs.descriptionHint", { min: DESCRIPTION_MIN })}
            </FieldMessage>
          )}
          <p
            className={cn(
              "mt-1.5 shrink-0 text-xs tabular-nums",
              (description ?? "").length >= DESCRIPTION_MIN ? "text-success-strong" : "text-muted",
            )}
          >
            {t("specs.charCount", {
              chars: (description ?? "").length,
              max: DESCRIPTION_MAX,
            })}
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={creating}>
          {t("back")}
        </Button>
        <Button type="submit" loading={creating}>
          {locked ? t("next") : t("specs.createCta")}
        </Button>
      </div>
    </form>
  );
}
