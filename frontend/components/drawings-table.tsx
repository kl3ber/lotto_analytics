"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DrawingSummary, SortField } from "@/lib/api";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function formatValue(value: number, abbreviate: boolean): string {
  if (!abbreviate) return BRL.format(value);
  if (value >= 1_000_000) return `R$ ${NUM.format(value / 1_000_000)} M`;
  if (value >= 1_000) return `R$ ${NUM.format(value / 1_000)} mil`;
  return BRL.format(value);
}

function PrizeCell({ prize, winners, highlight = false, showWinners, abbreviate }: { prize: number; winners: number; highlight?: boolean; showWinners: boolean; abbreviate: boolean }) {
  if (prize === 0 && winners === 0)
    return <span className="text-muted-foreground text-sm">—</span>;
  const displayed = showWinners ? prize : prize * winners;
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-sm ${highlight ? "text-emerald-400" : "text-foreground"}`}>
        {formatValue(displayed, abbreviate)}
      </span>
      {showWinners && winners > 0 && (
        <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white ${highlight ? "bg-emerald-700" : "bg-muted-foreground/50"}`}>
          {winners}
        </span>
      )}
    </div>
  );
}

function Numbers({ row }: { row: DrawingSummary }) {
  return (
    <div className="flex gap-1">
      {[row.n1, row.n2, row.n3, row.n4, row.n5, row.n6].map((n) => (
        <span
          key={n}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white"
        >
          {n}
        </span>
      ))}
    </div>
  );
}

interface Props {
  data: DrawingSummary[];
  sort: SortField;
  order: "asc" | "desc";
  onSort: (field: SortField) => void;
  onRowClick: (drawing: DrawingSummary) => void;
  showWinners: boolean;
  abbreviate: boolean;
}

function SortIcon({ field, sort, order }: { field: SortField; sort: SortField; order: "asc" | "desc" }) {
  if (field !== sort) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return order === "desc"
    ? <ChevronDown className="ml-1 inline h-3 w-3" />
    : <ChevronUp className="ml-1 inline h-3 w-3" />;
}

export function DrawingsTable({ data, sort, order, onSort, onRowClick, showWinners, abbreviate }: Props) {
  const columns: ColumnDef<DrawingSummary>[] = [
    {
      accessorKey: "drawing_number",
      header: () => (
        <button onClick={() => onSort("drawing_number")} className="flex items-center">
          Concurso <SortIcon field="drawing_number" sort={sort} order={order} />
        </button>
      ),
      cell: ({ getValue }) => <span className="font-mono text-sm">{getValue<number>()}</span>,
    },
    {
      accessorKey: "draw_date",
      header: () => (
        <button onClick={() => onSort("draw_date")} className="flex items-center">
          Data <SortIcon field="draw_date" sort={sort} order={order} />
        </button>
      ),
      cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
    },
    {
      id: "numbers",
      header: "Números",
      cell: ({ row }) => <Numbers row={row.original} />,
    },
    {
      accessorKey: "roll_over",
      header: "Acumulado",
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="secondary">Sim</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      id: "prize_6",
      header: () => (
        <button onClick={() => onSort("prize_6")} className="flex items-center">
          6 acertos <SortIcon field="prize_6" sort={sort} order={order} />
        </button>
      ),
      cell: ({ row }) => (
        <PrizeCell prize={row.original.prize_6} winners={row.original.winners_6} highlight showWinners={showWinners} abbreviate={abbreviate} />
      ),
    },
    {
      id: "prize_5",
      header: "5 acertos",
      cell: ({ row }) => (
        <PrizeCell prize={row.original.prize_5} winners={row.original.winners_5} showWinners={showWinners} abbreviate={abbreviate} />
      ),
    },
    {
      id: "prize_4",
      header: "4 acertos",
      cell: ({ row }) => (
        <PrizeCell prize={row.original.prize_4} winners={row.original.winners_4} showWinners={showWinners} abbreviate={abbreviate} />
      ),
    },
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick(row.original)}
              className="cursor-pointer border-t border-border transition-colors hover:bg-muted/30"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
