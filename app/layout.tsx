import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { appConfig } from "@/lib/config/config";
import { getCreator } from "@/lib/config/creator";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-display",
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
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="fixed top-4 right-4 z-20 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
