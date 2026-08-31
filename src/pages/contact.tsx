import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { submitSupportTicket } from "@/lib/marketplace-api";
import nextI18NextConfig from "../../next-i18next.config.js";
import { SOCIALS } from "@/lib/socials";

/* The page is four labelled regions, in the order a visitor needs them:
   1. the ways to reach a human right now (no form to read first),
   2. the message form + what happens after you send it,
   3. the offices you can walk into,
   4. the company/legal footprint.
   Each region is a <section> with its own heading, so a screen reader can
   jump between them and the eye has a boundary to rest on. */

/** tel:/wa.me hrefs are derived from the catalogue value, so a number is only
 *  ever corrected in one place. */
const telHref = (display: string) => `tel:${display.replace(/[^\d+]/g, "")}`;
const waHref = (display: string) => `https://wa.me/${display.replace(/\D/g, "")}`;

/* Canonical wire values for the ticket subject — NOT UI copy (the visible
   label is the catalogue key beside it). The select previously carried no
   values at all, so `defaultValue="General"` matched nothing and staff
   received the subject in whatever language the visitor happened to browse
   in. Staff triage is English, so the value is pinned to English. */
const SUBJECTS = [
  { key: "general", value: "General enquiry" },
  { key: "listing", value: "Help with a listing" },
  { key: "account", value: "Account or login" },
  { key: "safety", value: "Safety / report a scam" },
  { key: "dealer", value: "Dealer enquiry" },
  { key: "partnerships", value: "Partnerships & press" },
  { key: "other", value: "Other" },
] as const;

/** Support-desk hours, keyed to the catalogue rows, in Asia/Dubai days. */
const HOURS = [
  { key: "monThu", days: [1, 2, 3, 4] },
  { key: "friday", days: [5] },
  { key: "satSun", days: [6, 0] },
] as const;

const SOCIAL_NETWORKS = [
  { name: "Instagram", labelKey: "social.instagram" },
  { name: "X", labelKey: "social.twitter" },
  { name: "Facebook", labelKey: "social.facebook" },
  { name: "LinkedIn", labelKey: "social.linkedin" },
  { name: "YouTube", labelKey: "social.youtube" },
] as const;

const MESSAGE_MAX = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

type FieldName = "name" | "phone" | "email" | "message" | "consent";
type Errors = Partial<Record<FieldName, string>>;

interface Values {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
}

const EMPTY: Values = {
  name: "",
  phone: "",
  email: "",
  subject: SUBJECTS[0].value,
  message: "",
  consent: false,
};

/** Field ids double as the focus target when validation fails. */
const FIELD_ID: Record<FieldName, string> = {
  name: "contact-name",
  phone: "contact-phone",
  email: "contact-email",
  message: "contact-message",
  consent: "contact-consent",
};

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="7.5" x2="12" y2="13" />
      <line x1="12" y1="16.5" x2="12" y2="16.6" />
    </svg>
  );
}

