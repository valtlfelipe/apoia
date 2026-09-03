import { z } from "zod";
import { getProduct } from "@/lib/config/products";
import { getSupportSettings } from "@/lib/config/support";

// Control characters (C0 + DEL) and common zero-width / invisible formatting
// characters, expressed as \u escapes so no literal non-printable byte ever
// lives in this source file. (noControlCharactersInRegex is disabled for this
// file in biome.json — this is the intentional strip-list, not a mistake.)
const HIDDEN_CHARS_PATTERN =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029\uFEFF]/g;

/** Trims, collapses whitespace, and strips control / zero-width characters from free text. */
export function sanitizeText(input: string): string {
  return input.replace(HIDDEN_CHARS_PATTERN, "").replace(/\s+/g, " ").trim();
}

/**
 * A function, not a module-level const: minCents/maxCents/defaultPublic now
 * come from the database (editable at /admin/settings), and a schema built
 * once at import time would keep validating against whatever those were the
 * moment this module first loaded — never picking up a later edit, even
 * with revalidatePath, until the process restarts. Called fresh on every
 * request (app/api/support/route.ts calls createSupportSchema().safeParse(...)).
 *
 * The productSlug .refine() below doesn't have this problem — refine
 * callbacks run per safeParse() call, not at schema-construction time — and
 * is the precedent this whole function follows.
 */
export function createSupportSchema() {
  const settings = getSupportSettings();

  return z
    .object({
      amountCents: z
        .number()
        .int("o valor deve ser um número inteiro de centavos")
        .min(settings.minAmountCents, `o valor mínimo é ${settings.minAmountCents / 100}`)
        .max(settings.maxAmountCents, `o valor máximo é ${settings.maxAmountCents / 100}`),
      displayName: z
        .string()
        .max(60, "o nome deve ter no máximo 60 caracteres")
        .transform(sanitizeText)
        .optional(),
      message: z
        .string()
        .max(280, "a mensagem deve ter no máximo 280 caracteres")
        .transform(sanitizeText)
        .optional(),
      isPublic: z.boolean().default(settings.defaultPublic),
      productSlug: z
        .string()
        .max(60)
        .optional()
        .refine((slug) => slug === undefined || getProduct(slug)?.isActive === true, {
          message: "produto desconhecido",
        }),
    })
    .transform((data) => ({
      ...data,
      displayName: data.displayName && data.displayName.length > 0 ? data.displayName : undefined,
      message: data.message && data.message.length > 0 ? data.message : undefined,
    }));
}

export type CreateSupportInput = z.infer<ReturnType<typeof createSupportSchema>>;
