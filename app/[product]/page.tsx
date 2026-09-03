import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreatorHeader } from "@/components/creator-header";
import { Headline } from "@/components/headline";
import { SupportForm } from "@/components/support-form";
import { Timeline } from "@/components/timeline";
import { appConfig } from "@/lib/config/config";
import { getProduct } from "@/lib/config/products";

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
  if (!product) return {};
  return {
    title: product.headline,
    description: product.description ?? `Apoie ${appConfig.creator.name} com Pix.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { product: slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <main className="mx-auto flex max-w-[1120px] flex-col gap-12 px-6 py-14 sm:py-20">
      <CreatorHeader creator={appConfig.creator} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,500px)_minmax(0,500px)] lg:items-start lg:gap-16">
        <div className="space-y-6 lg:sticky lg:top-14">
          <h2 className="font-display text-3xl leading-[1.15] font-medium text-balance sm:text-4xl">
            <Headline text={product.headline} highlight={product.name} />
          </h2>
          {product.description ? (
            <p className="text-[15px] text-[var(--color-text-muted)]">{product.description}</p>
          ) : null}
          <SupportForm
            presets={appConfig.amounts.presets}
            minCents={appConfig.amounts.minCents}
            maxCents={appConfig.amounts.maxCents}
            defaultPublic={appConfig.timeline.defaultPublic}
            thankYouMessage={appConfig.thankYouMessage}
            productSlug={product.slug}
          />
        </div>

        <Timeline />
      </div>
    </main>
  );
}
