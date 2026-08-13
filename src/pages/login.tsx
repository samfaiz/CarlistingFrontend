import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { signIn } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MkloginPage() {
  const { t } = useTranslation("mk-login");
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Keep the pixel-exact mockup form, but make it actually authenticate.
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const next = typeof router.query.next === "string" && router.query.next.startsWith("/")
      ? router.query.next : "/account";
    const res = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });
    setBusy(false);
    if (res?.error) setError(t("errors.invalid", { defaultValue: "Invalid email or password" }));
    else void router.push(next);
  };

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-login" className="page">
          <div className="auth-wrap">
            <div className="auth-card">
              <div className="brand-mark">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2M9 11l1-3h4l1 3" /></svg>
              </div>
              <h1>{t("hero.title")}</h1>
              <p className="auth-sub">{t("hero.subtitle")}</p>

              <form onSubmit={onSubmit}>
                {error && (
                  <p className="form-error" role="alert" style={{ color: "var(--error)", fontSize: 13, margin: "0 0 12px" }}>{error}</p>
                )}
                <div className="form-group">
                  <label>{t("form.emailLabel")}</label>
                  <input name="email" required className="form-input" type="email" placeholder={t("form.emailPlaceholder")} autoComplete="email" />
                </div>
                <div className="form-group">
                  <label>{t("form.passwordLabel")}</label>
                  <div className="pwd-wrap">
                    <input name="password" required className="form-input" type="password" id="loginPwd" placeholder="••••••••" autoComplete="current-password" />
                    <button className="pwd-toggle" type="button" data-target="loginPwd" title={t("form.togglePassword")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                  </div>
                </div>
                <div className="form-row">
                  <label className="remember"><input type="checkbox" defaultChecked /> {t("form.rememberMe")}</label>
                  <Link href="/forgot-password" className="forgot-link">{t("form.forgotPassword")}</Link>
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.8c0-3.2 2.6-4.7 2.7-4.8-1.5-2.2-3.8-2.5-4.6-2.5-2-.2-3.8 1.1-4.8 1.1s-2.5-1.1-4.2-1.1c-2.2 0-4.2 1.3-5.3 3.3-2.3 4-.6 9.8 1.6 13 1.1 1.6 2.4 3.3 4.1 3.3 1.7-.1 2.3-1 4.3-1s2.6 1 4.3 1c1.8 0 2.9-1.6 4-3.2 1.3-1.8 1.8-3.6 1.8-3.7-.1-.1-3.4-1.3-3.4-5.1-.5-.3-.5-.3-.5-.3zM13.3 3.4c.9-1.1 1.5-2.6 1.3-4.1-1.3.1-2.8.9-3.8 2-.9 1-1.6 2.5-1.4 4 1.5.1 3-.8 3.9-1.9z" /></svg>
                  {t("social.apple")}
                </button>
                <button className="social-btn">
                  <span style={{ fontWeight: 800, color: "#000", fontSize: "13px" }}>{t("social.uaePassBadge")}</span>
                  {t("social.uaePass")}
                </button>
              </div>

              <p className="auth-switch">{t("switch.prompt")} <Link href="/register">{t("switch.link")}</Link></p>
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
      ["common", "mk-login"],
      nextI18NextConfig,
    )),
  },
});
