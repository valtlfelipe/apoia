import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearAdminSession();
  // APOIA_SITE_URL, not `request.url`: behind a reverse proxy (Railway, Fly, a
  // plain nginx) the request URL is the container's own bind address, so this
  // used to bounce the browser to https://0.0.0.0:8080/admin/login.
  return NextResponse.redirect(new URL("/admin/login", env.APOIA_SITE_URL));
}
