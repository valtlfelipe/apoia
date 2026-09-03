import "server-only";
import { notFound, redirect } from "next/navigation";
import { type AdminSession, getAdminSession } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

/**
 * Whether the admin panel is turned on at all. Both APOIA_ADMIN_EMAIL and
 * APOIA_ADMIN_SECRET are required together (enforced in lib/config/env.ts) —
 * a default install sets neither, so /admin exposes nothing.
 */
export function isAdminEnabled(): boolean {
  return Boolean(env.APOIA_ADMIN_EMAIL && env.APOIA_ADMIN_SECRET);
}

/**
 * The data-access-layer gate for the whole admin surface: every dashboard
 * page, layout, and server action calls this first. Server actions are
 * reachable by direct POST regardless of the UI, so they must call this
 * too, not just the pages that render their triggering forms.
 *
 * Two distinct "no access" cases, on purpose:
 *  - Admin feature entirely off (missing ENV) → 404, same as any unknown
 *    route. An unconfigured instance shouldn't even hint that /admin
 *    exists.
 *  - Admin feature on, but no valid session → redirect to /admin/login.
 *    The feature's existence is already public once it's on (the login
 *    page itself returns 200), so there's nothing left to hide — and a
 *    site owner who follows a stale link or an expired session deserves a
 *    way back in, not an unexplained 404.
 */
export async function requireAdmin(): Promise<AdminSession> {
  if (!isAdminEnabled()) notFound();

  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return session;
}
