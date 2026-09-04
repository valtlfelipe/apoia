import { getCreator } from "@/lib/config/creator";
import { creatorAvatarDataUri } from "@/lib/og/avatar";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og/card";

// Creator identity is editable at /admin/settings, so this image can't be
// generated once at build time and cached — same reason app/layout.tsx builds
// its metadata in a function rather than a const.
export const dynamic = "force-dynamic";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
// Deliberately generic: `alt` is a module-level export, evaluated once when
// the module loads, so anything read from the database here would freeze at
// server boot and go stale on the next /admin/settings save.
export const alt = "Convite para apoiar via Pix";

export default async function Image() {
  const creator = getCreator();

  return ogCard({
    avatar: await creatorAvatarDataUri(creator),
    name: creator.name,
    // Short name in the headline, full name in the row above it — the two
    // together read as an introduction rather than as a repetition.
    title: `Apoie ${creator.shortName}`,
    // Tagline or nothing — the Pix line below already carries the pitch.
    subtitle: creator.tagline?.trim() || undefined,
  });
}
