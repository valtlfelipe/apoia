import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEnabled } from "@/lib/auth/admin";
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

function loginFailedRedirect(request: Request): NextResponse {
  return NextResponse.redirect(new URL("/admin/login?error=1", request.url));
}

export async function GET(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
    return loginFailedRedirect(request);
  }

  try {
    const redirectUri = new URL("/admin/callback", env.APOIA_SITE_URL).toString();
    const tokenResponse = await exchangeCodeForToken({ code, codeVerifier: verifier, redirectUri });
    const identity = await verifyShooToken(tokenResponse.id_token, redirectUri);

    const allowedEmail = env.APOIA_ADMIN_EMAIL?.toLowerCase();
    const identityEmail = identity.email?.toLowerCase() ?? null;

    if (!identity.emailVerified || !identityEmail || identityEmail !== allowedEmail) {
      // Deliberately not logging the attempted email — it's a third
      // party's PII that just happened to hit this route.
      // eslint-disable-next-line no-console
      console.warn("Admin login rejected: email did not match APOIA_ADMIN_EMAIL.");
      return loginFailedRedirect(request);
    }

    await createAdminSession({ email: identityEmail });
    return NextResponse.redirect(new URL("/admin", request.url));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Admin login failed:", error);
    return loginFailedRedirect(request);
  }
}
