import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { submitSupportTicket } from "@/lib/marketplace-api";
import nextI18NextConfig from "../../next-i18next.config.js";

export default function MkcontactPage() {
  const { t } = useTranslation("mk-contact");
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Keep the pixel-exact mockup form, but really file a support ticket.
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await submitSupportTicket({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        subject: String(form.get("subject") ?? "General"),
        body: String(form.get("message") ?? ""),
      });
      setDone(true);
      (e.currentTarget as HTMLFormElement).reset();
    } catch {
      setError(t("errors.generic", { defaultValue: "Could not send your message. Please try again." }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-contact" className="page">

          {/* Hero */}
          <div className="contact-hero">
            <div className="container">
              <h1>{t("hero.title")}</h1>
              <p>{t("hero.subtitle")}</p>
            </div>
          </div>

          <div className="contact-wrap">
            <div className="container">

              {/* Channel cards */}
              <div className="channels-row">
                <div className="channel-card">
                  <div className="ch-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                  </div>
                  <h4>{t("channels.call.title")}</h4>
                  <p>{t("channels.call.desc")}</p>
                  <div className="ch-value">{t("channels.call.value")}</div>
                  <div className="ch-status">{t("channels.call.status")}</div>
                </div>

                <div className="channel-card">
                  <div className="ch-icon green">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5 0-.1-.2-.2-.5-.4zM12 21c-1.8 0-3.5-.5-5-1.4l-3.5 1 1-3.4c-1-1.6-1.5-3.4-1.5-5.2 0-5 4-9 9-9s9 4 9 9-4 9-9 9z" /></svg>
                  </div>
                  <h4>{t("channels.whatsapp.title")}</h4>
                  <p>{t("channels.whatsapp.desc")}</p>
                  <div className="ch-value">{t("channels.whatsapp.value")}</div>
                  <div className="ch-status">{t("channels.whatsapp.status")}</div>
                </div>

                <div className="channel-card">
                  <div className="ch-icon blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </div>
                  <h4>{t("channels.email.title")}</h4>
                  <p>{t("channels.email.desc")}</p>
                  <div className="ch-value">{t("channels.email.value")}</div>
                  <div className="ch-status" style={{ color: "var(--text-2)" }}>{t("channels.email.status")}</div>
                </div>
              </div>

              {/* Two-column: form + offices */}
              <div className="contact-grid">

                {/* Contact form */}
                <div className="contact-form-card">
                  <h2>{t("form.title")}</h2>
                  <p>{t("form.subtitle")}</p>

                  <form onSubmit={onSubmit}>
                    {done && <p role="status" style={{ color: "var(--success)", marginBottom: 12 }}>{t("sent", { defaultValue: "Thanks — your message has been sent. We’ll reply by email." })}</p>}
                    {error && <p role="alert" style={{ color: "var(--error)", marginBottom: 12 }}>{error}</p>}
                    <div className="contact-form-grid">
                      <div className="form-group">
                        <label>{t("form.name.label")}</label>
                        <input name="name" className="form-input" placeholder={t("form.name.placeholder")} required />
                      </div>
                      <div className="form-group">
                        <label>{t("form.mobile.label")}</label>
                        <input className="form-input" placeholder={t("form.mobile.placeholder")} />
                      </div>
                      <div className="form-group full">
                        <label>{t("form.email.label")}</label>
                        <input name="email" className="form-input" type="email" placeholder={t("form.email.placeholder")} required />
                      </div>
                      <div className="form-group full">
                        <label>{t("form.subject.label")}</label>
                        <select name="subject" className="form-input" defaultValue="General">
                          <option>{t("form.subject.options.general")}</option>
                          <option>{t("form.subject.options.listing")}</option>
                          <option>{t("form.subject.options.account")}</option>
                          <option>{t("form.subject.options.safety")}</option>
                          <option>{t("form.subject.options.dealer")}</option>
                          <option>{t("form.subject.options.partnerships")}</option>
                          <option>{t("form.subject.options.other")}</option>
                        </select>
                      </div>
                      <div className="form-group full">
                        <label>{t("form.message.label")}</label>
                        <textarea name="message" minLength={10} placeholder={t("form.message.placeholder")} required></textarea>
                      </div>
                      <div className="form-group full">
                        <label className="terms" style={{ margin: 0 }}>
                          <input type="checkbox" defaultChecked />
                          <span>{t("form.consent")}</span>
                        </label>
                      </div>
                      <div className="form-group full">
                        <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ marginInlineEnd: "8px" }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                          {t("form.submit")}
                        </button>
                        <button type="reset" className="btn btn-outline">{t("form.reset")}</button>
                      </div>
                    </div>
                  </form>

                  <div id="contactSuccess" style={{ display: "none", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "22px 24px", textAlign: "center" }}>
                    <div style={{ width: "54px", height: "54px", borderRadius: "99px", background: "linear-gradient(135deg,#22C55E,#15803D)", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 style={{ margin: "0 0 6px", color: "#15803D" }}>{t("form.success.title")}</h3>
                    <p style={{ margin: 0, color: "#166534", fontSize: "14px" }}>{t("form.success.desc")}</p>
                  </div>
                </div>

                {/* Offices sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                  <div className="office-card">
                    <h4>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {t("offices.title")}
                    </h4>
                    <div className="office-row">
                      <strong>{t("offices.dubai.name")}</strong>
                      <span className="o-addr">{t("offices.dubai.line1")}<br />{t("offices.dubai.line2")}</span>
                      <span className="o-phone">{t("offices.dubai.phone")}</span>
                    </div>
                    <div className="office-row">
                      <strong>{t("offices.abudhabi.name")}</strong>
                      <span className="o-addr">{t("offices.abudhabi.line1")}<br />{t("offices.abudhabi.line2")}</span>
                      <span className="o-phone">{t("offices.abudhabi.phone")}</span>
                    </div>
                    <div className="office-row">
                      <strong>{t("offices.sharjah.name")}</strong>
                      <span className="o-addr">{t("offices.sharjah.line1")}<br />{t("offices.sharjah.line2")}</span>
                      <span className="o-phone">{t("offices.sharjah.phone")}</span>
                    </div>
                  </div>

                  <div className="office-card">
                    <h4>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {t("hours.title")}
                      <span style={{ marginLeft: "auto", color: "var(--success)", fontSize: "11px", fontWeight: 700 }}>{t("hours.open")}</span>
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}><span style={{ color: "var(--text-2)" }}>{t("hours.monThu.day")}</span><span style={{ fontWeight: 600 }}>{t("hours.monThu.time")}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", background: "var(--brand-light)", padding: "6px 10px", borderRadius: "6px", margin: "0 -10px" }}><span style={{ color: "var(--brand)", fontWeight: 700 }}>{t("hours.today.day")}</span><span style={{ fontWeight: 700, color: "var(--brand)" }}>{t("hours.today.time")}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}><span style={{ color: "var(--text-2)" }}>{t("hours.friday.day")}</span><span style={{ fontWeight: 600 }}>{t("hours.friday.time")}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}><span style={{ color: "var(--text-2)" }}>{t("hours.satSun.day")}</span><span style={{ fontWeight: 600 }}>{t("hours.satSun.time")}</span></div>
                    </div>
                  </div>

                  <div className="office-card">
                    <h4>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
                      {t("social.title")}
                    </h4>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <a href="#" className="btn-icon" title={t("social.instagram")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></a>
                      <a href="#" className="btn-icon" title={t("social.twitter")}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.8c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1-.8-.8-1.9-1.3-3.1-1.3-2.3 0-4.2 1.9-4.2 4.2 0 .3 0 .7.1 1C8 8.8 4.5 7 2.2 4.2c-.4.6-.6 1.3-.6 2.1 0 1.5.8 2.8 1.9 3.5-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.7 3.3 4.1-.3.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.6 2.1 2.9 4 2.9-1.4 1.1-3.3 1.8-5.3 1.8H1c1.8 1.2 4 1.9 6.3 1.9 7.5 0 11.7-6.2 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z" /></svg></a>
                      <a href="#" className="btn-icon" title={t("social.facebook")}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12z" /></svg></a>
                      <a href="#" className="btn-icon" title={t("social.linkedin")}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.3 18.3H5.7v-8h2.6v8zM7 9.2a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11.3 9.1h-2.6v-4.4c0-1.1 0-2.4-1.5-2.4s-1.7 1.1-1.7 2.3v4.5h-2.6v-8h2.5v1.1c.4-.7 1.2-1.3 2.5-1.3 2.7 0 3.2 1.8 3.2 4v4.2z" /></svg></a>
                      <a href="#" className="btn-icon" title={t("social.youtube")}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.6s-.2-1.6-.9-2.3c-.8-.9-1.8-.9-2.2-1C16.6 4 12 4 12 4s-4.6 0-7.9.3c-.5.1-1.4.1-2.2 1C1.2 6 1 7.6 1 7.6S.8 9.5.8 11.5v1.7c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1C6 20.4 12 20.5 12 20.5s4.6 0 7.9-.3c.5-.1 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.7c0-1.9-.2-3.8-.2-3.8zM9.7 14.9V8.5l6 3.2-6 3.2z" /></svg></a>
                    </div>
                  </div>

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
      ["common", "mk-contact"],
      nextI18NextConfig,
    )),
  },
});
