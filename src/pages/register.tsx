import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { ApiError, apiPost } from "@/lib/api";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MkregisterPage() {
  const { t } = useTranslation("mk-register");
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);
  /**
   * What the visitor says they came to do. The mockup shipped these three as
   * decorative buttons — no handler, the first hardcoded "active", the choice
   * never captured. It is advisory: it grants nothing, and only decides where
   * they land once their email is verified.
   */
  const [intent, setIntent] = React.useState<"BUYER" | "SELLER" | "DEALER">("BUYER");

  // Keep the pixel-exact mockup form, but really create the account
  // (POST /auth/register → e-mail verification, matching the P0-05 contract).
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await apiPost("/auth/register", {
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
        locale: router.locale ?? "en",
        signupIntent: intent,
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.statusCode === 409
          ? t("errors.exists", { defaultValue: "That email is already registered" })
          : t("errors.generic", { defaultValue: "Could not create the account" }),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-register" className="page">
          <div className="auth-wrap">
            <div className="auth-card" style={{ maxWidth: "520px" }}>
              <div className="brand-mark">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2M9 11l1-3h4l1 3" /></svg>
              </div>
              <h1>{t("hero.title")}</h1>
              <p className="auth-sub">{t("hero.subtitle")}</p>

              <div className="acc-type" id="accType" role="group" aria-label={t("accType.legend")}>
                <button
                  type="button"
                  className={intent === "BUYER" ? "acc-type-btn active" : "acc-type-btn"}
                  aria-pressed={intent === "BUYER"}
                  onClick={() => setIntent("BUYER")}
                >
                  <div className="at-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg></div>
                  <span className="at-label">{t("accType.buyer.label")}</span>
                  <span className="at-sub">{t("accType.buyer.sub")}</span>
                </button>
                <button
                  type="button"
                  className={intent === "SELLER" ? "acc-type-btn active" : "acc-type-btn"}
                  aria-pressed={intent === "SELLER"}
                  onClick={() => setIntent("SELLER")}
                >
                  <div className="at-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2" /></svg></div>
                  <span className="at-label">{t("accType.seller.label")}</span>
                  <span className="at-sub">{t("accType.seller.sub")}</span>
                </button>
                <button
                  type="button"
                  className={intent === "DEALER" ? "acc-type-btn active" : "acc-type-btn"}
                  aria-pressed={intent === "DEALER"}
                  onClick={() => setIntent("DEALER")}
                >
                  <div className="at-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" /></svg></div>
                  <span className="at-label">{t("accType.dealer.label")}</span>
                  <span className="at-sub">{t("accType.dealer.sub")}</span>
                </button>
              </div>

              <form onSubmit={onSubmit}>
                {done && (
                  <p role="status" style={{ color: "var(--success)", fontSize: 14, margin: "0 0 12px" }}>{t("success", { defaultValue: "Account created — check your inbox to verify your email." })}</p>
                )}
                {error && (
                  <p role="alert" style={{ color: "var(--error)", fontSize: 13, margin: "0 0 12px" }}>{error}</p>
                )}
                <div className="profile-grid">
                  <div className="form-group">
                    <label htmlFor="register-form-fullName-label">{t("form.fullName.label")}</label>
                    <input id="register-form-fullName-label" name="name" required className="form-input" placeholder={t("form.fullName.placeholder")} autoComplete="name" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-form-mobile-label">{t("form.mobile.label")}</label>
                    <input id="register-form-mobile-label" name="phone" type="tel" inputMode="tel" className="form-input" placeholder={t("form.mobile.placeholder")} autoComplete="tel" />
                  </div>
                  <div className="form-group full">
                    <label htmlFor="register-form-email-label">{t("form.email.label")}</label>
                    <input id="register-form-email-label" name="email" required className="form-input" type="email" placeholder={t("form.email.placeholder")} autoComplete="email" />
                  </div>
                  <div className="form-group full">
                    <label htmlFor="regPwd">{t("form.password.label")}</label>
                    <div className="pwd-wrap">
                      <input name="password" required minLength={8} className="form-input" type={showPwd ? "text" : "password"} id="regPwd" placeholder={t("form.password.placeholder")} autoComplete="new-password" />
                      <button
                        className="pwd-toggle"
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        aria-pressed={showPwd}
                        aria-controls="regPwd"
                        aria-label={t("form.togglePassword")}
                        title={t("form.togglePassword")}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                    </div>
                    <div className="strength" id="strength">
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                      <div className="strength-bar"></div>
                    </div>
                    <div className="strength-text" id="strengthText">{t("form.password.hint")}</div>
                  </div>
                </div>

                <div className="terms">
                  {/* The links used to be href="#" inside the <label>: tapping
                      "Terms" navigated nowhere AND toggled the consent box.
                      Real routes, and the label is now associated by id so the
                      browser suppresses label activation on the links. */}
                  <input id="register-terms" type="checkbox" required />
                  <label htmlFor="register-terms">{t("terms.pre")} <Link href="/legal/terms">{t("terms.tos")}</Link> {t("terms.and")} <Link href="/legal/privacy">{t("terms.privacy")}</Link>{t("terms.post")}</label>
                </div>

                <button type="submit" disabled={busy} className="btn btn-primary btn-lg btn-block">{t("form.submit")}</button>
              </form>

              <div className="divider">{t("divider")}</div>

              <div className="social-row">
                <button className="social-btn">
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.1 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6.2 5.2C40.7 35 44 30 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
                  {t("social.google")}
                </button>
                <button className="social-btn">
                  <span style={{ fontWeight: 800, color: "#000", fontSize: "13px" }}>{t("social.uaePassBadge")}</span>
                  {t("social.uaePass")}
                </button>
              </div>

              <p className="auth-switch">{t("switch.text")} <Link href="/login">{t("switch.link")}</Link></p>
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
      ["common", "mk-register"],
      nextI18NextConfig,
    )),
  },
});
