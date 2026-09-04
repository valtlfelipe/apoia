import "server-only";
import { redirect } from "next/navigation";
import { type AdminSession, getAdminSession } from "@/lib/auth/session";

/**
 * The data-access-layer gate for the whole admin surface: every dashboard
 * page, layout, and server action calls this first. Server actions are
 * reachable by direct POST regardless of the UI, so they must call this
 * too, not just the pages that render their triggering forms.
 *
 * No valid session → redirect to /admin/login. /admin is required
 * (APOIA_ADMIN_EMAIL/APOIA_ADMIN_SECRET — enforced in lib/config/env.ts,
 * the app won't even boot without them), so there's no "feature disabled"
 * case to hide behind a 404 anymore — every install has it.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return session;
}
