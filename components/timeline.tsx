import { StatsBar } from "@/components/stats-bar";
import { TimelineList } from "@/components/timeline-list";
import { getSupportSettings } from "@/lib/config/support";
import { getTimelineAggregates, getTimelinePage } from "@/lib/supports/queries";

export async function Timeline({ productSlug }: { productSlug?: string }) {
  const [page, aggregates] = await Promise.all([
    getTimelinePage({ productSlug }),
    getTimelineAggregates(productSlug),
  ]);
  const supportSettings = getSupportSettings();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-[var(--color-text)]">Apoiadores</h2>
        <StatsBar
          totalCount={aggregates.totalCount}
          totalAmountCents={aggregates.totalAmountCents}
          showCount={supportSettings.showTotalCount}
          showAmount={supportSettings.showTotalAmount}
        />
      </div>
      <TimelineList
        initialItems={page.items}
        initialCursor={page.nextCursor}
        productSlug={productSlug}
      />
    </section>
  );
}
