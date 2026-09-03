import Image from "next/image";
import type { Creator } from "@/lib/config/creator";

type CreatorHeaderProps = {
  creator: Creator;
};

export function CreatorHeader({ creator }: CreatorHeaderProps) {
  // Seed is the literal string "creator" — never the name. Matches
  // app/api/avatar/[seed]/route.ts's SEED_PATTERN (alphanumeric + hyphen
  // only, so a name with a space or accent would 400), and keeps the name
  // out of the URL/access log, per that route's own seed convention.
  const avatarSrc = creator.avatarUrl ?? "/api/avatar/creator";

  return (
    <header className="flex items-center gap-4">
      <Image
        src={avatarSrc}
        alt=""
        width={64}
        height={64}
        unoptimized
        className="h-16 w-16 shrink-0 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-2)] shadow-[0_0_0_1px_var(--color-border)]"
      />
      <div className="min-w-0">
        <h1 className="font-display text-xl font-medium text-[var(--color-text)]">
          {creator.name}
        </h1>
        {creator.tagline ? (
          <p className="text-sm text-[var(--color-text-muted)]">{creator.tagline}</p>
        ) : null}
        {creator.links.length > 0 ? (
          <nav className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {creator.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[var(--color-text-muted)] underline decoration-[var(--color-border)] decoration-2 underline-offset-2 transition-colors hover:text-[var(--color-accent-strong)] hover:decoration-[var(--color-accent)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
