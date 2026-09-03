import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/admin/(dashboard)/actions";
import { ProductForm } from "@/components/admin/product-form";
import { getProductRow } from "@/lib/products/repo";

type EditProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EditProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductRow(slug);
  return { title: product ? product.name : "Produto" };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { slug } = await params;
  // Read the raw row, not lib/config/products' getProduct() — that one
  // interpolates {creator}/{product} into the headline, which would show
  // the resolved text back in the form instead of the editable template.
  const product = getProductRow(slug);
  if (!product) notFound();

  return (
    <section className="max-w-lg space-y-6">
      <h2 className="font-display text-lg font-medium">Editar {product.name}</h2>
      <ProductForm
        action={updateProductAction.bind(null, slug)}
        defaultValues={{
          slug: product.slug,
          name: product.name,
          headline: product.headline ?? undefined,
          description: product.description ?? undefined,
          isActive: product.isActive,
        }}
        slugEditable={false}
        submitLabel="Salvar alterações"
      />
    </section>
  );
}
