import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export type CreatorLink = { label: string; url: string };

/**
 * Single-row table (id is always 1, enforced by the CHECK constraint)
 * holding config that used to live in ENV and is now editable at
 * /admin/settings. Every content column is nullable — null means "not
 * configured", and the default lives in code (lib/config/creator.ts), not
 * in the database. Meant to grow with future settings migrations: new
 * columns on this same row, not new tables.
 */
export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),

    // --- Creator (see lib/config/creator.ts for the defaults applied when these are null) ---
    creatorName: text("creator_name"),
    creatorShortName: text("creator_short_name"),
    creatorTagline: text("creator_tagline"),
    creatorAvatarUrl: text("creator_avatar_url"),
    creatorLinks: text("creator_links", { mode: "json" }).$type<CreatorLink[]>(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
  },
  (table) => [check("settings_single_row", sql`${table.id} = 1`)],
);

/**
 * A support page beyond the generic root — gets its own route at `/<slug>`
 * with a tailored headline. Managed entirely from `/admin`; there is no ENV
 * equivalent (see CHANGELOG for the breaking removal of `APOIA_PRODUCTS`).
 *
 * `slug` is the primary key AND treated as immutable by the admin UI:
 * `supports.product_slug` references it by convention (no FK — see below),
 * so renaming a slug would orphan the product badge on every past support.
 * Editing a product never changes its slug; retiring one means deactivating
 * it (`isActive: false`) or, only once it has zero supports, deleting it.
 */
export const products = sqliteTable("products", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  // null = fall back to DEFAULT_HEADLINE_TEMPLATE (see lib/config/products.ts).
  headline: text("headline"),
  description: text("description"),
  // false hides the /<slug> page (404) and excludes it from admin dropdowns,
  // but getProduct() keeps resolving it so past supports still show a badge.
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  // Display order in the public nav / admin list. Lower sorts first.
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

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
 * that reaches a client — the one authorized exception is the admin-only
 * read path in `lib/supports/admin.ts`, gated by `requireAdmin()`.
 */
export const supports = sqliteTable(
  "supports",
  {
    id: text("id").primaryKey(),
    correlationId: text("correlation_id").notNull(),
    provider: text("provider").notNull(),
    providerChargeId: text("provider_charge_id"),

    // References products.slug by convention, not a real FK: a support must
    // stay queryable even after its product is deleted (empty products are
    // deletable — see lib/products/repo.ts).
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
export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type SettingsRow = typeof settings.$inferSelect;
export type NewSettingsRow = typeof settings.$inferInsert;
