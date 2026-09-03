import type { Metadata } from "next";
import Link from "next/link";
import { setSupportPublicAction } from "@/app/admin/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { getAdminSupportsPage } from "@/lib/supports/admin";

export const metadata: Metadata = { title: "Apoios" };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  expired: "Expirado",
};

type SupportsPageProps = {
  searchParams: Promise<{ cursor?: string }>;
};

export default async function AdminSupportsPage({ searchParams }: SupportsPageProps) {
  const { cursor } = await searchParams;
  const page = await getAdminSupportsPage({ cursor: cursor ?? null });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-medium">Apoios</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Nome e mensagem reais, mesmo de quem pediu para não aparecer na timeline pública. "Ocultar
          da timeline" é reversível — o dado continua salvo, só some da vitrine.
        </p>
      </div>

      {page.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          Nenhum apoio ainda.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {page.items.map((support) => (
            <li key={support.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--color-text)]">
                    {support.displayName?.trim() || (
                      <span className="text-[var(--color-text-muted)] italic">sem nome</span>
                    )}
                  </span>
                  <Badge>{formatCents(support.paidAmountCents ?? support.amountCents)}</Badge>
                  <Badge className={support.status !== "paid" ? "opacity-70" : undefined}>
                    {STATUS_LABELS[support.status] ?? support.status}
                  </Badge>
                  {support.productSlug ? <Badge>{support.productSlug}</Badge> : null}
                  {!support.isPublic ? (
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      oculto na timeline
                    </span>
                  ) : null}
                </div>
                {support.message ? (
                  <p className="text-sm text-[var(--color-text-muted)] italic">
                    "{support.message}"
                  </p>
                ) : null}
                <p className="text-xs text-[var(--color-text-muted)]">
                  {new Date(support.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <form action={setSupportPublicAction.bind(null, support.id, !support.isPublic)}>
                <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                  {support.isPublic ? "Ocultar da timeline" : "Reexibir na timeline"}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {page.nextCursor ? (
        <div className="text-center">
          <Link
            href={`/admin/supports?cursor=${encodeURIComponent(page.nextCursor)}`}
            className="text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Carregar mais
          </Link>
        </div>
      ) : null}
    </section>
  );
}
