"use client";

interface Props {
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly onDateFromChange: (v: string) => void;
  readonly onDateToChange: (v: string) => void;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function subMonths(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return isoDate(d);
}

const PRESETS = [
  { label: "Ano atual", from: () => `${new Date().getFullYear()}-01-01`, to: () => isoDate(new Date()) },
  { label: "12 m", from: () => subMonths(12), to: () => isoDate(new Date()) },
  { label: "24 m", from: () => subMonths(24), to: () => isoDate(new Date()) },
  { label: "36 m", from: () => subMonths(36), to: () => isoDate(new Date()) },
  { label: "48 m", from: () => subMonths(48), to: () => isoDate(new Date()) },
];

export function DateFilter({ dateFrom, dateTo, onDateFromChange, onDateToChange }: Props) {
  const hasFilter = dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="date-from" className="text-xs text-muted-foreground">De</label>
        <input
          id="date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="date-to" className="text-xs text-muted-foreground">Até</label>
        <input
          id="date-to"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1 self-end pb-0.5">
        {PRESETS.map((p) => {
          const isActive = dateFrom === p.from() && dateTo === p.to();
          return (
            <button
              key={p.label}
              onClick={() => { onDateFromChange(p.from()); onDateToChange(p.to()); }}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                isActive
                  ? "bg-emerald-700 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        {hasFilter && (
          <button
            onClick={() => { onDateFromChange(""); onDateToChange(""); }}
            className="text-xs text-muted-foreground underline hover:text-foreground ml-1"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
