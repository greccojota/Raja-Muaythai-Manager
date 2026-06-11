from __future__ import annotations

import calendar
import os
from datetime import date, timedelta


def add_months(value: date, months: int) -> date:
    month = value.month - 1 + months
    year = value.year + month // 12
    month = month % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def easter_date(year: int) -> date:
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return date(year, month, day)


def brazil_national_holidays(year: int) -> set[date]:
    easter = easter_date(year)
    fixed = {
        date(year, 1, 1),
        date(year, 4, 21),
        date(year, 5, 1),
        date(year, 9, 7),
        date(year, 10, 12),
        date(year, 11, 2),
        date(year, 11, 15),
        date(year, 11, 20),
        date(year, 12, 25),
    }
    movable = {
        easter - timedelta(days=48),  # Carnival Monday
        easter - timedelta(days=47),  # Carnival Tuesday
        easter - timedelta(days=2),   # Good Friday
        easter,
        easter + timedelta(days=60),  # Corpus Christi
    }
    return fixed | movable


def configured_holidays() -> set[date]:
    holidays: set[date] = set()
    raw = os.getenv("PAYMENT_EXTRA_HOLIDAYS", "")
    for item in raw.split(","):
        item = item.strip()
        if not item:
            continue
        try:
            holidays.add(date.fromisoformat(item))
        except ValueError:
            continue
    return holidays


def is_business_day(value: date) -> bool:
    if value.weekday() >= 5:
        return False
    holidays = brazil_national_holidays(value.year) | configured_holidays()
    return value not in holidays


def next_business_day(value: date) -> date:
    adjusted = value
    while not is_business_day(adjusted):
        adjusted += timedelta(days=1)
    return adjusted


def next_due_date(first_payment_date: date, plan_type: str) -> date:
    months_by_type = {
        "monthly": 1,
        "quarterly": 3,
        "semiannual": 6,
        "annual": 12,
    }
    months = months_by_type.get(plan_type, 1)
    return next_business_day(add_months(first_payment_date, months))
