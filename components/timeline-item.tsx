import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatRelativeTime } from "@/lib/format";
import type { PublicSupport } from "@/lib/supports/public";

export function TimelineItem({ item }: { item: PublicSupport }) {
  return (
    <li className="flex gap-3 border-b border-[var(--color-border)] py-5 last:border-none">
      <Image
        src={`/api/avatar/${item.id}`}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="h-10 w-10 shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-medium text-[var(--color-text)]">{item.name}</span>
          <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-accent-strong)]">
            {formatCents(item.amountCents)}
          </span>
          {item.product ? <Badge>{item.product.name}</Badge> : null}
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatRelativeTime(new Date(item.paidAt))}
          </span>
        </div>
        {item.message ? (
          <p className="font-display mt-1.5 text-[15px] text-[var(--color-text)] italic">
            “{item.message}”
          </p>
        ) : null}
      </div>
    </li>
  );
}
