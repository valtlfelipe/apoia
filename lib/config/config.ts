import { env } from "@/lib/config/env";

/**
 * Public-safe app configuration derived from ENV. This is what components
 * import — never `env` directly from client-adjacent code — so that adding a
 * new secret to `env.ts` doesn't accidentally leak it into a component prop.
 *
 * Creator identity and support-form config are NOT here — both moved to the
 * database (see lib/config/creator.ts's `getCreator()` and
 * lib/config/support.ts's `getSupportSettings()`), because they're editable
 * at /admin/settings and this object is a module-level constant that can't
 * reflect a later write without a restart.
 */
export const appConfig = {
  siteUrl: env.APOIA_SITE_URL,
  thankYouMessage:
    env.APOIA_THANK_YOU_MESSAGE ?? "Seu apoio de {amount} chegou certinho. Muito obrigado.",
} as const;

export type AppConfig = typeof appConfig;
