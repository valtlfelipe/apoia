"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  CreatorSettingsFormState,
  DeleteProductState,
  ProductFormState,
  SupportSettingsFormState,
} from "@/app/admin/(dashboard)/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { getProduct } from "@/lib/config/products";
import { createProductRow, deleteProductRow, updateProductRow } from "@/lib/products/repo";
import { productInputSchema, productUpdateSchema } from "@/lib/products/schema";
import { UPDATES_CACHE_TAG } from "@/lib/project";
import { updateCreatorSettings, updateSupportSettings } from "@/lib/settings/repo";
import { creatorSettingsSchema, supportSettingsSchema } from "@/lib/settings/schema";
import { setSupportPublic } from "@/lib/supports/admin";

function productFormValues(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    headline: String(formData.get("headline") ?? ""),
    description: String(formData.get("description") ?? ""),
    isActive: formData.get("isActive") === "on",
  };
}

function revalidateProductPaths(slug: string) {
  revalidatePath("/");
  revalidatePath(`/${slug}`);
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = productInputSchema.safeParse(productFormValues(formData));
  if (!parsed.success) {
    return { error: "Dados inválidos.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  if (getProduct(parsed.data.slug)) {
    return {
      error: "Slug já em uso.",
      fieldErrors: { slug: ["já existe um produto com esse slug"] },
    };
  }

  createProductRow(parsed.data);
  revalidateProductPaths(parsed.data.slug);
  redirect("/admin/products");
}

export async function updateProductAction(
  slug: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = productUpdateSchema.safeParse(productFormValues(formData));
  if (!parsed.success) {
    return { error: "Dados inválidos.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const updated = updateProductRow(slug, parsed.data);
  if (!updated) {
    return { error: "Produto não encontrado." };
  }

  revalidateProductPaths(slug);
  redirect("/admin/products");
}

export async function deleteProductAction(slug: string): Promise<DeleteProductState> {
  await requireAdmin();

  const result = deleteProductRow(slug);
  if (!result.deleted) {
    return { error: "Este produto tem apoios associados — desative em vez de excluir." };
  }

  revalidateProductPaths(slug);
  return { error: null };
}

export async function setSupportPublicAction(id: string, isPublic: boolean): Promise<void> {
  await requireAdmin();
  await setSupportPublic(id, isPublic);
  revalidatePath("/");
  revalidatePath("/admin/supports");
}

function creatorSettingsFormValues(formData: FormData) {
  // Links come in as parallel arrays (linkLabel[i] / linkUrl[i], same index
  // order they were appended to the form in) rather than a JSON blob — see
  // components/admin/creator-settings-form.tsx. Rows where both sides are
  // still blank (an "Adicionar link" click nobody filled in) are dropped
  // before validation; a row with only one side filled is kept, so it
  // surfaces as a real validation error instead of silently vanishing.
  const labels = formData.getAll("linkLabel").map(String);
  const urls = formData.getAll("linkUrl").map(String);
  const links = labels
    .map((label, i) => ({ label, url: urls[i] ?? "" }))
    .filter((link) => link.label.trim() !== "" || link.url.trim() !== "");

  return {
    name: String(formData.get("name") ?? ""),
    shortName: String(formData.get("shortName") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    avatarUrl: String(formData.get("avatarUrl") ?? ""),
    links,
  };
}

export async function updateCreatorSettingsAction(
  _prevState: CreatorSettingsFormState,
  formData: FormData,
): Promise<CreatorSettingsFormState> {
  await requireAdmin();

  const parsed = creatorSettingsSchema.safeParse(creatorSettingsFormValues(formData));
  if (!parsed.success) {
    return { error: "Dados inválidos.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  updateCreatorSettings(parsed.data);

  // The root layout owns the <title>/description metadata (generateMetadata
  // in app/layout.tsx), the home page renders the header directly, and
  // every /<slug> product page does too — revalidate all three rather than
  // trying to enumerate every product slug.
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/[product]", "page");

  return { error: null };
}

function supportSettingsFormValues(formData: FormData) {
  // amountPresets/minAmountCents/maxAmountCents carry raw text here (a CSV
  // of cents, and two reais-formatted strings like "1,00") — the schema's
  // csvCents/reaisToCents transforms do the actual parsing. See
  // lib/settings/schema.ts.
  return {
    amountPresets: String(formData.get("amountPresets") ?? ""),
    minAmountCents: String(formData.get("minAmountCents") ?? ""),
    maxAmountCents: String(formData.get("maxAmountCents") ?? ""),
    defaultPublic: formData.get("defaultPublic") === "on",
    showTotalCount: formData.get("showTotalCount") === "on",
    showTotalAmount: formData.get("showTotalAmount") === "on",
    avatarStyle: String(formData.get("avatarStyle") ?? ""),
    chargeExpiresInSeconds: String(formData.get("chargeExpiresInSeconds") ?? ""),
    thankYouMessage: String(formData.get("thankYouMessage") ?? ""),
  };
}

export async function updateSupportSettingsAction(
  _prevState: SupportSettingsFormState,
  formData: FormData,
): Promise<SupportSettingsFormState> {
  await requireAdmin();

  const parsed = supportSettingsSchema.safeParse(supportSettingsFormValues(formData));
  if (!parsed.success) {
    return { error: "Dados inválidos.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  updateSupportSettings(parsed.data);

  // Nothing here feeds metadata, so unlike updateCreatorSettingsAction this
  // doesn't need the root layout revalidated — just the pages that render
  // SupportForm/StatsBar.
  revalidatePath("/");
  revalidatePath("/[product]", "page");

  return { error: null };
}

/**
 * Bypasses the one-hour cache on the GitHub release lookup in
 * lib/project.ts, so "Verificar novamente" on /admin/about reflects a
 * release published moments ago instead of waiting out the cache. A
 * read-your-own-click case, so updateTag (not revalidateTag) — the next
 * render should wait for the fresh check, not serve the stale one.
 */
export async function recheckUpdatesAction() {
  await requireAdmin();

  updateTag(UPDATES_CACHE_TAG);
}
