import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";

// The whole dashboard is per-request, gated by session — never statically
// generated or cached.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="mx-auto flex min-h-screen max-w-[900px] flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
            Admin
          </p>
          <h1 className="font-display text-xl font-medium">Apoia</h1>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/admin/products"
            className="rounded-full px-3.5 py-2 font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            Produtos
          </Link>
          <Link
            href="/admin/supports"
            className="rounded-full px-3.5 py-2 font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            Apoios
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-full px-3.5 py-2 font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            Configurações
          </Link>
          <Link
            href="/admin/about"
            className="rounded-full px-3.5 py-2 font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            Sobre
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)]">{session.email}</span>
          <form action="/admin/logout" method="POST">
            <Button type="submit" variant="ghost" className="px-3 py-1.5 text-xs">
              Sair
            </Button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
