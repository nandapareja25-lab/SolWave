import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true }, // las variantes WebP se generan al subir (ver docs/01-ARQUITECTURA.md)
  // Metadatos antes del primer byte para TODOS: así un producto inexistente responde 404 real y una
  // URL vieja responde 308 (sin esto Next transmite primero y queda en 200). Los metadatos son instantáneos.
  htmlLimitedBots: /.*/,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);

if (process.env.NODE_ENV === "development" && process.env.DORATA_CF_DEV === "1") {
  // Expone bindings de Cloudflare en `next dev` (opcional; requiere wrangler login).
  void initOpenNextCloudflareForDev();
}
