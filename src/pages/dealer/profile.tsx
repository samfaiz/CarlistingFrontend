/**
 * /dealer/profile — edit the dealership itself (FR-DP9).
 *
 * `updateDealer()` has existed in the API client since P3-01 with zero callers:
 * a dealership could be created and then never changed, so a typo in the name
 * or a missing TRN needed a developer. This is the screen that closes that.
 *
 * The TRN is called out rather than left as another field, because invoicing
 * hard-fails without a valid 15-digit seller TRN by design (PRD §30.1) — a
 * dealer who leaves it blank finds out at the worst possible moment otherwise.
 *
 * OWNER/MANAGER may write; SALES sees the same page read-only rather than a
 * nav entry that 403s.
 */
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { getServerSession } from "next-auth/next";
import * as React from "react";
import { ExternalLink, Loader2, Plus, X } from "lucide-react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { DealerOnboarding } from "@/components/dealer/dealer-onboarding";
import { LogoUploader } from "@/components/dealer/logo-uploader";
import { useDealer } from "@/components/dealer/use-dealer";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { updateDealer, type DealerProfile } from "@/lib/marketplace-api";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import nextI18NextConfig from "../../../next-i18next.config.js";

/** `trn` is returned by GET /dealers/me but absent from the shared client type. */
type DealerProfileWithTrn = DealerProfile & { trn?: string | null };

const TRN_RE = /^\d{15}$/;

