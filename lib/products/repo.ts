import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { type NewProductRow, type ProductRow, products, supports } from "@/lib/db/schema";
import type { ProductInput, ProductUpdateInput } from "@/lib/products/schema";

/**
 * Module-scope cache of every product row, keyed by slug. `getProduct()` is
 * called synchronously from hot paths (`toPublicSupport`, once per timeline
 * item; the zod `.refine()` in `lib/validation.ts`) — re-querying SQLite on
 * every call would mean 20+ queries per timeline render. This is safe
 * because apoia runs as a single process with a single SQLite writer: any
 * write through this module calls `invalidateProductsCache()`, and there is
 * no other writer that could leave the cache stale.
 */
let cache: Map<string, ProductRow> | null = null;

function loadCache(): Map<string, ProductRow> {
  if (cache) return cache;
  const rows = db.select().from(products).all();
  cache = new Map(rows.map((row) => [row.slug, row]));
  return cache;
}

export function invalidateProductsCache(): void {
  cache = null;
}

export function getProductRow(slug: string): ProductRow | null {
  return loadCache().get(slug) ?? null;
}

export function listProductRows(options: { activeOnly?: boolean } = {}): ProductRow[] {
  const rows = [...loadCache().values()].sort((a, b) => a.position - b.position);
  return options.activeOnly ? rows.filter((row) => row.isActive) : rows;
}

export function createProductRow(input: ProductInput): ProductRow {
  const maxPosition = listProductRows().reduce((max, row) => Math.max(max, row.position), -1);
  const values: NewProductRow = {
    slug: input.slug,
    name: input.name,
    headline: input.headline ?? null,
    description: input.description ?? null,
    isActive: input.isActive,
    position: maxPosition + 1,
  };
  db.insert(products).values(values).run();
  invalidateProductsCache();
  const row = getProductRow(input.slug);
  if (!row) throw new Error("failed to read back newly created product");
  return row;
}

export function updateProductRow(slug: string, input: ProductUpdateInput): ProductRow | null {
  db.update(products)
    .set({
      name: input.name,
      headline: input.headline ?? null,
      description: input.description ?? null,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.slug, slug))
    .run();
  invalidateProductsCache();
  return getProductRow(slug);
}

/** Number of supports (of any status) referencing this product slug. */
export function countSupportsForProduct(slug: string): number {
  const [row] = db
    .select({ total: count() })
    .from(supports)
    .where(eq(supports.productSlug, slug))
    .all();
  return row?.total ?? 0;
}

export type DeleteProductResult = { deleted: true } | { deleted: false; reason: "has-supports" };

/**
 * Hard-deletes a product, but only when nothing references it — otherwise
 * the product badge on past supports would lose its name. Uncheck "Ativo"
 * via `updateProductRow` instead when supports exist.
 */
export function deleteProductRow(slug: string): DeleteProductResult {
  if (countSupportsForProduct(slug) > 0) {
    return { deleted: false, reason: "has-supports" };
  }
  db.delete(products).where(eq(products.slug, slug)).run();
  invalidateProductsCache();
  return { deleted: true };
}
