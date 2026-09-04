import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { type NewSettingsRow, type SettingsRow, settings } from "@/lib/db/schema";
import type { CreatorSettingsInput, SupportSettingsInput } from "@/lib/settings/schema";

/**
 * Module-scope cache of the single settings row, same rationale as
 * lib/products/repo.ts: `getCreator()` is read from render paths that need
 * to stay synchronous (app/layout.tsx's metadata, every page header), so
 * this avoids a query per read. `undefined` means "not loaded yet"; `null`
 * means "loaded, and no row exists" (a fresh install before anyone has
 * saved settings) — both are distinct from a loaded row.
 */
let cache: SettingsRow | null | undefined;

function loadSettings(): SettingsRow | null {
  if (cache !== undefined) return cache;
  cache = db.select().from(settings).where(eq(settings.id, 1)).get() ?? null;
  return cache;
}

export function invalidateSettingsCache(): void {
  cache = undefined;
}

/** The raw row, or null if nothing has been saved yet — used by the admin form. */
export function getSettingsRow(): SettingsRow | null {
  return loadSettings();
}

/**
 * Upserts the single settings row. Uses onConflictDoUpdate rather than
 * requiring a seeded row from a migration, so a fresh install (no row yet)
 * and an existing install (row already there) go through the same path.
 */
export function updateCreatorSettings(input: CreatorSettingsInput): SettingsRow {
  const values: NewSettingsRow = {
    id: 1,
    creatorName: input.name ?? null,
    creatorShortName: input.shortName ?? null,
    creatorTagline: input.tagline ?? null,
    creatorAvatarUrl: input.avatarUrl ?? null,
    creatorLinks: input.links,
    updatedAt: new Date(),
  };
  db.insert(settings).values(values).onConflictDoUpdate({ target: settings.id, set: values }).run();
  invalidateSettingsCache();
  const row = loadSettings();
  if (!row) throw new Error("failed to read back settings after upsert");
  return row;
}

/**
 * Upserts only the support-form columns — same shape as
 * updateCreatorSettings, and just as safe to call independently: `values`
 * here never mentions the creator_* columns, so onConflictDoUpdate's `set`
 * leaves them untouched on an existing row.
 */
export function updateSupportSettings(input: SupportSettingsInput): SettingsRow {
  const values: NewSettingsRow = {
    id: 1,
    amountPresets: input.amountPresets,
    minAmountCents: input.minAmountCents,
    maxAmountCents: input.maxAmountCents,
    defaultPublic: input.defaultPublic,
    showTotalCount: input.showTotalCount,
    showTotalAmount: input.showTotalAmount,
    avatarStyle: input.avatarStyle,
    chargeExpiresInSeconds: input.chargeExpiresInSeconds,
    thankYouMessage: input.thankYouMessage,
    updatedAt: new Date(),
  };
  db.insert(settings).values(values).onConflictDoUpdate({ target: settings.id, set: values }).run();
  invalidateSettingsCache();
  const row = loadSettings();
  if (!row) throw new Error("failed to read back settings after upsert");
  return row;
}
