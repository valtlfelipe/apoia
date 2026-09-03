import Link from "next/link";
import { appConfig } from "@/lib/config/config";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-semibold text-[var(--color-accent)]">404</p>
      <h1 className="font-display text-2xl font-medium text-[var(--color-text)]">
        Essa página não existe
      </h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        Mas apoiar {appConfig.creator.name} existe, e é rapidinho.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-accent-contrast)] transition-colors hover:bg-[var(--color-accent-hover)]"
      >
        Ir para a página inicial
      </Link>
    </main>
  );
}
