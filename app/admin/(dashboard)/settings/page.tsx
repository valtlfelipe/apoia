import type { Metadata } from "next";
import { updateCreatorSettingsAction } from "@/app/admin/(dashboard)/actions";
import { CreatorSettingsForm } from "@/components/admin/creator-settings-form";
import { getSettingsRow } from "@/lib/settings/repo";

export const metadata: Metadata = { title: "Configurações" };

export default function AdminSettingsPage() {
  // The raw row, not getCreator() — the form needs to know what's actually
  // saved (to leave a field blank) versus what's just the code default
  // (shown as placeholder text instead).
  const row = getSettingsRow();

  return (
    <section className="max-w-lg space-y-6">
      <h2 className="font-display text-lg font-medium">Configurações</h2>
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
  );
}
