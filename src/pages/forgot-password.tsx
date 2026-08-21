import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { forgotPassword } from "@/lib/marketplace-api";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MkforgotPage() {
  const { t } = useTranslation("mk-forgot");
  const [sent, setSent] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const onSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    try { await forgotPassword(email.trim()); } catch { /* never disclose */ }
    setSent(true);
    setBusy(false);
  };
  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-forgot" className="page">
          <div className="auth-wrap">
            <div className="auth-card">

              {/* STATE A: Email entry */}
              <div className={`auth-state${sent ? "" : " active"}`} data-fstate="enter">
                <div className="brand-mark">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <h1>{t("enter.title")}</h1>
                <p className="auth-sub">{t("enter.subtitle")}</p>

                <form id="forgotForm" onSubmit={onSend}>
                  <div className="form-group">
                    <label htmlFor="forgotEmail">{t("enter.emailLabel")}</label>
                    <input className="form-input" type="email" id="forgotEmail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("enter.emailPlaceholder")} autoComplete="email" required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg btn-block" id="sendResetBtn" disabled={busy}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    {t("enter.sendBtn")}
                  </button>
                </form>

                <div className="auth-tip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {t("enter.tip")}
                </div>

                <p className="auth-switch">
                  {t("enter.rememberPrefix")} <Link href="/login">{t("enter.backToLogin")}</Link>
                </p>
              </div>

              {/* STATE B: Sent confirmation */}
              <div className={`auth-state${sent ? " active" : ""}`} data-fstate="sent">
                <div className="sent-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <h1>{t("sent.title")}</h1>
                <p className="auth-sub">{t("sent.subtitle")}</p>
                <div style={{ textAlign: "center", margin: "14px 0 18px" }}>
                  <span className="sent-email-tag" id="sentEmailLabel">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {email || t("sent.email")}
                  </span>
                </div>
                <p className="auth-sub" style={{ marginBottom: "18px" }}>{t("sent.instructionPrefix")} <strong>{t("sent.validity")}</strong>{t("sent.instructionSuffix")}</p>

                <Link href="/reset-password" className="btn btn-primary btn-lg btn-block">
                  {t("sent.openResetBtn")}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>

                <div className="resend-timer" id="resendTimer">
                  {t("sent.resendPrefix")} <button id="resendBtn" disabled>{t("sent.resendPart1")}<span id="resendCount">60</span>{t("sent.resendPart2")}</button>
                </div>

                <p className="auth-switch" style={{ marginTop: "14px" }}>
                  <Link href="/login">{t("sent.backToLogin")}</Link>
                </p>
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
      ["common", "mk-forgot"],
      nextI18NextConfig,
    )),
  },
});
