import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { supports } from "@/lib/db/schema";
import { getPixProvider } from "@/lib/pix";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { confirmSupport } from "@/lib/supports/confirm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_FALLBACK_INTERVAL_MS = 10_000;

/**
 * Status polling, used as a fallback to the webhook (e.g. local dev without
 * a public URL for Woovi to reach). Deliberately returns nothing beyond
 * status/paidAt — no name, message, or amount belongs in a polling endpoint.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identifier = getClientIdentifier(request.headers);
  const { allowed } = checkRateLimit(identifier, 30);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });
  }

  const { id } = await params;

  const [support] = await db
    .select({
      id: supports.id,
      correlationId: supports.correlationId,
      status: supports.status,
      paidAt: supports.paidAt,
      lastPolledAt: supports.lastPolledAt,
    })
    .from(supports)
    .where(eq(supports.id, id))
    .limit(1);

  if (!support) {
    return NextResponse.json({ error: "Apoio não encontrado." }, { status: 404 });
  }

  if (support.status !== "pending") {
    return NextResponse.json({
      status: support.status,
      paidAt: support.paidAt ? support.paidAt.toISOString() : null,
    });
  }

  const shouldPoll =
    !support.lastPolledAt ||
    Date.now() - support.lastPolledAt.getTime() > POLL_FALLBACK_INTERVAL_MS;

  if (shouldPoll) {
    try {
      const provider = getPixProvider();
      const status = await provider.getChargeStatus({ correlationId: support.correlationId });
      await db
        .update(supports)
        .set({ lastPolledAt: new Date() })
        .where(eq(supports.id, support.id));

      if (status !== "pending") {
        await confirmSupport({ event: "poll", correlationId: support.correlationId, status });
      }

      return NextResponse.json({
        status,
        paidAt: status === "paid" ? new Date().toISOString() : null,
      });
    } catch (error) {
      // Polling is best-effort; report the last known status rather than fail the request.
      // eslint-disable-next-line no-console
      console.error("Status poll failed:", error);
    }
  }

  return NextResponse.json({ status: support.status, paidAt: null });
}
