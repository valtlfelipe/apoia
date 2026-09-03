import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { env } from "./lib/config/env";

const isDev = process.env.NODE_ENV === "development";
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

// If the self-hoster points APOIA_CREATOR_AVATAR_URL at their own image
// instead of a generated one, allow img-src to load from exactly that
// origin — never a blanket "https:" allowance. We can't know every
// self-hosted deployment's avatar host in advance, but each deployment
// knows its own, so this stays least-privilege per install.
const avatarOrigin = (() => {
  if (!env.APOIA_CREATOR_AVATAR_URL) return null;
  try {
    return new URL(env.APOIA_CREATOR_AVATAR_URL).origin;
  } catch {
    return null;
  }
})();
const imgSrc = ["'self'", "data:", avatarOrigin].filter(Boolean).join(" ");

// Content-Security-Policy for the whole app. Kept deliberately strict: this is
// a payment-adjacent app, so we default-deny everything and only open what we
// actually use (self-hosted fonts/scripts/styles, data: URIs for QR codes and
// generated avatars).
const cspHeader = `
  default-src 'self';
  script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src ${imgSrc};
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
