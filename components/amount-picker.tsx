"use client";

import { cn } from "@/lib/cn";
import { formatCents, parseReaisToCents } from "@/lib/format";

type AmountPickerProps = {
  presets: number[];
  valueReais: string;
  minCents: number;
  maxCents: number;
  onChange: (value: string) => void;
};

/** "5", "15", "2,50" — the amount without "R$", which the field already shows. */
function presetLabel(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ",");
}

/** Cents as the field's own text ("500" → "5,00"), readable back by parseReaisToCents. */
export function amountFieldValue(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * One amount field with the suggested values as shortcuts inside it. This
 * used to be two separate controls (a row of preset pills *and* a
 * "outro valor" field) kept in sync by an `isCustomMode` flag; a preset now
 * just writes into the same field everyone types in, so there's one value and
 * no mode to be in.
 */
export function AmountPicker({
  presets,
  valueReais,
  minCents,
  maxCents,
  onChange,
}: AmountPickerProps) {
  const cents = parseReaisToCents(valueReais);
  const outOfRange =
    cents !== null && valueReais.trim() !== ""
      ? cents < minCents
        ? "min"
        : cents > maxCents
          ? "max"
          : null
      : null;

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-ink">Quanto vale um apoio?</span>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-transparent bg-subtle p-1.5 pl-3.5 transition-colors focus-within:border-brand focus-within:bg-surface focus-within:ring-2 focus-within:ring-brand/20">
        <div className="flex min-w-[7rem] flex-1 items-baseline gap-1.5">
          <span className="text-sm font-semibold text-ink-muted">R$</span>
          <input
            type="text"
            inputMode="decimal"
            aria-label="Valor do apoio em reais"
            placeholder="0,00"
            value={valueReais}
            onChange={(event) => onChange(event.target.value)}
            className="w-full min-w-0 bg-transparent py-1.5 text-[15px] font-semibold text-ink tabular-nums outline-none placeholder:font-normal placeholder:text-ink-muted"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => {
            const active = cents === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(amountFieldValue(preset))}
                aria-pressed={active}
                aria-label={formatCents(preset)}
                className={cn(
                  "h-8 rounded-lg px-2.5 text-sm font-semibold tabular-nums transition-colors",
                  active
                    ? "bg-brand text-on-brand"
                    : "bg-surface text-ink-muted hover:text-ink ring-1 ring-line",
                )}
              >
                {presetLabel(preset)}
              </button>
            );
          })}
        </div>
      </div>

      {outOfRange ? (
        <p className="text-xs font-medium text-danger-ink">
          {outOfRange === "min"
            ? `Valor mínimo: ${formatCents(minCents)}`
            : `Valor máximo: ${formatCents(maxCents)}`}
        </p>
      ) : null}
    </div>
  );
}
