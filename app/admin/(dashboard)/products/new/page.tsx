import type { Metadata } from "next";
import { createProductAction } from "@/app/admin/(dashboard)/actions";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "Novo produto" };

export default function NewProductPage() {
  return (
    <div className="max-w-xl">
      <PageHeader title="Novo produto" description="Uma página de apoio dedicada, em /slug." />
      <Card>
        <CardBody>
          <ProductForm action={createProductAction} slugEditable submitLabel="Criar produto" />
        </CardBody>
      </Card>
    </div>
  );
}
