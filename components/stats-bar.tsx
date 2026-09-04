import { formatCents } from "@/lib/format";

type StatsBarProps = {
  totalCount: number;
  totalAmountCents: number;
  showCount: boolean;
  showAmount: boolean;
};

export function StatsBar({ totalCount, totalAmountCents, showCount, showAmount }: StatsBarProps) {
  if (!showCount && !showAmount) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-ink-muted">
      {showCount ? (
        <span>
          <span className="font-semibold text-ink tabular-nums">{totalCount}</span>{" "}
          {totalCount === 1 ? "apoio" : "apoios"}
        </span>
      ) : null}
      {showCount && showAmount ? <span aria-hidden="true">·</span> : null}
      {showAmount ? (
        <span>
          <span className="font-semibold text-ink tabular-nums">
            {formatCents(totalAmountCents)}
          </span>{" "}
          arrecadados
        </span>
      ) : null}
    </div>
  );
}
