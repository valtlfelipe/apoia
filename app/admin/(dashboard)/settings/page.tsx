import type { Metadata } from "next";
import {
  updateCreatorSettingsAction,
  updateSupportSettingsAction,
} from "@/app/admin/(dashboard)/actions";
import { CreatorSettingsForm } from "@/components/admin/creator-settings-form";
import { PageHeader } from "@/components/admin/page-header";
import { SupportSettingsForm } from "@/components/admin/support-settings-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getSupportSettings } from "@/lib/config/support";
import { getSettingsRow } from "@/lib/settings/repo";

export const metadata: Metadata = { title: "Configurações" };

export default function AdminSettingsPage() {
  // The raw row, not getCreator() — the Criador form needs to know what's
  // actually saved (to leave a field blank) versus what's just the code
  // default (shown as placeholder text instead).
  const row = getSettingsRow();
  // Unlike Criador, the support-form section always shows resolved values
  // (see lib/config/support.ts) — a checkbox or a number doesn't have a
  // natural "blank means default" state the way optional text does.
  const supportSettings = getSupportSettings();

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Sua identidade na página e como o formulário de apoio se comporta."
      />

      {/* Two independent forms, side by side on wide screens — `items-start`
          so the shorter card doesn't stretch to match the taller one. */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader title="Criador" description="O que aparece no topo da página pública." />
          <CardBody>
            <CreatorSettingsForm
              action={updateCreatorSettingsAction}
              defaultValues={{
                name: row?.creatorName ?? undefined,
                shortName: row?.creatorShortName ?? undefined,
                tagline: row?.creatorTagline ?? undefined,
                avatarUrl: row?.creatorAvatarUrl ?? undefined,
                links: row?.creatorLinks ?? [],
              }}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Formulário de apoio"
            description="Valores, privacidade padrão e o que a timeline mostra."
          />
          <CardBody>
            <SupportSettingsForm
              action={updateSupportSettingsAction}
              defaultValues={supportSettings}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
