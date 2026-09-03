import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const supportStatuses = ["pending", "paid", "expired"] as const;
export type SupportStatus = (typeof supportStatuses)[number];

/**
 * A single act of support. Created as `pending` when the Pix charge is
 * issued, then flipped to `paid` (by webhook, or by status-polling fallback)
 * or `expired`.
 *
 * PRIVACY: `displayName` and `message` are always stored, but only ever leave
 * the server through `lib/supports/public.ts`, which redacts them whenever
 * `isPublic` is false. Never `select()` this table wholesale for anything
 * that reaches a client.
 */
export const supports = sqliteTable(
  "supports",
  {
    id: text("id").primaryKey(),
    correlationId: text("correlation_id").notNull(),
    provider: text("provider").notNull(),
    providerChargeId: text("provider_charge_id"),

    productSlug: text("product_slug"),

    amountCents: integer("amount_cents").notNull(),
    paidAmountCents: integer("paid_amount_cents"),

    displayName: text("display_name"),
    message: text("message"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),

    status: text("status", { enum: supportStatuses }).notNull().default("pending"),

    brCode: text("br_code"),
    qrCodeImage: text("qr_code_image"),

    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    lastPolledAt: integer("last_polled_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [
    unique("supports_correlation_id_unique").on(table.correlationId),
    index("supports_status_paid_at_idx").on(table.status, table.paidAt),
    index("supports_product_slug_idx").on(table.productSlug),
  ],
);

/**
 * Raw webhook deliveries, kept for idempotency and audit. `payload` MUST
 * already have PII (payer name/taxID) stripped by the provider's
 * `redactWebhookPayload` before it ever reaches this table.
 */
export const webhookEvents = sqliteTable(
  "webhook_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventKey: text("event_key").notNull(),
    provider: text("provider").notNull(),
    event: text("event").notNull(),
    payload: text("payload", { mode: "json" }).notNull(),
    receivedAt: integer("received_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [unique("webhook_events_event_key_unique").on(table.eventKey)],
);

export type Support = typeof supports.$inferSelect;
export type NewSupport = typeof supports.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
