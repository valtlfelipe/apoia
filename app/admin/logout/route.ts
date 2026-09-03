import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
