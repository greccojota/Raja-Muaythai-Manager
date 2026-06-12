import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.exceptions import ConflictError, NotFoundError, ValidationError
from models.enrollment import Enrollment
from models.financial import AccountsReceivable, EmailLog
from repositories.enrollment_repository import (
    AccountsReceivableRepository,
    EnrollmentRepository,
    PaymentRepository,
)
from repositories.plan_repository import PlanRepository
from repositories.student_repository import StudentRepository
from schemas.enrollment import EnrollmentCreate
from schemas.financial import PaymentCreate
from services.business_day_service import next_due_date
from services.email_service import EmailService

CYCLE_MONTHS = {
    "monthly": 1,
    "quarterly": 3,
    "semiannual": 6,
    "annual": 12,
}


class EnrollmentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.enrollment_repo = EnrollmentRepository(session)
        self.ar_repo = AccountsReceivableRepository(session)
        self.payment_repo = PaymentRepository(session)
        self.plan_repo = PlanRepository(session)
        self.student_repo = StudentRepository(session)

    async def enroll(self, data: EnrollmentCreate) -> Enrollment:
        student = await self.student_repo.get_by_id(data.student_id)
        if not student or student.is_deleted:
            raise NotFoundError("Aluno")

        plan = await self.plan_repo.get_by_id(data.plan_id)
        if not plan or not plan.is_active:
            raise NotFoundError("Plano")

        active = await self.enrollment_repo.get_active_by_student(data.student_id)
        if active:
            raise ConflictError("Aluno ja possui matricula ativa")

        final_monthly_value = plan.monthly_value - data.discount_value
        if final_monthly_value < 0:
            raise ValidationError("Desconto nao pode ser maior que o valor do plano")
        cycle_months = CYCLE_MONTHS.get(plan.plan_type, 1)
        cycle_value = final_monthly_value * cycle_months

        first_payment_date = data.first_payment_date or data.start_date
        payment_due_date = data.next_payment_due_date or next_due_date(first_payment_date, plan.plan_type)
        end_date = payment_due_date

        enrollment = await self.enrollment_repo.create(
            student_id=data.student_id,
            plan_id=data.plan_id,
            start_date=data.start_date,
            end_date=end_date,
            status="active",
            final_monthly_value=final_monthly_value,
            discount_value=data.discount_value,
            discount_notes=data.discount_notes,
            enrollment_fee_paid=False,
            payment_method=data.payment_method,
            first_payment_date=first_payment_date,
            next_payment_due_date=payment_due_date,
            notes=data.notes,
        )

        student.status = "active"
        await self._generate_ar(enrollment, plan, payment_due_date, cycle_value, data.payment_method)

        await self.session.commit()
        enrollment = await self.enrollment_repo.get_with_plan(enrollment.id)
        try:
            EmailService().send_welcome(student, plan, enrollment)
        except Exception as exc:
            # Email must not block enrollment creation.
            import structlog
            structlog.get_logger(__name__).warning("welcome_email_failed", error=str(exc))
        return enrollment

    async def _generate_ar(self, enrollment, plan, due_date: date, plan_value, payment_method: str):
        ref_month = due_date.strftime("%Y-%m")
        await self.ar_repo.create(
            enrollment_id=enrollment.id,
            student_id=enrollment.student_id,
            description=f"Proximo vencimento - {plan.name} ({ref_month})",
            due_date=due_date,
            amount=plan_value,
            status="pending",
            reference_month=ref_month,
            expected_payment_method=payment_method,
        )

    async def get_by_id(self, enrollment_id: uuid.UUID) -> Enrollment:
        enrollment = await self.enrollment_repo.get_with_plan(enrollment_id)
        if not enrollment:
            raise NotFoundError("Matricula")
        return enrollment

    async def update(self, enrollment_id: uuid.UUID, data) -> Enrollment:
        from schemas.enrollment import EnrollmentUpdate
        enrollment = await self.enrollment_repo.get_with_plan(enrollment_id)
        if not enrollment:
            raise NotFoundError("Matricula")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(enrollment, field, value)
        await self.session.commit()
        return await self.enrollment_repo.get_with_plan(enrollment_id)

    async def list_all(
        self,
        status: str | None = None,
        student_id: uuid.UUID | None = None,
        plan_id: uuid.UUID | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Enrollment], int]:
        from sqlalchemy import func
        from sqlalchemy.orm import selectinload

        conditions = []
        if status:
            conditions.append(Enrollment.status == status)
        if student_id:
            conditions.append(Enrollment.student_id == student_id)
        if plan_id:
            conditions.append(Enrollment.plan_id == plan_id)

        base_query = select(Enrollment).where(*conditions) if conditions else select(Enrollment)

        total = (
            await self.session.execute(
                select(func.count()).select_from(base_query.subquery())
            )
        ).scalar_one()

        rows = (
            await self.session.execute(
                base_query
                .options(
                    selectinload(Enrollment.plan),
                    selectinload(Enrollment.student),
                )
                .order_by(Enrollment.created_at.desc())
                .offset((page - 1) * size)
                .limit(size)
            )
        ).scalars().all()

        return list(rows), total

    async def get_by_student(self, student_id: uuid.UUID) -> list[Enrollment]:
        return await self.enrollment_repo.list_by_student(student_id)

    async def cancel(self, enrollment_id: uuid.UUID, reason: Optional[str] = None) -> Enrollment:
        from datetime import datetime, timezone

        enrollment = await self.enrollment_repo.get_by_id(enrollment_id)
        if not enrollment:
            raise NotFoundError("Matricula")
        enrollment.status = "cancelled"
        enrollment.cancelled_at = datetime.now(timezone.utc)
        enrollment.cancelled_reason = reason
        student = await self.student_repo.get_by_id(enrollment.student_id)
        if student:
            student.status = "inactive"
        await self.session.commit()
        return enrollment

    async def expire_finished(self) -> int:
        today = date.today()
        expired_rows = (
            await self.session.execute(
                select(Enrollment)
                .options(selectinload(Enrollment.student), selectinload(Enrollment.plan))
                .where(Enrollment.status == "active", Enrollment.end_date < today)
            )
        ).scalars().all()
        for enrollment in expired_rows:
            if enrollment.student:
                enrollment.student.status = "inactive"
        result = await self.session.execute(
            update(Enrollment)
            .where(Enrollment.status == "active", Enrollment.end_date < today)
            .values(status="expired")
        )
        await self.session.commit()
        for enrollment in expired_rows:
            try:
                EmailService().send_plan_finished(enrollment.student, enrollment.plan, enrollment)
            except Exception as exc:
                import structlog
                structlog.get_logger(__name__).warning("plan_finished_email_failed", error=str(exc))
        return result.rowcount


