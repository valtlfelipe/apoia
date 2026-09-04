import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Filled rather than outlined: on a white card a tinted field reads as
 * "type here" without drawing a box around every row, which is what keeps
 * a long form from looking like a grid of cells.
 */
export const fieldClasses =
  "w-full rounded-xl border border-transparent bg-subtle text-sm text-ink transition-colors outline-none placeholder:text-ink-muted focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, "h-10 px-3.5", className)} {...props} />;
}
