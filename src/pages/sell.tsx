/**
 * /sell — list your car. The mockup's page-sell design (`.mk` layer, mk-sell
 * i18n x4 + RTL) wired to the real listing API: auth-guarded, real taxonomy
 * dropdowns (make → model cascade, body type, emirate) and a working submit
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
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import {
  createListing,
  getModels,
  getMakes,
  getTaxonomyMeta,
  type TaxonomyMake,
  type TaxonomyModel,
  type TaxonomyTerm,
} from "@/lib/marketplace-api";
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
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    makeId: "", modelId: "", year: "", priceAed: "", mileageKm: "",
    bodyTypeId: "", fuelType: "PETROL", transmission: "AUTOMATIC",
    regionalSpec: "GCC", emirateId: "", description: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onMake = async (makeId: string) => {
    set("makeId", makeId);
    set("modelId", "");
    setModels(makeId ? await getModels(makeId).catch(() => []) : []);
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
          year: Number(form.year),
          priceAed: Number(form.priceAed),
          mileageKm: Number(form.mileageKm),
          bodyTypeId: form.bodyTypeId || undefined,
          fuelType: form.fuelType,
          transmission: form.transmission,
          regionalSpec: form.regionalSpec,
          emirateId: form.emirateId,
          description: form.description.length >= 20 ? form.description : undefined,
        },
        token,
      );
      void router.push(`/account?created=${created.id}`);
    } catch {
      setError(t("errors.generic", { defaultValue: "Could not create the listing. Check the fields and try again." }));
    } finally {
      setBusy(false);
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

              <form className="sell-grid" onSubmit={onSubmit}>
                <div className="sell-main">
                  {error && <p role="alert" style={{ color: "var(--error)", marginBottom: 12 }}>{error}</p>}

                  <div className="sell-card">
                    <h2 className="step-heading">{t("step1.title")}</h2>
                    <div className="form-grid">
                      <div className="ds-field">
                        <label>{t("step1.makeLabel")}</label>
                        <select className="form-input" value={form.makeId} onChange={(e) => onMake(e.target.value)} required>
                          <option value="">{t("step1.makePlaceholder")}</option>
                          {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label>{t("step1.modelLabel")}</label>
                        <select className="form-input" value={form.modelId} onChange={(e) => set("modelId", e.target.value)} required disabled={!form.makeId}>
                          <option value="">{t("step1.modelPlaceholder")}</option>
                          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label>{t("step1.yearLabel")}</label>
                        <select className="form-input" value={form.year} onChange={(e) => set("year", e.target.value)} required>
                          <option value="">{t("step1.yearPlaceholder", { defaultValue: "Select year" })}</option>
                          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label>{t("step1.bodyLabel")}</label>
                        <select className="form-input" value={form.bodyTypeId} onChange={(e) => set("bodyTypeId", e.target.value)}>
                          <option value="">{t("step1.bodyPlaceholder", { defaultValue: "Any" })}</option>
                          {bodyTypes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="sell-card">
                    <h2 className="step-heading">{t("step2.title")}</h2>
                    <div className="form-grid">
                      <div className="ds-field">
                        <label>{t("step2.mileageLabel")}</label>
                        <input className="form-input" type="number" min="0" value={form.mileageKm} onChange={(e) => set("mileageKm", e.target.value)} placeholder={t("step2.mileagePlaceholder")} required />
                      </div>
                      <div className="ds-field">
                        <label>{t("step2.transmissionLabel", { defaultValue: "Transmission" })}</label>
                        <select className="form-input" value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
                          {TRANS.map((o) => <option key={o} value={o}>{o[0] + o.slice(1).toLowerCase()}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label>{t("step2.fuelLabel", { defaultValue: "Fuel" })}</label>
                        <select className="form-input" value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
                          {FUELS.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                        </select>
                      </div>
                      <div className="ds-field">
                        <label>{t("step2.regionalLabel", { defaultValue: "Regional spec" })}</label>
                        <select className="form-input" value={form.regionalSpec} onChange={(e) => set("regionalSpec", e.target.value)}>
                          {SPECS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="sell-card">
                    <h2 className="step-heading">{t("step4.title", { defaultValue: "Price & location" })}</h2>
                    <div className="form-grid">
                      <div className="ds-field">
                        <label>{t("step4.priceLabel", { defaultValue: "Asking price (AED)" })}</label>
                        <input className="form-input" type="number" min="0" value={form.priceAed} onChange={(e) => set("priceAed", e.target.value)} placeholder="0" required />
                      </div>
                      <div className="ds-field">
                        <label>{t("step4.emirateLabel", { defaultValue: "Emirate" })}</label>
                        <select className="form-input" value={form.emirateId} onChange={(e) => set("emirateId", e.target.value)} required>
                          <option value="">{t("step4.emiratePlaceholder", { defaultValue: "Select emirate" })}</option>
                          {emirates.map((em) => <option key={em.id} value={em.id}>{em.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="ds-field full" style={{ marginTop: 12 }}>
                      <label>{t("step3.descLabel", { defaultValue: "Description" })}</label>
                      <textarea className="form-input" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={t("step3.descPlaceholder", { defaultValue: "Tell buyers about the car (min 20 characters)…" })} />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-xl" disabled={!canSubmit || busy}>
                    {busy ? t("submit.busy", { defaultValue: "Creating…" }) : t("submit.cta", { defaultValue: "Create listing" })}
                  </button>
                  <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 10 }}>{t("submit.note", { defaultValue: "Saved as a draft — add photos from your account to publish." })}</p>
                </div>

                <aside className="sell-sidebar">
                  <div className="sell-card">
                    <h3>{t("sidebar.title", { defaultValue: "Why sell on Carsens" })}</h3>
                    <ul style={{ margin: "12px 0 0", paddingInlineStart: 18, color: "var(--text-2)", lineHeight: 1.9 }}>
                      <li>{t("sidebar.p1", { defaultValue: "Free for individuals" })}</li>
                      <li>{t("sidebar.p2", { defaultValue: "2M+ monthly buyers" })}</li>
                      <li>{t("sidebar.p3", { defaultValue: "Sell within 14 days" })}</li>
                    </ul>
                  </div>
                </aside>
              </form>
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
        ["common", "mk-sell"],
        nextI18NextConfig,
      )),
    },
  };
};
