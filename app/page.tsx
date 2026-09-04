import type { Metadata } from "next";
import { CreatorHeader } from "@/components/creator-header";
import { Headline } from "@/components/headline";
import { SiteFooter } from "@/components/site-footer";
import { SupportForm } from "@/components/support-form";
import { Timeline } from "@/components/timeline";
import { getCreator } from "@/lib/config/creator";
import { getSupportSettings } from "@/lib/config/support";
import { homeDescription, homeTitle, pageMetadata } from "@/lib/seo";

// The timeline shows live data (new supporters appear as payments confirm),
// so this page is rendered per-request rather than statically generated —
// which also means it never touches the database at build time.
export const dynamic = "force-dynamic";

// The root layout already derives the same title/description from the creator
// row; this repeats them so the canonical URL and the page-level og:url land
// on the home page specifically.
export function generateMetadata(): Metadata {
  const creator = getCreator();
  return pageMetadata({
    title: homeTitle(creator),
    description: homeDescription(creator),
    path: "/",
    siteName: creator.name,
  });
}

export default function HomePage() {
  const creator = getCreator();
  const supportSettings = getSupportSettings();

  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-col gap-10 px-5 py-10 sm:px-6 sm:py-14">
      <CreatorHeader creator={creator} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="space-y-5 lg:sticky lg:top-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-balance">
              <Headline text={`Apoie ${creator.shortName}`} highlight={creator.shortName} />
            </h2>
            <p className="text-[15px] leading-relaxed text-ink-muted">
              Contribua com qualquer valor, direto no Pix, sem cadastro. Agradeço desde já.
            </p>
          </div>
          <SupportForm
            presets={supportSettings.amountPresets}
            minCents={supportSettings.minAmountCents}
            maxCents={supportSettings.maxAmountCents}
            defaultPublic={supportSettings.defaultPublic}
            thankYouMessage={supportSettings.thankYouMessage}
          />
        </div>

        <Timeline />
      </div>

      <SiteFooter />
    </main>
  );
}
