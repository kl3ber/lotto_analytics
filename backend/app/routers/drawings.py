from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import Drawing, get_db
from app.schemas import DrawingDetail, DrawingsPage, DrawingSummary

router = APIRouter(prefix="/drawings", tags=["drawings"])

SORT_FIELDS = {
    "draw_date": Drawing.draw_date,
    "drawing_number": Drawing.drawing_number,
    "draw_sum": Drawing.draw_sum,
    "prize_6": Drawing.prize_6,
    "total_collected": Drawing.total_collected,
}


@router.get("", response_model=DrawingsPage)
def list_drawings(
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    sort: Annotated[str, Query()] = "draw_date",
    order: Annotated[str, Query(pattern="^(asc|desc)$")] = "desc",
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    drawing_from: Annotated[int | None, Query(ge=1)] = None,
    drawing_to: Annotated[int | None, Query(ge=1)] = None,
    roll_over: Annotated[bool | None, Query()] = None,
):
    if sort not in SORT_FIELDS:
        raise HTTPException(
            status_code=400, detail=f"sort must be one of: {', '.join(SORT_FIELDS)}"
        )

    q = db.query(Drawing)

    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)
    if drawing_from:
        q = q.filter(Drawing.drawing_number >= drawing_from)
    if drawing_to:
        q = q.filter(Drawing.drawing_number <= drawing_to)
    if roll_over is not None:
        q = q.filter(Drawing.roll_over == roll_over)

    col = SORT_FIELDS[sort]
    col_sorted = col.desc() if order == "desc" else col.asc()

    total = q.with_entities(func.count(Drawing.drawing_id)).scalar()
    rows = q.order_by(col_sorted).offset((page - 1) * page_size).limit(page_size).all()

    return DrawingsPage(
        total=total,
        page=page,
        page_size=page_size,
        results=[DrawingSummary.model_validate(r) for r in rows],
    )


@router.get("/{drawing_number}", response_model=DrawingDetail)
def get_drawing(drawing_number: int, db: Annotated[Session, Depends(get_db)]):
    row = db.query(Drawing).filter(Drawing.drawing_number == drawing_number).first()
    if not row:
        raise HTTPException(status_code=404, detail="Drawing not found")
    return DrawingDetail.model_validate(row)
