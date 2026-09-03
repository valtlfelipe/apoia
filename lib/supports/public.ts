import { getProduct } from "@/lib/config/products";
import type { Support } from "@/lib/db/schema";

/**
 * The only shape of a support that is allowed to leave the server. Every
 * public-facing endpoint and every server component must go through
 * `toPublicSupport` — never pass a raw `Support` row (or a wholesale
 * `select()` of the table) to a client.
 */
export type PublicSupport = {
  id: string;
  name: string;
  message: string | null;
  amountCents: number;
  product: { slug: string; name: string } | null;
  paidAt: string;
};

const ANONYMOUS_NAME = "Anônimo";

type PublicSupportInput = Pick<
  Support,
  | "id"
  | "displayName"
  | "message"
  | "isPublic"
  | "amountCents"
  | "paidAmountCents"
  | "productSlug"
  | "paidAt"
>;

export function toPublicSupport(support: PublicSupportInput): PublicSupport | null {
  if (!support.paidAt) return null;

  const hasName = support.isPublic && support.displayName && support.displayName.trim().length > 0;

  const product = support.productSlug ? getProduct(support.productSlug) : null;

  return {
    id: support.id,
    name: hasName ? (support.displayName as string) : ANONYMOUS_NAME,
    message: support.isPublic ? (support.message ?? null) : null,
    amountCents: support.paidAmountCents ?? support.amountCents,
    product: product ? { slug: product.slug, name: product.name } : null,
    paidAt: support.paidAt.toISOString(),
  };
}
