"use client";

import { DrawingFilters } from "@/lib/api";

interface Props {
  filters: DrawingFilters;
  onChange: (f: DrawingFilters) => void;
  onClear: () => void;
  showWinners: boolean;
  onToggleWinners: () => void;
  abbreviate: boolean;
  onToggleAbbreviate: () => void;
}

function Toggle({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
      <div
        onClick={onToggle}
        className={`relative h-5 w-9 rounded-full transition-colors ${active ? "bg-emerald-700" : "bg-muted-foreground/30"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </div>
      {label}
    </label>
  );
}

export function FilterBar({ filters, onChange, onClear, showWinners, onToggleWinners, abbreviate, onToggleAbbreviate }: Props) {
  const hasFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.drawingFrom != null ||
    filters.drawingTo != null ||
    filters.rollOver != null;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Concurso</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="De"
            value={filters.drawingFrom ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                drawingFrom: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            placeholder="Até"
            value={filters.drawingTo ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                drawingTo: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Data</label>
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
            className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Acumulado</label>
        <select
          value={filters.rollOver == null ? "" : String(filters.rollOver)}
          onChange={(e) =>
            onChange({
              ...filters,
              rollOver: e.target.value === "" ? undefined : e.target.value === "true",
            })
          }
          className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Todos</option>
          <option value="true">Sim</option>
          <option value="false">Não</option>
        </select>
      </div>

      <div className="ml-auto flex items-center gap-4 self-end">
        <Toggle active={abbreviate} onToggle={onToggleAbbreviate} label="Abreviar" />
        <Toggle active={showWinners} onToggle={onToggleWinners} label="Ganhadores" />

        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
