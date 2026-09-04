import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FieldProps = {
  id?: string;
  label: ReactNode;
  /** Appends a muted "(opcional)" to the label — the same wording everywhere. */
  optional?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Label + control + one line of help underneath. Every form in the app
 * repeated that trio by hand; collapsing it here is what makes the forms
 * themselves readable as a list of fields.
 *
 * An `error` replaces the `hint` rather than stacking below it — two lines of
 * small text under a field is noise, and the error is the one that matters.
 */
export function Field({ id, label, optional, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {optional ? <span className="font-normal text-ink-muted"> (opcional)</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger-ink">{error}</p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
