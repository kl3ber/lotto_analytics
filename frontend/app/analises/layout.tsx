"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    group: "Números",
    items: [
      { label: "Frequência", href: "/analises/frequencia" },
      { label: "Paridade", href: "/analises/paridade", soon: true },
      { label: "Dezenas", href: "/analises/dezenas", soon: true },
      { label: "Soma", href: "/analises/soma", soon: true },
    ],
  },
  {
    group: "Prêmios",
    items: [
      { label: "Histórico do jackpot", href: "/analises/premios" },
      { label: "Duração dos acúmulos", href: "/analises/acumulos", soon: true },
    ],
  },
  {
    group: "Padrões",
    items: [
      { label: "Consecutivos", href: "/analises/consecutivos", soon: true },
      { label: "Repetições", href: "/analises/repeticoes", soon: true },
    ],
  },
];

export default function AnalisesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/20 px-3 py-6">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Análises
        </p>
        {NAV.map((section) => (
          <div key={section.group} className="mb-5">
            <p className="mb-1 px-2 text-xs text-muted-foreground">{section.group}</p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.soon ? "#" : item.href}
                className={`flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors ${
                  item.soon
                    ? "cursor-default text-muted-foreground/50"
                    : pathname === item.href
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {item.label}
                {item.soon && (
                  <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground/60">
                    em breve
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </aside>

      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
