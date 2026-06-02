"use client";

import { useEffect, useState } from "react";
import { PrizesResponse, fetchPrizes } from "@/lib/api";
import { PrizeChart } from "@/components/prize-chart";

export default function PremiosPage() {
  const [data, setData] = useState<PrizesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrizes()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold tracking-tight">Histórico do jackpot</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {data ? `${data.points.length.toLocaleString("pt-BR")} concursos` : ""}
      </p>

      <div className="mt-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : data ? (
          <PrizeChart points={data.points} />
        ) : null}
      </div>
    </div>
  );
}
