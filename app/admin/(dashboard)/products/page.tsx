import type { Metadata } from "next";
import Link from "next/link";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config/config";
import { listProducts } from "@/lib/config/products";

export const metadata: Metadata = { title: "Produtos" };

export default function AdminProductsPage() {
  const products = listProducts();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Produtos</h2>
        <Link href="/admin/products/new">
          <Button type="button">Novo produto</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          Nenhum produto cadastrado ainda. A página raiz continua aceitando apoio genérico.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {products.map((product) => (
            <li
              key={product.slug}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/products/${product.slug}`}
                    className="font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]"
                  >
                    {product.name}
                  </Link>
                  {!product.isActive ? <Badge className="opacity-70">Inativo</Badge> : null}
                </div>
                <p className="truncate text-xs text-[var(--color-text-muted)]">/{product.slug}</p>
              </div>
              <ProductRowActions slug={product.slug} url={`${appConfig.siteUrl}/${product.slug}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
