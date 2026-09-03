import { creatorShortName } from "@/lib/config/creator";
import { env } from "@/lib/config/env";
import type { ProductRow } from "@/lib/db/schema";
import { getProductRow, listProductRows } from "@/lib/products/repo";

export type Product = {
  slug: string;
  name: string;
  headline: string;
  description?: string;
  isActive: boolean;
};

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

const DEFAULT_HEADLINE_TEMPLATE = "Apoie {creator} no desenvolvimento do {product}";

function toProduct(row: ProductRow): Product {
  // {creator} is the short name — headlines are tight on space. Use
  // {creatorFullName} in a custom headline template if you want the full
  // APOIA_CREATOR_NAME instead.
  const vars = {
    creator: creatorShortName,
    creatorFullName: env.APOIA_CREATOR_NAME,
    product: row.name,
  };
  return {
    slug: row.slug,
    name: row.name,
    headline: interpolate(row.headline ?? DEFAULT_HEADLINE_TEMPLATE, vars),
    description: row.description ?? undefined,
    isActive: row.isActive,
  };
}

/**
 * Looks up a product by slug, whether active or not — callers that only
 * want to render a live page (`app/[product]/page.tsx`, `lib/validation.ts`)
 * must check `.isActive` themselves. A deactivated product still needs to
 * resolve here so past supports keep showing a product badge in the
 * timeline (see `lib/supports/public.ts`).
 */
export function getProduct(slug: string): Product | null {
  const row = getProductRow(slug);
  return row ? toProduct(row) : null;
}

/** All products, most recently created last unless reordered in `/admin`. */
export function listProducts(options: { activeOnly?: boolean } = {}): Product[] {
  return listProductRows(options).map(toProduct);
}
