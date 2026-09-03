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
    <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
      {showCount ? (
        <span>
          <span className="font-semibold text-[var(--color-text)]">{totalCount}</span>{" "}
          {totalCount === 1 ? "apoio" : "apoios"}
        </span>
      ) : null}
      {showAmount ? (
        <span>
          <span className="font-semibold text-[var(--color-text)]">
            {formatCents(totalAmountCents)}
          </span>{" "}
          arrecadados
        </span>
      ) : null}
    </div>
  );
}
