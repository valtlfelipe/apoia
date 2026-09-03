import { z } from "zod";

/**
 * Route segments a product slug must never collide with — either a real
 * route (`api`, `admin`, `avatar`, `favicon.ico`) or a Next.js internal
 * (`_next`). A product named `admin` would otherwise be swallowed by the
 * static `/admin` segment and become silently unreachable.
 */
export const RESERVED_SLUGS = ["api", "_next", "avatar", "favicon.ico", "admin"] as const;

export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{0,48}$/,
    "slug must be lowercase alphanumeric with hyphens, starting with a letter or number",
  )
  .refine(
    (slug) => !(RESERVED_SLUGS as readonly string[]).includes(slug),
    "slug conflicts with a reserved route",
  );

/** Shape of a product as submitted from the admin form. */
export const productInputSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(80),
  headline: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  description: z
    .string()
    .trim()
    .max(400)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productInputSchema>;

/** Same as `productInputSchema` but without `slug` — used when editing, where the slug is immutable. */
export const productUpdateSchema = productInputSchema.omit({ slug: true });

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
