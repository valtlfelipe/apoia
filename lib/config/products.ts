import { creatorShortName } from "@/lib/config/creator";
import { env } from "@/lib/config/env";

export type Product = {
  slug: string;
  name: string;
  headline: string;
  description?: string;
};

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

const DEFAULT_HEADLINE_TEMPLATE = "Apoie {creator} no desenvolvimento do {product}";

function buildProducts(): Map<string, Product> {
  const map = new Map<string, Product>();
  for (const product of env.APOIA_PRODUCTS) {
    // {creator} is the short name — headlines are tight on space. Use
    // {creatorFullName} in a custom headline template if you want the full
    // APOIA_CREATOR_NAME instead.
    const vars = {
      creator: creatorShortName,
      creatorFullName: env.APOIA_CREATOR_NAME,
      product: product.name,
    };
    map.set(product.slug, {
      slug: product.slug,
      name: product.name,
      headline: interpolate(product.headline ?? DEFAULT_HEADLINE_TEMPLATE, vars),
      description: product.description,
    });
  }
  return map;
}

const products = buildProducts();

export function getProduct(slug: string): Product | null {
  return products.get(slug) ?? null;
}
