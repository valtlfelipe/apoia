"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { DeleteProductState, ProductFormState } from "@/app/admin/(dashboard)/action-state";
import { requireAdmin } from "@/lib/auth/admin";
import { getProduct } from "@/lib/config/products";
import { createProductRow, deleteProductRow, updateProductRow } from "@/lib/products/repo";
import { productInputSchema, productUpdateSchema } from "@/lib/products/schema";
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
