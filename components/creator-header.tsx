import Image from "next/image";
import type { AppConfig } from "@/lib/config/config";

type CreatorHeaderProps = {
  creator: AppConfig["creator"];
};

export function CreatorHeader({ creator }: CreatorHeaderProps) {
  const avatarSrc = creator.avatarUrl ?? `/api/avatar/creator-${encodeURIComponent(creator.name)}`;

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
