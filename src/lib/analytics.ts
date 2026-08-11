/**
 * P1-14 — GA4 instrumentation, consent-gated (PRD §13.1 / §17, PDPL).
 *
 * Hard rules implemented here:
 *  - gtag.js is injected ONLY when BOTH are true: NEXT_PUBLIC_GA4_ID is set
 *    at build time AND the visitor has granted consent (privacy-preserving
 *    default: no analytics until an explicit Accept on the consent banner).
 *  - Declining after a grant flips Google's official kill switch
 *    (`window["ga-disable-<ID>"]`) so an already-loaded tag stops sending.
 *  - Consent is persisted in localStorage (client checks) AND a cookie
 *    (available to the server if ever needed) — both written together.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * P1-14 EVENT TAXONOMY (baseline for §17 metrics + the G3-01 dashboards).
 * Names are frozen — dashboards key on them. Placeholder events keep their
 * final name from day one so historical charts stay continuous when the real
 * surface ships (phone reveal → P2 leads, boost → P3-08).
 *
 *  event                      fired when                                params
 *  ────────────────────────── ───────────────────────────────────────── ─────────────────────────────
 *  search_performed           /cars renders or its query string changes  { query?, path }
 *                             (URL-driven filters → every filter/sort
 *                             change is a route event)
 *  listing_view               a listing detail (/cars/[slug]) mounts     { listing_slug, referrer_origin? }
 *  phone_reveal_placeholder   RESERVED — "Call" reveal ships with P2     { listing_slug? }
 *  lead_submit_placeholder    RESERVED — lead/chat form ships with P2    { listing_slug? }
 *  listing_publish            sell wizard submit succeeds (call site     { listing_id? }
 *                             arrives with the wizard's analytics pass)
 *  boost_placeholder          RESERVED — boost purchase ships with P3-08 { listing_id? }
 *
 * Route-derived events (search_performed, listing_view) fire from
 * useAnalyticsRoutes() mounted once in _app — detail/search pages are never
 * edited for analytics. Action events (listing_publish, …) call track()
 * directly from their surface when that surface's phase lands.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import * as React from "react";
import { useRouter } from "next/router";

/* ------------------------------------------------------------------ */
/* Consent                                                            */
/* ------------------------------------------------------------------ */

export type ConsentValue = "granted" | "denied";

export const CONSENT_STORAGE_KEY = "carsens.consent";
export const CONSENT_COOKIE_NAME = "carsens_consent";
/** 6 months — a lapsed choice re-prompts rather than silently persisting. */
const CONSENT_COOKIE_MAX_AGE_S = 180 * 24 * 60 * 60;

/** The visitor's stored choice, or null when they have not chosen yet. */
export function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null; // storage blocked → treat as "no choice" (privacy default)
  }
}

/** Persist the choice (localStorage + cookie) and start/stop GA accordingly. */
export function setConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // localStorage blocked — the cookie below still records the choice.
  }
  try {
    document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE_S}; SameSite=Lax`;
  } catch {
    // non-fatal
  }
  if (value === "granted") {
    initGa();
  } else {
    disableGa();
  }
}

/* ------------------------------------------------------------------ */
/* GA4 bootstrap                                                      */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Inlined at build time; when unset, this module is a permanent no-op. */
const GA_ID = process.env.NEXT_PUBLIC_GA4_ID;

let gaInitialized = false;

/**
 * Idempotent gtag.js bootstrap. Refuses to run unless the GA4 id is
 * configured AND consent is granted — the two P1-14 gates.
 */
export function initGa(): void {
  if (typeof window === "undefined") return;
  if (!GA_ID || gaInitialized) return;
  if (getStoredConsent() !== "granted") return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag.js contract: push the arguments object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  // Un-disable in case a previous Decline flipped the kill switch this session.
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = false;
  window.gtag("js", new Date());
  // SPA: page_view is sent manually from trackRoute() on every route change.
  window.gtag("config", GA_ID, { anonymize_ip: true, send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);

  gaInitialized = true;
}

/** Google's documented opt-out flag — silences an already-loaded tag. */
function disableGa(): void {
  if (typeof window === "undefined" || !GA_ID) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true;
}

function canSend(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(GA_ID) &&
    getStoredConsent() === "granted"
  );
}

/* ------------------------------------------------------------------ */
/* Typed event taxonomy + track()                                     */
/* ------------------------------------------------------------------ */

export interface AnalyticsEventMap {
  search_performed: { query?: string; path: string };
  listing_view: { listing_slug: string; referrer_origin?: string };
  phone_reveal_placeholder: { listing_slug?: string };
  lead_submit_placeholder: { listing_slug?: string };
  listing_publish: { listing_id?: string };
  boost_placeholder: { listing_id?: string };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

/**
 * Send a taxonomy event. Safe to call unconditionally from any surface:
 * a no-op without GA id, without consent, or on the server.
 */
export function track<N extends AnalyticsEventName>(
  name: N,
  params: AnalyticsEventMap[N],
): void {
  if (!canSend()) return;
  if (!gaInitialized) initGa();
  window.gtag?.("event", name, params);
}

/* ------------------------------------------------------------------ */
/* Route inference (search_performed / listing_view / page_view)      */
/* ------------------------------------------------------------------ */

/**
 * document.referrer, reduced to its ORIGIN only (never full URLs — they can
 * carry query params) and wrapped so malformed values can never throw.
 */
export function safeReferrerOrigin(): string | undefined {
  try {
    if (typeof document === "undefined" || !document.referrer) return undefined;
    return new URL(document.referrer).origin;
  } catch {
    return undefined;
  }
}

/** Router events receive locale-prefixed URLs ("/ar/cars?…") — normalize. */
function stripLocalePrefix(url: string): string {
  const stripped = url.replace(/^\/(ar|es|fr)(?=\/|\?|$)/, "");
  if (stripped === "") return "/";
  if (stripped.startsWith("?")) return `/${stripped}`;
  return stripped;
}

/** Initial mount and routeChangeComplete can both fire for the same URL. */
let lastTrackedUrl: string | null = null;

function trackRoute(rawUrl: string): void {
  const url = stripLocalePrefix(rawUrl);
  if (url === lastTrackedUrl) return;
  lastTrackedUrl = url;

  if (canSend()) {
    if (!gaInitialized) initGa();
    window.gtag?.("event", "page_view", { page_path: url });
  }

  const [path, queryString = ""] = url.split("?");
  if (path === "/cars") {
    const q = new URLSearchParams(queryString).get("q") ?? undefined;
    track("search_performed", { query: q, path: url });
  } else if (path.startsWith("/cars/")) {
    const slug = path.slice("/cars/".length).replace(/\/+$/, "");
    if (slug) {
      track("listing_view", {
        listing_slug: slug,
        referrer_origin: safeReferrerOrigin(),
      });
    }
  }
}

/**
 * Mount ONCE in _app. Subscribes to next/router navigation and infers the
 * route-derived taxonomy events from paths — page components stay untouched.
 * (Shallow routing — the /cars filter panel — still emits routeChangeComplete,
 * which is exactly what makes "search_performed on query change" work.)
 */
export function useAnalyticsRoutes(): void {
  const router = useRouter();

  React.useEffect(() => {
    initGa(); // returning visitor with stored consent → boot immediately
    trackRoute(router.asPath);

    const onComplete = (url: string) => trackRoute(url);
    router.events.on("routeChangeComplete", onComplete);
    return () => {
      router.events.off("routeChangeComplete", onComplete);
    };
    // Subscribe once for the app's lifetime; the router instance is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