export default function DealerProfilePage() {
  const { t } = useTranslation("dealer");
  const { context, quota, loading, error, needsOnboarding, accessToken, refresh } =
    useDealer();

  const dealer = context?.dealer as DealerProfileWithTrn | null | undefined;

  const [name, setName] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [trn, setTrn] = React.useState("");
  const [brands, setBrands] = React.useState<string[]>([]);
  const [services, setServices] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);

  // Seed once the dealership resolves, and re-seed whenever it changes on the
  // server (a logo upload PATCHes it) so the form never drifts from the record.
  React.useEffect(() => {
    if (!dealer) return;
    setName(dealer.name);
    setAbout(dealer.aboutI18n?.en ?? "");
    setTrn(dealer.trn ?? "");
    setBrands(dealer.brands ?? []);
    setServices(dealer.services ?? []);
  }, [dealer]);

  const canEdit =
    context?.permissions?.role === "OWNER" ||
    context?.permissions?.role === "MANAGER" ||
    (context?.permissions?.isStaff ?? false);

  const trnInvalid = trn.trim().length > 0 && !TRN_RE.test(trn.trim());

  const save = async () => {
    if (!dealer || !accessToken || saving || trnInvalid) return;
    setSaving(true);
    try {
      const trimmedTrn = trn.trim();
      await updateDealer(
        dealer.id,
        {
          name: name.trim(),
          about: about.trim(),
          brands,
          services,
          // An empty TRN is "not provided yet", not "clear it" — sending "" would
          // fail the 15-digit pattern and refuse the whole save.
          ...(trimmedTrn ? { trn: trimmedTrn } : {}),
        },
        accessToken,
      );
      toast({ title: t("editProfile.saved"), variant: "success" });
      await refresh();
    } catch (err) {
      toast({
        title: err instanceof ApiError ? err.message : t("editProfile.failed"),
        variant: "warning",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
      </main>
    );
  }
  if (needsOnboarding) return <DealerOnboarding onCreated={refresh} />;
  if (error || !context || !dealer || !accessToken) {
    return <main className="p-8 text-sm text-muted">{t("errors.load")}</main>;
  }

  return (
    <DealerLayout
      context={context}
      quota={quota}
      title={t("editProfile.title")}
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link href={`/dealers/${dealer.slug}`}>
            <ExternalLink aria-hidden />
            {t("editProfile.publicLink")}
          </Link>
        </Button>
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <p className="text-sm text-muted">{t("editProfile.hint")}</p>

        <Panel className="p-5">
          <LogoUploader
            dealerId={dealer.id}
            dealerName={dealer.name}
            logoKey={dealer.logoKey}
            accessToken={accessToken}
            canEdit={canEdit}
            onSaved={refresh}
          />
        </Panel>

        <Panel className="flex flex-col gap-4 p-5">
          {!canEdit && (
            <p className="rounded-card border border-line bg-page p-3 text-sm text-muted">
              {t("editProfile.readOnly")}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dealer-name">{t("editProfile.nameLabel")}</Label>
            <Input
              id="dealer-name"
              value={name}
              maxLength={120}
              disabled={!canEdit}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dealer-about">{t("editProfile.aboutLabel")}</Label>
            <Textarea
              id="dealer-about"
              value={about}
              maxLength={2000}
              disabled={!canEdit}
              aria-describedby="dealer-about-hint"
              onChange={(event) => setAbout(event.target.value)}
            />
            <p id="dealer-about-hint" className="text-xs text-muted">
              {t("editProfile.aboutHint")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dealer-trn">{t("editProfile.trnLabel")}</Label>
            <Input
              id="dealer-trn"
              value={trn}
              inputMode="numeric"
              maxLength={15}
              disabled={!canEdit}
              invalid={trnInvalid}
              aria-describedby="dealer-trn-hint"
              onChange={(event) => setTrn(event.target.value.replace(/\D/g, ""))}
            />
            <p id="dealer-trn-hint" className="text-xs text-muted">
              {t("editProfile.trnHint")}
            </p>
          </div>

          <TagListEditor
            id="dealer-brands"
            label={t("editProfile.brandsLabel")}
            hint={t("editProfile.listHint")}
            addLabel={t("editProfile.addAria", { field: t("editProfile.brandsLabel") })}
            removeLabel={(value) => t("editProfile.removeChip", { value })}
            emptyLabel={t("editProfile.emptyList")}
            values={brands}
            max={50}
            disabled={!canEdit}
            onChange={setBrands}
          />

          <TagListEditor
            id="dealer-services"
            label={t("editProfile.servicesLabel")}
            hint={t("editProfile.listHint")}
            addLabel={t("editProfile.addAria", { field: t("editProfile.servicesLabel") })}
            removeLabel={(value) => t("editProfile.removeChip", { value })}
            emptyLabel={t("editProfile.emptyList")}
            values={services}
            max={30}
            disabled={!canEdit}
            onChange={setServices}
          />

          {canEdit && (
            <div className="flex justify-end">
              <Button
                disabled={saving || name.trim().length < 2 || trnInvalid}
                onClick={() => void save()}
              >
                {saving && <Loader2 className="animate-spin" aria-hidden />}
                {t("editProfile.save")}
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </DealerLayout>
  );
}

/** Chip list with a text field — brands and services are free-text arrays. */
function TagListEditor({
  id,
  label,
  hint,
  addLabel,
  removeLabel,
  emptyLabel,
  values,
  max,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  addLabel: string;
  removeLabel: (value: string) => string;
  emptyLabel: string;
  values: string[];
  max: number;
  disabled?: boolean;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");

  const add = () => {
    const value = draft.trim();
    if (!value || values.length >= max) return;
    if (values.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          disabled={disabled || values.length >= max}
          aria-describedby={`${id}-hint`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !draft.trim() || values.length >= max}
          aria-label={addLabel}
          onClick={add}
        >
          <Plus aria-hidden />
        </Button>
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted">
        {hint}
      </p>
      {values.length === 0 ? (
        <p className="text-xs text-muted">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li key={value}>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand">
                {value}
                {!disabled && (
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-brand-surface"
                    aria-label={removeLabel(value)}
                    onClick={() => onChange(values.filter((item) => item !== value))}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  if (!session) {
    const prefix = locale === nextI18NextConfig.i18n.defaultLocale ? "" : `/${locale}`;
    return {
      redirect: {
        destination: `${prefix}/login?next=/dealer/profile`,
        permanent: false,
      },
    };
  }
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dealer", "listings", "home"],
        nextI18NextConfig,
      )),
    },
  };
};
