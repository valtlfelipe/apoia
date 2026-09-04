import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { appConfig } from "@/lib/config/config";
import { getCreator } from "@/lib/config/creator";
import "./globals.css";

// One family, nothing else — no display serif, no mono for numbers. Jakarta
// carries headings at 700 and body at 400/500 on its own, which is the whole
// point: fewer moving parts than the two-font setup it replaced.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

// A function, not a module-level const: creator identity now lives in the
// database (editable at /admin/settings), and a const here would freeze it
// at build/boot time — before anyone had a chance to configure it. Sync is
// fine (and documented) — getCreator() doesn't await anything.
export function generateMetadata(): Metadata {
  const creator = getCreator();
  return {
    metadataBase: new URL(appConfig.siteUrl),
    title: {
      default: `Apoie ${creator.name}`,
      template: `%s · Apoie ${creator.name}`,
    },
    description:
      creator.tagline ??
      `Apoie ${creator.name} com Pix e ajude a manter projetos open source no ar.`,
    openGraph: {
      title: `Apoie ${creator.name}`,
      description: creator.tagline ?? `Apoie ${creator.name} com Pix.`,
      type: "website",
      locale: "pt_BR",
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
