import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config.js";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Locale routing (en default, ar/es/fr) — single source of truth in next-i18next.config.js.
  i18n,
  // P1-06 redirect discipline: taxonomy-slug 301s (renamed/merged makes,
  // models, emirates) live in src/lib/redirects.ts and are served by the
  // /used-cars landing getServerSideProps so one entry covers all locales.
  // This section is reserved for SITE-WIDE static path renames (e.g. a
  // launch-time /used-cars -> /used-{brand} move) — keep taxonomy churn out.
  async redirects() {
    return [];
  },
  images: {
    // Local MinIO media bucket (NEXT_PUBLIC_MEDIA_BASE) — dev only; production
    // adds its CDN host here. Optimizer stays ON (no `unoptimized`).
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9100",
        pathname: "/carsens-media/**",
      },
    ],
  },
};

export default nextConfig;
