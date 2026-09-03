import { creatorShortName } from "@/lib/config/creator";
import { env } from "@/lib/config/env";

/**
 * Public-safe app configuration derived from ENV. This is what components
 * import — never `env` directly from client-adjacent code — so that adding a
 * new secret to `env.ts` doesn't accidentally leak it into a component prop.
 */
export const appConfig = {
  creator: {
    name: env.APOIA_CREATOR_NAME,
    shortName: creatorShortName,
    tagline: env.APOIA_CREATOR_TAGLINE ?? null,
    avatarUrl: env.APOIA_CREATOR_AVATAR_URL || null,
    links: env.APOIA_CREATOR_LINKS,
  },
  siteUrl: env.APOIA_SITE_URL,
  amounts: {
    presets: env.APOIA_AMOUNT_PRESETS,
    minCents: env.APOIA_MIN_AMOUNT_CENTS,
    maxCents: env.APOIA_MAX_AMOUNT_CENTS,
  },
  timeline: {
    defaultPublic: env.APOIA_DEFAULT_PUBLIC,
    showTotalCount: env.APOIA_SHOW_TOTAL_COUNT,
    showTotalAmount: env.APOIA_SHOW_TOTAL_AMOUNT,
  },
  avatarStyle: env.APOIA_AVATAR_STYLE,
  thankYouMessage:
    env.APOIA_THANK_YOU_MESSAGE ?? "Seu apoio de {amount} chegou certinho. Muito obrigado.",
  chargeExpiresInSeconds: env.APOIA_CHARGE_EXPIRES_IN,
} as const;

export type AppConfig = typeof appConfig;