export default function MkcontactPage() {
  const { t } = useTranslation("mk-contact");

  const [values, setValues] = React.useState<Values>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "failed">("idle");
  // Only nag after the visitor has actually tried to send once.
  const attempted = React.useRef(false);

  const validate = React.useCallback(
    (v: Values): Errors => {
      const next: Errors = {};
      const name = v.name.trim();
      if (!name) next.name = t("form.errors.nameRequired");
      else if (name.length < 2) next.name = t("form.errors.nameShort");

      const email = v.email.trim();
      if (!email) next.email = t("form.errors.emailRequired");
      else if (!EMAIL_RE.test(email)) next.email = t("form.errors.emailInvalid");

      const phone = v.phone.trim();
      if (phone && !PHONE_RE.test(phone)) next.phone = t("form.errors.phoneInvalid");

      const message = v.message.trim();
      if (!message) next.message = t("form.errors.messageRequired");
      else if (message.length < 10) next.message = t("form.errors.messageShort");
      else if (message.length > MESSAGE_MAX) next.message = t("form.errors.messageLong", { max: MESSAGE_MAX });

      if (!v.consent) next.consent = t("form.errors.consentRequired");
      return next;
    },
    [t],
  );

  const update = React.useCallback(
    <K extends keyof Values>(field: K, value: Values[K]) => {
      setValues((prev) => {
        const next = { ...prev, [field]: value };
        if (attempted.current) setErrors(validate(next));
        return next;
      });
    },
    [validate],
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    attempted.current = true;
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("idle");
      const first = (Object.keys(FIELD_ID) as FieldName[]).find((f) => found[f]);
      if (first) document.getElementById(FIELD_ID[first])?.focus();
      return;
    }

    setStatus("sending");
    try {
      /* The ticket API takes name/email/subject/body only, so the mobile
         number rides along inside the body rather than being collected and
         thrown away, which is what used to happen. */
      const phone = values.phone.trim();
      const body = phone
        ? `${values.message.trim()}\n\n${t("form.mobile.label")}: ${phone}`
        : values.message.trim();
      await submitSupportTicket({
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject,
        body,
      });
      setValues(EMPTY);
      setErrors({});
      attempted.current = false;
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  // Which support-hours row is "today" in Dubai — resolved after mount so the
  // statically rendered HTML and the hydrated tree agree.
  const [todayRow, setTodayRow] = React.useState<string | null>(null);
  React.useEffect(() => {
    const short = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dubai",
      weekday: "short",
    }).format(new Date());
    const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(short);
    const row = HOURS.find((h) => (h.days as readonly number[]).includes(index));
    setTodayRow(row ? row.key : null);
  }, []);

  const socials = SOCIAL_NETWORKS.filter((s) => Boolean(SOCIALS[s.name]));
  const describedBy = (field: FieldName, extra?: string) =>
    [errors[field] ? `${FIELD_ID[field]}-error` : null, extra].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <Head><title>{`${t("meta.title")} — Carsens`}</title></Head>
      <MockupLayout>
        <main id="page-contact" className="page">

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <div className="contact-hero">
            <div className="container">
              <p className="contact-eyebrow">{t("hero.eyebrow")}</p>
              <h1>{t("hero.title")}</h1>
              <p className="contact-hero-sub">{t("hero.subtitle")}</p>
              <div className="contact-hero-actions">
                <a className="btn btn-primary btn-lg" href={telHref(t("channels.call.value"))}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                  {t("hero.actions.call")}
                </a>
                <a className="btn btn-lg contact-hero-ghost" href="#contact-form">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                  {t("hero.actions.write")}
                </a>
              </div>
            </div>
          </div>

          <div className="contact-wrap">
            <div className="container contact-sections">

              {/* ── 1. Ways to reach us ────────────────────────────────── */}
              <section className="contact-section" aria-labelledby="contact-channels-h">
                <div className="contact-section-head">
                  <h2 id="contact-channels-h">{t("channels.title")}</h2>
                  <p>{t("channels.subtitle")}</p>
                </div>

                <div className="channels-row">
                  <a className="channel-card" href={telHref(t("channels.call.value"))}>
                    <span className="ch-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                    </span>
                    <h3>{t("channels.call.title")}</h3>
                    <p>{t("channels.call.desc")}</p>
                    <span className="ch-value">{t("channels.call.value")}</span>
                    <span className="ch-status">{t("channels.call.status")}</span>
                  </a>

                  <a className="channel-card" href={waHref(t("channels.whatsapp.value"))} target="_blank" rel="noopener noreferrer">
                    <span className="ch-icon green">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1s-1.3-.5-2.4-1.5c-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5 0-.1-.2-.2-.5-.4zM12 21c-1.8 0-3.5-.5-5-1.4l-3.5 1 1-3.4c-1-1.6-1.5-3.4-1.5-5.2 0-5 4-9 9-9s9 4 9 9-4 9-9 9z" /></svg>
                    </span>
                    <h3>{t("channels.whatsapp.title")}</h3>
                    <p>{t("channels.whatsapp.desc")}</p>
                    <span className="ch-value">{t("channels.whatsapp.value")}</span>
                    <span className="ch-status">{t("channels.whatsapp.status")}</span>
                  </a>

                  <a className="channel-card" href={`mailto:${t("channels.email.value")}`}>
                    <span className="ch-icon blue">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                    </span>
                    <h3>{t("channels.email.title")}</h3>
                    <p>{t("channels.email.desc")}</p>
                    <span className="ch-value">{t("channels.email.value")}</span>
                    <span className="ch-status neutral">{t("channels.email.status")}</span>
                  </a>
                </div>
              </section>

              {/* ── 2. Message form + what happens next ────────────────── */}
              <section className="contact-section" aria-labelledby="contact-form-h" id="contact-form">
                <div className="contact-section-head">
                  <h2 id="contact-form-h">{t("form.title")}</h2>
                  <p>{t("form.subtitle")}</p>
                </div>

                <div className="contact-grid">
                  <div className="contact-form-card">
                    <div className="contact-form-head">
                      <h3>{t("form.cardTitle")}</h3>
                      <p>{t("form.cardSubtitle")}</p>
                    </div>

                    <div className="contact-form-body">
                      {status === "sent" ? (
                        <div className="contact-success" role="status">
                          <span className="cs-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" focusable="false"><path d="M5 13l4 4L19 7" /></svg>
                          </span>
                          <h4>{t("form.success.title")}</h4>
                          <p>{t("form.success.desc")}</p>
                          <button type="button" className="btn btn-outline" onClick={() => setStatus("idle")}>
                            {t("form.success.again")}
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={onSubmit} noValidate>
                          {status === "failed" && (
                            <p className="contact-alert is-error" role="alert">
                              <AlertIcon />
                              <span>{t("errors.generic")}</span>
                            </p>
                          )}
                          {Object.keys(errors).length > 0 && (
                            <p className="contact-alert is-error" role="alert">
                              <AlertIcon />
                              <span>{t("form.errors.summary")}</span>
                            </p>
                          )}

                          <fieldset className="contact-fieldset">
                            <legend>{t("form.groups.about")}</legend>
                            <div className="contact-form-grid">
                              <div className="form-group span-6">
                                <label htmlFor={FIELD_ID.name}>
                                  {t("form.name.label")} <span className="req" aria-hidden="true">*</span>
                                </label>
                                <input
                                  id={FIELD_ID.name}
                                  name="name"
                                  autoComplete="name"
                                  className={`form-input${errors.name ? " error" : ""}`}
                                  placeholder={t("form.name.placeholder")}
                                  value={values.name}
                                  onChange={(e) => update("name", e.target.value)}
                                  required
                                  aria-required="true"
                                  aria-invalid={errors.name ? true : undefined}
                                  aria-describedby={describedBy("name")}
                                />
                                {errors.name && (
                                  <p className="field-error" id={`${FIELD_ID.name}-error`}><AlertIcon /><span>{errors.name}</span></p>
                                )}
                              </div>

                              <div className="form-group span-6">
                                <label htmlFor={FIELD_ID.phone}>{t("form.mobile.label")}</label>
                                <input
                                  id={FIELD_ID.phone}
                                  name="phone"
                                  type="tel"
                                  inputMode="tel"
                                  autoComplete="tel"
                                  className={`form-input${errors.phone ? " error" : ""}`}
                                  placeholder={t("form.mobile.placeholder")}
                                  value={values.phone}
                                  onChange={(e) => update("phone", e.target.value)}
                                  aria-invalid={errors.phone ? true : undefined}
                                  aria-describedby={describedBy("phone", "contact-phone-hint")}
                                />
                                {errors.phone ? (
                                  <p className="field-error" id={`${FIELD_ID.phone}-error`}><AlertIcon /><span>{errors.phone}</span></p>
                                ) : (
                                  <p className="field-hint" id="contact-phone-hint">{t("form.mobile.hint")}</p>
                                )}
                              </div>

                              <div className="form-group span-7">
                                <label htmlFor={FIELD_ID.email}>
                                  {t("form.email.label")} <span className="req" aria-hidden="true">*</span>
                                </label>
                                <input
                                  id={FIELD_ID.email}
                                  name="email"
                                  type="email"
                                  inputMode="email"
                                  autoComplete="email"
                                  className={`form-input${errors.email ? " error" : ""}`}
                                  placeholder={t("form.email.placeholder")}
                                  value={values.email}
                                  onChange={(e) => update("email", e.target.value)}
                                  required
                                  aria-required="true"
                                  aria-invalid={errors.email ? true : undefined}
                                  aria-describedby={describedBy("email", "contact-email-hint")}
                                />
                                {errors.email ? (
                                  <p className="field-error" id={`${FIELD_ID.email}-error`}><AlertIcon /><span>{errors.email}</span></p>
                                ) : (
                                  <p className="field-hint" id="contact-email-hint">{t("form.email.hint")}</p>
                                )}
                              </div>
                            </div>
                          </fieldset>

                          <fieldset className="contact-fieldset">
                            <legend>{t("form.groups.enquiry")}</legend>
                            <div className="contact-form-grid">
                              <div className="form-group span-5">
                                <label htmlFor="contact-subject">{t("form.subject.label")}</label>
                                <select
                                  id="contact-subject"
                                  name="subject"
                                  className="form-input"
                                  value={values.subject}
                                  onChange={(e) => update("subject", e.target.value)}
                                >
                                  {SUBJECTS.map((s) => (
                                    <option key={s.key} value={s.value}>
                                      {t(`form.subject.options.${s.key}`)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="form-group full">
                                <label htmlFor={FIELD_ID.message}>
                                  {t("form.message.label")} <span className="req" aria-hidden="true">*</span>
                                </label>
                                <textarea
                                  id={FIELD_ID.message}
                                  name="message"
                                  className={errors.message ? "error" : undefined}
                                  placeholder={t("form.message.placeholder")}
                                  value={values.message}
                                  onChange={(e) => update("message", e.target.value)}
                                  maxLength={MESSAGE_MAX}
                                  required
                                  aria-required="true"
                                  aria-invalid={errors.message ? true : undefined}
                                  aria-describedby={describedBy("message", "contact-message-count")}
                                />
                                <div className="field-foot">
                                  {errors.message ? (
                                    <p className="field-error" id={`${FIELD_ID.message}-error`}><AlertIcon /><span>{errors.message}</span></p>
                                  ) : (
                                    <p className="field-hint">{t("form.message.hint")}</p>
                                  )}
                                  <p className="field-count" id="contact-message-count">
                                    {t("form.message.counter", { current: values.message.length, max: MESSAGE_MAX })}
                                  </p>
                                </div>
                              </div>

                              <div className="form-group full">
                                <label className="terms contact-consent" htmlFor={FIELD_ID.consent}>
                                  <input
                                    id={FIELD_ID.consent}
                                    name="consent"
                                    type="checkbox"
                                    checked={values.consent}
                                    onChange={(e) => update("consent", e.target.checked)}
                                    aria-invalid={errors.consent ? true : undefined}
                                    aria-describedby={describedBy("consent")}
                                  />
                                  <span>{t("form.consent")}</span>
                                </label>
                                {errors.consent && (
                                  <p className="field-error" id={`${FIELD_ID.consent}-error`}><AlertIcon /><span>{errors.consent}</span></p>
                                )}
                              </div>
                            </div>
                          </fieldset>

                          <div className="contact-form-actions">
                            <button className="btn btn-primary btn-lg" type="submit" disabled={status === "sending"}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                              {status === "sending" ? t("form.sending") : t("form.submit")}
                            </button>
                            {/* Reset sits a thumb-width from Submit on a phone and wipes
                                everything with no undo. Desktop keeps it. */}
                            <button
                              type="button"
                              className="btn btn-outline hide-on-phone"
                              onClick={() => {
                                setValues(EMPTY);
                                setErrors({});
                                attempted.current = false;
                                setStatus("idle");
                              }}
                            >
                              {t("form.reset")}
                            </button>
                            <p className="contact-form-note">{t("form.privacyNote")}</p>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Support — separate from both the channels and the form. */}
                  <aside className="contact-aside" aria-labelledby="contact-support-h">
                    <h3 className="contact-aside-title" id="contact-support-h">{t("support.title")}</h3>

                    <div className="contact-side-card">
                      <div className="contact-side-head">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <h4>{t("hours.title")}</h4>
                        <span className="contact-open-pill">{t("hours.open")}</span>
                      </div>
                      <div className="contact-side-body">
                        <dl className="hours-list">
                          {HOURS.map((row) => (
                            <div key={row.key} className={`hours-row${todayRow === row.key ? " is-today" : ""}`}>
                              <dt>
                                {t(`hours.${row.key}.day`)}
                                {todayRow === row.key && <span className="hours-today">{t("hours.todayLabel")}</span>}
                              </dt>
                              <dd>{t(`hours.${row.key}.time`)}</dd>
                            </div>
                          ))}
                        </dl>
                        <p className="contact-side-note">{t("support.replyNote")}</p>
                      </div>
                    </div>

                    <div className="contact-side-card">
                      <div className="contact-side-head">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" /><path d="M9.2 9a2.9 2.9 0 015.6 1c0 1.9-2.8 2.5-2.8 2.5" /><line x1="12" y1="17" x2="12" y2="17.1" /></svg>
                        <h4>{t("support.selfService.title")}</h4>
                      </div>
                      <div className="contact-side-body">
                        <p className="contact-side-note">{t("support.selfService.desc")}</p>
                        <Link className="btn btn-outline btn-block" href="/help">{t("support.selfService.cta")}</Link>
                      </div>
                    </div>
                  </aside>
                </div>
              </section>

              {/* ── 3. Offices ─────────────────────────────────────────── */}
              <section className="contact-section" aria-labelledby="contact-offices-h">
                <div className="contact-section-head">
                  <h2 id="contact-offices-h">{t("offices.title")}</h2>
                  <p>{t("offices.subtitle")}</p>
                </div>

                <div className="offices-row">
                  {(["dubai", "abudhabi", "sharjah"] as const).map((office) => (
                    <div className="office-card" key={office}>
                      <h3>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {t(`offices.${office}.name`)}
                      </h3>
                      <address className="o-addr">
                        {t(`offices.${office}.line1`)}
                        <br />
                        {t(`offices.${office}.line2`)}
                      </address>
                      <a className="o-phone" href={telHref(t(`offices.${office}.phone`))}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                        {t(`offices.${office}.phone`)}
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── 4. Company & legal ─────────────────────────────────── */}
              <section className="contact-section" aria-labelledby="contact-legal-h">
                <div className="contact-legal">
                  <div>
                    <h2 id="contact-legal-h">{t("legal.title")}</h2>
                    <p className="contact-legal-entity">{t("legal.entity")}</p>
                    <address className="contact-legal-address">
                      {t("legal.registeredLabel")}: {t("offices.dubai.line1")}, {t("offices.dubai.line2")}
                    </address>
                    <p className="contact-legal-note">{t("legal.note")}</p>
                  </div>

                  <div className="contact-legal-side">
                    <h3>{t("legal.policiesTitle")}</h3>
                    <ul className="contact-legal-links">
                      <li><Link href="/legal/terms">{t("legal.links.terms")}</Link></li>
                      <li><Link href="/legal/privacy">{t("legal.links.privacy")}</Link></li>
                      <li><Link href="/legal/cookie-policy">{t("legal.links.cookies")}</Link></li>
                      <li><Link href="/help">{t("legal.links.help")}</Link></li>
                    </ul>

                    {socials.length > 0 && (
                      <div className="contact-socials">
                        <h3>{t("social.title")}</h3>
                        <div className="contact-socials-row">
                          {socials.map((s) => (
                            <a
                              key={s.name}
                              className="btn-icon"
                              href={SOCIALS[s.name]}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={t(s.labelKey)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

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
