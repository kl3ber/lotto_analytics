from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, union_all
from sqlalchemy.orm import Session

from app.database import Drawing, get_db
from itertools import combinations

from app.schemas import (
    AccumulationStats,
    BucketItem,
    CooccurrenceResponse,
    CycleRecord,
    FrequencyItem,
    FrequencyResponse,
    JackpotMilestone,
    PairItem,
    PrizePoint,
    PrizesResponse,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

COLS = [Drawing.n1, Drawing.n2, Drawing.n3, Drawing.n4, Drawing.n5, Drawing.n6]


def _count_by_number(db: Session, filters: list) -> dict[int, int]:
    parts = [
        select(col.label("n")).where(*filters).select_from(Drawing) for col in COLS
    ]
    combined = union_all(*parts).subquery("combined")
    rows = (
        db.query(combined.c.n, func.count().label("count"))
        .group_by(combined.c.n)
        .order_by(combined.c.n)
        .all()
    )
    return {row.n: row.count for row in rows}


def _drought_stats(db: Session) -> dict[int, dict]:
    """For each number: last_seen drawing_number, last_seen_date, current_drought, max_drought."""
    rows = (
        db.query(
            Drawing.drawing_number,
            Drawing.draw_date,
            Drawing.n1,
            Drawing.n2,
            Drawing.n3,
            Drawing.n4,
            Drawing.n5,
            Drawing.n6,
        )
        .order_by(Drawing.drawing_number.asc())
        .all()
    )

    appearances: dict[int, list[tuple[int, object]]] = {n: [] for n in range(1, 61)}
    for row in rows:
        for val in (row.n1, row.n2, row.n3, row.n4, row.n5, row.n6):
            appearances[val].append((row.drawing_number, row.draw_date))

    latest = rows[-1].drawing_number if rows else 0
    result = {}
    for n in range(1, 61):
        seen = appearances[n]
        if not seen:
            result[n] = {
                "last_seen": None,
                "last_seen_date": None,
                "current_drought": latest,
                "max_drought": latest,
            }
            continue
        last_seen_num, last_seen_date = seen[-1]
        current_drought = latest - last_seen_num
        draw_nums = [s[0] for s in seen]
        gaps = [draw_nums[i + 1] - draw_nums[i] for i in range(len(draw_nums) - 1)]
        max_drought = max(gaps) if gaps else current_drought
        result[n] = {
            "last_seen": last_seen_num,
            "last_seen_date": last_seen_date,
            "current_drought": current_drought,
            "max_drought": max(max_drought, current_drought),
        }
    return result


@router.get("/frequency", response_model=FrequencyResponse)
def get_frequency(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    recent: Annotated[int, Query(ge=10, le=500)] = 100,
):
    filters = []
    if date_from:
        filters.append(Drawing.draw_date >= date_from)
    if date_to:
        filters.append(Drawing.draw_date <= date_to)

    total = db.query(func.count(Drawing.drawing_id)).filter(*filters).scalar()
    global_total = db.query(func.count(Drawing.drawing_id)).scalar()

    # trend: last N global drawings vs global average — independent of date filter
    # so arrows always mean "is this number hot/cold right now vs its lifetime"
    recent_sq = (
        db.query(Drawing.drawing_number)
        .order_by(Drawing.drawing_number.desc())
        .limit(recent)
        .subquery()
    )

    all_counts = _count_by_number(db, filters)
    global_counts = _count_by_number(db, [])
    recent_counts = _count_by_number(
        db, [Drawing.drawing_number.in_(select(recent_sq))]
    )
    drought = _drought_stats(db)

    frequencies = [
        FrequencyItem(
            number=n,
            count=all_counts.get(n, 0),
            percentage=round(all_counts.get(n, 0) / total * 100, 2) if total else 0,
            recent_count=recent_counts.get(n, 0),
            recent_percentage=round(recent_counts.get(n, 0) / recent * 100, 2)
            if recent
            else 0,
            global_percentage=round(global_counts.get(n, 0) / global_total * 100, 2)
            if global_total
            else 0,
            last_seen=drought[n]["last_seen"],
            last_seen_date=drought[n]["last_seen_date"],
            current_drought=drought[n]["current_drought"],
            max_drought=drought[n]["max_drought"],
        )
        for n in range(1, 61)
    ]

    return FrequencyResponse(
        total_drawings=total, recent_window=recent, frequencies=frequencies
    )


@router.get("/cooccurrence", response_model=CooccurrenceResponse)
def get_cooccurrence(
    db: Annotated[Session, Depends(get_db)],
    top_n: Annotated[int, Query(ge=5, le=50)] = 10,
):
    rows = db.query(
        Drawing.n1, Drawing.n2, Drawing.n3, Drawing.n4, Drawing.n5, Drawing.n6
    ).all()

    total = len(rows)
    pair_counts: dict[tuple[int, int], int] = {}
    for row in rows:
        nums = sorted([row.n1, row.n2, row.n3, row.n4, row.n5, row.n6])
        for a, b in combinations(nums, 2):
            pair_counts[(a, b)] = pair_counts.get((a, b), 0) + 1

    sorted_pairs = sorted(pair_counts.items(), key=lambda x: x[1], reverse=True)

    def to_item(pair: tuple[int, int], count: int) -> PairItem:
        return PairItem(
            n1=pair[0],
            n2=pair[1],
            count=count,
            percentage=round(count / total * 100, 2) if total else 0,
        )

    top = [to_item(p, c) for p, c in sorted_pairs[:top_n]]
    bottom = [to_item(p, c) for p, c in sorted_pairs[-top_n:]]

    return CooccurrenceResponse(total_drawings=total, top=top, bottom=bottom)


def _compute_accumulation(rows: list) -> AccumulationStats:
    cycles: list[CycleRecord] = []
    cycle_start = 0

    for i, r in enumerate(rows):
        if r.winners_6 > 0:
            length = i - cycle_start + 1
            cycles.append(CycleRecord(
                length=length,
                final_prize=float(r.prize_6),
                end_drawing=r.drawing_number,
                end_date=r.draw_date,
            ))
            cycle_start = i + 1

    if not cycles:
        empty = CycleRecord(length=0, final_prize=0, end_drawing=0, end_date=rows[0].draw_date if rows else None)
        return AccumulationStats(total_cycles=0, avg_length=0, max_length=0, min_length=0, longest=empty, distribution=[])

    lengths = [c.length for c in cycles]
    max_len = max(lengths)
    from collections import Counter
    dist_counter = Counter(lengths)
    total = len(cycles)
    avg = round(sum(lengths) / total, 1)
    distribution = [
        BucketItem(
            label=str(i),
            count=dist_counter.get(i, 0),
            percentage=round(dist_counter.get(i, 0) / total * 100, 2),
            expected_percentage=0.0,
        )
        for i in range(1, max_len + 1)
        if dist_counter.get(i, 0) > 0
    ]
    longest = max(cycles, key=lambda c: c.length)

    return AccumulationStats(
        total_cycles=total,
        avg_length=avg,
        max_length=max_len,
        min_length=min(lengths),
        longest=longest,
        distribution=distribution,
    )


@router.get("/prizes", response_model=PrizesResponse)
def get_prizes(db: Annotated[Session, Depends(get_db)]):
    rows = (
        db.query(
            Drawing.drawing_number,
            Drawing.draw_date,
            Drawing.prize_6,
            Drawing.winners_6,
            Drawing.prize_5,
            Drawing.winners_5,
            Drawing.prize_4,
            Drawing.winners_4,
            Drawing.roll_over,
        )
        .order_by(Drawing.draw_date.asc())
        .all()
    )

    points = [
        PrizePoint(
            drawing_number=r.drawing_number,
            draw_date=r.draw_date,
            prize_6=float(r.prize_6),
            winners_6=r.winners_6,
            prize_5=float(r.prize_5),
            winners_5=r.winners_5,
            prize_4=float(r.prize_4),
            winners_4=r.winners_4,
            roll_over=r.roll_over,
        )
        for r in rows
    ]

    def _distributed(r) -> float:
        return r.prize_6 * r.winners_6 + r.prize_5 * r.winners_5 + r.prize_4 * r.winners_4

    milestones = [
        JackpotMilestone(
            threshold_m=m,
            count_individual=sum(1 for r in rows if r.prize_6 >= m * 1_000_000),
            count_sena_total=sum(1 for r in rows if r.prize_6 * r.winners_6 >= m * 1_000_000),
            count_distributed=sum(1 for r in rows if _distributed(r) >= m * 1_000_000),
        )
        for m in [50, 100, 200]
    ]

    record_individual = float(max((r.prize_6 for r in rows), default=0.0))
    record_sena_total = float(max((r.prize_6 * r.winners_6 for r in rows), default=0.0))
    record_distributed = float(max((_distributed(r) for r in rows), default=0.0))

    return PrizesResponse(
        points=points,
        accumulation=_compute_accumulation(rows),
        milestones=milestones,
        record_individual=record_individual,
        record_sena_total=record_sena_total,
        record_distributed=record_distributed,
    )
