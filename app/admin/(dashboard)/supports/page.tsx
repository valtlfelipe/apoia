import type { Metadata } from "next";
import Link from "next/link";
import { setSupportPublicAction } from "@/app/admin/(dashboard)/actions";
import { CopyButton } from "@/components/admin/copy-button";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatCents, formatDateTime, truncateMiddle } from "@/lib/format";
import { type AdminSupport, getAdminSupportsPage } from "@/lib/supports/admin";

export const metadata: Metadata = { title: "Apoios" };

// Status gets its own tone rather than the default brand treatment —
// "pending"/"expired" reading as confirmed at a glance would be misleading in
// a table meant for fast scanning.
const STATUS: Record<string, { label: string; tone: "brand" | "warn" | "neutral" }> = {
  paid: { label: "Pago", tone: "brand" },
  pending: { label: "Pendente", tone: "warn" },
  expired: { label: "Expirado", tone: "neutral" },
};

type SupportsPageProps = {
  searchParams: Promise<{ cursor?: string }>;
};

function StatusCell({ status }: { status: AdminSupport["status"] }) {
  const meta = STATUS[status];
  return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? status}</Badge>;
}

function SupporterCell({ support }: { support: AdminSupport }) {
  return (
    <div className="min-w-0 max-w-[260px] space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-ink">
          {support.displayName?.trim() || <span className="text-ink-muted italic">sem nome</span>}
        </span>
        {!support.isPublic ? <Badge tone="neutral">oculto</Badge> : null}
      </div>
      {support.message ? (
        <p title={support.message} className="truncate text-sm text-ink-muted">
          “{support.message}”
        </p>
      ) : null}
    </div>
  );
}

function WhenCell({ support }: { support: AdminSupport }) {
  const when = formatDateTime(new Date(support.paidAt ?? support.createdAt));
  return (
    <p className="whitespace-nowrap text-ink tabular-nums">
      {when.date} <span className="text-ink-muted">{when.time}</span>
    </p>
  );
}

function EndToEndIdCell({ endToEndId }: { endToEndId: string | null }) {
  if (!endToEndId) {
    return <span className="text-ink-muted">—</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <span title={endToEndId} className="font-mono text-xs text-ink-muted">
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
    <>
      <PageHeader
        title="Apoios"
        description="Nome e mensagem reais, mesmo de quem pediu para não aparecer na timeline. Ocultar é reversível — o dado continua salvo, só some da vitrine."
      />

      {page.items.length === 0 ? (
        <Card>
          <p className="p-10 text-center text-sm text-ink-muted">Nenhum apoio ainda.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line bg-subtle text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  <th className="px-5 py-3 font-semibold">Apoiador</th>
                  <th className="px-5 py-3 font-semibold">Valor</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Produto</th>
                  <th className="px-5 py-3 font-semibold">Quando</th>
                  <th className="px-5 py-3 font-semibold">E2E ID (Pix)</th>
                  <th className="px-5 py-3 font-semibold">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {page.items.map((support) => (
                  <tr key={support.id} className="transition-colors hover:bg-subtle/60">
                    <td className="px-5 py-3.5 align-top">
                      <SupporterCell support={support} />
                    </td>
                    <td className="px-5 py-3.5 align-top font-semibold text-ink tabular-nums">
                      {formatCents(support.paidAmountCents ?? support.amountCents)}
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <StatusCell status={support.status} />
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      {support.productSlug ? (
                        <Badge>{support.productSlug}</Badge>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <WhenCell support={support} />
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <EndToEndIdCell endToEndId={support.endToEndId} />
                    </td>
                    <td className="px-5 py-3.5 align-top">
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
        </Card>
      )}

      {page.nextCursor ? (
        <div className="mt-4 text-center">
          <Link
            href={`/admin/supports?cursor=${encodeURIComponent(page.nextCursor)}`}
            className="text-sm font-semibold text-brand-ink hover:underline"
          >
            Carregar mais
          </Link>
        </div>
      ) : null}
    </>
  );
}
