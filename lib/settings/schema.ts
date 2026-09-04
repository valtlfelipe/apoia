import { z } from "zod";
import { AVATAR_STYLES } from "@/lib/avatar";
import { parseReaisToCents } from "@/lib/format";
import { sanitizeText } from "@/lib/validation";

export const creatorLinkSchema = z.object({
  label: z.string().trim().min(1, "obrigatório").max(40).transform(sanitizeText),
  url: z.string().trim().url("informe uma URL válida"),
});

export type CreatorLink = z.infer<typeof creatorLinkSchema>;

/** An optional free-text field: blank ⇒ undefined ⇒ "use the code default" (see lib/config/creator.ts). */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform(sanitizeText)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const creatorSettingsSchema = z.object({
  name: optionalText(80),
  shortName: optionalText(60),
  tagline: optionalText(200),
  // https-only: the CSP's img-src allows "https:" broadly (see next.config.ts)
  // but nothing else, and upgrade-insecure-requests would silently break an
  // http: URL anyway — better to reject it here with a clear message.
  avatarUrl: z
    .union([
      z
        .string()
        .trim()
        .url("informe uma URL válida")
        .refine((v) => v.startsWith("https://"), "a URL do avatar precisa ser https"),
      z.literal(""),
    ])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  links: z.array(creatorLinkSchema).max(10, "no máximo 10 links"),
});

export type CreatorSettingsInput = z.infer<typeof creatorSettingsSchema>;

/** A single reais-formatted field (e.g. "1,00" or "1.00"), converted to an integer cents value. */
const reaisToCents = z.string().transform((v, ctx) => {
  const cents = parseReaisToCents(v);
  if (cents === null) {
    ctx.addIssue({ code: "custom", message: "informe um valor válido" });
    return z.NEVER;
  }
  return cents;
});

/** A comma-separated list of cent amounts (e.g. "500,1500,2500") — kept in cents, not reais: a
 *  reais list would make "," ambiguous between the list separator and the pt-BR decimal mark. */
const csvCents = z.string().transform((v, ctx) => {
  const parts = v
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length === 0) {
    ctx.addIssue({ code: "custom", message: "informe ao menos um valor" });
    return z.NEVER;
  }
  const cents = parts.map(Number);
  if (cents.some((n) => !Number.isInteger(n) || n <= 0)) {
    ctx.addIssue({
      code: "custom",
      message: "valores devem ser números inteiros positivos, em centavos, separados por vírgula",
    });
    return z.NEVER;
  }
  return cents;
});

/**
 * Unlike creatorSettingsSchema, every field here is required: /admin/settings
 * always shows and submits resolved values for this section (see
 * lib/config/support.ts) rather than treating a blank field as "use the
 * default" — so even thankYouMessage, free text, stays non-empty here
 * (clearing it back to the pt-BR default isn't offered from this form).
 */
export const supportSettingsSchema = z
  .object({
    amountPresets: csvCents,
    minAmountCents: reaisToCents,
    maxAmountCents: reaisToCents,
    defaultPublic: z.boolean(),
    showTotalCount: z.boolean(),
    showTotalAmount: z.boolean(),
    avatarStyle: z
      .string()
      .trim()
      .min(1, "obrigatório")
      .refine(
        (v) => AVATAR_STYLES.includes(v),
        `estilo desconhecido — use um destes: ${AVATAR_STYLES.join(", ")}`,
      ),
    chargeExpiresInSeconds: z.coerce
      .number({ error: "informe um número válido" })
      .int()
      .positive("precisa ser maior que zero"),
    thankYouMessage: z
      .string()
      .trim()
      .min(1, "obrigatório")
      .max(300, "no máximo 300 caracteres")
      .transform(sanitizeText),
  })
  .superRefine((data, ctx) => {
    if (data.minAmountCents < 100) {
      ctx.addIssue({
        code: "custom",
        path: ["minAmountCents"],
        message: "o valor mínimo precisa ser pelo menos R$ 1,00",
      });
    }
    if (data.maxAmountCents <= data.minAmountCents) {
      ctx.addIssue({
        code: "custom",
        path: ["maxAmountCents"],
        message: "o valor máximo precisa ser maior que o mínimo",
      });
    }
  });

export type SupportSettingsInput = z.infer<typeof supportSettingsSchema>;
