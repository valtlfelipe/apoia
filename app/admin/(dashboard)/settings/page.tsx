import type { Metadata } from "next";
import {
  updateCreatorSettingsAction,
  updateSupportSettingsAction,
} from "@/app/admin/(dashboard)/actions";
import { CreatorSettingsForm } from "@/components/admin/creator-settings-form";
import { SupportSettingsForm } from "@/components/admin/support-settings-form";
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
    <div className="max-w-lg space-y-12">
      <section className="space-y-6">
        <h2 className="font-display text-lg font-medium">Criador</h2>
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
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-lg font-medium">Formulário de apoio</h2>
        <SupportSettingsForm action={updateSupportSettingsAction} defaultValues={supportSettings} />
      </section>
    </div>
  );
}
