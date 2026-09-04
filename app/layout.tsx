import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { appConfig } from "@/lib/config/config";
import { getCreator } from "@/lib/config/creator";
import { homeDescription, homeTitle } from "@/lib/seo";
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
  const title = homeTitle(creator);
  const description = homeDescription(creator);

  return {
    metadataBase: new URL(appConfig.siteUrl),
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description,
    // /admin opts out of this in app/admin/layout.tsx.
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: {
      title,
      description,
      siteName: creator.name,
      type: "website",
      locale: "pt_BR",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
