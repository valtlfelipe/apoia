import { z } from "zod";
import { appConfig } from "@/lib/config/config";
import { getProduct } from "@/lib/config/products";

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

export const createSupportSchema = z
  .object({
    amountCents: z
      .number()
      .int("o valor deve ser um número inteiro de centavos")
      .min(appConfig.amounts.minCents, `o valor mínimo é ${appConfig.amounts.minCents / 100}`)
      .max(appConfig.amounts.maxCents, `o valor máximo é ${appConfig.amounts.maxCents / 100}`),
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
    isPublic: z.boolean().default(appConfig.timeline.defaultPublic),
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

export type CreateSupportInput = z.infer<typeof createSupportSchema>;
