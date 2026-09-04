import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatRelativeTime } from "@/lib/format";
import type { PublicSupport } from "@/lib/supports/public";

export function TimelineItem({ item }: { item: PublicSupport }) {
  return (
    <li className="flex gap-3 px-5 py-4 sm:px-6">
      <Image
        src={`/api/avatar/${item.id}`}
        alt=""
        width={36}
        height={36}
        unoptimized
        className="size-9 shrink-0 rounded-full bg-subtle ring-1 ring-line"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
          <span className="font-semibold text-ink">{item.name}</span>
          <span className="text-ink-muted">apoiou com</span>
          <span className="font-semibold text-brand-ink tabular-nums">
            {formatCents(item.amountCents)}
          </span>
          {item.product ? <Badge tone="neutral">{item.product.name}</Badge> : null}
          <span className="text-xs text-ink-muted">
            {formatRelativeTime(new Date(item.paidAt))}
          </span>
        </div>
        {item.message ? (
          <p className="mt-2 rounded-xl rounded-tl-sm bg-subtle px-3 py-2 text-sm leading-relaxed text-ink">
            {item.message}
          </p>
        ) : null}
      </div>
    </li>
  );
}
