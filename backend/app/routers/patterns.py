from collections import Counter
from datetime import date
from math import comb
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import Drawing, get_db
from app.schemas import BucketItem, PatternStat, PatternsResponse, SimpleStat

router = APIRouter(prefix="/analytics", tags=["analytics"])

PRIMES = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59}
FIBONACCI = {1, 2, 3, 5, 8, 13, 21, 34, 55}


def _hypergeometric(population: int, successes: int, draws: int) -> list[float]:
    total_combinations = comb(population, draws)
    return [
        round(comb(successes, k) * comb(population - successes, draws - k) / total_combinations * 100, 2)
        if successes >= k and (population - successes) >= (draws - k)
        else 0.0
        for k in range(draws + 1)
    ]


def _compute_sum_expected() -> list[float]:
    max_s = 360
    dp = [[0] * (max_s + 1) for _ in range(7)]
    dp[0][0] = 1
    for num in range(1, 61):
        for count in range(min(6, num), 0, -1):
            for s in range(max_s, num - 1, -1):
                dp[count][s] += dp[count - 1][s - num]
    total = sum(dp[6])
    return [round(sum(dp[6][21 + b * 10: 31 + b * 10]) / total * 100, 2) for b in range(33)]


def _compute_amplitude_expected() -> list[float]:
    n, k, bucket_size = 60, 6, 5
    total = comb(n, k)
    min_range, max_range = k - 1, n - 1
    result = []
    for b in range((max_range - min_range) // bucket_size + 1):
        lo = min_range + b * bucket_size
        hi = min(min_range + (b + 1) * bucket_size - 1, max_range)
        count = sum((n - r) * comb(r - 1, k - 2) for r in range(lo, hi + 1))
        result.append(round(count / total * 100, 2))
    return result


# Precomputed at import time — values depend only on Mega-Sena rules, never on data
_EXP_SUM = _compute_sum_expected()
_EXP_AMPLITUDE = _compute_amplitude_expected()
_EXP_PARITY = _hypergeometric(60, 30, 6)
_EXP_LOW_HIGH = _hypergeometric(60, 30, 6)
_EXP_REPEATS = _hypergeometric(60, 6, 6)
_EXP_PRIMES = _hypergeometric(60, 17, 6)
_EXP_FIBONACCI = _hypergeometric(60, 9, 6)
_EXP_MULT3 = _hypergeometric(60, 20, 6)
_EXP_MULT5 = _hypergeometric(60, 12, 6)


def _bucket(
    counter: Counter, labels: list[str], total: int, expected_pcts: float | list[float]
) -> list[BucketItem]:
    pcts = (
        [float(expected_pcts)] * len(labels)
        if isinstance(expected_pcts, (int, float))
        else list(expected_pcts)
    )
    return [
        BucketItem(
            label=label,
            count=counter.get(i, 0),
            percentage=round(counter.get(i, 0) / total * 100, 2) if total else 0,
            expected_percentage=round(pcts[i], 2) if i < len(pcts) else 0.0,
        )
        for i, label in enumerate(labels)
    ]


def _count_in(nums: list[int], s: set[int]) -> int:
    return sum(1 for n in nums if n in s)


def _sum_parity_bucket(nums: list[int]) -> int:
    s = sum(nums)
    if not s:
        return 0
    return min(int(sum(n for n in nums if n % 2 == 0) * 100 / s) // 5, 19)


def _num_props(nums: list[int]) -> dict[str, int]:
    """Single-pass property counts to keep _tally_draw complexity low."""
    return {
        "parity": sum(1 for n in nums if n % 2 == 0),
        "low_high": sum(1 for n in nums if n <= 30),
        "primes": _count_in(nums, PRIMES),
        "fibonacci": _count_in(nums, FIBONACCI),
        "mult3": sum(1 for n in nums if n % 3 == 0),
        "mult5": sum(1 for n in nums if n % 5 == 0),
    }


def _tally_draw(
    row: Drawing,
    prev_nums: set[int],
    counters: dict[str, Counter],
    all_sums: list[int],
) -> None:
    nums = sorted([row.n1, row.n2, row.n3, row.n4, row.n5, row.n6])
    s = sum(nums)
    all_sums.append(s)
    gaps = [nums[i + 1] - nums[i] for i in range(5)]
    props = _num_props(nums)
    counters["sum"][s] += 1
    counters["sum_bucket"][(s - 21) // 10] += 1
    counters["parity"][props["parity"]] += 1
    counters["low_high"][props["low_high"]] += 1
    counters["spacing"][min(int(sum(gaps) / 5 // 2), 9)] += 1
    counters["amplitude"][(nums[-1] - nums[0] - 5) // 5] += 1
    counters["consecutives"][gaps.count(1)] += 1
    counters["repeats"][len(set(nums) & prev_nums)] += 1
    counters["primes"][props["primes"]] += 1
    counters["fibonacci"][props["fibonacci"]] += 1
    counters["mult3"][props["mult3"]] += 1
    counters["mult5"][props["mult5"]] += 1
    counters["sum_parity"][_sum_parity_bucket(nums)] += 1
    for n in nums:
        counters["digits"][n % 10] += 1
        counters["quartile"][(n - 1) // 15] += 1


@router.get("/patterns", response_model=PatternsResponse)
def get_patterns(
    db: Annotated[Session, Depends(get_db)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
):
    q = db.query(Drawing)
    if date_from:
        q = q.filter(Drawing.draw_date >= date_from)
    if date_to:
        q = q.filter(Drawing.draw_date <= date_to)

    rows = q.order_by(Drawing.drawing_number.asc()).all()
    total = len(rows)
    if total == 0:
        empty: list[BucketItem] = []
        return PatternsResponse(
            total_drawings=0,
            sum=empty,
            parity=empty,
            low_high=empty,
            spacing=empty,
            consecutives=empty,
            repeats=empty,
            primes=empty,
            digits=empty,
            sum_stat=PatternStat(mean=0, min=0, max=0, most_common=0),
        )

    counters = {
        "sum": Counter(),
        "parity": Counter(),
        "low_high": Counter(),
        "spacing": Counter(),
        "amplitude": Counter(),
        "consecutives": Counter(),
        "repeats": Counter(),
        "primes": Counter(),
        "fibonacci": Counter(),
        "mult3": Counter(),
        "mult5": Counter(),
        "quartile": Counter(),
        "sum_parity": Counter(),
        "digits": Counter(),
        "sum_bucket": Counter(),
    }
    all_sums: list[int] = []
    prev_nums: set[int] = set()

    for row in rows:
        _tally_draw(row, prev_nums, counters, all_sums)
        prev_nums = {row.n1, row.n2, row.n3, row.n4, row.n5, row.n6}

    sum_buckets = counters["sum_bucket"]

    from statistics import mode as _mode, stdev as _stdev


    sum_items = [
        BucketItem(
            label=f"{21 + i * 10}–{30 + i * 10}",
            count=sum_buckets.get(i, 0),
            percentage=round(sum_buckets.get(i, 0) / total * 100, 2),
            expected_percentage=_EXP_SUM[i],
        )
        for i in range(33)
    ]
    while sum_items and sum_items[-1].count == 0:
        sum_items.pop()
    while sum_items and sum_items[0].count == 0:
        sum_items.pop(0)

    parity_labels = [f"{i} par{'es' if i != 1 else ''}" for i in range(7)]
    low_high_labels = [f"{i} baixo{'s' if i != 1 else ''}" for i in range(7)]
    spacing_labels = [f"{i * 2}–{i * 2 + 1}" for i in range(10)]
    consec_labels = [f"{i} par{'es' if i != 1 else ''}" for i in range(6)]
    repeat_labels = [f"{i} repeat{'s' if i != 1 else ''}" for i in range(7)]

    total_digits = total * 6
    digits_items = [
        BucketItem(
            label=str(i),
            count=counters["digits"].get(i, 0),
            percentage=round(counters["digits"].get(i, 0) / total_digits * 100, 2) if total_digits else 0,
            expected_percentage=10.0,
        )
        for i in range(10)
    ]

    amplitude_labels = [f"{5 + i * 5}–{9 + i * 5}" for i in range(len(_EXP_AMPLITUDE))]

    fib_labels = [f"{i} fib{'s' if i != 1 else ''}" for i in range(7)]
    mult3_labels = [f"{i}" for i in range(7)]
    mult5_labels = [f"{i}" for i in range(7)]
    sum_parity_labels = [f"{i * 5}–{i * 5 + 4}%" for i in range(20)]
    sp_counts = counters["sum_parity"]
    sp_mean = sum((i * 5 + 2.5) * sp_counts.get(i, 0) for i in range(20)) / total if total else 0.0
    sp_std_dev = (sum((i * 5 + 2.5 - sp_mean) ** 2 * sp_counts.get(i, 0) for i in range(20)) / total) ** 0.5 if total else 0.0

    total_picks = total * 6
    quartile_items = [
        BucketItem(
            label=label,
            count=counters["quartile"].get(i, 0),
            percentage=round(counters["quartile"].get(i, 0) / total_picks * 100, 2) if total_picks else 0,
            expected_percentage=25.0,
        )
        for i, label in enumerate(["Q1 (1–15)", "Q2 (16–30)", "Q3 (31–45)", "Q4 (46–60)"])
    ]

    return PatternsResponse(
        total_drawings=total,
        sum=sum_items,
        parity=_bucket(counters["parity"], parity_labels, total, _EXP_PARITY),
        low_high=_bucket(counters["low_high"], low_high_labels, total, _EXP_LOW_HIGH),
        spacing=_bucket(counters["spacing"], spacing_labels, total, 100 / 10),
        amplitude=_bucket(counters["amplitude"], amplitude_labels, total, _EXP_AMPLITUDE),
        consecutives=_bucket(counters["consecutives"], consec_labels, total, 100 / 6),
        repeats=_bucket(counters["repeats"], repeat_labels, total, _EXP_REPEATS),
        primes=_bucket(counters["primes"], [f"{i} primo{'s' if i != 1 else ''}" for i in range(7)], total, _EXP_PRIMES),
        fibonacci=_bucket(counters["fibonacci"], fib_labels, total, _EXP_FIBONACCI),
        mult3=_bucket(counters["mult3"], mult3_labels, total, _EXP_MULT3),
        mult5=_bucket(counters["mult5"], mult5_labels, total, _EXP_MULT5),
        quartiles=quartile_items,
        sum_parity=_bucket(counters["sum_parity"], sum_parity_labels, total, 100 / 20),
        sum_parity_stat=SimpleStat(mean=round(sp_mean, 1), std_dev=round(sp_std_dev, 1)),
        digits=digits_items,
        sum_stat=PatternStat(
            mean=round(sum(all_sums) / total, 1),
            std_dev=round(_stdev(all_sums), 1) if total > 1 else 0.0,
            min=min(all_sums),
            max=max(all_sums),
            most_common=_mode(all_sums),
        ),
    )
