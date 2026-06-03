"use client";

import { useEffect, useState } from "react";

export interface Section {
  id: string;
  label: string;
}

interface Props {
  readonly children: React.ReactNode;
  readonly sections: Section[];
}

function TableOfContents({ sections }: { readonly sections: Section[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-20% 0px -70% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  return (
    <aside className="w-44 shrink-0">
      <nav className="sticky top-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Nesta página
        </p>
        <ul className="space-y-1.5">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`block text-xs transition-colors hover:text-foreground ${
                  active === s.id
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export function AnalysisSection({
  id,
  children,
}: {
  readonly id: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-lg border border-border bg-card p-6"
    >
      {children}
    </section>
  );
}

export function AnalysisPageLayout({ children, sections }: Props) {
  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1">{children}</div>
      {sections.length > 0 && <TableOfContents sections={sections} />}
    </div>
  );
}
