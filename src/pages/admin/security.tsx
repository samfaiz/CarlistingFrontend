/**
 * /admin/security — staff passkey enrolment + step-up (task P4-01, AC-AUTH-04).
 *
 * Staff cannot reach any admin API without amr=webauthn (global guard). This
 * page is the airlock: no passkey → enrol one (registration doubles as the
 * step-up); passkey but stale step-up → assert it. Both verify endpoints mint
 * a fresh token pair, which is handed to NextAuth via useSession().update()
 * so every subsequent call carries the stepped-up token.
 */
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import * as React from "react";
import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";
import { Fingerprint, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { requireAdminPageProps } from "@/components/admin/require-admin";
import {
  decodeStaffStepUp,
  getAuthenticationOptions,
  getRegistrationOptions,
  getWebAuthnCredentials,
  verifyAuthentication,
  verifyRegistration,
  type WebAuthnCredentialRow,
} from "@/components/admin/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import nextI18NextConfig from "../../../next-i18next.config.js";

export default function AdminSecurityPage() {
  const { t } = useTranslation("admin");
  const router = useRouter();
  const { data: session, update } = useSession();
  const token = session?.accessToken;

  const [credentials, setCredentials] = React.useState<WebAuthnCredentialRow[] | null>(null);
  const [label, setLabel] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const supported = typeof window !== "undefined" && browserSupportsWebAuthn();
  const stepUp = decodeStaffStepUp(token);

  React.useEffect(() => {
    if (!token) return;
    getWebAuthnCredentials(token)
      .then(setCredentials)
      .catch(() => setCredentials([]));
  }, [token]);

  const next = typeof router.query.next === "string" ? router.query.next : "/admin";

  const enrol = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const options = await getRegistrationOptions(token);
      const response = await startRegistration({
        optionsJSON: options as Parameters<typeof startRegistration>[0]["optionsJSON"],
      });
      const pair = await verifyRegistration(
        response,
        label.trim() || "Staff passkey",
        token,
      );
      await update({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
      toast({ title: t("security.toast.enrolled"), variant: "success" });
      void router.replace(next);
    } catch {
      toast({ title: t("security.toast.failed"), variant: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const assert = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const options = await getAuthenticationOptions(token);
      const response = await startAuthentication({
        optionsJSON: options as Parameters<typeof startAuthentication>[0]["optionsJSON"],
      });
      const pair = await verifyAuthentication(response, token);
      await update({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
      toast({ title: t("security.toast.steppedUp"), variant: "success" });
      void router.replace(next);
    } catch {
      toast({ title: t("security.toast.failed"), variant: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const hasPasskey = (credentials?.length ?? 0) > 0;

  return (
    <AdminLayout title={t("security.title")} skipStepUpGate>
      <div className="mx-auto max-w-lg">
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand-mid" aria-hidden />
            <h2 className="text-base font-bold text-ink">{t("security.heading")}</h2>
            {stepUp.isSteppedUp && (
              <Badge variant="green">{t("security.active")}</Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">{t("security.explainer")}</p>

          {!supported && (
            <p className="mt-3 rounded-card bg-warning-soft p-3 text-sm text-ink">
              {t("security.unsupported")}
            </p>
          )}

          {credentials === null ? (
            <div className="flex justify-center p-6">
              <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
            </div>
          ) : hasPasskey ? (
            <>
              <ul className="mt-4 space-y-2">
                {credentials.map((cred) => (
                  <li
                    key={cred.id}
                    className="flex items-center justify-between gap-2 rounded-card border border-line p-2.5 text-sm"
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <KeyRound className="size-4 text-muted" aria-hidden />
                      {cred.label ?? t("security.unnamedKey")}
                    </span>
                    <span className="text-xs text-muted">
                      {cred.lastUsedAt
                        ? t("security.lastUsed", {
                            time: formatRelativeTime(cred.lastUsedAt, "en"),
                          })
                        : formatRelativeTime(cred.createdAt, "en")}
                    </span>
                  </li>
                ))}
              </ul>
              {!stepUp.isSteppedUp && (
                <Button
                  className="mt-4 w-full"
                  disabled={busy || !supported}
                  onClick={() => void assert()}
                >
                  {busy ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Fingerprint aria-hidden />
                  )}
                  {t("security.stepUp")}
                </Button>
              )}
              {/* Escape hatch: the listed passkeys may live on ANOTHER device
                  (or be test artifacts). Always allow enrolling one here, so a
                  staffer is never locked out of their own airlock. Registration
                  is password-authenticated and doubles as the step-up — same
                  backend policy as first-time enrolment. */}
              <div className="mt-5 space-y-3 border-t border-line pt-4">
                <p className="text-xs text-muted">{t("security.addHere")}</p>
                <div>
                  <Label htmlFor="passkey-label-extra">{t("security.labelField")}</Label>
                  <Input
                    id="passkey-label-extra"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder={t("security.labelPlaceholder")}
                    maxLength={60}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={busy || !supported}
                  onClick={() => void enrol()}
                >
                  {busy ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Fingerprint aria-hidden />
                  )}
                  {t("security.enrol")}
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="passkey-label">{t("security.labelField")}</Label>
                <Input
                  id="passkey-label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder={t("security.labelPlaceholder")}
                  maxLength={60}
                />
              </div>
              <Button
                className="w-full"
                disabled={busy || !supported}
                onClick={() => void enrol()}
              >
                {busy ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Fingerprint aria-hidden />
                )}
                {t("security.enrol")}
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const gate = await requireAdminPageProps(ctx);
  if ("notFound" in gate || "redirect" in gate) return gate;
  const locale = ctx.locale ?? nextI18NextConfig.i18n.defaultLocale;
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "admin"], nextI18NextConfig)),
    },
  };
};
