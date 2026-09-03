"use client";

import { useState } from "react";
import { TimelineItem } from "@/components/timeline-item";
import { Button } from "@/components/ui/button";
import type { PublicSupport } from "@/lib/supports/public";

type TimelineListProps = {
  initialItems: PublicSupport[];
  initialCursor: string | null;
  productSlug?: string;
};

export function TimelineList({ initialItems, initialCursor, productSlug }: TimelineListProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  // `useState(initialItems)` only reads its argument on the very first
  // render — a fresh `initialItems` after the server re-renders (e.g. the
  // `router.refresh()` a confirmed payment triggers) would otherwise be
  // silently ignored, leaving the timeline stuck on stale data. This is
  // React's own recommended pattern for resetting state when a prop
  // changes, applied during render rather than in an effect so there's no
  // one-tick flash of the old list.
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
    setCursor(initialCursor);
  }

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor });
      if (productSlug) params.set("product", productSlug);
      const response = await fetch(`/api/timeline?${params.toString()}`);
      if (!response.ok) return;
      const data = (await response.json()) as { items: PublicSupport[]; nextCursor: string | null };
      setItems((current) => [...current, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--color-border)] py-12 text-center">
        <p className="font-display text-[var(--color-text-muted)] italic">
          Ainda ninguém por aqui — que tal ser a primeira pessoa a apoiar?
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul>
        {items.map((item) => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </ul>
      {cursor ? (
        <div className="flex justify-center pt-1">
          <Button type="button" variant="secondary" onClick={loadMore} disabled={loading}>
            {loading ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
