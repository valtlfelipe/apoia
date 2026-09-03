import { env } from "@/lib/config/env";

/**
 * Short form of the creator's name, used anywhere the full name would make a
 * headline too long ("Apoie {short} no desenvolvimento do X"). Defaults to
 * the first word of APOIA_CREATOR_NAME; override with
 * APOIA_CREATOR_SHORT_NAME when that's not right — a two-word first name, an
 * org name instead of a person, etc.
 */
export const creatorShortName: string =
  env.APOIA_CREATOR_SHORT_NAME?.trim() ||
  env.APOIA_CREATOR_NAME.trim().split(/\s+/)[0] ||
  env.APOIA_CREATOR_NAME;
