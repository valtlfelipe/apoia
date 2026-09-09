import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { supports } from "@/lib/db/schema";
import type { ParsedWebhookEvent } from "@/lib/pix/types";

/**
 * Applies a parsed webhook event to the matching support row. Idempotent:
 * once a support is `paid`, later events for the same charge are a no-op (the
 * webhook_events unique key already prevents most re-processing, this is a
 * second line of defense).
 *
 * Matched by `correlationId` when the provider echoes ours back, otherwise by
 * the provider's own charge id — AbacatePay is the reason for the second path,
 * since a payload missing `externalId` would otherwise be a silently dropped
 * payment confirmation.
 */
export async function confirmSupport(event: ParsedWebhookEvent): Promise<void> {
  const match = event.correlationId
    ? eq(supports.correlationId, event.correlationId)
    : event.providerChargeId
      ? eq(supports.providerChargeId, event.providerChargeId)
      : null;

  if (!match) return; // Nothing to match on — the provider gave us neither id.

  const [existing] = await db
    .select({ id: supports.id, status: supports.status, productSlug: supports.productSlug })
    .from(supports)
    .where(match)
    .limit(1);

  if (!existing) return; // Unknown charge — nothing to reconcile.
  if (existing.status === "paid") return; // Already applied.
  if (event.status === "pending") return; // CHARGE_CREATED etc. — no state change needed.

  await db
    .update(supports)
    .set({
      status: event.status,
      paidAmountCents: event.status === "paid" ? (event.paidAmountCents ?? null) : null,
      paidAt: event.status === "paid" ? (event.paidAt ?? new Date()) : null,
      endToEndId: event.status === "paid" ? (event.endToEndId ?? null) : null,
      updatedAt: new Date(),
    })
    .where(eq(supports.id, existing.id));

  if (event.status === "paid") {
    revalidatePath("/");
    if (existing.productSlug) {
      revalidatePath(`/${existing.productSlug}`);
    }
  }
}
