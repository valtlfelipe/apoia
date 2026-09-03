import type { CreatorLink } from "@/lib/db/schema";
import { getSettingsRow } from "@/lib/settings/repo";

export type Creator = {
  name: string;
  shortName: string;
  tagline: string | null;
  avatarUrl: string | null;
  links: CreatorLink[];
};

const DEFAULT_NAME = "Apoia";

/**
 * Creator identity, read from the `settings` table with code-level defaults
 * for an unconfigured instance (no ENV fallback — see CHANGELOG for the
 * breaking removal of APOIA_CREATOR_*). Sync: lib/settings/repo.ts caches
 * the row in memory, invalidated on every write from /admin/settings.
 */
export function getCreator(): Creator {
  const row = getSettingsRow();
  const name = row?.creatorName?.trim() || DEFAULT_NAME;
  // Same rule as before: explicit shortName, else the first word of the
  // effective name (default or saved), else the name itself.
  const shortName = row?.creatorShortName?.trim() || name.trim().split(/\s+/)[0] || name;

  return {
    name,
    shortName,
    tagline: row?.creatorTagline ?? null,
    avatarUrl: row?.creatorAvatarUrl ?? null,
    links: row?.creatorLinks ?? [],
  };
}
