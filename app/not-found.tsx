import Link from "next/link";
import { getCreator } from "@/lib/config/creator";

// Reads creator identity from the database now — without this, Next may
// statically prerender this page at build time and bake in whatever the
// name was then, never picking up a later /admin/settings edit.
export const dynamic = "force-dynamic";

export default function NotFound() {
  const creator = getCreator();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-semibold text-brand-ink">404</p>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Essa página não existe</h1>
      <p className="text-sm text-ink-muted">Mas apoiar {creator.name} existe, e é rapidinho.</p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover"
      >
        Ir para a página inicial
      </Link>
    </main>
  );
}
