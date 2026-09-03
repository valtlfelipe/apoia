const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Parses a free-typed reais amount (accepting "," or "." as the decimal separator) into cents. */
export function parseReaisToCents(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const normalized = trimmed.replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

export function formatRelativeTime(date: Date): string {
  let duration = (date.getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return relativeTimeFormatter.format(Math.round(duration), "years");
}

/** Date and time as separate short pt-BR strings, for stacking in a compact table cell. */
export function formatDateTime(date: Date): { date: string; time: string } {
  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

/**
 * Shortens a long opaque id to "head...tail" for compact display — e.g. a
 * Pix end-to-end id ("E538ceec110034531ab8a82710fea2098" → "E53...a2098").
 * Never truncates the copy/comparison value itself, just what's shown.
 */
export function truncateMiddle(value: string, headLen = 3, tailLen = 5): string {
  if (value.length <= headLen + tailLen + 3) return value;
  return `${value.slice(0, headLen)}...${value.slice(-tailLen)}`;
}
