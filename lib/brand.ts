/**
 * The apoia mark, in one place.
 *
 * A heart — the same one on the "Apoiar" button in /admin/about — on a rounded
 * indigo tile. The project has no wordmark, so this is the whole identity.
 *
 * `app/icon.svg` repeats these values because Next's favicon convention needs
 * a literal file; everything else (components/brand-mark.tsx,
 * app/apple-icon.tsx) imports them from here. If the shape ever changes,
 * icon.svg is the one place that won't follow on its own.
 */

/** Tight bounding box of HEART_PATH, so callers can place it without guessing. */
export const HEART_VIEWBOX = "1.58 3.95 20.85 16.55";

export const HEART_PATH =
  "M12 20.5s-7.5-4.6-9.8-9.1C.6 8 2.2 4.5 5.6 4c2-.3 3.9.7 6.4 3 2.5-2.3 4.4-3.3 6.4-3 3.4.5 5 4 3.4 7.4-2.3 4.5-9.8 9.1-9.8 9.1Z";

/** Literal hex, not the CSS token — needed where CSS variables don't exist (Satori, a bare .svg). */
export const BRAND_INDIGO = "#5b5bd6";
