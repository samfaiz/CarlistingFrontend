import "@fontsource-variable/inter";
import "@fontsource-variable/noto-sans-arabic";
import "@/styles/globals.css";
import "@/styles/marketplace-mockup.css";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { appWithTranslation } from "next-i18next/pages";
import { CompareProvider } from "@/components/compare/compare-provider";
import { CompareTray } from "@/components/compare/compare-tray";
import { SavedProvider } from "@/components/saved/saved-provider";
import { Toaster } from "@/components/ui/toast";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { useAnalyticsRoutes } from "@/lib/analytics";
import nextI18NextConfig from "../../next-i18next.config.js";

function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session?: Session | null }>) {
  // P1-14: consent-gated GA4 — route-derived events fire from this one hook
  // (never from page components); the banner records the visitor's choice.
  useAnalyticsRoutes();
  return (
    <SessionProvider session={session}>
      {/* P1-09/P1-10 global state: saved-car ids + persistent compare tray. */}
      <SavedProvider>
        <CompareProvider>
          <Component {...pageProps} />
          <CompareTray />
          <Toaster />
          <ConsentBanner />
        </CompareProvider>
      </SavedProvider>
    </SessionProvider>
  );
}

// Config passed explicitly so next-i18next never has to resolve the config
// file from disk at runtime (more robust under Turbopack bundling).
export default appWithTranslation(App, nextI18NextConfig);
