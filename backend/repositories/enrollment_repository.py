import uuid
from decimal import Decimal
from typing import Optional
import calendar
from datetime import date
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from models.enrollment import Enrollment
from models.financial import AccountsReceivable, Payment
from models.student import Student
from repositories.base_repository import BaseRepository


class EnrollmentRepository(BaseRepository[Enrollment]):
    def __init__(self, session: AsyncSession):
        super().__init__(Enrollment, session)

    async def get_with_plan(self, enrollment_id: uuid.UUID) -> Optional[Enrollment]:
        result = await self.session.execute(
            select(Enrollment)
            .options(selectinload(Enrollment.plan))
            .where(Enrollment.id == enrollment_id)
        )
        return result.scalar_one_or_none()

    async def list_by_student(self, student_id: uuid.UUID) -> list[Enrollment]:
        result = await self.session.execute(
            select(Enrollment)
            .options(selectinload(Enrollment.plan))
            .where(Enrollment.student_id == student_id)
            .order_by(Enrollment.start_date.desc())
        )
        return list(result.scalars().all())

    async def get_active_by_student(self, student_id: uuid.UUID) -> Optional[Enrollment]:
        result = await self.session.execute(
            select(Enrollment).where(
                and_(Enrollment.student_id == student_id, Enrollment.status == "active")
            )
        )
        return result.scalar_one_or_none()


class AccountsReceivableRepository(BaseRepository[AccountsReceivable]):
    def __init__(self, session: AsyncSession):
        super().__init__(AccountsReceivable, session)

    async def list_by_student(self, student_id: uuid.UUID) -> list[AccountsReceivable]:
        result = await self.session.execute(
            select(AccountsReceivable)
            .options(selectinload(AccountsReceivable.student))
            .where(AccountsReceivable.student_id == student_id)
            .order_by(AccountsReceivable.due_date.desc())
        )
        return list(result.scalars().all())

    async def list_pending_current_month(
        self, skip: int = 0, limit: int = 50
    ) -> tuple[list[AccountsReceivable], int]:
        """
        Retorna apenas:
        - Contas vencidas (overdue) — sempre relevantes
        - Contas pendentes com vencimento até o último dia do mês corrente
        Exclui pendências futuras que ainda não têm relevância operacional.
        """
        today = date.today()
        last_day_of_month = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])

        condition = or_(
            AccountsReceivable.status == "overdue",
            and_(
                AccountsReceivable.status == "pending",
                AccountsReceivable.due_date <= last_day_of_month,
            ),
        )

        base = (
            select(AccountsReceivable)
            .options(
                selectinload(AccountsReceivable.student),
                selectinload(AccountsReceivable.enrollment),
            )
            .where(condition)
        )
        count = (
            await self.session.execute(
                select(func.count()).select_from(AccountsReceivable).where(condition)
            )
        ).scalar_one()

        rows = (
            await self.session.execute(
                base.order_by(AccountsReceivable.due_date).offset(skip).limit(limit)
            )
        ).scalars().all()
        return list(rows), count

    async def get_delinquents(self) -> list[dict]:
        from datetime import date
        today = date.today()
        result = await self.session.execute(
            select(
                AccountsReceivable.student_id,
                Student.name.label("student_name"),
                func.sum(AccountsReceivable.amount).label("total_overdue"),
                func.min(AccountsReceivable.due_date).label("oldest_due_date"),
                func.count(AccountsReceivable.id).label("overdue_count"),
            )
            .join(Student, Student.id == AccountsReceivable.student_id)
            .where(
                AccountsReceivable.status == "pending",
                AccountsReceivable.due_date < today,
            )
            .group_by(AccountsReceivable.student_id, Student.name)
            .order_by(func.min(AccountsReceivable.due_date))
        )
        return [row._asdict() for row in result.all()]


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, session: AsyncSession):
        super().__init__(Payment, session)
