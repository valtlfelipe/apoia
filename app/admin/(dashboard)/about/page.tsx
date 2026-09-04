import type { Metadata } from "next";
import type { ReactNode } from "react";
import { recheckUpdatesAction } from "@/app/admin/(dashboard)/actions";
import { PageHeader } from "@/components/admin/page-header";
import { RecheckUpdatesButton } from "@/components/admin/recheck-updates-button";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { checkForUpdates, getInstalledVersion, PROJECT, type UpdateCheck } from "@/lib/project";

export const metadata: Metadata = { title: "Sobre" };

const checkedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const STATUS_COPY: Record<UpdateCheck["status"], { title: string; hint: string }> = {
  available: {
    title: "Nova versão disponível",
    hint: "Puxe a imagem nova e reinicie o container quando puder — veja “Atualizar” no README.",
  },
  current: {
    title: "Você está na versão mais recente.",
    hint: "Nenhuma atualização disponível no momento.",
  },
  development: {
    title: "Rodando uma build de desenvolvimento.",
    hint: "Builds de desenvolvimento não são comparadas com releases publicadas.",
  },
  unavailable: {
    title: "Não foi possível checar atualizações.",
    hint: "Ainda não há nenhuma release publicada, ou não foi possível checar agora — confira a conexão desta instância com a internet.",
  },
};

function ActionLink({
  href,
  variant = "secondary",
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses(variant, "md")}
    >
      {children}
    </a>
  );
}

export default async function AdminAboutPage() {
  const installedVersion = getInstalledVersion();
  const update = await checkForUpdates();
  const copy = STATUS_COPY[update.status];

  return (
    <div className="max-w-xl">
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            Sobre
            <Badge>{installedVersion === "dev" ? "dev" : `v${installedVersion}`}</Badge>
          </span>
        }
        description="Receba apoio via Pix — o seu próprio “Buy Me a Coffee”, self-hosted."
      />

      <div className="space-y-5">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <UpdateStatusIcon status={update.status} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {update.status === "available"
                    ? `${copy.title}: v${update.latestVersion}`
                    : copy.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{copy.hint}</p>
                {update.status !== "unavailable" ? (
                  <p className="mt-2 text-xs text-ink-muted">
                    Checado em {checkedAtFormatter.format(new Date(update.checkedAt))}.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {update.status === "available" && update.releaseUrl ? (
                <ActionLink href={update.releaseUrl} variant="primary">
                  Ver release
                  <ExternalLinkIcon />
                </ActionLink>
              ) : null}
              <form action={recheckUpdatesAction}>
                <RecheckUpdatesButton />
              </form>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Apoie o projeto"
            description="Se o apoia te ajuda a receber apoio no seu próprio projeto, considere apoiar de volta."
          />
          <CardBody className="flex flex-wrap gap-2">
            <ActionLink href={PROJECT.sponsors} variant="primary">
              <HeartIcon />
              Apoiar no GitHub Sponsors
            </ActionLink>
            <ActionLink href={PROJECT.repository}>
              <CodeIcon />
              Ver repositório
            </ActionLink>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Feedback"
            description="Encontrou um problema ou tem uma ideia? Abra uma issue no repositório."
          />
          <CardBody className="flex flex-wrap gap-2">
            <ActionLink href={`${PROJECT.repository}/issues/new?template=bug_report.yml`}>
              <BugIcon />
              Reportar bug
            </ActionLink>
            <ActionLink href={`${PROJECT.repository}/issues/new?template=feature_request.yml`}>
              <LightbulbIcon />
              Sugerir funcionalidade
            </ActionLink>
          </CardBody>
        </Card>

        <dl className="grid gap-5 px-1 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-muted">Autor</dt>
            <dd className="mt-1 text-sm font-medium">
              <a
                href={PROJECT.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-ink"
              >
                {PROJECT.author}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Licença</dt>
            <dd className="mt-1 text-sm font-medium">
              <a
                href={`${PROJECT.repository}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-brand-ink"
              >
                {PROJECT.license}
                <ExternalLinkIcon />
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function UpdateStatusIcon({ status }: { status: UpdateCheck["status"] }) {
  if (status === "available") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 size-5 shrink-0 text-brand"
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
        className="mt-0.5 size-5 shrink-0 text-brand"
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
      className="mt-0.5 size-5 shrink-0 text-ink-muted"
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
      className="size-3.5"
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
      className="size-4"
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
      className="size-4"
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
      className="size-4"
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
      className="size-4"
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
