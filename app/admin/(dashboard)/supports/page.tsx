import type { Metadata } from "next";
import Link from "next/link";
import { setSupportPublicAction } from "@/app/admin/(dashboard)/actions";
import { CopyButton } from "@/components/admin/copy-button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatCents, formatDateTime, truncateMiddle } from "@/lib/format";
import { type AdminSupport, getAdminSupportsPage } from "@/lib/supports/admin";

export const metadata: Metadata = { title: "Apoios" };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  expired: "Expirado",
};

// Status badges get their own tint instead of the default accent-green
// treatment — "pending"/"expired" reading as positive/confirmed at a glance
// would be misleading in a table meant for fast scanning.
const STATUS_BADGE_CLASSES: Record<string, string> = {
  paid: "",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  expired:
    "border-[var(--color-text-muted)]/20 bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]",
};

type SupportsPageProps = {
  searchParams: Promise<{ cursor?: string }>;
};

function AmountCell({ support }: { support: AdminSupport }) {
  return (
    <div className="space-y-1">
      <p className="font-medium text-[var(--color-text)] tabular-nums">
        {formatCents(support.paidAmountCents ?? support.amountCents)}
      </p>
      <Badge className={STATUS_BADGE_CLASSES[support.status]}>
        {STATUS_LABELS[support.status] ?? support.status}
      </Badge>
    </div>
  );
}

function SupporterCell({ support }: { support: AdminSupport }) {
  return (
    <div className="min-w-0 max-w-[260px] space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-[var(--color-text)]">
          {support.displayName?.trim() || (
            <span className="text-[var(--color-text-muted)] italic">sem nome</span>
          )}
        </span>
        {!support.isPublic ? (
          <span className="rounded-full bg-[var(--color-text-muted)]/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
            oculto
          </span>
        ) : null}
      </div>
      {support.message ? (
        <p
          title={support.message}
          className="truncate text-sm text-[var(--color-text-muted)] italic"
        >
          "{support.message}"
        </p>
      ) : null}
    </div>
  );
}

function WhenCell({ support }: { support: AdminSupport }) {
  const primary = formatDateTime(new Date(support.paidAt ?? support.createdAt));
  return (
    <div className="whitespace-nowrap">
      <p className="text-[var(--color-text)]">
        {primary.date} <span className="text-[var(--color-text-muted)]">{primary.time}</span>
      </p>
      {support.paidAt ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          criado {formatDateTime(new Date(support.createdAt)).date}
        </p>
      ) : null}
    </div>
  );
}

function EndToEndIdCell({ endToEndId }: { endToEndId: string | null }) {
  if (!endToEndId) {
    return <span className="text-[var(--color-text-muted)]">—</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <span title={endToEndId} className="font-mono text-xs text-[var(--color-text-muted)]">
        {truncateMiddle(endToEndId)}
      </span>
      <CopyButton value={endToEndId} label="Copiar E2E ID" />
    </div>
  );
}

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
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-left text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
                <th className="px-4 py-3 font-medium">Apoiador</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">E2E ID (Pix)</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {page.items.map((support) => (
                <tr
                  key={support.id}
                  className="transition-colors hover:bg-[var(--color-surface-2)]/50"
                >
                  <td className="px-4 py-3 align-top">
                    <SupporterCell support={support} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AmountCell support={support} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    {support.productSlug ? (
                      <Badge>{support.productSlug}</Badge>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <WhenCell support={support} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <EndToEndIdCell endToEndId={support.endToEndId} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <DropdownMenu label="Ações">
                      <form
                        action={setSupportPublicAction.bind(null, support.id, !support.isPublic)}
                      >
                        <DropdownMenuItem>
                          {support.isPublic ? "Ocultar da timeline" : "Reexibir na timeline"}
                        </DropdownMenuItem>
                      </form>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
