import { StatsBar } from "@/components/stats-bar";
import { TimelineList } from "@/components/timeline-list";
import { Card, CardHeader } from "@/components/ui/card";
import { getSupportSettings } from "@/lib/config/support";
import { getTimelineAggregates, getTimelinePage } from "@/lib/supports/queries";

export async function Timeline({ productSlug }: { productSlug?: string }) {
  const [page, aggregates] = await Promise.all([
    getTimelinePage({ productSlug }),
    getTimelineAggregates(productSlug),
  ]);
  const supportSettings = getSupportSettings();

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Apoiadores"
        action={
          <StatsBar
            totalCount={aggregates.totalCount}
            totalAmountCents={aggregates.totalAmountCents}
            showCount={supportSettings.showTotalCount}
            showAmount={supportSettings.showTotalAmount}
          />
        }
      />
      <TimelineList
        initialItems={page.items}
        initialCursor={page.nextCursor}
        productSlug={productSlug}
      />
    </Card>
  );
}
