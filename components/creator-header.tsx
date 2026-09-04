import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <header className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <Image
          src={avatarSrc}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="size-14 shrink-0 rounded-full bg-subtle ring-1 ring-line"
        />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-ink">{creator.name}</h1>
          {creator.tagline ? <p className="text-sm text-ink-muted">{creator.tagline}</p> : null}
          {creator.links.length > 0 ? (
            <nav className="mt-2 flex flex-wrap gap-1.5">
              {creator.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-subtle px-2 py-1 text-xs font-semibold text-ink-muted transition-colors hover:bg-brand-soft hover:text-brand-ink"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
