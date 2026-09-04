import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

// The Content-Security-Policy lives in proxy.ts, not here: it carries a
// per-request nonce, which a static config header can't produce. See the
// comment there — a static `script-src 'self'` blocked Next's own inline
// scripts and stopped the app hydrating in production.
//
// Note for whoever reads the policy there: `img-src` allows any "https:"
// host, not just our own origin, because the creator avatar URL is editable
// at /admin/settings and so isn't knowable at build time. This app has no HTML
// injection surface to exploit that through — no dangerouslySetInnerHTML
// anywhere, and every supporter-provided string goes through React's escaping.
// What it does allow is the image host learning the visitor's IP on load,
// which was already true of the single allow-listed origin it replaced.
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
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            // `interest-cohort` is gone: FLoC was removed from Chrome, so the
            // browser now logs "Unrecognized feature" for it on every page.
            value: "camera=(), microphone=(), geolocation=()",
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
