from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user, get_session
from models.enrollment import Enrollment
from models.financial import AccountsReceivable, Payment
from models.plan import Plan
from models.student import Student
from models.user import User
from services.business_day_service import add_months

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def money(value) -> str:
    if value is None:
        value = Decimal("0")
    return str(value)


def month_key(value: date) -> str:
    return value.strftime("%Y-%m")


@router.get("")
async def dashboard_summary(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    today = date.today()
    month_start = date(today.year, today.month, 1)
    next_month_start = add_months(month_start, 1)
    expiring_until = today + timedelta(days=30)

    gross_revenue_month = (
        await session.execute(
            select(func.coalesce(func.sum(Payment.amount_paid), 0)).where(
                Payment.paid_at >= month_start,
                Payment.paid_at < next_month_start,
            )
            .join(AccountsReceivable, AccountsReceivable.id == Payment.ar_id)
            .join(Student, Student.id == AccountsReceivable.student_id)
            .where(Student.deleted_at.is_(None))
        )
    ).scalar_one()

    pending_month = (
        await session.execute(
            select(func.coalesce(func.sum(AccountsReceivable.amount), 0)).where(
                AccountsReceivable.status == "pending",
                AccountsReceivable.due_date >= month_start,
                AccountsReceivable.due_date < next_month_start,
            )
            .join(Student, Student.id == AccountsReceivable.student_id)
            .where(Student.deleted_at.is_(None))
        )
    ).scalar_one()

    overdue_total = (
        await session.execute(
            select(func.coalesce(func.sum(AccountsReceivable.amount), 0)).where(
                AccountsReceivable.status.in_(["overdue", "pending"]),
                AccountsReceivable.due_date < today,
            )
            .join(Student, Student.id == AccountsReceivable.student_id)
            .where(Student.deleted_at.is_(None))
        )
    ).scalar_one()

    active_students = (
        await session.execute(
            select(func.count(Student.id)).where(Student.status == "active", Student.deleted_at.is_(None))
        )
    ).scalar_one()
    inactive_students = (
        await session.execute(
            select(func.count(Student.id)).where(Student.status.in_(["inactive", "suspended"]), Student.deleted_at.is_(None))
        )
    ).scalar_one()
    delinquent_students = (
        await session.execute(
            select(func.count(func.distinct(AccountsReceivable.student_id))).where(
                AccountsReceivable.status.in_(["overdue", "pending"]),
                AccountsReceivable.due_date < today,
            )
            .join(Student, Student.id == AccountsReceivable.student_id)
            .where(Student.deleted_at.is_(None))
        )
    ).scalar_one()

    months = [month_key(add_months(month_start, offset)) for offset in range(-5, 1)]
    revenue_by_month = {item: {"month": item, "paid": 0.0, "pending": 0.0, "overdue": 0.0} for item in months}

    paid_rows = (
        await session.execute(
            select(
                func.to_char(Payment.paid_at, "YYYY-MM").label("month"),
                func.coalesce(func.sum(Payment.amount_paid), 0).label("paid"),
            )
            .where(Payment.paid_at >= add_months(month_start, -5), Payment.paid_at < next_month_start)
            .join(AccountsReceivable, AccountsReceivable.id == Payment.ar_id)
            .join(Student, Student.id == AccountsReceivable.student_id)
            .where(Student.deleted_at.is_(None))
            .group_by("month")
        )
    ).all()
    for row in paid_rows:
        if row.month in revenue_by_month:
            revenue_by_month[row.month]["paid"] = float(row.paid)

    ar_rows = (
        await session.execute(
            select(
                func.to_char(AccountsReceivable.due_date, "YYYY-MM").label("month"),
                AccountsReceivable.status,
                func.coalesce(func.sum(AccountsReceivable.amount), 0).label("amount"),
            )
            .where(
                AccountsReceivable.due_date >= add_months(month_start, -5),
                AccountsReceivable.due_date < next_month_start,
                AccountsReceivable.status.in_(["pending", "overdue"]),
            )
            .join(Student, Student.id == AccountsReceivable.student_id)
            .where(Student.deleted_at.is_(None))
            .group_by("month", AccountsReceivable.status)
        )
    ).all()
    for row in ar_rows:
        if row.month in revenue_by_month and row.status in ("pending", "overdue"):
            revenue_by_month[row.month][row.status] = float(row.amount)

    status_rows = (
        await session.execute(
            select(Student.status, func.count(Student.id)).where(Student.deleted_at.is_(None)).group_by(Student.status)
        )
    ).all()

    modality_rows = (
        await session.execute(
            select(Student.modality, func.count(Student.id)).where(Student.deleted_at.is_(None)).group_by(Student.modality)
        )
    ).all()

    expiring_rows = (
        await session.execute(
            select(Student.id, Student.name, Plan.name, Enrollment.end_date)
            .join(Enrollment, Enrollment.student_id == Student.id)
            .join(Plan, Plan.id == Enrollment.plan_id)
            .where(
                Enrollment.status == "active",
                Enrollment.end_date >= today,
                Enrollment.end_date <= expiring_until,
            )
            .order_by(Enrollment.end_date)
            .limit(8)
        )
    ).all()

    return {
        "kpis": {
            "gross_revenue_month": money(gross_revenue_month),
            "net_revenue_month": money(gross_revenue_month),
            "pending_month": money(pending_month),
            "overdue_total": money(overdue_total),
            "active_students": active_students,
            "inactive_students": inactive_students,
            "delinquent_students": delinquent_students,
        },
        "revenue_by_month": list(revenue_by_month.values()),
        "students_by_status": [{"status": status, "total": total} for status, total in status_rows],
        "students_by_modality": [{"modality": modality, "total": total} for modality, total in modality_rows],
        "enrollments_expiring": [
            {
                "student_id": str(student_id),
                "student_name": student_name,
                "plan_name": plan_name,
                "end_date": end_date.isoformat(),
            }
            for student_id, student_name, plan_name, end_date in expiring_rows
        ],
    }
