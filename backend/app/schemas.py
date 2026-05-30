from datetime import date
from typing import Any

from pydantic import BaseModel


class DrawingBase(BaseModel):
    drawing_number: int
    draw_date: date
    n1: int
    n2: int
    n3: int
    n4: int
    n5: int
    n6: int
    draw_sum: int
    total_prize: float
    roll_over: bool
    next_draw_date: date | None
    winners_6: int
    prize_6: float
    winners_5: int
    prize_5: float
    winners_4: int
    prize_4: float
    total_collected: float
    next_accumulated: float
    next_estimated: float
    special_accumulated: float
    milestone_accumulated: float
    draw_order: str | None
    is_special: bool
    milestone_draw_number: int | None


class DrawingSummary(BaseModel):
    drawing_number: int
    draw_date: date
    n1: int
    n2: int
    n3: int
    n4: int
    n5: int
    n6: int
    roll_over: bool
    winners_6: int
    prize_6: float
    winners_5: int
    prize_5: float
    winners_4: int
    prize_4: float

    model_config = {"from_attributes": True}


class DrawingDetail(DrawingBase):
    drawing_id: int
    source_metadata: dict[str, Any] | None

    model_config = {"from_attributes": True}


class DrawingsPage(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[DrawingSummary]
