import { BrandMark } from "@/components/brand-mark";
import { PROJECT } from "@/lib/project";

/**
 * Quiet credit at the foot of the public pages. Deliberately small and muted —
 * the page belongs to the creator, not to the software running it.
 */
export function SiteFooter() {
  return (
    <footer className="flex justify-center pt-2 pb-2">
      <a
        href={PROJECT.repository}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
      >
        <BrandMark className="size-3.5 shrink-0" />
        <span>
          feito com <span className="font-semibold">apoia</span>
        </span>
      </a>
    </footer>
  );
}
