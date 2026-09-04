import { HEART_PATH, HEART_VIEWBOX } from "@/lib/brand";
import { cn } from "@/lib/cn";

/**
 * The apoia mark for use inside the app (admin header, login). Size it with a
 * `size-*` class. The tile follows the theme's brand color rather than the
 * literal hex, so it shifts with dark mode like every other accent.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("text-brand", className)} role="img" aria-label="apoia">
      <rect width="64" height="64" rx="15" fill="currentColor" />
      <svg x="15" y="18.5" width="34" height="27" viewBox={HEART_VIEWBOX} aria-hidden="true">
        <path d={HEART_PATH} fill="#fff" />
      </svg>
    </svg>
  );
}
