import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Healthcheck for a platform probe (Railway, a Docker HEALTHCHECK, a load
 * balancer). Point Railway's healthcheck at `/api/health`.
 *
 * It touches the database on purpose: "the process is listening" isn't the
 * interesting failure mode here. The interesting one is a container whose
 * `/data` volume didn't mount or isn't writable — it answers a process-only
 * ping perfectly while serving 500s on every real page.
 *
 * `select 1` rather than a real table read: it proves the file opened and the
 * driver works without depending on any migration having run yet.
 *
 * Deliberately says nothing about the instance — no version, no config, no
 * counts. This endpoint is unauthenticated and stays that way only if it has
 * nothing worth reading.
 */
export function GET() {
  try {
    db.get(sql`select 1`);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
