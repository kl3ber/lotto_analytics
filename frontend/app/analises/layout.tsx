"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem { label: string; href: string; soon?: boolean }
interface NavGroup { group: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    group: "Análises",
    items: [
      { label: "Frequência", href: "/analises/frequencia" },
      { label: "Padrões", href: "/analises/padroes" },
      { label: "Prêmios", href: "/analises/premios" },
    ],
  },
  {
    group: "Estatísticas",
    items: [
      { label: "Aleatoriedade", href: "/analises/aleatoriedade", soon: true },
      { label: "Entropia", href: "/analises/entropia", soon: true },
      { label: "Memória", href: "/analises/memoria", soon: true },
    ],
  },
  {
    group: "Machine Learning",
    items: [
      { label: "Clusters", href: "/analises/clusters", soon: true },
      { label: "Anomalias", href: "/analises/anomalias", soon: true },
      { label: "Séries Temporais", href: "/analises/series", soon: true },
    ],
  },
  {
    group: "Prêmios & Acúmulos",
    items: [
      { label: "Ciclos de acúmulo", href: "/analises/acumulos", soon: true },
    ],
  },
];

export default function AnalisesLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/20 px-3 py-6 sticky top-0 self-start h-screen overflow-y-auto">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Análises
        </p>
        {NAV.map((section) => (
          <div key={section.group} className="mb-5">
            <p className="mb-1 px-2 text-xs text-muted-foreground">{section.group}</p>
            {section.items.map((item) => {
              let linkClass = "text-muted-foreground hover:bg-muted/50 hover:text-foreground";
              if (item.soon) linkClass = "cursor-default text-muted-foreground/50";
              else if (pathname === item.href) linkClass = "bg-muted font-medium text-foreground";
              return (
              <Link
                key={item.href}
                href={item.soon ? "#" : item.href}
                className={`flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors ${linkClass}`}
              >
                {item.label}
                {item.soon && (
                  <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground/60">
                    em breve
                  </span>
                )}
              </Link>
              );
            })}
          </div>
        ))}
      </aside>

      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
