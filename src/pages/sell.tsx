/**
 * /sell — list your car. The mockup's page-sell design (`.mk` layer, mk-sell
 * i18n x4 + RTL) wired to the real listing API: auth-guarded, real taxonomy
 * dropdowns (make → model cascade, body type, location) and a working submit
 * that creates a real DRAFT listing (createListing) and sends the seller to
 * their account. Photo upload + publish (the ClamAV media pipeline) is the
 * remaining step to move the draft to LIVE.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import * as React from "react";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { SpecStep, EMPTY_SPEC_STEP, type SpecStepValue } from "@/components/sell/spec-step";
import type { SpecSheet } from "@/lib/marketplace-api";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import {
  createListing,
  getModels,
  getTrims,
  getMakes,
  getTaxonomyMeta,
  generateDescription,
  getValuation,
  submitListing,
  type TaxonomyMake,
  type TaxonomyTrim,
  type TaxonomyModel,
  type TaxonomyTerm,
  type ValuationResult,
} from "@/lib/marketplace-api";
import { StepPhotos, type PhotoItem } from "@/components/sell/step-photos";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../next-i18next.config.js";

interface SellProps {
  makes: TaxonomyMake[];
  bodyTypes: TaxonomyTerm[];
  emirates: TaxonomyTerm[];
}

const YEARS = Array.from({ length: 26 }, (_, i) => 2025 - i);
const FUELS = ["PETROL", "DIESEL", "HYBRID", "PLUGIN_HYBRID", "ELECTRIC"];
const TRANS = ["AUTOMATIC", "MANUAL", "CVT", "DCT"];
const SPECS = ["GCC", "AMERICAN", "JAPANESE", "EUROPEAN", "KOREAN", "CANADIAN", "OTHER"];

export default function MksellPage({ makes, bodyTypes, emirates }: SellProps) {
  const { t } = useTranslation("mk-sell");
  const router = useRouter();
  const { data: session } = useSession();
  const [models, setModels] = React.useState<TaxonomyModel[]>([]);
  /**
   * Trims. Without this select the seller cannot name a variant, and
   * createDraft only snapshots the spec sheet when a trimId arrives — so the
   * FR-VS3 auto-fill, the whole reason the taxonomy carries trim specs, could
   * never fire from the product. Every listing created here had empty
   * specifications on its detail page.
   */
  const [trims, setTrims] = React.useState<TaxonomyTrim[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    makeId: "", modelId: "", trimId: "", year: "", priceAed: "", mileageKm: "",
    bodyTypeId: "", fuelType: "PETROL", transmission: "AUTOMATIC",
    // No regional spec is pre-selected: defaulting every seller on a global
    // marketplace to the Gulf spec quietly mislabels their car. It is optional
    // on the API, so an unanswered select simply omits the field.
    regionalSpec: "", emirateId: "", description: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [aiBusy, setAiBusy] = React.useState(false);
  const [valuation, setValuation] = React.useState<ValuationResult | null>(null);
  // Photos phase (P6 stub-cleanup): after the draft is created, upload photos
  // right here and submit for review — no detour through the account area.
  const [createdId, setCreatedId] = React.useState<string | null>(null);
  const [specs, setSpecs] = React.useState<SpecStepValue>(EMPTY_SPEC_STEP);
  const [specSheet, setSpecSheet] = React.useState<SpecSheet | null>(null);
  const [photos, setPhotos] = React.useState<PhotoItem[]>([]);
  const [submitBusy, setSubmitBusy] = React.useState(false);

  const onMake = async (makeId: string) => {
    set("makeId", makeId);
    set("modelId", "");
    set("trimId", "");
    setTrims([]);
    setModels(makeId ? await getModels(makeId).catch(() => []) : []);
  };

  const onModel = async (modelId: string) => {
    set("modelId", modelId);
    set("trimId", "");
    setTrims(modelId ? await getTrims(modelId).catch(() => []) : []);
  };

  const makeName = makes.find((m) => m.id === form.makeId)?.name ?? "";
  const modelName = models.find((m) => m.id === form.modelId)?.name ?? "";
  const trimName = trims.find((tr) => tr.id === form.trimId)?.name ?? "";
  const bodyTypeName = bodyTypes.find((b) => b.id === form.bodyTypeId)?.name ?? "";
  const canAssist = Boolean(form.makeId && form.modelId && form.year);

  /** One resolved spec value: the seller's override if any, else the trim's. */
  const specValue = (key: string): string | undefined => {
    if (Object.prototype.hasOwnProperty.call(specs.specOverrides, key)) {
      return specs.specOverrides[key] ?? undefined;
    }
    for (const g of specSheet?.groups ?? []) {
      const f = g.fields.find((x) => x.key === key);
      if (f) return f.value ?? undefined;
    }
    return undefined;
  };

  /**
   * The car's notable specs as short phrases, for the description generator.
   *
   * Reads the same three layers the sheet does — catalogue value, the seller's
   * override, and their custom rows — so the draft describes the car the
   * seller has just described to us, not the trim's generic self.
   *
   * "No" and blanks are dropped: a description should say what a car HAS.
   * Capped at 24 so the prompt stays about this car rather than becoming a
   * data dump, and the AI guardrail can still check every number against it.
   */
  const describeFeatures = (): string[] => {
    const out: string[] = [];
    for (const group of specSheet?.groups ?? []) {
      for (const f of group.fields) {
        const raw = Object.prototype.hasOwnProperty.call(specs.specOverrides, f.key)
          ? specs.specOverrides[f.key]
          : f.value;
        const v = (raw ?? "").trim();
        if (!v || v.toLowerCase() === "no") continue;
        out.push(
          v.toLowerCase() === "yes"
            ? f.name
            : `${f.name}: ${v}${f.unit ? ` ${f.unit}` : ""}`,
        );
      }
    }
    for (const c of specs.customSpecs) {
      if (c.label.trim() && c.value.trim()) out.push(`${c.label.trim()}: ${c.value.trim()}`);
    }
    return out.slice(0, 24);
  };

  const onGenerateDescription = async () => {
    if (!canAssist) return;
    setAiBusy(true);
    try {
      const res = await generateDescription({
        make: makeName, model: modelName, year: Number(form.year),
        trim: trimName || undefined,
        bodyType: bodyTypeName || undefined,
        mileageKm: form.mileageKm ? Number(form.mileageKm) : undefined,
        fuelType: form.fuelType, transmission: form.transmission,
        regionalSpec: form.regionalSpec || undefined,
        // The wizard has no colour inputs of its own — they are catalogue
        // fields, so the seller sets them in the specification step.
        exteriorColor: specValue("exterior_colour"),
        interiorColor: specValue("interior_colour"),
        // Everything the seller actually filled in. The draft used to see six
        // fields, so it could not mention the sunroof they had just ticked —
        // and a description that ignores the spec sheet reads like a template.
        features: describeFeatures(),
        tone: "professional",
        locale: router.locale ?? "en",
      });
      set("description", res.text);
    } catch { setError(t("errors.ai", { defaultValue: "AI is unavailable right now." })); }
    finally { setAiBusy(false); }
  };

  const onSuggestPrice = async () => {
    if (!canAssist) return;
    setAiBusy(true);
    try {
      setValuation(await getValuation({
        makeId: form.makeId, modelId: form.modelId, year: Number(form.year),
        mileageKm: form.mileageKm ? Number(form.mileageKm) : undefined,
        locale: router.locale ?? "en",
      }));
    } catch { setError(t("errors.ai", { defaultValue: "AI is unavailable right now." })); }
    finally { setAiBusy(false); }
  };

  const canSubmit = form.makeId && form.modelId && form.year && form.priceAed && form.mileageKm && form.emirateId;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = session?.accessToken;
    if (!token || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createListing(
        {
          vehicleType: "CAR",
          makeId: form.makeId,
          modelId: form.modelId,
          ...(form.trimId ? { trimId: form.trimId } : {}),
          year: Number(form.year),
          priceAed: Number(form.priceAed),
          mileageKm: Number(form.mileageKm),
          bodyTypeId: form.bodyTypeId || undefined,
          fuelType: form.fuelType,
          transmission: form.transmission,
          // `@IsOptional()` only skips undefined — an empty string still hits
          // the enum check and 400s, so an unanswered select must drop out.
          regionalSpec: form.regionalSpec || undefined,
          emirateId: form.emirateId,
          description: form.description.length >= 20 ? form.description : undefined,
          // Only what the seller actually changed. Sending the auto-filled
          // values back would freeze today's trim data onto the listing as if
          // the seller had asserted it.
          ...(Object.keys(specs.specOverrides).length
            ? { specOverrides: specs.specOverrides }
            : {}),
          ...(specs.customSpecs.filter((c) => c.label.trim() && c.value.trim()).length
            ? {
                customSpecs: specs.customSpecs.filter(
                  (c) => c.label.trim() && c.value.trim(),
                ),
              }
            : {}),
        },
        token,
      );
      setCreatedId(created.id);
      window.scrollTo({ top: 0 });
    } catch {
      setError(t("errors.generic", { defaultValue: "Could not create the listing. Check the fields and try again." }));
    } finally {
      setBusy(false);
    }
  };

  const onSubmitForReview = async () => {
    const token = session?.accessToken;
    if (!token || !createdId) return;
    setSubmitBusy(true);
    try {
      await submitListing(createdId, token);
      void router.push(`/account?submitted=${createdId}`);
    } catch {
      setError(t("errors.submit", { defaultValue: "Could not submit for review — try again." }));
      setSubmitBusy(false);
    }
  };

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-sell" className="page">
          <div className="sell-wrap">
            <div className="container">
              <div className="sell-head">
                <h1>{t("head.title")}</h1>
                <p>{t("head.sub")}</p>
              </div>

              {createdId && session?.accessToken ? (
                <div className="sell-step-card" style={{ maxWidth: 860, margin: "0 auto" }}>
                  <h2 className="step-heading">{t("photos.title", { defaultValue: "Add photos" })}</h2>
                  <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 14 }}>
                    {t("photos.sub", { defaultValue: "Your draft is saved. Add at least 3 photos, then submit for review." })}
                  </p>
                  {error && <p role="alert" style={{ color: "var(--error)", marginBottom: 12 }}>{error}</p>}
                  <StepPhotos
                    items={photos}
                    setItems={setPhotos}
                    listingId={createdId}
                    accessToken={session.accessToken}
                    onBack={() => void router.push("/account")}
                    onNext={() => void onSubmitForReview()}
                  />
                  {submitBusy && <p style={{ color: "var(--text-2)", marginTop: 10 }}>{t("photos.submitting", { defaultValue: "Submitting for review…" })}</p>}
                  <p style={{ marginTop: 12, fontSize: 13 }}>
                    <a role="button" tabIndex={0} style={{ color: "var(--text-3)", textDecoration: "underline", cursor: "pointer" }} onClick={() => void router.push("/account")}>
                      {t("photos.skip", { defaultValue: "Skip for now — finish from My Account" })}
                    </a>
                  </p>
                </div>
              ) : (
              <form className="sell-grid" onSubmit={onSubmit}>
                <div className="sell-main">
                  {error && <p role="alert" style={{ color: "var(--error)", marginBottom: 12 }}>{error}</p>}

                  <div className="sell-step-card">
                    <h2 className="step-heading">{t("step1.title")}</h2>
                    <div className="form-grid">
                      <div className="ds-field">
                        <label htmlFor="sell-step1-makeLabel">{t("step1.makeLabel")}</label>
                        <select id="sell-step1-makeLabel" className="form-input" value={form.makeId} onChange={(e) => onMake(e.target.value)} required>
                          <option value="">{t("step1.makePlaceholder")}</option>
                          {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label htmlFor="sell-step1-modelLabel">{t("step1.modelLabel")}</label>
                        <select id="sell-step1-modelLabel" className="form-input" value={form.modelId} onChange={(e) => void onModel(e.target.value)} required disabled={!form.makeId}>
                          <option value="">{t("step1.modelPlaceholder")}</option>
                          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label htmlFor="sell-step1-trimLabel">{t("step1.trimLabel")}</label>
                        <select id="sell-step1-trimLabel" className="form-input" value={form.trimId} onChange={(e) => set("trimId", e.target.value)} disabled={!form.modelId}>
                          <option value="">{t("step1.trimPlaceholder")}</option>
                          {trims.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label htmlFor="sell-step1-yearLabel">{t("step1.yearLabel")}</label>
                        <select id="sell-step1-yearLabel" className="form-input" value={form.year} onChange={(e) => set("year", e.target.value)} required>
                          <option value="">{t("step1.yearPlaceholder", { defaultValue: "Select year" })}</option>
                          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label htmlFor="sell-step1-bodyLabel">{t("step1.bodyLabel")}</label>
                        <select id="sell-step1-bodyLabel" className="form-input" value={form.bodyTypeId} onChange={(e) => set("bodyTypeId", e.target.value)}>
                          <option value="">{t("step1.bodyPlaceholder", { defaultValue: "Any" })}</option>
                          {bodyTypes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="sell-step-card">
                    <h2 className="step-heading">{t("step2.title")}</h2>
                    <div className="form-grid">
                      <div className="ds-field">
                        <label htmlFor="sell-step2-mileageLabel">{t("step2.mileageLabel")}</label>
                        <input id="sell-step2-mileageLabel" className="form-input" type="number" min="0" value={form.mileageKm} onChange={(e) => set("mileageKm", e.target.value)} placeholder={t("step2.mileagePlaceholder")} required />
                      </div>
                      <div className="ds-field">
                        <label htmlFor="sell-step2-transmissionLabel">{t("step2.transmissionLabel", { defaultValue: "Transmission" })}</label>
                        <select id="sell-step2-transmissionLabel" className="form-input" value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
                          {TRANS.map((o) => <option key={o} value={o}>{o[0] + o.slice(1).toLowerCase()}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label htmlFor="sell-step2-fuelLabel">{t("step2.fuelLabel", { defaultValue: "Fuel" })}</label>
                        <select id="sell-step2-fuelLabel" className="form-input" value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
                          {FUELS.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label htmlFor="sell-step2-regionalLabel">{t("step2.regionalLabel", { defaultValue: "Regional spec" })}</label>
                        <select id="sell-step2-regionalLabel" className="form-input" value={form.regionalSpec} onChange={(e) => set("regionalSpec", e.target.value)}>
                          <option value="">{t("step2.regionalPlaceholder", { defaultValue: "Select regional spec" })}</option>
                          {SPECS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/*
                    The specification step. Rendered only once a model is
                    chosen: without one there is no catalogue to auto-fill
                    from, and an empty 90-row form is a wall, not a wizard.
                  */}
                  {form.modelId && (
                    <div className="sell-step-card">
                      <h2 className="step-heading">{t("specs.title")}</h2>
                      <SpecStep
                        vehicleType="CAR"
                        trimId={form.trimId}
                        year={form.year}
                        regionalSpec={form.regionalSpec}
                        value={specs}
                        onChange={setSpecs}
                        onSheetLoaded={setSpecSheet}
                      />
                    </div>
                  )}

                  <div className="sell-step-card">
                    <h2 className="step-heading">{t("step4.title", { defaultValue: "Price & location" })}</h2>
                    <div className="form-grid">
                      <div className="ds-field">
                        <label htmlFor="sell-step4-priceLabel">{t("step4.priceLabel", { defaultValue: "Asking price" })}</label>
                        <input id="sell-step4-priceLabel" className="form-input" type="number" min="0" value={form.priceAed} onChange={(e) => set("priceAed", e.target.value)} placeholder="0" required />
                      </div>
                      <div className="ds-field">
                        {/*
                          The API field is still `emirateId` — that is the
                          taxonomy's name and renaming it is a backend change.
                          Only the label the seller reads is neutral, because
                          this marketplace is not one country's.
                        */}
                        <label htmlFor="sell-step4-location">{t("step4.locationLabel", { defaultValue: "Location" })}</label>
                        <select id="sell-step4-location" className="form-input" value={form.emirateId} onChange={(e) => set("emirateId", e.target.value)} required>
                          <option value="">{t("step4.locationPlaceholder", { defaultValue: "Select location" })}</option>
                          {emirates.map((em) => <option key={em.id} value={em.id}>{em.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="ds-field full" style={{ marginTop: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <label htmlFor="sell-description">{t("step3.descLabel", { defaultValue: "Description" })}</label>
                        <button type="button" className="btn btn-outline btn-sm" disabled={!canAssist || aiBusy} onClick={() => void onGenerateDescription()}>
                          ✨ {aiBusy ? t("ai.working", { defaultValue: "Working…" }) : t("ai.generate", { defaultValue: "Generate with AI" })}
                        </button>
                      </div>
                      <textarea id="sell-description" className="form-input" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={t("step3.descPlaceholder", { defaultValue: "Tell buyers about the car (min 20 characters)…" })} />
                      <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>{t("ai.descHint", { defaultValue: "AI drafts from your specs only — review before publishing." })}</p>
                    </div>
                    {canAssist && (
                      <div className="ds-field full" style={{ marginTop: 8 }}>
                        <button type="button" className="btn btn-outline btn-sm" disabled={aiBusy} onClick={() => void onSuggestPrice()}>
                          {t("ai.suggestPrice", { defaultValue: "Suggest a fair price" })}
                        </button>
                        {valuation && (
                          <div style={{ marginTop: 8, padding: "10px 12px", background: "var(--surface-2, #f6f8fc)", borderRadius: 8, fontSize: 13 }}>
                            <strong>AED {valuation.low.toLocaleString()} – {valuation.high.toLocaleString()}</strong>{" "}
                            <span style={{ color: "var(--text-3)" }}>({t("ai.confidence", { defaultValue: "confidence" })}: {valuation.confidence}, {valuation.comparableCount} {t("ai.comparables", { defaultValue: "comparables" })})</span>
                            <div style={{ color: "var(--text-3)", marginTop: 4 }}>{valuation.disclaimer}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-xl" disabled={!canSubmit || busy}>
                    {busy ? t("submit.busy", { defaultValue: "Creating…" }) : t("submit.cta", { defaultValue: "Create listing" })}
                  </button>
                  <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 10 }}>{t("submit.note", { defaultValue: "Saved as a draft — add photos from your account to publish." })}</p>
                </div>

                <aside className="sell-sidebar">
                  <div className="sell-step-card">
                    <h3>{t("sidebar.title", { defaultValue: "Why sell on Carsens" })}</h3>
                    <ul style={{ margin: "12px 0 0", paddingInlineStart: 18, color: "var(--text-2)", lineHeight: 1.9 }}>
                      <li>{t("sidebar.p1", { defaultValue: "Free for individuals" })}</li>
                      <li>{t("sidebar.p2", { defaultValue: "2M+ monthly buyers" })}</li>
                      <li>{t("sidebar.p3", { defaultValue: "Sell within 14 days" })}</li>
                    </ul>
                  </div>
                </aside>
              </form>
              )}
            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<SellProps> = async (ctx) => {
  const { locale } = ctx;
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return { redirect: { destination: `${prefix}/login?next=/sell`, permanent: false } };
  }

  const [makes, meta] = await Promise.all([
    getMakes("CAR").catch(() => []),
    getTaxonomyMeta().catch(() => ({ bodyTypes: [], bikeTypes: [], emirates: [], specGroups: [] })),
  ]);

  return {
    props: {
      makes,
      bodyTypes: meta.bodyTypes,
      emirates: meta.emirates,
      ...(await serverSideTranslations(
        locale ?? nextI18NextConfig.i18n.defaultLocale,
        ["common", "mk-sell", "sell"],
        nextI18NextConfig,
      )),
    },
  };
};
