import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "brand" | "neutral" | "warn";

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-brand-soft text-brand-ink",
  neutral: "bg-subtle text-ink-muted",
  warn: "bg-warn-soft text-warn-ink",
};

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
