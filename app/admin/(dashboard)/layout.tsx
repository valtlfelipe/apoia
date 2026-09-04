import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";

// The whole dashboard is per-request, gated by session — never statically
// generated or cached.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" title="Ver a página pública">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-base font-bold text-on-brand">
              a
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-tight text-ink">Apoia</span>
              <span className="block text-[11px] text-ink-muted">Admin</span>
            </span>
          </Link>

          <AdminNav />

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-ink-muted sm:block">{session.email}</span>
            <ThemeToggle />
            <form action="/admin/logout" method="POST">
              <Button type="submit" variant="ghost" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1080px] px-5 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
