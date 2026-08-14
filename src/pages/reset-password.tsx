import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { useRouter } from "next/router";
import { resetPassword } from "@/lib/marketplace-api";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MkresetPage() {
  const { t } = useTranslation("mk-reset");
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [state, setState] = React.useState<"form" | "success">("form");
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const onReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    if (!token) { setErr(t("errors.noToken", { defaultValue: "This reset link is invalid — request a new one." })); return; }
    if (!RULE.test(pwd)) { setErr(t("errors.weak", { defaultValue: "Use at least 8 characters with upper, lower and a digit." })); return; }
    if (pwd !== confirm) { setErr(t("errors.mismatch", { defaultValue: "Passwords do not match." })); return; }
    setBusy(true);
    try {
      await resetPassword(token, pwd);
      setState("success");
    } catch {
      setErr(t("errors.expired", { defaultValue: "This reset link has expired or was already used — request a new one." }));
    } finally { setBusy(false); }
  };
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-reset" className="page">
          <div className="auth-wrap">
            <div className="auth-card">

              {/* STATE A: New password form */}
              <div className={`auth-state${state === "form" ? " active" : ""}`} data-rstate="form">
                <div className="brand-mark">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /><circle cx="12" cy="16" r="1.5" fill="currentColor" /></svg>
                </div>
                <h1>{t("form.title")}</h1>
                <p className="auth-sub">{t("form.subtitle")}</p>

                <form id="resetForm" onSubmit={onReset}>
                  {err && <p role="alert" style={{ color: "var(--error)", marginBottom: 12 }}>{err}</p>}
                  <div className="form-group">
                    <label>{t("form.newPassword.label")}</label>
                    <div className="pwd-wrap">
                      <input className="form-input" type="password" id="newPwd" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder={t("form.newPassword.placeholder")} autoComplete="new-password" required />
                      <button className="pwd-toggle" type="button" data-target="newPwd" title={t("form.togglePassword")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                    </div>
                    <div className="strength" id="resetStrength">
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                    </div>
                    <div className="strength-text" id="resetStrengthText">{t("form.strengthHint")}</div>
                  </div>

                  <div className="form-group">
                    <label>{t("form.confirmPassword.label")}</label>
                    <div className="pwd-wrap">
                      <input className="form-input" type="password" id="confirmPwd" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t("form.confirmPassword.placeholder")} autoComplete="new-password" required />
                      <button className="pwd-toggle" type="button" data-target="confirmPwd" title={t("form.togglePassword")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                    </div>
                    <div className="match-indicator" id="matchIndicator"></div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg btn-block" id="updatePwdBtn" disabled={busy}>
                    {t("form.submit")}
                  </button>
                </form>

                <div className="auth-tip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /><path d="M9 12l2 2 4-4" /></svg>
                  {t("form.tip")}
                </div>

                <p className="auth-switch">
                  <Link href="/login">{t("form.backToLogin")}</Link>
                </p>
              </div>

              {/* STATE B: Success */}
              <div className={`auth-state${state === "success" ? " active" : ""}`} data-rstate="success">
                <div className="success-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <h1>{t("success.title")}</h1>
                <p className="auth-sub" style={{ marginBottom: "20px" }}>{t("success.subtitle")}</p>

                <Link href="/login" className="btn btn-primary btn-lg btn-block">
                  {t("success.continue")}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                </Link>

                <div className="auth-tip" style={{ marginTop: "18px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {t("success.tip")}
                </div>
              </div>

            </div>
          </div>
        </main>
      </MockupLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(
      locale ?? nextI18NextConfig.i18n.defaultLocale,
      ["common", "mk-reset"],
      nextI18NextConfig,
    )),
  },
});
