"use client";

import { cn } from "@/lib/cn";
import { formatCents, parseReaisToCents } from "@/lib/format";

type AmountPickerProps = {
  presets: number[];
  isCustomMode: boolean;
  selectedPresetCents: number | null;
  customValueReais: string;
  minCents: number;
  maxCents: number;
  onSelectPreset: (cents: number) => void;
  onCustomChange: (value: string) => void;
};

export function AmountPicker({
  presets,
  isCustomMode,
  selectedPresetCents,
  customValueReais,
  minCents,
  maxCents,
  onSelectPreset,
  onCustomChange,
}: AmountPickerProps) {
  const parsedCustom = isCustomMode ? parseReaisToCents(customValueReais) : null;
  const outOfRange =
    parsedCustom !== null && customValueReais.trim() !== ""
      ? parsedCustom < minCents
        ? "min"
        : parsedCustom > maxCents
          ? "max"
          : null
      : null;

  return (
    <div className="space-y-2.5">
      <span className="block text-sm font-medium text-[var(--color-text)]">
        Quanto vale um apoio?
      </span>
      <div className="flex flex-wrap gap-2">
        {presets.map((cents) => {
          const active = !isCustomMode && selectedPresetCents === cents;
          return (
            <button
              key={cents}
              type="button"
              onClick={() => onSelectPreset(cents)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-accent)]",
              )}
            >
              {formatCents(cents)}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          "flex items-center rounded-full border pl-4 pr-1 transition-colors",
          isCustomMode
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
            : "border-dashed border-[var(--color-border)] bg-[var(--color-surface)]",
        )}
      >
        <span className="text-sm text-[var(--color-text-muted)]">R$</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="outro valor"
          value={customValueReais}
          onFocus={() => onCustomChange(customValueReais)}
          onChange={(event) => onCustomChange(event.target.value)}
          className="w-full bg-transparent px-1.5 py-2.5 text-sm font-semibold text-[var(--color-text)] outline-none placeholder:font-normal placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      {outOfRange === "min" ? (
        <p className="text-xs font-medium text-red-500">Valor mínimo: {formatCents(minCents)}</p>
      ) : outOfRange === "max" ? (
        <p className="text-xs font-medium text-red-500">Valor máximo: {formatCents(maxCents)}</p>
      ) : null}
    </div>
  );
}
