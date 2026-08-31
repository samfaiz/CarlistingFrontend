/**
 * /dealer-invite?token=… — the page a colleague lands on from the invitation
 * email sent by POST /dealers/:id/invites.
 *
 * The whole screen is driven by POST /dealer-invites/preview, which is @Public
 * and answers two questions: what the invitation is for, and whether the
 * invited address already has an account (`hasAccount`). Everything else is a
 * branch on that plus the NextAuth session:
 *
 *   preview 401  → the invitation is dead (invalid / expired / revoked /
 *                  already accepted — the backend collapses all four into one
 *                  opaque message on purpose, so a guessed token cannot be
 *                  graded). No dead accept button is offered.
 *   signed out + hasAccount      → /login?next=<this url>, come back and accept
 *   signed out + !hasAccount     → accept-new form (name + password)
 *   signed in, email matches     → explicit accept button
 *   signed in, email differs     → named refusal + a way to switch account
 *
 * POST /dealer-invites/accept-new deliberately returns no tokens, so after it
 * succeeds this page signs in through the existing NextAuth credentials
 * provider with the password the visitor just chose.
 */
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { MockupLayout } from "@/components/marketplace/mockup-layout";
import { ApiError } from "@/lib/api";
import {
  acceptDealerInvite,
  acceptDealerInviteAsNewUser,
  previewDealerInvite,
} from "@/lib/marketplace-api";
import nextI18NextConfig from "../../next-i18next.config.js";

type Preview = Awaited<ReturnType<typeof previewDealerInvite>>;

