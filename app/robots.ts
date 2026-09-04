import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// APOIA_SITE_URL is read from the environment, and the Docker image builds
// against placeholder values (see Dockerfile) — without this, `next build`
// would prerender robots.txt pointing at the build-time URL.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /admin also sends `noindex` from app/admin/layout.tsx. Both matter:
      // Disallow stops well-behaved crawlers from fetching it at all, and the
      // meta tag still covers a crawler that ignores robots.txt.
      disallow: ["/admin", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
