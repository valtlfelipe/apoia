import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  description?: ReactNode;
};

/**
 * A labelled on/off row. Still a real `<input type="checkbox">` underneath —
 * `sr-only`, not hidden — so it keeps native keyboard behaviour and shows up
 * in FormData under its `name` exactly like the plain checkbox it replaced.
 */
export function Switch({ label, description, className, id, ...props }: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-3.5 transition-colors hover:border-brand/40",
        className,
      )}
    >
      <span className="min-w-0 text-sm">
        <span className="block font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{description}</span>
        ) : null}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input type="checkbox" id={id} className="peer sr-only" {...props} />
        <span className="block h-6 w-10 rounded-full bg-subtle ring-1 ring-line transition-colors peer-checked:bg-brand peer-checked:ring-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand" />
        <span className="pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
