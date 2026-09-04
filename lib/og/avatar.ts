import { generateAvatarSvg } from "@/lib/avatar";
import type { Creator } from "@/lib/config/creator";

// A social crawler is waiting on this request, and the configured avatar is an
// arbitrary third-party URL — bound both how long we'll wait and how much
// we'll read.
const FETCH_TIMEOUT_MS = 3000;
const MAX_BYTES = 2 * 1024 * 1024;

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function fetchImageDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!contentType.startsWith("image/")) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) return null;

    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    // Timeout, DNS failure, TLS error, an instance with no outbound internet —
    // all the same answer here: fall back to the generated avatar.
    return null;
  }
}

/**
 * The creator's avatar as a data URI, for embedding in the Open Graph card.
 *
 * Inlined rather than handed to Satori as a URL: Satori would fetch it itself,
 * with no timeout and no fallback, so one slow or dead avatar host would hang
 * or break the whole image. Falls back to the same generated avatar the page
 * itself uses (seed "creator", see components/creator-header.tsx).
 */
export async function creatorAvatarDataUri(creator: Creator): Promise<string> {
  if (creator.avatarUrl) {
    const remote = await fetchImageDataUri(creator.avatarUrl);
    if (remote) return remote;
  }
  return svgDataUri(generateAvatarSvg("creator"));
}
