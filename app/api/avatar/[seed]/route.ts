import { generateAvatarSvg } from "@/lib/avatar";

// Seeds are opaque support UUIDs (or "creator") — never a name — so nothing
// identifying ever appears in this URL, an access log, or a CDN cache key.
const SEED_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;

export async function GET(_request: Request, { params }: { params: Promise<{ seed: string }> }) {
  const { seed } = await params;

  if (!SEED_PATTERN.test(seed)) {
    return new Response("Invalid seed", { status: 400 });
  }

  const svg = generateAvatarSvg(seed);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
      // Belt and suspenders: SVGs are served inline via <img>, never
      // dangerouslySetInnerHTML'd, but this header stops any script content
      // in the SVG from ever executing even if that changes later.
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
