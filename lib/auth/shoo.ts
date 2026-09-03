import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Client for shoo.dev (https://shoo.dev) — a minimal OIDC broker for Google
 * sign-in, used only to answer one question: "is the person clicking
 * through this login flow the site owner?". Confirmed directly against
 * https://shoo.dev/.well-known/openid-configuration:
 *
 *   authorization_endpoint  https://shoo.dev/authorize
 *   token_endpoint          https://shoo.dev/token
 *   jwks_uri                https://shoo.dev/.well-known/jwks.json
 *   issuer                  https://shoo.dev
 *   response_types          ["code"]           (PKCE, S256 only)
 *   id_token_signing_alg    ES256
 *
 * shoo.dev's own docs site (docs.shoo.dev) turned out to describe a
 * `scope=openid email profile` param that the real server doesn't act on —
 * verified by reading https://shoo.dev/shoo.js (the actual client) directly.
 * That's the ground truth this file follows; treat the docs site as
 * unreliable and re-check shoo.js if something here stops working again.
 *
 * shoo's own client SDK (shoo.js) stores the token in localStorage, which
 * would put it within reach of any client-side script — and this app's CSP
 * (next.config.ts) already forbids loading third-party scripts at all. So
 * this app never loads shoo.js: the whole code exchange happens server-side
 * in app/admin/callback/route.ts, and what the browser gets back is our own
 * httpOnly session cookie (lib/auth/session.ts), never shoo's id_token.
 *
 * shoo is explicitly labeled "SUPER EARLY WIP" on its own site, and its
 * client_id/redirect flow has no published spec beyond the OIDC discovery
 * document above — this file is deliberately small and isolated so a future
 * change of auth provider is "replace this one file", the same shape as
 * lib/pix/providers/*.
 */

const SHOO_BASE_URL = "https://shoo.dev";
const SHOO_ISSUER = "https://shoo.dev";

const jwks = createRemoteJWKSet(new URL("/.well-known/jwks.json", SHOO_BASE_URL));

function clientIdFor(origin: string): string {
  return `origin:${origin}`;
}

export function buildAuthorizeUrl(options: {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const origin = new URL(options.redirectUri).origin;
  const url = new URL("/authorize", SHOO_BASE_URL);
  url.searchParams.set("client_id", clientIdFor(origin));
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("state", options.state);
  url.searchParams.set("code_challenge", options.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  // NOT a "scope" param — shoo's docs describe this loosely as a scope, but
  // its actual client (https://shoo.dev/shoo.js, read directly since the
  // docs site turned out to be unreliable) sends a bare `pii=true` to get
  // email/email_verified/name on the id_token. Without it, the token comes
  // back with only pairwise_sub, and app/admin/callback/route.ts's email
  // check fails every time — which is exactly the bug this fixes.
  url.searchParams.set("pii", "true");
  return url.toString();
}

export type ShooTokenResponse = {
  id_token: string;
  token_type?: string;
  expires_in?: number;
};

/**
 * Exchanges an authorization code for a signed id_token. Confirmed against
 * the live endpoint: POST, application/x-www-form-urlencoded, standard OIDC
 * error shape (`{"error":"invalid_grant"}` for a bad code).
 */
export async function exchangeCodeForToken(options: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<ShooTokenResponse> {
  const origin = new URL(options.redirectUri).origin;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: options.code,
    redirect_uri: options.redirectUri,
    client_id: clientIdFor(origin),
    code_verifier: options.codeVerifier,
  });

  const response = await fetch(new URL("/token", SHOO_BASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`shoo token exchange failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as ShooTokenResponse;
  if (typeof data.id_token !== "string") {
    throw new Error("shoo token response missing id_token");
  }
  return data;
}

export type ShooIdentity = {
  pairwiseSub: string;
  email: string | null;
  emailVerified: boolean;
};

/**
 * Verifies a shoo id_token's signature (ES256, via shoo's published JWKS),
 * issuer, audience, and expiration, and returns the claims this app cares
 * about. Throws if verification fails for any reason.
 */
export async function verifyShooToken(idToken: string, redirectUri: string): Promise<ShooIdentity> {
  const origin = new URL(redirectUri).origin;
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: SHOO_ISSUER,
    audience: clientIdFor(origin),
  });

  if (typeof payload.pairwise_sub !== "string") {
    throw new Error("shoo token missing pairwise_sub");
  }

  return {
    pairwiseSub: payload.pairwise_sub,
    email: typeof payload.email === "string" ? payload.email : null,
    emailVerified: payload.email_verified === true,
  };
}
