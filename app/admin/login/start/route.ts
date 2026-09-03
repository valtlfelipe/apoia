import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEnabled } from "@/lib/auth/admin";
import { deriveCodeChallenge, generateCodeVerifier, generateState } from "@/lib/auth/pkce";
import { buildAuthorizeUrl } from "@/lib/auth/shoo";
import { env } from "@/lib/config/env";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Short-lived, httpOnly cookies that only need to survive the round trip to
// shoo.dev and back — 10 minutes is generous for a human clicking through a
// Google sign-in prompt.
const FLOW_COOKIE_MAX_AGE = 10 * 60;

export async function GET(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const identifier = getClientIdentifier(request.headers);
  const { allowed } = checkRateLimit(`admin-login:${identifier}`, 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  const verifier = generateCodeVerifier();
  const state = generateState();
  const redirectUri = new URL("/admin/callback", env.APOIA_SITE_URL).toString();

  const authorizeUrl = buildAuthorizeUrl({
    redirectUri,
    state,
    codeChallenge: deriveCodeChallenge(verifier),
  });

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/admin",
    maxAge: FLOW_COOKIE_MAX_AGE,
  };
  cookieStore.set("apoia_admin_pkce_verifier", verifier, cookieOptions);
  cookieStore.set("apoia_admin_pkce_state", state, cookieOptions);

  return NextResponse.redirect(authorizeUrl);
}
