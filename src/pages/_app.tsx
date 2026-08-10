import "@fontsource-variable/inter";
import "@fontsource-variable/noto-sans-arabic";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { appWithTranslation } from "next-i18next/pages";
import { Toaster } from "@/components/ui/toast";
import nextI18NextConfig from "../../next-i18next.config.js";

function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session?: Session | null }>) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <Toaster />
    </SessionProvider>
  );
}

// Config passed explicitly so next-i18next never has to resolve the config
// file from disk at runtime (more robust under Turbopack bundling).
export default appWithTranslation(App, nextI18NextConfig);
