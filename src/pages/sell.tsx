/**
 * /sell — 5-step Sell wizard, task P1-02 (PRD §5.3, FR-VS3, FR-L2).
 *
 * Auth-gated two-layer like /account (SSR getServerSession redirect +
 * client useSession required). The backend expects ONE create call, so steps
 * 1–2 accumulate client state and the draft is created at the END of step 2;
 * photos then attach to the draft id, and step 4 submits it for review.
 *
 * FR-L2 draft autosave: wizard state persists to localStorage on every
 * change (per step). Returning visitors get a restore banner — resume picks
 * up exactly where they left off (already-attached photos come back as
 * count-only placeholder tiles; files cannot persist).
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { History } from "lucide-react";
import * as React from "react";
import { SiteHeader } from "@/components/home/site-header";
import { Stepper } from "@/components/sell/stepper";
import { StepVehicle } from "@/components/sell/step-vehicle";
import { StepSpecs } from "@/components/sell/step-specs";
import { StepPhotos, countAttached, type PhotoItem } from "@/components/sell/step-photos";
import { StepReview } from "@/components/sell/step-review";
import {
  EMPTY_SPECS,
  EMPTY_VEHICLE,
  MIN_PHOTOS,
  SELL_DRAFT_KEY,
  type DraftNames,
  type SellDraftV1,
  type SpecsFormValues,
  type VehicleFormValues,
} from "@/components/sell/types";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle, Panel, SurfaceCard } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import {
  createListing,
  submitListing,
  type CreateListingInput,
} from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../next-i18next.config.js";

type Step = 1 | 2 | 3 | 4 | 5;

function buildDto(
  vehicle: VehicleFormValues,
  specs: SpecsFormValues,
): CreateListingInput {
  return {
    vehicleType: "CAR",
    makeId: vehicle.makeId,
    modelId: vehicle.modelId,
    trimId: vehicle.trimId || undefined,
    year: Number(vehicle.year),
    priceAed: Number(specs.priceAed),
    isNegotiable: specs.isNegotiable,
    mileageKm: Number(specs.mileageKm),
    regionalSpec: vehicle.regionalSpec || undefined,
    fuelType: specs.fuelType || undefined,
    transmission: specs.transmission || undefined,
    cylinders: specs.cylinders !== "NONE" && specs.cylinders !== "" ? Number(specs.cylinders) : undefined,
    exteriorColor: specs.exteriorColor.trim() || undefined,
    interiorColor: specs.interiorColor.trim() || undefined,
    emirateId: specs.emirateId,
    description: specs.description.trim(),
    vin: specs.vin.trim().toUpperCase() || undefined,
  };
}

export default function SellPage() {
  const router = useRouter();
  const locale = router.locale ?? "en";
  const { t } = useTranslation("sell");
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      void router.replace("/login?next=/sell");
    },
  });

  // Silent refresh rotation failed → the backend session is gone; re-login.
  React.useEffect(() => {
    if (session?.error === "RefreshFailed") {
      void signOut({ callbackUrl: "/login" });
    }
  }, [session?.error]);

  const [step, setStep] = React.useState<Step>(1);
  const [vehicle, setVehicle] = React.useState<VehicleFormValues>(EMPTY_VEHICLE);
  const [specs, setSpecs] = React.useState<SpecsFormValues>(EMPTY_SPECS);
  const [names, setNames] = React.useState<DraftNames>({});
  const [listing, setListing] = React.useState<{ id: string; slug: string } | null>(null);
  const [photoItems, setPhotoItems] = React.useState<PhotoItem[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = React.useState<SellDraftV1 | null>(null);

  /* ---------------- FR-L2 draft restore + autosave ---------------- */

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(SELL_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as SellDraftV1;
      if (draft?.v === 1 && (draft.vehicle?.makeId || draft.listing)) {
        setPendingDraft(draft);
      }
    } catch {
      // Corrupt draft — ignore it.
    }
  }, []);

  React.useEffect(() => {
    if (step === 5 || pendingDraft) return;
    if (!vehicle.makeId && !listing) return; // nothing worth saving yet
    const draft: SellDraftV1 = {
      v: 1,
      step: Math.min(step, 4) as 1 | 2 | 3 | 4,
      vehicle,
      specs,
      names,
      listing,
      attachedCount: countAttached(photoItems),
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(SELL_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage full/blocked — autosave is best-effort.
    }
  }, [step, vehicle, specs, names, listing, photoItems, pendingDraft]);

  const resumeDraft = () => {
    if (!pendingDraft) return;
    setVehicle(pendingDraft.vehicle ?? EMPTY_VEHICLE);
    setSpecs(pendingDraft.specs ?? EMPTY_SPECS);
    setNames(pendingDraft.names ?? {});
    setListing(pendingDraft.listing ?? null);
    setPhotoItems(
      Array.from({ length: pendingDraft.attachedCount }, () => ({
        id: crypto.randomUUID(),
        fileName: "",
        previewUrl: null,
        status: "restored" as const,
        progress: 0,
      })),
    );
    // Never land on steps 1–2 in "locked" limbo if the draft already exists.
    const target = pendingDraft.listing
      ? (Math.max(pendingDraft.step, 3) as Step)
      : (Math.min(pendingDraft.step, 2) as Step);
    setStep(target);
    setPendingDraft(null);
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(SELL_DRAFT_KEY);
    } catch {
      // ignore
    }
    setPendingDraft(null);
  };

  /* ---------------- step handlers ---------------- */

  const handleVehicleNext = (values: VehicleFormValues, vehicleNames: DraftNames) => {
    setVehicle(values);
    setNames((prev) => ({ ...prev, ...vehicleNames }));
    setPendingDraft(null); // proceeding fresh supersedes an unclaimed old draft
    setStep(2);
  };

  const handleSpecsNext = async (values: SpecsFormValues, emirateName?: string) => {
    setSpecs(values);
    if (emirateName) setNames((prev) => ({ ...prev, emirate: emirateName }));

    if (listing) {
      setStep(3); // draft already created — fields were locked
      return;
    }

    const token = session?.accessToken;
    if (!token) {
      setCreateError(t("errors.generic"));
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createListing(buildDto(vehicle, values), token);
      setListing({ id: created.id, slug: created.slug });
      setStep(3);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          setCreateError(
            /vin/i.test(err.message) ? t("errors.vinDuplicate") : t("errors.quota"),
          );
        } else {
          setCreateError(err.message || t("errors.generic"));
        }
      } else {
        setCreateError(t("errors.generic"));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = async () => {
    const token = session?.accessToken;
    if (!listing || !token) {
      setSubmitError(t("errors.generic"));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitListing(listing.id, token);
      try {
        localStorage.removeItem(SELL_DRAFT_KEY);
      } catch {
        // ignore
      }
      setStep(5);
      toast({ title: t("done.title"), variant: "success" });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 400) {
          setSubmitError(t("errors.minPhotos", { min: MIN_PHOTOS }));
        } else if (err.statusCode === 409) {
          setSubmitError(
            /vin/i.test(err.message) ? t("errors.vinDuplicate") : t("errors.quota"),
          );
        } else {
          setSubmitError(err.message || t("errors.generic"));
        }
      } else {
        setSubmitError(t("errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  if (!session) return null; // required:true → only while redirecting

  const stepMeta: Record<Exclude<Step, 5>, { title: string; subtitle: string }> = {
    1: { title: t("vehicle.title"), subtitle: t("vehicle.subtitle") },
    2: { title: t("specs.title"), subtitle: t("specs.subtitle") },
    3: { title: t("photos.title"), subtitle: t("photos.subtitle", { min: MIN_PHOTOS }) },
    4: { title: t("review.title"), subtitle: t("review.subtitle") },
  };

  return (
    <>
      <Head>
        <title>{t("seo.title")}</title>
        <meta name="description" content={t("seo.description")} />
      </Head>

      <SiteHeader />

      <main className="container-shell py-6 sm:py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <header>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-muted sm:text-base">{t("subtitle")}</p>
          </header>

          {pendingDraft ? (
            <SurfaceCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <History className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-ink">{t("restore.title")}</p>
                  <p className="text-sm text-muted">
                    {t("restore.body", {
                      time: formatRelativeTime(pendingDraft.savedAt, locale),
                    })}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={resumeDraft}>
                  {t("restore.resume")}
                </Button>
                <Button size="sm" variant="outline" onClick={discardDraft}>
                  {t("restore.discard")}
                </Button>
              </div>
            </SurfaceCard>
          ) : null}

          <Stepper current={step} />

          {step === 5 ? (
            <Panel className="p-6 text-center sm:p-10">
              <p className="text-4xl" aria-hidden>
                🎉
              </p>
              <h2 className="mt-3 text-xl font-extrabold text-ink sm:text-2xl">
                {t("done.title")}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted sm:text-base">
                {t("done.body")}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/account">{t("done.account")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/cars">{t("done.browse")}</Link>
                </Button>
              </div>
            </Panel>
          ) : (
            <Panel>
              <CardHeader>
                <CardTitle className="text-lg">{stepMeta[step].title}</CardTitle>
                <CardDescription>{stepMeta[step].subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                {step === 1 ? (
                  <StepVehicle
                    initial={vehicle}
                    initialNames={names}
                    locked={listing !== null}
                    locale={locale}
                    onNext={handleVehicleNext}
                  />
                ) : null}
                {step === 2 ? (
                  <StepSpecs
                    initial={specs}
                    locked={listing !== null}
                    locale={locale}
                    creating={creating}
                    serverError={createError}
                    onBack={() => setStep(1)}
                    onNext={(values, emirateName) => void handleSpecsNext(values, emirateName)}
                  />
                ) : null}
                {step === 3 && listing && session.accessToken ? (
                  <StepPhotos
                    items={photoItems}
                    setItems={setPhotoItems}
                    listingId={listing.id}
                    accessToken={session.accessToken}
                    onBack={() => setStep(2)}
                    onNext={() => setStep(4)}
                  />
                ) : null}
                {step === 4 ? (
                  <StepReview
                    vehicle={vehicle}
                    specs={specs}
                    names={names}
                    photos={photoItems}
                    locale={locale}
                    submitting={submitting}
                    serverError={submitError}
                    onBack={() => setStep(3)}
                    onSubmit={() => void handleSubmit()}
                  />
                ) : null}
              </CardContent>
            </Panel>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    // Locale prefix must survive the redirect (Next does not auto-prefix).
    const prefix =
      ctx.locale && ctx.locale !== ctx.defaultLocale ? `/${ctx.locale}` : "";
    return {
      redirect: {
        destination: `${prefix}/login?next=/sell`,
        permanent: false,
      },
    };
  }
  return {
    props: {
      // Strip undefined values (error/accessToken) — SSR props must serialize.
      session: JSON.parse(JSON.stringify(session)),
      ...(await serverSideTranslations(
        ctx.locale ?? nextI18NextConfig.i18n.defaultLocale,
        ["common", "home", "sell", "listings"],
        nextI18NextConfig,
      )),
    },
  };
};
