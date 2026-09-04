import { type NextRequest, NextResponse } from "next/server";

/**
 * Per-request CSP nonce.
 *
 * This lived in `next.config.ts`'s `headers()` as a static
 * `script-src 'self'`, which quietly broke the whole app in production: Next
 * emits two inline <script> tags on every page (the bootstrap and the RSC
 * payload), a static policy can't allow them, and the browser blocked both —
 * so React never hydrated and every client component was dead on the deployed
 * site. Development hid it, because the dev policy included 'unsafe-inline'.
 *
 * A nonce has to be generated per request, which a static config header can't
 * do — hence this file. Next reads the nonce back out of the CSP header during
 * render and stamps it on its own script tags automatically.
 *
 * `strict-dynamic` means scripts loaded *by* an allowed script are allowed
 * too, which is what lets the nonce'd bootstrap pull in the chunks. Note that
 * browsers honouring it ignore the `'self'` in script-src; it stays for the
 * older ones that don't.
 *
 * Styles keep `'unsafe-inline'`: Next and Tailwind both inject <style> tags
 * that aren't nonce'd, and inline styles aren't the injection risk scripts are.
 */

const isDev = process.env.NODE_ENV === "development";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // 'unsafe-eval' only in dev — React uses eval there to rebuild server error
  // stacks in the browser. Neither React nor Next need it in production.
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Static assets don't need a nonce, and prefetches would burn one for a
      // response that never renders. `/api` is excluded so route handlers keep
      // the policy they set themselves — app/api/avatar/[seed] deliberately
      // serves its SVG under a stricter `default-src 'none'`.
      source: "/((?!api|_next/static|_next/image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
