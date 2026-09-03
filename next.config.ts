import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

// Content-Security-Policy for the whole app. Kept deliberately strict: this is
// a payment-adjacent app, so we default-deny everything and only open what we
// actually use (self-hosted fonts/scripts/styles, data: URIs for QR codes and
// generated avatars).
//
// img-src allows any "https:" host, not just our own origin — needed because
// the creator avatar URL is now editable at /admin/settings, stored in the
// database rather than baked into this build/boot-time config. That's a
// broader allowance than the old per-deployment origin allowlist (which
// tracked APOIA_CREATOR_AVATAR_URL directly), but this app has no HTML
// injection surface to exploit it through — no dangerouslySetInnerHTML
// anywhere, every supporter-provided string is rendered through React's
// escaping, and script-src stays locked to 'self'. What it does allow is the
// image host learning the visitor's IP on load, which was already true of
// whatever single origin was allow-listed before.
const cspHeader = `
  default-src 'self';
  script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    // Pin the workspace root explicitly — otherwise Turbopack tries to infer
    // it from the nearest lockfile, which breaks if this repo is ever
    // checked out under a parent directory that happens to have one too.
    root: projectRoot,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
