/**
 * Dealer onboarding (task P3-01 FE, FR-DP9).
 *
 * Shown whenever a signed-in user reaches /dealer/* without a dealership. The
 * TRN is optional here on purpose: blocking signup on a tax number the owner
 * may not have to hand loses the account, and invoicing already hard-blocks
 * without it (Art. 59) at the only moment it actually matters.
 */
import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { createDealer } from "@/lib/marketplace-api";

export function DealerOnboarding({ onCreated }: { onCreated: () => void | Promise<void> }) {
  const { t } = useTranslation("dealer");
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const [name, setName] = React.useState("");
  const [trn, setTrn] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken || submitting) return;
    setSubmitting(true);
    setFieldError(null);
    try {
      await createDealer(
        {
          name: name.trim(),
          ...(trn.trim() ? { trn: trn.trim() } : {}),
          ...(about.trim() ? { about: about.trim() } : {}),
        },
        accessToken,
      );
      toast({ title: t("onboarding.created"), variant: "success" });
      await onCreated();
      void router.replace("/dealer");
    } catch (err) {
      // The backend's message is more useful than a generic one here: it names
      // the exact rule (TRN format, one-dealership-per-owner).
      const message =
        err instanceof ApiError ? err.message : t("onboarding.failed");
      setFieldError(message);
      toast({ title: t("onboarding.failed"), variant: "warning" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`${t("onboarding.title")} — Carsens`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="mx-auto w-full max-w-xl px-4 py-12">
        <Panel className="p-6">
          <Store className="size-7 text-brand-mid" aria-hidden />
          <h1 className="mt-3 text-xl font-extrabold text-ink">
            {t("onboarding.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("onboarding.hint")}</p>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dealer-name">{t("onboarding.nameLabel")}</Label>
              <Input
                id="dealer-name"
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dealer-trn">{t("onboarding.trnLabel")}</Label>
              <Input
                id="dealer-trn"
                inputMode="numeric"
                maxLength={15}
                value={trn}
                onChange={(e) => setTrn(e.target.value.replace(/\D/g, ""))}
                aria-describedby="dealer-trn-hint"
              />
              <p id="dealer-trn-hint" className="text-xs text-muted">
                {t("onboarding.trnHint")}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dealer-about">{t("onboarding.aboutLabel")}</Label>
              <Textarea
                id="dealer-about"
                rows={3}
                maxLength={2000}
                value={about}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setAbout(e.target.value)
                }
              />
            </div>

            {fieldError && (
              <p role="alert" className="text-sm text-danger-strong">
                {fieldError}
              </p>
            )}

            <Button type="submit" disabled={submitting || name.trim().length < 2}>
              {submitting && <Loader2 className="animate-spin" aria-hidden />}
              {t("onboarding.submit")}
            </Button>
          </form>
        </Panel>
      </main>
    </>
  );
}
