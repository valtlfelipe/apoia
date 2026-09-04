import type { MetadataRoute } from "next";
import { listProductRows } from "@/lib/products/repo";
import { absoluteUrl } from "@/lib/seo";

// Products are created and deactivated at runtime from /admin/products, so a
// sitemap generated at build time would be wrong the moment one changes.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  // The raw rows, not lib/config/products' listProducts() — this needs
  // `updatedAt`, which the resolved Product type drops, and none of the
  // headline interpolation it does.
  const products = listProductRows({ activeOnly: true });

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...products.map((product) => ({
      url: absoluteUrl(`/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
