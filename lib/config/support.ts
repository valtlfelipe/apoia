import { getSettingsRow } from "@/lib/settings/repo";

export type SupportSettings = {
  amountPresets: number[];
  minAmountCents: number;
  maxAmountCents: number;
  defaultPublic: boolean;
  showTotalCount: boolean;
  showTotalAmount: boolean;
  avatarStyle: string;
  chargeExpiresInSeconds: number;
  thankYouMessage: string;
};

// Identical to what APOIA_AMOUNT_PRESETS/MIN_AMOUNT_CENTS/etc. (and
// APOIA_THANK_YOU_MESSAGE) used to default to in lib/config/env.ts, before
// this group moved to the database.
const DEFAULTS: SupportSettings = {
  amountPresets: [500, 1500, 2500],
  minAmountCents: 100,
  maxAmountCents: 1_000_000,
  defaultPublic: true,
  showTotalCount: true,
  showTotalAmount: false,
  avatarStyle: "notionists",
  chargeExpiresInSeconds: 1800,
  thankYouMessage: "Seu apoio de {amount} chegou certinho. Muito obrigado.",
};

/**
 * Support-form config, read from the `settings` table with code-level
 * defaults for an unconfigured instance (no ENV fallback — see CHANGELOG
 * for the breaking removal of the old APOIA_AMOUNT_PRESETS,
 * APOIA_MIN_AMOUNT_CENTS, APOIA_MAX_AMOUNT_CENTS, APOIA_DEFAULT_PUBLIC,
 * APOIA_SHOW_TOTAL_COUNT, APOIA_SHOW_TOTAL_AMOUNT, APOIA_AVATAR_STYLE,
 * APOIA_CHARGE_EXPIRES_IN, and APOIA_THANK_YOU_MESSAGE vars). Sync, same as
 * getCreator(): reads through lib/settings/repo.ts's cached row.
 *
 * Unlike getCreator(), every field here always has a concrete value once
 * saved — there's no "blank means use the default" state the way an
 * optional text field has, so /admin/settings shows and writes resolved
 * values for this section rather than the raw nullable row.
 */
export function getSupportSettings(): SupportSettings {
  const row = getSettingsRow();
  return {
    amountPresets:
      row?.amountPresets && row.amountPresets.length > 0
        ? row.amountPresets
        : DEFAULTS.amountPresets,
    minAmountCents: row?.minAmountCents ?? DEFAULTS.minAmountCents,
    maxAmountCents: row?.maxAmountCents ?? DEFAULTS.maxAmountCents,
    defaultPublic: row?.defaultPublic ?? DEFAULTS.defaultPublic,
    showTotalCount: row?.showTotalCount ?? DEFAULTS.showTotalCount,
    showTotalAmount: row?.showTotalAmount ?? DEFAULTS.showTotalAmount,
    avatarStyle: row?.avatarStyle ?? DEFAULTS.avatarStyle,
    chargeExpiresInSeconds: row?.chargeExpiresInSeconds ?? DEFAULTS.chargeExpiresInSeconds,
    thankYouMessage: row?.thankYouMessage ?? DEFAULTS.thankYouMessage,
  };
}
