import { StatsBar } from "@/components/stats-bar";
import { TimelineList } from "@/components/timeline-list";
import { appConfig } from "@/lib/config/config";
import { getTimelineAggregates, getTimelinePage } from "@/lib/supports/queries";

export async function Timeline({ productSlug }: { productSlug?: string }) {
  const [page, aggregates] = await Promise.all([
    getTimelinePage({ productSlug }),
    getTimelineAggregates(productSlug),
  ]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-[var(--color-text)]">Apoiadores</h2>
        <StatsBar
          totalCount={aggregates.totalCount}
          totalAmountCents={aggregates.totalAmountCents}
          showCount={appConfig.timeline.showTotalCount}
          showAmount={appConfig.timeline.showTotalAmount}
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
