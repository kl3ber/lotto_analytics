"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DrawingDetail, DrawingSummary, fetchDrawing } from "@/lib/api";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface Props {
  drawing: DrawingSummary | null;
  onClose: () => void;
}

export function DrawingDrawer({ drawing, onClose }: Props) {
  const [detail, setDetail] = useState<DrawingDetail | null>(null);

  useEffect(() => {
    if (!drawing) { setDetail(null); return; }
    fetchDrawing(drawing.drawing_number).then(setDetail).catch(console.error);
  }, [drawing]);

  if (!drawing) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Concurso #{drawing.drawing_number}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 px-6 py-4">
          <div className="mb-6 flex flex-wrap gap-2">
            {[drawing.n1, drawing.n2, drawing.n3, drawing.n4, drawing.n5, drawing.n6].map((n) => (
              <span
                key={n}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white"
              >
                {n}
              </span>
            ))}
          </div>

          <Row label="Data" value={drawing.draw_date} />
          <Row label="Acumulado" value={drawing.roll_over ? "Sim" : "Não"} />

          {detail && (
            <>
              <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Premiação
              </p>
              <Row
                label="6 acertos"
                value={detail.winners_6 > 0 ? `${detail.winners_6} × ${BRL.format(detail.prize_6)}` : "—"}
              />
              <Row
                label="5 acertos"
                value={detail.winners_5 > 0 ? `${detail.winners_5} × ${BRL.format(detail.prize_5)}` : "—"}
              />
              <Row
                label="4 acertos"
                value={detail.winners_4 > 0 ? `${detail.winners_4} × ${BRL.format(detail.prize_4)}` : "—"}
              />

              <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Financeiro
              </p>
              <Row label="Total arrecadado" value={BRL.format(detail.total_collected)} />
              <Row label="Acumulado próximo" value={BRL.format(detail.next_accumulated)} />
              <Row label="Estimativa próximo" value={BRL.format(detail.next_estimated)} />

              {detail.draw_order && (
                <>
                  <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Ordem do sorteio
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detail.draw_order.split(" ").map((n, i) => (
                      <span key={i} className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">{i + 1}</span>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm font-bold">
                          {n}
                        </span>
                      </span>
                    ))}
                  </div>
                </>
              )}

              {detail.is_special && (
                <p className="mt-4 rounded bg-yellow-900/30 px-3 py-2 text-sm text-yellow-300">
                  Concurso especial
                </p>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
