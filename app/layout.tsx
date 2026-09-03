import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { appConfig } from "@/lib/config/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: {
    default: `Apoie ${appConfig.creator.name}`,
    template: `%s · Apoie ${appConfig.creator.name}`,
  },
  description:
    appConfig.creator.tagline ??
    `Apoie ${appConfig.creator.name} com Pix e ajude a manter projetos open source no ar.`,
  openGraph: {
    title: `Apoie ${appConfig.creator.name}`,
    description: appConfig.creator.tagline ?? `Apoie ${appConfig.creator.name} com Pix.`,
    type: "website",
    locale: "pt_BR",
  },
};

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