class FinancialService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.ar_repo = AccountsReceivableRepository(session)
        self.payment_repo = PaymentRepository(session)

    async def _log_email(
        self,
        email_type: str,
        to_email: str | None,
        subject: str,
        status: str,
        student_id=None,
        enrollment_id=None,
        ar_id=None,
        error_message: str | None = None,
    ) -> None:
        self.session.add(EmailLog(
            student_id=student_id,
            enrollment_id=enrollment_id,
            accounts_receivable_id=ar_id,
            email_type=email_type,
            to_email=to_email,
            subject=subject,
            status=status,
            error_message=error_message,
            sent_at=datetime.now(timezone.utc),
        ))

    async def _send_and_log(self, email_type: str, student, ar, sender, subject: str, payment=None) -> None:
        try:
            if payment is None:
                sender(student, ar)
            else:
                sender(student, ar, payment)
            await self._log_email(email_type, student.email, subject, "sent", student.id, ar.enrollment_id, ar.id)
        except Exception as exc:
            await self._log_email(email_type, student.email, subject, "failed", student.id, ar.enrollment_id, ar.id, str(exc))

    async def register_payment(self, data: PaymentCreate, user_id: uuid.UUID) -> AccountsReceivable:
        data.validate_method()
        ar = await self.ar_repo.get_by_id(data.ar_id)
        if not ar:
            raise NotFoundError("Conta a receber")
        if ar.status == "paid":
            raise ConflictError("Esta conta ja foi paga")
        if ar.status == "cancelled":
            raise ConflictError("Esta conta esta cancelada")

        payment = await self.payment_repo.create(
            ar_id=ar.id,
            user_id=user_id,
            amount_paid=data.amount_paid,
            payment_method=data.payment_method,
            notes=data.notes,
        )
        ar.status = "paid"
        refreshed = await self.ar_repo.list_by_student(ar.student_id)
        ar_with_student = next((r for r in refreshed if r.id == ar.id), ar)
        if ar_with_student.student:
            await self._send_and_log(
                "payment_confirmation",
                ar_with_student.student,
                ar_with_student,
                EmailService().send_payment_confirmation,
                "Pagamento confirmado",
                payment,
            )
        await self.session.commit()
        return ar_with_student

    async def list_ar_by_student(self, student_id: uuid.UUID) -> list[AccountsReceivable]:
        return await self.ar_repo.list_by_student(student_id)

    async def list_pending(self, page: int = 1, size: int = 50):
        skip = (page - 1) * size
        return await self.ar_repo.list_pending_current_month(skip=skip, limit=size)

    async def get_delinquents(self) -> list[dict]:
        return await self.ar_repo.get_delinquents()

    async def mark_overdue(self) -> int:
        today = date.today()
        result = await self.session.execute(
            update(AccountsReceivable)
            .where(
                AccountsReceivable.status == "pending",
                AccountsReceivable.due_date < today,
            )
            .values(status="overdue")
        )
        await self.session.commit()
        return result.rowcount

    async def send_payment_reminders(self) -> int:
        from sqlalchemy import and_
        from sqlalchemy.orm import selectinload

        today = date.today()
        target_date = today + timedelta(days=5)
        result = await self.session.execute(
            select(AccountsReceivable)
            .options(selectinload(AccountsReceivable.student))
            .where(
                AccountsReceivable.status == "pending",
                AccountsReceivable.due_date == target_date,
                AccountsReceivable.reminder_sent_at.is_(None),
            )
        )
        rows = list(result.scalars().all())
        for ar in rows:
            if ar.student:
                await self._send_and_log(
                    "payment_reminder",
                    ar.student,
                    ar,
                    EmailService().send_payment_reminder,
                    "Lembrete de pagamento",
                )
            ar.reminder_sent_at = datetime.now(timezone.utc)
        await self.session.commit()
        return len(rows)

    async def process_overdue_notices_and_inactivation(self) -> dict:
        from sqlalchemy.orm import selectinload

        today = date.today()
        result = await self.session.execute(
            select(AccountsReceivable)
            .options(
                selectinload(AccountsReceivable.student),
                selectinload(AccountsReceivable.enrollment).selectinload(Enrollment.plan),
            )
            .where(
                AccountsReceivable.status.in_(["pending", "overdue"]),
                AccountsReceivable.due_date < today,
            )
        )
        rows = list(result.scalars().all())
        notices = 0
        inactivated = 0
        for ar in rows:
            if ar.status == "pending":
                ar.status = "overdue"
            if ar.student and ar.overdue_notice_sent_at is None:
                await self._send_and_log(
                    "payment_overdue",
                    ar.student,
                    ar,
                    EmailService().send_overdue_notice,
                    "Pagamento em atraso",
                )
                ar.overdue_notice_sent_at = datetime.now(timezone.utc)
                notices += 1
            if ar.due_date + timedelta(days=3) < today and ar.enrollment and ar.enrollment.status == "active":
                ar.enrollment.status = "cancelled"
                ar.enrollment.cancelled_at = datetime.now(timezone.utc)
                ar.enrollment.cancelled_reason = "Cancelada automaticamente por inadimplencia acima de 3 dias"
                if ar.student:
                    ar.student.status = "inactive"
                inactivated += 1
        await self.session.commit()
        return {"notices_sent": notices, "inactivated": inactivated}
