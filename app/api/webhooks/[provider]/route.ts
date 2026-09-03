import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { webhookEvents } from "@/lib/db/schema";
import { getPixProvider } from "@/lib/pix";
import { confirmSupport } from "@/lib/supports/confirm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Receives webhook deliveries from the active Pix provider. Order matters:
 * read the raw body, verify its signature, THEN parse — never trust a
 * payload before it's verified. Idempotent via the `webhook_events` unique
 * key on (event, correlationId).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerParam } = await params;
  const provider = getPixProvider();

  if (providerParam !== provider.id) {
    return new Response("Not found", { status: 404 });
  }

  const rawBody = await request.text();

  const verified = await provider.verifyWebhook(rawBody, request.headers);
  if (!verified) {
    return new Response("Invalid signature", { status: 401 });
  }

  const parsed = provider.parseWebhook(rawBody);
  if (!parsed) {
    // Event type we don't act on — acknowledge so the provider stops retrying.
    return new Response("ok", { status: 200 });
  }

  const eventKey = `${parsed.event}:${parsed.correlationId}`;
  const redactedPayload = provider.redactWebhookPayload(rawBody);

  const inserted = await db
    .insert(webhookEvents)
    .values({
      eventKey,
      provider: provider.id,
      event: parsed.event,
      payload: redactedPayload,
    })
    .onConflictDoNothing({ target: webhookEvents.eventKey })
    .returning({ id: webhookEvents.id });

  if (inserted.length === 0) {
    // Already processed this exact event — ack without reprocessing.
    return new Response("ok", { status: 200 });
  }

  await confirmSupport(parsed);

  return NextResponse.json({ received: true });
}
