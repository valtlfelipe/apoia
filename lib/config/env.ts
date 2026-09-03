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

const creatorLinkSchema = z.object({
  label: z.string().min(1).max(40),
  url: z.string().url(),
});

const productSchema = z.object({
  slug: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]{0,48}$/,
      "slug must be lowercase alphanumeric with hyphens, starting with a letter or number",
    )
    .refine(
      (slug) => !["api", "_next", "avatar", "favicon.ico"].includes(slug),
      "slug conflicts with a reserved route",
    ),
  name: z.string().min(1).max(80),
  headline: z.string().min(1).max(200).optional(),
  description: z.string().max(400).optional(),
});

const jsonArray = <T extends z.ZodTypeAny>(schema: T, fieldName: string) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v.trim() === "") return [];
      try {
        return JSON.parse(v);
      } catch {
        ctx.addIssue({ code: "custom", message: `${fieldName} is not valid JSON` });
        return z.NEVER;
      }
    })
    .pipe(z.array(schema));

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

    // --- Creator ---
    APOIA_CREATOR_NAME: z.string().min(1, "APOIA_CREATOR_NAME is required"),
    // Shown wherever a full name would be too long for a headline (e.g. "Apoie
    // {short} no desenvolvimento do X"). Defaults to the first word of
    // APOIA_CREATOR_NAME — set this explicitly for names where that's wrong
    // (a two-word first name, an org name, etc).
    APOIA_CREATOR_SHORT_NAME: z.string().max(60).optional(),
    APOIA_CREATOR_TAGLINE: z.string().max(200).optional(),
    APOIA_CREATOR_AVATAR_URL: z.string().url().optional().or(z.literal("")),
    APOIA_CREATOR_LINKS: jsonArray(creatorLinkSchema, "APOIA_CREATOR_LINKS"),
    APOIA_SITE_URL: z.string().url(),

    // --- Products ---
    APOIA_PRODUCTS: jsonArray(productSchema, "APOIA_PRODUCTS"),

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

    const slugs = new Set<string>();
    for (const product of env.APOIA_PRODUCTS) {
      if (slugs.has(product.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["APOIA_PRODUCTS"],
          message: `duplicate product slug: "${product.slug}"`,
        });
      }
      slugs.add(product.slug);
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
  return result.data;
}

export const env = loadEnv();
