import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { appConfig } from "@/lib/config/config";
import { getProduct } from "@/lib/config/products";
import { db } from "@/lib/db/client";
import { supports } from "@/lib/db/schema";
import { getPixProvider } from "@/lib/pix";
import type { CreateSupportInput } from "@/lib/validation";

export type CreateSupportResult = {
  id: string;
  amountCents: number;
  brCode: string;
  qrCodeImage: string;
  expiresAt: string | null;
};

function buildChargeComment(productSlug?: string): string {
  const product = productSlug ? getProduct(productSlug) : null;
  const base = `Apoio a ${appConfig.creator.name}`;
  return product ? `${base} - ${product.name}` : base;
}

/**
 * Creates a pending support record and issues the Pix charge for it. If the
 * PSP call fails, the record is marked `expired` rather than left dangling
 * as `pending` forever.
 */
export async function createSupport(input: CreateSupportInput): Promise<CreateSupportResult> {
  const id = randomUUID();
  const correlationId = randomUUID();
  const provider = getPixProvider();

  await db.insert(supports).values({
    id,
    correlationId,
    provider: provider.id,
    productSlug: input.productSlug ?? null,
    amountCents: input.amountCents,
    displayName: input.displayName ?? null,
    message: input.message ?? null,
    isPublic: input.isPublic,
    status: "pending",
  });

  try {
    const charge = await provider.createCharge({
      correlationId,
      amountCents: input.amountCents,
      comment: buildChargeComment(input.productSlug),
      expiresInSeconds: appConfig.chargeExpiresInSeconds,
    });

    // Always render the QR ourselves from the brCode rather than trust
    // whatever qrCodeImage the provider returns — providers typically hand
    // back a URL on their own domain (api.woovi.com, a CDN, etc.), and that
    // domain would need allow-listing in the CSP img-src, which would vary
    // per provider AND per deployment (sandbox vs. production host). A
    // self-generated data: URI needs no such exception and works the same
    // no matter which Pix provider is active.
    const qrCodeImage = await QRCode.toDataURL(charge.brCode);

    await db
      .update(supports)
      .set({
        providerChargeId: charge.providerChargeId,
        brCode: charge.brCode,
        qrCodeImage,
        expiresAt: charge.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(supports.id, id));

    return {
      id,
      amountCents: input.amountCents,
      brCode: charge.brCode,
      qrCodeImage,
      expiresAt: charge.expiresAt ? charge.expiresAt.toISOString() : null,
    };
  } catch (error) {
    await db
      .update(supports)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(supports.id, id));
    throw error;
  }
}
