import type { ReactNode } from "react";

/**
 * Every admin screen opens the same way: a big title, one line saying what
 * the screen is for, and (sometimes) the screen's primary action on the right.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
