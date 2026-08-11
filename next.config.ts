import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config.js";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Locale routing (en default, ar/es/fr) — single source of truth in next-i18next.config.js.
  i18n,
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