/** Where a seated member belongs once the membership exists. */
const DEALER_PORTAL = "/dealer";

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function DealerInvitePage() {
  const { t } = useTranslation("dealer-invite");
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [preview, setPreview] = React.useState<Preview | null>(null);
  /** Why the invitation cannot be used — the server's own words. */
  const [deadReason, setDeadReason] = React.useState<string | null>(null);
  const [noToken, setNoToken] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  /** Set when the account was created but the automatic sign-in did not take. */
  const [signInFallback, setSignInFallback] = React.useState(false);
  const [joined, setJoined] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);

  const token =
    typeof router.query.token === "string" ? router.query.token : null;

  /** Round trip for /login?next=… and for signOut's callback. */
  const selfUrl = token
    ? `/dealer-invite?token=${encodeURIComponent(token)}`
    : "/dealer-invite";

  React.useEffect(() => {
    if (!router.isReady) return;
    if (!token) {
      setNoToken(true);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    previewDealerInvite(token)
      .then((res) => {
        if (!live) return;
        setPreview(res);
        setDeadReason(null);
      })
      .catch((err: unknown) => {
        if (!live) return;
        setPreview(null);
        setDeadReason(
          err instanceof ApiError && err.statusCode !== 0 && err.message
            ? err.message
            : t("errors.generic"),
        );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
    // `t` is stable per locale; re-running on it would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, token]);

  const invitedEmail = preview?.email ?? "";
  const currentEmail = session?.user?.email ?? "";
  const emailsMatch =
    Boolean(currentEmail) &&
    currentEmail.toLowerCase().trim() === invitedEmail.toLowerCase().trim();

  const expiresLabel = React.useMemo(() => {
    if (!preview?.expiresAt) return "";
    const when = new Date(preview.expiresAt);
    if (Number.isNaN(when.getTime())) return "";
    return new Intl.DateTimeFormat(router.locale ?? "en", {
      dateStyle: "medium",
    }).format(when);
  }, [preview?.expiresAt, router.locale]);

  /** Surface the backend's own refusal — 409/403 text is the useful answer. */
  const describe = (err: unknown) =>
    err instanceof ApiError && err.statusCode !== 0 && err.message
      ? err.message
      : t("errors.generic");

  const onAccept = async () => {
    if (!token || !session?.accessToken) return;
    setError(null);
    setBusy(true);
    try {
      await acceptDealerInvite(token, session.accessToken);
      setJoined(true);
      void router.push(DEALER_PORTAL);
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const onAcceptNew = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !preview) return;
    setError(null);
    setSignInFallback(false);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    try {
      await acceptDealerInviteAsNewUser({
        token,
        name: String(form.get("name") ?? ""),
        password,
      });
    } catch (err) {
      setError(describe(err));
      setBusy(false);
      return;
    }
    // accept-new mints no tokens on purpose; sign in through the normal
    // credentials provider with the password just chosen.
    const res = await signIn("credentials", {
      email: preview.email,
      password,
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setSignInFallback(true);
      return;
    }
    setJoined(true);
    void router.push(DEALER_PORTAL);
  };

  const summary = preview ? (
    <dl className="invite-summary" style={{ margin: "0 0 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--divider)" }}>
        <dt style={{ fontSize: 13, color: "var(--text-2)" }}>{t("invite.dealerLabel")}</dt>
        <dd style={{ fontSize: 13.5, fontWeight: 700, margin: 0, textAlign: "end" }}>{preview.dealerName}</dd>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--divider)" }}>
        <dt style={{ fontSize: 13, color: "var(--text-2)" }}>{t("invite.roleLabel")}</dt>
        <dd style={{ fontSize: 13.5, fontWeight: 700, margin: 0, textAlign: "end" }}>{t(`roles.${preview.role}`)}</dd>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--divider)" }}>
        <dt style={{ fontSize: 13, color: "var(--text-2)" }}>{t("invite.emailLabel")}</dt>
        <dd style={{ fontSize: 13.5, fontWeight: 700, margin: 0, textAlign: "end", overflowWrap: "anywhere" }}>{preview.email}</dd>
      </div>
      {expiresLabel ? (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0" }}>
          <dt style={{ fontSize: 13, color: "var(--text-2)" }}>{t("invite.expiresLabel")}</dt>
          <dd style={{ fontSize: 13.5, fontWeight: 700, margin: 0, textAlign: "end" }}>{expiresLabel}</dd>
        </div>
      ) : null}
    </dl>
  ) : null;

  const errorNote = error ? (
    <p role="alert" style={{ color: "var(--error)", fontSize: 13, margin: "0 0 14px" }}>
      {error}
    </p>
  ) : null;

  let heading = t("hero.title");
  let subtitle = t("hero.subtitle");
  let body: React.ReactNode = null;

  if (loading || sessionStatus === "loading") {
    heading = t("hero.title");
    subtitle = t("hero.subtitle");
    body = (
      <p role="status" style={{ textAlign: "center", fontSize: 13.5, color: "var(--text-2)" }}>
        {t("states.loading.body")}
      </p>
    );
  } else if (noToken) {
    heading = t("states.noToken.title");
    subtitle = t("states.noToken.body");
    body = (
      <Link href="/" className="btn btn-outline btn-lg btn-block">
        {t("actions.backHome")}
      </Link>
    );
  } else if (!preview) {
    heading = t("states.dead.title");
    subtitle = t("states.dead.body");
    body = (
      <>
        {deadReason ? (
          <p role="alert" style={{ color: "var(--error)", fontSize: 13, margin: "0 0 14px", textAlign: "center" }}>
            {deadReason}
          </p>
        ) : null}
        <Link href="/" className="btn btn-outline btn-lg btn-block">
          {t("actions.backHome")}
        </Link>
      </>
    );
  } else if (joined) {
    heading = t("states.joined.title");
    subtitle = t("states.joined.body", { dealerName: preview.dealerName });
    body = (
      <Link href={DEALER_PORTAL} className="btn btn-primary btn-lg btn-block">
        {t("actions.openPortal")}
      </Link>
    );
  } else if (signInFallback) {
    heading = t("states.signInFallback.title");
    subtitle = t("states.signInFallback.body", { email: preview.email });
    body = (
      <Link
        href={`/login?next=${encodeURIComponent(DEALER_PORTAL)}`}
        className="btn btn-primary btn-lg btn-block"
      >
        {t("actions.goToSignIn")}
      </Link>
    );
  } else if (sessionStatus === "authenticated" && !emailsMatch) {
    heading = t("states.wrongAccount.title");
    subtitle = t("states.wrongAccount.body", {
      invited: preview.email,
      current: currentEmail,
    });
    body = (
      <>
        {summary}
        {errorNote}
        <button
          type="button"
          className="btn btn-primary btn-lg btn-block"
          onClick={() => void signOut({ callbackUrl: selfUrl })}
        >
          {t("actions.signOutAndSwitch", { invited: preview.email })}
        </button>
        <p className="auth-switch">
          <Link href="/">{t("actions.backHome")}</Link>
        </p>
      </>
    );
  } else if (sessionStatus === "authenticated") {
    heading = t("states.accept.title");
    subtitle = t("states.accept.body", { dealerName: preview.dealerName });
    body = (
      <>
        {summary}
        {errorNote}
        <button
          type="button"
          className="btn btn-primary btn-lg btn-block"
          disabled={busy}
          onClick={() => void onAccept()}
        >
          {busy ? t("actions.joining") : t("actions.join", { dealerName: preview.dealerName })}
        </button>
        <p className="auth-switch">{t("states.accept.signedInAs", { email: currentEmail })}</p>
      </>
    );
  } else if (preview.hasAccount) {
    heading = t("states.signIn.title");
    subtitle = t("states.signIn.body", { email: preview.email });
    body = (
      <>
        {summary}
        <Link
          href={`/login?next=${encodeURIComponent(selfUrl)}`}
          className="btn btn-primary btn-lg btn-block"
        >
          {t("actions.signInAndAccept")}
        </Link>
      </>
    );
  } else {
    heading = t("states.create.title");
    subtitle = t("states.create.body", { email: preview.email });
    body = (
      <>
        {summary}
        <form onSubmit={onAcceptNew}>
          {errorNote}
          <div className="form-group">
            <label htmlFor="invite-name">{t("form.name.label")}</label>
            <input
              id="invite-name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              className="form-input"
              placeholder={t("form.name.placeholder")}
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="invite-email">{t("form.email.label")}</label>
            <input
              id="invite-email"
              className="form-input"
              type="email"
              value={preview.email}
              readOnly
              autoComplete="username"
              aria-describedby="invite-email-hint"
            />
            <p id="invite-email-hint" style={{ fontSize: 12, color: "var(--text-2)", margin: "6px 0 0" }}>
              {t("form.email.hint")}
            </p>
          </div>
          <div className="form-group">
            <label htmlFor="invite-password">{t("form.password.label")}</label>
            <div className="pwd-wrap">
              <input
                id="invite-password"
                name="password"
                required
                minLength={8}
                className="form-input"
                type={showPwd ? "text" : "password"}
                placeholder={t("form.password.placeholder")}
                autoComplete="new-password"
                aria-describedby="invite-password-hint"
              />
              <button
                className="pwd-toggle"
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-pressed={showPwd}
                aria-controls="invite-password"
                aria-label={t("form.togglePassword")}
                title={t("form.togglePassword")}
              >
                <EyeIcon />
              </button>
            </div>
            <p id="invite-password-hint" style={{ fontSize: 12, color: "var(--text-2)", margin: "6px 0 0" }}>
              {t("form.password.hint")}
            </p>
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary btn-lg btn-block" style={{ marginTop: 6 }}>
            {busy ? t("actions.creating") : t("actions.createAndJoin")}
          </button>
        </form>
        <p className="auth-switch">
          {t("states.create.haveAccount")}{" "}
          <Link href={`/login?next=${encodeURIComponent(selfUrl)}`}>{t("actions.signInInstead")}</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`${t("meta.title")} — Carsens`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <MockupLayout>
        <main id="page-dealer-invite" className="page">
          <div className="auth-wrap">
            <div className="auth-card">
              <div className="brand-mark">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 17h14M6 17l2-6h8l2 6M7 17v2M17 17v2M9 11l1-3h4l1 3" />
                </svg>
              </div>
              <h1>{heading}</h1>
              <p className="auth-sub">{subtitle}</p>
              {body}
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
      ["common", "dealer-invite"],
      nextI18NextConfig,
    )),
  },
});

