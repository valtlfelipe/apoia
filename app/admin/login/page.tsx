import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-medium">Admin · Apoia</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Entre com a conta Google autorizada para gerenciar produtos e apoios.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          Não foi possível entrar. Confirme que está usando a conta Google autorizada.
        </p>
      ) : null}

      <a
        href="/admin/login/start"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-accent-contrast)] shadow-[0_1px_0_var(--color-accent-strong)] transition-all duration-150 hover:bg-[var(--color-accent-hover)] active:translate-y-px"
      >
        Entrar com Google
      </a>
    </main>
  );
}
