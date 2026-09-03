import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/config/env";

/**
 * Our own admin session — a small HS256 JWT signed with APOIA_ADMIN_SECRET,
 * stored in an httpOnly cookie scoped to /admin. Deliberately NOT shoo's
 * id_token: shoo is only consulted once, at login, to answer "is this the
 * right Google account?" (lib/auth/shoo.ts); after that this app manages
 * its own session lifetime independent of shoo's token expiry.
 */

const COOKIE_NAME = "apoia_admin";
const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8h, no refresh — re-login after that.

function secretKey(): Uint8Array {
  if (!env.APOIA_ADMIN_SECRET) {
    throw new Error("APOIA_ADMIN_SECRET is not set — admin auth is disabled");
  }
  return new TextEncoder().encode(env.APOIA_ADMIN_SECRET);
}

export type AdminSession = {
  email: string;
};

export async function createAdminSession(session: AdminSession): Promise<void> {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.email !== "string") return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({ name: COOKIE_NAME, path: "/admin" });
}
