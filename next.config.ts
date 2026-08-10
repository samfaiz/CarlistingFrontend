import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config.js";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Locale routing (en default, ar/es/fr) — single source of truth in next-i18next.config.js.
  i18n,
};

export default nextConfig;
