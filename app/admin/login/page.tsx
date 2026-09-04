import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/cn";

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
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12" />
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-ink">Apoia · Admin</h1>
            <p className="text-sm leading-relaxed text-ink-muted">
              Entre com a conta Google autorizada para gerenciar produtos e apoios.
            </p>
          </div>
        </div>

        <Card>
          <CardBody className="space-y-4">
            {error ? (
              <p
                role="alert"
                className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger-ink"
              >
                Não foi possível entrar. Confirme que está usando a conta Google autorizada.
              </p>
            ) : null}

            <a href="/admin/login/start" className={cn(buttonClasses("primary", "lg"), "w-full")}>
              Entrar com Google
            </a>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
