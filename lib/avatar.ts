import * as collection from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { getSupportSettings } from "@/lib/config/support";

type StyleModule = Parameters<typeof createAvatar>[0];

const styles = collection as unknown as Record<string, StyleModule>;

/**
 * Every style name @dicebear/collection actually exports at this pinned
 * version — used both to resolve a style below and, by
 * lib/settings/schema.ts, to reject a typo'd style name at admin-save time
 * instead of only discovering it here, mid-avatar-generation.
 */
export const AVATAR_STYLES: string[] = Object.keys(styles);

function resolveStyle(): StyleModule {
  const avatarStyle = getSupportSettings().avatarStyle;
  const style = styles[avatarStyle];
  if (!style) {
    // Shouldn't happen in practice — the admin form validates against
    // AVATAR_STYLES before this is ever saved — but stay defensive in case
    // the row was edited some other way (direct SQL, an old backup, etc).
    throw new Error(
      `Unknown avatar style "${avatarStyle}". Available styles: ${AVATAR_STYLES.join(", ")}`,
    );
  }
  return style;
}

/**
 * Generates a deterministic SVG avatar from a seed. We always seed with the
 * support's opaque UUID — never a name — so avatar URLs never leak who a
 * supporter is, public or anonymous.
 */
export function generateAvatarSvg(seed: string): string {
  const avatar = createAvatar(resolveStyle(), { seed });
  return avatar.toString();
}
