import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth/session";
import { exchangeCodeForToken, verifyShooToken } from "@/lib/auth/shoo";
import { env } from "@/lib/config/env";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function clearFlowCookies() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: "apoia_admin_pkce_verifier", path: "/admin" });
  cookieStore.delete({ name: "apoia_admin_pkce_state", path: "/admin" });
}

// APOIA_SITE_URL, not `request.url`: behind a reverse proxy (Railway, Fly, a
// plain nginx) the request URL is the container's own bind address, so these
// redirects used to land the browser on https://0.0.0.0:8080/admin. It's the
// same value the OAuth redirectUri below is built from — one source of truth
// for this instance's public origin.
function loginFailedRedirect(): NextResponse {
  return NextResponse.redirect(new URL("/admin/login?error=1", env.APOIA_SITE_URL));
}

export async function GET(request: Request) {
  const identifier = getClientIdentifier(request.headers);
  const { allowed } = checkRateLimit(`admin-callback:${identifier}`, 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("apoia_admin_pkce_state")?.value;
  const verifier = cookieStore.get("apoia_admin_pkce_verifier")?.value;
  await clearFlowCookies();

  if (!code || !state || !expectedState || !verifier || state !== expectedState) {
    // eslint-disable-next-line no-console
    console.warn("Admin login rejected: missing or mismatched state/verifier.");
    return loginFailedRedirect();
  }

  try {
    const redirectUri = new URL("/admin/callback", env.APOIA_SITE_URL).toString();
    const tokenResponse = await exchangeCodeForToken({ code, codeVerifier: verifier, redirectUri });
    const identity = await verifyShooToken(tokenResponse.id_token, redirectUri);

    const allowedEmail = env.APOIA_ADMIN_EMAIL.toLowerCase();
    const identityEmail = identity.email?.toLowerCase() ?? null;

    if (!identity.emailVerified || !identityEmail || identityEmail !== allowedEmail) {
      // Deliberately not logging the attempted email — it's a third
      // party's PII that just happened to hit this route.
      // eslint-disable-next-line no-console
      console.warn("Admin login rejected: email did not match APOIA_ADMIN_EMAIL.");
      return loginFailedRedirect();
    }

    await createAdminSession({ email: identityEmail });
    return NextResponse.redirect(new URL("/admin", env.APOIA_SITE_URL));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Admin login failed:", error);
    return loginFailedRedirect();
  }
}
