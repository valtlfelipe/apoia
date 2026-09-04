import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreatorHeader } from "@/components/creator-header";
import { Headline } from "@/components/headline";
import { SiteFooter } from "@/components/site-footer";
import { SupportForm } from "@/components/support-form";
import { Timeline } from "@/components/timeline";
import { getCreator } from "@/lib/config/creator";
import { getProduct } from "@/lib/config/products";
import { getSupportSettings } from "@/lib/config/support";
import { pageMetadata, productDescription } from "@/lib/seo";

type ProductPageProps = {
  params: Promise<{ product: string }>;
};

// The timeline shows live data (new supporters appear as payments confirm),
// so this page is rendered per-request rather than statically generated —
// which also means it never touches the database at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { product: slug } = await params;
  const product = getProduct(slug);
  // The page itself 404s below, but a deactivated product's URL may already be
  // out there — say noindex rather than leaving it to the default.
  if (!product?.isActive) return { robots: { index: false, follow: false } };

  return pageMetadata({
    title: product.headline,
    description: productDescription(product),
    path: `/${product.slug}`,
    siteName: getCreator().name,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { product: slug } = await params;
  const product = getProduct(slug);
  if (!product?.isActive) notFound();
  const supportSettings = getSupportSettings();

  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-col gap-10 px-5 py-10 sm:px-6 sm:py-14">
      <CreatorHeader creator={getCreator()} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="space-y-5 lg:sticky lg:top-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-balance">
              <Headline text={product.headline} highlight={product.name} />
            </h2>
            {product.description ? (
              <p className="text-[15px] leading-relaxed text-ink-muted">{product.description}</p>
            ) : null}
          </div>
          <SupportForm
            presets={supportSettings.amountPresets}
            minCents={supportSettings.minAmountCents}
            maxCents={supportSettings.maxAmountCents}
            defaultPublic={supportSettings.defaultPublic}
            thankYouMessage={supportSettings.thankYouMessage}
            productSlug={product.slug}
          />
        </div>

        <Timeline />
      </div>

      <SiteFooter />
    </main>
  );
}
