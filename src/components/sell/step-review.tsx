/**
 * Sell wizard step 4 — Review (task P1-02, PRD §5.3).
 *
 * Read-only summary of everything captured in steps 1–3 plus the photo
 * thumbnails, then "Submit for review" → POST /listings/:id/submit. The
 * backend 400 (<3 photos) / 409 (quota, VIN dup) surface inline via
 * `serverError` from the page.
 */
import { Car, SendHorizontal } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMileage, formatPrice } from "@/lib/format";
import type { PhotoItem } from "./step-photos";
import type { DraftNames, SpecsFormValues, VehicleFormValues } from "./types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end font-semibold text-ink">{value}</dd>
    </div>
  );
}

export function StepReview({
  vehicle,
  specs,
  names,
  photos,
  locale,
  submitting,
  serverError,
  onBack,
  onSubmit,
}: {
  vehicle: VehicleFormValues;
  specs: SpecsFormValues;
  names: DraftNames;
  photos: PhotoItem[];
  locale: string;
  submitting: boolean;
  serverError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation("sell");
  const { t: tListings } = useTranslation("listings");

  const title = [vehicle.year, names.make, names.model].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-5">
      {serverError ? (
        <p role="alert" className="rounded-card bg-danger-soft p-3 text-sm font-semibold text-danger-strong">
          {serverError}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {names.trim ? <Badge variant="navy">{names.trim}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-2.5">
            <Row
              label={t("review.price")}
              value={
                <>
                  {formatPrice(Number(specs.priceAed), locale)}{" "}
                  {specs.isNegotiable ? (
                    <Badge variant="green">{t("review.negotiable")}</Badge>
                  ) : null}
                </>
              }
            />
            <Row
              label={t("review.mileage")}
              value={formatMileage(Number(specs.mileageKm), locale)}
            />
            <Row
              label={t("review.regionalSpec")}
              value={tListings(`enum.spec.${vehicle.regionalSpec}`)}
            />
            <Row
              label={t("review.fuelType")}
              value={tListings(`enum.fuel.${specs.fuelType}`)}
            />
            <Row
              label={t("review.transmission")}
              value={tListings(`enum.transmission.${specs.transmission}`)}
            />
            {specs.cylinders !== "NONE" && specs.cylinders !== "" ? (
              <Row label={t("review.cylinders")} value={specs.cylinders} />
            ) : null}
            {specs.exteriorColor.trim() ? (
              <Row label={t("review.exteriorColor")} value={specs.exteriorColor} />
            ) : null}
            {specs.interiorColor.trim() ? (
              <Row label={t("review.interiorColor")} value={specs.interiorColor} />
            ) : null}
            {names.emirate ? <Row label={t("review.emirate")} value={names.emirate} /> : null}
            {specs.vin ? (
              <Row label={t("review.vin")} value={<span className="uppercase">{specs.vin}</span>} />
            ) : null}
          </dl>

          <h4 className="mt-5 text-sm font-bold text-ink">{t("review.description")}</h4>
          <p className="mt-1.5 whitespace-pre-wrap rounded-card border border-divider bg-page p-3 text-sm text-muted-strong">
            {specs.description}
          </p>

          <h4 className="mt-5 text-sm font-bold text-ink">
            {t("review.photos")} ({photos.length})
          </h4>
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((photo, index) => (
              <li
                key={photo.id}
                className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-brand-surface"
              >
                {photo.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob: preview
                  <img
                    src={photo.previewUrl}
                    alt={photo.fileName}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Car className="size-6 text-brand-border" aria-hidden />
                  </span>
                )}
                {index === 0 ? (
                  <Badge variant="solid" className="absolute top-1 start-1 px-1.5 text-[10px]">
                    {t("photos.cover")}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          {t("back")}
        </Button>
        <Button type="button" loading={submitting} onClick={onSubmit}>
          {!submitting ? <SendHorizontal aria-hidden /> : null}
          {t("review.submit")}
        </Button>
      </div>
    </div>
  );
}
