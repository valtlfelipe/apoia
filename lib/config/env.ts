import { z } from "zod";

/**
 * Every environment variable the app reads, validated once at import time.
 * If this fails, the process exits with a clear message instead of failing
 * later mid-request (or worse, mid-payment).
 */

const boolFromString = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? defaultValue : v === "true" || v === "1"));

const intFromString = (defaultValue: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? defaultValue : Number(v)))
    .pipe(z.number().int());

const csvInts = (defaultValue: number[]) =>
  z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v.trim() === "") return defaultValue;
      return v
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n));
    })
    .pipe(z.array(z.number().int().positive()).min(1));

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    APOIA_SITE_URL: z.string().url(),

    // --- Support form ---
    APOIA_AMOUNT_PRESETS: csvInts([500, 1500, 2500]),
    APOIA_MIN_AMOUNT_CENTS: intFromString(100),
    APOIA_MAX_AMOUNT_CENTS: intFromString(1_000_000),
    APOIA_DEFAULT_PUBLIC: boolFromString(true),
    APOIA_SHOW_TOTAL_COUNT: boolFromString(true),
    APOIA_SHOW_TOTAL_AMOUNT: boolFromString(false),
    APOIA_AVATAR_STYLE: z.string().min(1).default("notionists"),
    // Shown in the success dialog once a payment is confirmed. Accepts an
    // {amount} placeholder.
    APOIA_THANK_YOU_MESSAGE: z.string().max(300).optional(),
    APOIA_CHARGE_EXPIRES_IN: intFromString(1800),
    APOIA_RATE_LIMIT_PER_MINUTE: intFromString(5),
    APOIA_DEV_SKIP_WEBHOOK_SIGNATURE: boolFromString(false),

    // --- Database ---
    DATABASE_PATH: z.string().min(1).default("./data/apoia.db"),

    // --- Pix ---
    PIX_PROVIDER: z.enum(["woovi"]).default("woovi"),
    WOOVI_APP_ID: z.string().optional(),
    WOOVI_API_URL: z.string().url().default("https://api.woovi.com/api/v1"),
    WOOVI_WEBHOOK_TOKEN: z.string().optional(),
    WOOVI_WEBHOOK_PUBLIC_KEY: z.string().optional(),

    // --- Admin ---
    // Both optional, but required together: set neither to keep /admin fully
    // disabled (every admin route 404s — see lib/auth/admin.ts), or set both
    // to turn it on. APOIA_ADMIN_EMAIL is the only account allowed in, after
    // signing in with shoo.dev; APOIA_ADMIN_SECRET signs our own session
    // cookie (independent of shoo's token) — generate with `openssl rand
    // -base64 32`.
    APOIA_ADMIN_EMAIL: z.string().email().optional(),
    APOIA_ADMIN_SECRET: z.string().min(32).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.APOIA_MIN_AMOUNT_CENTS < 100) {
      ctx.addIssue({
        code: "custom",
        path: ["APOIA_MIN_AMOUNT_CENTS"],
        message: "minimum amount must be at least 100 cents (R$ 1,00)",
      });
    }
    if (env.APOIA_MAX_AMOUNT_CENTS <= env.APOIA_MIN_AMOUNT_CENTS) {
      ctx.addIssue({
        code: "custom",
        path: ["APOIA_MAX_AMOUNT_CENTS"],
        message: "APOIA_MAX_AMOUNT_CENTS must be greater than APOIA_MIN_AMOUNT_CENTS",
      });
    }

    if (Boolean(env.APOIA_ADMIN_EMAIL) !== Boolean(env.APOIA_ADMIN_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: ["APOIA_ADMIN_EMAIL"],
        message: "APOIA_ADMIN_EMAIL and APOIA_ADMIN_SECRET must be set together (or neither)",
      });
    }

    if (env.PIX_PROVIDER === "woovi" && !env.WOOVI_APP_ID) {
      ctx.addIssue({
        code: "custom",
        path: ["WOOVI_APP_ID"],
        message: "WOOVI_APP_ID is required when PIX_PROVIDER=woovi",
      });
    }

    if (env.APOIA_DEV_SKIP_WEBHOOK_SIGNATURE && env.NODE_ENV === "production") {
      ctx.addIssue({
        code: "custom",
        path: ["APOIA_DEV_SKIP_WEBHOOK_SIGNATURE"],
        message: "must not be enabled in production — this would let anyone fake a payment",
      });
    }

    for (const key of Object.keys(process.env)) {
      if (key.startsWith("NEXT_PUBLIC_") && /PIX|WOOVI|SECRET|TOKEN|KEY/i.test(key)) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `"${key}" looks like a secret but is prefixed with NEXT_PUBLIC_, which ships it to every browser. Rename it without that prefix.`,
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.error(`\nInvalid configuration. Fix your environment and restart:\n${issues}\n`);
    throw new Error("Invalid environment configuration");
  }

  // Vars retired in favor of /admin, grouped by where their replacement
  // lives. Unknown keys are silently ignored by zod, so warn explicitly —
  // someone upgrading with an old var still set would otherwise wonder why
  // its value stopped taking effect.
  const retiredVars: Record<string, string> = {
    APOIA_PRODUCTS: "products are now managed at /admin/products",
    APOIA_CREATOR_NAME: "creator identity is now managed at /admin/settings",
    APOIA_CREATOR_SHORT_NAME: "creator identity is now managed at /admin/settings",
    APOIA_CREATOR_TAGLINE: "creator identity is now managed at /admin/settings",
    APOIA_CREATOR_AVATAR_URL: "creator identity is now managed at /admin/settings",
    APOIA_CREATOR_LINKS: "creator identity is now managed at /admin/settings",
  };
  const stillSet = Object.keys(retiredVars).filter((key) => process.env[key] !== undefined);
  if (stillSet.length > 0) {
    const lines = stillSet.map((key) => `  - ${key}: ${retiredVars[key]}`).join("\n");
    // eslint-disable-next-line no-console
    console.warn(
      `\nThese environment variables are set but no longer used — remove them from your .env, their values are ignored:\n${lines}\n`,
    );
  }

  return result.data;
}

export const env = loadEnv();
