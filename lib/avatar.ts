import * as collection from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { appConfig } from "@/lib/config/config";

type StyleModule = Parameters<typeof createAvatar>[0];

const styles = collection as unknown as Record<string, StyleModule>;

function resolveStyle(): StyleModule {
  const style = styles[appConfig.avatarStyle];
  if (!style) {
    const available = Object.keys(styles).join(", ");
    throw new Error(
      `Unknown APOIA_AVATAR_STYLE "${appConfig.avatarStyle}". Available styles: ${available}`,
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
