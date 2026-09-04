import { getCreator } from "@/lib/config/creator";
import { getProduct } from "@/lib/config/products";
import { creatorAvatarDataUri } from "@/lib/og/avatar";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og/card";

// Products are managed at /admin/products — see app/opengraph-image.tsx for
// why that rules out build-time caching.
export const dynamic = "force-dynamic";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Convite para apoiar via Pix";

export default async function Image({ params }: { params: Promise<{ product: string }> }) {
  const { product: slug } = await params;
  const creator = getCreator();
  const product = getProduct(slug);
  const avatar = await creatorAvatarDataUri(creator);

  // An inactive or unknown product 404s in page.tsx, so nothing should link to
  // this image — fall back to the creator card rather than erroring, in case
  // something requests it directly.
  if (!product?.isActive) {
    return ogCard({
      avatar,
      name: creator.name,
      title: `Apoie ${creator.shortName}`,
      // Tagline or nothing — the Pix line below already carries the pitch.
      subtitle: creator.tagline?.trim() || undefined,
    });
  }

  return ogCard({
    avatar,
    name: creator.name,
    eyebrow: product.name,
    title: product.headline,
    // The product's own description or nothing — productDescription()'s
    // "<name> — <pitch>" fallback is right for a meta tag, but on the card it
    // would repeat the product name and the Pix line already shown below.
    subtitle: product.description,
  });
}
