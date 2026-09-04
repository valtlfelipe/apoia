import type { Metadata } from "next";
import { appConfig } from "@/lib/config/config";
import type { Creator } from "@/lib/config/creator";
import type { Product } from "@/lib/config/products";

/**
 * Absolute URL for `path`, tolerant of a trailing slash on APOIA_SITE_URL —
 * `new URL()` handles the join, so "https://x.com/" and "https://x.com" both
 * produce the same result.
 */
export function absoluteUrl(path: string): string {
  return new URL(path, appConfig.siteUrl).toString();
}

// Search engines truncate around here, and every description on this site is
// built from creator-typed text of unpredictable length.
const MAX_DESCRIPTION = 160;

/** Collapses whitespace and trims to `MAX_DESCRIPTION` on a word boundary. */
export function clampDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_DESCRIPTION) return clean;

  const cut = clean.slice(0, MAX_DESCRIPTION - 1);
  const lastSpace = cut.lastIndexOf(" ");
  // Only break on a space if that doesn't gut the sentence — a single very
  // long "word" (a URL, say) falls back to a hard cut.
  return `${(lastSpace > MAX_DESCRIPTION / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export const SUPPORT_PITCH = "Contribua com qualquer valor via Pix, sem cadastro.";

export function homeTitle(creator: Creator): string {
  return `Apoie ${creator.name}`;
}

/** Leads with the creator's own tagline when there is one — it's the most specific thing we have. */
export function homeDescription(creator: Creator): string {
  return clampDescription(
    creator.tagline
      ? `${creator.tagline.trim()} — ${SUPPORT_PITCH}`
      : `Apoie ${creator.name}. ${SUPPORT_PITCH}`,
  );
}

export function productDescription(product: Product): string {
  return clampDescription(product.description ?? `${product.name} — ${SUPPORT_PITCH}`);
}

/**
 * The full per-page metadata block.
 *
 * Next does NOT deep-merge `openGraph` and `twitter` across route segments — a
 * page's object *replaces* the root layout's — so anything set only in
 * app/layout.tsx (og:type, og:locale, og:site_name, twitter:card) silently
 * disappears from every page that declares its own. Building both objects in
 * one place is what keeps that from happening again.
 */
export function pageMetadata({
  title,
  description,
  path,
  siteName,
}: {
  title: string;
  description: string;
  path: string;
  siteName: string;
}): Metadata {
  return {
    // `absolute` skips the root layout's "%s · Apoie <creator>" template,
    // which would otherwise repeat the creator name already in these titles.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName, type: "website", locale: "pt_BR" },
    twitter: { card: "summary_large_image", title, description },
  };
}
