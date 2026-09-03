import { z } from "zod";
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
