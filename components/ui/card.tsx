import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}>
      {children}
    </div>
  );
}

/**
 * Title, optional one-line description, and an optional action on the right
 * (a button, a badge). Separated from the body by a hairline so a card can
 * hold several stacked sections without needing a box around each one.
 */
export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5 sm:p-6", className)}>{children}</div>;
}
