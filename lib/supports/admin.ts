import "server-only";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { type SupportStatus, supports } from "@/lib/db/schema";

/**
 * The admin-only read path — the authorized exception to the rule in
 * lib/db/schema.ts ("never select() this table wholesale for anything that
 * reaches a client"). Every caller MUST have already gone through
 * requireAdmin(). Unlike lib/supports/public.ts, this returns the real
 * displayName/message regardless of isPublic, which is the whole point:
 * seeing who asked to stay anonymous is what /admin/supports is for.
 */

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 25;

export type AdminSupport = {
  id: string;
  displayName: string | null;
  message: string | null;
  isPublic: boolean;
  status: SupportStatus;
  amountCents: number;
  paidAmountCents: number | null;
  productSlug: string | null;
  endToEndId: string | null;
  createdAt: string;
  paidAt: string | null;
};

export type AdminSupportsPage = {
  items: AdminSupport[];
  nextCursor: string | null;
};

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.getTime()}:${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { createdAtMs: number; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [createdAtMs, id] = decoded.split(":");
    if (!createdAtMs || !id || Number.isNaN(Number(createdAtMs))) return null;
    return { createdAtMs: Number(createdAtMs), id };
  } catch {
    return null;
  }
}

export async function getAdminSupportsPage(
  options: { limit?: number; cursor?: string | null } = {},
): Promise<AdminSupportsPage> {
  const limit = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;

  const conditions = [];
  if (cursor) {
    const cursorCondition = or(
      lt(supports.createdAt, new Date(cursor.createdAtMs)),
      and(eq(supports.createdAt, new Date(cursor.createdAtMs)), lt(supports.id, cursor.id)),
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  const rows = await db
    .select({
      id: supports.id,
      displayName: supports.displayName,
      message: supports.message,
      isPublic: supports.isPublic,
      status: supports.status,
      amountCents: supports.amountCents,
      paidAmountCents: supports.paidAmountCents,
      productSlug: supports.productSlug,
      endToEndId: supports.endToEndId,
      createdAt: supports.createdAt,
      paidAt: supports.paidAt,
    })
    .from(supports)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(supports.createdAt), desc(supports.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const last = page.at(-1);

  return {
    items: page.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    })),
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

/**
 * Toggles whether a support appears in the public timeline. Reversible —
 * displayName/message are left untouched in the database either way; this
 * only flips the flag lib/supports/public.ts already checks.
 */
export async function setSupportPublic(id: string, isPublic: boolean): Promise<void> {
  await db.update(supports).set({ isPublic, updatedAt: new Date() }).where(eq(supports.id, id));
}
