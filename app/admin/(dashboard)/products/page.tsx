import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { appConfig } from "@/lib/config/config";
import { listProducts } from "@/lib/config/products";

export const metadata: Metadata = { title: "Produtos" };

export default function AdminProductsPage() {
  const products = listProducts();

  return (
    <>
      <PageHeader
        title="Produtos"
        description="Cada produto ganha a própria página de apoio, na mesma timeline."
        action={
          <Link href="/admin/products/new">
            <Button type="button">Novo produto</Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        {products.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-muted">
            Nenhum produto cadastrado ainda. A página raiz continua aceitando apoio genérico.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((product) => (
              <li
                key={product.slug}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products/${product.slug}`}
                      className="font-semibold text-ink hover:text-brand-ink"
                    >
                      {product.name}
                    </Link>
                    {!product.isActive ? <Badge tone="neutral">Inativo</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-ink-muted">/{product.slug}</p>
                </div>
                <ProductRowActions
                  slug={product.slug}
                  url={`${appConfig.siteUrl}/${product.slug}`}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
