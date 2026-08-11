/**
 * Sell wizard step 1 — Vehicle (task P1-02, PRD §5.3).
 *
 * Cascading make → model → trim Selects (vehicleType fixed to CAR for now),
 * year + regional spec. As soon as trim + year are chosen the FR-VS3 lookup
 * fires (getTrimSpec) and the SpecPreview panel renders the auto-filled spec
 * sheet — or the "Can't find your trim?" hint (request flow lands in P1-03).
 *
 * Once the draft has been created at the end of step 2 the backend offers no
 * update endpoint, so the step renders locked (read-only) on revisit.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FieldMessage, Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMakes,
  getModels,
  getTrims,
  getTrimSpec,
  type SpecGroups,
  type TaxonomyMake,
  type TaxonomyModel,
  type TaxonomyTrim,
} from "@/lib/marketplace-api";
import { SpecPreview, type SpecLookupState } from "./spec-preview";
import {
  localizedName,
  REGIONAL_SPECS,
  YEAR_MAX,
  YEAR_MIN,
  type DraftNames,
  type VehicleFormValues,
} from "./types";

const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) =>
  String(YEAR_MAX - i),
);

export function StepVehicle({
  initial,
  initialNames,
  locked,
  locale,
  onNext,
}: {
  initial: VehicleFormValues;
  initialNames: DraftNames;
  locked: boolean;
  locale: string;
  onNext: (values: VehicleFormValues, names: DraftNames) => void;
}) {
  const { t } = useTranslation("sell");
  const { t: tListings } = useTranslation("listings");

  const schema = React.useMemo(
    () =>
      z.object({
        makeId: z.string().min(1, t("validation.makeRequired")),
        modelId: z.string().min(1, t("validation.modelRequired")),
        trimId: z.string(),
        year: z.string().min(1, t("validation.yearRequired")),
        regionalSpec: z.string().min(1),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  const makeId = watch("makeId");
  const modelId = watch("modelId");
  const trimId = watch("trimId");
  const year = watch("year");
  const regionalSpec = watch("regionalSpec");

  const [makes, setMakes] = React.useState<TaxonomyMake[]>([]);
  const [models, setModels] = React.useState<TaxonomyModel[]>([]);
  const [trims, setTrims] = React.useState<TaxonomyTrim[]>([]);
  const [loadError, setLoadError] = React.useState(false);
  const [specState, setSpecState] = React.useState<SpecLookupState>("idle");
  const [spec, setSpec] = React.useState<SpecGroups | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getMakes("CAR")
      .then((res) => {
        if (!cancelled) setMakes(res);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!makeId) {
      setModels([]);
      return;
    }
    let cancelled = false;
    getModels(makeId)
      .then((res) => {
        if (!cancelled) setModels(res);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [makeId]);

  React.useEffect(() => {
    if (!modelId) {
      setTrims([]);
      return;
    }
    let cancelled = false;
    getTrims(modelId)
      .then((res) => {
        if (!cancelled) setTrims(res);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [modelId]);

  /* FR-VS3 — trim + year selected → instant spec lookup. */
  React.useEffect(() => {
    if (!trimId || !year) {
      setSpecState("idle");
      setSpec(null);
      return;
    }
    let cancelled = false;
    setSpecState("loading");
    getTrimSpec(trimId, Number(year), regionalSpec || "GCC")
      .then((res) => {
        if (cancelled) return;
        setSpec(res);
        setSpecState(res ? "found" : "missing");
      })
      .catch(() => {
        if (cancelled) return;
        setSpec(null);
        setSpecState("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [trimId, year, regionalSpec]);

  const submit = handleSubmit((values) => {
    const names: DraftNames = {
      make: makes.find((m) => m.id === values.makeId)
        ? localizedName(makes.find((m) => m.id === values.makeId)!, locale)
        : initialNames.make,
      model: models.find((m) => m.id === values.modelId)
        ? localizedName(models.find((m) => m.id === values.modelId)!, locale)
        : initialNames.model,
      trim: trims.find((tr) => tr.id === values.trimId)
        ? localizedName(trims.find((tr) => tr.id === values.trimId)!, locale)
        : values.trimId
          ? initialNames.trim
          : undefined,
      emirate: initialNames.emirate,
    };
    onNext(values, names);
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {locked ? (
        <p className="flex items-start gap-2 rounded-card border border-line bg-divider p-3 text-sm text-muted-strong">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("draftLocked")}
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className="rounded-card bg-danger-soft p-3 text-sm font-semibold text-danger-strong">
          {t("vehicle.loadError")}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="make" required>
            {t("vehicle.make")}
          </Label>
          <Controller
            control={control}
            name="makeId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue("modelId", "");
                  setValue("trimId", "");
                }}
                disabled={locked}
              >
                <SelectTrigger id="make" aria-invalid={!!errors.makeId || undefined}>
                  <SelectValue placeholder={t("vehicle.makePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {makes.map((make) => (
                    <SelectItem key={make.id} value={make.id}>
                      {localizedName(make, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.makeId ? (
            <FieldMessage error>{errors.makeId.message}</FieldMessage>
          ) : null}
        </div>

        <div>
          <Label htmlFor="model" required>
            {t("vehicle.model")}
          </Label>
          <Controller
            control={control}
            name="modelId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue("trimId", "");
                }}
                disabled={locked || !makeId}
              >
                <SelectTrigger id="model" aria-invalid={!!errors.modelId || undefined}>
                  <SelectValue placeholder={t("vehicle.modelPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {localizedName(model, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.modelId ? (
            <FieldMessage error>{errors.modelId.message}</FieldMessage>
          ) : null}
        </div>

        <div>
          <Label htmlFor="trim">{t("vehicle.trim")}</Label>
          <Controller
            control={control}
            name="trimId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked || !modelId}
              >
                <SelectTrigger id="trim">
                  <SelectValue placeholder={t("vehicle.trimPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {trims.map((trim) => (
                    <SelectItem key={trim.id} value={trim.id}>
                      {localizedName(trim, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="year" required>
            {t("vehicle.year")}
          </Label>
          <Controller
            control={control}
            name="year"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
              >
                <SelectTrigger id="year" aria-invalid={!!errors.year || undefined}>
                  <SelectValue placeholder={t("vehicle.yearPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.year ? (
            <FieldMessage error>{errors.year.message}</FieldMessage>
          ) : null}
        </div>

        <div>
          <Label htmlFor="regionalSpec">{t("vehicle.regionalSpec")}</Label>
          <Controller
            control={control}
            name="regionalSpec"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={locked}
              >
                <SelectTrigger id="regionalSpec">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONAL_SPECS.map((specValue) => (
                    <SelectItem key={specValue} value={specValue}>
                      {tListings(`enum.spec.${specValue}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <SpecPreview state={specState} spec={spec} locale={locale} />

      <div className="flex justify-end">
        <Button type="submit" className="w-full sm:w-auto">
          {t("next")}
        </Button>
      </div>
    </form>
  );
}
