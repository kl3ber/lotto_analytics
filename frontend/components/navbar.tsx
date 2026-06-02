"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Concursos", href: "/" },
  { label: "Análises", href: "/analises" },
  { label: "Meu jogo", href: "/jogo", soon: true },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-background px-4 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center gap-1 py-3">
        <span className="mr-6 text-sm font-bold tracking-tight">Lotto Analytics</span>
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.soon ? "#" : link.href}
              className={`rounded px-3 py-1.5 text-sm transition-colors ${
                link.soon
                  ? "cursor-default text-muted-foreground/40"
                  : active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {link.label}
              {link.soon && (
                <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground/50">
                  em breve
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
