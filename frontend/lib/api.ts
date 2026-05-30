const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface DrawingSummary {
  drawing_number: number;
  draw_date: string;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
  roll_over: boolean;
  winners_6: number;
  prize_6: number;
  winners_5: number;
  prize_5: number;
  winners_4: number;
  prize_4: number;
}

export interface DrawingDetail extends DrawingSummary {
  drawing_id: number;
  next_draw_date: string | null;
  winners_5: number;
  prize_5: number;
  winners_4: number;
  prize_4: number;
  total_collected: number;
  next_accumulated: number;
  next_estimated: number;
  special_accumulated: number;
  milestone_accumulated: number;
  draw_order: string | null;
  is_special: boolean;
  milestone_draw_number: number | null;
  source_metadata: Record<string, unknown> | null;
}

export interface DrawingsPage {
  total: number;
  page: number;
  page_size: number;
  results: DrawingSummary[];
}

export type SortField =
  | "draw_date"
  | "drawing_number"
  | "draw_sum"
  | "prize_6"
  | "total_collected";

export interface DrawingFilters {
  dateFrom?: string;
  dateTo?: string;
  drawingFrom?: number;
  drawingTo?: number;
  rollOver?: boolean;
}

export async function fetchDrawings(
  page: number,
  pageSize: number,
  sort: SortField,
  order: "asc" | "desc",
  filters: DrawingFilters = {}
): Promise<DrawingsPage> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    sort,
    order,
  });

  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.drawingFrom != null) params.set("drawing_from", String(filters.drawingFrom));
  if (filters.drawingTo != null) params.set("drawing_to", String(filters.drawingTo));
  if (filters.rollOver != null) params.set("roll_over", String(filters.rollOver));

  const res = await fetch(`${API_BASE}/drawings?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchDrawing(drawingNumber: number): Promise<DrawingDetail> {
  const res = await fetch(`${API_BASE}/drawings/${drawingNumber}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
