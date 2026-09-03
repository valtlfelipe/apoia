import { and, count, eq, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { supports } from "@/lib/db/schema";
import { type PublicSupport, toPublicSupport } from "@/lib/supports/public";

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

// Only the columns a public timeline is allowed to touch. Anything sensitive
// (correlationId, brCode, providerChargeId) is deliberately left out of this
// select.
const publicColumns = {
  id: supports.id,
  displayName: supports.displayName,
  message: supports.message,
  isPublic: supports.isPublic,
  amountCents: supports.amountCents,
  paidAmountCents: supports.paidAmountCents,
  productSlug: supports.productSlug,
  paidAt: supports.paidAt,
} as const;

export type TimelinePage = {
  items: PublicSupport[];
  nextCursor: string | null;
};

function encodeCursor(paidAt: Date, id: string): string {
  return Buffer.from(`${paidAt.getTime()}:${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { paidAtMs: number; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [paidAtMs, id] = decoded.split(":");
    if (!paidAtMs || !id || Number.isNaN(Number(paidAtMs))) return null;
    return { paidAtMs: Number(paidAtMs), id };
  } catch {
    return null;
  }
}

export async function getTimelinePage(options: {
  limit?: number;
  cursor?: string | null;
  productSlug?: string;
}): Promise<TimelinePage> {
  const limit = Math.min(options.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;

  const conditions = [eq(supports.status, "paid")];
  if (options.productSlug) {
    conditions.push(eq(supports.productSlug, options.productSlug));
  }
  if (cursor) {
    const cursorCondition = or(
      lt(supports.paidAt, new Date(cursor.paidAtMs)),
      and(eq(supports.paidAt, new Date(cursor.paidAtMs)), lt(supports.id, cursor.id)),
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  const rows = await db
    .select(publicColumns)
    .from(supports)
    .where(and(...conditions))
    .orderBy(sql`${supports.paidAt} desc`, sql`${supports.id} desc`)
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const last = page.at(-1);

  return {
    items: page.map(toPublicSupport).filter((item): item is PublicSupport => item !== null),
    nextCursor: hasMore && last?.paidAt ? encodeCursor(last.paidAt, last.id) : null,
  };
}

export type TimelineAggregates = {
  totalCount: number;
  totalAmountCents: number;
};

export async function getTimelineAggregates(productSlug?: string): Promise<TimelineAggregates> {
  const conditions = [eq(supports.status, "paid")];
  if (productSlug) {
    conditions.push(eq(supports.productSlug, productSlug));
  }

  const [row] = await db
    .select({
      totalCount: count(),
      totalAmountCents: sql<number>`coalesce(sum(coalesce(${supports.paidAmountCents}, ${supports.amountCents})), 0)`,
    })
    .from(supports)
    .where(and(...conditions));

  return {
    totalCount: row?.totalCount ?? 0,
    totalAmountCents: row?.totalAmountCents ?? 0,
  };
}
