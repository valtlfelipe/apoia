import type { Metadata } from "next";
import { recheckUpdatesAction } from "@/app/admin/(dashboard)/actions";
import { RecheckUpdatesButton } from "@/components/admin/recheck-updates-button";
import { Badge } from "@/components/ui/badge";
import { checkForUpdates, getInstalledVersion, PROJECT, type UpdateCheck } from "@/lib/project";

export const metadata: Metadata = { title: "Sobre" };

const checkedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const STATUS_COPY: Record<UpdateCheck["status"], { hint: string }> = {
  available: {
    hint: "Puxe a imagem nova e reinicie o container quando puder — veja “Atualizar” no README.",
  },
  current: { hint: "Nenhuma atualização disponível no momento." },
  development: {
    hint: "Builds de desenvolvimento não são comparadas com releases publicadas.",
  },
  unavailable: {
    hint: "Ainda não há nenhuma release publicada, ou não foi possível checar agora — confira a conexão desta instância com a internet.",
  },
};

export default async function AdminAboutPage() {
  const installedVersion = getInstalledVersion();
  const update = await checkForUpdates();

  return (
    <div className="max-w-lg space-y-12">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-medium">Sobre</h2>
          <Badge>{installedVersion === "dev" ? "dev" : `v${installedVersion}`}</Badge>
        </div>

        <p className="text-sm text-[var(--color-text-muted)]">
          Apoia é software livre, self-hosted, mantido por{" "}
          <a
            href={PROJECT.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text)] underline decoration-[var(--color-border)] underline-offset-4 hover:decoration-[var(--color-text)]"
          >
            {PROJECT.author}
          </a>
          .
        </p>

        <div className="rounded-2xl bg-[var(--color-surface-2)] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <UpdateStatusIcon status={update.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {update.status === "available" &&
                  `Nova versão disponível: v${update.latestVersion}`}
                {update.status === "current" && "Você está na versão mais recente."}
                {update.status === "development" && "Rodando uma build de desenvolvimento."}
                {update.status === "unavailable" && "Não foi possível checar atualizações."}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {STATUS_COPY[update.status].hint}
              </p>
              {update.status !== "unavailable" ? (
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Checado em {checkedAtFormatter.format(new Date(update.checkedAt))}.
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {update.status === "available" && update.releaseUrl ? (
              <a href={update.releaseUrl} target="_blank" rel="noopener noreferrer">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-[var(--color-accent-contrast)] shadow-[0_1px_0_var(--color-accent-strong)] transition-all duration-150 hover:bg-[var(--color-accent-hover)] active:translate-y-px">
                  Ver release
                  <ExternalLinkIcon />
                </span>
              </a>
            ) : null}
            <form action={recheckUpdatesAction}>
              <RecheckUpdatesButton />
            </form>
          </div>
        </div>

        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--color-text-muted)]">Autor</dt>
            <dd className="mt-1 text-sm font-medium">{PROJECT.author}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-text-muted)]">Licença</dt>
            <dd className="mt-1 text-sm font-medium">
              <a
                href={`${PROJECT.repository}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline decoration-[var(--color-border)] underline-offset-4 hover:decoration-[var(--color-text)]"
              >
                {PROJECT.license}
                <ExternalLinkIcon />
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 border-t border-[var(--color-border)] pt-8">
        <h3 className="text-sm font-medium">Apoie o projeto</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Se o apoia te ajuda a receber apoio no seu próprio projeto, considere apoiar de volta.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={PROJECT.sponsors} target="_blank" rel="noopener noreferrer">
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-accent-contrast)] shadow-[0_1px_0_var(--color-accent-strong)] transition-all duration-150 hover:bg-[var(--color-accent-hover)] active:translate-y-px">
              <HeartIcon />
              Apoiar no GitHub Sponsors
            </span>
          </a>
          <a href={PROJECT.repository} target="_blank" rel="noopener noreferrer">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]">
              <CodeIcon />
              Ver repositório
            </span>
          </a>
        </div>
      </section>

      <section className="space-y-4 border-t border-[var(--color-border)] pt-8">
        <h3 className="text-sm font-medium">Feedback</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Encontrou um problema ou tem uma ideia? Abra uma issue no repositório.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            href={`${PROJECT.repository}/issues/new?template=bug_report.yml`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]">
              <BugIcon />
              Reportar bug
            </span>
          </a>
          <a
            href={`${PROJECT.repository}/issues/new?template=feature_request.yml`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]">
              <LightbulbIcon />
              Sugerir funcionalidade
            </span>
          </a>
        </div>
      </section>
    </div>
  );
}

function UpdateStatusIcon({ status }: { status: UpdateCheck["status"] }) {
  if (status === "available") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    );
  }

  if (status === "current") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2.5 2.5 4.5-5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-muted)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7" />
      <path strokeLinecap="round" d="M12 17h.01" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M8 7h9v9" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7.5-4.6-9.8-9.1C.6 8 2.2 4.5 5.6 4c2-.3 3.9.7 6.4 3 2.5-2.3 4.4-3.3 6.4-3 3.4.5 5 4 3.4 7.4-2.3 4.5-9.8 9.1-9.8 9.1Z"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
    </svg>
  );
}

function BugIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <rect x="7" y="8" width="10" height="10" rx="5" />
      <path
        strokeLinecap="round"
        d="M9 8V6a3 3 0 0 1 6 0v2M3.5 11h3.5M17 11h3.5M4 16.5l3-1.2M20 16.5l-3-1.2M9 21l1-3M15 21l-1-3M12 8V5"
      />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.1 1 1.9v.2h5v-.2c0-.8.4-1.4 1-1.9A6 6 0 0 0 12 3Z"
      />
    </svg>
  );
}
