import type { Metadata } from "next";
import { createProductAction } from "@/app/admin/(dashboard)/actions";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Novo produto" };

export default function NewProductPage() {
  return (
    <section className="max-w-lg space-y-6">
      <h2 className="font-display text-lg font-medium">Novo produto</h2>
      <ProductForm action={createProductAction} slugEditable submitLabel="Criar produto" />
    </section>
  );
}
