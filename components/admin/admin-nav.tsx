"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin/supports", label: "Apoios" },
  { href: "/admin/products", label: "Produtos" },
  { href: "/admin/settings", label: "Configurações" },
  { href: "/admin/about", label: "Sobre" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      {LINKS.map((link) => {
        // Prefix match so /admin/products/new keeps "Produtos" lit.
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium transition-colors",
              active ? "bg-subtle text-ink" : "text-ink-muted hover:bg-subtle hover:text-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
