import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/admin/(dashboard)/actions";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { Card, CardBody } from "@/components/ui/card";
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
    <div className="max-w-xl">
      <PageHeader title={product.name} description={`Página pública em /${product.slug}.`} />
      <Card>
        <CardBody>
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
        </CardBody>
      </Card>
    </div>
  );
}
