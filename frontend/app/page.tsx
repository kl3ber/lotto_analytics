"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DrawingsTable } from "@/components/drawings-table";
import { DrawingDrawer } from "@/components/drawing-drawer";
import { FilterBar } from "@/components/filter-bar";
import { DrawingFilters, DrawingSummary, DrawingsPage, SortField, fetchDrawings } from "@/lib/api";

const PAGE_SIZE = 50;
const EMPTY_FILTERS: DrawingFilters = {};

export default function Home() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortField>("draw_date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<DrawingFilters>(EMPTY_FILTERS);
  const [data, setData] = useState<DrawingsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DrawingSummary | null>(null);
  const [showWinners, setShowWinners] = useState(true);
  const [abbreviate, setAbbreviate] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchDrawings(page, PAGE_SIZE, sort, order, filters)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load draws"))
      .finally(() => setLoading(false));
  }, [page, sort, order, filters]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sort) {
        setOrder((o) => (o === "desc" ? "asc" : "desc"));
      } else {
        setSort(field);
        setOrder("desc");
      }
      setPage(1);
    },
    [sort]
  );

  const handleFiltersChange = useCallback((f: DrawingFilters) => {
    setFilters(f);
    setPage(1);
  }, []);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Mega-Sena</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString("pt-BR")} concursos` : "Carregando..."}
          </p>
        </div>

        <FilterBar
          filters={filters}
          onChange={handleFiltersChange}
          onClear={() => handleFiltersChange(EMPTY_FILTERS)}
          showWinners={showWinners}
          onToggleWinners={() => setShowWinners((v) => !v)}
          abbreviate={abbreviate}
          onToggleAbbreviate={() => setAbbreviate((v) => !v)}
        />

        {error && (
          <div className="mb-4 rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error} — a API está rodando na porta 8000?
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Carregando...
          </div>
        ) : data ? (
          <>
            <DrawingsTable
              data={data.results}
              sort={sort}
              order={order}
              onSort={handleSort}
              onRowClick={setSelected}
              showWinners={showWinners}
              abbreviate={abbreviate}
            />

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded border border-border px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded border border-border px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-40"
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <DrawingDrawer drawing={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
